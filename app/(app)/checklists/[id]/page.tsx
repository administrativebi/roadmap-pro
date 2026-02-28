"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    Loader2, CheckCircle2, ChevronLeft, ChevronRight,
    Camera, AlertTriangle, Save, Play, X, Star, Paperclip
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { notifications } from "@/lib/notifications";

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
    properties?: string[];
    option_items?: { label: string; score: number }[];
    conditional_rules?: any[];
    media_instructions?: { type: 'image' | 'video'; url: string; caption: string }[];
}

function parseSectionField(raw: any): ParsedSection {
    try {
        if (!raw) return { id: "default", title: "Geral", order: 0 };
        // Se já for um objeto, usa as propriedades dele
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

        // Se por algum motivo o parse resultou em algo que não é objeto
        if (typeof parsed !== 'object' || parsed === null) {
            return { id: String(raw), title: String(raw), order: 0 };
        }

        return {
            id: parsed.id || String(parsed.title || "unknown"),
            title: parsed.title || "Seção",
            icon: parsed.icon,
            color: parsed.color,
            order: parsed.order ?? 0,
        };
    } catch {
        // Fallback para quando não é JSON válido
        return { id: String(raw), title: String(raw), order: 0 };
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

    // Answers include photo references and individual option scores
    const [answers, setAnswers] = useState<Record<string, {
        value: string;
        comment: string;
        has_issue: boolean;
        photo_url?: string;
        attachment_url?: string;
        option_score?: number;
    }>>({});

    const [currentStep, setCurrentStep] = useState(0); // 0 = capa, 1...n = seções

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

            // Fetch questions with all new columns
            const { data: qData, error: qError } = await supabase
                .from('template_questions')
                .select('*')
                .eq('template_id', templateId)
                .order('order_index');

            if (qError) throw qError;

            const parsedQuestions: Question[] = (qData || []).map((q: any) => ({
                ...q,
                parsedSection: parseSectionField(q.section),
                properties: q.properties || [q.type], // Fallback to type if properties empty
                option_items: q.option_items || [],
                conditional_rules: q.conditional_rules || [],
                media_instructions: q.media_instructions || []
            }));
            setQuestions(parsedQuestions);

            // Existing execution check
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
                            has_issue: ans.has_issue || false,
                            photo_url: ans.photo_url || "",
                            attachment_url: ans.attachment_url || "",
                            option_score: ans.option_score || 0
                        };
                    });
                    setAnswers(loadedAnswers);
                }
            } else {
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
            alert("Erro ao carregar checklist.");
            router.push('/checklists');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (templateId) loadTemplateAndStart();
    }, [templateId]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (Object.keys(answers).length > 0) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [answers]);

    // Auto-save debounced
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!executionId || Object.keys(answers).length === 0 || isSaving) return;
            try {
                const responsesArray = questions.filter(q => answers[q.id]?.value).map(q => {
                    const ans = answers[q.id];
                    return {
                        checklist_id: executionId,
                        question_id: q.id,
                        answer_value: ans.value,
                        comment: ans.comment || "",
                        has_issue: ans.has_issue || false,
                        photo_url: ans.photo_url || null,
                        attachment_url: ans.attachment_url || null,
                        option_score: ans.option_score || 0
                    };
                });
                if (responsesArray.length > 0) {
                    await supabase.from('checklist_responses').upsert(
                        responsesArray.map(r => ({ ...r, id: undefined })), // let DB handle if we don't have PR
                        { onConflict: 'checklist_id,question_id', ignoreDuplicates: false }
                    );
                }
            } catch (err) { }
        }, 1500);
        return () => clearTimeout(timer);
    }, [answers, executionId]);

    const handleAnswer = (questionId: string, value: string, has_issue: boolean = false, optionScore: number = 0) => {
        if (typeof window !== 'undefined' && window.navigator.vibrate) {
            window.navigator.vibrate(15);
        }
        setAnswers(prev => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                value,
                has_issue,
                option_score: optionScore,
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

    const handleFileUpload = async (questionId: string, file: File, type: 'photo_url' | 'attachment_url') => {
        if (!executionId) return;
        try {
            const ext = file.name.split('.').pop();
            const fileName = `responses/${executionId}/${questionId}_${type}_${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage.from('public').upload(fileName, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('public').getPublicUrl(fileName);
            setAnswers(prev => ({
                ...prev,
                [questionId]: { ...prev[questionId], [type]: publicUrl }
            }));
        } catch (err) {
            console.warn("Erro no upload do bucket, tentando Base64:", err);
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setAnswers(prev => ({
                    ...prev,
                    [questionId]: { ...prev[questionId], [type]: base64String }
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const evaluateCondition = (rule: any, answer: any): boolean => {
        if (!answer || !answer.value) return false;
        const val = answer.value;
        const target = rule.compareValue || rule.triggerAnswer;

        let match = false;
        const valArray = typeof val === 'string' ? val.split(',') : [val];

        switch (rule.operator) {
            case 'greater_than': match = Number(val) > Number(target); break;
            case 'less_than': match = Number(val) < Number(target); break;
            case 'gte': match = Number(val) >= Number(target); break;
            case 'lte': match = Number(val) <= Number(target); break;
            case 'not_equals': match = !valArray.includes(target); break;
            case 'equals':
            default: match = valArray.includes(target); break;
        }

        if (match && rule.nestedRules?.length > 0) {
            return rule.nestedRules.every((nr: any) => evaluateCondition(nr, answer));
        }
        return match;
    };

    // Use useMemo to avoid re-calculating complex logic on every render
    const sections = (questions: Question[]) => {
        const sectionMap = new Map<string, ParsedSection>();
        questions.forEach(q => {
            const sid = q.parsedSection.id;
            if (!sectionMap.has(sid)) sectionMap.set(sid, q.parsedSection);
        });
        return Array.from(sectionMap.values()).sort((a, b) => a.order - b.order);
    };

    const calculatedSections = sections(questions);

    const getVisibilityState = () => {
        const visibleIds = new Set<string>();
        const hiddenIds = new Set<string>();
        const photoRequiredIds = new Set<string>();
        const actionPlanRequiredIds = new Set<string>();

        questions.forEach(q => {
            const ans = answers[q.id];
            q.conditional_rules?.forEach(rule => {
                const match = evaluateCondition(rule, ans);
                if (rule.action === 'show_questions' && rule.targetQuestionIds) {
                    rule.targetQuestionIds.forEach((tId: string) => {
                        hiddenIds.add(tId);
                        if (match) visibleIds.add(tId);
                    });
                }
                if (match) {
                    if (rule.action === 'require_photo') photoRequiredIds.add(q.id);
                    if (rule.action === 'create_action_plan') actionPlanRequiredIds.add(q.id);
                }
            });
        });

        return { visibleIds, hiddenIds, photoRequiredIds, actionPlanRequiredIds };
    };

    const { visibleIds, hiddenIds, photoRequiredIds, actionPlanRequiredIds } = getVisibilityState();

    const isQuestionVisible = (qId: string) => {
        return !hiddenIds.has(qId) || visibleIds.has(qId);
    };

    const handleFinish = async () => {
        if (!executionId || !userId) return;

        const missingRequirements: string[] = [];
        const finalAnswers: any = {};

        for (const q of questions) {
            if (!isQuestionVisible(q.id)) continue;
            const ans = answers[q.id];

            const props = q.properties || [q.type];
            const isOnlyPhoto = props.length === 1 && props[0] === 'photo';
            const hasAnswer = ans?.value || (isOnlyPhoto && ans?.photo_url);

            if (q.is_required && !hasAnswer) {
                if (isOnlyPhoto) {
                    missingRequirements.push(`- "${q.title}": Foto obrigatória`);
                } else {
                    missingRequirements.push(`- "${q.title}": Resposta obrigatória`);
                }
                continue;
            }

            if (hasAnswer) {
                let requirePhoto = q.properties?.includes('photo') || false;
                let requireActionPlan = false;

                q.conditional_rules?.forEach(rule => {
                    if (evaluateCondition(rule, ans)) {
                        if (rule.action === 'require_photo') requirePhoto = true;
                        if (rule.action === 'create_action_plan') requireActionPlan = true;
                    }
                });

                if (requirePhoto && !ans.photo_url) {
                    missingRequirements.push(`- "${q.title}": Foto obrigatória`);
                }

                const needsComment = ans.has_issue || requireActionPlan;
                if (needsComment && (!ans.comment || ans.comment.trim() === '')) {
                    missingRequirements.push(`- "${q.title}": Justificativa para plano de ação obrigatória`);
                }

                finalAnswers[q.id] = { ...ans, has_issue: needsComment };
            }
        }

        if (missingRequirements.length > 0) {
            alert(`Para concluir o checklist verifique as seguintes pendências:\n\n${missingRequirements.join('\n')}`);
            return;
        }

        setIsSaving(true);
        try {
            const responsesArray = Object.entries(finalAnswers).map(([qId, ans]: [string, any]) => ({
                checklist_id: executionId,
                question_id: qId,
                answer_value: ans.value,
                comment: ans.comment,
                has_issue: ans.has_issue,
                photo_url: ans.photo_url || null,
                attachment_url: ans.attachment_url || null,
                option_score: ans.option_score || 0
            }));

            await supabase.from('checklist_responses').delete().eq('checklist_id', executionId);

            let insertedResponsesData = null;
            if (responsesArray.length > 0) {
                const { data: insertedResponses, error: insError } = await supabase
                    .from('checklist_responses')
                    .insert(responsesArray)
                    .select();

                if (insError) {
                    const isColumnError = insError.message?.toLowerCase().includes("column") || insError.code === "42703";
                    if (isColumnError) {
                        // Retry sem option_score e converte photo_url e attachment_url para media_urls
                        const fallbackResponses = responsesArray.map(({ option_score, photo_url, attachment_url, ...rest }) => ({
                            ...rest,
                            media_urls: [photo_url, attachment_url].filter(Boolean)
                        }));

                        try {
                            const { data: retryData, error: retryError } = await supabase
                                .from('checklist_responses')
                                .insert(fallbackResponses)
                                .select();
                            if (retryError) throw retryError;
                            insertedResponsesData = retryData;
                        } catch (err: any) {
                            if (err.message?.toLowerCase().includes("column") || err.code === "42703") {
                                // Fallback final (sem photo_url e sem media_urls e sem option_score)
                                const ultraFallback = fallbackResponses.map(({ media_urls, ...rest }) => rest);
                                const { data: ultraData, error: ultraError } = await supabase
                                    .from('checklist_responses')
                                    .insert(ultraFallback)
                                    .select();
                                if (ultraError) throw ultraError;
                                insertedResponsesData = ultraData;
                            } else {
                                throw err;
                            }
                        }
                    } else {
                        throw insError;
                    }
                } else {
                    insertedResponsesData = insertedResponses;
                }

                // Action plans for issues
                const issues = insertedResponsesData?.filter((r: any) => r.has_issue) || [];
                for (const issue of issues) {
                    const q = questions.find(qu => qu.id === issue.question_id);
                    await supabase.from('action_plans').insert({
                        checklist_response_id: issue.id,
                        assignee_id: userId,
                        title: `Não Conformidade: ${q?.title}`,
                        description: issue.comment || 'Nenhuma justificativa fornecida.',
                        priority: 'high',
                        status: 'pending'
                    });
                }
            }

            // Notify Supervisor if needed
            questions.forEach(q => {
                const ans = answers[q.id];
                q.conditional_rules?.forEach(rule => {
                    if (evaluateCondition(rule, ans) && rule.action === 'notify_supervisor' && template) {
                        notifications.notifySupervisor(
                            template.title,
                            q.title,
                            `Gatilho condicional ativado (Resposta: ${ans.value})`
                        );
                    }
                });
            });

            // Advanced Score Calculation
            let totalWeight = 0;
            let earnedWeight = 0;
            questions.forEach(q => {
                if (!isQuestionVisible(q.id)) return;
                const ans = answers[q.id];
                if (ans?.value === 'na') return;

                const props = q.properties || [q.type];
                if (props.includes('options') && q.option_items) {
                    const maxScore = Math.max(...q.option_items.map(o => o.score || 0));
                    totalWeight += maxScore || q.weight;
                    earnedWeight += ans?.option_score || 0;
                } else {
                    totalWeight += q.weight || 1;
                    if (ans?.value === 'yes') earnedWeight += q.weight || 1;
                }
            });

            const score = totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 100;

            await supabase.from('checklists').update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                score: Math.round(score)
            }).eq('id', executionId);

            router.push(`/checklists/sucesso?score=${Math.round(score)}&earned=${earnedWeight}&total=${totalWeight}&xp=${Math.round(score * 0.5)}&title=${encodeURIComponent(template?.title || 'Checklist')}`);
        } catch (err: any) {
            console.error("Erro completo ao salvar:", err, err?.message, err?.details);
            const msg = err?.message || err?.details || JSON.stringify(err);
            alert(`Erro ao salvar: ${msg}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950"><Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" /><p className="text-zinc-500 font-bold">CARREGANDO...</p></div>;
    if (!template) return <div className="p-8 text-center text-zinc-500">Checklist não encontrado.</div>;

    const currentSection = currentStep === 0 ? null : calculatedSections[currentStep - 1];
    const currentQuestions = currentStep === 0 ? [] : questions.filter(q => q.parsedSection.id === currentSection?.id && isQuestionVisible(q.id));

    const visibleQuestionsCount = questions.filter(q => isQuestionVisible(q.id)).length;
    const answeredVisibleCount = questions.filter(q => isQuestionVisible(q.id) && answers[q.id]?.value).length;
    const progressPercentage = visibleQuestionsCount > 0 ? (answeredVisibleCount / visibleQuestionsCount) * 100 : 0;

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8 min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
            {/* Nav Header */}
            <div className="mb-6 sticky top-0 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md pb-4 z-20">
                <div className="flex items-center justify-between mb-3">
                    <button onClick={() => router.push('/checklists')} className="text-zinc-500 hover:text-zinc-900 flex items-center gap-1 font-bold text-xs uppercase tracking-tighter transition-all">
                        <ChevronLeft className="w-4 h-4" /> Voltar
                    </button>
                    <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">{Math.round(progressPercentage)}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${progressPercentage}%` }} className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)] transition-all duration-500" />
                </div>
            </div>

            <AnimatePresence mode="wait">
                {currentStep === 0 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="flex-1 flex flex-col items-center justify-center text-center py-12">
                        <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-orange-500/30 rotate-3">
                            <CheckCircle2 className="w-12 h-12 text-white" />
                        </div>
                        <h1 className="text-4xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight leading-tight uppercase">
                            {template.title}
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-12 max-w-sm font-medium">
                            {template.description || "Inicie sua vistoria agora. Lembre-se de anexar fotos para itens não conformes."}
                        </p>

                        <div className="grid grid-cols-3 gap-4 w-full max-w-sm mb-12">
                            <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                <p className="text-[10px] uppercase font-black text-zinc-400 mb-1">Items</p>
                                <p className="text-xl font-black">{questions.length}</p>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                <p className="text-[10px] uppercase font-black text-zinc-400 mb-1">Seções</p>
                                <p className="text-xl font-black">{sections.length}</p>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                <p className="text-[10px] uppercase font-black text-zinc-400 mb-1">Tempo</p>
                                <p className="text-xl font-black">~{template.estimated_minutes || 10}'</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setCurrentStep(1)}
                            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-12 py-5 rounded-[2rem] font-black text-lg flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-zinc-500/20 dark:shadow-none"
                        >
                            <Play className="w-6 h-6 fill-current" /> INICIAR
                        </button>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 pb-32">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm" style={{ backgroundColor: currentSection?.color + '20', color: currentSection?.color }}>
                                {currentSection?.icon || "★"}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">
                                    {currentSection?.title}
                                </h2>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Seção {currentStep} de {sections.length}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {currentQuestions.map(q => {
                                const ans = answers[q.id];
                                const props = q.properties || [q.type];
                                const media = q.media_instructions || [];

                                // Conditional requirements
                                const conditionalPhotoRequired = props.includes('photo') || photoRequiredIds.has(q.id);
                                const conditionalActionPlanRequired = actionPlanRequiredIds.has(q.id);

                                return (
                                    <div key={q.id} className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm transition-all hover:border-zinc-200 dark:hover:border-zinc-700">
                                        <div className="flex items-start gap-3 mb-5">
                                            {q.is_required && <span className="text-orange-500 font-black text-xl mt-[-4px] leading-none">*</span>}
                                            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 leading-snug">{q.title}</h4>
                                        </div>

                                        {/* Media Reference */}
                                        {media.length > 0 && (
                                            <div className="mb-5 flex gap-3 overflow-x-auto pb-2 -mx-1 scrollbar-none">
                                                {media.map((m, mIdx) => (
                                                    <div key={mIdx} className="shrink-0 group relative cursor-pointer" onClick={() => window.open(m.url, '_blank')}>
                                                        <div className="w-40 aspect-video rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-50 dark:border-zinc-800">
                                                            {m.type === 'image' ? (
                                                                <img src={m.url} className="w-full h-full object-cover" alt={m.caption} />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-zinc-950 text-white"><Play className="w-8 h-8 fill-white/20" /></div>
                                                            )}
                                                        </div>
                                                        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-[8px] font-bold text-white uppercase opacity-0 group-hover:opacity-100 transition-all rounded-b-2xl">
                                                            {m.caption || "Referência"}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="space-y-5">
                                            {props.includes('yes_no') && (
                                                <div className="grid grid-cols-3 gap-2">
                                                    {[
                                                        { v: 'yes', l: 'SIM', c: 'bg-emerald-500' },
                                                        { v: 'no', l: 'NÃO', c: 'bg-rose-500' },
                                                        { v: 'na', l: 'N/A', c: 'bg-zinc-600' }
                                                    ].map(btn => (
                                                        <button
                                                            key={btn.v}
                                                            onClick={() => handleAnswer(q.id, btn.v, btn.v === 'no')}
                                                            className={cn(
                                                                "py-4 rounded-2xl border-2 font-black text-xs transition-all flex flex-col items-center justify-center gap-1",
                                                                ans?.value === btn.v
                                                                    ? `${btn.c} border-transparent text-white shadow-lg shadow-${btn.v === 'yes' ? 'emerald' : btn.v === 'no' ? 'rose' : 'zinc'}-500/30 scale-[1.02]`
                                                                    : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 text-zinc-400"
                                                            )}
                                                        >
                                                            {btn.l}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {(props.includes('options') || props.includes('multiple_selection')) && q.option_items && q.option_items.length > 0 && (
                                                <div className="grid grid-cols-1 gap-2">
                                                    {q.option_items.map((opt, oIdx) => {
                                                        const isSelected = props.includes('multiple_selection')
                                                            ? (ans?.value || "").split(',').includes(opt.label)
                                                            : ans?.value === opt.label;

                                                        return (
                                                            <button
                                                                key={oIdx}
                                                                onClick={() => {
                                                                    if (props.includes('multiple_selection')) {
                                                                        const currentVals = (ans?.value || "").split(',').filter(Boolean);
                                                                        let newVals = [];
                                                                        let newScore = ans?.option_score || 0;
                                                                        if (currentVals.includes(opt.label)) {
                                                                            newVals = currentVals.filter(v => v !== opt.label);
                                                                            newScore -= opt.score;
                                                                        } else {
                                                                            newVals = [...currentVals, opt.label];
                                                                            newScore += opt.score;
                                                                        }
                                                                        handleAnswer(q.id, newVals.join(','), false, newScore);
                                                                    } else {
                                                                        handleAnswer(q.id, opt.label, false, opt.score);
                                                                    }
                                                                }}
                                                                className={cn(
                                                                    "p-4 rounded-2xl border-2 font-bold text-sm transition-all flex justify-between items-center text-left",
                                                                    isSelected
                                                                        ? "bg-orange-500 border-transparent text-white shadow-xl shadow-orange-500/20"
                                                                        : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 text-zinc-500"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn(
                                                                        "w-5 h-5 flex items-center justify-center shrink-0 border-2",
                                                                        props.includes('multiple_selection') ? "rounded-md" : "rounded-full",
                                                                        isSelected ? "border-white bg-white/20" : "border-zinc-300 dark:border-zinc-600"
                                                                    )}>
                                                                        {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                                    </div>
                                                                    <span>{opt.label}</span>
                                                                </div>
                                                                <span className={cn("text-[10px] font-black px-2 py-1 rounded-full", isSelected ? "bg-white/20 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500")}>
                                                                    {opt.score} pts
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {props.includes('number') && (
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={ans?.value || ""}
                                                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                                                        className="w-full bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-xl font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                                                        placeholder="0"
                                                    />
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col pointer-events-none text-zinc-400">
                                                        <span className="text-[10px] font-bold uppercase">VALOR</span>
                                                        <span className="text-[10px] font-bold uppercase">NUMÉRICO</span>
                                                    </div>
                                                </div>
                                            )}

                                            {props.includes('rating') && (
                                                <div className="flex gap-2">
                                                    {[1, 2, 3, 4, 5].map((star) => {
                                                        const currentVal = parseInt(ans?.value || "0");
                                                        const isActive = star <= currentVal;

                                                        return (
                                                            <button
                                                                key={star}
                                                                onClick={() => handleAnswer(q.id, star.toString(), false, star)}
                                                                className={cn(
                                                                    "flex-1 py-4 rounded-2xl border-2 transition-all flex justify-center items-center",
                                                                    isActive
                                                                        ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105"
                                                                        : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 text-zinc-300 hover:border-amber-200 dark:hover:border-amber-800"
                                                                )}
                                                            >
                                                                <Star className={cn("w-6 h-6", isActive ? "fill-white text-white" : "fill-transparent")} />
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 w-full">
                                                {/* Upload Foto */}
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        capture="environment"
                                                        className="hidden"
                                                        id={`cam-${q.id}`}
                                                        onChange={(e) => {
                                                            const f = e.target.files?.[0];
                                                            if (f) handleFileUpload(q.id, f, 'photo_url');
                                                        }}
                                                    />
                                                    <label
                                                        htmlFor={`cam-${q.id}`}
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-full border flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95 text-xs font-bold",
                                                            ans?.photo_url
                                                                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                                                                : conditionalPhotoRequired && !(ans?.photo_url) ? "bg-orange-50 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800 text-orange-600 dark:text-orange-500 shadow-sm"
                                                                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                                        )}
                                                    >
                                                        {ans?.photo_url ? (
                                                            <>
                                                                <CheckCircle2 className="w-3.5 h-3.5" /> FOTO
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Camera className="w-3.5 h-3.5" /> FOTO {conditionalPhotoRequired && "*"}
                                                            </>
                                                        )}
                                                    </label>
                                                </div>

                                                {/* Upload Anexo */}
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        id={`attach-${q.id}`}
                                                        onChange={(e) => {
                                                            const f = e.target.files?.[0];
                                                            if (f) handleFileUpload(q.id, f, 'attachment_url');
                                                        }}
                                                    />
                                                    <label
                                                        htmlFor={`attach-${q.id}`}
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-full border flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95 text-xs font-bold",
                                                            ans?.attachment_url
                                                                ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400"
                                                                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                                        )}
                                                    >
                                                        {ans?.attachment_url ? (
                                                            <>
                                                                <CheckCircle2 className="w-3.5 h-3.5" /> ANEXO
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Paperclip className="w-3.5 h-3.5" /> ANEXO
                                                            </>
                                                        )}
                                                    </label>
                                                </div>
                                            </div>

                                            {props.includes('text') && (
                                                <textarea
                                                    value={ans?.value || ""}
                                                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                                                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-sm focus:ring-2 focus:ring-orange-500 outline-none min-h-[100px]"
                                                    placeholder="Digite sua resposta detalhada aqui..."
                                                />
                                            )}

                                            {(ans?.has_issue || conditionalActionPlanRequired) && (
                                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-100 dark:border-rose-900/50">
                                                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                        <AlertTriangle className="w-3 h-3" /> Justificar {(ans?.has_issue || conditionalActionPlanRequired) && "e Plano de Ação"}
                                                    </p>
                                                    <textarea
                                                        value={ans?.comment || ""}
                                                        onChange={(e) => handleComment(q.id, e.target.value)}
                                                        className="w-full bg-transparent p-0 text-sm focus:outline-none placeholder:text-rose-300 dark:placeholder:text-rose-800"
                                                        placeholder="O que está errado? Qual o plano de ação sugerido?..."
                                                        rows={2}
                                                    />
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Nav */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-t border-zinc-100 dark:border-zinc-800 z-30">
                <div className="max-w-3xl mx-auto flex gap-4">
                    {currentStep > 0 && (
                        <button
                            onClick={() => setCurrentStep(currentStep - 1)}
                            className="p-5 rounded-[1.5rem] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 text-zinc-600 transition-all font-bold"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    )}

                    {currentStep < sections.length ? (
                        <button
                            onClick={() => setCurrentStep(currentStep + 1)}
                            className="flex-1 py-5 bg-zinc-900 dark:bg-orange-600 text-white font-black rounded-[1.5rem] shadow-xl shadow-zinc-500/20 dark:shadow-orange-500/20 flex items-center justify-center gap-2 hover:translate-y-[-2px] active:translate-y-0 transition-all"
                        >
                            PRÓXIMA SEÇÃO <ChevronRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleFinish}
                            disabled={isSaving}
                            className="flex-1 py-5 bg-emerald-500 text-white font-black rounded-[1.5rem] shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                            {isSaving ? "FINALIZANDO..." : "CONCLUIR CHECKLIST"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
