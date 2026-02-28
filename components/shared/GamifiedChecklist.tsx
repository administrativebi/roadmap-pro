"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
    Circle,
    Camera,
    Star,
    ChevronRight,
    ChevronLeft,
    Zap,
    Trophy,
    Flame,
    X,
    ImageIcon,
    Pen,
    Play,
    AlertTriangle,
} from "lucide-react";
import { ChecklistQuestion, ChecklistTemplate, QuestionResponse } from "@/types";
import { cn } from "@/lib/utils";
import { ChecklistTimer, calculateTimerBonuses } from "./ChecklistTimer";
import { SignatureCanvas } from "./SignatureCanvas";
import { ActionPlanForm } from "@/components/features/ActionPlanForm";

interface GamifiedChecklistProps {
    template: ChecklistTemplate;
    onComplete: (responses: QuestionResponse[], score: number, signature?: string) => void;
}

export function GamifiedChecklist({ template, onComplete }: GamifiedChecklistProps) {
    // currentStep: 0 = Cover, 1...N = Sections
    const [currentStep, setCurrentStep] = useState(0);
    const [responses, setResponses] = useState<Record<string, QuestionResponse>>({});
    const [photoPreview, setPhotoPreview] = useState<Record<string, string[]>>({});
    const [showSignature, setShowSignature] = useState(false);
    const [timerElapsed, setTimerElapsed] = useState(0);
    const [hadInactivity, setHadInactivity] = useState(false);
    const [nonConformitiesQueue, setNonConformitiesQueue] = useState<ChecklistQuestion[]>([]);
    
    // Animation states
    const [combo, setCombo] = useState(0);
    const [showCombo, setShowCombo] = useState(false);

    const questions = template.questions;
    
    // Group questions by section
    const sections = useMemo(() => {
        const map = new Map<string, { id: string; title: string; icon?: string; color?: string; order: number; questions: ChecklistQuestion[] }>();
        
        questions.forEach(q => {
            const s = q.parsedSection || { id: "default", title: "Geral", order: 0 };
            if (!map.has(s.id)) {
                map.set(s.id, { ...s, questions: [] });
            }
            map.get(s.id)!.questions.push(q);
        });

        return Array.from(map.values()).sort((a, b) => a.order - b.order);
    }, [questions]);

    // Calculate dynamic points
    const earnedPoints = useMemo(() => {
        return Object.values(responses).reduce((sum, res) => {
            const q = questions.find(qu => qu.id === res.question_id);
            if (!q) return sum;
            
            // Standard point logic
            if (q.type === 'yes_no') {
                return res.value === 'yes' || res.value === true ? sum + q.points : sum;
            }
            if (q.type === 'rating' || q.type === 'number') {
                // If it has a value, it's answered
                return res.value ? sum + q.points : sum;
            }
            // For other types, if answered, give points
            return res.value ? sum + q.points : sum;
        }, 0);
    }, [responses, questions]);

    const totalQuestions = questions.length;
    const answeredCount = Object.keys(responses).length;
    const progress = totalQuestions === 0 ? 0 : (answeredCount / totalQuestions) * 100;

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
            setCombo(prev => prev + 1);
            if (combo + 1 >= 3) {
                setShowCombo(true);
                setTimeout(() => setShowCombo(false), 1500);
            }
        }
    };

    const handlePhotoUpload = (questionId: string, files: FileList | null) => {
        if (!files) return;
        const urls = Array.from(files).map((f) => URL.createObjectURL(f));
        const newPhotos = [...(photoPreview[questionId] || []), ...urls];
        setPhotoPreview((prev) => ({
            ...prev,
            [questionId]: newPhotos,
        }));
        // Update response with photos if already answered
        if (responses[questionId]) {
            submitAnswer(questionId, responses[questionId].value, newPhotos);
        }
    };

    const handleRequestFinish = () => {
        const nonConformities: ChecklistQuestion[] = [];

        questions.forEach(q => {
            const resp = responses[q.id];
            if (!resp) return;

            let isNonConformity = false;

            if (q.conditional_rules && q.conditional_rules.length > 0) {
                q.conditional_rules.forEach((rule: any) => {
                    if (rule.action === 'create_action_plan') {
                        const valStr = String(resp.value).toLowerCase();
                        const triggerValue = rule.triggerAnswer !== undefined ? rule.triggerAnswer : rule.compareValue;
                        const triggerStr = String(triggerValue).toLowerCase();
                        const operator = rule.operator || 'equals';

                        if (operator === 'equals' && valStr === triggerStr) isNonConformity = true;
                        if (operator === 'not_equals' && valStr !== triggerStr) isNonConformity = true;
                    }
                });
            }

            if (isNonConformity) {
                nonConformities.push(q);
            }
        });

        if (nonConformities.length > 0) {
            setNonConformitiesQueue(nonConformities);
        } else {
            setShowSignature(true);
        }
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

    const currentSection = currentStep > 0 ? sections[currentStep - 1] : null;
    const isLastSection = currentStep === sections.length;

    const allRequiredInCurrentSectionAnswered = useMemo(() => {
        if (!currentSection) return true;
        return currentSection.questions
            .filter(q => q.is_required)
            .every(q => responses[q.id]);
    }, [currentSection, responses]);

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col min-h-[80vh]">
            {/* Combo Overlay */}
            <AnimatePresence>
                {showCombo && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: -20 }}
                        className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                    >
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-full font-black text-xl shadow-2xl flex items-center gap-3 border-4 border-white/20">
                            <Flame className="w-6 h-6 animate-bounce" />
                            COMBO x{combo}! 🔥
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header Sticky - Always visible */}
            <div className="sticky top-0 z-30 pt-2 pb-4 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-xl">
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center shrink-0 text-2xl">
                                {template.icon || "📋"}
                            </div>
                            <div className="truncate">
                                <h2 className="font-bold text-zinc-900 dark:text-zinc-50 truncate">{template.title}</h2>
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                    {currentStep === 0 ? "Introdução" : `Seção ${currentStep} de ${sections.length}`}
                                </p>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="text-2xl font-black text-orange-500 tabular-nums">
                                {earnedPoints}
                                <span className="text-[10px] text-zinc-400 ml-1">PTS</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        />
                    </div>
                </div>
                
                {currentStep > 0 && (
                    <div className="mt-4">
                        <ChecklistTimer
                            estimatedMinutes={template.estimated_minutes || 15}
                            isActive={!showSignature}
                            onTimeUpdate={(t) => setTimerElapsed(t)}
                            onInactivityPenalty={() => setHadInactivity(true)}
                        />
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 py-6">
                <AnimatePresence mode="wait">
                    {currentStep === 0 ? (
                        <motion.div
                            key="cover"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col items-center text-center space-y-8 py-10"
                        >
                            <div className="w-32 h-32 bg-gradient-to-br from-orange-400 to-red-600 rounded-[3rem] flex items-center justify-center shadow-2xl shadow-orange-500/20 rotate-3">
                                <Trophy className="w-16 h-16 text-white" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-tight">Vistoria Gamer</h1>
                                <p className="text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto font-medium">
                                    Responda com precisão, ganhe XP e suba no ranking da empresa!
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                    <Zap className="w-5 h-5 text-amber-500 mb-2 mx-auto" />
                                    <p className="text-[10px] font-black text-zinc-400 uppercase mb-1">Potencial</p>
                                    <p className="text-xl font-black">{questions.reduce((s, q) => s + q.points, 0)} pts</p>
                                </div>
                                <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                    <Play className="w-5 h-5 text-emerald-500 mb-2 mx-auto" />
                                    <p className="text-[10px] font-black text-zinc-400 uppercase mb-1">Duração</p>
                                    <p className="text-xl font-black">~{template.estimated_minutes || 10} min</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setCurrentStep(1)}
                                className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-6 rounded-[2rem] font-black text-xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase"
                            >
                                <Play className="w-6 h-6 fill-current" /> Começar Agora
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`section-${currentStep}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-10 pb-32"
                        >
                            <div className="flex items-center gap-4">
                                <div 
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-white/10"
                                    style={{ backgroundColor: currentSection?.color || '#f4f4f5', color: currentSection?.color ? '#fff' : '#71717a' }}
                                >
                                    {currentSection?.icon || "★"}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-tighter">
                                        {currentSection?.title}
                                    </h2>
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                        {currentSection?.questions.length} perguntas nesta etapa
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {currentSection?.questions.map((q) => (
                                    <QuestionCard 
                                        key={q.id} 
                                        question={q} 
                                        response={responses[q.id]}
                                        onAnswer={(val) => submitAnswer(q.id, val)}
                                        onPhotoUpload={(files) => handlePhotoUpload(q.id, files)}
                                        photoPreviews={photoPreview[q.id] || []}
                                        onRemovePhoto={(idx) => {
                                            const newPhotos = (photoPreview[q.id] || []).filter((_, i) => i !== idx);
                                            setPhotoPreview(p => ({ ...p, [q.id]: newPhotos }));
                                            if (responses[q.id]) submitAnswer(q.id, responses[q.id].value, newPhotos);
                                        }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Navigation Fixed */}
            {currentStep > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 via-zinc-50/90 dark:via-zinc-950/90 to-transparent z-40">
                    <div className="max-w-2xl mx-auto flex gap-4">
                        <button
                            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                            className="w-20 h-16 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 active:scale-90 transition-all shadow-sm"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>

                        {currentStep < sections.length ? (
                            <button
                                onClick={() => setCurrentStep(prev => prev + 1)}
                                disabled={!allRequiredInCurrentSectionAnswered}
                                className={cn(
                                    "flex-1 h-16 rounded-[1.5rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg",
                                    allRequiredInCurrentSectionAnswered
                                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-zinc-500/20"
                                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                                )}
                            >
                                Próxima Etapa <ChevronRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleRequestFinish}
                                disabled={!allRequiredInCurrentSectionAnswered}
                                className={cn(
                                    "flex-1 h-16 rounded-[1.5rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xl",
                                    allRequiredInCurrentSectionAnswered
                                        ? "bg-emerald-500 text-white shadow-emerald-500/30"
                                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                                )}
                            >
                                <Pen className="w-5 h-5" /> Finalizar Vistoria
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Modals & Overlays */}
            <AnimatePresence>
                {showSignature && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-lg">
                            <SignatureCanvas
                                onSave={(sig) => handleFinish(sig)}
                                onCancel={() => setShowSignature(false)}
                                title="Assinatura do responsável"
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {nonConformitiesQueue.length > 0 && (
                <ActionPlanForm
                    initialTitle={`[Ação Necessária] Problema com: ${nonConformitiesQueue[0].text}`}
                    checklistResponseId={template.id}
                    onClose={() => {
                        const nextQueue = nonConformitiesQueue.slice(1);
                        setNonConformitiesQueue(nextQueue);
                        if (nextQueue.length === 0) setShowSignature(true);
                    }}
                    onSuccess={() => {
                        const nextQueue = nonConformitiesQueue.slice(1);
                        setNonConformitiesQueue(nextQueue);
                        if (nextQueue.length === 0) setShowSignature(true);
                    }}
                />
            )}
        </div>
    );
}

// ─── Question Card Component ─────────────────────────────
function QuestionCard({ 
    question, 
    response, 
    onAnswer, 
    onPhotoUpload, 
    photoPreviews,
    onRemovePhoto 
}: { 
    question: ChecklistQuestion; 
    response?: QuestionResponse;
    onAnswer: (val: any) => void;
    onPhotoUpload: (files: FileList | null) => void;
    photoPreviews: string[];
    onRemovePhoto: (idx: number) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 p-6 md:p-8 shadow-sm group transition-all hover:shadow-md">
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-2">
                    {question.is_required && (
                        <div className="bg-red-50 dark:bg-red-950/30 text-red-500 text-[10px] font-black uppercase px-2 py-1 rounded-lg">
                            Obrigatório
                        </div>
                    )}
                    <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-600 text-[10px] font-black uppercase px-2 py-1 rounded-lg flex items-center gap-1">
                        <Zap className="w-3 h-3" /> {question.points} pts
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-8 leading-tight">
                {question.text}
            </h3>

            <div className="mb-8">
                <QuestionRenderer 
                    question={question} 
                    currentValue={response?.value} 
                    onAnswer={onAnswer} 
                />
            </div>

            {(question.allow_photo || question.type === "photo") && (
                <div className="pt-6 border-t border-zinc-50 dark:border-zinc-800/50">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <Camera className="w-3 h-3" /> {question.photo_required ? "Foto Obrigatória" : "Anexar Foto"}
                        </span>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        className="hidden"
                        onChange={(e) => onPhotoUpload(e.target.files)}
                    />

                    <div className="flex gap-3 flex-wrap">
                        {photoPreviews.map((url, i) => (
                            <div key={i} className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-white dark:border-zinc-800 shadow-sm">
                                <img src={url} alt="" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => onRemovePhoto(i)}
                                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-20 h-20 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-zinc-600 hover:border-zinc-300 transition-all bg-zinc-50/50 dark:bg-zinc-950/50"
                        >
                            <ImageIcon className="w-5 h-5" />
                            <span className="text-[8px] font-bold uppercase">Add</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Question Renderer (Unchanged logic, updated styling) ────────
function QuestionRenderer({ 
    question, 
    currentValue, 
    onAnswer 
}: { 
    question: ChecklistQuestion; 
    currentValue: any; 
    onAnswer: (val: any) => void 
}) {
    switch (question.type) {
        case "yes_no":
            return (
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { value: true, label: "Sim", color: "bg-emerald-500", border: "border-emerald-200" },
                        { value: false, label: "Não", color: "bg-red-500", border: "border-red-200" },
                    ].map((opt) => (
                        <motion.button
                            key={String(opt.value)}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => onAnswer(opt.value)}
                            className={cn(
                                "py-6 rounded-3xl font-black text-sm uppercase tracking-widest border-2 transition-all",
                                currentValue === opt.value
                                    ? `${opt.color} border-transparent text-white shadow-xl scale-[1.02]`
                                    : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 text-zinc-400"
                            )}
                        >
                            {opt.label}
                        </motion.button>
                    ))}
                </div>
            );

        case "text":
            return (
                <textarea
                    placeholder={question.placeholder || "Digite sua resposta..."}
                    value={currentValue || ""}
                    onChange={(e) => onAnswer(e.target.value)}
                    rows={3}
                    className="w-full px-6 py-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-sm resize-none"
                />
            );

        case "number":
            return (
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => onAnswer(Math.max(question.min_value || 0, (Number(currentValue) || 0) - 1))}
                        className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl font-bold hover:bg-zinc-200 transition-colors"
                    >
                        −
                    </button>
                    <input
                        type="number"
                        value={currentValue ?? ""}
                        onChange={(e) => onAnswer(Number(e.target.value))}
                        className="flex-1 h-16 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-center text-3xl font-black focus:outline-none focus:border-orange-500 transition-all"
                    />
                    <button
                        onClick={() => onAnswer(Math.min(question.max_value || 9999, (Number(currentValue) || 0) + 1))}
                        className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl font-bold hover:bg-zinc-200 transition-colors"
                    >
                        +
                    </button>
                </div>
            );

        case "multi_choice":
            return (
                <div className="grid gap-3">
                    {(question.options || []).map((option) => (
                        <motion.button
                            key={option}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onAnswer(option)}
                            className={cn(
                                "w-full text-left px-6 py-5 rounded-2xl border-2 font-bold transition-all flex items-center justify-between",
                                currentValue === option
                                    ? "border-orange-500 bg-orange-500 text-white shadow-lg"
                                    : "border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400"
                            )}
                        >
                            <span>{option}</span>
                            {currentValue === option ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5 opacity-20" />}
                        </motion.button>
                    ))}
                </div>
            );

        case "checkbox":
            const selectedItems = (currentValue as string[]) || [];
            return (
                <div className="grid gap-3">
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
                                    "w-full text-left px-6 py-5 rounded-2xl border-2 font-bold transition-all flex items-center justify-between",
                                    isSelected
                                        ? "border-emerald-500 bg-emerald-500 text-white shadow-lg"
                                        : "border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400"
                                )}
                            >
                                <span>{option}</span>
                                <div className={cn("w-6 h-6 rounded-lg border-2 flex items-center justify-center", isSelected ? "border-white bg-white/20" : "border-zinc-300 dark:border-zinc-700")}>
                                    {isSelected && <span className="text-white text-xs">✓</span>}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            );

        case "rating":
            const rating = Number(currentValue) || 0;
            return (
                <div className="flex items-center justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                            key={star}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onAnswer(star)}
                        >
                            <Star
                                className={cn(
                                    "w-12 h-12 transition-colors",
                                    star <= rating ? "fill-orange-400 text-orange-400" : "text-zinc-200 dark:text-zinc-800"
                                )}
                            />
                        </motion.button>
                    ))}
                </div>
            );

        case "photo":
            return (
                <div className="text-center py-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                    <p className="text-xs text-zinc-400 font-medium mb-4 uppercase tracking-widest">Aguardando Captura</p>
                    {!currentValue ? (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center shadow-sm">
                                <Camera className="w-8 h-8 text-zinc-300" />
                            </div>
                            <span className="text-[10px] font-black text-zinc-400 uppercase">Utilize o botão de foto abaixo</span>
                        </div>
                    ) : (
                        <p className="text-emerald-500 font-black text-sm uppercase flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-5 h-5" /> Mídia Confirmada
                        </p>
                    )}
                </div>
            );

        default:
            return null;
    }
}
