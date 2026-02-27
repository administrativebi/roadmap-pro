"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ClipboardList, Filter, CalendarDays, BarChart2, Plus, Clock, Search, ChevronRight, Activity, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TemplateStats {
    total_executions: number;
    avg_score: number;
    last_execution: string | null;
}

interface Template {
    id: string;
    title: string;
    description: string;
    icon: string;
    status: string;
    is_active: boolean;
    created_at: string;
    stats?: TemplateStats;
}

export default function HistoryDashboard() {
    const supabase = createClient();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("active");
    const [searchTerm, setSearchTerm] = useState("");

    // Load templates
    useEffect(() => {
        async function fetchTemplates() {
            setIsLoading(true);
            try {
                // Fetch templates
                const { data: tData, error: tErr } = await supabase
                    .from('checklist_templates')
                    .select('id, title, description, icon, status, is_active, created_at')
                    .order('created_at', { ascending: false });

                if (tErr) throw tErr;

                // Fetch stats from executions (checklists)
                const { data: cData, error: cErr } = await supabase
                    .from('checklists')
                    .select('template_id, score, started_at, completed_at, status')
                    .eq('status', 'completed');

                if (cErr) throw cErr;

                // Calculate stats
                const statsMap: Record<string, TemplateStats> = {};
                if (cData) {
                    cData.forEach(c => {
                        const tId = c.template_id;
                        if (!statsMap[tId]) {
                            statsMap[tId] = { total_executions: 0, avg_score: 0, last_execution: null };
                        }

                        statsMap[tId].total_executions += 1;
                        statsMap[tId].avg_score += Number(c.score) || 0;

                        const execDate = c.completed_at || c.started_at;
                        if (execDate) {
                            if (!statsMap[tId].last_execution || new Date(execDate) > new Date(statsMap[tId].last_execution!)) {
                                statsMap[tId].last_execution = execDate;
                            }
                        }
                    });

                    // Average out the scores
                    Object.keys(statsMap).forEach(key => {
                        if (statsMap[key].total_executions > 0) {
                            statsMap[key].avg_score = statsMap[key].avg_score / statsMap[key].total_executions;
                        }
                    });
                }

                // Merge exactly
                const merged = (tData || []).map(t => ({
                    ...t,
                    stats: statsMap[t.id] || { total_executions: 0, avg_score: 0, last_execution: null }
                }));

                setTemplates(merged);
            } catch (err) {
                console.error("Erro ao carregar histórico:", err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchTemplates();
    }, [supabase]);

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
        const tStatus = t.status || (t.is_active ? 'active' : 'inactive');
        const matchesStatus = filterStatus === 'all' ? true : tStatus === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black pb-24">
            {/* Header */}
            <header className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-20">
                <div className="max-w-5xl mx-auto px-6 py-6 lg:py-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-full text-xs font-black tracking-wider mb-3">
                            <ClipboardList className="w-3.5 h-3.5" />
                            HISTÓRICO E GESTÃO
                        </div>
                        <h1 className="text-2xl lg:text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                            Status dos Checklists
                        </h1>
                        <p className="text-sm text-zinc-500 mt-1 max-w-lg">
                            Localize formulários ativos e inativos, consulte a frequência de uso e acesse o log de preenchimentos de cada modelo.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-auto">
                        <Link
                            href="/builder"
                            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-transform active:scale-95 text-sm shadow-lg shadow-orange-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            Novo Modelo
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="w-4 h-4 absolute left-3 mx-auto top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Buscar checklist pelo título..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500 font-medium dark:text-zinc-100"
                        />
                    </div>

                    <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
                        {[
                            { id: 'all', label: 'Todos' },
                            { id: 'active', label: 'Ativos' },
                            { id: 'inactive', label: 'Inativos' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFilterStatus(f.id as any)}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                                    filterStatus === f.id
                                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                )}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-4" />
                        <p className="text-sm font-medium text-zinc-400">Varrendo histórico de dados...</p>
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 border-dashed">
                        <Filter className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">Nenhum checklist encontrado</h3>
                        <p className="text-sm text-zinc-500">Altere os filtros de busca para encontrar o formulário desejado.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AnimatePresence>
                            {filteredTemplates.map((template, idx) => {
                                const st = template.status || (template.is_active ? 'active' : 'inactive');
                                const isActive = st === 'active';

                                return (
                                    <motion.div
                                        key={template.id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <Link href={`/checklists/history/${template.id}`}>
                                            <div className="group bg-white dark:bg-zinc-950 rounded-3xl p-5 border-2 border-zinc-100 dark:border-zinc-800 hover:border-orange-200 dark:hover:border-orange-900 transition-all hover:shadow-xl hover:shadow-orange-500/5 cursor-pointer flex flex-col h-full relative overflow-hidden">

                                                {/* Status Badge */}
                                                <div className={cn(
                                                    "absolute top-5 right-5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1",
                                                    isActive ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900"
                                                )}>
                                                    {isActive ? <Activity className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                    {isActive ? 'Ativo' : 'Inativo'}
                                                </div>

                                                <div className="flex items-start gap-4 mb-5 pr-20">
                                                    <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner border border-zinc-100 dark:border-zinc-800">
                                                        {template.icon || "📋"}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-base leading-tight mb-1">{template.title}</h3>
                                                        <p className="text-xs text-zinc-500 line-clamp-2">{template.description || "Nenhuma descrição fornecida."}</p>
                                                    </div>
                                                </div>

                                                <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-900 grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Preenchimentos</p>
                                                        <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100">
                                                            <ClipboardList className="w-3.5 h-3.5 text-zinc-400" />
                                                            {template.stats?.total_executions || 0}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Última Vez</p>
                                                        <div className="flex items-center gap-1.5 font-medium text-xs text-zinc-600 dark:text-zinc-400">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {template.stats?.last_execution ? format(new Date(template.stats.last_execution), "dd/MM/yyyy HH:mm") : "Nunca"}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Hover Overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
}
