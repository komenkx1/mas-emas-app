"use client";

import { useState } from "react";
import GoalForm from "@/components/GoalForm";
import GoldDashboard from "@/components/GoldDashboard";
import MasEmasCard from "@/components/MasEmasCard";
import ProgressTracker from "@/components/ProgressTracker";
import DipAlertBanner from "@/components/DipAlertBanner";
import DCASimulator from "@/components/DCASimulator";
import ShareCard from "@/components/ShareCard";
import AnalyzingOverlay from "@/components/AnalyzingOverlay";
import type { UserGoal, AnalysisResult } from "@/lib/types";

type ResultTab = "analisis" | "dca" | "share";

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function QuickDecisionCard({ result, goal }: { result: AnalysisResult; goal: UserGoal }) {
  const avg7d = result.goldData.averageShort || result.currentPriceIdrPerGram;
  const triggerPrice = Math.round(avg7d * 0.99);
  const isBuy = result.recommendation === "BUY";
  const isSell = result.recommendation === "SELL";
  const headline = isBuy
    ? "Beli rutin masih masuk akal"
    : isSell
      ? "Tunda pembelian baru dulu"
      : "Lanjut DCA, jangan agresif dulu";
  const reason = isBuy
    ? `Harga masih cukup menarik. Pakai budget rutin ${formatRupiah(goal.monthlyBudget)} dan tambah kecil hanya jika cashflow aman.`
    : isSell
      ? "Harga sedang relatif tinggi. Prioritaskan evaluasi posisi dan jangan tambah pembelian agresif."
      : `Tunggu area ${formatRupiah(triggerPrice)}/gr untuk tambah pembelian. Budget rutin tetap boleh jalan.`;

  const badgeClass = isBuy
    ? "border-green-500/30 bg-green-500/10 text-green-400"
    : isSell
      ? "border-red-500/30 bg-red-500/10 text-red-400"
      : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";

  return (
    <div className="glass-card overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-br from-gold/[0.12] via-white/[0.05] to-white/[0.03] p-5 sm:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-bold ${badgeClass}`}>
            <span>{isBuy ? "✅" : isSell ? "⚠️" : "⏳"}</span>
            REKOMENDASI: {result.recommendation}
          </div>
          <h2 className="text-2xl font-bold text-white sm:text-3xl" style={{ fontFamily: "var(--font-playfair)" }}>
            {headline}
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-gray-300 sm:text-base">{reason}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:min-w-[360px]">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs text-gray-400">Harga sekarang</p>
            <p className="mt-1 text-lg font-bold text-gold">{formatRupiah(result.currentPriceIdrPerGram)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs text-gray-400">Trigger beli</p>
            <p className="mt-1 text-lg font-bold text-white">{formatRupiah(triggerPrice)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentGoal, setCurrentGoal] = useState<UserGoal | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTab>("analisis");

  const handleSubmit = async (goal: UserGoal) => {
    setIsLoading(true);
    setCurrentGoal(goal);
    setActiveTab("analisis");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ goal }),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;
        throw new Error(errorBody?.message || errorBody?.error || "Gagal menganalisis tujuan");
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error analyzing goal:", error);
      alert("Terjadi kesalahan saat menganalisis. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: { id: ResultTab; label: string; icon: string }[] = [
    { id: "analisis", label: "Analisis", icon: "💡" },
    { id: "dca", label: "DCA", icon: "📊" },
    { id: "share", label: "Share", icon: "📤" },
  ];

  return (
    <div className="min-h-screen relative">
      <AnalyzingOverlay isOpen={isLoading} />
      <main className="container mx-auto max-w-7xl px-4 py-7 sm:px-6 md:py-12 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-10 md:mb-16">
          <h1 
            className="gold-text text-5xl sm:text-6xl md:text-7xl font-bold mb-4 tracking-tight leading-tight"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Mas Emas
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-300/85 max-w-2xl mx-auto leading-relaxed">
            Kalkulator investasi emas cerdas dengan analisis AI untuk membantu Anda mencapai tujuan finansial
          </p>
        </div>

        {/* Form Section */}
        <div className="mb-8 md:mb-12">
          <GoalForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>

        {/* Results Section */}
        {result && currentGoal && (
          <div className="space-y-6 md:space-y-8">
            {/* Dip Alert */}
            {result.dipAlert && (
              <DipAlertBanner dipAlert={result.dipAlert} />
            )}

            <QuickDecisionCard result={result} goal={currentGoal} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <GoldDashboard goldData={result.goldData} currentPriceIdrPerGram={result.currentPriceIdrPerGram} />
              <ProgressTracker progress={result.progress} goal={currentGoal} />
            </div>

            <div className="sticky top-3 z-20 rounded-2xl border border-white/10 bg-[#0b0b10]/85 p-1.5 shadow-2xl shadow-black/30 backdrop-blur-xl md:static md:bg-white/[0.04]">
              <div className="grid grid-cols-3 gap-1.5">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? "bg-gold text-black shadow-lg shadow-gold/20"
                          : "text-gray-400 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className="mr-1.5">{tab.icon}</span>
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              {activeTab === "analisis" && (
                <MasEmasCard 
                  aiResponse={result.aiResponse} 
                  recommendation={result.recommendation} 
                />
              )}

              {activeTab === "dca" && (
                <DCASimulator 
                  currentPrice={result.currentPriceIdrPerGram}
                  monthlyBudget={currentGoal.monthlyBudget}
                />
              )}

              {activeTab === "share" && (
                <ShareCard result={result} />
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-white/10 text-center text-sm text-gray-500">
          <p>© 2026 Mas Emas. Dibuat dengan ❤️ untuk investor emas Indonesia.</p>
        </footer>
      </main>
    </div>
  );
}
