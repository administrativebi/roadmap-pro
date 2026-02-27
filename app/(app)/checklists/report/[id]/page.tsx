"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowLeft, Calendar, User, Clock, CheckCircle2, AlertTriangle, MessageSquare, Image as ImageIcon, MapPin, Building2, Flame } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { QUESTION_TYPE_CONFIG } from "@/types/checklist-builder";

export default function ChecklistReportPage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();

    const [execution, setExecution] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [responses, setResponses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const executionId = params.id as string;
        if (!executionId) return;

        async function loadData() {
            setIsLoading(true);
            try {
                // 1. Load Execution Base Data
                const { data: eData, error: eErr } = await supabase
                    .from('checklists')
                    .select(`
                        id,
                        status,
                        score,
                        started_at,
                        completed_at,
                        template_id,
                        user:profiles(name, avatar_url),
                        sector:sectors(name),
                        template:checklist_templates(title, icon)
                    `)
                    .eq('id', executionId)
                    .single();

                if (eErr) throw eErr;

                const execLoaded = {
                    ...eData,
                    user: Array.isArray(eData.user) ? eData.user[0] : eData.user,
                    sector: Array.isArray(eData.sector) ? eData.sector[0] : eData.sector,
                    template: Array.isArray(eData.template) ? eData.template[0] : eData.template,
                };

                setExecution(execLoaded);

                // 2. Load Questions for this template
                const { data: qData, error: qErr } = await supabase
                    .from('template_questions')
                    .select('id, title, type, section, order_index')
                    .eq('template_id', eData.template_id)
                    .order('order_index', { ascending: true });

                if (qErr) throw qErr;
                setQuestions(qData || []);

                // 3. Load Responses for this execution
                const { data: rData, error: rErr } = await supabase
                    .from('checklist_responses')
                    .select('*')
                    .eq('checklist_id', executionId);

                if (rErr) throw rErr;
                setResponses(rData || []);

            } catch (err) {
                console.error("Erro ao carregar relatório:", err);
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, [params.id, supabase]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!execution) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-black p-8 flex flex-col items-center justify-center">
                <AlertTriangle className="w-12 h-12 text-zinc-300 mb-4" />
                <h1 className="text-xl font-bold mb-4 text-zinc-800">Relatório não encontrado</h1>
                <button onClick={() => router.back()} className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95">Voltar</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black pb-24">
            {/* Header / Report Cover */}
            <header className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 pt-6 pb-12 sticky top-0 z-20">
                <div className="max-w-4xl mx-auto px-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-zinc-400 hover:text-orange-500 text-xs font-bold uppercase tracking-wider transition-colors mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" /> Voltar
                    </button>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-20 h-20 rounded-[2rem] bg-orange-500 flex items-center justify-center text-4xl shadow-xl shadow-orange-500/30 text-white">
                                {execution.template?.icon || "📋"}
                            </div>
                            <div className="mt-2">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                                    Relatório de Execução
                                </div>
                                <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight mb-2">
                                    {execution.template?.title || "Checklist"}
                                </h1>
                            </div>
                        </div>

                        {/* Quick Data Card */}
                        <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                            <div className="text-center px-4">
                                <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">Status</p>
                                {execution.status === 'completed' ? (
                                    <span className="flex flex-col items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 className="w-5 h-5 mx-auto" />
                                        Concluído
                                    </span>
                                ) : (
                                    <span className="flex flex-col items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                                        <Clock className="w-5 h-5 mx-auto" />
                                        Em Andamento
                                    </span>
                                )}
                            </div>
                            <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-800" />
                            <div className="text-center px-4">
                                <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">Score</p>
                                <span className={cn(
                                    "font-black text-2xl flex items-center justify-center",
                                    Number(execution.score) >= 90 ? "text-emerald-500" : Number(execution.score) >= 70 ? "text-amber-500" : "text-rose-500"
                                )}>
                                    {execution.score ? `${Number(execution.score).toFixed(1)}%` : '--'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Meta Information */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <div className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-900 shadow-sm flex items-start gap-3">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-500 rounded-xl">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-0.5">Executor(a)</p>
                            <p className="font-bold text-sm text-zinc-900 dark:text-zinc-50">{execution.user?.name || "Desconhecido"}</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-900 shadow-sm flex items-start gap-3">
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 rounded-xl">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-0.5">Setor/Local</p>
                            <p className="font-bold text-sm text-zinc-900 dark:text-zinc-50">{execution.sector?.name || "Global"}</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-900 shadow-sm flex items-start gap-3">
                        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded-xl">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-0.5">Data Início</p>
                            <p className="font-bold text-sm text-zinc-900 dark:text-zinc-50">{format(new Date(execution.started_at), "dd/MM/yyyy HH:mm")}</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-900 shadow-sm flex items-start gap-3">
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-xl">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-0.5">Data Conclusão</p>
                            <p className="font-bold text-sm text-zinc-900 dark:text-zinc-50">{execution.completed_at ? format(new Date(execution.completed_at), "dd/MM/yyyy HH:mm") : "Pendente"}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-6 px-1">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Depoimento Detalhado</h2>
                </div>

                <div className="space-y-4">
                    {questions.map((q, index) => {
                        const response = responses.find(r => r.question_id === q.id);
                        if (!response) return null; // Não exibe se não foi respondida ou pulada pela condicional

                        return (
                            <div key={q.id} className="bg-white dark:bg-zinc-950 rounded-2xl border-2 border-zinc-100 dark:border-zinc-900 p-6 flex flex-col md:flex-row gap-6 hover:border-zinc-200 dark:hover:border-zinc-800 transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-900 text-[10px] font-black text-zinc-500 flex items-center justify-center shrink-0">
                                            {index + 1}
                                        </span>
                                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug">{q.title}</h3>
                                    </div>

                                    <div className="pl-8">
                                        <div className="inline-block px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800">
                                            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mr-2">Resposta:</span>
                                            <span className="font-black text-orange-600 dark:text-orange-400">{response.answer_value || "Não Preenchido"}</span>
                                        </div>

                                        {response.comment && (
                                            <div className="mt-3 p-4 bg-amber-50/50 dark:bg-amber-950/20 border-l-4 border-amber-500 rounded-r-xl">
                                                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-500 font-bold text-xs uppercase tracking-wider mb-1">
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                    Justificativa / Plano de Ação
                                                </div>
                                                <p className="text-sm text-zinc-700 dark:text-zinc-400 font-medium italic">
                                                    "{response.comment}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {response.photo_url && (
                                    <div className="shrink-0 w-full md:w-48 self-start">
                                        <a href={response.photo_url} target="_blank" rel="noopener noreferrer" className="block w-full aspect-video md:aspect-square bg-zinc-100 dark:bg-zinc-900 rounded-xl overflow-hidden relative group cursor-pointer border border-zinc-200 dark:border-zinc-800">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={response.photo_url} alt="Evidência fotográfica" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                                                <ImageIcon className="w-6 h-6 text-white" />
                                            </div>
                                        </a>
                                        <p className="text-[10px] text-center font-bold uppercase tracking-wider text-zinc-400 mt-2">Clique para ampliar</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
