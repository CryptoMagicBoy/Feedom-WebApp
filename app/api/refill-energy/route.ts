import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import { validateTelegramWebAppData } from '@/utils/server-checks';
import { calculateEnergyLimit } from '@/utils/game-mechaincs';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ENERGY_REFILL_COOLDOWN, MAX_ENERGY_REFILLS_PER_DAY } from '@/utils/consts';

interface RefillEnergyRequestBody {
    initData: string;
}

interface RefillResult {
    energy: number;
    energyRefillsLeft: number;
    lastEnergyRefillsTimestamp: Date;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 100; // milliseconds

export async function POST(req: Request) {
    const requestBody: RefillEnergyRequestBody = await req.json();
    const { initData: telegramInitData } = requestBody;

    if (!telegramInitData) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { validatedData, user } = validateTelegramWebAppData(telegramInitData);

    if (!validatedData) {
        return NextResponse.json({ error: 'Invalid Telegram data' }, { status: 403 });
    }

    const telegramId = user.id?.toString();

    if (!telegramId) {
        return NextResponse.json({ error: 'Invalid user data' }, { status: 400 });
    }

    let retries = 0;
    while (retries < MAX_RETRIES) {
        try {
            const result = await prisma.$transaction<RefillResult | null>(async (prisma) => {
                const dbUser = await prisma.user.findUnique({
                    where: { telegramId },
                });

                if (!dbUser) {
                    throw new Error('User not found');
                }

                const currentTime = new Date();
                const lastRefillTime = new Date(dbUser.lastEnergyRefillsTimestamp);
                const timeSinceLastRefill = currentTime.getTime() - lastRefillTime.getTime();

                // Check if it's a new day (UTC) and reset refills if necessary
                const isNewDay = currentTime.getUTCDate() !== lastRefillTime.getUTCDate() ||
                    currentTime.getUTCMonth() !== lastRefillTime.getUTCMonth() ||
                    currentTime.getUTCFullYear() !== lastRefillTime.getUTCFullYear();

                if (isNewDay) {
                    dbUser.energyRefillsLeft = MAX_ENERGY_REFILLS_PER_DAY;
                }

                // Check if user can refill
                if (dbUser.energyRefillsLeft <= 0) {
                    throw new Error('No refills left for today');
                }

                if (timeSinceLastRefill < ENERGY_REFILL_COOLDOWN) {
                    throw new Error('Refill is still on cooldown');
                }

                const maxEnergy = calculateEnergyLimit(dbUser.energyLimitLevelIndex);

                // Perform the refill
                const updatedUser = await prisma.user.update({
                    where: {
                        telegramId,
                        lastEnergyRefillsTimestamp: dbUser.lastEnergyRefillsTimestamp, // Optimistic lock
                    },
                    data: {
                        energy: maxEnergy,
                        energyRefillsLeft: { decrement: 1 },
                        lastEnergyRefillsTimestamp: currentTime,
                    },
                });

                if (!updatedUser) {
                    return null;
                }

                return {
                    energy: updatedUser.energy,
                    energyRefillsLeft: updatedUser.energyRefillsLeft,
                    lastEnergyRefillsTimestamp: updatedUser.lastEnergyRefillsTimestamp,
                };
            });

            if (result === null) {
                retries++;
                if (retries >= MAX_RETRIES) {
                    console.error('Max retries reached for user:', telegramId);
                    return NextResponse.json({ error: 'Failed to refill energy after multiple attempts' }, { status: 500 });
                }
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retries)));
                continue;
            }

            return NextResponse.json({
                success: true,
                newEnergy: result.energy,
                energyRefillsLeft: result.energyRefillsLeft,
                lastEnergyRefillsTimestamp: result.lastEnergyRefillsTimestamp,
            });

        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError && error.code === 'P2034') {
                retries++;
                if (retries >= MAX_RETRIES) {
                    console.error('Max retries reached for user:', telegramId);
                    return NextResponse.json({ error: 'Failed to refill energy after multiple attempts' }, { status: 500 });
                }
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retries)));
            } else {
                console.error('Error refilling energy:', error);
                return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to refill energy' }, { status: 400 });
            }
        }
    }

    return NextResponse.json({ error: 'Failed to refill energy after max retries' }, { status: 500 });
}