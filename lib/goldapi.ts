import type { GoldData, HistoricalPrice } from "./types";

const GOLDAPI_BASE_URL = "https://www.goldapi.io/api/XAU/USD";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 menit
const FETCH_TIMEOUT_MS = 8000; // 8 detik

interface CacheEntry {
  data: GoldData;
  fetchedAt: number;
}

let memoryCache: CacheEntry | null = null;

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value) && Number.isFinite(value);
}

function formatDateYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function getHistoricalDates(): Date[] {
  const dates: Date[] = [];
  const now = new Date();
  // Ambil 5 titik: sekarang, 7 hari lalu, 14 hari lalu, 21 hari lalu, 30 hari lalu
  for (const daysAgo of [0, 7, 14, 21, 30]) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo);
    const dayOfWeek = d.getDay(); // 0=Sunday, 6=Saturday
    if (dayOfWeek === 0) {
      d.setDate(d.getDate() - 2); // Sunday → Friday
    } else if (dayOfWeek === 6) {
      d.setDate(d.getDate() - 1); // Saturday → Friday
    }
    dates.push(d);
  }
  return dates;
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

async function fetchGoldAPIDate(
  dateStr: string,
  token: string
): Promise<number | null> {
  try {
    const res = await fetchWithTimeout(
      `${GOLDAPI_BASE_URL}/${dateStr}`,
      {
        headers: {
          "x-access-token": token,
          "Content-Type": "application/json",
        },
      },
      FETCH_TIMEOUT_MS
    );
    if (!res.ok) return null;
    const json = (await res.json()) as Record<string, unknown>;
    const price = json.price ?? json.close ?? json.open;
    return isValidNumber(price) && price > 0 ? price : null;
  } catch {
    return null;
  }
}

function buildMockGoldData(): GoldData {
  const now = new Date();
  const basePrice = 3200; // USD/oz
  const dates = getHistoricalDates();

  const historicalPrices: HistoricalPrice[] = dates.map((d, i) => {
    // Harga menurun sedikit ke belakang
    const price = Math.round((basePrice + i * 15) * 100) / 100;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return { date: `${y}-${m}-${day}`, price };
  });

  const currentPrice = historicalPrices[0]?.price ?? basePrice;
  const price7dAgo = historicalPrices[1]?.price ?? currentPrice;
  const price30dAgo = historicalPrices[4]?.price ?? currentPrice;

  const prices = historicalPrices.map((h) => h.price);
  const high30d = Math.max(...prices);
  const low30d = Math.min(...prices);

  const averageShort =
    prices.slice(0, 2).reduce((a, b) => a + b, 0) /
    Math.max(1, prices.slice(0, 2).length);
  const averageLong =
    prices.reduce((a, b) => a + b, 0) / Math.max(1, prices.length);

  const changePercent7d =
    price7dAgo > 0 ? ((currentPrice - price7dAgo) / price7dAgo) * 100 : 0;
  const changePercent30d =
    price30dAgo > 0 ? ((currentPrice - price30dAgo) / price30dAgo) * 100 : 0;

  const trend: GoldData["trend"] =
    changePercent7d > 1 ? "up" : changePercent7d < -1 ? "down" : "sideways";

  const priceZone: GoldData["priceZone"] =
    currentPrice <= low30d + (high30d - low30d) * 0.33
      ? "low"
      : currentPrice >= low30d + (high30d - low30d) * 0.66
        ? "high"
        : "mid";

  return {
    currentPrice,
    price7dAgo,
    price30dAgo,
    high30d,
    low30d,
    averageShort: Math.round(averageShort * 100) / 100,
    averageLong: Math.round(averageLong * 100) / 100,
    sma7: Math.round(averageShort * 100) / 100,
    sma30: Math.round(averageLong * 100) / 100,
    priceZone,
    trend,
    changePercent7d: Math.round(changePercent7d * 100) / 100,
    changePercent30d: Math.round(changePercent30d * 100) / 100,
    historicalPrices,
    timestamp: now.toISOString(),
    source: "mock",
  };
}

async function fetchLiveGoldData(token: string): Promise<GoldData | null> {
  try {
    const res = await fetchWithTimeout(
      GOLDAPI_BASE_URL,
      {
        headers: {
          "x-access-token": token,
          "Content-Type": "application/json",
        },
      },
      FETCH_TIMEOUT_MS
    );

    if (!res.ok) return null;

    const json = (await res.json()) as Record<string, unknown>;
    const currentPrice = isValidNumber(json.price) ? json.price : null;
    if (currentPrice === null) return null;

    const dates = getHistoricalDates();
    const historicalPrices: HistoricalPrice[] = [];

    for (const d of dates) {
      const dateStr = formatDateYYYYMMDD(d);
      const price = await fetchGoldAPIDate(dateStr, token);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      historicalPrices.push({
        date: `${y}-${m}-${day}`,
        price: price ?? currentPrice,
      });
    }

    const price7dAgo = historicalPrices[1]?.price ?? currentPrice;
    const price30dAgo = historicalPrices[4]?.price ?? currentPrice;

    const prices = historicalPrices.map((h) => h.price);
    const high30d = Math.max(...prices);
    const low30d = Math.min(...prices);

    const averageShort =
      prices.slice(0, 2).reduce((a, b) => a + b, 0) /
      Math.max(1, prices.slice(0, 2).length);
    const averageLong =
      prices.reduce((a, b) => a + b, 0) / Math.max(1, prices.length);

    const changePercent7d =
      price7dAgo > 0 ? ((currentPrice - price7dAgo) / price7dAgo) * 100 : 0;
    const changePercent30d =
      price30dAgo > 0 ? ((currentPrice - price30dAgo) / price30dAgo) * 100 : 0;

    const trend: GoldData["trend"] =
      changePercent7d > 1 ? "up" : changePercent7d < -1 ? "down" : "sideways";

    const priceZone: GoldData["priceZone"] =
      currentPrice <= low30d + (high30d - low30d) * 0.33
        ? "low"
        : currentPrice >= low30d + (high30d - low30d) * 0.66
          ? "high"
          : "mid";

    return {
      currentPrice,
      price7dAgo,
      price30dAgo,
      high30d,
      low30d,
      averageShort: Math.round(averageShort * 100) / 100,
      averageLong: Math.round(averageLong * 100) / 100,
      sma7: Math.round(averageShort * 100) / 100,
      sma30: Math.round(averageLong * 100) / 100,
      priceZone,
      trend,
      changePercent7d: Math.round(changePercent7d * 100) / 100,
      changePercent30d: Math.round(changePercent30d * 100) / 100,
      historicalPrices,
      timestamp: new Date().toISOString(),
      source: "live",
    };
  } catch {
    return null;
  }
}

export async function getGoldData(): Promise<GoldData> {
  const now = Date.now();
  if (memoryCache && now - memoryCache.fetchedAt < CACHE_TTL_MS) {
    return memoryCache.data;
  }

  const token = process.env.GOLDAPI_KEY ?? "";
  if (!token) {
    console.warn("GOLDAPI_KEY not set, using mock data.");
  }
  if (token) {
    const live = await fetchLiveGoldData(token);
    if (live) {
      memoryCache = { data: live, fetchedAt: now };
      return live;
    }
  }

  const mock = buildMockGoldData();
  memoryCache = { data: mock, fetchedAt: now };
  return mock;
}

export function clearGoldCache(): void {
  memoryCache = null;
}
