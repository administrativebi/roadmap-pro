"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ClipboardCheck, Star, MessageSquare, ChevronDown,
    Save, TrendingUp, TrendingDown, Minus, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Evaluation {
    id: string;
    collaborator: { name: string; avatar: string; role: string };
    checklist: string;
    date: string;
    score: number;
    categories: {
        name: string;
        rating: number; // 1-5
        comment: string;
    }[];
    overallComment: string;
    trend: "up" | "down" | "stable";
}

interface CollaboratorSummary {
    name: string;
    avatar: string;
    role: string;
    averageRating: number;
    totalEvaluations: number;
    trend: "up" | "down" | "stable";
    strengths: string[];
    improvements: string[];
    lastEvaluation: string;
}

const collaboratorsSummary: CollaboratorSummary[] = [
    { name: "Carlos Silva", avatar: "🧑‍🍳", role: "Cozinheiro Chefe", averageRating: 4.6, totalEvaluations: 15, trend: "up", strengths: ["Atenção aos detalhes", "Velocidade de execução"], improvements: ["Documentação fotográfica"], lastEvaluation: "Hoje, 10:30" },
    { name: "Ana Souza", avatar: "👩‍🍳", role: "Sub-chef", averageRating: 4.8, totalEvaluations: 12, trend: "stable", strengths: ["APPCC impecável", "Liderança"], improvements: ["Pontualidade"], lastEvaluation: "Ontem, 15:45" },
    { name: "Roberto Lima", avatar: "👨‍🍳", role: "Auxiliar de Cozinha", averageRating: 3.9, totalEvaluations: 18, trend: "up", strengths: ["Proatividade", "Trabalho em equipe"], improvements: ["Organização do estoque", "Controle de temperatura"], lastEvaluation: "Hoje, 08:15" },
    { name: "Maria Santos", avatar: "👩", role: "Atendente", averageRating: 4.2, totalEvaluations: 10, trend: "down", strengths: ["Atendimento ao cliente"], improvements: ["Limpeza de mesas", "Verificação de estoque"], lastEvaluation: "Há 2 dias" },
    { name: "Pedro Costa", avatar: "🧑", role: "Auxiliar Geral", averageRating: 3.5, totalEvaluations: 8, trend: "up", strengths: ["Disponibilidade"], improvements: ["Atenção aos detalhes", "APPCC", "Velocidade"], lastEvaluation: "Ontem, 20:00" },
];

const evaluationCategories = [
    "Execução do checklist",
    "Atenção aos detalhes",
    "Tempo de conclusão",
    "Documentação (fotos)",
    "Postura e EPI",
];

export function Evaluation360() {
    const [selectedCollaborator, setSelectedCollaborator] = useState<string | null>(null);
    const [view, setView] = useState<"list" | "evaluate">("list");
    const [ratings, setRatings] = useState<Record<string, number>>({});
    const [comments, setComments] = useState<Record<string, string>>({});
    const [overallComment, setOverallComment] = useState("");
    const [saved, setSaved] = useState(false);

    const handleRate = (category: string, rating: number) => {
        setRatings({ ...ratings, [category]: rating });
    };

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const trendIcon = (trend: string) => {
        switch (trend) {
            case "up": return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
            case "down": return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
            default: return <Minus className="w-3.5 h-3.5 text-zinc-400" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            <ClipboardCheck className="w-5 h-5 text-white" />
                        </div>
                        Avaliação 360°
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">Observações do gestor sobre a execução de cada colaborador</p>
                </div>
                {view === "evaluate" && (
                    <button
                        onClick={() => { setView("list"); setSelectedCollaborator(null); }}
                        className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-400"
                    >
                        ← Voltar
                    </button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {view === "list" ? (
                    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                        {/* Collaborator Cards */}
                        {collaboratorsSummary.map((collab, i) => (
                            <motion.div
                                key={collab.name}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-2xl shrink-0">
                                        {collab.avatar}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-zinc-900 dark:text-zinc-50">{collab.name}</h4>
                                            {trendIcon(collab.trend)}
                                        </div>
                                        <p className="text-xs text-zinc-400 mb-3">{collab.role} • {collab.totalEvaluations} avaliações • Última: {collab.lastEvaluation}</p>

                                        {/* Star Rating */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="flex gap-0.5">
                                                {Array.from({ length: 5 }, (_, j) => (
                                                    <Star
                                                        key={j}
                                                        className={cn("w-4 h-4",
                                                            j < Math.floor(collab.averageRating) ? "text-amber-400 fill-amber-400" :
                                                                j < collab.averageRating ? "text-amber-400 fill-amber-200" : "text-zinc-200 dark:text-zinc-700"
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-sm font-bold text-amber-500">{collab.averageRating.toFixed(1)}</span>
                                        </div>

                                        {/* Strengths & Improvements */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Pontos fortes</p>
                                                {collab.strengths.map((s) => (
                                                    <p key={s} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" /> {s}
                                                    </p>
                                                ))}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">A melhorar</p>
                                                {collab.improvements.map((s) => (
                                                    <p key={s} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" /> {s}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => { setSelectedCollaborator(collab.name); setView("evaluate"); setRatings({}); setOverallComment(""); }}
                                        className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-all shrink-0"
                                    >
                                        Avaliar
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div key="evaluate" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                        {/* Evaluating who */}
                        <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl p-5 border border-indigo-200 dark:border-indigo-800">
                            <p className="text-sm text-indigo-600 dark:text-indigo-400">
                                Avaliando: <strong>{selectedCollaborator}</strong> — Último checklist concluído
                            </p>
                        </div>

                        {/* Rating Categories */}
                        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6 space-y-5">
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm mb-1">Avaliação por Categoria</h3>

                            {evaluationCategories.map((cat) => {
                                const rating = ratings[cat] || 0;
                                return (
                                    <div key={cat} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-zinc-700 dark:text-zinc-300">{cat}</p>
                                            <div className="flex gap-1">
                                                {Array.from({ length: 5 }, (_, j) => (
                                                    <button
                                                        key={j}
                                                        onClick={() => handleRate(cat, j + 1)}
                                                        className="transition-transform hover:scale-110"
                                                    >
                                                        <Star
                                                            className={cn("w-6 h-6 transition-colors",
                                                                j < rating ? "text-amber-400 fill-amber-400" : "text-zinc-200 dark:text-zinc-700"
                                                            )}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder={`Comentário sobre ${cat.toLowerCase()} (opcional)`}
                                            value={comments[cat] || ""}
                                            onChange={(e) => setComments({ ...comments, [cat]: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                );
                            })}

                            {/* Overall */}
                            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Comentário Geral</p>
                                <textarea
                                    value={overallComment}
                                    onChange={(e) => setOverallComment(e.target.value)}
                                    placeholder="Observações gerais sobre o desempenho deste colaborador neste checklist..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Save */}
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSave}
                                className={cn(
                                    "w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                                    saved ? "bg-emerald-500 text-white" : "bg-gradient-to-r from-indigo-500 to-blue-500 text-white hover:from-indigo-600 hover:to-blue-600 shadow-lg"
                                )}
                            >
                                {saved ? (
                                    <><ClipboardCheck className="w-4 h-4" /> Avaliação salva com sucesso!</>
                                ) : (
                                    <><Save className="w-4 h-4" /> Salvar Avaliação</>
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
