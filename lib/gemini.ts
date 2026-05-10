import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import type { UserGoal, GoldData, GoalProgress } from "./types";

const DEFAULT_MODEL = "gemini-1.5-flash";

export type Recommendation = "BUY" | "HOLD" | "SELL";

export interface GeminiResult {
  text: string;
  recommendation: Recommendation;
}

function getModelName(): string {
  return process.env.AI_MODEL?.trim() || DEFAULT_MODEL;
}

function getApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY;
}

function buildSystemPrompt(
  goal: UserGoal,
  goldData: GoldData,
  progress: GoalProgress,
  usdToIdr: number
): string {
  const priceIdrPerGram = Math.round(
    ((goldData.currentPrice / 31.1035) * usdToIdr) / 1000
  ) * 1000;

  return `Kamu adalah Mas Emas, penasihat investasi emas pribadi yang ramah dan berpengetahuan. Gunakan bahasa Indonesia yang santai tapi profesional.

Data pasar emas:
- Harga emas saat ini: $${goldData.currentPrice.toLocaleString("id-ID")} USD/oz
- Setara: Rp${priceIdrPerGram.toLocaleString("id-ID")}/gram (kurs USD/IDR ${usdToIdr.toLocaleString("id-ID")})
- Perubahan 7 hari: ${goldData.changePercent7d.toFixed(2)}%
- Perubahan 30 hari: ${goldData.changePercent30d.toFixed(2)}%
- Tren: ${goldData.trend === "up" ? "naik" : goldData.trend === "down" ? "turun" : "menyamping"}
- Zona harga: ${goldData.priceZone === "low" ? "rendah" : goldData.priceZone === "high" ? "tinggi" : "menengah"}

Target pengguna:
- Tujuan: ${goal.goalName}${goal.goalName === "lainnya" ? " (lainnya)" : ""}
- Target: ${goal.targetGrams} gram
- Sudah punya: ${goal.currentGrams} gram
- Butuh: ${progress.gramsNeeded.toFixed(2)} gram
- Budget per bulan: Rp${goal.monthlyBudget.toLocaleString("id-ID")}
- Bisa beli per bulan: ~${progress.budgetCanBuy.toFixed(2)} gram
- Deadline: ${goal.deadlineLabel || goal.deadline}
- Sisa waktu: ${progress.monthsLeft} bulan
- Perkiraan tercapai: ${progress.estimatedAchieveDate}
- On track: ${progress.isOnTrack ? "Ya" : "Tidak"}

INSTRUKSI FORMAT (wajib):
1. Awali dengan emoji relevan dan salam singkat.
2. Gunakan section dengan emoji sebagai berikut:
📊 **Analisis Pasar**
...ringkasan kondisi pasar...

🎯 **Progres Tabungan**
...ulasan progres menuju target...

💡 **Rekomendasi**
...saran spesifik dalam format: REKOMENDASI: [BUY/HOLD/SELL] diikuti penjelasan...

⚠️ **Risiko & Tips**
...peringatan dan tips praktis...

3. REKOMENDASI harus jelas di section Rekomendasi, gunakan salah satu: BUY, HOLD, atau SELL.
4. Total panjang maksimal 400 kata.
5. Jangan gunakan markdown heading #, gunakan bold ** saja.`;
}

function parseRecommendation(text: string): Recommendation {
  const lines = text.split("\n");
  for (const line of lines) {
    const upper = line.toUpperCase();
    if (
      upper.includes("REKOMENDASI:") ||
      upper.includes("REKOMENDASI") ||
      upper.includes("💡")
    ) {
      if (upper.includes("BUY") || upper.includes("BELI")) return "BUY";
      if (upper.includes("SELL") || upper.includes("JUAL")) return "SELL";
      if (upper.includes("HOLD") || upper.includes("TUNGU")) return "HOLD";
    }
  }

  // Cari di seluruh teks sebagai fallback
  const upperText = text.toUpperCase();
  if (upperText.includes("REKOMENDASI: BUY") || upperText.includes("REKOMENDASI BUY"))
    return "BUY";
  if (upperText.includes("REKOMENDASI: SELL") || upperText.includes("REKOMENDASI SELL"))
    return "SELL";
  if (upperText.includes("REKOMENDASI: HOLD") || upperText.includes("REKOMENDASI HOLD"))
    return "HOLD";

  return "HOLD";
}

function buildFallbackResponse(
  goal: UserGoal,
  goldData: GoldData,
  progress: GoalProgress,
  usdToIdr: number
): GeminiResult {
  const priceIdrPerGram = Math.round(
    ((goldData.currentPrice / 31.1035) * usdToIdr) / 1000
  ) * 1000;

  const rec: Recommendation =
    goldData.priceZone === "low" && !progress.isOnTrack
      ? "BUY"
      : goldData.priceZone === "high"
        ? "HOLD"
        : "HOLD";

  const text = `👋 Halo! Saya Mas Emas, siap membantu kamu mencapai target emas.

📊 **Analisis Pasar**
Harga emas saat ini berada di level $${goldData.currentPrice.toLocaleString("id-ID")} USD/oz (sekitar Rp${priceIdrPerGram.toLocaleString("id-ID")}/gram). Dalam 7 hari terakhir harga ${goldData.trend === "up" ? "naik" : goldData.trend === "down" ? "turun" : "cenderung flat"} sekitar ${Math.abs(goldData.changePercent7d).toFixed(2)}%. Zona harga saat ini tergolong ${goldData.priceZone === "low" ? "rendah" : goldData.priceZone === "high" ? "tinggi" : "menengah"}.

🎯 **Progres Tabungan**
Kamu menargetkan ${goal.targetGrams} gram emas dan sudah mengumpulkan ${goal.currentGrams} gram. Masih perlu ${progress.gramsNeeded.toFixed(2)} gram lagi. Dengan budget Rp${goal.monthlyBudget.toLocaleString("id-ID")}/bulan, kamu bisa membeli ~${progress.budgetCanBuy.toFixed(2)} gram per bulan. Perkiraan tercapai: ${progress.estimatedAchieveDate}.

💡 **Rekomendasi**
REKOMENDASI: ${rec}
${rec === "BUY" ? "Saat ini harga emas masih relatif terjangkau. Disarankan untuk mulai menambah pembelian secara rutin agar target tercapai tepat waktu." : "Kondisi pasar cukup stabil. Tetap konsisten menabung emas sesuai budget bulananmu. Jangan panik jika harga berfluktuasi sedikit."}

⚠️ **Risiko & Tips**
- Jangan investasi lebih dari kemampuan keuanganmu.
- Beli secara rutin (dollar-cost averaging) untuk meratakan risiko harga.
- Simpan emas di tempat yang aman dan terpercaya.
- Pantau perkembangan harga secara berkala.`;

  return { text, recommendation: rec };
}

export async function generateAnalysis(
  goal: UserGoal,
  goldData: GoldData,
  progress: GoalProgress,
  usdToIdr: number
): Promise<GeminiResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return buildFallbackResponse(goal, goldData, progress, usdToIdr);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = getModelName();

  const systemPrompt = buildSystemPrompt(goal, goldData, progress, usdToIdr);

  const generationConfig = {
    temperature: 0.7,
    maxOutputTokens: 1024,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  // Best-effort grounding: coba dengan grounding, kalau gagal coba tanpa grounding
  const tryGenerate = async (useGrounding: boolean): Promise<GeminiResult | null> => {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig,
        safetySettings,
        ...(useGrounding
          ? {
              tools: [
                {
                    googleSearchRetrieval: {
                      dynamicRetrievalConfig: {
                        dynamicThreshold: 0.6,
                        mode: "MODE_DYNAMIC" as unknown as import("@google/generative-ai").DynamicRetrievalMode,
                      },
                    },
                },
              ],
            }
          : {}),
      });

      const result = await model.generateContent(systemPrompt);
      const response = result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        return null;
      }

      const recommendation = parseRecommendation(text);
      return { text, recommendation };
    } catch (err) {
      console.warn(
        `Gemini ${useGrounding ? "with" : "without"} grounding failed:`,
        err instanceof Error ? err.message : String(err)
      );
      return null;
    }
  };

  // Coba dengan grounding dulu
  const withGrounding = await tryGenerate(true);
  if (withGrounding) return withGrounding;

  // Retry tanpa grounding
  const withoutGrounding = await tryGenerate(false);
  if (withoutGrounding) return withoutGrounding;

  // Fallback template jika semua gagal
  return buildFallbackResponse(goal, goldData, progress, usdToIdr);
}
