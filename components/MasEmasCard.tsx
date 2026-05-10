"use client";

interface MasEmasCardProps {
  aiResponse: string;
  recommendation: "BUY" | "HOLD" | "SELL";
}

function parseAIResponse(text: string): { sections: { title: string; content: string }[] } | null {
  try {
    const sections: { title: string; content: string }[] = [];
    
    // Try to parse sections with headers (##, ###, or bold markers)
    const lines = text.split("\n");
    let currentSection: { title: string; content: string } | null = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check for markdown headers or bold titles
      if (trimmed.match(/^#{1,3}\s+(.+)/) || trimmed.match(/^\*\*(.+)\*\*:?$/)) {
        // Save previous section
        if (currentSection && currentSection.content.trim()) {
          sections.push(currentSection);
        }
        
        // Start new section
        const title = trimmed
          .replace(/^#{1,3}\s+/, "")
          .replace(/^\*\*/, "")
          .replace(/\*\*:?$/, "")
          .trim();
        
        currentSection = { title, content: "" };
      } else if (currentSection) {
        currentSection.content += line + "\n";
      } else if (trimmed) {
        // Content before any section header
        if (!currentSection) {
          currentSection = { title: "Analisis", content: "" };
        }
        currentSection.content += line + "\n";
      }
    }
    
    // Add last section
    if (currentSection && currentSection.content.trim()) {
      sections.push(currentSection);
    }
    
    return sections.length > 0 ? { sections } : null;
  } catch {
    return null;
  }
}

export default function MasEmasCard({ aiResponse, recommendation }: MasEmasCardProps) {
  const parsed = parseAIResponse(aiResponse);
  
  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 md:p-8 space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2 text-gold" style={{ fontFamily: "var(--font-playfair)" }}>
          Analisis AI Mas Emas
        </h3>
        <p className="text-sm text-gray-400">
          Rekomendasi personal berdasarkan tujuan investasi Anda
        </p>
      </div>

      {parsed ? (
        <div className="space-y-6">
          {parsed.sections.map((section, idx) => (
            <div key={idx} className="space-y-2">
              <h4 className="text-lg font-semibold text-gold-light">
                {section.title}
              </h4>
              <div className="text-gray-300 text-sm leading-7 whitespace-pre-line">
                {section.content.trim()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-300 text-sm leading-7 whitespace-pre-line">
          {aiResponse}
        </div>
      )}

      {recommendation && (
        <div className="mt-6 p-4 bg-gold/10 border border-gold/30 rounded-xl">
          <h4 className="text-sm font-semibold text-gold mb-2">💡 Rekomendasi Utama</h4>
          <p className="text-sm text-gray-300 leading-relaxed">
            {recommendation === "BUY" && "Waktu yang tepat untuk membeli emas"}
            {recommendation === "HOLD" && "Pertahankan posisi emas Anda saat ini"}
            {recommendation === "SELL" && "Pertimbangkan untuk menjual sebagian emas"}
          </p>
        </div>
      )}

      <div className="pt-4 border-t border-white/10">
        <p className="text-xs text-gray-500 italic">
          Disclaimer: Analisis ini dihasilkan oleh AI dan bersifat informatif. Bukan merupakan nasihat keuangan profesional. 
          Konsultasikan dengan ahli keuangan sebelum membuat keputusan investasi.
        </p>
      </div>
    </div>
  );
}
