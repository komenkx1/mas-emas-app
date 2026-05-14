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
  price: number; // IDR per gram
}

export interface GoldData {
  currentPrice: number; // IDR per gram
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
  source: string; // e.g., "logammulia", "mock"
  buybackPrice: number; // IDR per gram
  spread: number; // sellPrice - buybackPrice
  spreadPercent: number;
}

export interface DipAlert {
  isDip: boolean;
  dipPercent: number;
  message: string;
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
  currentPriceIdrPerGram: number;
  timestamp: string;
  dipAlert?: DipAlert;
}

export interface ApiRequest {
  goal: UserGoal;
}

export interface ApiError {
  error: string;
  message: string;
}
