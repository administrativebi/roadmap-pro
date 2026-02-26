"use client";

import { motion } from "framer-motion";
import { Shield, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComplianceScoreProps {
    score: number; // 0-100
    previousScore?: number;
    label?: string;
    size?: "sm" | "md" | "lg";
}

export function ComplianceScore({
    score,
    previousScore,
    label = "Score de Conformidade",
    size = "md",
}: ComplianceScoreProps) {
    const radius = size === "lg" ? 90 : size === "md" ? 70 : 50;
    const strokeWidth = size === "lg" ? 12 : size === "md" ? 10 : 8;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const svgSize = (radius + strokeWidth) * 2;

    const diff = previousScore !== undefined ? score - previousScore : 0;
    const TrendIcon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;

    const getColor = (s: number) => {
        if (s >= 90) return { stroke: "#10b981", bg: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30", text: "text-emerald-600 dark:text-emerald-400", label: "Excelente" };
        if (s >= 75) return { stroke: "#22c55e", bg: "from-green-50 to-lime-50 dark:from-green-950/30 dark:to-lime-950/30", text: "text-green-600 dark:text-green-400", label: "Bom" };
        if (s >= 60) return { stroke: "#f59e0b", bg: "from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30", text: "text-amber-600 dark:text-amber-400", label: "Regular" };
        if (s >= 40) return { stroke: "#f97316", bg: "from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30", text: "text-orange-600 dark:text-orange-400", label: "Atenção" };
        return { stroke: "#ef4444", bg: "from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30", text: "text-red-600 dark:text-red-400", label: "Crítico" };
    };

    const color = getColor(score);

    return (
        <div className={cn("bg-gradient-to-br rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800", color.bg)}>
            <div className="flex items-center gap-2 mb-4">
                <Shield className={cn("w-5 h-5", color.text)} />
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">{label}</h3>
            </div>

            <div className="flex items-center justify-center">
                <div className="relative">
                    <svg width={svgSize} height={svgSize} className="-rotate-90">
                        {/* Background circle */}
                        <circle
                            cx={svgSize / 2}
                            cy={svgSize / 2}
                            r={radius}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={strokeWidth}
                            className="text-zinc-200/50 dark:text-zinc-700/50"
                        />
                        {/* Score arc */}
                        <motion.circle
                            cx={svgSize / 2}
                            cy={svgSize / 2}
                            r={radius}
                            fill="none"
                            stroke={color.stroke}
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: offset }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                        />
                    </svg>
                    {/* Center Value */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span
                            className={cn("font-black", color.text, size === "lg" ? "text-4xl" : size === "md" ? "text-3xl" : "text-2xl")}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            {score}
                        </motion.span>
                        <span className="text-xs text-zinc-400">/100</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4">
                <span className={cn("text-sm font-bold", color.text)}>{color.label}</span>
                {previousScore !== undefined && (
                    <div className={cn("flex items-center gap-1 text-xs font-semibold",
                        diff > 0 ? "text-emerald-500" : diff < 0 ? "text-red-500" : "text-zinc-400"
                    )}>
                        <TrendIcon className="w-3.5 h-3.5" />
                        {diff > 0 ? "+" : ""}{diff} pts
                    </div>
                )}
            </div>
        </div>
    );
}
