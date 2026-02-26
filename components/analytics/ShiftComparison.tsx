"use client";

import { motion } from "framer-motion";
import { Sun, Sunset, Moon, Trophy, Clock, Users, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShiftData {
    id: string;
    name: string;
    icon: typeof Sun;
    time: string;
    color: string;
    gradientFrom: string;
    gradientTo: string;
    metrics: {
        completionRate: number;
        avgScore: number;
        avgTime: string;
        collaborators: number;
        checklistsDone: number;
    };
}

const shifts: ShiftData[] = [
    {
        id: "morning",
        name: "Manhã",
        icon: Sun,
        time: "06:00 – 14:00",
        color: "text-amber-500",
        gradientFrom: "from-amber-50",
        gradientTo: "to-orange-50",
        metrics: {
            completionRate: 94,
            avgScore: 88,
            avgTime: "12 min",
            collaborators: 8,
            checklistsDone: 156,
        },
    },
    {
        id: "afternoon",
        name: "Tarde",
        icon: Sunset,
        time: "14:00 – 22:00",
        color: "text-orange-500",
        gradientFrom: "from-orange-50",
        gradientTo: "to-red-50",
        metrics: {
            completionRate: 87,
            avgScore: 82,
            avgTime: "14 min",
            collaborators: 6,
            checklistsDone: 132,
        },
    },
    {
        id: "night",
        name: "Noite",
        icon: Moon,
        time: "22:00 – 06:00",
        color: "text-indigo-500",
        gradientFrom: "from-indigo-50",
        gradientTo: "to-purple-50",
        metrics: {
            completionRate: 78,
            avgScore: 75,
            avgTime: "18 min",
            collaborators: 4,
            checklistsDone: 84,
        },
    },
];

export function ShiftComparison() {
    const bestShift = shifts.reduce((a, b) => a.metrics.avgScore > b.metrics.avgScore ? a : b);

    return (
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-zinc-500" />
                        Comparativo por Turno
                    </h3>
                    <p className="text-sm text-zinc-500 mt-1">Últimos 30 dias</p>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-lg text-xs font-bold">
                    <Trophy className="w-3.5 h-3.5" />
                    Melhor: {bestShift.name}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {shifts.map((shift, i) => {
                    const Icon = shift.icon;
                    const isBest = shift.id === bestShift.id;

                    return (
                        <motion.div
                            key={shift.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={cn(
                                "relative rounded-2xl p-5 border-2 transition-all",
                                isBest
                                    ? "border-amber-300 dark:border-amber-700 bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-800"
                                    : "border-zinc-100 dark:border-zinc-800 bg-gradient-to-br dark:from-zinc-950 dark:to-zinc-900",
                                shift.gradientFrom,
                                shift.gradientTo
                            )}
                        >
                            {isBest && (
                                <div className="absolute -top-2.5 right-4 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                    🏆 MELHOR
                                </div>
                            )}

                            {/* Shift Header */}
                            <div className="flex items-center gap-3 mb-5">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-white/70 dark:bg-zinc-800 shadow-sm")}>
                                    <Icon className={cn("w-5 h-5", shift.color)} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-zinc-900 dark:text-zinc-50">{shift.name}</h4>
                                    <p className="text-[11px] text-zinc-400">{shift.time}</p>
                                </div>
                            </div>

                            {/* Metrics */}
                            <div className="space-y-3">
                                <MetricRow
                                    label="Taxa conclusão"
                                    value={`${shift.metrics.completionRate}%`}
                                    barPercent={shift.metrics.completionRate}
                                    barColor={shift.metrics.completionRate >= 90 ? "bg-emerald-500" : shift.metrics.completionRate >= 80 ? "bg-amber-500" : "bg-red-500"}
                                />
                                <MetricRow
                                    label="Score médio"
                                    value={`${shift.metrics.avgScore}`}
                                    barPercent={shift.metrics.avgScore}
                                    barColor={shift.metrics.avgScore >= 85 ? "bg-emerald-500" : shift.metrics.avgScore >= 70 ? "bg-amber-500" : "bg-red-500"}
                                />
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-500">⏱ Tempo médio</span>
                                    <span className="font-bold text-zinc-700 dark:text-zinc-300">{shift.metrics.avgTime}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-500">👥 Colaboradores</span>
                                    <span className="font-bold text-zinc-700 dark:text-zinc-300">{shift.metrics.collaborators}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-500">✅ Concluídos</span>
                                    <span className="font-bold text-zinc-700 dark:text-zinc-300">{shift.metrics.checklistsDone}</span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

function MetricRow({ label, value, barPercent, barColor }: { label: string; value: string; barPercent: number; barColor: string }) {
    return (
        <div>
            <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-zinc-500">{label}</span>
                <span className="font-bold text-zinc-700 dark:text-zinc-300">{value}</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-200/50 dark:bg-zinc-700/50 rounded-full overflow-hidden">
                <motion.div
                    className={cn("h-full rounded-full", barColor)}
                    initial={{ width: 0 }}
                    animate={{ width: `${barPercent}%` }}
                    transition={{ duration: 0.8 }}
                />
            </div>
        </div>
    );
}
