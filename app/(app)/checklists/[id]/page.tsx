"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    Loader2, CheckCircle2, ChevronLeft, ChevronRight,
    Camera, AlertTriangle, Save, Play, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Template {
    id: string;
    title: string;
    description: string;
    sector_id: string;
    estimated_minutes: number;
}

interface ParsedSection {
    id: string;
    title: string;
    icon?: string;
    color?: string;
    order: number;
}

interface Question {
    id: string;
    title: string;
    type: string;
    section: string; // raw JSON string
    parsedSection: ParsedSection;
    is_required: boolean;
    weight: number;
}

function parseSectionField(raw: string): ParsedSection {
    try {
        const parsed = JSON.parse(raw);
        return {
            id: parsed.id || "unknown",
            title: parsed.title || "Seção",
            icon: parsed.icon,
            color: parsed.color,
            order: parsed.order ?? 0,
        };
    } catch {
        // fallback: treat as plain string section name
        return { id: raw, title: raw, order: 0 };
    }
}

export default function ChecklistExecutionPage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const templateId = params.id as string;

    const [template, setTemplate] = useState<Template | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [executionId, setExecutionId] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [answers, setAnswers] = useState<Record<string, { value: string; comment: string; has_issue: boolean }>>({});

    // UI states
    const [currentStep, setCurrentStep] = useState(0); // 0 = capa, 1...n = seções

    useEffect(() => {
        if (templateId) {
            loadTemplateAndStart();
        }
    }, [templateId]);

    const loadTemplateAndStart = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");
            setUserId(user.id);

            // Fetch template
            const { data: tplData, error: tplError } = await supabase
                .from('checklist_templates')
                .select('*')
                .eq('id', templateId)
                .single();

            if (tplError) throw tplError;
            setTemplate(tplData);

            // Fetch questions
            const { data: qData, error: qError } = await supabase
                .from('template_questions')
                .select('*')
                .eq('template_id', templateId)
                .order('order_index');

            if (qError) throw qError;

            // Parse section JSON for each question
            const parsedQuestions: Question[] = (qData || []).map((q: any) => ({
                ...q,
                parsedSection: parseSectionField(q.section),
            }));
            setQuestions(parsedQuestions);

            // Check if there's an in_progress execution for this user and template
            const { data: existingExecution } = await supabase
                .from('checklists')
                .select('*')
                .eq('template_id', templateId)
                .eq('user_id', user.id)
                .eq('status', 'in_progress')
                .order('started_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (existingExecution) {
                setExecutionId(existingExecution.id);
                // load existing answers
                const { data: existingAnswers } = await supabase
                    .from('checklist_responses')
                    .select('*')
                    .eq('checklist_id', existingExecution.id);

                if (existingAnswers) {
                    const loadedAnswers: any = {};
                    existingAnswers.forEach((ans: any) => {
                        loadedAnswers[ans.question_id] = {
                            value: ans.answer_value || "",
                            comment: ans.comment || "",
                            has_issue: ans.has_issue || false
                        };
                    });
                    setAnswers(loadedAnswers);
                }
            } else {
                // start a new execution
                const { data: newExecution, error: newExError } = await supabase
                    .from('checklists')
                    .insert({
                        template_id: templateId,
                        user_id: user.id,
                        sector_id: tplData.sector_id,
                        status: 'in_progress'
                    })
                    .select()
                    .single();

                if (newExError) throw newExError;
                setExecutionId(newExecution.id);
            }

        } catch (error) {
            console.error("Erro ao carregar checklist:", error);
            alert("Erro ao carregar checklist. Verifique sua conexão.");
            router.push('/checklists');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswer = (questionId: string, value: string, has_issue: boolean = false) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                value,
                has_issue,
                comment: prev[questionId]?.comment || "",
            }
        }));
    };

    const handleComment = (questionId: string, comment: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                comment,
                value: prev[questionId]?.value || "",
                has_issue: prev[questionId]?.has_issue || false
            }
        }));
    };

    // Build unique ordered sections from parsed section data
    const sectionMap = new Map<string, ParsedSection>();
    questions.forEach(q => {
        if (!sectionMap.has(q.parsedSection.id)) {
            sectionMap.set(q.parsedSection.id, q.parsedSection);
        }
    });
    const sections = Array.from(sectionMap.values()).sort((a, b) => a.order - b.order);

    const handleFinish = async () => {
        if (!executionId || !userId) return;

        // Verifica se todas obrigatórias foram respondidas
        const missingRequired = questions.filter(q => q.is_required && !answers[q.id]?.value);
        if (missingRequired.length > 0) {
            alert(`Faltam ${missingRequired.length} perguntas obrigatórias.`);
            return;
        }

        setIsSaving(true);
        try {
            // Save responses
            const responsesArray = Object.keys(answers).map(qId => ({
                checklist_id: executionId,
                question_id: qId,
                answer_value: answers[qId].value,
                comment: answers[qId].comment,
                has_issue: answers[qId].has_issue
            }));

            // Delete existing responses to re-insert
            const { error: delError } = await supabase
                .from('checklist_responses')
                .delete()
                .eq('checklist_id', executionId);

            if (delError) {
                console.error("Erro ao limpar respostas:", delError);
                throw new Error(`Erro ao limpar respostas: ${delError.message}`);
            }

            if (responsesArray.length > 0) {
                const { data: insertedResponses, error: insError } = await supabase
                    .from('checklist_responses')
                    .insert(responsesArray)
                    .select();

                if (insError) {
                    console.error("Erro ao inserir respostas:", insError);
                    throw new Error(`Erro ao inserir respostas: ${insError.message}`);
                }

                // Cria Planos de Ação se tem itens marcados com problema
                const issues = insertedResponses?.filter((r: any) => r.has_issue) || [];
                if (issues.length > 0) {
                    const actionPlans = issues.map((issue: any) => {
                        const qInfo = questions.find(q => q.id === issue.question_id);
                        return {
                            checklist_response_id: issue.id,
                            assignee_id: userId,
                            title: `Não Conformidade: ${qInfo?.title}`,
                            description: issue.comment || 'Item marcado como não conforme durante inspeção.',
                            priority: 'High',
                            status: 'Pendente'
                        };
                    });

                    const { error: apError } = await supabase.from('action_plans').insert(actionPlans);
                    if (apError) {
                        console.warn("Aviso: erro ao criar planos de ação:", apError);
                    }
                }
            }

            // Calcula o Score
            let totalWeight = 0;
            let earnedWeight = 0;
            questions.forEach(q => {
                totalWeight += q.weight || 1;
                const ans = answers[q.id];
                if (ans && ans.value === "yes") earnedWeight += q.weight || 1;
                else if (ans && ans.value === "na") {
                    totalWeight -= q.weight || 1; // Não se aplica, não conta
                }
            });

            const score = totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 100;

            // Finaliza o checklist
            const { error: updError } = await supabase
                .from('checklists')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    score: Math.round(score)
                })
                .eq('id', executionId);

            if (updError) {
                console.error("Erro ao finalizar checklist:", updError);
                throw new Error(`Erro ao finalizar: ${updError.message}`);
            }

            // Gera log de atividade
            const { error: logError } = await supabase.from('activity_logs').insert({
                user_id: userId,
                action_type: 'checklist_completed',
                description: `Completou o checklist ${template?.title} com score de ${Math.round(score)}%`
            });

            if (logError) {
                console.warn("Aviso: erro ao criar log de atividade:", logError);
            }

            alert("Checklist concluído com sucesso!");
            router.push('/checklists');
        } catch (err: any) {
            console.error("Erro ao finalizar:", err);
            alert(`Erro ao salvar o checklist: ${err.message || "Erro desconhecido. Tente novamente."}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                <p className="text-zinc-500 font-medium">Carregando checklist...</p>
            </div>
        );
    }

    if (!template) {
        return (
            <div className="p-6 text-center text-zinc-500">
                Checklist não encontrado.
            </div>
        );
    }

    const currentSection = currentStep === 0 ? null : sections[currentStep - 1];
    const currentSectionTitle = currentSection?.title || "Perguntas";
    const currentSectionIcon = currentSection?.icon || "";
    const currentSectionColor = currentSection?.color || "#6366f1";
    const currentQuestions = currentStep === 0 ? [] : questions.filter(q => q.parsedSection.id === currentSection?.id);

    const answeredCount = Object.keys(answers).filter(k => answers[k]?.value).length;
    const progressPercentage = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8 relative min-h-[85vh] flex flex-col">
            {/* Header progressbar */}
            <div className="mb-6 sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-950 pb-4">
                <div className="flex items-center justify-between mb-2">
                    <button
                        onClick={() => router.push('/checklists')}
                        className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-1 text-sm font-medium"
                    >
                        <ChevronLeft className="w-4 h-4" /> Sair
                    </button>
                    <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
                        {Math.round(progressPercentage)}% concluído
                    </span>
                </div>
                <div className="w-full h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        className="h-full bg-indigo-500 rounded-full"
                    />
                </div>
            </div>

            <AnimatePresence mode="wait">
                {currentStep === 0 ? (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex-1 flex flex-col items-center justify-center text-center px-4"
                    >
                        <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/50 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                            <CheckCircle2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">
                            {template.title}
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-md">
                            {template.description || "Preencha as verificações atenta e seriamente para garantir a qualidade de nossa unidade."}
                        </p>

                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl flex gap-6 text-left w-full max-w-md shadow-sm mb-10">
                            <div>
                                <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">Seções</p>
                                <p className="font-semibold">{sections.length}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">Perguntas</p>
                                <p className="font-semibold">{questions.length}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">Tempo Est.</p>
                                <p className="font-semibold">{template.estimated_minutes || Math.ceil(questions.length * 0.5)} min</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setCurrentStep(1)}
                            className="bg-indigo-600 text-white hover:bg-indigo-700 px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-indigo-500/25"
                        >
                            <Play className="w-5 h-5" /> Começar Inspeção
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key={`section-${currentStep}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex-1 flex flex-col"
                    >
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-6 flex items-center gap-2">
                            <span
                                className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                                style={{ backgroundColor: currentSectionColor + '20', color: currentSectionColor }}
                            >
                                {currentSectionIcon || currentStep}
                            </span>
                            {currentSectionTitle}
                        </h2>

                        <div className="space-y-6 pb-24">
                            {currentQuestions.map(q => {
                                const ans = answers[q.id];
                                return (
                                    <div key={q.id} className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                        <div className="flex gap-3 mb-4">
                                            {q.is_required && <span className="text-rose-500 font-bold mt-1">*</span>}
                                            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{q.title}</p>
                                        </div>

                                        {(q.type === 'yes_no' || q.type === 'conforme') && (
                                            <div className="grid grid-cols-3 gap-2 mb-3">
                                                <button
                                                    onClick={() => handleAnswer(q.id, 'yes', false)}
                                                    className={cn("py-3 rounded-xl border text-sm font-bold transition-all", ans?.value === 'yes' ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20" : "bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400")}
                                                >
                                                    Conforme
                                                </button>
                                                <button
                                                    onClick={() => handleAnswer(q.id, 'no', true)}
                                                    className={cn("py-3 rounded-xl border text-sm font-bold transition-all", ans?.value === 'no' ? "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/20" : "bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400")}
                                                >
                                                    NC
                                                </button>
                                                <button
                                                    onClick={() => handleAnswer(q.id, 'na', false)}
                                                    className={cn("py-3 rounded-xl border text-sm font-bold transition-all", ans?.value === 'na' ? "bg-zinc-700 border-zinc-700 text-white shadow-md shadow-zinc-500/20" : "bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400")}
                                                >
                                                    N/A
                                                </button>
                                            </div>
                                        )}

                                        {q.type === 'text' && (
                                            <textarea
                                                value={ans?.value || ""}
                                                onChange={(e) => handleAnswer(q.id, e.target.value)}
                                                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                                                placeholder="Digite sua resposta..."
                                                rows={3}
                                            />
                                        )}

                                        {q.type === 'number' && (
                                            <input
                                                type="number"
                                                value={ans?.value || ""}
                                                onChange={(e) => handleAnswer(q.id, e.target.value)}
                                                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                                                placeholder="Digite o valor..."
                                            />
                                        )}

                                        {q.type === 'rating' && (
                                            <div className="flex gap-2 mb-3">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button
                                                        key={star}
                                                        onClick={() => handleAnswer(q.id, String(star))}
                                                        className={cn(
                                                            "w-12 h-12 rounded-xl border text-lg font-bold transition-all",
                                                            Number(ans?.value) >= star
                                                                ? "bg-amber-400 border-amber-400 text-white shadow-md"
                                                                : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                                                        )}
                                                    >
                                                        ⭐
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {q.type === 'multiple_choice' && (
                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                {["Opção A", "Opção B", "Opção C", "Opção D"].map(opt => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => handleAnswer(q.id, opt)}
                                                        className={cn(
                                                            "py-3 px-4 rounded-xl border text-sm font-medium transition-all text-left",
                                                            ans?.value === opt
                                                                ? "bg-indigo-500 border-indigo-500 text-white shadow-md"
                                                                : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                                                        )}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {ans?.value === 'no' && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-3">
                                                <p className="text-xs font-bold text-rose-500 mb-1 flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" /> Justificar Não Conformidade Obrigatória
                                                </p>
                                                <textarea
                                                    value={ans?.comment || ""}
                                                    onChange={(e) => handleComment(q.id, e.target.value)}
                                                    className="w-full bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                                                    placeholder="Descreva o problema encontrado e qual ação deve ser tomada..."
                                                    rows={2}
                                                />
                                            </motion.div>
                                        )}

                                        {!ans?.has_issue && ans?.value && (
                                            <input
                                                type="text"
                                                value={ans?.comment || ""}
                                                onChange={(e) => handleComment(q.id, e.target.value)}
                                                placeholder="Adicionar observação opcional..."
                                                className="w-full bg-transparent border-b border-zinc-200 dark:border-zinc-800 px-1 py-2 text-xs focus:outline-none focus:border-indigo-500"
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navigation Bottom Bar */}
            {currentStep > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 z-20 flex justify-between gap-4 md:max-w-3xl md:mx-auto">
                    <button
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="px-6 py-3 rounded-xl font-bold bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 flex items-center gap-2"
                    >
                        <ChevronLeft className="w-5 h-5" /> Anterior
                    </button>

                    {currentStep < sections.length ? (
                        <button
                            onClick={() => setCurrentStep(currentStep + 1)}
                            className="px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2 shadow-lg hover:shadow-indigo-500/25 flex-1 justify-center"
                        >
                            Próxima Seção <ChevronRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleFinish}
                            disabled={isSaving}
                            className="px-6 py-3 rounded-xl font-bold bg-emerald-500 text-white hover:bg-emerald-600 flex items-center gap-2 shadow-lg hover:shadow-emerald-500/25 flex-1 justify-center disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {isSaving ? "Salvando..." : "Finalizar Checklist"}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
