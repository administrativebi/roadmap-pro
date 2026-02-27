"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import {
    BarChart3,
    Building2,
    Users,
    TrendingUp,
    Shield,
    Calendar,
    FileDown,
    ChevronDown,
    MapPin,
    MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
} from "recharts";
import { ComplianceScore } from "@/components/analytics/ComplianceScore";
import { HeatmapGrid } from "@/components/analytics/HeatmapGrid";
import { ShiftComparison } from "@/components/analytics/ShiftComparison";
import { TrendAnalysis } from "@/components/analytics/TrendAnalysis";
import { NPSSurvey } from "@/components/analytics/NPSSurvey";
import { PDFReportGenerator } from "@/components/analytics/PDFReportGenerator";

// Mock data
const weeklyData = [
    { day: "Seg", conformidade: 78, checklists: 18 },
    { day: "Ter", conformidade: 82, checklists: 22 },
    { day: "Qua", conformidade: 85, checklists: 24 },
    { day: "Qui", conformidade: 80, checklists: 20 },
    { day: "Sex", conformidade: 88, checklists: 25 },
    { day: "Sáb", conformidade: 84, checklists: 15 },
    { day: "Dom", conformidade: 79, checklists: 12 },
];

const unitComparison = [
    { name: "Unidade Centro", score: 92, checklists: 156, ranking: 1 },
    { name: "Unidade Shopping", score: 87, checklists: 132, ranking: 2 },
    { name: "Unidade Bairro", score: 78, checklists: 98, ranking: 3 },
    { name: "Unidade Praia", score: 71, checklists: 84, ranking: 4 },
];

const topCollaborators = [
    { name: "Carlos Silva", avatar: "🧑‍🍳", score: 2840, streak: 12, checklists: 45 },
    { name: "Ana Souza", avatar: "👩‍🍳", score: 2650, streak: 8, checklists: 42 },
    { name: "Roberto Lima", avatar: "👨‍🍳", score: 2510, streak: 5, checklists: 38 },
    { name: "Maria Santos", avatar: "👩", score: 2380, streak: 3, checklists: 35 },
    { name: "Pedro Costa", avatar: "🧑", score: 2100, streak: 1, checklists: 30 },
];

export default function ManagerDashboard() {
    const [period, setPeriod] = useState("30d");
    const [stats, setStats] = useState({
        collabCount: 0,
        nonConformities: 0,
        checklistsCount: 0
    });
    const [topCollabs, setTopCollabs] = useState<any[]>([]);

    useEffect(() => {
        async function fetchDashboardData() {
            const supabase = createClient();

            // 1. Total de Colaboradores
            const { count: cCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

            // 2. Não Conformidades
            const { count: nfCount } = await supabase.from('checklist_responses').select('*', { count: 'exact', head: true }).eq('has_issue', true);

            // 3. Top Colaboradores (Order by XP)
            const { data: top } = await supabase.from('profiles')
                .select('name, total_xp, streak_days')
                .order('total_xp', { ascending: false })
                .limit(5);

            setStats({
                collabCount: cCount || 0,
                nonConformities: nfCount || 0,
                checklistsCount: 0
            });

            if (top) {
                const formattedTop = top.map((t, i) => ({
                    name: t.name || 'Sem Nome',
                    avatar: ["🧑‍🍳", "👩‍🍳", "👨‍🍳", "👩", "🧑"][i % 5], // mock avatar
                    score: t.total_xp || 0,
                    streak: t.streak_days || 0,
                    checklists: Math.floor(Math.random() * 20) + 10 // Mock até termos contagem real agregada
                }));
                setTopCollabs(formattedTop);
            }
        }
        fetchDashboardData();
    }, []);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-3 bg-zinc-100 dark:bg-zinc-800/50 w-max px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700/50">
                        <MapPin className="w-4 h-4 text-violet-500" />
                        <select className="bg-transparent border-none text-sm font-bold text-zinc-900 dark:text-zinc-50 outline-none cursor-pointer">
                            <option>Todas as Unidades (Rede)</option>
                            <option>Matriz Paulista</option>
                            <option>Filial Morumbi</option>
                            <option>Franquia Campinas</option>
                        </select>
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        Painel Corporativo Multi-unidade
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Conformidade e alertas de todas as 4 filiais.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => alert("Simulação: Envio de relatório PDF via disparo do WhatsApp Business API iniciado.")}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 font-bold shadow-lg shadow-emerald-500/20 text-sm"
                    >
                        <MessageCircle className="w-5 h-5" /> Zap Resumo
                    </button>
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 outline-none"
                    >
                        <option value="7d">Últimos 7 dias</option>
                        <option value="30d">Últimos 30 dias</option>
                        <option value="90d">Últimos 90 dias</option>
                    </select>
                </div>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <ComplianceScore score={87} previousScore={82} label="Score Geral" size="md" />

                <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Building2 className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm font-medium text-zinc-500">Unidades</span>
                    </div>
                    <p className="text-3xl font-black text-zinc-900 dark:text-zinc-50">4</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-emerald-500 font-semibold">
                        <TrendingUp className="w-3 h-3" />
                        Todas ativas
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm font-medium text-zinc-500">Colaboradores</span>
                    </div>
                    <p className="text-3xl font-black text-zinc-900 dark:text-zinc-50">{stats.collabCount}</p>
                    <p className="text-xs text-zinc-400 mt-1">Ativos na plataforma</p>
                </div>

                <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Shield className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm font-medium text-zinc-500">Não Conformidades</span>
                    </div>
                    <p className="text-3xl font-black text-red-500">{stats.nonConformities}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-red-500 font-semibold">
                        <TrendingUp className="w-3 h-3" />
                        Atenção necessária
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conformidade Semanal */}
                <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
                        📈 Conformidade Semanal
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={weeklyData}>
                            <defs>
                                <linearGradient id="gradConformidade" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                            <YAxis domain={[60, 100]} tick={{ fontSize: 12, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
                                labelStyle={{ fontWeight: "bold" }}
                            />
                            <Area type="monotone" dataKey="conformidade" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#gradConformidade)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Checklists por Dia */}
                <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
                        📊 Checklists por Dia
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
                            />
                            <Bar dataKey="checklists" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Unit Comparison */}
            <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-zinc-500" />
                    Comparativo entre Unidades
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {unitComparison.map((unit, i) => (
                        <motion.div
                            key={unit.name}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={cn(
                                "rounded-xl p-5 border-2 transition-all relative",
                                i === 0
                                    ? "border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-zinc-900 dark:to-zinc-800"
                                    : "border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                            )}
                        >
                            {i === 0 && (
                                <div className="absolute -top-2.5 right-3 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">🏆 #1</div>
                            )}
                            <p className="font-bold text-zinc-900 dark:text-zinc-50 text-sm mb-3">{unit.name}</p>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Score</span>
                                    <span className={cn("font-bold", unit.score >= 85 ? "text-emerald-500" : unit.score >= 70 ? "text-amber-500" : "text-red-500")}>{unit.score}</span>
                                </div>
                                <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                    <motion.div
                                        className={cn("h-full rounded-full", unit.score >= 85 ? "bg-emerald-500" : unit.score >= 70 ? "bg-amber-500" : "bg-red-500")}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${unit.score}%` }}
                                        transition={{ duration: 0.8 }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-zinc-400">
                                    <span>{unit.checklists} checklists</span>
                                    <span>#{unit.ranking}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Shift Comparison */}
            <ShiftComparison />

            {/* Two column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Collaborators */}
                <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-zinc-500" />
                        Top Colaboradores
                    </h3>
                    <div className="space-y-3">
                        {topCollabs.length > 0 ? topCollabs.map((collab, i) => (
                            <motion.div
                                key={collab.name + i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className="flex items-center gap-3"
                            >
                                <span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                                    i === 0 ? "bg-amber-100 text-amber-600" : i === 1 ? "bg-zinc-200 text-zinc-600" : i === 2 ? "bg-orange-100 text-orange-600" : "bg-zinc-100 text-zinc-400"
                                )}>
                                    {i + 1}
                                </span>
                                <span className="text-2xl shrink-0">{collab.avatar}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 truncate">{collab.name}</p>
                                    <p className="text-[10px] text-zinc-400">
                                        {collab.checklists} checklists • 🔥 {collab.streak} dias
                                    </p>
                                </div>
                                <span className="text-sm font-bold text-amber-500">{collab.score.toLocaleString()} XP</span>
                            </motion.div>
                        )) : (
                            <p className="text-zinc-500 text-sm text-center py-4">Carregando ranking...</p>
                        )}
                    </div>
                </div>

                {/* NPS Survey */}
                <NPSSurvey />
            </div>

            {/* Trend Analysis */}
            <TrendAnalysis />

            {/* Heatmap */}
            <HeatmapGrid />

            {/* PDF Report */}
            <PDFReportGenerator />
        </div>
    );
}
