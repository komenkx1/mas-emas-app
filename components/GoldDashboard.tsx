"use client";

import type { GoldData } from "@/lib/types";
import GoldChart from "./ui/GoldChart";

interface GoldDashboardProps {
  goldData: GoldData;
  currentPriceIdrPerGram?: number;
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function GoldDashboard({ goldData, currentPriceIdrPerGram }: GoldDashboardProps) {
  const changePercent = goldData.changePercent30d;
  const isPositive = changePercent >= 0;
  const displayPrice = typeof currentPriceIdrPerGram === "number" && currentPriceIdrPerGram > 0
    ? currentPriceIdrPerGram
    : goldData.currentPrice;

  return (
    <div className="glass-card overflow-hidden rounded-[2rem] border-gold/25 bg-gradient-to-br from-white/[0.075] via-white/[0.035] to-gold/[0.07] p-5 shadow-2xl shadow-black/25 sm:p-6 md:p-8 space-y-6">
      <div className="ambient-glow absolute -right-20 top-8 h-44 w-44 rounded-full bg-gold/10 blur-3xl" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 inline-flex rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
            Logam Mulia • IDR/gram
          </div>
          <h3 className="text-sm text-gray-400 mb-1">Harga Emas Saat Ini</h3>
          <p className="text-4xl md:text-5xl font-bold text-gold leading-tight break-words drop-shadow-[0_0_22px_rgba(212,175,55,0.18)]" style={{ fontFamily: "var(--font-playfair)" }}>
            {formatRupiah(displayPrice)}
          </p>
          <p className="text-xs text-gray-500 mt-1">per gram</p>
        </div>
        <div className="text-left sm:text-right">
          <div className={`inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
            isPositive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
          }`}>
            <span>{isPositive ? "↑" : "↓"}</span>
            <span>{Math.abs(changePercent).toFixed(2)}%</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">30 hari</p>
        </div>
      </div>

      {/* Spread Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-black/20 rounded-2xl p-4 border border-gold/10 shadow-inner shadow-black/20">
          <p className="text-xs text-gray-400 mb-1">Harga Buyback</p>
          <p className="text-lg font-semibold text-white">{formatRupiah(goldData.buybackPrice)}</p>
        </div>
        <div className="bg-black/20 rounded-2xl p-4 border border-gold/10 shadow-inner shadow-black/20">
          <p className="text-xs text-gray-400 mb-1">Spread</p>
          <p className="text-lg font-semibold text-white">{formatRupiah(goldData.spread)}</p>
        </div>
        <div className="bg-black/20 rounded-2xl p-4 border border-gold/10 shadow-inner shadow-black/20">
          <p className="text-xs text-gray-400 mb-1">Spread %</p>
          <p className="text-lg font-semibold text-white">{goldData.spreadPercent.toFixed(1)}%</p>
        </div>
      </div>

      {goldData.historicalPrices && goldData.historicalPrices.length > 0 ? (
        <div className="mt-6">
          <h4 className="text-sm text-gray-400 mb-3">Tren Harga 30 Hari Terakhir</h4>
          <GoldChart data={goldData.historicalPrices} />
        </div>
      ) : (
        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-gold/10">
          <p className="text-sm text-gray-400 text-center">Data historis tidak tersedia</p>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-white/10">
        <p className="text-xs text-gray-500">
          Sumber: {goldData.source === "logammulia" ? "Logam Mulia" : goldData.source === "mock" ? "Data Mock" : goldData.source}
        </p>
        <p className="text-xs text-gray-500">
          {formatTimestamp(goldData.timestamp)}
        </p>
      </div>
    </div>
  );
}
