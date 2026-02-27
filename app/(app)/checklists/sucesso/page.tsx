"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Suspense } from "react";
import {
    CheckCircle2, Trophy, Star, Zap, ArrowRight,
    ClipboardCheck, TrendingUp, Sparkles, Home
} from "lucide-react";

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const score = parseInt(searchParams.get("score") || "0");
    const earned = parseInt(searchParams.get("earned") || "0");
    const total = parseInt(searchParams.get("total") || "1");
    const xp = parseInt(searchParams.get("xp") || "0");
    const title = searchParams.get("title") || "Checklist";

    const getScoreColor = () => {
        if (score >= 90) return { from: "from-emerald-500", to: "to-green-400", text: "text-emerald-500", bg: "bg-emerald-500" };
        if (score >= 70) return { from: "from-blue-500", to: "to-cyan-400", text: "text-blue-500", bg: "bg-blue-500" };
        if (score >= 50) return { from: "from-amber-500", to: "to-yellow-400", text: "text-amber-500", bg: "bg-amber-500" };
        return { from: "from-rose-500", to: "to-red-400", text: "text-rose-500", bg: "bg-rose-500" };
    };

    const getPerformanceLabel = () => {
        if (score >= 95) return { label: "Excelência Total!", emoji: "🏆", desc: "Resultado perfeito ou quase perfeito!" };
        if (score >= 85) return { label: "Ótimo Trabalho!", emoji: "🌟", desc: "Muito acima da média!" };
        if (score >= 70) return { label: "Bom Resultado", emoji: "👍", desc: "Acima do esperado." };
        if (score >= 50) return { label: "Precisa Melhorar", emoji: "⚠️", desc: "Alguns pontos precisam de atenção." };
        return { label: "Atenção Necessária", emoji: "🔴", desc: "Vários itens precisam ser resolvidos." };
    };

    const colors = getScoreColor();
    const performance = getPerformanceLabel();

    // Confetti particles
    const confettiColors = ["#f59e0b", "#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899"];

    return (
        <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
            {/* Confetti Animation */}
            {score >= 70 && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {Array.from({ length: 40 }).map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-2.5 h-2.5 rounded-sm"
                            style={{
                                backgroundColor: confettiColors[i % confettiColors.length],
                                left: `${Math.random() * 100}%`,
                                top: -20,
                            }}
                            initial={{ y: -20, rotate: 0, opacity: 1 }}
                            animate={{
                                y: [0, window?.innerHeight || 800],
                                rotate: [0, Math.random() * 720 - 360],
                                opacity: [1, 1, 0],
                                x: [0, (Math.random() - 0.5) * 200],
                            }}
                            transition={{
                                duration: 2.5 + Math.random() * 2,
                                delay: Math.random() * 1.5,
                                ease: "easeOut",
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Main Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-lg bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden"
            >
                {/* Top gradient banner */}
                <div className={`h-2 bg-gradient-to-r ${colors.from} ${colors.to}`} />

                <div className="p-8 flex flex-col items-center text-center">
                    {/* Success Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                        className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${colors.from} ${colors.to} flex items-center justify-center mb-6 shadow-xl`}
                    >
                        <CheckCircle2 className="w-10 h-10 text-white" />
                    </motion.div>

                    {/* Title */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">
                            Checklist Concluído
                        </p>
                        <h1 className="text-2xl font-black text-zinc-900 dark:text-white mb-1">
                            {performance.emoji} {performance.label}
                        </h1>
                        <p className="text-sm text-zinc-500 mb-6">{title}</p>
                    </motion.div>

                    {/* Score Gauge */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="relative mb-8"
                    >
                        <svg width="160" height="160" viewBox="0 0 120 120" className="transform -rotate-90">
                            <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="8"
                                className="text-zinc-100 dark:text-zinc-800" />
                            <motion.circle
                                cx="60" cy="60" r="50" fill="none" strokeWidth="8" strokeLinecap="round"
                                className={colors.text}
                                stroke="currentColor"
                                strokeDasharray={`${2 * Math.PI * 50}`}
                                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - score / 100) }}
                                transition={{ delay: 0.6, duration: 1.5, ease: "easeOut" }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                className={`text-4xl font-black ${colors.text}`}
                            >
                                {score}%
                            </motion.span>
                            <span className="text-xs text-zinc-400 font-medium">Score</span>
                        </div>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="grid grid-cols-3 gap-3 w-full mb-6"
                    >
                        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                <ClipboardCheck className="w-4 h-4 text-emerald-500" />
                            </div>
                            <p className="text-lg font-black text-zinc-900 dark:text-white">{earned}/{total}</p>
                            <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide">Conformes</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-2xl p-4 border border-amber-100 dark:border-amber-900/50">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                <Zap className="w-4 h-4 text-amber-500" />
                            </div>
                            <p className="text-lg font-black text-amber-600 dark:text-amber-400">+{xp}</p>
                            <p className="text-[10px] text-amber-500 font-medium uppercase tracking-wide">XP Ganhos</p>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                <TrendingUp className="w-4 h-4 text-blue-500" />
                            </div>
                            <p className="text-lg font-black text-zinc-900 dark:text-white">
                                {total - earned}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide">Pendências</p>
                        </div>
                    </motion.div>

                    {/* Performance description */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="text-sm text-zinc-500 dark:text-zinc-400 mb-8"
                    >
                        {performance.desc}
                    </motion.p>

                    {/* Badges */}
                    {score >= 80 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.2, type: "spring" }}
                            className="flex items-center gap-3 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200 dark:border-violet-800 rounded-2xl px-5 py-3 mb-8"
                        >
                            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Trophy className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-violet-700 dark:text-violet-300">
                                    {score >= 95 ? "Badge: Perfeicionista" : "Badge: Dedicado"}
                                </p>
                                <p className="text-xs text-violet-500">
                                    {score >= 95 ? "Você atingiu quase 100% de conformidade!" : "Desempenho acima de 80%!"}
                                </p>
                            </div>
                            <Sparkles className="w-5 h-5 text-violet-400 ml-auto" />
                        </motion.div>
                    )}

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.3 }}
                        className="flex flex-col sm:flex-row gap-3 w-full"
                    >
                        <button
                            onClick={() => router.push("/checklists")}
                            className="flex-1 flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-6 py-3 rounded-xl font-bold text-sm transition-all"
                        >
                            <ClipboardCheck className="w-4 h-4" /> Realizar Outro
                        </button>
                        <button
                            onClick={() => router.push("/checklists/dashboard")}
                            className={`flex-1 flex items-center justify-center gap-2 bg-gradient-to-r ${colors.from} ${colors.to} text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl`}
                        >
                            Ver Dashboard <ArrowRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                </div>
            </motion.div>

            {/* Go home link */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                onClick={() => router.push("/dashboard")}
                className="mt-6 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors flex items-center gap-1.5"
            >
                <Home className="w-4 h-4" /> Voltar ao início
            </motion.button>
        </div>
    );
}

export default function ChecklistSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[85vh] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-zinc-200 border-t-orange-500 rounded-full" />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
