"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AnalyzingOverlayProps {
  isOpen: boolean;
}

const STEPS = [
  "Menganalisis profil investasi Anda...",
  "Mengecek harga emas terkini...",
  "Menghitung proyeksi tabungan...",
  "Menyusun rekomendasi AI...",
  "Menyiapkan hasil analisis...",
];

const STEP_INTERVAL_MS = 2000;

export default function AnalyzingOverlay({ isOpen }: AnalyzingOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % STEPS.length);
    }, STEP_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0F]/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="mx-4 w-full max-w-md rounded-3xl border border-gold/20 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-gold/[0.08] p-6 shadow-2xl shadow-black/40 sm:p-8"
          >
            <div className="mb-6 flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gold/30 border-t-gold text-lg"
              >
                💰
              </motion.div>
              <div>
                <h3 className="text-lg font-semibold text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                  Mas Emas
                </h3>
                <p className="text-xs text-gray-400">Menganalisis investasi Anda</p>
              </div>
            </div>

            {/* Indeterminate progress bar */}
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-full animate-indeterminate rounded-full bg-gradient-to-r from-gold-dark via-gold to-gold-light" />
            </div>

            <div className="h-10">
              <AnimatePresence mode="wait">
                <motion.p
                  key={stepIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm text-gray-300"
                >
                  {STEPS[stepIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="h-1.5 w-1.5 rounded-full bg-gold"
              />
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                className="h-1.5 w-1.5 rounded-full bg-gold"
              />
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                className="h-1.5 w-1.5 rounded-full bg-gold"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
