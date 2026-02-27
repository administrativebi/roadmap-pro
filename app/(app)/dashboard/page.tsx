"use client";

import { motion } from "framer-motion";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    RadialBarChart,
    RadialBar,
} from "recharts";
import {
    ClipboardCheck,
    TrendingUp,
    Target,
    Award,
    Flame,
    Zap,
    Star,
    CalendarDays,
    ArrowRight,
    Crown,
    Trophy,
    CheckCircle2,
    Clock,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const mockChartData = [
    { date: "01/02", completed: 5, total: 8 },
    { date: "02/02", completed: 7, total: 9 },
    { date: "03/02", completed: 4, total: 6 },
    { date: "04/02", completed: 8, total: 10 },
    { date: "05/02", completed: 6, total: 7 },
    { date: "06/02", completed: 9, total: 9 },
    { date: "07/02", completed: 10, total: 12 },
    { date: "08/02", completed: 7, total: 8 },
    { date: "09/02", completed: 11, total: 13 },
    { date: "10/02", completed: 8, total: 10 },
    { date: "11/02", completed: 12, total: 14 },
    { date: "12/02", completed: 9, total: 11 },
    { date: "13/02", completed: 13, total: 15 },
    { date: "14/02", completed: 10, total: 12 },
];

const stats = [
    {
        label: "Checklists Concluídos",
        value: "128",
        change: "+12%",
        icon: ClipboardCheck,
        color: "from-emerald-400 to-teal-500",
        iconBg: "bg-emerald-500",
    },
    {
        label: "Taxa de Conclusão",
        value: "87%",
        change: "+5%",
        icon: TrendingUp,
        color: "from-blue-400 to-indigo-500",
        iconBg: "bg-blue-500",
    },
    {
        label: "Pontuação Média",
        value: "92",
        change: "+8 pts",
        icon: Target,
        color: "from-amber-400 to-orange-500",
        iconBg: "bg-amber-500",
    },
    {
        label: "Seu Ranking",
        value: "#3",
        change: "↑ 2 posições",
        icon: Award,
        color: "from-purple-400 to-pink-500",
        iconBg: "bg-purple-500",
    },
];

// Top 3 ranking
const topRanking = [
    { name: "Carlos Silva", score: 2850, avatar: "CS" },
    { name: "Ana Beatriz", score: 2640, avatar: "AB" },
    { name: "Você", score: 2510, avatar: "RS", isYou: true },
];

// Próximos checklists
const upcomingSchedules = [
    { title: "Controle APPCC", time: "10:00", difficulty: "hard" as const, icon: "🔬" },
    { title: "Fechamento Diário", time: "22:00", difficulty: "medium" as const, icon: "🌙" },
    { title: "Inspeção Mensal", time: "09:00", difficulty: "hard" as const, icon: "📋" },
];

const diffColors = {
    easy: "text-emerald-500",
    medium: "text-amber-500",
    hard: "text-red-500",
};

// Radial chart for completion rate
const radialData = [
    { name: "Conclusão", value: 87, fill: "#18181b" },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
    const supabase = createClient();
    const [profile, setProfile] = useState<any>(null);
    const [statsData, setStatsData] = useState({
        completed: 0,
        rate: "0%",
        score: "0",
        rank: "#-"
    });
    const [topRankingData, setTopRankingData] = useState<any[]>([]);

    useEffect(() => {
        async function loadDashboardData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Profile
            const { data: p } = await supabase
                .from("profiles")
                .select("id, name, level, total_xp, streak_days")
                .eq("id", user.id)
                .single();
            setProfile(p);

            // 2. Rankings
            const { data: allProfiles } = await supabase
                .from("profiles")
                .select("id, name, total_xp")
                .order("total_xp", { ascending: false });

            if (allProfiles) {
                const userRankIndex = allProfiles.findIndex(x => x.id === user.id);
                const userRank = userRankIndex >= 0 ? userRankIndex + 1 : "-";

                // Format Top 3
                const top3 = allProfiles.slice(0, 3).map(x => ({
                    id: x.id,
                    name: x.name,
                    score: x.total_xp || 0,
                    avatar: x.name ? x.name.substring(0, 2).toUpperCase() : "NA",
                    isYou: x.id === user.id
                }));

                // If user is not in top 3, we can optionally append them, but mock layout only expects 3
                setTopRankingData(top3);

                // Checklists concluídos pelo user
                const { count: checklistsCount } = await supabase
                    .from("checklists")
                    .select("*", { count: "exact", head: true })
                    .eq("assigned_to", user.id)
                    .eq("status", "completed");

                setStatsData({
                    completed: checklistsCount || 0,
                    rate: "87%", // Mock
                    score: "92", // Mock
                    rank: `#${userRank}`
                });
            }
        }
        loadDashboardData();
    }, [supabase]);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Welcome Header com Streak */}
            <motion.div
                variants={itemVariants}
                className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 dark:from-zinc-100 dark:via-zinc-200 dark:to-zinc-100 rounded-2xl p-6 text-white dark:text-zinc-900 shadow-xl"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Olá, {profile ? profile.name?.split(' ')[0] : "Colaborador"}! 👋</h1>
                        <p className="text-zinc-400 dark:text-zinc-500 mt-1 text-sm">
                            Visão geral da produtividade do seu restaurante
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-xl p-4 text-center shadow-lg">
                            <Flame className="w-6 h-6 text-white mx-auto mb-1" />
                            <p className="text-xl font-black text-white">{profile ? profile.streak_days : "0"}</p>
                            <p className="text-[10px] text-white/70 font-semibold">DIAS</p>
                        </div>
                        <div className="bg-white/10 dark:bg-black/10 rounded-xl p-4 text-center backdrop-blur-sm">
                            <Star className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                            <p className="text-xl font-black">{profile ? profile.total_xp.toLocaleString('pt-BR') : "0"}</p>
                            <p className="text-[10px] text-white/50 dark:text-zinc-500 font-semibold">XP TOTAL</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid com Gradients */}
            <motion.div
                variants={containerVariants}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
                {/* Checklists Concluídos */}
                <motion.div variants={itemVariants} whileHover={{ y: -4, scale: 1.02 }} className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-5 hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500">
                            <ClipboardCheck className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-zinc-900 dark:text-zinc-50">{statsData.completed}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Checklists Concluídos</p>
                </motion.div>

                {/* Taxa de Conclusão */}
                <motion.div variants={itemVariants} whileHover={{ y: -4, scale: 1.02 }} className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-5 hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-zinc-900 dark:text-zinc-50">{statsData.rate}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Taxa de Conclusão</p>
                </motion.div>

                {/* Score */}
                <motion.div variants={itemVariants} whileHover={{ y: -4, scale: 1.02 }} className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-5 hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500">
                            <Target className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-zinc-900 dark:text-zinc-50">{statsData.score}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Pontuação Média</p>
                </motion.div>

                {/* Seu Ranking */}
                <motion.div variants={itemVariants} whileHover={{ y: -4, scale: 1.02 }} className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-5 hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500">
                            <Award className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-zinc-900 dark:text-zinc-50">{statsData.rank}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Seu Ranking</p>
                </motion.div>
            </motion.div>

            {/* Desafios Semanais */}
            <motion.div variants={itemVariants} className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="w-5 h-5 text-indigo-200" />
                            <h3 className="text-lg font-bold">Desafios Semanais</h3>
                            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold ml-2">Termina em 2 dias</span>
                        </div>
                        <p className="text-sm text-indigo-100">Complete missões temporárias para ganhar XP bônus e subir de liga mais rápido.</p>

                        <div className="mt-4 flex flex-col gap-3">
                            {/* Desafio 1 */}
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center gap-4">
                                <div className="bg-indigo-900/50 p-2 rounded-lg text-xl">📸</div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-sm font-bold">Fotógrafo Ágil</p>
                                        <p className="text-xs font-bold text-amber-300">+500 XP</p>
                                    </div>
                                    <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400" style={{ width: "80%" }} />
                                    </div>
                                    <p className="text-[10px] text-indigo-200 mt-1">Acrescente fotos em 4/5 checklists</p>
                                </div>
                            </div>
                            {/* Desafio 2 */}
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center gap-4 opacity-70">
                                <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-300"><CheckCircle2 className="w-5 h-5" /></div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-sm font-bold line-through">Mestre da Abertura</p>
                                        <p className="text-xs font-bold text-emerald-300">Concluído</p>
                                    </div>
                                    <div className="w-full h-1.5 bg-emerald-500/30 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-400" style={{ width: "100%" }} />
                                    </div>
                                    <p className="text-[10px] text-indigo-200 mt-1">Completou 7/7 aberturas na semana</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center shrink-0 border border-white/20">
                        <p className="text-xs text-indigo-200 font-bold uppercase tracking-wider mb-2">Recompensa Final</p>
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-300 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white/20 mb-2">
                            <span className="text-3xl">🏆</span>
                        </div>
                        <p className="font-black text-xl text-white">+2000 XP</p>
                        <p className="text-[10px] text-indigo-200">2/3 Desafios Completos</p>
                    </div>
                </div>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart: Produtividade (2 colunas) */}
                <motion.div
                    variants={itemVariants}
                    className="lg:col-span-2 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6"
                >
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                        📊 Produtividade (14 dias)
                    </h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={mockChartData}>
                            <defs>
                                <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                            <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                            <Tooltip
                                contentStyle={{
                                    background: "#18181b",
                                    border: "none",
                                    borderRadius: "12px",
                                    fontSize: "12px",
                                    color: "#fff",
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="completed"
                                stroke="#f59e0b"
                                strokeWidth={3}
                                fill="url(#gradientArea)"
                                name="Concluídos"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Próximos Checklists */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                            <CalendarDays className="w-5 h-5 text-zinc-400" />
                            Próximos
                        </h3>
                        <Link href="/schedule" className="text-xs text-amber-500 font-semibold hover:text-amber-600 flex items-center gap-1">
                            Ver agenda <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {upcomingSchedules.map((s, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ x: 4 }}
                                className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl cursor-pointer hover:shadow-md transition-all"
                            >
                                <span className="text-2xl">{s.icon}</span>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{s.title}</p>
                                    <p className="text-xs text-zinc-400">{s.time}</p>
                                </div>
                                <span className={cn("text-xs font-bold", diffColors[s.difficulty])}>
                                    {s.difficulty === "hard" ? "🔥" : s.difficulty === "medium" ? "⚡" : "🌱"}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Barra Chart */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6"
                >
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                        📈 Concluídos vs Total
                    </h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={mockChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                            <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                            <Tooltip
                                contentStyle={{
                                    background: "#18181b",
                                    border: "none",
                                    borderRadius: "12px",
                                    fontSize: "12px",
                                    color: "#fff",
                                }}
                            />
                            <Bar dataKey="total" fill="#e4e4e7" radius={[6, 6, 0, 0]} name="Total" />
                            <Bar dataKey="completed" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Concluídos" />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Mini Ranking */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-amber-500" />
                            Top Ranking
                        </h3>
                        <Link href="/ranking" className="text-xs text-amber-500 font-semibold hover:text-amber-600 flex items-center gap-1">
                            Ver tudo <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {topRankingData.length > 0 ? topRankingData.map((user, i) => (
                            <motion.div
                                key={user.id || i}
                                whileHover={{ x: 4 }}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl transition-all",
                                    user.isYou
                                        ? "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800"
                                        : "bg-zinc-50 dark:bg-zinc-900/50"
                                )}
                            >
                                <span className={cn(
                                    "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black",
                                    i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-zinc-100 text-zinc-500" : "bg-orange-100 text-orange-700"
                                )}>
                                    {i === 0 ? <Crown className="w-4 h-4" /> : i + 1}
                                </span>
                                <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300">
                                    {user.avatar}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={cn("text-sm font-semibold truncate", user.isYou ? "text-amber-700 dark:text-amber-300" : "text-zinc-900 dark:text-zinc-50")}>
                                        {user.name}
                                        {user.isYou && <span className="ml-1.5 text-[10px] bg-amber-200 dark:bg-amber-800 px-1.5 py-0.5 rounded-full text-amber-800 dark:text-amber-200">Você</span>}
                                    </p>
                                </div>
                                <p className="font-bold text-zinc-900 dark:text-zinc-50 tabular-nums text-sm shrink-0">
                                    {user.score.toLocaleString("pt-BR")}
                                </p>
                            </motion.div>
                        )) : (
                            <p className="text-zinc-500 text-sm text-center py-4">Carregando...</p>
                        )}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
