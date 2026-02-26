"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Lightbulb,
    Clock,
    CheckCircle2,
    Loader2,
    Sparkles,
    Plus,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PlanStatus = "pending" | "in_progress" | "resolved";

interface MockPlan {
    id: string;
    title: string;
    description: string;
    ai_suggestion?: string;
    status: PlanStatus;
    created_at: string;
}

const mockPlans: MockPlan[] = [
    {
        id: "p1",
        title: "Melhorar tempo de preparação",
        description: "Reduzir o tempo médio de preparo dos pratos do cardápio executivo.",
        ai_suggestion:
            "Sugestão IA: Implementar sistema de mise en place pré-turno com fichas técnicas visuais. Considere reorganizar a estação de trabalho seguindo princípios de lean kitchen para reduzir movimentação desnecessária.",
        status: "pending",
        created_at: "2026-02-20",
    },
    {
        id: "p2",
        title: "Controle de temperatura",
        description: "Algumas câmaras frias estão fora da faixa ideal com frequência.",
        ai_suggestion:
            "Sugestão IA: Instalar sensores IoT para monitoramento contínuo. Criar alerta automático quando a temperatura ultrapassar 5°C. Revisar a vedação das portas e o ciclo de manutenção dos compressores.",
        status: "in_progress",
        created_at: "2026-02-18",
    },
    {
        id: "p3",
        title: "Treinamento de higiene",
        description: "Equipe nova precisa de reforço nos protocolos de higienização.",
        status: "resolved",
        created_at: "2026-02-10",
    },
];

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
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState<string | null>(null);

    const handleRequestAI = async (planId: string) => {
        setAiLoading(planId);
        // Simulação do request de IA (em produção chamaria Server Action ou API)
        await new Promise((r) => setTimeout(r, 2000));
        setAiLoading(null);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Planos de Ação
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        Melhore sua performance com sugestões inteligentes
                    </p>
                </div>
                <button className="flex items-center gap-2 px-5 py-3 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-xl font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-sm shadow-sm">
                    <Plus className="w-4 h-4" />
                    Novo Plano
                </button>
            </div>

            {/* Plans List */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4 max-w-3xl"
            >
                {mockPlans.map((plan) => {
                    const status = statusConfig[plan.status];
                    const StatusIcon = status.icon;
                    const isExpanded = expandedId === plan.id;

                    return (
                        <motion.div
                            key={plan.id}
                            variants={itemVariants}
                            className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 overflow-hidden hover:shadow-lg transition-shadow"
                        >
                            {/* Header */}
                            <div
                                onClick={() => setExpandedId(isExpanded ? null : plan.id)}
                                className="flex items-center gap-4 p-6 cursor-pointer"
                            >
                                <div className="p-2.5 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
                                    <Lightbulb className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{plan.title}</h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        {plan.description}
                                    </p>
                                </div>
                                <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold", status.bg, status.color)}>
                                    <StatusIcon className={cn("w-3.5 h-3.5", plan.status === "in_progress" && "animate-spin")} />
                                    {status.label}
                                </div>
                                <ChevronRight
                                    className={cn(
                                        "w-5 h-5 text-zinc-400 transition-transform",
                                        isExpanded && "rotate-90"
                                    )}
                                />
                            </div>

                            {/* Expanded Content */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-6 pb-6 space-y-4">
                                            {/* AI Suggestion Box */}
                                            {plan.ai_suggestion ? (
                                                <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/50 dark:to-indigo-950/50 rounded-xl p-5 border border-violet-100 dark:border-violet-900">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Sparkles className="w-4 h-4 text-violet-500" />
                                                        <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                                                            Sugestão da IA
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-violet-900 dark:text-violet-200 leading-relaxed">
                                                        {plan.ai_suggestion}
                                                    </p>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleRequestAI(plan.id)}
                                                    disabled={aiLoading === plan.id}
                                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/50 transition-colors text-sm font-medium"
                                                >
                                                    {aiLoading === plan.id ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Gerando sugestão...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="w-4 h-4" />
                                                            Pedir sugestão da IA
                                                        </>
                                                    )}
                                                </button>
                                            )}

                                            <p className="text-xs text-zinc-400">
                                                Criado em {new Date(plan.created_at).toLocaleDateString("pt-BR")}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </motion.div>
        </div>
    );
}
