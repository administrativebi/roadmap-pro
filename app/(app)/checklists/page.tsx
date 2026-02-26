"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GamifiedChecklist } from "@/components/shared/GamifiedChecklist";
import { ChecklistTemplate, QuestionResponse } from "@/types";
import { ClipboardCheck, Flame, Zap, Leaf, Clock, Star, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

// Mock Templates com perguntas tipadas
const mockTemplates: ChecklistTemplate[] = [
    {
        id: "tpl-1",
        organization_id: "org-1",
        title: "Abertura do Restaurante",
        description: "Checklist diário de abertura",
        icon: "🌅",
        difficulty: "easy",
        category: "Operações",
        estimated_minutes: 10,
        max_score: 90,
        questions: [
            { id: "q1", text: "O salão está limpo e organizado?", type: "yes_no", is_required: true, points: 15 },
            { id: "q2", text: "Qual é a temperatura da câmara fria? (°C)", type: "number", is_required: true, min_value: -5, max_value: 10, placeholder: "Ex: 3", points: 15 },
            { id: "q3", text: "Todos os equipamentos estão funcionando?", type: "yes_no", is_required: true, allow_photo: true, points: 15 },
            { id: "q4", text: "Descreva qualquer irregularidade encontrada:", type: "text", is_required: false, placeholder: "Descreva aqui...", points: 10 },
            { id: "q5", text: "Estado geral do estoque:", type: "multi_choice", is_required: true, options: ["Completo", "Parcial (faltam itens)", "Crítico (reposição urgente)"], points: 15 },
            { id: "q6", text: "Foto do salão pronto para abertura:", type: "photo", is_required: true, photo_required: true, points: 20 },
        ],
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
    },
    {
        id: "tpl-2",
        organization_id: "org-1",
        title: "Controle de Qualidade APPCC",
        description: "Checklist de segurança alimentar obrigatório",
        icon: "🔬",
        difficulty: "hard",
        category: "Segurança",
        estimated_minutes: 25,
        max_score: 170,
        questions: [
            { id: "h1", text: "Temperatura dos alimentos prontos está adequada? (>60°C quentes / <5°C frios)", type: "yes_no", is_required: true, allow_photo: true, points: 20 },
            { id: "h2", text: "Qual a temperatura medida? (°C)", type: "number", is_required: true, min_value: -10, max_value: 100, points: 15 },
            { id: "h3", text: "Todos os insumos estão dentro da validade?", type: "yes_no", is_required: true, points: 20 },
            { id: "h4", text: "Quais áreas foram higienizadas?", type: "checkbox", is_required: true, options: ["Cozinha", "Salão", "Banheiros", "Estoque", "Área de preparo", "Câmara fria"], points: 15 },
            { id: "h5", text: "Avalie o estado geral de higiene (1-5):", type: "rating", is_required: true, points: 20 },
            { id: "h6", text: "A equipe está com uniformes e EPIs adequados?", type: "yes_no", is_required: true, allow_photo: true, points: 15 },
            { id: "h7", text: "Foto do registro de controle de pragas:", type: "photo", is_required: true, photo_required: true, points: 25 },
            { id: "h8", text: "Observações adicionais sobre não conformidades:", type: "text", is_required: false, placeholder: "Descreva não conformidades...", points: 10 },
            { id: "h9", text: "Rastreabilidade dos lotes está em dia?", type: "multi_choice", is_required: true, options: ["Sim, 100% rastreável", "Parcialmente", "Não está atualizado"], points: 15 },
            { id: "h10", text: "Quantidade de itens descartados hoje:", type: "number", is_required: false, min_value: 0, max_value: 100, points: 15 },
        ],
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
    },
    {
        id: "tpl-3",
        organization_id: "org-1",
        title: "Fechamento Diário",
        description: "Checklist de encerramento do turno",
        icon: "🌙",
        difficulty: "medium",
        category: "Operações",
        estimated_minutes: 15,
        max_score: 120,
        questions: [
            { id: "f1", text: "O caixa foi conferido e fechado corretamente?", type: "yes_no", is_required: true, points: 20 },
            { id: "f2", text: "Valor do caixa (R$):", type: "number", is_required: true, min_value: 0, max_value: 999999, placeholder: "Ex: 5420.50", points: 15 },
            { id: "f3", text: "Quais tarefas de limpeza foram realizadas?", type: "checkbox", is_required: true, options: ["Limpeza da cozinha", "Higienização dos banheiros", "Varrer e passar pano no salão", "Limpeza dos equipamentos", "Recolher lixo"], points: 20 },
            { id: "f4", text: "Todos os equipamentos foram desligados?", type: "yes_no", is_required: true, points: 15 },
            { id: "f5", text: "Portas e alarmes foram verificados?", type: "yes_no", is_required: true, points: 15 },
            { id: "f6", text: "Avalie o movimento do dia:", type: "rating", is_required: false, points: 10 },
            { id: "f7", text: "Ocorrências do turno:", type: "text", is_required: false, placeholder: "Relate qualquer incidente ou observação importante...", points: 10 },
            { id: "f8", text: "Foto do restaurante fechado:", type: "photo", is_required: false, allow_photo: true, points: 15 },
        ],
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
    },
];

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

export default function ChecklistsPage() {
    const [selected, setSelected] = useState<ChecklistTemplate | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastScore, setLastScore] = useState(0);

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
            setSelected(null);
        }, 4000);
    };

    const getQuestionTypeSummary = (tpl: ChecklistTemplate) => {
        const types = new Set(tpl.questions.map((q) => q.type));
        const icons: string[] = [];
        if (types.has("yes_no")) icons.push("✅");
        if (types.has("text")) icons.push("✏️");
        if (types.has("number")) icons.push("🔢");
        if (types.has("multi_choice") || types.has("checkbox")) icons.push("☑️");
        if (types.has("photo")) icons.push("📸");
        if (types.has("rating")) icons.push("⭐");
        return icons.join(" ");
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

            {/* Template List or Active Checklist */}
            <AnimatePresence mode="wait">
                {selected ? (
                    <motion.div
                        key="checklist"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                    >
                        <button
                            onClick={() => setSelected(null)}
                            className="mb-6 flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Voltar aos checklists
                        </button>
                        <GamifiedChecklist template={selected} onComplete={handleComplete} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                    >
                        {mockTemplates.map((tpl) => {
                            const diff = difficultyConfig[tpl.difficulty];
                            const DiffIcon = diff.icon;

                            return (
                                <motion.div
                                    key={tpl.id}
                                    variants={cardVariants}
                                    whileHover={{ y: -6, scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setSelected(tpl)}
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

                                            {/* Meta Info */}
                                            <div className="flex items-center gap-3 text-xs text-zinc-400 mb-3">
                                                <span className="flex items-center gap-1">
                                                    <ClipboardCheck className="w-3.5 h-3.5" />
                                                    {tpl.questions.length} perguntas
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    ~{tpl.estimated_minutes}min
                                                </span>
                                            </div>

                                            {/* Question Types */}
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">{getQuestionTypeSummary(tpl)}</span>
                                                <span className="text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-full">
                                                    até {tpl.max_score} pts
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
