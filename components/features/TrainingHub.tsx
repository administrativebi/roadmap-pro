"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    GraduationCap, Play, CheckCircle2, Clock, Star,
    ChevronRight, BookOpen, Video, Award, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TrainingModule {
    id: string;
    title: string;
    description: string;
    videoUrl: string;
    duration: string;
    category: string;
    linkedQuestions: string[];
    thumbnail: string;
    completed: boolean;
    xpReward: number;
    difficulty: "beginner" | "intermediate" | "advanced";
}

const modules: TrainingModule[] = [
    { id: "t1", title: "Como Verificar Temperatura Correta", description: "Aprenda a usar termômetro infravermelho e digital para medir temperatura de câmaras frias, congeladores e alimentos.", videoUrl: "#", duration: "3:45", category: "APPCC", linkedQuestions: ["Temperatura câmara fria ≤ 5°C?", "Temperatura congelador ≤ -18°C?"], thumbnail: "🌡️", completed: true, xpReward: 50, difficulty: "beginner" },
    { id: "t2", title: "Procedimento FIFO no Estoque", description: "Entenda o sistema First In First Out e como aplicá-lo na organização do estoque do restaurante.", videoUrl: "#", duration: "5:20", category: "Estoque", linkedQuestions: ["FIFO aplicado no estoque?", "Produtos com rótulo visível?"], thumbnail: "📦", completed: true, xpReward: 60, difficulty: "beginner" },
    { id: "t3", title: "Higienização de Superfícies", description: "Técnicas corretas de limpeza e sanitização de bancadas, equipamentos e utensílios.", videoUrl: "#", duration: "4:10", category: "Limpeza", linkedQuestions: ["Área de preparo higienizada?", "Equipamentos limpos?"], thumbnail: "🧹", completed: false, xpReward: 55, difficulty: "intermediate" },
    { id: "t4", title: "Uso Correto de EPIs", description: "Quais equipamentos de proteção são obrigatórios na cozinha e como utilizá-los corretamente.", videoUrl: "#", duration: "2:30", category: "Segurança", linkedQuestions: ["EPIs utilizados corretamente?"], thumbnail: "🧤", completed: false, xpReward: 45, difficulty: "beginner" },
    { id: "t5", title: "Calibração de Equipamentos", description: "Guia passo-a-passo para verificar e calibrar balanças, termômetros e outros instrumentos.", videoUrl: "#", duration: "6:15", category: "APPCC", linkedQuestions: ["Equipamentos calibrados?"], thumbnail: "⚙️", completed: false, xpReward: 80, difficulty: "advanced" },
    { id: "t6", title: "Controle de Pragas — O que Observar", description: "Como identificar sinais de infestação e manter o controle preventivo de pragas.", videoUrl: "#", duration: "3:50", category: "APPCC", linkedQuestions: ["Controle de pragas em dia?"], thumbnail: "🐛", completed: false, xpReward: 70, difficulty: "intermediate" },
];

const diffBadge = {
    beginner: { label: "Iniciante", color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" },
    intermediate: { label: "Intermediário", color: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400" },
    advanced: { label: "Avançado", color: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400" },
};

export function TrainingHub() {
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
    const [watching, setWatching] = useState(false);

    const completedCount = modules.filter((m) => m.completed).length;
    const progress = Math.round((completedCount / modules.length) * 100);
    const totalXP = modules.filter((m) => m.completed).reduce((sum, m) => sum + m.xpReward, 0);

    const filtered = modules.filter((m) => {
        if (filter === "pending") return !m.completed;
        if (filter === "completed") return m.completed;
        return true;
    });

    const selected = modules.find((m) => m.id === selectedModule);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        Central de Treinamento
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">Vídeos vinculados às perguntas do checklist</p>
                </div>
            </div>

            {/* Progress */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/70 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                            <p className="font-bold text-zinc-900 dark:text-zinc-50">Progresso de Capacitação</p>
                            <p className="text-xs text-zinc-500">{completedCount} de {modules.length} módulos concluídos</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalXP} <span className="text-sm font-normal">XP</span></p>
                        <p className="text-[10px] text-zinc-400">ganhos em treinamento</p>
                    </div>
                </div>
                <div className="w-full h-3 bg-white/50 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1 }}
                    />
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-2">{progress}% concluído</p>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                {[
                    { id: "all" as const, label: "Todos", count: modules.length },
                    { id: "pending" as const, label: "Pendentes", count: modules.filter((m) => !m.completed).length },
                    { id: "completed" as const, label: "Concluídos", count: completedCount },
                ].map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                            filter === f.id ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        )}
                    >
                        {f.label} ({f.count})
                    </button>
                ))}
            </div>

            {/* Video Player Modal */}
            <AnimatePresence>
                {selectedModule && selected && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => { setSelectedModule(null); setWatching(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Video Area */}
                            <div className="relative bg-zinc-900 aspect-video flex items-center justify-center">
                                <span className="text-8xl">{selected.thumbnail}</span>
                                {!watching && (
                                    <button
                                        onClick={() => setWatching(true)}
                                        className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-all"
                                    >
                                        <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-2xl">
                                            <Play className="w-8 h-8 text-zinc-900 ml-1" />
                                        </div>
                                    </button>
                                )}
                                {watching && (
                                    <div className="absolute bottom-4 left-4 right-4 bg-black/60 rounded-xl px-4 py-2 flex items-center gap-3">
                                        <div className="w-full h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                            <motion.div className="h-full bg-emerald-500 rounded-full" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 10 }} />
                                        </div>
                                        <span className="text-xs text-white font-mono shrink-0">{selected.duration}</span>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", diffBadge[selected.difficulty].color)}>
                                        {diffBadge[selected.difficulty].label}
                                    </span>
                                    <span className="text-xs text-zinc-400">{selected.duration}</span>
                                    <span className="text-xs text-amber-500 font-bold">+{selected.xpReward} XP</span>
                                </div>
                                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50 mb-2">{selected.title}</h3>
                                <p className="text-sm text-zinc-500 mb-4">{selected.description}</p>

                                {/* Linked Questions */}
                                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Perguntas Vinculadas</p>
                                    {selected.linkedQuestions.map((q) => (
                                        <div key={q} className="flex items-center gap-2 py-1.5">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span className="text-sm text-zinc-700 dark:text-zinc-300">{q}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Module Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map((module, i) => {
                    const badge = diffBadge[module.difficulty];
                    return (
                        <motion.button
                            key={module.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            onClick={() => setSelectedModule(module.id)}
                            className={cn(
                                "text-left bg-white dark:bg-zinc-950 rounded-2xl border-2 p-5 transition-all hover:shadow-md group",
                                module.completed ? "border-emerald-200 dark:border-emerald-800" : "border-zinc-100 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-700"
                            )}
                        >
                            <div className="flex items-start gap-4">
                                <div className="relative w-16 h-16 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-3xl shrink-0 group-hover:scale-105 transition-transform">
                                    {module.thumbnail}
                                    {module.completed && (
                                        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                                            <CheckCircle2 className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">{module.title}</h4>
                                    </div>
                                    <p className="text-xs text-zinc-500 line-clamp-2 mb-2">{module.description}</p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", badge.color)}>{badge.label}</span>
                                        <span className="text-[10px] text-zinc-400 flex items-center gap-1"><Clock className="w-3 h-3" />{module.duration}</span>
                                        <span className="text-[10px] text-zinc-400">📁 {module.category}</span>
                                        <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1"><Star className="w-3 h-3" />+{module.xpReward} XP</span>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-zinc-300 dark:text-zinc-600 shrink-0 group-hover:text-emerald-500 transition-colors" />
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
