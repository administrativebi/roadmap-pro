"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, ChevronDown, Sparkles, ThermometerSun, Bug, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendInsight {
    id: string;
    type: "warning" | "positive" | "critical" | "suggestion";
    title: string;
    description: string;
    metric: string;
    data: number[];
    change: number;
    period: string;
    action?: string;
}

const insights: TrendInsight[] = [
    {
        id: "t1",
        type: "critical",
        title: "Temperatura câmara fria subindo",
        description: "A temperatura média da câmara fria está subindo progressivamente nos últimos 7 dias, de 3.2°C para 4.8°C. Se a tendência continuar, pode ultrapassar o limite de 5°C em 2 dias.",
        metric: "Temp. Média",
        data: [3.2, 3.4, 3.5, 3.8, 4.1, 4.5, 4.8],
        change: 50,
        period: "Últimos 7 dias",
        action: "Verificar compressor e vedação da porta. Agendar manutenção preventiva."
    },
    {
        id: "t2",
        type: "warning",
        title: "Taxa de não conformidade em limpeza aumentando",
        description: 'As perguntas da categoria "Limpeza" tiveram aumento de 12% nas respostas "Não" no turno da noite. Possível relação com a redução de equipe após as 22h.',
        metric: "% Falha",
        data: [15, 18, 17, 22, 25, 28, 27],
        change: 12,
        period: "Últimos 7 dias",
        action: "Rever escala de limpeza do turno noturno. Considerar realocar 1 colaborador."
    },
    {
        id: "t3",
        type: "positive",
        title: "FIFO no estoque melhorou significativamente",
        description: "A aderência ao FIFO aumentou de 72% para 95% após o treinamento realizado na semana passada. O item era o 3º maior ponto de falha e saiu do Top 5.",
        metric: "Aderência FIFO",
        data: [72, 74, 78, 85, 90, 93, 95],
        change: -23,
        period: "Últimos 7 dias",
        action: "Manter o novo procedimento e replicar nas demais unidades."
    },
    {
        id: "t4",
        type: "suggestion",
        title: "Padrão sazonal detectado: segundas-feiras problemáticas",
        description: "Nos últimos 4 meses, a taxa de conformidade nas segundas-feiras é 22% menor que nos demais dias. Pode ser resultado do acúmulo de tarefas do fim de semana.",
        metric: "Conformidade Seg.",
        data: [68, 72, 65, 70, 69, 71, 67],
        change: 22,
        period: "Últimos 4 meses (segundas)",
        action: "Criar checklist simplificado de 'segunda-feira' com foco nos itens mais críticos."
    },
    {
        id: "t5",
        type: "positive",
        title: "Tempo médio de conclusão caiu 18%",
        description: "Os colaboradores estão completando checklists 3 minutos mais rápido em média. A gamificação (Speed Bonus) está incentivando preenchimentos mais ágeis sem perder qualidade.",
        metric: "Tempo Médio",
        data: [18, 17, 16, 16, 15, 15, 14],
        change: -18,
        period: "Últimos 30 dias"
    },
];

const typeConfig = {
    critical: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800", label: "Crítico" },
    warning: { icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", label: "Atenção" },
    positive: { icon: TrendingDown, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", label: "Positivo" },
    suggestion: { icon: Lightbulb, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800", label: "Sugestão IA" },
};

export function TrendAnalysis() {
    const [expanded, setExpanded] = useState<string | null>(insights[0].id);

    return (
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-violet-500" />
                        Análise de Tendências
                        <span className="text-[10px] px-2 py-0.5 bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 rounded-full font-bold">IA</span>
                    </h3>
                    <p className="text-sm text-zinc-500 mt-1">
                        Padrões identificados automaticamente nos seus dados
                    </p>
                </div>
                <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" />
            </div>

            <div className="space-y-3">
                {insights.map((insight, i) => {
                    const config = typeConfig[insight.type];
                    const Icon = config.icon;
                    const isExpanded = expanded === insight.id;

                    return (
                        <motion.div
                            key={insight.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className={cn("rounded-xl border overflow-hidden transition-all", config.border, config.bg)}
                        >
                            <button
                                onClick={() => setExpanded(isExpanded ? null : insight.id)}
                                className="w-full text-left p-4 flex items-center gap-3"
                            >
                                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-white/70 dark:bg-zinc-800")}>
                                    <Icon className={cn("w-5 h-5", config.color)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 truncate">{insight.title}</h4>
                                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", config.bg, config.color)}>
                                            {config.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-0.5">{insight.period}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    {/* Mini Sparkline */}
                                    <div className="flex items-end gap-px h-6">
                                        {insight.data.map((val, j) => {
                                            const max = Math.max(...insight.data);
                                            const min = Math.min(...insight.data);
                                            const range = max - min || 1;
                                            const height = ((val - min) / range) * 100;
                                            return (
                                                <div
                                                    key={j}
                                                    className={cn("w-1.5 rounded-t transition-all", j === insight.data.length - 1 ? config.color.replace("text-", "bg-") : "bg-zinc-300 dark:bg-zinc-600")}
                                                    style={{ height: `${Math.max(height, 10)}%` }}
                                                />
                                            );
                                        })}
                                    </div>
                                    <ChevronDown className={cn("w-4 h-4 text-zinc-400 transition-transform", isExpanded && "rotate-180")} />
                                </div>
                            </button>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-4 pb-4 space-y-3">
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                                {insight.description}
                                            </p>
                                            {insight.action && (
                                                <div className="bg-white/60 dark:bg-zinc-800/60 rounded-lg p-3 flex items-start gap-2">
                                                    <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                                    <div>
                                                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mb-0.5">
                                                            AÇÃO RECOMENDADA
                                                        </p>
                                                        <p className="text-xs text-zinc-600 dark:text-zinc-400">{insight.action}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
