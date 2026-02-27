"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Crown, Filter, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type RankingUser = {
    id: string;
    full_name: string;
    avatar_url: string | null;
    global_score: number;
    sector: string;
};

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
    const supabase = createClient();
    const [selectedSector, setSelectedSector] = useState<string>("Todos");
    const [ranking, setRanking] = useState<RankingUser[]>([]);
    const [sectors, setSectors] = useState<string[]>(["Todos"]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRanking();
    }, []);

    const fetchRanking = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    id,
                    name,
                    avatar_url,
                    total_xp,
                    sectors ( name )
                `)
                .order('total_xp', { ascending: false });

            if (error) throw error;

            if (data) {
                const formattedRanking: RankingUser[] = data.map((u: any) => ({
                    id: u.id,
                    full_name: u.name || "Colaborador",
                    avatar_url: u.avatar_url,
                    global_score: u.total_xp || 0,
                    sector: u.sectors?.name || "Geral"
                }));

                setRanking(formattedRanking);

                // Build unique sectors
                const uniqueSectors = Array.from(new Set(formattedRanking.map(u => u.sector)));
                setSectors(["Todos", ...uniqueSectors]);
            }
        } catch (error) {
            console.error("Erro ao carregar ranking", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredRanking = selectedSector === "Todos"
        ? ranking
        : ranking.filter(user => user.sector === selectedSector);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
                <p className="text-zinc-500 font-medium">Carregando o ranking dos melhores...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header & Filter */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                        <Trophy className="w-8 h-8 text-amber-500" />
                        Ranking Global
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        Competição saudável entre a equipe
                    </p>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    <Filter className="w-4 h-4 text-zinc-400 hidden sm:block" />
                    {sectors.map(sector => (
                        <button
                            key={sector}
                            onClick={() => setSelectedSector(sector)}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap",
                                selectedSector === sector
                                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            )}
                        >
                            {sector}
                        </button>
                    ))}
                </div>
            </div>

            {/* Top 3 Podium */}
            {filteredRanking.length >= 3 && (
                <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto items-end pt-8">
                    {[1, 0, 2].map((idx, index) => {
                        const rank = filteredRanking[idx];
                        if (!rank) return <div key={index} />;
                        const badge = badgeConfig[idx];
                        const BadgeIcon = badge.icon;

                        return (
                            <motion.div
                                key={rank.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.15 }}
                                className={cn(
                                    "flex flex-col items-center p-4 sm:p-6 rounded-t-2xl border transition-all relative overflow-hidden",
                                    badge.bg,
                                    idx === 0 ? "h-64 sm:h-72 shadow-2xl z-10 -mx-2 bg-gradient-to-t from-amber-100 to-amber-50 dark:from-amber-900 dark:to-amber-950" : "h-52 sm:h-60"
                                )}
                            >
                                <div className={cn("mb-2 absolute top-4", badge.color)}>
                                    <BadgeIcon className={cn(idx === 0 ? "w-10 h-10" : "w-8 h-8")} />
                                </div>

                                <div className={cn(
                                    "rounded-full flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-300 mt-12 sm:mt-16 bg-white dark:bg-zinc-800 shadow-inner",
                                    idx === 0 ? "w-20 h-20 text-3xl" : "w-16 h-16 text-xl"
                                )}>
                                    {getInitials(rank.full_name)}
                                </div>
                                <p className="font-bold text-zinc-900 dark:text-zinc-50 text-sm text-center mt-3 truncate w-full">
                                    {rank.full_name}
                                </p>
                                <p className="text-xs text-zinc-500 truncate w-full text-center">
                                    {rank.sector}
                                </p>
                                <p className="text-lg sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-auto">
                                    {rank.global_score.toLocaleString("pt-BR")}
                                </p>
                                <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">pontos</p>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Full Ranking List */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 overflow-hidden max-w-2xl mx-auto"
            >
                <AnimatePresence mode="popLayout">
                    {filteredRanking.map((user, i) => (
                        <motion.div
                            key={user.id}
                            variants={itemVariants}
                            layout
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={cn(
                                "flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 border-b border-zinc-50 dark:border-zinc-900 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors",
                                i < 3 && filteredRanking.length >= 3 ? "bg-zinc-50/50 dark:bg-zinc-900/30" : ""
                            )}
                        >
                            <span
                                className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0",
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

                            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-600 dark:text-zinc-300 shrink-0">
                                {getInitials(user.full_name)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-zinc-900 dark:text-zinc-50 text-sm truncate">
                                    {user.full_name}
                                </p>
                                <p className="text-xs text-zinc-500 truncate">
                                    Setor: {user.sector}
                                </p>
                            </div>

                            <div className="text-right shrink-0">
                                <p className="font-bold text-amber-600 dark:text-amber-500 tabular-nums">
                                    {user.global_score.toLocaleString("pt-BR")}
                                </p>
                                <p className="text-[10px] text-zinc-400">pts</p>
                            </div>
                        </motion.div>
                    ))}
                    {filteredRanking.length === 0 && (
                        <div className="px-6 py-12 text-center text-zinc-500">
                            Nenhum colaborador encontrado neste setor.
                        </div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
