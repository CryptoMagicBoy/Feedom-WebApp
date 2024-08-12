import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import { validateTelegramWebAppData } from '@/utils/server-checks';
import { calculateEnergyLimit, calculateEnergyLimitUpgradeCost, calculateMinedPoints, calculatePointsPerClick } from '@/utils/game-mechaincs';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

interface UpgradeEnergyLimitRequestBody {
    initData: string;
}

interface UpgradeResult {
    energyLimitLevelIndex: number;
    pointsBalance: number;
    points: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 100; // milliseconds

export async function POST(req: Request) {
    const requestBody: UpgradeEnergyLimitRequestBody = await req.json();
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
            const result = await prisma.$transaction<UpgradeResult | null>(async (prisma) => {
                const dbUser = await prisma.user.findUnique({
                    where: { telegramId },
                });

                if (!dbUser) {
                    throw new Error('User not found');
                }

                const currentTime = Date.now();

                // Calculate mined points since last update
                const minedPoints = calculateMinedPoints(
                    dbUser.mineLevelIndex,
                    dbUser.lastPointsUpdateTimestamp.getTime(),
                    currentTime
                );

                // Calculate upgrade cost
                const upgradeCost = calculateEnergyLimitUpgradeCost(dbUser.energyLimitLevelIndex);

                // Check if user has enough points for the upgrade
                const updatedPointsBalance = dbUser.pointsBalance + minedPoints;
                if (updatedPointsBalance < upgradeCost) {
                    throw new Error('Insufficient points for upgrade');
                }

                // Perform the upgrade
                const newEnergyLimitLevelIndex = dbUser.energyLimitLevelIndex + 1;

                // Update user data
                const updatedUser = await prisma.user.update({
                    where: {
                        telegramId,
                        lastPointsUpdateTimestamp: dbUser.lastPointsUpdateTimestamp, // Optimistic lock
                    },
                    data: {
                        points: { increment: minedPoints },
                        pointsBalance: updatedPointsBalance - upgradeCost,
                        energyLimitLevelIndex: newEnergyLimitLevelIndex,
                        lastPointsUpdateTimestamp: new Date(currentTime),
                    },
                });

                // If update returns null (user not found due to optimistic lock), return null
                if (!updatedUser) {
                    return null;
                }

                return {
                    energyLimitLevelIndex: updatedUser.energyLimitLevelIndex,
                    pointsBalance: updatedUser.pointsBalance,
                    points: updatedUser.points,
                };
            });

            if (result === null) {
                // User not found during update, possibly due to concurrent modification
                retries++;
                if (retries >= MAX_RETRIES) {
                    console.error('Max retries reached for user:', telegramId);
                    return NextResponse.json({ error: 'Failed to update user data after multiple attempts' }, { status: 500 });
                }
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retries))); // Exponential backoff
                continue; // Try again
            }

            const newEnergyLimit = calculateEnergyLimit(result.energyLimitLevelIndex);

            return NextResponse.json({
                success: true,
                newEnergyLimitLevelIndex: result.energyLimitLevelIndex,
                newPointsBalance: result.pointsBalance,
                newPoints: result.points,
                newEnergyLimit,
            });

        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError && error.code === 'P2034') {
                // Optimistic locking failed, retry
                retries++;
                if (retries >= MAX_RETRIES) {
                    console.error('Max retries reached for user:', telegramId);
                    return NextResponse.json({ error: 'Failed to update user data after multiple attempts' }, { status: 500 });
                }
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retries))); // Exponential backoff
            } else {
                console.error('Error upgrading energy limit:', error);
                return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to upgrade energy limit' }, { status: 500 });
            }
        }
    }

    return NextResponse.json({ error: 'Failed to upgrade energy limit after max retries' }, { status: 500 });
}