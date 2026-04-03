"use client";

import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

type Props = {
  data: { label: string; value: number }[];
  formatCurrency: (value: number) => string;
};

export function EarningsChart({ data, formatCurrency }: Props) {
  const ref = useRef(null);

  const isInView = useInView(ref, {
    once: true,
    amount: 0.6,
  });

  const [startAnimation, setStartAnimation] = useState(false);

  useEffect(() => {
    if (isInView) {
      setStartAnimation(true);
    }
  }, [isInView]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            
            {/* Gradient */}
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#076BD2" />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="label"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />

            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              contentStyle={{
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                padding: "8px 12px",
              }}
              formatter={(value) =>
                formatCurrency(typeof value === "number" ? value : 0)
              }
              labelStyle={{ fontSize: 12, color: "#64748b" }}
            />

            <Bar
              dataKey="value"
              radius={[12, 12, 0, 0]}
              animationDuration={1200}
              animationEasing="ease-out"
              animationBegin={startAnimation ? 0 : 999999} // 🔥 KEY FIX
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={
                    index === data.length - 1
                      ? "url(#barGradient)"
                      : "#93C5FD"
                  }
                />
              ))}
            </Bar>

          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}