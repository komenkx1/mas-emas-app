import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import type { UserGoal, GoldData, GoalProgress } from "./types";

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
  progress: GoalProgress
): string {
  const priceIdrPerGram = goldData.currentPrice;
  const avg7d = goldData.averageShort || priceIdrPerGram;
  const avg30d = goldData.averageLong || priceIdrPerGram;
  const high30d = goldData.high30d || priceIdrPerGram;
  const low30d = goldData.low30d || priceIdrPerGram;
  const diffFromAvg7d = avg7d > 0 ? ((priceIdrPerGram - avg7d) / avg7d) * 100 : 0;
  const diffFromAvg30d = avg30d > 0 ? ((priceIdrPerGram - avg30d) / avg30d) * 100 : 0;
  const diffFromHigh30d = high30d > 0 ? ((high30d - priceIdrPerGram) / high30d) * 100 : 0;
  const idealBuyPrice = Math.round(avg7d * 0.99);
  const strongBuyPrice = Math.round(Math.min(avg7d * 0.97, low30d * 1.02));
  const canBuyAtIdeal = goal.monthlyBudget / idealBuyPrice;

  return `Kamu adalah Mas Emas, penasihat investasi emas pribadi yang ramah dan berpengetahuan. Gunakan bahasa Indonesia yang santai tapi profesional.

Data pasar emas lokal Indonesia:
- Sumber: ${goldData.source === "logammulia" ? "Logam Mulia" : goldData.source}
- Harga jual: Rp${priceIdrPerGram.toLocaleString("id-ID")}/gram
- Harga buyback: Rp${goldData.buybackPrice.toLocaleString("id-ID")}/gram
- Spread: Rp${goldData.spread.toLocaleString("id-ID")} (${goldData.spreadPercent.toFixed(1)}%)
- Rata-rata 7 hari: Rp${avg7d.toLocaleString("id-ID")}/gram; harga sekarang ${diffFromAvg7d >= 0 ? "+" : ""}${diffFromAvg7d.toFixed(2)}% dari rata-rata 7 hari
- Rata-rata 30 hari: Rp${avg30d.toLocaleString("id-ID")}/gram; harga sekarang ${diffFromAvg30d >= 0 ? "+" : ""}${diffFromAvg30d.toFixed(2)}% dari rata-rata 30 hari
- High 30 hari: Rp${high30d.toLocaleString("id-ID")}/gram; harga sekarang ${diffFromHigh30d.toFixed(2)}% di bawah high 30 hari
- Low 30 hari: Rp${low30d.toLocaleString("id-ID")}/gram
- Perubahan 7 hari: ${goldData.changePercent7d.toFixed(2)}%
- Perubahan 30 hari: ${goldData.changePercent30d.toFixed(2)}%
- Tren: ${goldData.trend === "up" ? "naik" : goldData.trend === "down" ? "turun" : "menyamping"}
- Zona harga: ${goldData.priceZone === "low" ? "rendah" : goldData.priceZone === "high" ? "tinggi" : "menengah"}
- Harga ideal beli ringan: di bawah Rp${idealBuyPrice.toLocaleString("id-ID")}/gram
- Harga beli agresif: di bawah Rp${strongBuyPrice.toLocaleString("id-ID")}/gram

Target pengguna:
- Tujuan: ${goal.goalName}${goal.goalName === "lainnya" ? " (lainnya)" : ""}
- Target: ${goal.targetGrams} gram
- Sudah punya: ${goal.currentGrams} gram
- Butuh: ${progress.gramsNeeded.toFixed(2)} gram
- Budget per bulan: Rp${goal.monthlyBudget.toLocaleString("id-ID")}
- Bisa beli per bulan: ~${progress.budgetCanBuy.toFixed(2)} gram
- Jika beli di harga ideal Rp${idealBuyPrice.toLocaleString("id-ID")}: ~${canBuyAtIdeal.toFixed(2)} gram/bulan, selisih ${(canBuyAtIdeal - progress.budgetCanBuy).toFixed(2)} gram dari beli sekarang
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
...saran spesifik dalam format: REKOMENDASI: [BUY/HOLD/SELL] diikuti keputusan blunt, trigger harga, dan nominal aksi...

⚠️ Risiko & Tips
...peringatan dan tips praktis...

3. REKOMENDASI harus jelas di section Rekomendasi, gunakan salah satu: BUY, HOLD, atau SELL.
   - BUY berarti boleh tambah pembelian emas bulan ini jika cashflow aman.
   - HOLD berarti tetap beli sesuai budget rutin, jangan tambah pembelian agresif dulu.
   - SELL berarti tunda pembelian baru dan evaluasi apakah perlu mengurangi sebagian posisi.
4. WAJIB bersikap decisif, bukan sekadar informatif. Sertakan angka konkret berikut:
   - Harga sekarang vs rata-rata 7 hari dalam Rupiah dan persen.
   - Posisi harga terhadap high/low 30 hari.
   - Jika BUY: sebutkan maksimal harga yang masih layak dibeli dan nominal tambahan yang masuk akal.
   - Jika HOLD: sebutkan trigger jelas kapan berubah jadi BUY, misalnya "beli kalau turun ke RpX".
   - Satu kalimat blunt: "Dengan kondisi ini, [beli sekarang/tunggu dip/tunda beli agresif] lebih masuk akal karena ...".
5. ATURAN KERAS: Jangan rekomendasikan BUY jika harga sekarang lebih dari 5% di atas rata-rata 7 hari. Dalam kondisi itu pilih HOLD, kecuali pengguna sangat tidak on-track dan harus DCA minimum.
6. Untuk tujuan tabungan jangka panjang, bedakan "beli rutin sesuai budget" dari "BUY agresif/tambah pembelian". HOLD tetap boleh berarti lanjut DCA rutin, tapi jangan tambah agresif.
7. Total panjang maksimal 430 kata.
8. Jangan tampilkan harga dalam USD atau dollar. Semua nominal uang wajib pakai Rupiah.
 9. Jangan gunakan markdown seperti #, **, atau bullet bertingkat.
 10. Analisis Kondisi Dunia: Sertakan analisis singkat tentang faktor global yang
   mempengaruhi harga emas, seperti: kebijakan suku bunga The Fed (Fed Rate),
   nilai tukar mata uang Amerika, inflasi global, dan ketegangan geopolitik.
   Hubungkan faktor-faktor ini dengan kondisi pasar emas saat ini dan
   berikan konteks bagaimana hal ini mempengaruhi strategi tabungan emas
   pengguna di Indonesia.
11. WAJIB selesaikan semua section. Jangan berhenti di tengah kalimat.`;
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

function getDecisionMetrics(goldData: GoldData, monthlyBudget: number) {
  const currentPrice = goldData.currentPrice;
  const avg7d = goldData.averageShort || currentPrice;
  const avg30d = goldData.averageLong || currentPrice;
  const high30d = goldData.high30d || currentPrice;
  const low30d = goldData.low30d || currentPrice;
  const diffFromAvg7d = avg7d > 0 ? ((currentPrice - avg7d) / avg7d) * 100 : 0;
  const diffFromAvg30d = avg30d > 0 ? ((currentPrice - avg30d) / avg30d) * 100 : 0;
  const diffFromHigh30d = high30d > 0 ? ((high30d - currentPrice) / high30d) * 100 : 0;
  const idealBuyPrice = Math.round(avg7d * 0.99);
  const strongBuyPrice = Math.round(Math.min(avg7d * 0.97, low30d * 1.02));

  return {
    currentPrice,
    avg7d,
    avg30d,
    high30d,
    low30d,
    diffFromAvg7d,
    diffFromAvg30d,
    diffFromHigh30d,
    idealBuyPrice,
    strongBuyPrice,
    gramsAtIdeal: monthlyBudget / idealBuyPrice,
  };
}

function chooseRecommendation(goldData: GoldData, progress: GoalProgress): Recommendation {
  const metrics = getDecisionMetrics(goldData, 1);

  if (metrics.diffFromAvg7d > 5) return "HOLD";
  if (goldData.priceZone === "low" || metrics.diffFromAvg7d < -2) return "BUY";
  if (goldData.priceZone === "high" && goldData.changePercent7d > 3 && progress.isOnTrack) return "HOLD";
  if (!progress.isOnTrack && metrics.diffFromAvg7d <= 2) return "BUY";

  return "HOLD";
}

function buildFallbackResponse(
  goal: UserGoal,
  goldData: GoldData,
  progress: GoalProgress
): GeminiResult {
  const priceIdrPerGram = goldData.currentPrice;
  const metrics = getDecisionMetrics(goldData, goal.monthlyBudget);

  const rec = chooseRecommendation(goldData, progress);
  const actionText = rec === "BUY"
    ? `Dengan kondisi ini, beli sekarang masih masuk akal selama harga tidak melewati Rp${metrics.idealBuyPrice.toLocaleString("id-ID")}/gram. Pakai budget rutin Rp${goal.monthlyBudget.toLocaleString("id-ID")}; jika cashflow aman, tambahan konservatif Rp${Math.round(goal.monthlyBudget * 0.25).toLocaleString("id-ID")} masih wajar.`
    : `Dengan kondisi ini, tunggu dip lebih masuk akal daripada tambah pembelian agresif karena harga belum cukup murah dibanding rata-rata 7 hari. Tetap jalankan DCA rutin, lalu tambah pembelian hanya jika turun ke sekitar Rp${metrics.idealBuyPrice.toLocaleString("id-ID")}/gram atau lebih rendah.`;

  const text = `👋 Halo! Saya Mas Emas, siap membantu kamu mencapai target emas.

📊 Analisis Pasar & Kondisi Dunia
Harga emas saat ini Rp${priceIdrPerGram.toLocaleString("id-ID")}/gram. Rata-rata 7 hari Rp${metrics.avg7d.toLocaleString("id-ID")}/gram, jadi harga sekarang ${metrics.diffFromAvg7d >= 0 ? "lebih mahal" : "lebih murah"} ${Math.abs(metrics.diffFromAvg7d).toFixed(2)}%. Dibanding rata-rata 30 hari Rp${metrics.avg30d.toLocaleString("id-ID")}/gram, selisihnya ${metrics.diffFromAvg30d >= 0 ? "+" : ""}${metrics.diffFromAvg30d.toFixed(2)}%. High 30 hari Rp${metrics.high30d.toLocaleString("id-ID")}, low 30 hari Rp${metrics.low30d.toLocaleString("id-ID")}. Faktor global seperti arah suku bunga The Fed, inflasi, dan geopolitik tetap mendukung emas, tapi entry lokal tetap perlu lihat harga dan spread.

🎯 Progres Tabungan
Kamu menargetkan ${goal.targetGrams} gram emas dan sudah mengumpulkan ${goal.currentGrams} gram. Masih perlu ${progress.gramsNeeded.toFixed(2)} gram lagi. Dengan budget Rp${goal.monthlyBudget.toLocaleString("id-ID")}/bulan, kamu bisa membeli ~${progress.budgetCanBuy.toFixed(2)} gram sekarang. Jika harga turun ke Rp${metrics.idealBuyPrice.toLocaleString("id-ID")}, budget yang sama dapat ~${metrics.gramsAtIdeal.toFixed(2)} gram. Perkiraan tercapai: ${progress.estimatedAchieveDate}.

💡 Rekomendasi
REKOMENDASI: ${rec}
${actionText}

⚠️ Risiko & Tips
Spread jual-buyback saat ini Rp${goldData.spread.toLocaleString("id-ID")} (${goldData.spreadPercent.toFixed(1)}%), jadi jangan terlalu sering keluar-masuk posisi. Untuk dana darurat, prioritaskan konsistensi dan likuiditas. Simpan alert di Rp${metrics.idealBuyPrice.toLocaleString("id-ID")}; kalau tersentuh, eksekusi pembelian rutin atau tambah kecil sesuai cashflow.`;

  return { text, recommendation: rec };
}

export async function generateAnalysis(
  goal: UserGoal,
  goldData: GoldData,
  progress: GoalProgress
): Promise<GeminiResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not set, using fallback response.");
    return buildFallbackResponse(goal, goldData, progress);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = getModelName();

  const systemPrompt = buildSystemPrompt(goal, goldData, progress);

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
      const metrics = getDecisionMetrics(goldData, goal.monthlyBudget);
      if (recommendation === "BUY" && metrics.diffFromAvg7d > 5) {
        console.warn("[Gemini] Rejected BUY because price is >5% above 7-day average");
        return null;
      }

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
  return buildFallbackResponse(goal, goldData, progress);
}
