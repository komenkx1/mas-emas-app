"use client";

import type { GoalProgress, UserGoal } from "@/lib/types";

interface ProgressTrackerProps {
  progress: GoalProgress;
  goal: UserGoal;
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ProgressTracker({ progress, goal }: ProgressTrackerProps) {
  const progressPercent = Math.min(Math.max((goal.currentGrams / goal.targetGrams) * 100, 0), 100);
  const isComplete = progressPercent >= 100;

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 md:p-8 space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
          Progress Investasi
        </h3>
        <p className="text-sm text-gray-400">
          Target: {goal.targetGrams} gram hingga {goal.deadlineLabel}
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Progress</span>
          <span className="font-semibold text-gold">{progressPercent.toFixed(1)}%</span>
        </div>
        
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden ring-1 ring-white/5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isComplete 
                ? "bg-gradient-to-r from-green-500 to-green-400" 
                : progress.isOnTrack
                ? "bg-gradient-to-r from-gold-dark to-gold"
                : "bg-gradient-to-r from-red-600 to-red-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {isComplete ? (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-400 font-medium">
              🎉 Selamat! Anda telah mencapai target investasi emas Anda!
            </p>
          </div>
        ) : (
          <div className={`p-4 rounded-lg border ${
            progress.isOnTrack 
              ? "bg-gold/10 border-gold/30" 
              : "bg-red-500/10 border-red-500/30"
          }`}>
            <p className={`text-sm font-medium ${
              progress.isOnTrack ? "text-gold" : "text-red-400"
            }`}>
              {progress.isOnTrack 
                ? "✓ Anda berada di jalur yang tepat!" 
                : "⚠ Perlu penyesuaian strategi"}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <p className="text-xs text-gray-400 mb-1">Emas Saat Ini</p>
          <p className="text-xl font-bold text-gold-light">{goal.currentGrams} gram</p>
        </div>

        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <p className="text-xs text-gray-400 mb-1">Emas Dibutuhkan</p>
          <p className="text-xl font-bold text-gold-light">{progress.gramsNeeded.toFixed(2)} gram</p>
        </div>

        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <p className="text-xs text-gray-400 mb-1">Waktu Tersisa</p>
          <p className="text-xl font-bold text-gold-light">
            {progress.monthsLeft} bulan
          </p>
        </div>

        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <p className="text-xs text-gray-400 mb-1">Target per Bulan</p>
          <p className="text-xl font-bold text-gold-light">
            {progress.gramsPerMonth.toFixed(2)} gram
          </p>
        </div>
      </div>

      <div className="p-4 bg-gradient-to-r from-gold-dark/20 to-gold/20 rounded-xl border border-gold/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-1">Budget Dapat Beli</p>
            <p className="text-2xl font-bold text-gold">
              {progress.budgetCanBuy.toFixed(2)} gram
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-gray-400 mb-1">Budget Bulanan</p>
            <p className="text-lg font-semibold text-gray-300">
              {formatRupiah(goal.monthlyBudget)}
            </p>
          </div>
        </div>
        
        {progress.shortfallPerMonth > 0 && (
          <p className="text-xs text-red-400 mt-3">
            ⚠ Kekurangan {progress.shortfallPerMonth.toFixed(2)} gram per bulan
          </p>
        )}
      </div>
    </div>
  );
}
