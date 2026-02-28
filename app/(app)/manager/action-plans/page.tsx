"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, CheckCircle2, Loader2, ChevronDown, ChevronUp, Camera, Paperclip, Star, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { assignXPToActionPlan } from "@/app/actions/assign-xp";
import { updateActionPlanStatusAction } from "@/app/actions/update-status";
import { cn } from "@/lib/utils";

interface ActionPlan {
    id: string;
    title: string;
    description: string;
    benefit?: string;
    step_by_step?: string;
    status: string;
    resolved_at: string;
    awarded_xp: number | null;
    notion_page_id: string;
    photo_url?: string;
    file_url?: string;
    closing_comment?: string;
    satisfaction_rating?: number;
    profiles?: { name: string } | null;
}

export default function AssignXPPage() {
    const [plans, setPlans] = useState<ActionPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [xpValue, setXpValue] = useState<{ [key: string]: number }>({});
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        async function fetchPlans() {
            const { data, error } = await supabase
                .from('action_plans')
                .select('*, profiles!action_plans_assignee_id_fkey(name)')
                .eq('status', 'resolved')
                .is('awarded_xp', null)
                .order('resolved_at', { ascending: false });

            if (!error && data) {
                setPlans(data as any[]);
                const initialXp: any = {};
                data.forEach(p => initialXp[p.id] = 500);
                setXpValue(initialXp);
            }
            setIsLoading(false);
        }
        fetchPlans();
    }, [supabase]);

    const handleAssignXP = async (planId: string, notionPageId: string) => {
        setProcessingId(planId);
        const xp = xpValue[planId] || 0;
        
        const result = await assignXPToActionPlan(planId, notionPageId, xp);
        
        if (result.success) {
            setPlans(prev => prev.filter(p => p.id !== planId));
        } else {
            alert("Erro ao atribuir pontuação: " + result.error);
        }
        setProcessingId(null);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Definir Pontuação (XP)
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1 font-medium text-sm">
                    Avalie as evidências enviadas e conceda XP aos colaboradores.
                </p>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-orange-500" />
                    <p className="font-bold uppercase tracking-widest text-xs">Carregando fila...</p>
                </div>
            ) : plans.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-zinc-500 bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-zinc-800">
                    <CheckCircle2 className="w-12 h-12 mb-4 text-emerald-500/50" />
                    <p className="font-bold">Sem pendências de avaliação!</p>
                    <p className="text-sm">Todos os planos resolvidos já foram pontuados.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {plans.map((plan) => {
                        const isExpanded = expandedId === plan.id;
                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-900 overflow-hidden shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full font-black uppercase tracking-widest">
                                                Resolvido
                                            </span>
                                            <span className="text-[10px] text-zinc-400 font-bold uppercase">
                                                Em {new Date(plan.resolved_at).toLocaleDateString("pt-BR")}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-xl leading-tight">{plan.title}</h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px]">
                                                👤
                                            </div>
                                            <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                                                {plan.profiles?.name || 'Sem responsável'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                                        <button
                                            onClick={() => setExpandedId(isExpanded ? null : plan.id)}
                                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                                        >
                                            {isExpanded ? (
                                                <><ChevronUp className="w-4 h-4" /> Recolher Detalhes</>
                                            ) : (
                                                <><ChevronDown className="w-4 h-4" /> Conferir Evidências</>
                                            )}
                                        </button>

                                        <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                            <input 
                                                type="number" 
                                                value={xpValue[plan.id] || ''}
                                                onChange={(e) => setXpValue({...xpValue, [plan.id]: parseInt(e.target.value) || 0})}
                                                className="w-20 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-center font-black text-orange-500 focus:ring-2 focus:ring-orange-500 outline-none"
                                            />
                                            <button
                                                onClick={() => handleAssignXP(plan.id, plan.notion_page_id)}
                                                disabled={processingId === plan.id}
                                                className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all disabled:opacity-50 shadow-lg shadow-zinc-500/20"
                                            >
                                                {processingId === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Conceder XP"}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-900"
                                        >
                                            <div className="p-8 grid md:grid-cols-2 gap-8">
                                                {/* Seção 1: O Plano Original */}
                                                <div className="space-y-6">
                                                    <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">O que foi solicitado</h4>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Descrição do Problema</label>
                                                            <p className="text-sm text-zinc-800 dark:text-zinc-200 mt-1">{plan.description}</p>
                                                        </div>
                                                        {plan.benefit && (
                                                            <div>
                                                                <label className="text-[10px] font-bold text-zinc-500 uppercase">Benefício</label>
                                                                <p className="text-sm text-zinc-800 dark:text-zinc-200 mt-1">{plan.benefit}</p>
                                                            </div>
                                                        )}
                                                        {plan.step_by_step && (
                                                            <div>
                                                                <label className="text-[10px] font-bold text-zinc-500 uppercase">Passo a Passo</label>
                                                                <p className="text-sm text-zinc-800 dark:text-zinc-200 mt-1 whitespace-pre-line italic">{plan.step_by_step}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Seção 2: A Resposta do Colaborador */}
                                                <div className="space-y-6 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-inner">
                                                    <h4 className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em]">Evidências de Conclusão</h4>
                                                    
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Comentário de Finalização</label>
                                                            <p className="text-sm text-zinc-800 dark:text-zinc-200 mt-1 leading-relaxed">
                                                                {plan.closing_comment || <span className="text-zinc-400 italic">Sem comentários</span>}
                                                            </p>
                                                        </div>

                                                        <div className="flex flex-wrap gap-3">
                                                            {plan.photo_url && (
                                                                <a href={plan.photo_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-xs font-bold text-zinc-600 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-700 hover:border-emerald-500 transition-all">
                                                                    <Camera className="w-4 h-4 text-emerald-500" /> Ver Foto
                                                                </a>
                                                            )}
                                                            {plan.file_url && (
                                                                <a href={plan.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-xs font-bold text-zinc-600 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-700 hover:border-indigo-500 transition-all">
                                                                    <Paperclip className="w-4 h-4 text-indigo-500" /> Ver Anexo
                                                                </a>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-2">Auto-Avaliação de Satisfação</label>
                                                            <div className="flex gap-1">
                                                                {[1,2,3,4,5].map(s => (
                                                                    <Star key={s} className={cn("w-5 h-5", s <= (plan.satisfaction_rating || 0) ? "fill-amber-400 text-amber-400" : "text-zinc-200 dark:text-zinc-800")} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="pt-4 mt-2 border-t border-zinc-50 dark:border-zinc-800 flex justify-end">
                                                        <button
                                                            onClick={async () => {
                                                                if(!confirm("Deseja realmente devolver este plano para o colaborador refazer?")) return;
                                                                setProcessingId(plan.id);
                                                                const res = await updateActionPlanStatusAction(plan.id, "in_progress", plan.notion_page_id, { is_returning: true });
                                                                if(res.success) {
                                                                    setPlans(prev => prev.filter(p => p.id !== plan.id));
                                                                } else {
                                                                    alert("Erro ao devolver plano.");
                                                                }
                                                                setProcessingId(null);
                                                            }}
                                                            disabled={processingId === plan.id}
                                                            className="flex items-center gap-2 text-rose-500 hover:text-rose-600 text-xs font-black uppercase tracking-widest transition-colors"
                                                        >
                                                            <AlertTriangle className="w-4 h-4" /> Devolver para Correção
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
