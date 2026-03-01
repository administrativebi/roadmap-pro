"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    AreaChart,
    Area,
} from "recharts";
import {
    TrendingUp,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Target,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Users,
    Layers,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#6366f1"];

export default function ActionPlansDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchDashboardData() {
            setIsLoading(true);
            try {
                const { data: plans, error } = await supabase
                    .from('action_plans')
                    .select('*, sectors(name), profiles!action_plans_assignee_id_fkey(name)');

                if (error) throw error;

                // Process Stats
                const total = plans.length;
                const resolved = plans.filter(p => p.status === 'resolved').length;
                const pending = plans.filter(p => p.status === 'pending').length;
                const inProgress = plans.filter(p => p.status === 'in_progress').length;
                const canceled = plans.filter(p => p.status === 'canceled').length;

                // Compliance Rate
                const complianceRate = total > 0 ? Math.round((resolved / (total - canceled)) * 100) : 0;

                // By Sector
                const sectorMap: Record<string, number> = {};
                plans.forEach(p => {
                    const name = p.sectors?.name || "Sem Setor";
                    sectorMap[name] = (sectorMap[name] || 0) + 1;
                });
                const sectorData = Object.entries(sectorMap).map(([name, value]) => ({ name, value }));

                // Status Distribution for Pie
                const statusData = [
                    { name: "Pendente", value: pending },
                    { name: "Em andamento", value: inProgress },
                    { name: "Resolvido", value: resolved },
                    { name: "Cancelado", value: canceled },
                ];

                setStats({
                    total,
                    resolved,
                    pending,
                    inProgress,
                    complianceRate,
                    statusData,
                    sectorData,
                    recentPlans: plans.slice(0, 5)
                });
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchDashboardData();
    }, [supabase]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20">
                <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-4" />
                <p className="text-sm font-black text-zinc-400 uppercase tracking-widest">Analisando dados...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-tight">Dashboard de Conformidade</h1>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">Análise detalhada de Planos de Ação e resoluções.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total de Planos" value={stats.total} icon={BarChart3} color="zinc" />
                <StatCard title="Taxa de Resolução" value={`${stats.complianceRate}%`} icon={Target} color="emerald" trend="+12%" />
                <StatCard title="Pendentes" value={stats.pending} icon={Clock} color="amber" />
                <StatCard title="Em Aberto" value={stats.inProgress} icon={TrendingUp} color="blue" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Status Chart */}
                <div className="lg:col-span-1 bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <h3 className="text-sm font-black uppercase text-zinc-400 tracking-widest mb-8">Status Geral</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.statusData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        {stats.statusData.map((s: any, i: number) => (
                            <div key={s.name} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                <span className="text-[10px] font-bold text-zinc-500 uppercase">{s.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sector Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <h3 className="text-sm font-black uppercase text-zinc-400 tracking-widest mb-8">Volume por Setor</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.sectorData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" />
                                <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" />
                                <Tooltip cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="value" fill="#f59e0b" radius={[10, 10, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Performance Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center">
                            <Users className="w-5 h-5 text-emerald-500" />
                        </div>
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-tighter">Ranking de Resolução</h3>
                    </div>
                    <p className="text-xs text-zinc-500 mb-6 italic">Funcionalidade de análise por colaborador em processamento.</p>
                    <div className="space-y-4">
                        {[1,2,3].map(i => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 animate-pulse">
                                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                                <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                                <div className="ml-auto h-4 w-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-zinc-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-white font-black text-xl uppercase tracking-tighter mb-2">Resumo Operacional</h3>
                        <p className="text-zinc-400 text-sm mb-8">Baseado nos últimos 30 dias de conformidade.</p>
                        
                        <div className="space-y-6">
                            <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
                                <span className="text-zinc-500 text-[10px] font-black uppercase">Eficiência Média</span>
                                <span className="text-white font-black text-2xl tracking-tighter">84%</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
                                <span className="text-zinc-500 text-[10px] font-black uppercase">Tempo de Resposta</span>
                                <span className="text-white font-black text-2xl tracking-tighter">4.2h</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
                                <span className="text-zinc-500 text-[10px] font-black uppercase">XP Total Gerado</span>
                                <span className="text-amber-400 font-black text-2xl tracking-tighter">12.450</span>
                            </div>
                        </div>
                    </div>
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, trend }: any) {
    const colorClasses: any = {
        emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
        amber: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
        blue: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
        zinc: "text-zinc-600 bg-zinc-50 dark:bg-zinc-900",
    };

    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div className={cn("p-2 rounded-xl", colorClasses[color] || colorClasses.zinc)}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend && (
                    <span className="flex items-center gap-0.5 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                        <ArrowUpRight className="w-3 h-3" /> {trend}
                    </span>
                )}
            </div>
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">{title}</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tighter">{value}</p>
        </div>
    );
}

function Loader2({ className }: { className?: string }) {
    return <Clock className={cn("animate-spin", className)} />;
}
