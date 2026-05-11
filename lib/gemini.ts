import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import type { UserGoal, GoldData, GoalProgress } from "./types";
import { usdOzToIdrGram } from "./calculations";

const DEFAULT_MODEL = "gemini-2.5-flash-lite";

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
  const priceIdrPerGram = usdOzToIdrGram(goldData.currentPrice, usdToIdr);

  return `Kamu adalah Mas Emas, penasihat investasi emas pribadi yang ramah dan berpengetahuan. Gunakan bahasa Indonesia yang santai tapi profesional.

Data pasar emas:
- Harga emas saat ini: Rp${priceIdrPerGram.toLocaleString("id-ID")}/gram
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
📊 Analisis Pasar & Kondisi Dunia
...ringkasan kondisi pasar...

🎯 Progres Tabungan
...ulasan progres menuju target...

💡 Rekomendasi
...saran spesifik dalam format: REKOMENDASI: [BUY/HOLD/SELL] diikuti tindakan praktis untuk tabungan emas bulanan...

⚠️ Risiko & Tips
...peringatan dan tips praktis...

3. REKOMENDASI harus jelas di section Rekomendasi, gunakan salah satu: BUY, HOLD, atau SELL.
   - BUY berarti boleh tambah pembelian emas bulan ini jika cashflow aman.
   - HOLD berarti tetap beli sesuai budget rutin, jangan tambah pembelian agresif dulu.
   - SELL berarti tunda pembelian baru dan evaluasi apakah perlu mengurangi sebagian posisi.
4. Total panjang maksimal 400 kata.
5. Jangan tampilkan harga dalam USD atau dollar. Semua nominal uang wajib pakai Rupiah.
 6. Jangan gunakan markdown seperti #, **, atau bullet bertingkat.
 7. Analisis Kondisi Dunia: Sertakan analisis singkat tentang faktor global yang
   mempengaruhi harga emas, seperti: kebijakan suku bunga The Fed (Fed Rate),
   nilai tukar mata uang Amerika, inflasi global, dan ketegangan geopolitik.
   Hubungkan faktor-faktor ini dengan kondisi pasar emas saat ini dan
   berikan konteks bagaimana hal ini mempengaruhi strategi tabungan emas
   pengguna di Indonesia.
8. WAJIB selesaikan semua section. Jangan berhenti di tengah kalimat.`;
}

function isCompleteAnalysisResponse(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 300) return false;

  const requiredSections = [
    "📊 Analisis Pasar",
    "🎯 Progres Tabungan",
    "💡 Rekomendasi",
    "⚠️ Risiko",
  ];

  const hasAllSections = requiredSections.every((section) => trimmed.includes(section));
  if (!hasAllSections) return false;

  if (!/REKOMENDASI\s*:\s*(BUY|HOLD|SELL)/i.test(trimmed)) return false;

  const lastNonEmptyLine = trimmed
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1);

  if (!lastNonEmptyLine) return false;

  // Tolak response yang berhenti menggantung di tengah kalimat.
  if (!/[.!?。]$/.test(lastNonEmptyLine)) return false;

  // Tolak response yang biasanya terpotong tepat setelah nominal/prefix.
  if (/\b(Rp|di angka|sebesar|sekitar|level)\s*$/i.test(trimmed)) return false;

  return true;
}

function parseRecommendation(text: string): Recommendation {
  const lines = text.split("\n");
  for (const line of lines) {
    const upper = line.toUpperCase();
    if (upper.includes("REKOMENDASI:")) {
      if (upper.includes("BUY") || upper.includes("BELI")) return "BUY";
      if (upper.includes("SELL") || upper.includes("JUAL")) return "SELL";
      if (upper.includes("HOLD") || upper.includes("TUNGU")) return "HOLD";
    }
  }

  // Fallback: scan whole text
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
  const priceIdrPerGram = usdOzToIdrGram(goldData.currentPrice, usdToIdr);

  const rec: Recommendation =
    goldData.priceZone === "low" && !progress.isOnTrack
      ? "BUY"
      : goldData.priceZone === "high" && goldData.changePercent7d > 2
        ? "SELL"
        : "HOLD";

  const text = `👋 Halo! Saya Mas Emas, siap membantu kamu mencapai target emas.

📊 Analisis Pasar & Kondisi Dunia
Harga emas saat ini sekitar Rp${priceIdrPerGram.toLocaleString("id-ID")}/gram. Dalam 7 hari terakhir harga ${goldData.trend === "up" ? "naik" : goldData.trend === "down" ? "turun" : "cenderung flat"} sekitar ${Math.abs(goldData.changePercent7d).toFixed(2)}%. Zona harga saat ini tergolong ${goldData.priceZone === "low" ? "rendah" : goldData.priceZone === "high" ? "tinggi" : "menengah"}.

🎯 Progres Tabungan
Kamu menargetkan ${goal.targetGrams} gram emas dan sudah mengumpulkan ${goal.currentGrams} gram. Masih perlu ${progress.gramsNeeded.toFixed(2)} gram lagi. Dengan budget Rp${goal.monthlyBudget.toLocaleString("id-ID")}/bulan, kamu bisa membeli ~${progress.budgetCanBuy.toFixed(2)} gram per bulan. Perkiraan tercapai: ${progress.estimatedAchieveDate}.

💡 Rekomendasi
REKOMENDASI: ${rec}
${rec === "BUY" ? "Kamu bisa mempertimbangkan menambah pembelian emas bulan ini jika cashflow aman, sambil tetap menjaga dana darurat." : "Tetap beli sesuai budget rutin yang sudah kamu siapkan. Untuk saat ini jangan tambah pembelian agresif dulu sampai harga atau cashflow lebih mendukung."}

⚠️ Risiko & Tips
- Jangan investasi lebih dari kemampuan keuanganmu.
- Beli secara rutin untuk meratakan risiko harga.
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
    console.warn("GEMINI_API_KEY not set, using fallback response.");
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
                  googleSearch: {},
                } as any,
              ],
            }
          : {}),
      });

      console.log(`[Gemini] Attempting generation with model=${modelName}, grounding=${useGrounding}`);
      
      const result = await model.generateContent(systemPrompt);
      const response = result.response;
      
      // Debug: log finishReason dan candidates
      const finishReason = response.candidates?.[0]?.finishReason;
      const safetyRatings = response.candidates?.[0]?.safetyRatings;
      console.log(`[Gemini] finishReason=${finishReason}, candidates=${response.candidates?.length ?? 0}`);
      
      if (finishReason && finishReason !== "STOP") {
        console.warn(`[Gemini] Generation stopped early: finishReason=${finishReason}`, safetyRatings);
        return null;
      }

      const text = response.text();
      const preview = text.substring(0, 100).replace(/\n/g, " ");
      console.log(`[Gemini] Response preview: "${preview}..."`);

      if (!text || text.trim().length === 0) {
        console.warn("[Gemini] Empty response");
        return null;
      }

      if (!isCompleteAnalysisResponse(text)) {
        console.warn("[Gemini] Response incomplete, using fallback. Full text:", text);
        return null;
      }

      const recommendation = parseRecommendation(text);
      console.log(`[Gemini] Success: recommendation=${recommendation}, length=${text.length}`);
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
