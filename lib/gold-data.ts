/**
 * Server-side gold data aggregation and analysis
 * Builds GoldData from self-hosted API
 */

import type { GoldData, HistoricalPrice, DipAlert } from "./types";
import { fetchCurrentPrice, fetchHistoryPrices, type NormalizedGoldPrice } from "./emas-api";

const DEFAULT_SOURCE = "logammulia";

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value) && Number.isFinite(value);
}

/**
 * Calculate dip alert based on historical data
 */
function calculateDipAlert(
  currentPrice: number,
  historicalPrices: HistoricalPrice[]
): DipAlert {
  if (historicalPrices.length < 7) {
    return {
      isDip: false,
      dipPercent: 0,
      message: "",
    };
  }

  // Calculate 7-day average
  const last7Days = historicalPrices.slice(0, 7);
  const avg7d = last7Days.reduce((sum, h) => sum + h.price, 0) / last7Days.length;

  // Calculate 30-day high
  const high30d = Math.max(...historicalPrices.map((h) => h.price));

  // Check if current price is significantly below average or high
  const dipFromAvg = ((avg7d - currentPrice) / avg7d) * 100;
  const dipFromHigh = ((high30d - currentPrice) / high30d) * 100;

  const isDip = dipFromAvg > 2 || dipFromHigh > 5;
  const dipPercent = Math.max(dipFromAvg, dipFromHigh);

  let message = "";
  if (isDip) {
    if (dipFromHigh > 5) {
      message = `Harga turun ${dipPercent.toFixed(1)}% dari puncak 30 hari. Momen bagus untuk beli!`;
    } else {
      message = `Harga ${dipPercent.toFixed(1)}% di bawah rata-rata 7 hari. Pertimbangkan untuk beli.`;
    }
  }

  return {
    isDip,
    dipPercent: Math.round(dipPercent * 10) / 10,
    message,
  };
}

/**
 * Build GoldData from current and historical prices
 */
export async function getGoldData(source: string = DEFAULT_SOURCE): Promise<GoldData> {
  try {
    // Fetch current and history in parallel
    const [current, history] = await Promise.all([
      fetchCurrentPrice(source),
      fetchHistoryPrices(source, 30),
    ]);

    // Build historical prices array
    const historicalPrices: HistoricalPrice[] = history.map((h) => ({
      date: h.recordedDate,
      price: h.sellPrice,
    }));

    // Sort by date ascending for chart
    historicalPrices.sort((a, b) => a.date.localeCompare(b.date));

    const currentPrice = current.sellPrice;
    const buybackPrice = current.buybackPrice;
    const spread = current.spread;
    const spreadPercent = current.spreadPercent;

    // Find prices at specific points
    const price7dAgo = historicalPrices.length >= 7
      ? historicalPrices[historicalPrices.length - 7]?.price ?? currentPrice
      : historicalPrices.length > 0
        ? historicalPrices[0]?.price ?? currentPrice
        : currentPrice;

    const price30dAgo = historicalPrices.length >= 30
      ? historicalPrices[0]?.price ?? currentPrice
      : historicalPrices.length > 0
        ? historicalPrices[0]?.price ?? currentPrice
        : currentPrice;

    // Calculate stats
    const prices = historicalPrices.map((h) => h.price);
    const high30d = prices.length > 0 ? Math.max(...prices, currentPrice) : currentPrice;
    const low30d = prices.length > 0 ? Math.min(...prices, currentPrice) : currentPrice;

    // Calculate averages
    const last7Prices = prices.slice(-7);
    const averageShort = last7Prices.length > 0
      ? last7Prices.reduce((a, b) => a + b, 0) / last7Prices.length
      : currentPrice;

    const averageLong = prices.length > 0
      ? prices.reduce((a, b) => a + b, 0) / prices.length
      : currentPrice;

    const sma7 = Math.round(averageShort);
    const sma30 = Math.round(averageLong);

    // Calculate changes
    const changePercent7d = price7dAgo > 0
      ? ((currentPrice - price7dAgo) / price7dAgo) * 100
      : 0;

    const changePercent30d = price30dAgo > 0
      ? ((currentPrice - price30dAgo) / price30dAgo) * 100
      : 0;

    // Determine trend
    const trend: GoldData["trend"] =
      changePercent7d > 1 ? "up" : changePercent7d < -1 ? "down" : "sideways";

    // Determine price zone
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
      averageShort: Math.round(averageShort),
      averageLong: Math.round(averageLong),
      sma7,
      sma30,
      priceZone,
      trend,
      changePercent7d: Math.round(changePercent7d * 100) / 100,
      changePercent30d: Math.round(changePercent30d * 100) / 100,
      historicalPrices,
      timestamp: new Date().toISOString(),
      source: current.source,
      buybackPrice,
      spread,
      spreadPercent: Math.round(spreadPercent * 10) / 10,
    };
  } catch (err) {
    console.error("[gold-data] Error building gold data:", err);
    throw err;
  }
}

/**
 * Calculate dip alert for given gold data
 */
export function getDipAlert(goldData: GoldData): DipAlert {
  return calculateDipAlert(goldData.currentPrice, goldData.historicalPrices);
}
