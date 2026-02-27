"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ClipboardCheck, Star, MessageSquare, ChevronDown,
    Save, TrendingUp, TrendingDown, Minus, Eye, AlertCircle, CheckCircle2, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface CollaboratorSummary {
    id: string;
    name: string;
    avatar: string;
    role: string;
    averageRating: number;
    totalEvaluations: number;
    trend: "up" | "down" | "stable";
    strengths: string[];
    improvements: string[];
    lastEvaluation: string;
    weeklyEvaluationPending: boolean;
}

const evaluationCategories = [
    "Execução do checklist",
    "Atenção aos detalhes",
    "Tempo de conclusão",
    "Documentação (fotos)",
    "Postura e EPI",
];

export function Evaluation360() {
    const [selectedCollaborator, setSelectedCollaborator] = useState<string | null>(null);
    const [selectedCollaboratorName, setSelectedCollaboratorName] = useState<string | null>(null);
    const [view, setView] = useState<"list" | "evaluate">("list");
    const [ratings, setRatings] = useState<Record<string, number>>({});
    const [comments, setComments] = useState<Record<string, string>>({});
    const [overallComment, setOverallComment] = useState("");
    const [saved, setSaved] = useState(false);
    const [collaborators, setCollaborators] = useState<CollaboratorSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const supabase = createClient();

    const fetchCollaborators = async () => {
        setIsLoading(true);
        try {
            // First get the active user to exclude from the evaluation list
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch profiles
            const { data: profiles, error: pError } = await supabase
                .from('profiles')
                .select('*')
                .neq('id', user.id);

            if (pError) throw pError;

            // Fetch evaluations to determine if evaluated in the last 7 days
            const { data: evals, error: eError } = await supabase
                .from('evaluations')
                .select('id, evaluated_id, created_at, evaluation_ratings(rating)')
                .order('created_at', { ascending: false });

            if (eError) throw eError;

            const summaries = (profiles || []).map(p => {
                const userEvals = evals?.filter(e => e.evaluated_id === p.id) || [];
                const latestEval = userEvals[0];

                // Checked if 7 days passed
                let pending = true;
                let lastDate = "Nunca avaliado";
                if (latestEval) {
                    const diffDays = Math.floor((new Date().getTime() - new Date(latestEval.created_at).getTime()) / (1000 * 3600 * 24));
                    pending = diffDays >= 7;
                    lastDate = diffDays === 0 ? "Hoje" : `Há ${diffDays} dia(s)`;
                }

                // Average rating
                let avg = 0;
                let allRatings: number[] = [];
                userEvals.forEach(ev => {
                    ev.evaluation_ratings?.forEach((r: any) => allRatings.push(r.rating));
                });
                if (allRatings.length > 0) {
                    avg = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
                }

                return {
                    id: p.id,
                    name: p.name || p.full_name || "Sem Nome",
                    avatar: p.avatar_url || "👤",
                    role: p.sector_id ? "Setor" : "Colaborador", // Simplificado para fins de exibição
                    averageRating: avg,
                    totalEvaluations: userEvals.length,
                    trend: "up" as const, // Simplificado, pode criar metrica real dps
                    strengths: ["Comprometimento"],
                    improvements: ["Atenção aos Detalhes"],
                    lastEvaluation: lastDate,
                    weeklyEvaluationPending: pending,
                };
            });

            setCollaborators(summaries);
        } catch (err) {
            console.error("Erro ao carregar colaboradores:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCollaborators();
    }, [supabase]);

    const handleRate = (category: string, rating: number) => {
        setRatings({ ...ratings, [category]: rating });
    };

    const handleSave = async () => {
        if (!selectedCollaborator) return;
        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Não autenticado");

            // Cria a avaliação principal
            const { data: evalData, error: evalError } = await supabase
                .from('evaluations')
                .insert({
                    evaluator_id: user.id,
                    evaluated_id: selectedCollaborator,
                    overall_comment: overallComment
                })
                .select()
                .single();

            if (evalError) throw evalError;

            // Insere as notas e comentários das categorias
            const ratingsToInsert = evaluationCategories.map(cat => ({
                evaluation_id: evalData.id,
                category: cat,
                rating: ratings[cat] || 0,
                comment: comments[cat] || null
            }));

            const { error: ratError } = await supabase
                .from('evaluation_ratings')
                .insert(ratingsToInsert);

            if (ratError) throw ratError;

            // --- Gamificação: Conceder XP com base na nota média ---
            const allRatingsValue = Object.values(ratings);
            let avgRating = 0;
            if (allRatingsValue.length > 0) {
                avgRating = allRatingsValue.reduce((a, b) => a + b, 0) / allRatingsValue.length;
            }

            let xpEarned = 10; // XP base por ser avaliado
            if (avgRating >= 4.5) xpEarned += 90; // +90 se excelente (total 100)
            else if (avgRating >= 4.0) xpEarned += 40; // +40 se bom (total 50)
            else if (avgRating >= 3.0) xpEarned += 10; // +10 se a média (total 20)

            await supabase.from('activity_logs').insert({
                user_id: selectedCollaborator,
                action_type: 'weekly_evaluation',
                xp_earned: xpEarned,
                description: `Recebeu a avaliação semanal da gestão (Score: ${avgRating.toFixed(1)}/5). Ganhou +${xpEarned}XP.`
            });
            // -------------------------------------------------------------

            setSaved(true);
            setTimeout(() => {
                setSaved(false);
                fetchCollaborators();
                setView("list");
            }, 2000);
        } catch (e) {
            console.error("Erro ao salvar avaliação:", e);
            alert("Erro ao salvar avaliação.");
        } finally {
            setIsSaving(false);
        }
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
                        Avaliação 360° Semanal
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">O gestor deve avaliar o colaborador ao menos 1 vez por semana.</p>
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
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-10">
                                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                                <p className="text-zinc-500">Carregando perfil dos colaboradores...</p>
                            </div>
                        ) : (
                            <>
                                {/* Summary of pendencies */}
                                <div className="mb-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center">
                                            <ClipboardCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-indigo-900 dark:text-indigo-100">Avaliações Semanais</h4>
                                            <p className="text-xs text-indigo-700 dark:text-indigo-400">
                                                Faltam avaliar {collaborators.filter(c => c.weeklyEvaluationPending).length} colaboradores nesta semana.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Collaborator Cards */}
                                {collaborators.map((collab, i) => (
                                    <motion.div
                                        key={collab.name}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                        className={cn(
                                            "rounded-2xl border p-5 transition-all relative overflow-hidden",
                                            collab.weeklyEvaluationPending
                                                ? "bg-rose-50/30 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/50"
                                                : "bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800"
                                        )}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-2xl shrink-0">
                                                {collab.avatar}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-zinc-900 dark:text-zinc-50">{collab.name}</h4>
                                                        {trendIcon(collab.trend)}
                                                    </div>
                                                    {collab.weeklyEvaluationPending ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 shrink-0">
                                                            <AlertCircle className="w-3 h-3" /> Pendente esta Semana
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 shrink-0">
                                                            <CheckCircle2 className="w-3 h-3" /> Avaliado
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">{collab.role} • {collab.totalEvaluations} avaliações • Última: {collab.lastEvaluation}</p>

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
                                                onClick={() => {
                                                    setSelectedCollaborator(collab.id);
                                                    setSelectedCollaboratorName(collab.name);
                                                    setView("evaluate");
                                                    setRatings({});
                                                    setOverallComment("");
                                                }}
                                                className={cn(
                                                    "px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0",
                                                    collab.weeklyEvaluationPending
                                                        ? "bg-rose-500 text-white hover:bg-rose-600 shadow-md shadow-rose-500/20"
                                                        : "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/50"
                                                )}
                                            >
                                                Avaliar
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="evaluate" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                        {/* Evaluating who */}
                        <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl p-5 border border-indigo-200 dark:border-indigo-800">
                            <p className="text-sm text-indigo-600 dark:text-indigo-400">
                                Avaliação Semanal: <strong>{selectedCollaboratorName}</strong>
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
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComments({ ...comments, [cat]: e.target.value })}
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
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOverallComment(e.target.value)}
                                    placeholder="Observações gerais sobre o desempenho deste colaborador neste checklist..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Save */}
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSave}
                                disabled={isSaving}
                                className={cn(
                                    "w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                                    saved ? "bg-emerald-500 text-white" : "bg-gradient-to-r from-indigo-500 to-blue-500 text-white hover:from-indigo-600 hover:to-blue-600 shadow-lg",
                                    isSaving && "opacity-75 cursor-not-allowed"
                                )}
                            >
                                {isSaving ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                                ) : saved ? (
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
