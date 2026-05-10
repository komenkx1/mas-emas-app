"use client";

import { useState } from "react";
import type { UserGoal, GoalName } from "@/lib/types";

interface GoalFormProps {
  onSubmit: (goal: UserGoal) => void;
  isLoading: boolean;
}

const GOAL_OPTIONS: { value: GoalName; label: string }[] = [
  { value: "darurat", label: "Tabungan Darurat" },
  { value: "pendidikan", label: "Dana Pendidikan" },
  { value: "rumah", label: "Beli Rumah" },
  { value: "nikah", label: "Persiapan Nikah" },
  { value: "lainnya", label: "Lainnya" },
];

const INDONESIAN_MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function formatRupiah(value: string): string {
  const numbers = value.replace(/\D/g, "");
  if (!numbers) return "";
  return new Intl.NumberFormat("id-ID").format(parseInt(numbers));
}

function parseRupiah(formatted: string): number {
  return parseInt(formatted.replace(/\D/g, "") || "0");
}

export default function GoalForm({ onSubmit, isLoading }: GoalFormProps) {
  const restoredGoal = useState(() => {
    try {
      if (typeof window === "undefined") return null;
      const saved = localStorage.getItem("mas-emas-goal-v1");
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        return parsed as Partial<UserGoal>;
      }
    } catch (e) {
      console.error("Failed to restore goal from localStorage:", e);
    }
    return null;
  })[0];
  const restoredDeadline = restoredGoal?.deadline?.split("-") ?? [];

  const [goalName, setGoalName] = useState<GoalName>(restoredGoal?.goalName ?? "darurat");
  const [targetGrams, setTargetGrams] = useState(restoredGoal?.targetGrams ? String(restoredGoal.targetGrams) : "");
  const [currentGrams, setCurrentGrams] = useState(restoredGoal?.currentGrams ? String(restoredGoal.currentGrams) : "");
  const [monthlyBudget, setMonthlyBudget] = useState(
    restoredGoal?.monthlyBudget ? formatRupiah(String(restoredGoal.monthlyBudget)) : ""
  );
  const [deadlineMonth, setDeadlineMonth] = useState(restoredDeadline[1] ?? "");
  const [deadlineYear, setDeadlineYear] = useState(restoredDeadline[0] ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const targetGramsNum = parseFloat(targetGrams);
    const currentGramsNum = parseFloat(currentGrams);
    const monthlyBudgetNum = parseRupiah(monthlyBudget);

    if (!deadlineMonth || !deadlineYear) {
      alert("Silakan pilih bulan dan tahun target");
      return;
    }

    const deadline = `${deadlineYear}-${deadlineMonth.padStart(2, "0")}`;
    const monthIndex = parseInt(deadlineMonth) - 1;
    const deadlineLabel = `${INDONESIAN_MONTHS[monthIndex]} ${deadlineYear}`;

    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    if (deadline < currentYearMonth) {
      alert("Tanggal target tidak boleh di masa lalu");
      return;
    }

    const goal: UserGoal = {
      goalName,
      targetGrams: targetGramsNum,
      currentGrams: currentGramsNum,
      monthlyBudget: monthlyBudgetNum,
      deadline,
      deadlineLabel,
    };

    try {
      localStorage.setItem("mas-emas-goal-v1", JSON.stringify(goal));
    } catch (e) {
      console.error("Failed to save goal to localStorage:", e);
    }

    onSubmit(goal);
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear + i);

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-5 sm:p-6 md:p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
          Rencanakan Investasi Emas Anda
        </h2>
        <p className="text-sm text-gray-400">
          Isi detail tujuan investasi Anda untuk mendapatkan rekomendasi dari AI
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="goalName" className="block text-sm font-medium mb-2">
            Tujuan Investasi
          </label>
          <select
            id="goalName"
            value={goalName}
            onChange={(e) => setGoalName(e.target.value as GoalName)}
            className="gold-focus w-full px-4 py-3 rounded-xl bg-white/5 border border-gold/20 hover:border-gold/35 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
            disabled={isLoading}
          >
            {GOAL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-[#0A0A0F]">
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="targetGrams" className="block text-sm font-medium mb-2">
              Target Emas (gram)
            </label>
            <input
              id="targetGrams"
              type="text"
              inputMode="numeric"
              value={targetGrams}
              onChange={(e) => {
                const val = e.target.value.replace(/[^\d.]/g, "");
                setTargetGrams(val);
              }}
              placeholder="100"
              required
              className="gold-focus w-full px-4 py-3 rounded-xl bg-white/5 border border-gold/20 hover:border-gold/35 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="currentGrams" className="block text-sm font-medium mb-2">
              Emas Saat Ini (gram)
            </label>
            <input
              id="currentGrams"
              type="text"
              inputMode="numeric"
              value={currentGrams}
              onChange={(e) => {
                const val = e.target.value.replace(/[^\d.]/g, "");
                setCurrentGrams(val);
              }}
              placeholder="0"
              required
              className="gold-focus w-full px-4 py-3 rounded-xl bg-white/5 border border-gold/20 hover:border-gold/35 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="monthlyBudget" className="block text-sm font-medium mb-2">
            Budget Bulanan (Rp)
          </label>
          <input
            id="monthlyBudget"
            type="text"
            inputMode="numeric"
            value={monthlyBudget}
            onChange={(e) => {
              const formatted = formatRupiah(e.target.value);
              setMonthlyBudget(formatted);
            }}
            placeholder="5.000.000"
            required
            className="gold-focus w-full px-4 py-3 rounded-xl bg-white/5 border border-gold/20 hover:border-gold/35 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Target Waktu
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select
              value={deadlineMonth}
              onChange={(e) => setDeadlineMonth(e.target.value)}
              className="gold-focus w-full px-4 py-3 rounded-xl bg-white/5 border border-gold/20 hover:border-gold/35 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
              disabled={isLoading}
              required
            >
              <option value="" className="bg-[#0A0A0F]">Pilih Bulan</option>
              {INDONESIAN_MONTHS.map((month, idx) => (
                <option key={idx} value={String(idx + 1)} className="bg-[#0A0A0F]">
                  {month}
                </option>
              ))}
            </select>

            <select
              value={deadlineYear}
              onChange={(e) => setDeadlineYear(e.target.value)}
              className="gold-focus w-full px-4 py-3 rounded-xl bg-white/5 border border-gold/20 hover:border-gold/35 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
              disabled={isLoading}
              required
            >
              <option value="" className="bg-[#0A0A0F]">Pilih Tahun</option>
              {yearOptions.map((year) => (
                <option key={year} value={String(year)} className="bg-[#0A0A0F]">
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="gold-focus w-full py-4 rounded-xl bg-gradient-to-r from-gold-dark via-gold to-gold-light [background-size:200%_100%] font-semibold text-[#0A0A0F] shadow-lg shadow-gold/10 transition-all hover:-translate-y-0.5 hover:shadow-gold/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 active:scale-[0.99]"
      >
        {isLoading ? "Menganalisis..." : "Analisis Sekarang"}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Rekomendasi dihasilkan oleh AI dan bersifat informatif, bukan nasihat keuangan profesional.
      </p>
    </form>
  );
}
