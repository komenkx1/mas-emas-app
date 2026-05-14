"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface MasEmasCardProps {
  aiResponse: string;
  recommendation: "BUY" | "HOLD" | "SELL";
}

interface Section {
  title: string;
  content: string;
}

function parseAIResponse(text: string): Section[] {
  try {
    const sections: Section[] = [];
    const lines = text.split("\n");
    let currentSection: Section | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^#{1,3}\s+(.+)/) || trimmed.match(/^\*\*(.+)\*\*:?$/) || trimmed.match(/^[📊🎯💡⚠️]\s+/)) {
        if (currentSection?.content.trim()) sections.push(currentSection);
        currentSection = {
          title: trimmed.replace(/^#{1,3}\s+/, "").replace(/\*\*/g, "").replace(/^\*\*/, "").replace(/\*\*:?$/, "").trim(),
          content: "",
        };
      } else if (currentSection) {
        currentSection.content += line + "\n";
      } else if (trimmed) {
        currentSection = { title: "Analisis", content: line + "\n" };
      }
    }
    if (currentSection?.content.trim()) sections.push(currentSection);
    return sections;
  } catch {
    return [];
  }
}

function TypewriterText({ text, speed = 16 }: { text: string; speed?: number }) {
  const words = text.split(" ");
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible < words.length) {
      const timer = setTimeout(() => setVisible((c) => c + 1), speed);
      return () => clearTimeout(timer);
    }
  }, [visible, words.length, speed]);

  return <span>{words.slice(0, visible).join(" ")}{visible < words.length && <span className="animate-pulse text-gold">|</span>}</span>;
}

function SectionBlock({ section, index }: { section: Section; index: number }) {
  const delay = index * 200;
  const isEmpty = !section.content.trim();
  const contentText = section.content.replace(/\*\*/g, "").trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay / 1000, ease: "easeOut" }}
      className="space-y-2"
    >
      <h4 className="text-lg font-semibold text-gold-light">
        {section.title}
      </h4>
      {!isEmpty && (
        <div className="text-gray-300 text-sm leading-7 whitespace-pre-line">
          <TypewriterText text={contentText} speed={14} />
        </div>
      )}
    </motion.div>
  );
}

export default function MasEmasCard({ aiResponse, recommendation }: MasEmasCardProps) {
  const sanitizedResponse = aiResponse.replace(/\*\*/g, "");
  const sections = parseAIResponse(sanitizedResponse);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="glass-card rounded-2xl p-5 sm:p-6 md:p-8 space-y-6"
    >
      <div>
        <h3 className="text-2xl font-bold mb-2 text-gold" style={{ fontFamily: "var(--font-playfair)" }}>
          Analisis AI Mas Emas
        </h3>
        <p className="text-sm text-gray-400">
          Rekomendasi personal berdasarkan tujuan investasi Anda
        </p>
      </div>

      {sections.length > 0 ? (
        <div className="space-y-6">
          {sections.map((section, idx) => (
            <SectionBlock key={idx} section={section} index={idx} />
          ))}
        </div>
      ) : (
        <div className="text-gray-300 text-sm leading-7 whitespace-pre-line">
          <TypewriterText text={sanitizedResponse} speed={18} />
        </div>
      )}

      {recommendation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
          className="mt-6 p-4 bg-gold/10 border border-gold/30 rounded-xl"
        >
          <h4 className="text-sm font-semibold text-gold mb-2">💡 Rekomendasi Utama</h4>
          <p className="text-sm text-gray-300 leading-relaxed">
            {recommendation === "BUY" && "Waktu yang tepat untuk membeli emas"}
            {recommendation === "HOLD" && "Tetap beli sesuai budget rutin, jangan tambah pembelian agresif dulu"}
            {recommendation === "SELL" && "Tunda pembelian baru dan evaluasi apakah perlu mengurangi sebagian posisi"}
          </p>
        </motion.div>
      )}

      <div className="pt-4 border-t border-white/10">
        <p className="text-xs text-gray-500 italic">
          Disclaimer: Analisis ini dihasilkan oleh AI dan bersifat informatif. Bukan merupakan nasihat keuangan profesional. 
          Konsultasikan dengan ahli keuangan sebelum membuat keputusan investasi.
        </p>
      </div>
    </motion.div>
  );
}
