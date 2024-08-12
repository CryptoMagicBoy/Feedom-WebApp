'use client'

import { useState } from 'react';
import IceCubes from '@/icons/IceCubes';
import { calculateMineUpgradeCost, calculateProfitPerHour, useGameStore } from '@/utils/game-mechaincs';
import Snowflake from '@/icons/Snowflake';
import TopInfoSection from '@/components/TopInfoSection';
import { mineUpgradeBaseBenefit, mineUpgradeBasePrice, mineUpgradeBenefitCoefficient, mineUpgradeCostCoefficient } from '@/utils/consts';
import { formatNumber } from '@/utils/ui';
import { useToast } from '@/contexts/ToastContext';

export default function Mine() {
    const showToast = useToast();

    const {
        userTelegramInitData,
        pointsBalance,
        profitPerHour,
        mineLevelIndex,
        upgradeMineLevelIndex
    } = useGameStore();
    const [isLoading, setIsLoading] = useState(false);

    const upgradeCost = calculateMineUpgradeCost(mineLevelIndex);
    const upgradeIncrease = calculateProfitPerHour(mineLevelIndex + 1) - calculateProfitPerHour(mineLevelIndex);

    const handleUpgrade = async () => {
        if (pointsBalance >= upgradeCost && !isLoading) {
            setIsLoading(true);
            try {
                const response = await fetch('/api/upgrade/mine', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        initData: userTelegramInitData,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to upgrade mine');
                }

                const result = await response.json();

                console.log("Result from server:", result);

                // Update local state with the new values
                upgradeMineLevelIndex();

                showToast('Mine Upgrade Successful!', 'success');
            } catch (error) {
                console.error('Error upgrading mine:', error);
                showToast('Failed to upgrade mine. Please try again.', 'error');
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="bg-black flex justify-center">
            <div className="w-full bg-black text-white h-screen font-bold flex flex-col max-w-xl">
                <TopInfoSection />

                <div className="flex-grow mt-4 bg-[#f3ba2f] rounded-t-[48px] relative top-glow z-0">
                    <div className="absolute top-[2px] left-0 right-0 bottom-0 bg-[#1d2025] rounded-t-[46px] px-4 pt-1 pb-24 overflow-y-auto no-scrollbar">
                        <h1 className="text-2xl text-center mt-4">Upgrade Ice Production</h1>

                        <div className="px-4 mt-4 flex justify-center">
                            <div className="px-4 py-2 flex items-center space-x-2">
                                <IceCubes className="w-12 h-12 mx-auto" />
                                <p className="text-4xl text-white" suppressHydrationWarning >{pointsBalance.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="bg-[#272a2f] rounded-lg p-4 mt-6">
                            <div className="flex justify-between items-center mb-4">
                                <p>Current ice per hour:</p>
                                <p className="text-[#f3ba2f]">{formatNumber(profitPerHour)}</p>
                            </div>
                            <div className="flex justify-between items-center mb-4">
                                <p>Upgrade cost:</p>
                                <p className="text-[#f3ba2f]">{formatNumber(upgradeCost)}</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <p>Ice per hour increase:</p>
                                <p className="text-[#f3ba2f]">+{formatNumber(upgradeIncrease)}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleUpgrade}
                            disabled={pointsBalance < upgradeCost || isLoading}
                            className={`w-full mt-6 py-3 rounded-lg text-center text-white font-bold ${pointsBalance >= upgradeCost && !isLoading ? 'bg-[#f3ba2f]' : 'bg-gray-500 cursor-not-allowed'
                                } relative`}
                        >
                            {isLoading ? (
                                <div className="flex justify-center items-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                </div>
                            ) : (
                                'Upgrade'
                            )}
                        </button>

                    </div>
                </div>
            </div>
        </div>
    );
}