"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
    BarChart3, TrendingUp, TrendingDown, ClipboardCheck, Target,
    Users, Calendar, Clock, ChevronDown, Filter, Loader2,
    CheckCircle2, AlertTriangle, XCircle, ArrowUpRight, ArrowDownRight,
    Activity, Award, Zap, PieChart
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistRecord {
    id: string;
    template_id: string;
    user_id: string;
    sector_id: string | null;
    status: string;
    score: number | null;
    started_at: string;
    completed_at: string | null;
    template?: { title: string; sector_id?: string };
    profile?: { name: string };
}

interface Sector {
    id: string;
    name: string;
}

export default function ChecklistDashboardPage() {
    const supabase = createClient();
    const [checklists, setChecklists] = useState<ChecklistRecord[]>([]);
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [selectedSector, setSelectedSector] = useState<string>("all");
    const [period, setPeriod] = useState<string>("30d");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load sectors
            const { data: sectorData } = await supabase
                .from("sectors")
                .select("id, name")
                .order("name");
            setSectors(sectorData || []);

            // Load all checklists with template and profile info
            const { data: checklistData } = await supabase
                .from("checklists")
                .select(`
                    id, template_id, user_id, sector_id, status, score, started_at, completed_at,
                    template:checklist_templates(title, sector_id),
                    profile:profiles!checklists_user_id_fkey(name)
                `)
                .order("started_at", { ascending: false });

            // Normalize joined data
            const normalized = (checklistData || []).map((c: any) => ({
                ...c,
                template: Array.isArray(c.template) ? c.template[0] : c.template,
                profile: Array.isArray(c.profile) ? c.profile[0] : c.profile,
            }));

            setChecklists(normalized);
        } catch (err) {
            console.error("Erro ao carregar dados:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Period filter
    const periodStart = useMemo(() => {
        const now = new Date();
        switch (period) {
            case "7d": return new Date(now.getTime() - 7 * 86400000);
            case "30d": return new Date(now.getTime() - 30 * 86400000);
            case "90d": return new Date(now.getTime() - 90 * 86400000);
            case "365d": return new Date(now.getTime() - 365 * 86400000);
            default: return new Date(now.getTime() - 30 * 86400000);
        }
    }, [period]);

    // Filtered data
    const filtered = useMemo(() => {
        return checklists.filter(c => {
            const inPeriod = new Date(c.started_at) >= periodStart;
            const inSector = selectedSector === "all" || c.sector_id === selectedSector || c.template?.sector_id === selectedSector;
            return inPeriod && inSector;
        });
    }, [checklists, periodStart, selectedSector]);

    const completed = filtered.filter(c => c.status === "completed");
    const inProgress = filtered.filter(c => c.status === "in_progress");
    const totalPlanned = filtered.length;
    const totalCompleted = completed.length;
    const efficiency = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;

    // Calculate avg score properly
    const averageScore = useMemo(() => {
        const withScore = completed.filter(c => c.score !== null && c.score !== undefined);
        if (withScore.length === 0) return 0;
        return Math.round(withScore.reduce((sum, c) => sum + (c.score || 0), 0) / withScore.length);
    }, [completed]);

    // Previous period for comparison
    const prevPeriodStart = useMemo(() => {
        const diff = new Date().getTime() - periodStart.getTime();
        return new Date(periodStart.getTime() - diff);
    }, [periodStart]);

    const prevFiltered = useMemo(() => {
        return checklists.filter(c => {
            const d = new Date(c.started_at);
            const inPeriod = d >= prevPeriodStart && d < periodStart;
            const inSector = selectedSector === "all" || c.sector_id === selectedSector || c.template?.sector_id === selectedSector;
            return inPeriod && inSector;
        });
    }, [checklists, prevPeriodStart, periodStart, selectedSector]);

    const prevCompleted = prevFiltered.filter(c => c.status === "completed");
    const prevAvgScore = useMemo(() => {
        const withScore = prevCompleted.filter(c => c.score !== null);
        if (withScore.length === 0) return 0;
        return Math.round(withScore.reduce((sum, c) => sum + (c.score || 0), 0) / withScore.length);
    }, [prevCompleted]);

    const scoreTrend = averageScore - prevAvgScore;
    const completedTrend = totalCompleted - prevCompleted.length;

    // User performance
    const userStats = useMemo(() => {
        const map = new Map<string, { name: string; count: number; totalScore: number; scores: number[] }>();
        completed.forEach(c => {
            const uid = c.user_id;
            const name = c.profile?.name || "Sem nome";
            if (!map.has(uid)) map.set(uid, { name, count: 0, totalScore: 0, scores: [] });
            const entry = map.get(uid)!;
            entry.count++;
            entry.totalScore += c.score || 0;
            entry.scores.push(c.score || 0);
        });
        return Array.from(map.values())
            .map(u => ({ ...u, avgScore: Math.round(u.totalScore / u.count) }))
            .sort((a, b) => b.count - a.count);
    }, [completed]);

    // Score distribution
    const scoreDistribution = useMemo(() => {
        const ranges = [
            { label: "90-100%", min: 90, max: 100, color: "bg-emerald-500", count: 0 },
            { label: "70-89%", min: 70, max: 89, color: "bg-blue-500", count: 0 },
            { label: "50-69%", min: 50, max: 69, color: "bg-amber-500", count: 0 },
            { label: "0-49%", min: 0, max: 49, color: "bg-rose-500", count: 0 },
        ];
        completed.forEach(c => {
            const s = c.score || 0;
            const range = ranges.find(r => s >= r.min && s <= r.max);
            if (range) range.count++;
        });
        return ranges;
    }, [completed]);

    // Score over time (last N entries grouped by day)
    const scoreOverTime = useMemo(() => {
        const dayMap = new Map<string, { total: number; count: number }>();
        completed.sort((a, b) => new Date(a.completed_at!).getTime() - new Date(b.completed_at!).getTime()).forEach(c => {
            const day = new Date(c.completed_at!).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
            if (!dayMap.has(day)) dayMap.set(day, { total: 0, count: 0 });
            const entry = dayMap.get(day)!;
            entry.total += c.score || 0;
            entry.count++;
        });
        return Array.from(dayMap.entries()).map(([day, val]) => ({
            day,
            avg: Math.round(val.total / val.count),
            count: val.count
        })).slice(-15);
    }, [completed]);

    // Recent & upcoming
    const recentCompleted = completed.slice(0, 5);
    const upcoming = inProgress.slice(0, 5);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        Dashboard de Checklists
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">Análise completa de desempenho e resultados</p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-950 rounded-xl px-3 py-2 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <Filter className="w-4 h-4 text-zinc-400" />
                        <select
                            value={selectedSector}
                            onChange={e => setSelectedSector(e.target.value)}
                            className="text-sm bg-transparent border-none focus:outline-none text-zinc-700 dark:text-zinc-300 font-medium"
                        >
                            <option value="all">Todos os setores</option>
                            {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-950 rounded-xl px-3 py-2 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <Calendar className="w-4 h-4 text-zinc-400" />
                        <select
                            value={period}
                            onChange={e => setPeriod(e.target.value)}
                            className="text-sm bg-transparent border-none focus:outline-none text-zinc-700 dark:text-zinc-300 font-medium"
                        >
                            <option value="7d">Últimos 7 dias</option>
                            <option value="30d">Últimos 30 dias</option>
                            <option value="90d">Últimos 90 dias</option>
                            <option value="365d">Último ano</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total realizados */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-zinc-950 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/50 rounded-xl flex items-center justify-center">
                            <ClipboardCheck className="w-5 h-5 text-blue-500" />
                        </div>
                        {completedTrend !== 0 && (
                            <span className={cn("text-xs font-bold flex items-center gap-0.5 px-2 py-1 rounded-lg",
                                completedTrend > 0
                                    ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400"
                                    : "text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400"
                            )}>
                                {completedTrend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {Math.abs(completedTrend)}
                            </span>
                        )}
                    </div>
                    <p className="text-3xl font-black text-zinc-900 dark:text-white">{totalCompleted}</p>
                    <p className="text-xs text-zinc-500 font-medium mt-1">Checklists Realizados</p>
                </motion.div>

                {/* Eficiência */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-zinc-950 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl flex items-center justify-center">
                            <Target className="w-5 h-5 text-emerald-500" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-zinc-900 dark:text-white">{efficiency}%</p>
                    <p className="text-xs text-zinc-500 font-medium mt-1">Eficiência (realizados/total)</p>
                    <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${efficiency}%` }} />
                    </div>
                </motion.div>

                {/* Média de Score */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-zinc-950 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/50 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-amber-500" />
                        </div>
                        {scoreTrend !== 0 && (
                            <span className={cn("text-xs font-bold flex items-center gap-0.5 px-2 py-1 rounded-lg",
                                scoreTrend > 0
                                    ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400"
                                    : "text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400"
                            )}>
                                {scoreTrend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {Math.abs(scoreTrend)}%
                            </span>
                        )}
                    </div>
                    <p className="text-3xl font-black text-zinc-900 dark:text-white">{averageScore}%</p>
                    <p className="text-xs text-zinc-500 font-medium mt-1">Média de Score</p>
                </motion.div>

                {/* Em Andamento */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-zinc-950 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-violet-50 dark:bg-violet-950/50 rounded-xl flex items-center justify-center">
                            <Activity className="w-5 h-5 text-violet-500" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-zinc-900 dark:text-white">{inProgress.length}</p>
                    <p className="text-xs text-zinc-500 font-medium mt-1">Em Andamento</p>
                </motion.div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Score Over Time */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 bg-white dark:bg-zinc-950 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm"
                >
                    <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        Evolução do Score ao Longo do Tempo
                    </h3>
                    {scoreOverTime.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-zinc-400 text-sm">
                            Sem dados suficientes para exibir o gráfico
                        </div>
                    ) : (
                        <div className="flex items-end gap-1.5 h-48">
                            {scoreOverTime.map((entry, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                                    <span className="text-[10px] font-bold text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {entry.avg}%
                                    </span>
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${Math.max(entry.avg * 1.6, 8)}px` }}
                                        transition={{ delay: 0.5 + i * 0.05, duration: 0.5, ease: "easeOut" }}
                                        className={cn(
                                            "w-full rounded-t-lg cursor-pointer transition-all",
                                            entry.avg >= 90 ? "bg-emerald-400 hover:bg-emerald-500" :
                                                entry.avg >= 70 ? "bg-blue-400 hover:bg-blue-500" :
                                                    entry.avg >= 50 ? "bg-amber-400 hover:bg-amber-500" :
                                                        "bg-rose-400 hover:bg-rose-500"
                                        )}
                                        title={`${entry.day}: ${entry.avg}% (${entry.count} checklist${entry.count > 1 ? 's' : ''})`}
                                    />
                                    <span className="text-[9px] text-zinc-400 -rotate-45 origin-left whitespace-nowrap">
                                        {entry.day}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Score Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm"
                >
                    <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
                        <PieChart className="w-5 h-5 text-violet-500" />
                        Distribuição de Scores
                    </h3>
                    <div className="space-y-3">
                        {scoreDistribution.map((range, i) => {
                            const pct = completed.length > 0 ? Math.round((range.count / completed.length) * 100) : 0;
                            return (
                                <div key={i}>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">{range.label}</span>
                                        <span className="text-zinc-400 text-xs">{range.count} ({pct}%)</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                                            className={cn("h-full rounded-full", range.color)}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
                        <p className="text-xs text-zinc-400">Total analisado</p>
                        <p className="text-2xl font-black text-zinc-900 dark:text-white">{completed.length}</p>
                    </div>
                </motion.div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* User Performance */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm"
                >
                    <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-cyan-500" />
                        Desempenho por Usuário
                    </h3>
                    {userStats.length === 0 ? (
                        <p className="text-sm text-zinc-400 text-center py-8">Sem dados para exibir</p>
                    ) : (
                        <div className="space-y-3 max-h-72 overflow-y-auto">
                            {userStats.slice(0, 10).map((user, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white shrink-0",
                                        i === 0 ? "bg-gradient-to-br from-amber-400 to-orange-500" :
                                            i === 1 ? "bg-gradient-to-br from-zinc-300 to-zinc-400" :
                                                i === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700" :
                                                    "bg-zinc-300 dark:bg-zinc-700"
                                    )}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{user.name}</p>
                                        <p className="text-[10px] text-zinc-400">{user.count} checklist{user.count !== 1 ? 's' : ''}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn("text-sm font-black",
                                            user.avgScore >= 90 ? "text-emerald-500" :
                                                user.avgScore >= 70 ? "text-blue-500" :
                                                    user.avgScore >= 50 ? "text-amber-500" : "text-rose-500"
                                        )}>
                                            {user.avgScore}%
                                        </p>
                                        <p className="text-[10px] text-zinc-400">média</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Recent Checklists */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm"
                >
                    <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        Últimos Realizados
                    </h3>
                    {recentCompleted.length === 0 ? (
                        <p className="text-sm text-zinc-400 text-center py-8">Nenhum checklist concluído</p>
                    ) : (
                        <div className="space-y-3 max-h-72 overflow-y-auto">
                            {recentCompleted.map(c => (
                                <div key={c.id} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0",
                                        (c.score || 0) >= 90 ? "bg-emerald-500" :
                                            (c.score || 0) >= 70 ? "bg-blue-500" :
                                                (c.score || 0) >= 50 ? "bg-amber-500" : "bg-rose-500"
                                    )}>
                                        {c.score ?? 0}%
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                                            {c.template?.title || "Sem título"}
                                        </p>
                                        <p className="text-[10px] text-zinc-400">
                                            {c.profile?.name} • {c.completed_at ? new Date(c.completed_at).toLocaleDateString("pt-BR") : "—"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* In Progress */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm"
                >
                    <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-orange-500" />
                        Em Andamento
                    </h3>
                    {upcoming.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-3">
                                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                            </div>
                            <p className="text-sm text-zinc-400 font-medium">Nenhum checklist pendente</p>
                            <p className="text-xs text-zinc-400 mt-1">Tudo em dia! 🎉</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-72 overflow-y-auto">
                            {upcoming.map(c => (
                                <div key={c.id} className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/30">
                                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center shrink-0">
                                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                                            {c.template?.title || "Sem título"}
                                        </p>
                                        <p className="text-[10px] text-amber-600 dark:text-amber-400">
                                            Iniciado {new Date(c.started_at).toLocaleDateString("pt-BR")} • {c.profile?.name}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
