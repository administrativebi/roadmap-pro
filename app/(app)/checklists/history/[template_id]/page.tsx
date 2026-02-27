"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowLeft, Calendar, FileText, CheckCircle2, User, Clock, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ChecklistExecution {
    id: string;
    status: string;
    score: number;
    started_at: string;
    completed_at: string;
    user: {
        id: string;
        name: string;
    };
    sector: {
        id: string;
        name: string;
    } | null;
}

export default function TemplateHistoryPage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();

    const [template, setTemplate] = useState<any>(null);
    const [executions, setExecutions] = useState<ChecklistExecution[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const templateId = params.template_id as string;
        if (!templateId) return;

        async function loadData() {
            setIsLoading(true);
            try {
                // 1. Load template 
                const { data: tData, error: tErr } = await supabase
                    .from('checklist_templates')
                    .select('id, title, description, icon, is_active, status')
                    .eq('id', templateId)
                    .single();

                if (tErr) throw tErr;
                setTemplate(tData);

                // 2. Load Executions
                const { data: eData, error: eErr } = await supabase
                    .from('checklists')
                    .select(`
                        id,
                        status,
                        score,
                        started_at,
                        completed_at,
                        user:profiles(id, name),
                        sector:sectors(id, name)
                    `)
                    .eq('template_id', templateId)
                    .order('completed_at', { ascending: false });

                if (eErr) throw eErr;

                // Tratar os relacionamentos do supabase
                const formattedData = (eData || []).map((exc: any) => ({
                    ...exc,
                    user: Array.isArray(exc.user) ? exc.user[0] : exc.user,
                    sector: Array.isArray(exc.sector) ? exc.sector[0] : exc.sector,
                }));

                setExecutions(formattedData);

            } catch (err) {
                console.error("Erro ao carregar dados do histórico:", err);
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, [params.template_id, supabase]);

    const filteredExecutions = executions.filter(e => {
        const searchTarget = `${e.user?.name || ""} ${e.status}`.toLowerCase();
        return searchTarget.includes(searchTerm.toLowerCase());
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!template) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-black p-8 flex flex-col items-center justify-center">
                <h1 className="text-xl font-bold mb-4 text-zinc-800">Checklist não encontrado</h1>
                <button onClick={() => router.back()} className="px-4 py-2 bg-orange-500 text-white rounded-xl font-bold">Voltar</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black pb-24">
            {/* Header */}
            <header className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-20">
                <div className="max-w-4xl mx-auto px-6 py-6 lg:py-8">
                    <button
                        onClick={() => router.push('/checklists/history')}
                        className="flex items-center gap-2 text-zinc-400 hover:text-orange-500 text-xs font-bold uppercase tracking-wider transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" /> Voltar ao Histórico
                    </button>

                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-3xl bg-zinc-100 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-3xl shadow-inner">
                            {template.icon || "📋"}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl lg:text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                                    {template.title}
                                </h1>
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                    (template.status === 'active' || template.is_active) ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-500"
                                )}>
                                    {(template.status === 'active' || template.is_active) ? "Ativo" : "Inativo"}
                                </span>
                            </div>
                            <p className="text-sm text-zinc-500 max-w-lg mb-4">
                                Histórico completo de execução deste formulário.
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Filters */}
                <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex-1 min-w-[250px] shadow-sm">
                        <Search className="w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome do usuário..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none text-sm w-full focus:outline-none focus:ring-0 text-zinc-800 dark:text-zinc-100"
                        />
                    </div>

                    <div className="flex items-center gap-3 text-sm text-zinc-500 font-bold px-4">
                        <Filter className="w-4 h-4" />
                        {filteredExecutions.length} Registros
                    </div>
                </div>

                {filteredExecutions.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-950 rounded-3xl border-2 border-zinc-100 dark:border-zinc-800 border-dashed p-12 flex flex-col items-center justify-center text-center">
                        <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-4" />
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">Nada por aqui</h3>
                        <p className="text-sm text-zinc-500">Nenhum preenchimento encontrado para esta busca.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredExecutions.map((exec, i) => (
                            <Link key={exec.id} href={`/checklists/report/${exec.id}`}>
                                <div className="group bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-orange-300 dark:hover:border-orange-800 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-lg hover:shadow-orange-500/5 cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-0.5">
                                                {exec.user?.name || "Usuário Desconhecido"}
                                            </h4>
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 font-medium">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {exec.completed_at ? format(new Date(exec.completed_at), "dd/MM/yyyy") : format(new Date(exec.started_at), "dd/MM/yyyy")}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {exec.completed_at ? format(new Date(exec.completed_at), "HH:mm") : format(new Date(exec.started_at), "HH:mm")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-none border-zinc-100 dark:border-zinc-800 pt-3 md:pt-0">
                                        <div className="text-left md:text-right">
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Conformidade</p>
                                            <div className="font-black text-lg text-zinc-900 dark:text-zinc-100">
                                                {exec.score !== null ? `${Number(exec.score).toFixed(1)}%` : '--'}
                                            </div>
                                        </div>

                                        <div className="text-left md:text-right">
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Status</p>
                                            {exec.status === 'completed' ? (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold border border-emerald-100 dark:border-emerald-900">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-bold border border-amber-100 dark:border-amber-900">
                                                    <Clock className="w-3.5 h-3.5" /> Em Andamento
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
