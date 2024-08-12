// lib/store.ts
import { lstat } from 'fs';
import { create } from 'zustand'
import { calculateUpgradeBenefit, calculateUpgradeCost } from './calculations';
import { energyUpgradeBaseBenefit, energyUpgradeBasePrice, energyUpgradeBenefitCoefficient, energyUpgradeCostCoefficient, mineUpgradeBaseBenefit, mineUpgradeBasePrice, mineUpgradeBenefitCoefficient, mineUpgradeCostCoefficient, multitapUpgradeBaseBenefit, multitapUpgradeBasePrice, multitapUpgradeBenefitCoefficient, multitapUpgradeCostCoefficient } from './consts';

export const levelNames = [
  "Ice Cube Intern",
  "Frosty Freelancer",
  "Chilly Consultant",
  "Glacial Manager",
  "Subzero Supervisor",
  "Arctic Executive",
  "Polar CEO",
  "Tundra Tycoon",
  "Iceberg Mogul",
  "Cryogenic Crypto King"
];

export const levelMinPoints = [
  0, 5000, 25000, 100000, 1000000,
  2000000, 10000000, 50000000, 100000000, 1000000000
];

export interface InitialGameState {
  userTelegramInitData: string;
  userTelegramName: string;

  lastClickTimestamp: number;
  gameLevelIndex: number;
  points: number;
  pointsBalance: number;
  unsynchronizedPoints: number;
  multitapLevelIndex: number;
  pointsPerClick: number;
  energy: number;
  maxEnergy: number;
  energyRefillsLeft: number;
  energyLimitLevelIndex: number;
  lastEnergyRefillTimestamp: number;
  mineLevelIndex: number;
  profitPerHour: number;
}

export interface GameState extends InitialGameState {

  initializeState: (initialState: Partial<GameState>) => void;

  updateLastClickTimestamp: () => void
  setPoints: (points: number) => void
  clickTriggered: () => void
  setPointsBalance: (points: number) => void
  incrementPoints: (amount: number) => void
  decrementPointsBalance: (amount: number) => void
  resetUnsynchronizedPoints: (syncedPoints: number) => void;
  setPointsPerClick: (pointsPerClick: number) => void
  upgradeMultitap: () => void
  setEnergy: (energy: number) => void
  incrementEnergy: (amount: number) => void
  refillEnergy: () => void
  upgradeEnergyLimit: () => void
  resetDailyRefills: () => void
  setMineLevelIndex: (mineLevelIndex: number) => void
  upgradeMineLevelIndex: () => void
}

export const calculateLevel = (points: number): number => {
  for (let i = levelMinPoints.length - 1; i >= 0; i--) {
    if (points >= levelMinPoints[i]) {
      return i;
    }
  }
  return 0; // Default to 0 if something goes wrong
}

export const calculateMultitapUpgradeCost = (levelIndex: number) => {
  return calculateUpgradeCost(levelIndex, multitapUpgradeBasePrice, multitapUpgradeCostCoefficient);
}

export const calculatePointsPerClick = (levelIndex: number) => {
  return calculateUpgradeBenefit(levelIndex, multitapUpgradeBaseBenefit, multitapUpgradeBenefitCoefficient);
}

export const calculateEnergyLimitUpgradeCost = (levelIndex: number) => {
  return calculateUpgradeCost(levelIndex, energyUpgradeBasePrice, energyUpgradeCostCoefficient);
}

export const calculateEnergyLimit = (levelIndex: number) => {
  return calculateUpgradeBenefit(levelIndex, energyUpgradeBaseBenefit, energyUpgradeBenefitCoefficient);
}

export const calculateMineUpgradeCost = (levelIndex: number) => {
  return calculateUpgradeCost(levelIndex, mineUpgradeBasePrice, mineUpgradeCostCoefficient);
}

export const calculateProfitPerHour = (levelIndex: number) => {
  const calculatedBenefit = calculateUpgradeBenefit(levelIndex, mineUpgradeBaseBenefit, mineUpgradeBenefitCoefficient) - mineUpgradeBaseBenefit;
  return Math.max(0, calculatedBenefit);
}

export const calculateMinedPoints = (levelIndex: number, previousTimestamp: number, newTimestamp: number): number => {
  if(previousTimestamp >= newTimestamp) return 0;
  const profitPerHour = calculateProfitPerHour(levelIndex);
  const minedPoints =  (profitPerHour / (3600000)) * (newTimestamp - previousTimestamp); 
  return minedPoints;
}

export const calculateRestoredEnergy = (multitapLevelIndex: number, previousTimestamp: number, newTimestamp: number): number => {
  const pointsPerClick = calculatePointsPerClick(multitapLevelIndex);
  const restoredEnergy = pointsPerClick * Math.floor((newTimestamp - previousTimestamp) / 1000);
  return restoredEnergy;
}


export const createGameStore = (initialState: InitialGameState) => create<GameState>((set) => ({
  ...initialState,

  initializeState: (initialState) => set((state) => ({ ...state, ...initialState })),
  updateLastClickTimestamp: () => set((state) => {
    // console.log("updateLastClickTimestamp", state.lastClickTimestamp);
    return { lastClickTimestamp: Date.now() };
  }),
  setPoints: (points) => set((state) => {
    const newLevelIndex = calculateLevel(points);
    return { points, gameLevelIndex: newLevelIndex };
  }),
  clickTriggered: () => set((state) => {
    if(state.energy - state.pointsPerClick < 0) return {};
    const newPoints = state.points + state.pointsPerClick;
    const newPointsBalance = state.pointsBalance + state.pointsPerClick;
    const newUnsynchronizedPoints = state.unsynchronizedPoints + state.pointsPerClick;
    const newEnergy = state.energy - state.pointsPerClick;
    const newLevelIndex = calculateLevel(newPoints);
    return { 
      points: newPoints, 
      pointsBalance: newPointsBalance, 
      unsynchronizedPoints: newUnsynchronizedPoints, 
      energy: newEnergy, 
      gameLevelIndex: newLevelIndex,
      lastClickTimestamp: Date.now() 
    };
  }),
  setPointsBalance: (pointsBalance) => set((state) => {
    return { pointsBalance };
  }),
  incrementPoints: (amount) => set((state) => {
    const newPoints = state.points + amount;
    const newPointsBalance = state.pointsBalance + amount;
    const newLevelIndex = calculateLevel(newPoints);
    return { points: newPoints, pointsBalance: newPointsBalance, gameLevelIndex: newLevelIndex };
  }),
  decrementPointsBalance: (amount) => set((state) => {
    const newPointsBalance = Math.max(0, state.pointsBalance - amount); // Ensure points balance don't go negative
    return { pointsBalance: newPointsBalance };
  }),
  resetUnsynchronizedPoints: (syncedPoints: number) => set((state) => ({
    unsynchronizedPoints: Math.max(0, state.unsynchronizedPoints - syncedPoints)
  })),
  setPointsPerClick: (pointsPerClick) => set({ pointsPerClick }),
  upgradeMultitap: () => set((state) => {
    const upgradeCost = calculateMultitapUpgradeCost(state.multitapLevelIndex);
    if (state.pointsBalance >= upgradeCost) {
      return {
        pointsBalance: state.pointsBalance - upgradeCost,
        pointsPerClick: calculatePointsPerClick(state.multitapLevelIndex + 1),
        multitapLevelIndex: state.multitapLevelIndex + 1
      };
    }
    return state;
  }),
  setEnergy: (energy) => set({ energy }),
  incrementEnergy: (amount) => set((state) => ({
    energy: Math.min(state.energy + amount, state.maxEnergy)
  })),
  refillEnergy: () => set((state) => {
    if (state.energyRefillsLeft > 0) {
      return {
        energy: state.maxEnergy,
        energyRefillsLeft: state.energyRefillsLeft - 1,
        lastEnergyRefillTimestamp: Date.now()
      };
    }
    return state;
  }),
  upgradeEnergyLimit: () => set((state) => {
    const upgradeCost = calculateEnergyLimitUpgradeCost(state.energyLimitLevelIndex);
    if (state.pointsBalance >= upgradeCost) {
      return {
        pointsBalance: state.pointsBalance - upgradeCost,
        maxEnergy: calculateEnergyLimit(state.energyLimitLevelIndex + 1),
        energyLimitLevelIndex: state.energyLimitLevelIndex + 1
      };
    }
    return state;
  }),

  resetDailyRefills: () => set({ energyRefillsLeft: 6 }),
  setMineLevelIndex: (mineLevelIndex) => set({ mineLevelIndex }),
  upgradeMineLevelIndex: () => set((state) => {
    const upgradeCost = calculateMineUpgradeCost(state.mineLevelIndex);
    if (state.pointsBalance >= upgradeCost) {
      return {
        pointsBalance: state.pointsBalance - upgradeCost,
        profitPerHour: calculateProfitPerHour(state.mineLevelIndex + 1),
        mineLevelIndex: state.mineLevelIndex + 1
      };
    }
    return state;
  }),
}));

export const useGameStore = createGameStore({
  userTelegramInitData: "",
  userTelegramName: "",
  lastClickTimestamp: 0,
  gameLevelIndex: 0,
  points: 10000,
  pointsBalance: 10000,
  unsynchronizedPoints: 0,
  multitapLevelIndex: 0,
  pointsPerClick: 1,
  energy: energyUpgradeBaseBenefit,
  maxEnergy: energyUpgradeBaseBenefit,
  energyRefillsLeft: 6,
  energyLimitLevelIndex: 0,
  lastEnergyRefillTimestamp: Date.now(),
  mineLevelIndex: 0,
  profitPerHour: 0,
});