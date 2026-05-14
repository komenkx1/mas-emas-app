"use client";

import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { HistoricalPrice } from "@/lib/types";

interface GoldChartProps {
  data: HistoricalPrice[];
}

export default function GoldChart({ data }: GoldChartProps) {
  if (!data || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-[200px] flex items-center justify-center rounded-xl border border-gold/10 bg-white/5 text-gray-500 text-sm"
      >
        Tidak ada data untuk ditampilkan
      </motion.div>
    );
  }

  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
    price: item.price,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full overflow-hidden rounded-xl"
      style={{ minHeight: 200, height: 200 }}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
          <LineChart data={chartData} margin={{ top: 8, right: 4, left: -8, bottom: 4 }}>
          <XAxis
            dataKey="date"
            stroke="rgba(237,237,237,0.38)"
            style={{ fontSize: "12px" }}
            tickLine={false}
          />
          <YAxis
            stroke="rgba(237,237,237,0.38)"
            style={{ fontSize: "12px" }}
            tickLine={false}
            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}jt`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(10, 10, 15, 0.95)",
              border: "1px solid rgba(212, 175, 55, 0.3)",
              borderRadius: "12px",
              fontSize: "12px",
              boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
            }}
            cursor={{ stroke: "rgba(245, 215, 110, 0.18)", strokeWidth: 1 }}
            labelStyle={{ color: "#D4AF37" }}
            formatter={(value: unknown) => {
              const numValue = typeof value === "number" ? value : 0;
              return [
                new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(numValue),
                "Harga",
              ];
            }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#D4AF37"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: "#F5D76E" }}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
