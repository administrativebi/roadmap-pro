import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Lightbulb,
    Clock,
    CheckCircle2,
    Loader2,
    Sparkles,
    Plus,
    ChevronRight,
    AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type PlanStatus = "pending" | "in_progress" | "resolved";

interface ActionPlan {
    id: string;
    title: string;
    description: string;
    status: PlanStatus;
    priority: string;
    created_at: string;
    ai_suggestion?: string;
}

const statusConfig: Record<PlanStatus, { label: string; icon: typeof Clock; color: string; bg: string }> = {
    pending: { label: "Pendente", icon: Clock, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950" },
    in_progress: { label: "Em andamento", icon: Loader2, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950" },
    resolved: { label: "Resolvido", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950" },
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
};

export default function ActionPlansPage() {
    const [plans, setPlans] = useState<ActionPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        async function fetchPlans() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from('action_plans')
                    .select('*')
                    .eq('assignee_id', user.id) // Or show all for managers
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setPlans(data || []);
            } catch (err) {
                console.error("Erro ao buscar planos:", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchPlans();
    }, [supabase]);

    const handleRequestAI = async (planId: string) => {
        setAiLoading(planId);
        // Simulação do request de IA
        await new Promise((r) => setTimeout(r, 2000));

        // Update local state with mock AI suggestion
        setPlans(prev => prev.map(p => p.id === planId ? { ...p, ai_suggestion: "Sugestão da IA: Recomenda-se revisar o processo de monitoramento e reforçar o treinamento da equipe nos pontos críticos identificados." } : p));
        setAiLoading(null);
    };

    const updateStatus = async (planId: string, newStatus: PlanStatus) => {
        try {
            const { error } = await supabase
                .from('action_plans')
                .update({
                    status: newStatus,
                    resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null
                })
                .eq('id', planId);

            if (error) throw error;
            setPlans(prev => prev.map(p => p.id === planId ? { ...p, status: newStatus } : p));
        } catch (err) {
            console.error("Erro ao atualizar status:", err);
            alert("Erro ao atualizar.");
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Planos de Ação
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                        Melhore sua conformidade resolvendo pendências
                    </p>
                </div>
            </div>

            {/* Plans List */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-orange-500" />
                    <p className="font-bold uppercase tracking-widest text-xs">Carregando planos...</p>
                </div>
            ) : plans.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-zinc-500 bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-zinc-800">
                    <CheckCircle2 className="w-12 h-12 mb-4 text-emerald-500/50" />
                    <p className="font-bold">Nenhum plano de ação pendente!</p>
                    <p className="text-sm">Tudo em conformidade por aqui.</p>
                </div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4 max-w-3xl"
                >
                    {plans.map((plan) => {
                        const status = statusConfig[plan.status || 'pending'];
                        const StatusIcon = status.icon;
                        const isExpanded = expandedId === plan.id;

                        return (
                            <motion.div
                                key={plan.id}
                                variants={itemVariants}
                                className="bg-white dark:bg-zinc-950 rounded-[2rem] border border-zinc-100 dark:border-zinc-900 overflow-hidden hover:shadow-xl transition-all"
                            >
                                {/* Header */}
                                <div
                                    onClick={() => setExpandedId(isExpanded ? null : plan.id)}
                                    className="flex items-center gap-4 p-6 cursor-pointer"
                                >
                                    <div className={cn("p-3 rounded-2xl", plan.priority === 'high' ? "bg-rose-50 text-rose-500" : "bg-zinc-100 text-zinc-500")}>
                                        <AlertTriangle className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{plan.title}</h3>
                                            {plan.priority === 'high' && <span className="bg-rose-100 text-rose-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Urgent</span>}
                                        </div>
                                        <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                                            {plan.description}
                                        </p>
                                    </div>
                                    <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider", status.bg, status.color)}>
                                        <StatusIcon className={cn("w-3.5 h-3.5", plan.status === "in_progress" && "animate-spin")} />
                                        {status.label}
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden bg-zinc-50 dark:bg-zinc-900/50"
                                        >
                                            <div className="p-6 pt-0 space-y-6">
                                                <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                                                        {plan.description}
                                                    </p>
                                                </div>

                                                {/* AI Suggestion Box */}
                                                {plan.ai_suggestion ? (
                                                    <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 rounded-2xl p-5 border border-indigo-100/50 dark:border-indigo-900/50">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Sparkles className="w-4 h-4 text-indigo-500" />
                                                            <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">
                                                                Insights da IA
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-indigo-900/80 dark:text-indigo-200/80 leading-relaxed font-medium">
                                                            {plan.ai_suggestion}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleRequestAI(plan.id); }}
                                                        disabled={aiLoading === plan.id}
                                                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-zinc-900 transition-all text-xs font-black uppercase tracking-widest"
                                                    >
                                                        {aiLoading === plan.id ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                                                Analisando com IA...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Sparkles className="w-4 h-4" />
                                                                Sugerir ações corretivas com IA
                                                            </>
                                                        )}
                                                    </button>
                                                )}

                                                <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
                                                    <span className="text-[10px] text-zinc-400 font-bold uppercase">
                                                        Criado em {new Date(plan.created_at).toLocaleDateString("pt-BR")}
                                                    </span>
                                                    <div className="flex gap-2">
                                                        {plan.status !== 'resolved' && (
                                                            <button
                                                                onClick={() => updateStatus(plan.id, 'resolved')}
                                                                className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                                                            >
                                                                Resolver
                                                            </button>
                                                        )}
                                                        {plan.status === 'pending' && (
                                                            <button
                                                                onClick={() => updateStatus(plan.id, 'in_progress')}
                                                                className="px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-black uppercase hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                                                            >
                                                                Iniciar
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
}
