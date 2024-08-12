import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import { validateTelegramWebAppData } from '@/utils/server-checks';
import { calculateRestoredEnergy, calculatePointsPerClick, calculateEnergyLimit, calculateMinedPoints } from '@/utils/game-mechaincs';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

interface SyncRequestBody {
  initData: string;
  unsynchronizedPoints: number;
  currentEnergy: number;
  syncTimestamp: number;
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 100; // milliseconds

export async function POST(req: Request) {
  try {
    const requestBody: SyncRequestBody = await req.json();
    const { initData: telegramInitData, unsynchronizedPoints, currentEnergy, syncTimestamp } = requestBody;

    console.log("Received data:", { telegramInitData, unsynchronizedPoints, currentEnergy, syncTimestamp });

    if (!telegramInitData) {
      return NextResponse.json({ error: 'Invalid request: missing telegramInitData' }, { status: 400 });
    }

    const { validatedData, user } = validateTelegramWebAppData(telegramInitData);

    if (!validatedData) {
      return NextResponse.json({ error: 'Invalid Telegram data' }, { status: 403 });
    }

    const telegramId = user.id?.toString();

    if (!telegramId) {
      return NextResponse.json({ error: 'Invalid user data: missing telegramId' }, { status: 400 });
    }

    if (typeof unsynchronizedPoints !== 'number' || typeof currentEnergy !== 'number' || 
        unsynchronizedPoints < 0 || currentEnergy < 0) {
      console.error('Invalid input data:', { unsynchronizedPoints, currentEnergy });
      throw new ValidationError(`Invalid input data: unsynchronizedPoints=${unsynchronizedPoints}, currentEnergy=${currentEnergy}`);
    }

    if (typeof syncTimestamp !== 'number' || syncTimestamp > Date.now()) {
      throw new ValidationError(`Invalid syncTimestamp: ${syncTimestamp}`);
    }

    let retries = 0;
    while (retries < MAX_RETRIES) {
      try {
        const result = await prisma.$transaction(async (prisma) => {
          const dbUser = await prisma.user.findUnique({
            where: { telegramId },
          });

          if (!dbUser) {
            throw new ValidationError('User not found');
          }

          if (syncTimestamp <= dbUser.lastPointsUpdateTimestamp.getTime()) {
            throw new ValidationError('Sync timestamp is older than or equal to the last update timestamp');
          }

          const maxEnergy = calculateEnergyLimit(dbUser.energyLimitLevelIndex);

          // Calculate restored energy
          const restoredEnergy = calculateRestoredEnergy(dbUser.multitapLevelIndex, dbUser.lastEnergyUpdateTimestamp.getTime(), syncTimestamp);
          const expectedEnergy = Math.min(dbUser.energy + restoredEnergy, maxEnergy);

          const pointsPerClick = calculatePointsPerClick(dbUser.multitapLevelIndex);

          // Calculate maximum possible points gained
          const maxPossibleClicks = Math.floor((expectedEnergy - currentEnergy) / pointsPerClick);
          const maxPossiblePoints = (maxPossibleClicks * pointsPerClick) * 1.2; // 20% buffer for network latency

          // Validate the unsynchronized points
          if (unsynchronizedPoints > maxPossiblePoints) {
            throw new ValidationError(`Invalid points calculation: unsynchronized=${unsynchronizedPoints}, max possible=${maxPossiblePoints}`);
          }

          const minedPoints = calculateMinedPoints(
            dbUser.mineLevelIndex,
            dbUser.lastPointsUpdateTimestamp.getTime(),
            syncTimestamp
          );

          // Update user data with optimistic locking
          const updatedUser = await prisma.user.update({
            where: { 
              telegramId,
              lastPointsUpdateTimestamp: dbUser.lastPointsUpdateTimestamp, // Optimistic lock
            },
            data: {
              points: { increment: (unsynchronizedPoints + minedPoints) },
              pointsBalance: { increment: (unsynchronizedPoints + minedPoints) },
              energy: currentEnergy,
              lastPointsUpdateTimestamp: new Date(syncTimestamp),
              lastEnergyUpdateTimestamp: new Date(syncTimestamp),
            },
          });

          return {
            success: true,
            message: 'Sync successful',
            updatedPoints: updatedUser.points,
            updatedPointsBalance: updatedUser.pointsBalance,
            updatedEnergy: updatedUser.energy,
          };
        });

        return NextResponse.json(result);
      } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2034') {
          // Optimistic locking failed, retry
          retries++;
          if (retries >= MAX_RETRIES) {
            throw new Error('Max retries reached for optimistic locking');
          }
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retries))); // Exponential backoff
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error('Error processing user data:', error);
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ 
      error: 'Failed to process user data: ' + (error instanceof Error ? error.message : String(error)) 
    }, { status: 500 });
  }
}