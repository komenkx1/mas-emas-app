"use client";

import { useMemo, useState } from "react";

interface DCASimulatorProps {
  currentPrice: number;
  monthlyBudget: number;
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function deterministicVolatility(month: number): number {
  const waveA = Math.sin(month * 1.73);
  const waveB = Math.sin(month * 0.61) * 0.5;
  return ((waveA + waveB) / 1.5) * 0.03;
}

export default function DCASimulator({ currentPrice, monthlyBudget }: DCASimulatorProps) {
  const [amount, setAmount] = useState(monthlyBudget);
  const [months, setMonths] = useState(12);
  const [annualGrowth, setAnnualGrowth] = useState(5);

  const simulation = useMemo(() => {
    const monthlyGrowth = annualGrowth / 100 / 12;
    let totalGrams = 0;
    const points: { month: number; grams: number; invested: number; price: number }[] = [];

    for (let month = 1; month <= months; month += 1) {
      const basePrice = currentPrice * Math.pow(1 + monthlyGrowth, month - 1);
      const randomFactor = 1 + deterministicVolatility(month);
      const priceThisMonth = basePrice * randomFactor;
      
      totalGrams += amount / priceThisMonth;
      points.push({ month, grams: totalGrams, invested: amount * month, price: priceThisMonth });
    }

    const totalInvested = amount * months;
    // Scenario value based on the final simulated month price.
    const currentValue = totalGrams * points[points.length - 1].price;
    const gain = currentValue - totalInvested;
    const gainPercent = totalInvested > 0 ? (gain / totalInvested) * 100 : 0;

    return { totalGrams, totalInvested, estimatedValue: currentValue, gain, gainPercent, points };
  }, [amount, annualGrowth, currentPrice, months]);

  const maxPoint = Math.max(...simulation.points.map((p) => p.grams), 1);
  const markerPoints = simulation.points.filter((_, index) => {
    if (simulation.points.length <= 6) return true;
    return index === 0 || index === simulation.points.length - 1 || (index + 1) % Math.ceil(months / 4) === 0;
  });

  return (
    <div className="glass-card overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-br from-white/[0.08] via-white/[0.035] to-gold/[0.08] p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
            <span>📊</span>
            Dollar Cost Averaging
          </div>
          <h3 className="mt-3 text-2xl font-semibold text-white" style={{ fontFamily: "var(--font-playfair)" }}>
            Simulasi DCA Emas
          </h3>
          <p className="mt-1 text-sm text-gray-400">Lihat estimasi gram jika beli rutin setiap bulan.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
          <p className="text-xs text-gray-500">Harga acuan</p>
          <p className="text-lg font-semibold text-gold">{formatRupiah(currentPrice)}</p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="text-sm font-medium text-gray-300">Investasi per bulan</label>
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">{formatRupiah(amount)}</span>
          </div>
          <input
            type="range"
            min="100000"
            max="20000000"
            step="100000"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full accent-gold"
          />
          <div className="mt-1 flex justify-between text-[11px] text-gray-500">
            <span>Rp100rb</span>
            <span>Rp20jt</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Durasi</label>
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">{months} bulan</span>
            </div>
            <input
              type="range"
              min="1"
              max="120"
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="w-full accent-gold"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Asumsi naik/tahun</label>
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">{annualGrowth}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={annualGrowth}
              onChange={(e) => setAnnualGrowth(Number(e.target.value))}
              className="w-full accent-gold"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-gold/15 bg-gold/10 p-4">
          <p className="text-xs text-gold/80">Total gram</p>
          <p className="mt-1 text-2xl font-bold text-gold">{simulation.totalGrams.toFixed(2)}g</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-gray-400">Modal</p>
          <p className="mt-1 text-lg font-semibold text-white">{formatCompact(simulation.totalInvested)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-gray-400">Estimasi nilai</p>
          <p className="mt-1 text-lg font-semibold text-white">{formatCompact(simulation.estimatedValue)}</p>
        </div>
        <div className={`rounded-2xl border p-4 ${simulation.gain >= 0 ? "border-green-500/20 bg-green-500/10" : "border-red-500/20 bg-red-500/10"}`}>
          <p className="text-xs text-gray-400">Potensi hasil</p>
          <p className={`mt-1 text-lg font-semibold ${simulation.gain >= 0 ? "text-green-400" : "text-red-400"}`}>
            {simulation.gainPercent >= 0 ? "+" : ""}{simulation.gainPercent.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="mb-3 flex items-center justify-between text-xs text-gray-400">
          <span>Akumulasi gram</span>
          <span>{months} bulan</span>
        </div>
        <div className="flex h-28 items-end gap-1.5">
          {markerPoints.map((point) => (
            <div key={point.month} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-gold/50 to-gold shadow-[0_0_18px_rgba(212,175,55,0.25)]"
                style={{ height: `${Math.max(10, (point.grams / maxPoint) * 88)}px` }}
                title={`${point.month} bulan: ${point.grams.toFixed(2)} gr`}
              />
              <span className="text-[10px] text-gray-500">{point.month}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-gray-400">
        ⚠️ Simulasi ini menggunakan model probabilistik dengan volatilitas acuan ±3% per bulan dan asumsi pertumbuhan tahunan {annualGrowth}%. Ini bukan prediksi atau jaminan return. Harga emas berfluktuasi; keuntungan DCA datang dari membeli saat turun dan naik.
      </p>
    </div>
  );
}
