"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    CheckCircle2, Trophy, ArrowRight, Home,
    Share2, Download, Sparkles, Star,
    Target, Zap, Award, Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const score = parseInt(searchParams.get("score") || "0");
    const earned = parseInt(searchParams.get("earned") || "0");
    const total = parseInt(searchParams.get("total") || "0");
    const xp = parseInt(searchParams.get("xp") || "0");
    const title = searchParams.get("title") || "Checklist Concluído";

    useEffect(() => {
        // Trigger confetti on mount
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    // Color based on score
    const getScoreColor = () => {
        if (score >= 90) return "text-emerald-500 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20";
        if (score >= 70) return "text-blue-500 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20";
        if (score >= 50) return "text-amber-500 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20";
        return "text-rose-500 border-rose-500 bg-rose-50/50 dark:bg-rose-950/20";
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 relative z-10"
            >
                {/* Header Decoration */}
                <div className="h-32 bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 10, stiffness: 100, delay: 0.2 }}
                        className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/30"
                    >
                        <CheckCircle2 className="w-12 h-12 text-white" />
                    </motion.div>
                </div>

                <div className="p-8 text-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <h1 className="text-2xl font-black text-zinc-900 dark:text-white mb-1">
                            ¡Excelente Trabalho!
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
                            Você concluiu o checklist: <br />
                            <span className="font-bold text-zinc-700 dark:text-zinc-300">"{title}"</span>
                        </p>
                    </motion.div>

                    {/* Score Circle */}
                    <div className="flex flex-col items-center justify-center mb-8">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5, type: "spring" }}
                            className={cn(
                                "w-32 h-32 rounded-full border-[10px] flex flex-col items-center justify-center mb-2 shadow-inner",
                                getScoreColor()
                            )}
                        >
                            <span className="text-4xl font-black">{score}%</span>
                            <span className="text-[10px] uppercase font-bold tracking-widest opacity-70">Conformidade</span>
                        </motion.div>
                        <p className="text-xs text-zinc-400 font-medium">
                            {earned} de {total} pontos totais atingidos
                        </p>
                    </div>

                    {/* Rewards Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-8">
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex flex-col items-center"
                        >
                            <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center mb-2 shadow-lg">
                                <Zap className="w-4 h-4 text-white" strokeWidth={3} />
                            </div>
                            <span className="text-lg font-black text-amber-700 dark:text-amber-300">+{xp} XP</span>
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">Experiência</span>
                        </motion.div>

                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex flex-col items-center"
                        >
                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mb-2 shadow-lg">
                                <Trophy className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-lg font-black text-blue-700 dark:text-blue-300">+{Math.round(score / 10)}</span>
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">Moedas</span>
                        </motion.div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={() => router.push("/checklists")}
                            className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all text-sm"
                        >
                            Voltar para Checklists <ArrowRight className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => router.push("/dashboard")}
                                className="py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all text-sm"
                            >
                                <Home className="w-4 h-4" /> Dash
                            </button>
                            <button
                                onClick={() => router.push("/checklists/dashboard")}
                                className="py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all text-sm"
                            >
                                <Award className="w-4 h-4" /> Painel
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Achievement Toast */}
            {score >= 90 && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.5, type: "spring" }}
                    className="mt-8 bg-emerald-500 text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-lg z-20"
                >
                    <Sparkles className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-tight">Conquista Desbloqueada: Inspeção Perfeita!</span>
                </motion.div>
            )}
        </div>
    );
}

export default function ChecklistSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950"><Zap className="w-8 h-8 text-orange-500 animate-pulse" /></div>}>
            <SuccessContent />
        </Suspense>
    );
}
