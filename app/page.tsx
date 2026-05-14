"use client";

import { useEffect, useRef, useState } from "react";
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
  const ringClass = isBuy
    ? "from-green-400 via-emerald-500 to-gold"
    : isSell
      ? "from-red-400 via-orange-500 to-gold"
      : "from-yellow-300 via-gold to-orange-500";

  return (
    <div className="glass-card overflow-hidden rounded-[2rem] border border-gold/30 bg-gradient-to-br from-gold/[0.16] via-white/[0.055] to-black/20 p-5 shadow-2xl shadow-gold/5 sm:p-7">
      <div className="ambient-glow absolute -right-28 -top-28 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
      <div className="ambient-glow absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-yellow-500/10 blur-3xl" />
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl space-y-3">
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-bold ${badgeClass}`}>
            <span>{isBuy ? "✅" : isSell ? "⚠️" : "⏳"}</span>
            REKOMENDASI: {result.recommendation}
          </div>
          <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl" style={{ fontFamily: "var(--font-playfair)" }}>
            {headline}
          </h2>
          <p className="text-sm leading-relaxed text-gray-300 sm:text-base">{reason}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-[150px_1fr] md:min-w-[440px]">
          <div className={`relative mx-auto flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br ${ringClass} p-1 shadow-2xl shadow-gold/20`}>
            <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#111116] text-center">
              <p className="text-xs text-gray-400">Status</p>
              <p className="text-2xl font-black text-gold">{result.recommendation}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-gray-500">Decision</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4 shadow-inner shadow-black/20">
            <p className="text-xs text-gray-400">Harga sekarang</p>
            <p className="mt-1 text-lg font-bold text-gold">{formatRupiah(result.currentPriceIdrPerGram)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4 shadow-inner shadow-black/20">
            <p className="text-xs text-gray-400">Trigger beli</p>
            <p className="mt-1 text-lg font-bold text-white">{formatRupiah(triggerPrice)}</p>
          </div>
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!result) return;
    const timer = window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [result]);

  const handleSubmit = async (goal: UserGoal) => {
    setIsLoading(true);
    setCurrentGoal(goal);
    setActiveTab("analisis");
    setErrorMessage(null);

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
      setErrorMessage("Terjadi kesalahan saat menganalisis. Silakan coba lagi.");
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
        <div className="relative mb-10 overflow-hidden rounded-[2rem] border border-gold/15 bg-gradient-to-br from-white/[0.06] via-white/[0.025] to-gold/[0.06] px-5 py-10 text-center shadow-2xl shadow-black/20 md:mb-12 md:px-10 md:py-14">
          <div className="ambient-glow absolute left-1/2 top-0 h-44 w-44 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />
          <div className="ambient-glow animate-soft-float absolute left-6 top-8 hidden rounded-2xl border border-gold/20 bg-black/25 px-4 py-3 text-left shadow-xl md:block">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gray-500">Live Price</p>
            <p className="text-sm font-semibold text-gold">Logam Mulia IDR</p>
          </div>
          <div className="ambient-glow animate-soft-float absolute bottom-8 right-6 hidden rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-left shadow-xl [animation-delay:1.2s] md:block">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gray-500">AI Decision</p>
            <p className="text-sm font-semibold text-green-400">BUY • HOLD • SELL</p>
          </div>
          <div className="relative mx-auto mb-4 inline-flex overflow-hidden rounded-full border border-gold/20 bg-gold/10 px-4 py-2 text-xs font-semibold text-gold">
            <span className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer-line" />
            <span className="relative">Emas lokal • DCA • Gemini AI</span>
          </div>
          <h1 
            className="gold-text text-5xl sm:text-6xl md:text-7xl font-bold mb-4 tracking-tight leading-tight"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Mas Emas
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-300/85 max-w-2xl mx-auto leading-relaxed">
            Kalkulator investasi emas cerdas dengan analisis AI untuk membantu Anda mencapai tujuan finansial
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-gray-400">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Trigger harga beli</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Simulasi DCA</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Share card</span>
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500/10 via-white/[0.03] to-red-500/5 p-4 backdrop-blur-sm shadow-lg shadow-red-900/10">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-lg">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-300">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Tutup pesan error"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Form Section */}
        <div className="mb-8 md:mb-12">
          <GoalForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>

        {/* Results Section */}
        {result && currentGoal && (
          <div ref={resultsRef} className="scroll-mt-6 space-y-6 md:space-y-8">
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
