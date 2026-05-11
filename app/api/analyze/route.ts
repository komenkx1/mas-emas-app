import { NextResponse } from "next/server";
import type { ApiError, AnalysisResult, UserGoal } from "@/lib/types";
import { getGoldData } from "@/lib/goldapi";
import { generateAnalysis } from "@/lib/gemini";
import {
  calculateGoalProgress,
  generateDeadlineLabel,
  usdOzToIdrGram,
} from "@/lib/calculations";

export const runtime = "nodejs";

function isValidGoalName(value: unknown): value is UserGoal["goalName"] {
  return (
    value === "nikah" ||
    value === "rumah" ||
    value === "pendidikan" ||
    value === "darurat" ||
    value === "lainnya"
  );
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value) && Number.isFinite(value);
}

function isValidDeadline(value: unknown): value is string {
  if (!isString(value)) return false;
  const regex = /^\d{4}-(0[1-9]|1[0-2])$/;
  return regex.test(value);
}

function validateRequest(body: unknown): { valid: true; goal: UserGoal } | { valid: false; error: string } {
  if (body === null || typeof body !== "object") {
    return { valid: false, error: "Body request harus berupa object JSON." };
  }

  const req = body as Record<string, unknown>;
  const goalObj = req.goal;

  if (goalObj === null || typeof goalObj !== "object") {
    return { valid: false, error: "Field 'goal' wajib diisi dan berupa object." };
  }

  const g = goalObj as Record<string, unknown>;

  if (!isValidGoalName(g.goalName)) {
    return {
      valid: false,
      error: "Field 'goal.goalName' harus salah satu dari: nikah, rumah, pendidikan, darurat, lainnya.",
    };
  }

  if (!isValidNumber(g.targetGrams) || g.targetGrams <= 0) {
    return {
      valid: false,
      error: "Field 'goal.targetGrams' wajib diisi berupa angka positif.",
    };
  }

  if (!isValidNumber(g.currentGrams) || g.currentGrams < 0) {
    return {
      valid: false,
      error: "Field 'goal.currentGrams' wajib diisi berupa angka non-negatif.",
    };
  }

  if (!isValidNumber(g.monthlyBudget) || g.monthlyBudget < 0) {
    return {
      valid: false,
      error: "Field 'goal.monthlyBudget' wajib diisi berupa angka non-negatif.",
    };
  }

  if (!isValidDeadline(g.deadline)) {
    return {
      valid: false,
      error: "Field 'goal.deadline' wajib format YYYY-MM (contoh: 2026-12).",
    };
  }

  const goal: UserGoal = {
    goalName: g.goalName,
    targetGrams: g.targetGrams,
    currentGrams: g.currentGrams,
    monthlyBudget: g.monthlyBudget,
    deadline: g.deadline,
    deadlineLabel:
      isString(g.deadlineLabel) && g.deadlineLabel.trim().length > 0
        ? g.deadlineLabel
        : generateDeadlineLabel(g.deadline),
  };

  return { valid: true, goal };
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    const err: ApiError = {
      error: "BAD_REQUEST",
      message: "Body request tidak valid. Pastikan mengirim JSON yang benar.",
    };
    return NextResponse.json(err, { status: 400 });
  }

  const validation = validateRequest(body);
  if (!validation.valid) {
    const err: ApiError = {
      error: "BAD_REQUEST",
      message: validation.error,
    };
    return NextResponse.json(err, { status: 400 });
  }

  const { goal } = validation;

  try {
    // Ambil data emas (fallback ke mock otomatis jika API gagal)
    const goldData = await getGoldData();

    // Parse USD_TO_IDR dengan fallback 16500
    const rawUsdToIdr = Number(process.env.USD_TO_IDR);
    const usdToIdr = isValidNumber(rawUsdToIdr) && rawUsdToIdr > 0 ? rawUsdToIdr : 16500;

    const currentPriceIdrPerGram = usdOzToIdrGram(goldData.currentPrice, usdToIdr);

    const progress = calculateGoalProgress(goal, currentPriceIdrPerGram);

    // Generate analisis AI (fallback template otomatis jika Gemini gagal)
    const geminiResult = await generateAnalysis(goal, goldData, progress, usdToIdr);

    const result: AnalysisResult = {
      goldData,
      progress,
      aiResponse: geminiResult.text,
      recommendation: geminiResult.recommendation,
      currentPriceIdrPerGram,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("Unexpected error in /api/analyze:", err);
    const errBody: ApiError = {
      error: "INTERNAL_SERVER_ERROR",
      message: "Terjadi kesalahan tak terduga di server. Silakan coba lagi nanti.",
    };
    return NextResponse.json(errBody, { status: 500 });
  }
}
