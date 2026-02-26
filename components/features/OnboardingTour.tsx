"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface TourStep {
    target: string; // CSS selector or special: "center"
    title: string;
    description: string;
    emoji: string;
    position: "top" | "bottom" | "left" | "right" | "center";
}

const tourSteps: TourStep[] = [
    {
        target: "center",
        title: "Bem-vindo ao Checklist Pro! 🎉",
        description: "Vamos fazer um tour rápido para você conhecer todas as funcionalidades. Leva menos de 1 minuto!",
        emoji: "👋",
        position: "center",
    },
    {
        target: "[data-tour='sidebar']",
        title: "Menu de Navegação",
        description: "Aqui você acessa todas as seções: Dashboard, Checklists, Construtor, Ranking e muito mais.",
        emoji: "📱",
        position: "right",
    },
    {
        target: "[data-tour='streak']",
        title: "Sua Sequência 🔥",
        description: "Mantenha sua sequência completando checklists diariamente. Quanto maior a sequência, mais XP bônus!",
        emoji: "🔥",
        position: "right",
    },
    {
        target: "[data-tour='xp-bar']",
        title: "Nível e XP",
        description: "Ganhe XP ao completar checklists, manter sequências e conquistar badges. Suba de nível e desbloqueie recompensas!",
        emoji: "⭐",
        position: "right",
    },
    {
        target: "[data-tour='nav-checklists']",
        title: "Seus Checklists",
        description: "Todos os checklists atribuídos a você aparecem aqui. Responda as perguntas, tire fotos e ganhe pontos!",
        emoji: "✅",
        position: "right",
    },
    {
        target: "[data-tour='nav-builder']",
        title: "Construtor Drag & Drop",
        description: "Crie checklists arrastando perguntas, defina condições, pesos e adicione fotos/vídeos de referência.",
        emoji: "🔧",
        position: "right",
    },
    {
        target: "[data-tour='nav-ranking']",
        title: "Ranking da Equipe",
        description: "Veja quem são os melhores! Compare pontuações, badges e sequências com toda a equipe.",
        emoji: "🏆",
        position: "right",
    },
    {
        target: "center",
        title: "Pronto para começar! 🚀",
        description: "Você pode acessar este tour novamente nas Configurações. Agora é só começar seus checlists e ganhar XP!",
        emoji: "🎯",
        position: "center",
    },
];

export function OnboardingTour() {
    const [isActive, setIsActive] = useState(false);
    const [step, setStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        const seen = localStorage.getItem("checklist-tour-seen");
        if (!seen) {
            // Small delay to let the page render
            const timeout = setTimeout(() => setIsActive(true), 1500);
            return () => clearTimeout(timeout);
        }
    }, []);

    useEffect(() => {
        if (!isActive) return;
        const currentStep = tourSteps[step];
        if (currentStep.target === "center") {
            setTargetRect(null);
            return;
        }

        const el = document.querySelector(currentStep.target);
        if (el) {
            const rect = el.getBoundingClientRect();
            setTargetRect(rect);
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
            setTargetRect(null);
        }
    }, [step, isActive]);

    const handleNext = () => {
        if (step < tourSteps.length - 1) {
            setStep(step + 1);
        } else {
            handleClose();
        }
    };

    const handlePrev = () => {
        if (step > 0) setStep(step - 1);
    };

    const handleClose = () => {
        setIsActive(false);
        localStorage.setItem("checklist-tour-seen", "true");
    };

    // Expose a way to restart tour
    useEffect(() => {
        (window as any).__restartTour = () => {
            localStorage.removeItem("checklist-tour-seen");
            setStep(0);
            setIsActive(true);
        };
    }, []);

    if (!isActive) return null;

    const currentStep = tourSteps[step];
    const isCenter = currentStep.position === "center" || !targetRect;
    const progress = ((step + 1) / tourSteps.length) * 100;

    // Calculate tooltip position
    let tooltipStyle: React.CSSProperties = {};
    if (!isCenter && targetRect) {
        const pad = 16;
        switch (currentStep.position) {
            case "right":
                tooltipStyle = { top: targetRect.top, left: targetRect.right + pad };
                break;
            case "left":
                tooltipStyle = { top: targetRect.top, left: targetRect.left - 360 - pad };
                break;
            case "bottom":
                tooltipStyle = { top: targetRect.bottom + pad, left: targetRect.left };
                break;
            case "top":
                tooltipStyle = { top: targetRect.top - 200, left: targetRect.left };
                break;
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                key="tour-overlay"
                className="fixed inset-0 z-[90]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* Dark overlay with hole */}
                <div className="absolute inset-0">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <mask id="tour-mask">
                                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                                {targetRect && (
                                    <rect
                                        x={targetRect.left - 8}
                                        y={targetRect.top - 8}
                                        width={targetRect.width + 16}
                                        height={targetRect.height + 16}
                                        rx={12}
                                        fill="black"
                                    />
                                )}
                            </mask>
                        </defs>
                        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask="url(#tour-mask)" />
                    </svg>
                </div>

                {/* Highlight border */}
                {targetRect && (
                    <motion.div
                        className="absolute border-2 border-amber-400 rounded-xl pointer-events-none"
                        style={{
                            left: targetRect.left - 8,
                            top: targetRect.top - 8,
                            width: targetRect.width + 16,
                            height: targetRect.height + 16,
                        }}
                        animate={{ boxShadow: ["0 0 0 0 rgba(251,191,36,0.4)", "0 0 0 8px rgba(251,191,36,0)", "0 0 0 0 rgba(251,191,36,0.4)"] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    />
                )}

                {/* Tooltip */}
                <motion.div
                    key={step}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={cn(
                        "absolute bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 w-[340px] overflow-hidden",
                        isCenter && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    )}
                    style={!isCenter ? tooltipStyle : undefined}
                >
                    {/* Gradient header */}
                    <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />

                    <div className="p-5">
                        {/* Close */}
                        <button onClick={handleClose} className="absolute top-3 right-3 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 z-10">
                            <X className="w-4 h-4" />
                        </button>

                        {/* Emoji */}
                        <div className="text-4xl mb-3">{currentStep.emoji}</div>

                        {/* Content */}
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-base mb-2">{currentStep.title}</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{currentStep.description}</p>

                        {/* Progress bar */}
                        <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-4 mb-3 overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-400 font-medium">{step + 1} de {tourSteps.length}</span>
                            <div className="flex items-center gap-2">
                                {step > 0 && (
                                    <button onClick={handlePrev} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1">
                                        <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                                    </button>
                                )}
                                <button
                                    onClick={handleNext}
                                    className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-xs font-bold hover:from-amber-600 hover:to-orange-600 flex items-center gap-1"
                                >
                                    {step === tourSteps.length - 1 ? "Começar!" : "Próximo"} <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
