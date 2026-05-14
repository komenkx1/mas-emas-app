/**
 * Server-only API client for self-hosted Mas Emas API
 * Handles authentication and data normalization
 */

import "server-only";

const API_BASE_URL = process.env.SELF_HOSTED_API_URL || "https://api-mas-emas.mangwahyu.tech/api";
const API_KEY = process.env.SELF_HOSTED_API_KEY;
const FETCH_TIMEOUT_MS = 10000;

interface PriceRecord {
  source: string;
  material: string;
  materialType: string;
  weight: number;
  weightUnit: string;
  sellPrice: number;
  buybackPrice: number | null;
  currency: string;
  recordedDate: string;
  lineKey: string;
  createdAt?: string;
}

interface CurrentPriceResponse {
  success: boolean;
  data?: PriceRecord[];
  count?: number;
  timestamp?: string;
  cached?: boolean;
  error?: string;
}

interface HistoryPriceResponse {
  success: boolean;
  data?: PriceRecord[];
  pagination?: {
    page: number;
    length: number;
    total: number;
    totalPages: number;
  };
  error?: string;
  statusCode?: number;
}

export interface NormalizedGoldPrice {
  sellPrice: number;
  buybackPrice: number;
  spread: number;
  spreadPercent: number;
  recordedDate: string;
  source: string;
  materialType: string;
  weight: number;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Normalize price records to IDR per gram gold data
 * Filters for gold, IDR, gram unit, prefers weight=1 and materialType=antam
 */
function normalizeGoldPrices(records: PriceRecord[], source: string): NormalizedGoldPrice | null {
  if (!records || records.length === 0) return null;

  // Filter: gold, IDR, gram
  const filtered = records.filter(
    (r) =>
      r.material === "gold" &&
      r.currency === "IDR" &&
      r.weightUnit === "gr" &&
      r.sellPrice > 0
  );

  if (filtered.length === 0) return null;

  const standardRows = filtered.filter((r) => {
    const materialType = r.materialType.toLowerCase();
    return materialType === "antam" || materialType === "emas batangan";
  });
  const candidates = standardRows.length > 0 ? standardRows : filtered;

  // Logam Mulia can return duplicate 1gr rows where the first row is actually
  // a smaller denomination scraped as 1gr. For duplicate 1gr standard rows,
  // choose the highest sell price as the canonical 1gr product.
  const oneGramRows = candidates.filter((r) => r.weight === 1);
  let best = oneGramRows.length > 0 ? oneGramRows[0] : candidates[0];
  for (const row of oneGramRows.length > 0 ? oneGramRows : candidates) {
    const bestPerGram = best.sellPrice / (best.weight || 1);
    const rowPerGram = row.sellPrice / (row.weight || 1);
    if (rowPerGram > bestPerGram) {
      best = row;
    }
  }

  const weight = best.weight || 1;
  const sellPricePerGram = Math.round(best.sellPrice / weight);
  
  // If API returns buybackPrice as 0 or null, estimate at 93% of sell price (typical spread)
  let buybackPricePerGram = 0;
  if (best.buybackPrice && best.buybackPrice > 0) {
    buybackPricePerGram = Math.round(best.buybackPrice / weight);
  } else {
    // Estimate buyback at 93% of sell price (7% spread is typical for gold)
    buybackPricePerGram = Math.round(sellPricePerGram * 0.93);
  }

  const spread = sellPricePerGram - buybackPricePerGram;
  const spreadPercent = (spread / sellPricePerGram) * 100;

  return {
    sellPrice: sellPricePerGram,
    buybackPrice: buybackPricePerGram,
    spread,
    spreadPercent,
    recordedDate: best.recordedDate,
    source,
    materialType: best.materialType,
    weight: best.weight,
  };
}

/**
 * Build fallback mock data for when API is unavailable
 */
function buildMockGoldPrice(): NormalizedGoldPrice {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  
  return {
    sellPrice: 1450000,
    buybackPrice: 1350000,
    spread: 100000,
    spreadPercent: 6.9,
    recordedDate: dateStr,
    source: "mock",
    materialType: "antam",
    weight: 1,
  };
}

/**
 * Fetch current gold price from specified source
 */
export async function fetchCurrentPrice(source: string): Promise<NormalizedGoldPrice> {
  if (!API_KEY) {
    console.warn("[emas-api] SELF_HOSTED_API_KEY not set, using mock data");
    return buildMockGoldPrice();
  }

  try {
    const url = `${API_BASE_URL}/prices/${source}`;
    const res = await fetchWithTimeout(
      url,
      {
        headers: {
          "x-api-key": API_KEY,
          "Content-Type": "application/json",
        },
      },
      FETCH_TIMEOUT_MS
    );

    if (!res.ok) {
      console.warn(`[emas-api] HTTP ${res.status} from ${source}, using mock`);
      return buildMockGoldPrice();
    }

    const json = (await res.json()) as CurrentPriceResponse;

    if (!json.success || !json.data) {
      console.warn(`[emas-api] API error from ${source}: ${json.error || "unknown"}, using mock`);
      return buildMockGoldPrice();
    }

    const normalized = normalizeGoldPrices(json.data, source);
    if (!normalized) {
      console.warn(`[emas-api] No valid gold data from ${source}, using mock`);
      return buildMockGoldPrice();
    }

    return normalized;
  } catch (err) {
    console.warn(
      `[emas-api] Fetch failed for ${source}:`,
      err instanceof Error ? err.message : String(err),
      "using mock"
    );
    return buildMockGoldPrice();
  }
}

/**
 * Fetch historical gold prices (last 30 days)
 */
export async function fetchHistoryPrices(
  source: string,
  days: number = 30
): Promise<NormalizedGoldPrice[]> {
  if (!API_KEY) {
    console.warn("[emas-api] SELF_HOSTED_API_KEY not set, history unavailable");
    return [];
  }

  try {
    // Fetch raw rows and normalize locally. Logam Mulia uses materialType values
    // like "Emas Batangan", so filtering by "antam" would drop valid history.
    const historyLength = Math.min(Math.max(days * 30, days), 1000);
    const url = `${API_BASE_URL}/prices/${source}/history?page=1&length=${historyLength}`;
    const res = await fetchWithTimeout(
      url,
      {
        headers: {
          "x-api-key": API_KEY,
          "Content-Type": "application/json",
        },
      },
      FETCH_TIMEOUT_MS
    );

    if (!res.ok) {
      console.warn(`[emas-api] HTTP ${res.status} from ${source}/history, history unavailable`);
      return [];
    }

    const json = (await res.json()) as HistoryPriceResponse;

    if (!json.success || !json.data) {
      console.warn(`[emas-api] API error from ${source}/history: ${json.error || "unknown"}, history unavailable`);
      return [];
    }

    // Normalize records per date so duplicate rows for the same day choose the
    // same canonical product as the current-price normalizer.
    const recordsByDate = new Map<string, PriceRecord[]>();
    for (const record of json.data) {
      const existing = recordsByDate.get(record.recordedDate) ?? [];
      existing.push(record);
      recordsByDate.set(record.recordedDate, existing);
    }

    const normalized: NormalizedGoldPrice[] = [];
    for (const records of recordsByDate.values()) {
      const norm = normalizeGoldPrices(records, source);
      if (norm) {
        normalized.push(norm);
      }
    }

    if (normalized.length === 0) {
      console.warn(`[emas-api] No valid history from ${source}, history unavailable`);
      return [];
    }

    // Sort by date descending (newest first)
    normalized.sort((a, b) => b.recordedDate.localeCompare(a.recordedDate));

    return normalized;
  } catch (err) {
    console.warn(
      `[emas-api] History fetch failed for ${source}:`,
      err instanceof Error ? err.message : String(err),
      "history unavailable"
    );
    return [];
  }
}

/**
 * Build mock historical data
 */
function buildMockHistory(days: number): NormalizedGoldPrice[] {
  const history: NormalizedGoldPrice[] = [];
  const basePrice = 1450000;
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // Simulate slight price variation
    const variation = Math.sin(i * 0.3) * 20000;
    const sellPrice = Math.round(basePrice + variation);
    const buybackPrice = Math.round(sellPrice * 0.93);

    history.push({
      sellPrice,
      buybackPrice,
      spread: sellPrice - buybackPrice,
      spreadPercent: ((sellPrice - buybackPrice) / sellPrice) * 100,
      recordedDate: dateStr,
      source: "mock",
      materialType: "antam",
      weight: 1,
    });
  }

  return history;
}
