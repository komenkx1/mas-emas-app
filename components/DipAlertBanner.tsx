"use client";

import { useState, useEffect } from "react";
import type { DipAlert } from "@/lib/types";

interface DipAlertBannerProps {
  dipAlert: DipAlert;
}

export default function DipAlertBanner({ dipAlert }: DipAlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed this alert today
    try {
      const dismissedDate = localStorage.getItem("dipAlertDismissed");
      const today = new Date().toISOString().split("T")[0];
      if (dismissedDate === today) {
        setDismissed(true);
      }
    } catch (err) {
      console.warn("[DipAlertBanner] localStorage access failed:", err);
    }
  }, []);

  const handleDismiss = () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      localStorage.setItem("dipAlertDismissed", today);
      setDismissed(true);
    } catch (err) {
      console.warn("[DipAlertBanner] localStorage write failed:", err);
      setDismissed(true);
    }
  };

  if (!dipAlert.isDip || dismissed) {
    return null;
  }

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">🎯</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-green-400 mb-1">Peluang Beli!</h3>
          <p className="text-sm text-gray-300">{dipAlert.message}</p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
          aria-label="Tutup"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
