"use client";

import { useState } from "react";
import GoalForm from "@/components/GoalForm";
import GoldDashboard from "@/components/GoldDashboard";
import MasEmasCard from "@/components/MasEmasCard";
import ProgressTracker from "@/components/ProgressTracker";
import type { UserGoal, AnalysisResult } from "@/lib/types";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentGoal, setCurrentGoal] = useState<UserGoal | null>(null);

  const handleSubmit = async (goal: UserGoal) => {
    setIsLoading(true);
    setCurrentGoal(goal);

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

  return (
    <div className="min-h-screen relative">
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
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <GoldDashboard goldData={result.goldData} />
              <ProgressTracker progress={result.progress} goal={currentGoal} />
            </div>
            
            <MasEmasCard 
              aiResponse={result.aiResponse} 
              recommendation={result.recommendation} 
            />
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
