"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquareHeart, Send, ChevronRight, BarChart3, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface NPSResponse {
    score: number;
    comment: string;
    category: string;
}

const categories = [
    { id: "ambiente", label: "Ambiente de trabalho", emoji: "🏠" },
    { id: "equipe", label: "Trabalho em equipe", emoji: "🤝" },
    { id: "lideranca", label: "Liderança", emoji: "🎯" },
    { id: "ferramentas", label: "Ferramentas e processos", emoji: "🛠️" },
    { id: "reconhecimento", label: "Reconhecimento", emoji: "⭐" },
];

// Mock data for NPS results
const mockResults = {
    totalResponses: 24,
    npsScore: 62,
    breakdown: {
        promoters: 15, // 9-10
        passives: 5,   // 7-8
        detractors: 4, // 0-6
    },
    byCategory: [
        { category: "Ambiente de trabalho", score: 78, emoji: "🏠" },
        { category: "Trabalho em equipe", score: 85, emoji: "🤝" },
        { category: "Liderança", score: 55, emoji: "🎯" },
        { category: "Ferramentas e processos", score: 42, emoji: "🛠️" },
        { category: "Reconhecimento", score: 50, emoji: "⭐" },
    ],
    recentComments: [
        { score: 9, text: "Equipe muito unida, ótimo clima!", category: "Trabalho em equipe" },
        { score: 4, text: "Falta equipamento adequado na cozinha.", category: "Ferramentas e processos" },
        { score: 8, text: "Melhorou muito depois do treinamento.", category: "Liderança" },
    ],
};

export function NPSSurvey() {
    const [view, setView] = useState<"results" | "survey">("results");
    const [surveyStep, setSurveyStep] = useState(0);
    const [response, setResponse] = useState<Partial<NPSResponse>>({});
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        setSubmitted(true);
        // TODO: Send to Supabase
    };

    return (
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                        <MessageSquareHeart className="w-5 h-5 text-pink-500" />
                        NPS Interno — Clima da Equipe
                    </h3>
                    <p className="text-sm text-zinc-500 mt-1">
                        {view === "results" ? "Resultados do último período" : "Pesquisa anônima rápida"}
                    </p>
                </div>
                <button
                    onClick={() => setView(view === "results" ? "survey" : "results")}
                    className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                >
                    {view === "results" ? (
                        <>
                            <Send className="w-3.5 h-3.5" />
                            Responder Pesquisa
                        </>
                    ) : (
                        <>
                            <BarChart3 className="w-3.5 h-3.5" />
                            Ver Resultados
                        </>
                    )}
                </button>
            </div>

            <AnimatePresence mode="wait">
                {view === "results" ? (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                    >
                        {/* NPS Score Big */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 rounded-xl p-5 text-center">
                                <p className="text-4xl font-black text-pink-600 dark:text-pink-400">{mockResults.npsScore}</p>
                                <p className="text-xs text-pink-500 dark:text-pink-400 font-medium mt-1">NPS Score</p>
                                <p className="text-[10px] text-zinc-400 mt-0.5">{mockResults.totalResponses} respostas</p>
                            </div>

                            {/* Breakdown */}
                            <div className="col-span-2 flex items-center gap-4">
                                {[
                                    { label: "Promotores", count: mockResults.breakdown.promoters, pct: Math.round((mockResults.breakdown.promoters / mockResults.totalResponses) * 100), icon: ThumbsUp, color: "emerald" },
                                    { label: "Neutros", count: mockResults.breakdown.passives, pct: Math.round((mockResults.breakdown.passives / mockResults.totalResponses) * 100), icon: Minus, color: "amber" },
                                    { label: "Detratores", count: mockResults.breakdown.detractors, pct: Math.round((mockResults.breakdown.detractors / mockResults.totalResponses) * 100), icon: ThumbsDown, color: "red" },
                                ].map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <div key={item.label} className="flex-1 text-center">
                                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2",
                                                `bg-${item.color}-50 dark:bg-${item.color}-950/30`
                                            )}>
                                                <Icon className={cn("w-5 h-5", `text-${item.color}-500`)} />
                                            </div>
                                            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{item.pct}%</p>
                                            <p className="text-[10px] text-zinc-400">{item.label} ({item.count})</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* By Category */}
                        <div className="space-y-3 mb-6">
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Por Categoria</h4>
                            {mockResults.byCategory.map((cat) => (
                                <div key={cat.category} className="flex items-center gap-3">
                                    <span className="text-lg shrink-0">{cat.emoji}</span>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between text-sm mb-1">
                                            <span className="text-zinc-600 dark:text-zinc-400">{cat.category}</span>
                                            <span className={cn("font-bold", cat.score >= 70 ? "text-emerald-500" : cat.score >= 50 ? "text-amber-500" : "text-red-500")}>
                                                {cat.score}
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <motion.div
                                                className={cn("h-full rounded-full",
                                                    cat.score >= 70 ? "bg-emerald-500" : cat.score >= 50 ? "bg-amber-500" : "bg-red-500"
                                                )}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${cat.score}%` }}
                                                transition={{ duration: 0.8 }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Recent Comments */}
                        <div>
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Comentários Recentes</h4>
                            <div className="space-y-2">
                                {mockResults.recentComments.map((comment, i) => (
                                    <div key={i} className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-3 flex items-start gap-3">
                                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
                                            comment.score >= 9 ? "bg-emerald-100 text-emerald-600" : comment.score >= 7 ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"
                                        )}>
                                            {comment.score}
                                        </div>
                                        <div>
                                            <p className="text-sm text-zinc-700 dark:text-zinc-300">{comment.text}</p>
                                            <p className="text-[10px] text-zinc-400 mt-1">{comment.category}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="survey"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        {submitted ? (
                            <div className="text-center py-12">
                                <span className="text-6xl block mb-4">🙏</span>
                                <h4 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Obrigado!</h4>
                                <p className="text-sm text-zinc-500">Sua resposta anônima foi registrada.</p>
                            </div>
                        ) : (
                            <>
                                {surveyStep === 0 && (
                                    <div>
                                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">
                                            De 0 a 10, quanto você recomendaria trabalhar aqui para um amigo?
                                        </p>
                                        <div className="flex gap-1.5">
                                            {Array.from({ length: 11 }, (_, i) => (
                                                <motion.button
                                                    key={i}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => {
                                                        setResponse({ ...response, score: i });
                                                        setSurveyStep(1);
                                                    }}
                                                    className={cn(
                                                        "flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all",
                                                        response.score === i
                                                            ? "border-pink-500 bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300"
                                                            : i <= 6
                                                                ? "border-red-200 dark:border-red-900 hover:border-red-400 text-zinc-600 dark:text-zinc-400"
                                                                : i <= 8
                                                                    ? "border-amber-200 dark:border-amber-900 hover:border-amber-400 text-zinc-600 dark:text-zinc-400"
                                                                    : "border-emerald-200 dark:border-emerald-900 hover:border-emerald-400 text-zinc-600 dark:text-zinc-400"
                                                    )}
                                                >
                                                    {i}
                                                </motion.button>
                                            ))}
                                        </div>
                                        <div className="flex justify-between mt-2 text-[10px] text-zinc-400">
                                            <span>😞 Nada provável</span>
                                            <span>😍 Muito provável</span>
                                        </div>
                                    </div>
                                )}

                                {surveyStep === 1 && (
                                    <div>
                                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">
                                            Qual área você gostaria de avaliar?
                                        </p>
                                        <div className="grid grid-cols-1 gap-2">
                                            {categories.map((cat) => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => {
                                                        setResponse({ ...response, category: cat.id });
                                                        setSurveyStep(2);
                                                    }}
                                                    className={cn(
                                                        "flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all hover:border-pink-300 dark:hover:border-pink-700",
                                                        response.category === cat.id
                                                            ? "border-pink-500 bg-pink-50 dark:bg-pink-950"
                                                            : "border-zinc-200 dark:border-zinc-800"
                                                    )}
                                                >
                                                    <span className="text-xl">{cat.emoji}</span>
                                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{cat.label}</span>
                                                    <ChevronRight className="w-4 h-4 text-zinc-300 ml-auto" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {surveyStep === 2 && (
                                    <div>
                                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">
                                            Algum comentário ou sugestão? (opcional)
                                        </p>
                                        <textarea
                                            value={response.comment || ""}
                                            onChange={(e) => setResponse({ ...response, comment: e.target.value })}
                                            rows={4}
                                            placeholder="Sua resposta é totalmente anônima..."
                                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-500"
                                        />
                                        <button
                                            onClick={handleSubmit}
                                            className="w-full mt-4 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold text-sm hover:from-pink-600 hover:to-rose-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Send className="w-4 h-4" />
                                            Enviar Resposta Anônima
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
