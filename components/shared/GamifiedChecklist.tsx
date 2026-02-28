"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
    Circle,
    Camera,
    Star,
    ChevronRight,
    Zap,
    Trophy,
    Flame,
    X,
    ImageIcon,
    Pen,
} from "lucide-react";
import { ChecklistQuestion, ChecklistTemplate, QuestionResponse } from "@/types";
import { cn } from "@/lib/utils";
import { ChecklistTimer, calculateTimerBonuses } from "./ChecklistTimer";
import { SignatureCanvas } from "./SignatureCanvas";
import { ActionPlanForm } from "@/components/features/ActionPlanForm";
import { AlertTriangle } from "lucide-react";

interface GamifiedChecklistProps {
    template: ChecklistTemplate;
    onComplete: (responses: QuestionResponse[], score: number, signature?: string) => void;
}

export function GamifiedChecklist({ template, onComplete }: GamifiedChecklistProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [responses, setResponses] = useState<Record<string, QuestionResponse>>({});
    const [earnedPoints, setEarnedPoints] = useState(0);
    const [combo, setCombo] = useState(0);
    const [showCombo, setShowCombo] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<Record<string, string[]>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showSignature, setShowSignature] = useState(false);
    const [timerElapsed, setTimerElapsed] = useState(0);
    const [hadInactivity, setHadInactivity] = useState(false);
    
    const [showActionPlanForm, setShowActionPlanForm] = useState(false);

    const questions = template.questions;
    const totalQuestions = questions.length;
    const answeredCount = Object.keys(responses).length;
    const progress = totalQuestions === 0 ? 0 : (answeredCount / totalQuestions) * 100;
    const currentQ = questions[currentStep];

    const diffMultiplier =
        template.difficulty === "hard" ? 1.5 : template.difficulty === "medium" ? 1.2 : 1;

    const submitAnswer = (
        questionId: string,
        value: string | number | boolean | string[],
        photos?: string[]
    ) => {
        const question = questions.find((q) => q.id === questionId);
        if (!question) return;

        const wasAlreadyAnswered = !!responses[questionId];
        const pts = wasAlreadyAnswered ? 0 : question.points;

        setResponses((prev) => ({
            ...prev,
            [questionId]: {
                question_id: questionId,
                value,
                photo_urls: photos || prev[questionId]?.photo_urls || [],
                answered_at: new Date().toISOString(),
            },
        }));

        if (!wasAlreadyAnswered) {
            const newCombo = combo + 1;
            setCombo(newCombo);
            const comboBonus = newCombo >= 3 ? Math.floor(pts * 0.2) : 0;
            setEarnedPoints((p) => p + pts + comboBonus);

            if (newCombo >= 3) {
                setShowCombo(true);
                setTimeout(() => setShowCombo(false), 1500);
            }
        }

        // Auto-advance after answer
        if (currentStep < totalQuestions - 1) {
            setTimeout(() => setCurrentStep((s) => s + 1), 400);
        }
    };

    const handlePhotoUpload = (questionId: string, files: FileList | null) => {
        if (!files) return;
        const urls = Array.from(files).map((f) => URL.createObjectURL(f));
        setPhotoPreview((prev) => ({
            ...prev,
            [questionId]: [...(prev[questionId] || []), ...urls],
        }));
    };

    const handleRequestFinish = () => {
        setShowSignature(true);
    };

    const handleFinish = (signature?: string) => {
        const bonuses = calculateTimerBonuses(
            timerElapsed,
            template.estimated_minutes || 15,
            hadInactivity,
            earnedPoints
        );
        const finalScore = Math.floor((earnedPoints + bonuses.totalBonus) * diffMultiplier);
        onComplete(Object.values(responses), finalScore, signature);
    };

    const allRequiredAnswered = questions
        .filter((q) => q.is_required)
        .every((q) => responses[q.id]);

    return (
        <div className="w-full max-w-2xl mx-auto space-y-4">
            {/* Combo Overlay */}
            <AnimatePresence>
                {showCombo && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: -20 }}
                        className="fixed top-8 left-1/2 -translate-x-1/2 z-50"
                    >
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full font-black text-lg shadow-2xl flex items-center gap-2">
                            <Flame className="w-5 h-5" />
                            COMBO x{combo}! 🔥
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header Card com Stats */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-6 mb-6 text-white shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{template.icon || "📋"}</span>
                        <div>
                            <h2 className="text-xl font-bold">{template.title}</h2>
                            <p className="text-zinc-400 text-sm">
                                Pergunta {currentStep + 1} de {totalQuestions}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <motion.div
                            key={earnedPoints}
                            initial={{ scale: 1.4 }}
                            animate={{ scale: 1 }}
                            className="text-2xl font-black text-amber-400"
                        >
                            {earnedPoints}
                            <span className="text-sm font-normal text-amber-400/60 ml-1">pts</span>
                        </motion.div>
                        {combo >= 2 && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-xs text-orange-400 font-semibold"
                            >
                                🔥 Combo x{combo}
                            </motion.p>
                        )}
                    </div>
                </div>

                {/* Progress Bar Estilizada */}
                <div className="relative w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
                    <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                </div>
                <div className="flex justify-between mt-2 text-xs text-zinc-400">
                    <span>{answeredCount} respondidas</span>
                    <span>{totalQuestions - answeredCount} restantes</span>
                </div>
            </div>

            {/* Timer */}
            <ChecklistTimer
                estimatedMinutes={template.estimated_minutes || 15}
                isActive={!showSignature}
                onTimeUpdate={(t) => setTimerElapsed(t)}
                onInactivityPenalty={() => setHadInactivity(true)}
            />

            {/* Signature Overlay */}
            <AnimatePresence>
                {showSignature && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <div className="w-full max-w-lg">
                            <SignatureCanvas
                                onSave={(sig) => handleFinish(sig)}
                                onCancel={() => setShowSignature(false)}
                                title="Assinatura do responsável"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Question Dots Navigator */}
            <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-2">
                {questions.map((q, i) => (
                    <button
                        key={q.id}
                        onClick={() => setCurrentStep(i)}
                        className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0",
                            i === currentStep
                                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 scale-110 shadow-lg"
                                : responses[q.id]
                                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300"
                                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        )}
                    >
                        {responses[q.id] ? "✓" : i + 1}
                    </button>
                ))}
            </div>

            {/* Current Question Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQ.id}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm"
                >
                    {/* Question Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div
                                className={cn(
                                    "px-2.5 py-1 rounded-lg text-xs font-bold",
                                    currentQ.is_required
                                        ? "bg-red-50 text-red-500 dark:bg-red-950 dark:text-red-400"
                                        : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                                )}
                            >
                                {currentQ.is_required ? "Obrigatória" : "Opcional"}
                            </div>
                            <div className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                {currentQ.points} pts
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => setShowActionPlanForm(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 dark:text-rose-400 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
                        >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Gerar Plano de Ação
                        </button>
                    </div>

                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-6">
                        {currentQ.text}
                    </h3>

                    {/* Render Question Type */}
                    <QuestionRenderer
                        question={currentQ}
                        currentValue={responses[currentQ.id]?.value}
                        onAnswer={(val) => submitAnswer(currentQ.id, val, photoPreview[currentQ.id])}
                    />

                    {/* Photo Upload Section */}
                    {(currentQ.allow_photo || currentQ.type === "photo") && (
                        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-2 mb-3">
                                <Camera className="w-4 h-4 text-zinc-500" />
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    {currentQ.photo_required ? "Foto obrigatória" : "Anexar foto (opcional)"}
                                </span>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                multiple
                                className="hidden"
                                onChange={(e) => handlePhotoUpload(currentQ.id, e.target.files)}
                            />

                            <div className="flex gap-3 flex-wrap">
                                {(photoPreview[currentQ.id] || []).map((url, i) => (
                                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => {
                                                setPhotoPreview((p) => ({
                                                    ...p,
                                                    [currentQ.id]: p[currentQ.id].filter((_, idx) => idx !== i),
                                                }));
                                            }}
                                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                                        >
                                            <X className="w-3 h-3 text-white" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-20 h-20 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center gap-1 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors text-zinc-400"
                                >
                                    <ImageIcon className="w-5 h-5" />
                                    <span className="text-[10px]">Adicionar</span>
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
                <button
                    onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                    disabled={currentStep === 0}
                    className={cn(
                        "px-5 py-3 rounded-xl text-sm font-semibold transition-all",
                        currentStep === 0
                            ? "text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    )}
                >
                    ← Anterior
                </button>

                {currentStep < totalQuestions - 1 ? (
                    <button
                        onClick={() => setCurrentStep((s) => s + 1)}
                        className="flex items-center gap-2 px-5 py-3 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-xl text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-sm"
                    >
                        Próxima <ChevronRight className="w-4 h-4" />
                    </button>
                ) : (
                    <button
                        onClick={handleRequestFinish}
                        disabled={!allRequiredAnswered}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg",
                            allRequiredAnswered
                                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 animate-pulse"
                                : "bg-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600"
                        )}
                    >
                        <Pen className="w-4 h-4" />
                        Assinar e Finalizar
                    </button>
                )}
            </div>

            {/* Modal de Plano de Ação */}
            {showActionPlanForm && (
                <ActionPlanForm
                    onClose={() => setShowActionPlanForm(false)}
                    onSuccess={() => setShowActionPlanForm(false)}
                />
            )}
        </div>
    );
}

// ─── Question Renderer ────────────────────────────────────
interface QuestionRendererProps {
    question: ChecklistQuestion;
    currentValue: string | number | boolean | string[] | undefined;
    onAnswer: (value: string | number | boolean | string[]) => void;
}

function QuestionRenderer({ question, currentValue, onAnswer }: QuestionRendererProps) {
    switch (question.type) {
        case "yes_no":
            return (
                <div className="flex gap-3">
                    {[
                        { value: true, label: "Sim", emoji: "✅", color: "emerald" },
                        { value: false, label: "Não", emoji: "❌", color: "red" },
                    ].map((opt) => (
                        <motion.button
                            key={String(opt.value)}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onAnswer(opt.value)}
                            className={cn(
                                "flex-1 py-5 rounded-xl text-center font-bold text-lg border-2 transition-all",
                                currentValue === opt.value
                                    ? opt.color === "emerald"
                                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 shadow-lg shadow-emerald-500/20"
                                        : "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 shadow-lg shadow-red-500/20"
                                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                            )}
                        >
                            <span className="text-2xl block mb-1">{opt.emoji}</span>
                            {opt.label}
                        </motion.button>
                    ))}
                </div>
            );

        case "text":
            return (
                <textarea
                    placeholder={question.placeholder || "Digite sua resposta..."}
                    value={(currentValue as string) || ""}
                    onChange={(e) => onAnswer(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm resize-none"
                />
            );

        case "number":
            return (
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => onAnswer(Math.max(question.min_value || 0, ((currentValue as number) || 0) - 1))}
                        className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                        −
                    </button>
                    <input
                        type="number"
                        value={(currentValue as number) ?? ""}
                        onChange={(e) => onAnswer(Number(e.target.value))}
                        min={question.min_value}
                        max={question.max_value}
                        placeholder={question.placeholder || "0"}
                        className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                    <button
                        onClick={() => onAnswer(Math.min(question.max_value || 9999, ((currentValue as number) || 0) + 1))}
                        className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                        +
                    </button>
                </div>
            );

        case "multi_choice":
            return (
                <div className="space-y-2">
                    {(question.options || []).map((option) => (
                        <motion.button
                            key={option}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onAnswer(option)}
                            className={cn(
                                "w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all flex items-center gap-3",
                                currentValue === option
                                    ? "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200 shadow-lg shadow-amber-500/10"
                                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                            )}
                        >
                            {currentValue === option ? (
                                <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />
                            ) : (
                                <Circle className="w-5 h-5 text-zinc-300 dark:text-zinc-600 shrink-0" />
                            )}
                            {option}
                        </motion.button>
                    ))}
                </div>
            );

        case "checkbox":
            const selectedItems = (currentValue as string[]) || [];
            return (
                <div className="space-y-2">
                    {(question.options || []).map((option) => {
                        const isSelected = selectedItems.includes(option);
                        return (
                            <motion.button
                                key={option}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    const updated = isSelected
                                        ? selectedItems.filter((s) => s !== option)
                                        : [...selectedItems, option];
                                    onAnswer(updated);
                                }}
                                className={cn(
                                    "w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all flex items-center gap-3",
                                    isSelected
                                        ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                                        isSelected
                                            ? "bg-emerald-500 border-emerald-500"
                                            : "border-zinc-300 dark:border-zinc-600"
                                    )}
                                >
                                    {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                                </div>
                                {option}
                            </motion.button>
                        );
                    })}
                </div>
            );

        case "rating":
            const rating = (currentValue as number) || 0;
            return (
                <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                            key={star}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onAnswer(star)}
                            className="transition-all"
                        >
                            <Star
                                className={cn(
                                    "w-12 h-12 transition-colors",
                                    star <= rating
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-zinc-200 dark:text-zinc-700"
                                )}
                            />
                        </motion.button>
                    ))}
                </div>
            );

        case "photo":
            return (
                <div className="text-center py-4">
                    <p className="text-sm text-zinc-500 mb-2">
                        Use a seção de fotos abaixo para anexar sua imagem
                    </p>
                    {!currentValue && (
                        <button
                            onClick={() => onAnswer("photo_submitted")}
                            className="px-6 py-3 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-xl font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-sm"
                        >
                            Confirmar Envio da Foto
                        </button>
                    )}
                    {currentValue && (
                        <p className="text-emerald-500 font-semibold flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-5 h-5" /> Foto confirmada!
                        </p>
                    )}
                </div>
            );

        default:
            return null;
    }
}
