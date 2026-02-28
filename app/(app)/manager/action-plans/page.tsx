"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { assignXPToActionPlan } from "@/app/actions/assign-xp";

interface ActionPlan {
    id: string;
    title: string;
    description: string;
    status: string;
    resolved_at: string;
    awarded_xp: number | null;
    notion_page_id: string;
    assignee: { name: string };
}

export default function AssignXPPage() {
    const [plans, setPlans] = useState<ActionPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [xpValue, setXpValue] = useState<{ [key: string]: number }>({});
    const supabase = createClient();

    useEffect(() => {
        async function fetchPlans() {
            const { data, error } = await supabase
                .from('action_plans')
                .select('*, assignee:profiles(name)')
                .eq('status', 'resolved')
                .is('awarded_xp', null)
                .order('resolved_at', { ascending: false });

            if (!error && data) {
                setPlans(data as any[]);
                // Inicializa o state de XP com 500 por padrão
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
                <p className="text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                    Avalie os planos de ação resolvidos e conceda XP aos colaboradores.
                </p>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-orange-500" />
                    <p className="font-bold uppercase tracking-widest text-xs">Carregando...</p>
                </div>
            ) : plans.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-zinc-500 bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-zinc-800">
                    <CheckCircle2 className="w-12 h-12 mb-4 text-emerald-500/50" />
                    <p className="font-bold">Tudo em dia!</p>
                    <p className="text-sm">Nenhum plano de ação aguardando pontuação.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {plans.map((plan) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6 flex flex-col md:flex-row items-center gap-6 justify-between shadow-sm"
                        >
                            <div className="flex-1">
                                <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-lg">{plan.title}</h3>
                                <p className="text-sm text-zinc-500 mt-1">{plan.description}</p>
                                <div className="flex items-center gap-4 mt-3">
                                    <span className="text-xs bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 px-3 py-1 rounded-full font-semibold">
                                        👨‍🍳 {plan.assignee?.name || 'Sem responsável'}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                                        Resolvido em {new Date(plan.resolved_at).toLocaleDateString("pt-BR")}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl w-full md:w-auto">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-amber-500 tracking-widest block mb-2">
                                        XP Concedido
                                    </label>
                                    <input 
                                        type="number" 
                                        value={xpValue[plan.id] || ''}
                                        onChange={(e) => setXpValue({...xpValue, [plan.id]: parseInt(e.target.value) || 0})}
                                        className="w-24 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-center font-bold text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                    />
                                </div>
                                <button
                                    onClick={() => handleAssignXP(plan.id, plan.notion_page_id)}
                                    disabled={processingId === plan.id}
                                    className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:scale-105 transition-all disabled:opacity-50"
                                >
                                    {processingId === plan.id ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Award className="w-5 h-5" />
                                            Conceder
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
