'use client'

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import IceCubes from '@/icons/IceCubes';
import { useGameStore } from '@/utils/game-mechaincs';
import { baseGift, bigGift } from '@/images';
import IceCube from '@/icons/IceCube';
import { formatNumber } from '@/utils/ui';
import { REFERRAL_BONUS_BASE, REFERRAL_BONUS_PREMIUM } from '@/utils/consts';
import { getUserTelegramId } from '@/utils/user';
import Copy from '@/icons/Copy';
import { useToast } from '@/contexts/ToastContext';

interface Referral {
  telegramId: string;
  points: number;
}

export default function Friends() {
  const showToast = useToast();

  const { userTelegramInitData } = useGameStore();
  const [copyButtonText, setCopyButtonText] = useState("Copy");
  const [isLoading, setIsLoading] = useState(false);
  const [buttonText, setButtonText] = useState("Invite a friend");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralCount, setReferralCount] = useState(0);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(true);

  const fetchReferrals = useCallback(async () => {
    setIsLoadingReferrals(true);
    try {
      const response = await fetch(`/api/user/referrals?initData=${encodeURIComponent(userTelegramInitData)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch referrals');
      }
      const data = await response.json();
      setReferrals(data.referrals);
      setReferralCount(data.referralCount);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      showToast('Failed to fetch referrals. Please try again later.', 'error');
    } finally {
      setIsLoadingReferrals(false);
    }
  }, [userTelegramInitData]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const handleCopyInviteLink = useCallback(() => {
    navigator.clipboard
      .writeText(process.env.NEXT_PUBLIC_BOT_USERNAME ? `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/start?startapp=kentId${getUserTelegramId(userTelegramInitData) || ""}` : "https://t.me/clicker_game_news")
      .then(() => {
        setCopyButtonText("Copied!");
        showToast("Invite link copied to clipboard!", 'success');

        setTimeout(() => {
          setCopyButtonText("Copy");
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        showToast("Failed to copy link. Please try again.", 'error');
      });
  }, [userTelegramInitData]);

  const handleInviteFriend = useCallback(() => {
    const inviteLink = process.env.NEXT_PUBLIC_BOT_USERNAME 
      ? `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/start?startapp=kentId${getUserTelegramId(userTelegramInitData) || ""}`
      : "https://t.me/clicker_game_news";

    const message = `Join me in TonIce! ${inviteLink}`;

    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      try {
        if (typeof window.Telegram.WebApp.share === 'function') {
          window.Telegram.WebApp.share(message);
        } else {
          throw new Error('share method not available');
        }
      } catch (error) {
        console.error('Error using Telegram WebApp:', error);
        // Fallback to clipboard copy
        navigator.clipboard.writeText(message)
          .then(() => showToast("Invite message copied to clipboard!", 'success'))
          .catch(() => showToast("Failed to copy invite message", 'error'));
      }
    } else {
      // Fallback for non-Telegram environments
      navigator.clipboard.writeText(message)
        .then(() => showToast("Invite message copied to clipboard!", 'success'))
        .catch(() => showToast("Failed to copy invite message", 'error'));
    }
  }, [userTelegramInitData]);

  return (
    <div className="bg-black flex justify-center">
      <div className="w-full bg-black text-white h-screen font-bold flex flex-col max-w-xl">
        <div className="flex-grow mt-4 bg-[#f3ba2f] rounded-t-[48px] relative top-glow z-0">
          <div className="absolute top-[2px] left-0 right-0 bottom-0 bg-[#1d2025] rounded-t-[46px] px-4 pt-1 pb-44 overflow-y-auto no-scrollbar">
            <div className="relative">
              <h1 className="text-2xl text-center mt-4 mb-2">Invite Friends!</h1>
              <p className="text-center text-gray-400 mb-8">You and your friend will receive bonuses</p>

              <div className="space-y-2">
                <div className="flex justify-between items-center bg-[#272a2f] rounded-lg p-4">
                  <div className="flex items-center">
                    <Image src={baseGift} alt="Gift" width={40} height={40} />
                    <div className="flex flex-col ml-2">
                      <span className="font-medium">Invite a friend</span>
                      <div className="flex items-center">
                        <IceCube className="w-6 h-6" />
                        <span className="ml-1 text-white"><span className="text-[#f3ba2f]">+{formatNumber(REFERRAL_BONUS_BASE)}</span> for you and your friend</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-[#272a2f] rounded-lg p-4">
                  <div className="flex items-center">
                    <Image src={bigGift} alt="Premium Gift" width={40} height={40} />
                    <div className="flex flex-col ml-2">
                      <span className="font-medium">Invite a friend with Telegram Premium</span>
                      <div className="flex items-center">
                        <IceCube className="w-6 h-6" />
                        <span className="ml-1 text-white"><span className="text-[#f3ba2f]">+{formatNumber(REFERRAL_BONUS_PREMIUM)}</span> for you and your friend</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Link href="#" className="block mt-4 text-center text-blue-500">
                More bonuses
              </Link>

              <div className="mt-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg">List of your friends</h2>
                  <svg
                    className="w-6 h-6 text-gray-400 cursor-pointer"
                    onClick={fetchReferrals}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="mt-4 bg-[#272a2f] rounded-lg p-4">
                  {isLoadingReferrals ? (
                    // Skeleton loading animation
                    <div className="space-y-2 animate-pulse">
                      {[...Array(3)].map((_, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                        </div>
                      ))}
                    </div>
                  ) : referrals.length > 0 ? (
                    <ul className="space-y-2">
                      {referrals.map((referral, index) => (
                        <li key={index} className="flex justify-between items-center">
                          <span>User {referral.telegramId}</span>
                          <span className="text-[#f3ba2f]">{formatNumber(referral.points)} points</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center text-gray-400">
                      You haven&apos;t invited anyone yet
                    </div>
                  )}
                </div>
              </div>

              <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 w-[calc(100%-2rem)] max-w-xl z-40 flex gap-4 px-4">
              <button
                className="flex-grow py-3 bg-blue-500 rounded-lg text-white font-bold pulse-animation"
                onClick={handleInviteFriend}
              >
                Invite friend
              </button>
              <button
                className="w-12 h-12 bg-blue-500 rounded-lg text-white font-bold flex items-center justify-center"
                onClick={handleCopyInviteLink}
              >
                {copyButtonText === "Copied!" ? "✓" : <Copy />}
              </button>
            </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}