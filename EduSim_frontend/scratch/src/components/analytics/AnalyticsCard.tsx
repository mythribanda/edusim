import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: string;
}

export function AnalyticsCard({ title, value, icon: Icon, trend, trendUp, color = "purple" }: AnalyticsCardProps) {
  const colorClass = color === "purple" ? "var(--neon-purple)" : color === "cyan" ? "var(--neon-cyan)" : "var(--neon-blue)";
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="glass-strong rounded-3xl p-6 border border-border relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-24 h-24 blur-3xl -z-10 transition-opacity opacity-20 group-hover:opacity-40" style={{ backgroundColor: colorClass }} />
      
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center`} style={{ backgroundColor: `color-mix(in oklab, ${colorClass} 15%, transparent)`, border: `1px solid color-mix(in oklab, ${colorClass} 30%, transparent)` }}>
           <Icon className="w-6 h-6" style={{ color: colorClass }} />
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${trendUp ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"}`}>
            {trend}
          </span>
        )}
      </div>
      
      <div>
        <p className="text-sm text-muted-foreground font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-foreground">{value}</h3>
      </div>
    </motion.div>
  );
}
