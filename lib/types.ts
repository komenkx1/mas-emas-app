export type GoalName = "nikah" | "rumah" | "pendidikan" | "darurat" | "lainnya";

export interface UserGoal {
  goalName: GoalName;
  targetGrams: number;
  currentGrams: number;
  monthlyBudget: number;
  deadline: string; // "YYYY-MM"
  deadlineLabel?: string; // optional, boleh dihasilkan server
}

export interface HistoricalPrice {
  date: string;
  price: number;
}

export interface GoldData {
  currentPrice: number;
  price7dAgo: number;
  price30dAgo: number;
  high30d: number;
  low30d: number;
  averageShort: number;
  averageLong: number;
  sma7: number;
  sma30: number;
  priceZone: "low" | "mid" | "high";
  trend: "up" | "down" | "sideways";
  changePercent7d: number;
  changePercent30d: number;
  historicalPrices: HistoricalPrice[];
  timestamp: string;
  source: "live" | "mock";
}

export interface GoalProgress {
  monthsLeft: number;
  gramsNeeded: number;
  gramsPerMonth: number;
  budgetCanBuy: number;
  isOnTrack: boolean;
  shortfallPerMonth: number;
  estimatedAchieveDate: string;
}

export interface AnalysisResult {
  goldData: GoldData;
  progress: GoalProgress;
  aiResponse: string;
  recommendation: "BUY" | "HOLD" | "SELL";
  timestamp: string;
}

export interface ApiRequest {
  goal: UserGoal;
}

export interface ApiError {
  error: string;
  message: string;
}
