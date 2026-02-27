"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { QuestionResponse } from "@/types";
import { Flame, Zap, Leaf, Star, ArrowLeft, Loader2, Play } from "lucide-react";
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
    const [isLoading, setIsLoading] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastScore, setLastScore] = useState(0);
    const router = useRouter();

    const supabase = createClient();

    useEffect(() => {
        async function fetchTemplates() {
            try {
                // Fetch templates and include sector names
                const { data, error } = await supabase
                    .from("checklist_templates")
                    .select('*, sectors(name), template_questions(count)')
                    .eq("is_active", true);

                if (error) {
                    console.error("Error fetching templates:", error);
                    return;
                }

                let filteredData = data || [];
                if (sectorFilter) {
                    filteredData = filteredData.filter((tpl: any) => tpl.sector_id === sectorFilter);
                }

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
                        Object.entries(
                            templates.reduce((acc: Record<string, any[]>, tpl: any) => {
                                const cat = tpl.sectors?.name || "Geral";
                                if (!acc[cat]) acc[cat] = [];
                                acc[cat].push(tpl);
                                return acc;
                            }, {})
                        ).map(([category, catTemplates]) => (
                            <div key={category}>
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
                        ))
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
