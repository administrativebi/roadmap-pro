"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Rocket, CheckCircle2, Lock, Star, ChevronRight,
    Award, Zap, Gift, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingPhase {
    id: string;
    title: string;
    description: string;
    icon: string;
    steps: OnboardingStep[];
    reward: string;
    rewardXP: number;
    unlocked: boolean;
}

interface OnboardingStep {
    id: string;
    title: string;
    type: "video" | "quiz" | "practice" | "checklist";
    xp: number;
    completed: boolean;
    description: string;
}

const onboardingPhases: OnboardingPhase[] = [
    {
        id: "phase1",
        title: "Conhecendo o Checklist Pro",
        description: "Aprenda a navegar pelo sistema e entender os conceitos básicos",
        icon: "🎓",
        reward: "Badge: Primeiro Login",
        rewardXP: 100,
        unlocked: true,
        steps: [
            { id: "s1", title: "Assista ao vídeo de boas-vindas", type: "video", xp: 20, completed: true, description: "3 min — Conheça a interface e funcionalidades" },
            { id: "s2", title: "Complete seu perfil", type: "practice", xp: 15, completed: true, description: "Foto, cargo, turno preferido" },
            { id: "s3", title: "Quiz: Navegação básica", type: "quiz", xp: 30, completed: true, description: "5 perguntas sobre a interface" },
            { id: "s4", title: "Seu primeiro checklist de teste", type: "checklist", xp: 35, completed: false, description: "Checklist simulado com 3 perguntas" },
        ],
    },
    {
        id: "phase2",
        title: "Segurança Alimentar Essencial",
        description: "Fundamentos de APPCC e boas práticas",
        icon: "🛡️",
        reward: "Badge: Guardião da Segurança",
        rewardXP: 200,
        unlocked: true,
        steps: [
            { id: "s5", title: "Vídeo: Introdução ao APPCC", type: "video", xp: 25, completed: false, description: "5 min — O que é e por que importa" },
            { id: "s6", title: "Vídeo: Temperaturas corretas", type: "video", xp: 25, completed: false, description: "4 min — Câmara fria, congelador, banho-maria" },
            { id: "s7", title: "Quiz: Segurança alimentar", type: "quiz", xp: 40, completed: false, description: "8 perguntas sobre APPCC" },
            { id: "s8", title: "Checklist de treinamento: APPCC", type: "checklist", xp: 50, completed: false, description: "Checklist real supervisionado" },
        ],
    },
    {
        id: "phase3",
        title: "Limpeza e Organização",
        description: "Procedimentos de higienização e organização de cada área",
        icon: "✨",
        reward: "Badge: Mestre da Limpeza",
        rewardXP: 150,
        unlocked: false,
        steps: [
            { id: "s9", title: "Vídeo: Protocolo de limpeza", type: "video", xp: 20, completed: false, description: "4 min — Produtos e técnicas" },
            { id: "s10", title: "Vídeo: Organização FIFO", type: "video", xp: 20, completed: false, description: "3 min — First In First Out" },
            { id: "s11", title: "Quiz: Limpeza e FIFO", type: "quiz", xp: 35, completed: false, description: "6 perguntas" },
            { id: "s12", title: "Checklist de treinamento: Limpeza", type: "checklist", xp: 45, completed: false, description: "Simulação prática" },
        ],
    },
    {
        id: "phase4",
        title: "Pronto para Ação! 🚀",
        description: "Avaliação final e liberação para checklists reais",
        icon: "🏆",
        reward: "Badge: Profissional Certificado",
        rewardXP: 300,
        unlocked: false,
        steps: [
            { id: "s13", title: "Avaliação final teórica", type: "quiz", xp: 60, completed: false, description: "15 perguntas de todas as áreas" },
            { id: "s14", title: "Checklist real supervisionado", type: "checklist", xp: 80, completed: false, description: "Acompanhado por gestor" },
            { id: "s15", title: "Feedback do gestor", type: "practice", xp: 40, completed: false, description: "Avaliação e dicas" },
            { id: "s16", title: "Cerimônia de conclusão 🎉", type: "practice", xp: 120, completed: false, description: "Receba sua certificação!" },
        ],
    },
];

const typeIcons = {
    video: "🎬",
    quiz: "📝",
    practice: "🎯",
    checklist: "✅",
};

export function OnboardingJourney() {
    const [expandedPhase, setExpandedPhase] = useState<string>("phase1");

    const totalSteps = onboardingPhases.flatMap((p) => p.steps).length;
    const completedSteps = onboardingPhases.flatMap((p) => p.steps).filter((s) => s.completed).length;
    const totalXP = onboardingPhases.flatMap((p) => p.steps).filter((s) => s.completed).reduce((sum, s) => sum + s.xp, 0);
    const overallProgress = Math.round((completedSteps / totalSteps) * 100);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Rocket className="w-5 h-5 text-white" />
                        </div>
                        Jornada de Onboarding
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">Treinamento gamificado para novos colaboradores</p>
                </div>
            </div>

            {/* Overall Progress */}
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 rounded-2xl p-6 border border-rose-200 dark:border-rose-800">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Progresso Geral</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">{completedSteps} de {totalSteps} etapas concluídas</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <p className="text-xl font-black text-rose-600 dark:text-rose-400">{totalXP}</p>
                            <p className="text-[10px] text-zinc-400">XP Total</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-black text-amber-500">{onboardingPhases.filter((p) => p.steps.every((s) => s.completed)).length}</p>
                            <p className="text-[10px] text-zinc-400">Badges</p>
                        </div>
                    </div>
                </div>
                <div className="w-full h-4 bg-white/50 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-rose-400 to-pink-500 rounded-full relative"
                        initial={{ width: 0 }}
                        animate={{ width: `${overallProgress}%` }}
                        transition={{ duration: 1.2, ease: "easeInOut" }}
                    >
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white">{overallProgress}%</div>
                    </motion.div>
                </div>
            </div>

            {/* Phases */}
            <div className="space-y-4">
                {onboardingPhases.map((phase, pi) => {
                    const phaseCompleted = phase.steps.every((s) => s.completed);
                    const phaseProgress = phase.steps.filter((s) => s.completed).length;
                    const isExpanded = expandedPhase === phase.id;

                    return (
                        <motion.div
                            key={phase.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: pi * 0.1 }}
                            className={cn(
                                "bg-white dark:bg-zinc-950 rounded-2xl border-2 overflow-hidden transition-all",
                                phaseCompleted ? "border-emerald-300 dark:border-emerald-700" : !phase.unlocked ? "border-zinc-200 dark:border-zinc-800 opacity-60" : "border-zinc-100 dark:border-zinc-800"
                            )}
                        >
                            <button
                                onClick={() => phase.unlocked && setExpandedPhase(isExpanded ? "" : phase.id)}
                                className="w-full p-5 text-left flex items-center gap-4"
                                disabled={!phase.unlocked}
                            >
                                <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0",
                                    phaseCompleted ? "bg-emerald-100 dark:bg-emerald-950" : "bg-zinc-100 dark:bg-zinc-900"
                                )}>
                                    {phase.unlocked ? phase.icon : <Lock className="w-6 h-6 text-zinc-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{phase.title}</h3>
                                        {phaseCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-0.5">{phase.description}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="w-24 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(phaseProgress / phase.steps.length) * 100}%` }} />
                                        </div>
                                        <span className="text-[10px] text-zinc-400">{phaseProgress}/{phase.steps.length}</span>
                                        <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                                            <Gift className="w-3 h-3" /> {phase.rewardXP} XP
                                        </span>
                                    </div>
                                </div>
                                {phase.unlocked && <ChevronRight className={cn("w-5 h-5 text-zinc-400 transition-transform", isExpanded && "rotate-90")} />}
                            </button>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-5 pb-5 space-y-2">
                                            {phase.steps.map((step, si) => (
                                                <div
                                                    key={step.id}
                                                    className={cn(
                                                        "flex items-center gap-3 p-3 rounded-xl transition-all",
                                                        step.completed ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                    )}
                                                >
                                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-lg",
                                                        step.completed ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700"
                                                    )}>
                                                        {step.completed ? <CheckCircle2 className="w-5 h-5 text-white" /> : typeIcons[step.type]}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn("text-sm font-medium", step.completed ? "text-emerald-700 dark:text-emerald-300 line-through" : "text-zinc-900 dark:text-zinc-50")}>{step.title}</p>
                                                        <p className="text-[10px] text-zinc-400">{step.description}</p>
                                                    </div>
                                                    <span className="text-xs text-amber-500 font-bold shrink-0">+{step.xp} XP</span>
                                                </div>
                                            ))}

                                            {/* Reward */}
                                            <div className="mt-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl p-3 flex items-center gap-3">
                                                <Award className="w-6 h-6 text-amber-500" />
                                                <div>
                                                    <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Recompensa da Fase</p>
                                                    <p className="text-[10px] text-amber-600 dark:text-amber-400">{phase.reward} (+{phase.rewardXP} XP bônus)</p>
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
        </div>
    );
}
