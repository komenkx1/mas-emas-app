import type { UserGoal, GoalProgress } from "./types";

const INDONESIAN_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value) && Number.isFinite(value);
}

function safeDivide(numerator: number, denominator: number): number {
  if (!isValidNumber(numerator) || !isValidNumber(denominator)) return 0;
  if (denominator === 0) return 0;
  return numerator / denominator;
}

export function generateDeadlineLabel(deadline: string): string {
  const parts = deadline.split("-");
  if (parts.length !== 2) return deadline;

  const year = Number(parts[0]);
  const monthIndex = Number(parts[1]) - 1;

  if (
    !isValidNumber(year) ||
    !isValidNumber(monthIndex) ||
    monthIndex < 0 ||
    monthIndex > 11
  ) {
    return deadline;
  }

  const monthName = INDONESIAN_MONTHS[monthIndex] ?? parts[1];
  return `${monthName} ${year}`;
}

export function parseDeadlineMonthsLeft(deadline: string): number {
  const parts = deadline.split("-");
  if (parts.length !== 2) return 0;

  const targetYear = Number(parts[0]);
  const targetMonth = Number(parts[1]);

  if (!isValidNumber(targetYear) || !isValidNumber(targetMonth)) return 0;
  if (targetMonth < 1 || targetMonth > 12) return 0;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  const monthsLeft = (targetYear - currentYear) * 12 + (targetMonth - currentMonth);
  return monthsLeft > 0 ? monthsLeft : 0;
}

export function calculateGoalProgress(
  goal: UserGoal,
  currentGoldPricePerGram: number
): GoalProgress {
  const targetGrams = isValidNumber(goal.targetGrams) ? goal.targetGrams : 0;
  const currentGrams = isValidNumber(goal.currentGrams) ? goal.currentGrams : 0;
  const monthlyBudget = isValidNumber(goal.monthlyBudget) ? goal.monthlyBudget : 0;

  const monthsLeft = parseDeadlineMonthsLeft(goal.deadline);
  const gramsNeeded = Math.max(0, targetGrams - currentGrams);

  const gramsPerMonth = monthsLeft > 0 ? safeDivide(gramsNeeded, monthsLeft) : 0;
  const budgetCanBuy =
    currentGoldPricePerGram > 0
      ? safeDivide(monthlyBudget, currentGoldPricePerGram)
      : 0;

  const shortfallPerMonth =
    monthsLeft > 0 ? Math.max(0, gramsPerMonth - budgetCanBuy) : 0;

  const isOnTrack =
    monthsLeft > 0 && budgetCanBuy >= gramsPerMonth && gramsNeeded > 0;

  const estimatedAchieveDate = (() => {
    if (budgetCanBuy <= 0) return "Tidak dapat diestimasi";
    const monthsRequired = safeDivide(gramsNeeded, budgetCanBuy);
    if (monthsRequired <= 0) return "Tidak dapat diestimasi";

    const now = new Date();
    const estDate = new Date(
      now.getFullYear(),
      now.getMonth() + Math.ceil(monthsRequired),
      1
    );
    const estYear = estDate.getFullYear();
    const estMonth = estDate.getMonth() + 1;
    const monthName = INDONESIAN_MONTHS[estMonth - 1] ?? String(estMonth);
    return `${monthName} ${estYear}`;
  })();

  return {
    monthsLeft,
    gramsNeeded,
    gramsPerMonth,
    budgetCanBuy,
    isOnTrack,
    shortfallPerMonth,
    estimatedAchieveDate,
  };
}

export function usdOzToIdrGram(usdPerOz: number, usdToIdr: number): number {
  if (!isValidNumber(usdPerOz) || !isValidNumber(usdToIdr)) return 0;
  const gramsPerOz = 31.1035;
  const idrPerGram = (usdPerOz / gramsPerOz) * usdToIdr;
  return Math.round(idrPerGram / 1000) * 1000;
}
