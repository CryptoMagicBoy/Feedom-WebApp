"use client"

import IceCubes from "@/icons/IceCubes";
import Settings from "@/icons/Settings";
import Snowflake from "@/icons/Snowflake";
import { useGameStore } from "@/utils/game-mechaincs";
import { formatNumber } from "@/utils/ui";

export default function TopInfoSection() {

    const {
        userTelegramName,
        profitPerHour
      } = useGameStore();

    return (
        <div className="px-4 z-10">
                    <div className="flex items-center justify-between space-x-4 mt-4">
                        <div className="flex items-center w-1/3">
                            <div className="flex items-center space-x-2">
                                <div className="p-1 rounded-lg bg-[#1d2025]">
                                    <Snowflake size={24} className="text-[#d4d4d4]" />
                                </div>
                                <div>
                                    <p className="text-sm">{userTelegramName}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center w-2/3 border-2 border-[#43433b] rounded-full px-4 py-[2px] bg-[#43433b]/[0.6] max-w-64">
                            <div className="flex-1 text-center">
                                <p className="text-xs text-[#85827d] font-medium">Sync</p>
                                <div className="flex items-center justify-center space-x-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1"></div>
                                </div>
                            </div>
                            <div className="h-[32px] w-[2px] bg-[#43433b] mx-2"></div>
                            <div className="flex-1 text-center">
                                <p className="text-xs text-[#85827d] font-medium whitespace-nowrap overflow-hidden text-ellipsis">Ice per hour</p>
                                <div className="flex items-center justify-center space-x-1">
                                    <IceCubes size={20} />
                                    <p className="text-sm">+{formatNumber(profitPerHour)}</p>
                                </div>
                            </div>
                            <div className="h-[32px] w-[2px] bg-[#43433b] mx-2"></div>
                            <Settings className="flex-1 text-white" />
                        </div>
                    </div>
                </div>
    );
}