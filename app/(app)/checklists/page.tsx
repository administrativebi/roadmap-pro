"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { QuestionResponse } from "@/types";
import { Flame, Zap, Leaf, Star, ArrowLeft, Loader2, Play, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { createClient } from "@/lib/supabase/client";

const difficultyConfig = {
    easy: { label: "Fácil", icon: Leaf, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950", gradient: "from-emerald-400 to-teal-500" },
    medium: { label: "Médio", icon: Zap, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950", gradient: "from-amber-400 to-orange-500" },
    hard: { label: "Difícil", icon: Flame, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950", gradient: "from-red-400 to-rose-500" },
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
};

function ChecklistsList() {
    const searchParams = useSearchParams();
    const sectorFilter = searchParams.get("sector");

    const [templates, setTemplates] = useState<any[]>([]);
    const [inProgressChecklists, setInProgressChecklists] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastScore, setLastScore] = useState(0);
    const router = useRouter();

    const supabase = createClient();

    useEffect(() => {
        async function fetchTemplates() {
            try {
                // Fechar checklists que já viraram o dia
                await supabase.rpc('auto_close_expired_checklists');

                // Carregar checklists em andamento hoje (limitado à data atual)
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const { data: inProg } = await supabase
                        .from('checklists')
                        .select('id, template_id, started_at, template:checklist_templates(title, icon)')
                        .eq('status', 'in_progress')
                        .eq('user_id', user.id)
                        .gte('started_at', `${todayStr}T00:00:00.000Z`)
                        .order('started_at', { ascending: false });

                    if (inProg) {
                        const formattedProg = inProg.map((exc: any) => ({
                            ...exc,
                            template: Array.isArray(exc.template) ? exc.template[0] : exc.template
                        }));
                        setInProgressChecklists(formattedProg);
                    }
                }

                // Fetch templates and include sector names
                let { data, error } = await supabase
                    .from("checklist_templates")
                    .select('*, sectors(name), template_questions(count)')
                    .eq("is_active", true);

                if (error) {
                    const isColumnError = error.message?.toLowerCase().includes("column") || error.code === "42703";
                    if (isColumnError) {
                        // Fallback: fetch all without is_active filter if column missing
                        const { data: fallbackData, error: fallbackError } = await supabase
                            .from("checklist_templates")
                            .select('*, sectors(name), template_questions(count)');

                        if (fallbackError) {
                            console.error("Error fetching templates:", fallbackError);
                            return;
                        }
                        data = fallbackData;
                    } else {
                        console.error("Error fetching templates:", error);
                        return;
                    }
                }

                let filteredData = data || [];
                if (sectorFilter) {
                    filteredData = filteredData.filter((tpl: any) => tpl.sector_id === sectorFilter);
                }

                // Apply schedule restrictions
                filteredData = filteredData.filter((tpl: any) => {
                    if (!tpl.schedule_config || !tpl.schedule_config.enabled) return true;
                    const sch = tpl.schedule_config;
                    const now = new Date();
                    const todayStr = now.toISOString().split('T')[0];

                    if (sch.start_date && todayStr < sch.start_date) return false;
                    if (sch.end_date && todayStr > sch.end_date) return false;

                    if (sch.recurrence === "weekly" && sch.days_of_week?.length > 0) {
                        if (!sch.days_of_week.includes(now.getDay())) return false;
                    }

                    if (sch.recurrence === "monthly" && sch.day_of_month) {
                        if (sch.day_of_month !== now.getDate()) return false;
                    }

                    // Strict deadline checking
                    if (sch.deadline_time) {
                        const [h, m] = sch.deadline_time.split(':').map(Number);
                        const limit = new Date(now);
                        limit.setHours(h, m, 0, 0);
                        if (now > limit) return false; // Bloqueia check-lists que passaram do horário no dia atual
                    }

                    return true;
                });

                setTemplates(filteredData);
            } finally {
                setIsLoading(false);
            }
        }

        fetchTemplates();
    }, [supabase]);

    const handleComplete = (responses: QuestionResponse[], score: number) => {
        setLastScore(score);
        setShowSuccess(true);

        // Confetti effect! 🎉
        if (typeof window !== "undefined") {
            try {
                confetti({
                    particleCount: 150,
                    spread: 90,
                    origin: { y: 0.6 },
                    colors: ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"],
                });
            } catch { }
        }

        setTimeout(() => {
            setShowSuccess(false);
        }, 4000);
    };



    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Checklists
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                    Selecione um checklist para começar e ganhar pontos!
                </p>
            </div>

            {/* Success Overlay Grande */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.5, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 200 }}
                            className="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-3xl p-1 shadow-2xl"
                        >
                            <div className="bg-white dark:bg-zinc-950 rounded-[20px] p-12 text-center">
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                                    className="text-8xl mb-6"
                                >
                                    🏆
                                </motion.div>
                                <motion.h2
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-4xl font-black text-zinc-900 dark:text-zinc-50 mb-3"
                                >
                                    Incrível!
                                </motion.h2>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-2">Você conquistou</p>
                                    <p className="text-5xl font-black bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                                        +{lastScore}
                                    </p>
                                    <p className="text-lg text-zinc-500 dark:text-zinc-400 mt-1">pontos de XP!</p>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                    className="mt-6 flex items-center justify-center gap-2 text-sm text-amber-600"
                                >
                                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                                    <span className="font-semibold">Continue assim para subir no ranking!</span>
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Template List */}
            <AnimatePresence mode="wait">
                <motion.div
                    key="list"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-10"
                >
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
                            <Loader2 className="w-8 h-8 animate-spin mb-4 text-orange-500" />
                            <p>Carregando checklists...</p>
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="flex justify-center p-12 text-zinc-500 bg-white dark:bg-zinc-950 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                            Nenhum checklist encontrado. Crie um novo no Construtor!
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {/* Em Andamento */}
                            {inProgressChecklists.length > 0 && (
                                <div>
                                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
                                        <Clock className="w-6 h-6 text-amber-500" />
                                        Em Andamento <span className="text-sm ml-2 font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded-md">Para finalizar hoje</span>
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {inProgressChecklists.map((exc) => (
                                            <motion.div
                                                key={exc.id}
                                                variants={cardVariants}
                                                whileHover={{ y: -6, scale: 1.02 }}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => router.push(`/checklists/${exc.template_id}`)}
                                                className="cursor-pointer group bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/50 overflow-hidden hover:shadow-xl hover:shadow-amber-500/10 transition-all"
                                            >
                                                <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
                                                <div className="p-5 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center text-3xl shadow-sm border border-amber-100 dark:border-amber-800">
                                                            {exc.template?.icon || "📋"}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-zinc-900 dark:text-zinc-50 mb-1">
                                                                {exc.template?.title || "Checklist Sem Nome"}
                                                            </h3>
                                                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-500 px-2.5 py-1 bg-amber-100/50 dark:bg-amber-900/50 rounded-lg inline-flex">
                                                                Retomar agora <ChevronRight className="w-3.5 h-3.5" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                {Object.entries(
                                    templates.reduce((acc: Record<string, any[]>, tpl: any) => {
                                        const cat = tpl.sectors?.name || "Geral";
                                        if (!acc[cat]) acc[cat] = [];
                                        acc[cat].push(tpl);
                                        return acc;
                                    }, {})
                                ).map(([category, catTemplates]) => (
                                    <div key={category} className="mb-10 last:mb-0">
                                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
                                            <span className="w-2 h-6 bg-indigo-500 rounded-full" />
                                            Setor: {category}
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {catTemplates.map((tpl: any) => {
                                                // TODO: Make difficulty dynamic eventually or store it on templates DB. For now mock random or rely on config
                                                const diff = difficultyConfig['medium'];
                                                const DiffIcon = diff.icon;
                                                const questionsCount = tpl.template_questions && tpl.template_questions.length > 0 ? tpl.template_questions[0].count : 0;

                                                return (
                                                    <motion.div
                                                        key={tpl.id}
                                                        variants={cardVariants}
                                                        whileHover={{ y: -6, scale: 1.02 }}
                                                        whileTap={{ scale: 0.97 }}
                                                        onClick={() => router.push(`/checklists/${tpl.id}`)}
                                                        className="cursor-pointer group"
                                                    >
                                                        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 overflow-hidden hover:shadow-2xl transition-all">
                                                            {/* Gradient Header */}
                                                            <div className={cn("h-2 bg-gradient-to-r", diff.gradient)} />

                                                            <div className="p-6">
                                                                <div className="flex items-start justify-between mb-4">
                                                                    <span className="text-4xl">{tpl.icon}</span>
                                                                    <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold", diff.bg, diff.color)}>
                                                                        <DiffIcon className="w-3.5 h-3.5" />
                                                                        {diff.label}
                                                                    </div>
                                                                </div>

                                                                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-1 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
                                                                    {tpl.title}
                                                                </h3>
                                                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                                                                    {tpl.description}
                                                                </p>

                                                                {/* Meta Info Removidos ícones e simplificado! */}
                                                                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                                                                            {questionsCount} Perguntas
                                                                        </span>
                                                                        <span className="text-zinc-300 dark:text-zinc-700">&bull;</span>
                                                                        <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                                                                            ~15min
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400">
                                                                        <Play className="w-4 h-4 ml-0.5" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

export default function ChecklistsPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-orange-500" />
                <p>Carregando...</p>
            </div>
        }>
            <ChecklistsList />
        </Suspense>
    );
}
