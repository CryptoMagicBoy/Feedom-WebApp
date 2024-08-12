import { dailyReward, friends, telegram, twitter, youtube } from "@/images";

export const MAX_ENERGY_REFILLS_PER_DAY = 6;
export const ENERGY_REFILL_COOLDOWN = 60 * 60 * 1000; // 1 hour in milliseconds
export const TASK_WAIT_TIME = 60 * 60 * 1000; // 1 hour in milliseconds

export const REFERRAL_BONUS_BASE = 5000;
export const REFERRAL_BONUS_PREMIUM = 25000;


// Multitap
export const multitapUpgradeBasePrice = 1000;
export const multitapUpgradeCostCoefficient = 2;

export const multitapUpgradeBaseBenefit = 1;
export const multitapUpgradeBenefitCoefficient = 1;

// Energy
export const energyUpgradeBasePrice = 1000;
export const energyUpgradeCostCoefficient = 2;

export const energyUpgradeBaseBenefit = 500;
export const energyUpgradeBenefitCoefficient = 1;

// Mine (profit per hour)
export const mineUpgradeBasePrice = 1000;
export const mineUpgradeCostCoefficient = 1.5;

export const mineUpgradeBaseBenefit = 100;
export const mineUpgradeBenefitCoefficient = 1.2;






export const earnData = [
  {
    category: "Ice Youtube",
    tasks: [
      {
        title: "Create Jetton (Token) on TON",
        points: 5000,
        image: "youtube",
        description: "In this video, you'll learn how to create a Jetton on the TON Blockchain using a ready-to-use project on GitHub.",
        callToAction: "Watch video",
        type: "VISIT",
        taskData: {
          link: "https://youtube.com/watch?v=example1",
          timeToWait: TASK_WAIT_TIME 
        },
        isActive: true  
      },
      {
        title: "How to Make a Notcoin Clone",
        points: 5000,
        image: "youtube",
        description: "In this video, you'll be guided through the process of creating a clone of the famous Notcoin app.",
        callToAction: "Watch video",
        type: "VISIT",
        taskData: {
          link: "https://youtube.com/watch?v=example2",
          timeToWait: TASK_WAIT_TIME 
        },
        isActive: true  
      },
    ]
  },
  {
    category: "Tasks list",
    tasks: [
      {
        title: "Join Nikandr's TG channel",
        points: 5000,
        image: "telegram",
        description: "Stay updated with the latest news and announcements by joining our Telegram channel.",
        callToAction: "Join channel",
        type: "TELEGRAM",
        taskData: {
          telegramId: "example_channel"
        },
        isActive: true  
      },
      {
        title: "Follow Nikandr's X",
        points: 5000,
        image: "twitter",
        description: "Follow us on X (formerly Twitter) for real-time updates and community engagement.",
        callToAction: "Follow on X",
        type: "VISIT",
        taskData: {
          link: "https://twitter.com/example_account",
          timeToWait: TASK_WAIT_TIME 
        },
        isActive: true  
      },
      {
        title: "Invite 3 friends",
        points: 25000,
        image: "friends",
        description: "Invite your friends to join the Ice community and earn bonus points for each successful referral.",
        callToAction: "Invite friends",
        type: "REFERRAL",
        taskData: {
          friendsNumber: 3
        },
        isActive: true  
      }
    ]
  },
];