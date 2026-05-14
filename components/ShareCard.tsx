"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/types";

interface ShareCardProps {
  result: AnalysisResult;
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(timestamp: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export default function ShareCard({ result }: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const { goldData, progress, recommendation, currentPriceIdrPerGram, timestamp } = result;

  const generateShareText = () => {
    return `📊 Analisis Emas Mas Emas

💰 Harga Emas: ${formatRupiah(currentPriceIdrPerGram)}/gram
📈 Perubahan 30 hari: ${goldData.changePercent30d > 0 ? "+" : ""}${goldData.changePercent30d.toFixed(2)}%
📉 Spread: ${goldData.spreadPercent.toFixed(1)}%

🎯 Target: ${progress.gramsNeeded.toFixed(2)} gram lagi
💡 Rekomendasi: ${recommendation}

Sumber: ${goldData.source === "logammulia" ? "Logam Mulia" : goldData.source}
Waktu: ${formatDate(timestamp)}

#EmasIndonesia #InvestasiEmas #MasEmas`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateShareText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = async () => {
    const text = generateShareText();

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Analisis Emas Mas Emas",
          text,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    } else {
      handleCopy();
    }
  };

  const hasNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const recColor =
    recommendation === "BUY"
      ? "from-green-500/20 to-green-600/10 border-green-500/30 text-green-400"
      : recommendation === "SELL"
        ? "from-red-500/20 to-red-600/10 border-red-500/30 text-red-400"
        : "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400";

  return (
    <div className="glass-card overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-br from-white/[0.08] via-white/[0.035] to-gold/[0.08] p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
            <span>📤</span>
            Bagikan Analisis
          </div>
          <h3 className="mt-3 text-2xl font-semibold text-white" style={{ fontFamily: "var(--font-playfair)" }}>
            Hasil Analisis Anda
          </h3>
          <p className="mt-1 text-sm text-gray-400">Bagikan hasil analisis emas dengan teman atau keluarga.</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/15 bg-gradient-to-br from-black/40 to-black/20 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 text-xl">💰</div>
            <div>
              <p className="text-xs text-gray-400">Harga Emas</p>
              <p className="text-lg font-bold text-gold">{formatRupiah(currentPriceIdrPerGram)}</p>
            </div>
          </div>
          <div className={`rounded-2xl border bg-gradient-to-br px-4 py-2 text-center ${recColor}`}>
            <p className="text-xs opacity-80">Rekomendasi</p>
            <p className="text-lg font-bold">{recommendation}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-gray-400">Perubahan 30 hari</p>
            <p className={`mt-1 text-lg font-semibold ${goldData.changePercent30d >= 0 ? "text-green-400" : "text-red-400"}`}>
              {goldData.changePercent30d >= 0 ? "+" : ""}
              {goldData.changePercent30d.toFixed(2)}%
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-gray-400">Spread</p>
            <p className="mt-1 text-lg font-semibold text-white">{goldData.spreadPercent.toFixed(1)}%</p>
          </div>
          <div className="col-span-2 rounded-2xl border border-gold/15 bg-gold/10 p-3">
            <p className="text-xs text-gold/80">Target tersisa</p>
            <p className="mt-1 text-xl font-bold text-gold">{progress.gramsNeeded.toFixed(2)} gram</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-gray-500">
          <span>Sumber: {goldData.source === "logammulia" ? "Logam Mulia" : goldData.source}</span>
          <span>{formatDate(timestamp)}</span>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          onClick={handleCopy}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 font-medium text-white transition-all duration-200 hover:bg-white/20"
        >
          {copied ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Tersalin!
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
              Salin Teks
            </>
          )}
        </button>

        {hasNativeShare && (
          <button
            onClick={handleShare}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/20 to-gold/10 px-4 py-3 font-medium text-gold transition-all duration-200 hover:from-gold/30 hover:to-gold/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            Bagikan
          </button>
        )}
      </div>
    </div>
  );
}
