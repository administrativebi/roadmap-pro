"use client";

import { motion } from "framer-motion";
import { Trophy, Medal, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock ranking — em produção viria da Server Action getGlobalRanking
const mockRanking = [
    { id: "u1", full_name: "Carlos Silva", avatar_url: null, global_score: 2850 },
    { id: "u2", full_name: "Ana Beatriz", avatar_url: null, global_score: 2640 },
    { id: "u3", full_name: "Roberto Santos", avatar_url: null, global_score: 2510 },
    { id: "u4", full_name: "Maria Oliveira", avatar_url: null, global_score: 2230 },
    { id: "u5", full_name: "João Pedro", avatar_url: null, global_score: 2100 },
    { id: "u6", full_name: "Fernanda Lima", avatar_url: null, global_score: 1980 },
    { id: "u7", full_name: "Lucas Mendes", avatar_url: null, global_score: 1850 },
    { id: "u8", full_name: "Juliana Costa", avatar_url: null, global_score: 1720 },
    { id: "u9", full_name: "Pedro Henrique", avatar_url: null, global_score: 1600 },
    { id: "u10", full_name: "Camila Souza", avatar_url: null, global_score: 1490 },
];

const badgeConfig: Record<number, { icon: typeof Crown; color: string; bg: string; label: string }> = {
    0: { icon: Crown, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800", label: "1º" },
    1: { icon: Medal, color: "text-zinc-400", bg: "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800", label: "2º" },
    2: { icon: Medal, color: "text-amber-700", bg: "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800", label: "3º" },
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
};

function getInitials(name: string) {
    return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
}

export default function RankingPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Ranking Global
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                    Competição saudável entre a equipe
                </p>
            </div>

            {/* Top 3 Podium */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                {mockRanking.slice(0, 3).map((user, i) => {
                    const order = [1, 0, 2]; // Exibir 2º, 1º, 3º (podium visual)
                    const idx = order[i];
                    const rank = mockRanking[idx];
                    const badge = badgeConfig[idx];
                    const BadgeIcon = badge.icon;

                    return (
                        <motion.div
                            key={rank.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.15 }}
                            className={cn(
                                "flex flex-col items-center p-6 rounded-2xl border transition-all",
                                badge.bg,
                                idx === 0 ? "scale-105 shadow-lg" : ""
                            )}
                        >
                            <div className={cn("mb-2", badge.color)}>
                                <BadgeIcon className="w-8 h-8" />
                            </div>
                            <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xl font-bold text-zinc-600 dark:text-zinc-300 mb-3">
                                {getInitials(rank.full_name)}
                            </div>
                            <p className="font-bold text-zinc-900 dark:text-zinc-50 text-sm text-center">
                                {rank.full_name}
                            </p>
                            <p className="text-lg font-black text-zinc-900 dark:text-zinc-50 mt-1">
                                {rank.global_score.toLocaleString("pt-BR")}
                            </p>
                            <p className="text-xs text-zinc-400">pontos</p>
                        </motion.div>
                    );
                })}
            </div>

            {/* Full Ranking List */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 overflow-hidden max-w-2xl mx-auto"
            >
                {mockRanking.map((user, i) => (
                    <motion.div
                        key={user.id}
                        variants={itemVariants}
                        className={cn(
                            "flex items-center gap-4 px-6 py-4 border-b border-zinc-50 dark:border-zinc-900 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors",
                            i < 3 ? "bg-zinc-50/50 dark:bg-zinc-900/30" : ""
                        )}
                    >
                        <span
                            className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                                i === 0
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                                    : i === 1
                                        ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                                        : i === 2
                                            ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                                            : "bg-zinc-50 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500"
                            )}
                        >
                            {i + 1}
                        </span>
                        <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-600 dark:text-zinc-300">
                            {getInitials(user.full_name)}
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-zinc-900 dark:text-zinc-50 text-sm">
                                {user.full_name}
                            </p>
                        </div>
                        <p className="font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">
                            {user.global_score.toLocaleString("pt-BR")}
                        </p>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}
