import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import { MAX_ENERGY_REFILLS_PER_DAY, energyUpgradeBaseBenefit } from '@/utils/consts';
import { validateTelegramWebAppData } from '@/utils/server-checks';
import { calculateEnergyLimit, calculateMinedPoints, calculateRestoredEnergy } from '@/utils/game-mechaincs';

export async function GET(req: Request) {
  console.log("SERVER USER CALL!!!");
  const url = new URL(req.url);
  const telegramInitData = url.searchParams.get('initData');
  const referrerTelegramId = url.searchParams.get('referrer');

  if (!telegramInitData) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { validatedData, user } = validateTelegramWebAppData(telegramInitData);

  if (!validatedData) {
    return NextResponse.json({ error: 'Invalid Telegram data' }, { status: 403 });
  }

  console.log("User: ", user);

  const telegramId = user.id?.toString();

  if (!telegramId) {
    return NextResponse.json({ error: 'Invalid user data' }, { status: 400 });
  }

  try {
    // Use a transaction to ensure atomicity
    const dbUser = await prisma.$transaction(async (prisma) => {
      let user = await prisma.user.findUnique({
        where: { telegramId },
      });

      const currentTime = new Date();

      if (user) {
        // Check if it's a new day
        const lastRefillDate = new Date(user.lastEnergyRefillsTimestamp);
        const isNewDay = currentTime.getUTCDate() !== lastRefillDate.getUTCDate() ||
          currentTime.getUTCMonth() !== lastRefillDate.getUTCMonth() ||
          currentTime.getUTCFullYear() !== lastRefillDate.getUTCFullYear();
        // User exists, update points and timestamp
        const minedPoints = calculateMinedPoints(
          user.mineLevelIndex,
          user.lastPointsUpdateTimestamp.getTime(),
          currentTime.getTime()
        );

        const lastEnergy = user.energy;
        const restoredEnergy = calculateRestoredEnergy(user.multitapLevelIndex, user.lastEnergyUpdateTimestamp.getTime(), currentTime.getTime());
        const maxEnergyLimit = calculateEnergyLimit(user.energyLimitLevelIndex);

        user = await prisma.user.update({
          where: { telegramId },
          data: {
            points: { increment: minedPoints },
            pointsBalance: { increment: minedPoints },
            lastPointsUpdateTimestamp: currentTime,
            energy: Math.min(lastEnergy + restoredEnergy, maxEnergyLimit),
            energyRefillsLeft: isNewDay ? MAX_ENERGY_REFILLS_PER_DAY : user.energyRefillsLeft,
            lastEnergyUpdateTimestamp: currentTime,
            lastEnergyRefillsTimestamp: isNewDay ? currentTime : user.lastEnergyRefillsTimestamp,
          },
        });
      } else {
        // If user doesn't exist, create a new one with default values
        let referredByUser = null;
        if (referrerTelegramId) {
          referredByUser = await prisma.user.findUnique({
            where: { telegramId: referrerTelegramId },
          });
        }

        user = await prisma.user.create({
          data: {
            telegramId,
            points: 0,
            pointsBalance: 0,
            multitapLevelIndex: 0,
            energy: energyUpgradeBaseBenefit,
            energyRefillsLeft: MAX_ENERGY_REFILLS_PER_DAY,
            energyLimitLevelIndex: 0,
            mineLevelIndex: 0,
            lastPointsUpdateTimestamp: currentTime,
            lastEnergyUpdateTimestamp: currentTime,
            lastEnergyRefillsTimestamp: currentTime,
            referredBy: referredByUser ? { connect: { id: referredByUser.id } } : undefined,
            // tonWalletAddress is optional, so we don't set it here
          },
        });

        if (referredByUser) {
          await prisma.user.update({
            where: { id: referredByUser.id },
            data: {
              referrals: { connect: { id: user.id } },
            },
          });
        }
      }

      return user;
    });

    return NextResponse.json(dbUser);
  } catch (error) {
    console.error('Error fetching/creating user:', error);
    return NextResponse.json({ error: 'Failed to fetch/create user' }, { status: 500 });
  }
}