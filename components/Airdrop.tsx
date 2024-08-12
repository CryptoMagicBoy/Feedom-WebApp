'use client'

import Image from 'next/image';
import { dailyReward, friends, iceToken, telegram, tonWallet, twitter, youtube } from '@/images';

export default function Airdrop() {

    return (
        <div className="bg-black flex justify-center">
            <div className="w-full bg-black text-white h-screen font-bold flex flex-col max-w-xl">
                <div className="flex-grow mt-4 bg-[#f3ba2f] rounded-t-[48px] relative top-glow z-0">
                    <div className="absolute top-[2px] left-0 right-0 bottom-0 bg-[#1d2025] rounded-t-[46px] px-4 pt-1 pb-24 overflow-y-auto no-scrollbar">
                        <div className="relative mt-4">
                            <div className="flex justify-center mb-4">
                                <Image src={iceToken} alt="Ice Token" width={96} height={96} className="rounded-lg mr-2" />
                            </div>
                            <h1 className="text-2xl text-center mb-4">Airdrop Tasks</h1>
                            <p className="text-gray-300 text-center mb-4 font-normal">Get ready for upcoming tasks! Soon, you&apos;ll see a list of challenges below. Complete them to qualify for the Airdrop.</p>
                            <h2 className="text-base mt-8 mb-4">Tasks list</h2>
                            <div
                                className="flex justify-between items-center bg-[#319ee0] rounded-lg p-4 cursor-pointer"
                            >
                                <div className="flex items-center">
                                    <Image src={tonWallet} alt="Ton wallet" width={40} height={40} className="rounded-lg mr-2" />
                                    <div className="flex flex-col">
                                        <span className="font-medium">Connect your TON wallet</span>
                                    </div>
                                </div>
                            </div>


                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}