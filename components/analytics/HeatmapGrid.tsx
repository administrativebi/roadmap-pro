"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, AlertTriangle, CheckCircle2, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeatmapItem {
    questionId: string;
    questionText: string;
    category: string;
    totalAnswers: number;
    failRate: number; // 0-100
    trend: "up" | "down" | "stable";
}

const mockData: HeatmapItem[] = [
    { questionId: "q1", questionText: "Temperatura câmara fria ≤ 5°C?", category: "APPCC", totalAnswers: 120, failRate: 42, trend: "up" },
    { questionId: "q2", questionText: "EPIs utilizados corretamente?", category: "Segurança", totalAnswers: 120, failRate: 35, trend: "stable" },
    { questionId: "q3", questionText: "Estoque mínimo mantido?", category: "Estoque", totalAnswers: 60, failRate: 28, trend: "down" },
    { questionId: "q4", questionText: "Área de preparo higienizada?", category: "Limpeza", totalAnswers: 120, failRate: 18, trend: "down" },
    { questionId: "q5", questionText: "Ralos limpos e sem odor?", category: "Limpeza", totalAnswers: 120, failRate: 55, trend: "up" },
    { questionId: "q6", questionText: "Produtos com rótulo visível?", category: "Estoque", totalAnswers: 120, failRate: 12, trend: "stable" },
    { questionId: "q7", questionText: "Equipamentos calibrados?", category: "APPCC", totalAnswers: 30, failRate: 67, trend: "up" },
    { questionId: "q8", questionText: "FIFO aplicado no estoque?", category: "Estoque", totalAnswers: 60, failRate: 22, trend: "down" },
    { questionId: "q9", questionText: "Salão organizado pré-abertura?", category: "Operação", totalAnswers: 120, failRate: 5, trend: "stable" },
    { questionId: "q10", questionText: "Lixeiras tampadas e forradas?", category: "Limpeza", totalAnswers: 120, failRate: 38, trend: "up" },
    { questionId: "q11", questionText: "Controle de pragas em dia?", category: "APPCC", totalAnswers: 30, failRate: 8, trend: "stable" },
    { questionId: "q12", questionText: "Mãos lavadas corretamente?", category: "Segurança", totalAnswers: 120, failRate: 15, trend: "down" },
];

const categories = ["Todos", "APPCC", "Limpeza", "Segurança", "Estoque", "Operação"];

function getHeatColor(failRate: number): string {
    if (failRate >= 50) return "bg-red-500";
    if (failRate >= 35) return "bg-orange-500";
    if (failRate >= 20) return "bg-amber-400";
    if (failRate >= 10) return "bg-yellow-300";
    return "bg-emerald-400";
}

function getHeatTextColor(failRate: number): string {
    if (failRate >= 35) return "text-white";
    return "text-zinc-900";
}

export function HeatmapGrid() {
    const [filter, setFilter] = useState("Todos");
    const [sortBy, setSortBy] = useState<"failRate" | "name">("failRate");

    const filtered = mockData
        .filter((item) => filter === "Todos" || item.category === filter)
        .sort((a, b) => sortBy === "failRate" ? b.failRate - a.failRate : a.questionText.localeCompare(b.questionText));

    const criticalCount = filtered.filter((i) => i.failRate >= 35).length;

    return (
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                        <Flame className="w-5 h-5 text-red-500" />
                        Mapa de Calor — Não Conformidades
                    </h3>
                    <p className="text-sm text-zinc-500 mt-1">
                        Quais perguntas mais falham nos checklists
                    </p>
                </div>
                {criticalCount > 0 && (
                    <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {criticalCount} crítico{criticalCount > 1 ? "s" : ""}
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
                <Filter className="w-4 h-4 text-zinc-400 shrink-0" />
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0",
                            filter === cat
                                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        )}
                    >
                        {cat}
                    </button>
                ))}
                <div className="ml-auto flex gap-1">
                    <button
                        onClick={() => setSortBy("failRate")}
                        className={cn("px-2 py-1 rounded text-[10px] font-semibold", sortBy === "failRate" ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400" : "text-zinc-400")}
                    >
                        % Falha
                    </button>
                    <button
                        onClick={() => setSortBy("name")}
                        className={cn("px-2 py-1 rounded text-[10px] font-semibold", sortBy === "name" ? "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400" : "text-zinc-400")}
                    >
                        A-Z
                    </button>
                </div>
            </div>

            {/* Heatmap Grid */}
            <div className="space-y-2">
                {filtered.map((item, i) => (
                    <motion.div
                        key={item.questionId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 group"
                    >
                        {/* Heat Indicator */}
                        <div className={cn("w-14 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0", getHeatColor(item.failRate), getHeatTextColor(item.failRate))}>
                            {item.failRate}%
                        </div>

                        {/* Bar + Label */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">{item.questionText}</p>
                                <span className="text-[10px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-400 font-medium shrink-0">{item.category}</span>
                            </div>
                            <div className="relative w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div
                                    className={cn("absolute inset-y-0 left-0 rounded-full", getHeatColor(item.failRate))}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.failRate}%` }}
                                    transition={{ duration: 0.8, delay: i * 0.05 }}
                                />
                            </div>
                        </div>

                        {/* Trend */}
                        <div className={cn("text-[10px] font-bold shrink-0",
                            item.trend === "up" ? "text-red-500" : item.trend === "down" ? "text-emerald-500" : "text-zinc-400"
                        )}>
                            {item.trend === "up" ? "↑ Piorando" : item.trend === "down" ? "↓ Melhorando" : "→ Estável"}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-400 font-medium">Legenda:</span>
                {[
                    { label: "Crítico (≥50%)", color: "bg-red-500" },
                    { label: "Alto (35-49%)", color: "bg-orange-500" },
                    { label: "Médio (20-34%)", color: "bg-amber-400" },
                    { label: "Baixo (10-19%)", color: "bg-yellow-300" },
                    { label: "OK (<10%)", color: "bg-emerald-400" },
                ].map((l) => (
                    <div key={l.label} className="flex items-center gap-1">
                        <div className={cn("w-3 h-3 rounded", l.color)} />
                        <span className="text-[10px] text-zinc-500">{l.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
