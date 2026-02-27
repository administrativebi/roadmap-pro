"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
    Plus, GripVertical, Trash2, Copy, Settings2,
    ChevronDown, ChevronUp, Save, Eye, History,
    Zap, Image as ImageIcon, Weight, Layers,
    FileText, Sparkles, MoreVertical, Check, Loader2,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    ChecklistSection, ChecklistQuestion, QuestionType,
    QUESTION_TYPE_CONFIG, SECTION_COLORS, SECTION_ICONS,
} from "@/types/checklist-builder";
import { QuestionEditor } from "./QuestionEditor";
import { TemplateManager } from "./TemplateManager";
import { VersionHistory } from "./VersionHistory";
import { ScheduleConfigModal, ScheduleBadge, type ScheduleConfig } from "./ScheduleConfig";
import { createClient } from "@/lib/supabase/client";

function generateId() {
    return `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function createDefaultQuestion(order: number): ChecklistQuestion {
    return {
        id: generateId(),
        text: "",
        type: "yes_no",
        required: true,
        weight: 1,
        mediaInstructions: [],
        conditionalRules: [],
        order,
    };
}

function createDefaultSection(order: number): ChecklistSection {
    return {
        id: generateId(),
        title: `Nova Seção`,
        color: SECTION_COLORS[order % SECTION_COLORS.length],
        icon: SECTION_ICONS[order % SECTION_ICONS.length],
        questions: [createDefaultQuestion(0)],
        order,
    };
}

// Empty state for new checklists
const emptySections: ChecklistSection[] = [
    createDefaultSection(0),
];

export function ChecklistBuilder({ templateId, onSave }: { templateId?: string | null, onSave?: () => void }) {
    const [sections, setSections] = useState<ChecklistSection[]>([]);
    const [templateName, setTemplateName] = useState("");
    const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [showVersions, setShowVersions] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState<string[]>([]);
    const [dragOverSection, setDragOverSection] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
    const [sectors, setSectors] = useState<{ id: string, name: string }[]>([]);
    const [sectorId, setSectorId] = useState<string>("");
    const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
        enabled: false,
        recurrence: "none",
        days_of_week: [],
        day_of_month: null,
        start_date: "",
        end_date: "",
        deadline_time: "",
        notify_before_minutes: 60,
        auto_create: true,
    });
    const [currentTemplateDbId, setCurrentTemplateDbId] = useState<string | null>(templateId || null);
    const supabase = createClient();

    // Fetch sectors
    useEffect(() => {
        async function fetchSectors() {
            const { data } = await supabase.from('sectors').select('id, name').order('name');
            if (data) setSectors(data);
        }
        fetchSectors();
    }, [supabase]);

    // Load template if editing, otherwise start blank
    useEffect(() => {
        if (!templateId) {
            // New checklist: start completely clean
            setSections([createDefaultSection(0)]);
            setTemplateName("");
            setSectorId("");
            setScheduleConfig({
                enabled: false, recurrence: "none", days_of_week: [],
                day_of_month: null, start_date: "", end_date: "",
                deadline_time: "", notify_before_minutes: 60, auto_create: true,
            });
            setCurrentTemplateDbId(null);
            return;
        }

        async function loadTemplate() {
            setIsLoadingTemplate(true);
            try {
                const { data: tData, error: tError } = await supabase
                    .from("checklist_templates")
                    .select("*")
                    .eq("id", templateId)
                    .single();

                if (tError) throw tError;
                if (tData) {
                    setTemplateName(tData.title);
                    setSectorId(tData.sector_id || "");
                    if (tData.schedule_config) {
                        setScheduleConfig(tData.schedule_config);
                    } else if (tData.deadline_date || tData.deadline_time) {
                        // Migrate old fields
                        setScheduleConfig(prev => ({
                            ...prev,
                            enabled: true,
                            recurrence: "none",
                            start_date: tData.deadline_date || "",
                            deadline_time: tData.deadline_time || "",
                        }));
                    }
                    setCurrentTemplateDbId(tData.id);
                }

                const { data: qData, error: qError } = await supabase
                    .from("template_questions")
                    .select("*")
                    .eq("template_id", templateId)
                    .order("order_index", { ascending: true });

                if (qError) throw qError;

                if (qData && qData.length > 0) {
                    const sectionMap = new Map<string, ChecklistSection>();

                    for (const q of qData) {
                        try {
                            const sectionMeta = JSON.parse(q.section);
                            if (!sectionMap.has(sectionMeta.id)) {
                                sectionMap.set(sectionMeta.id, {
                                    id: sectionMeta.id,
                                    title: sectionMeta.title,
                                    description: sectionMeta.description || "",
                                    color: sectionMeta.color || "#10b981",
                                    icon: sectionMeta.icon || "🧹",
                                    order: sectionMeta.order || 0,
                                    questions: []
                                });
                            }

                            const sec = sectionMap.get(sectionMeta.id)!;
                            sec.questions.push({
                                id: generateId(),
                                text: q.title,
                                type: q.type as any,
                                required: q.is_required,
                                weight: q.weight,
                                mediaInstructions: q.instruction_media_url ? [{ id: generateId(), type: "image", url: q.instruction_media_url, caption: "" }] : [],
                                conditionalRules: q.conditional_rules || [],
                                order: q.order_index
                            });
                        } catch (e) {
                            console.error("Invalid section meta", e);
                        }
                    }

                    const loadedSections = Array.from(sectionMap.values()).sort((a, b) => a.order - b.order);
                    setSections(loadedSections.length > 0 ? loadedSections : [createDefaultSection(0)]);
                } else {
                    setSections([createDefaultSection(0)]);
                }

            } catch (err) {
                console.error("Error loading template", err);
            } finally {
                setIsLoadingTemplate(false);
            }
        }

        loadTemplate();
    }, [templateId, supabase]);

    const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
    const totalWeight = sections.reduce((sum, s) => sum + s.questions.reduce((qs, q) => qs + q.weight, 0), 0);

    const toggleSection = (id: string) => {
        setCollapsedSections((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
        );
    };

    const addSection = () => {
        setSections([...sections, createDefaultSection(sections.length)]);
    };

    const deleteSection = (sectionId: string) => {
        setSections(sections.filter((s) => s.id !== sectionId));
    };

    const duplicateSection = (sectionId: string) => {
        const section = sections.find((s) => s.id === sectionId);
        if (!section) return;
        const newSection: ChecklistSection = {
            ...section,
            id: generateId(),
            title: `${section.title} (Cópia)`,
            order: sections.length,
            questions: section.questions.map((q) => ({ ...q, id: generateId() })),
        };
        setSections([...sections, newSection]);
    };

    const updateSection = (sectionId: string, updates: Partial<ChecklistSection>) => {
        setSections(sections.map((s) => s.id === sectionId ? { ...s, ...updates } : s));
    };

    const addQuestion = (sectionId: string) => {
        setSections(sections.map((s) => {
            if (s.id !== sectionId) return s;
            return { ...s, questions: [...s.questions, createDefaultQuestion(s.questions.length)] };
        }));
    };

    const deleteQuestion = (sectionId: string, questionId: string) => {
        setSections(sections.map((s) => {
            if (s.id !== sectionId) return s;
            return { ...s, questions: s.questions.filter((q) => q.id !== questionId) };
        }));
        if (selectedQuestion === questionId) setSelectedQuestion(null);
    };

    const duplicateQuestion = (sectionId: string, questionId: string) => {
        setSections(sections.map((s) => {
            if (s.id !== sectionId) return s;
            const q = s.questions.find((q) => q.id === questionId);
            if (!q) return s;
            const newQ: ChecklistQuestion = { ...q, id: generateId(), text: `${q.text} (Cópia)`, order: s.questions.length };
            return { ...s, questions: [...s.questions, newQ] };
        }));
    };

    const updateQuestion = (sectionId: string, questionId: string, updates: Partial<ChecklistQuestion>) => {
        setSections(sections.map((s) => {
            if (s.id !== sectionId) return s;
            return { ...s, questions: s.questions.map((q) => q.id === questionId ? { ...q, ...updates } : q) };
        }));
    };

    const handleSave = async () => {
        if (!templateName.trim()) {
            alert("Por favor, dê um nome ao checklist.");
            return;
        }

        // Check there's at least 1 question with text
        const hasQuestion = sections.some(s => s.questions.some(q => q.text.trim()));
        if (!hasQuestion) {
            alert("Adicione pelo menos uma pergunta com texto.");
            return;
        }

        setIsSaving(true);
        try {
            let savedTemplateId = currentTemplateDbId;
            const previousQuestionCount = templateId ? await getPreviousQuestionCount(templateId) : 0;

            if (savedTemplateId) {
                // Update existing template
                const { error: templateError } = await supabase
                    .from("checklist_templates")
                    .update({
                        title: templateName,
                        description: "Template editado via construtor",
                        sector_id: sectorId || null,
                        schedule_config: scheduleConfig,
                        deadline_date: scheduleConfig.start_date || null,
                        deadline_time: scheduleConfig.deadline_time || null,
                    })
                    .eq("id", savedTemplateId);

                if (templateError) {
                    console.error("Erro ao atualizar template:", templateError);
                    throw new Error(`Erro ao atualizar: ${templateError.message}`);
                }

                // Delete old questions 
                const { error: delError } = await supabase
                    .from("template_questions")
                    .delete()
                    .eq("template_id", savedTemplateId);

                if (delError) {
                    console.error("Erro ao limpar perguntas:", delError);
                    throw new Error(`Erro ao limpar perguntas: ${delError.message}`);
                }
            } else {
                // Insert new template
                const { data: templateData, error: templateError } = await supabase
                    .from("checklist_templates")
                    .insert({
                        title: templateName,
                        description: "Template gerado via construtor",
                        sector_id: sectorId || null,
                        schedule_config: scheduleConfig,
                        deadline_date: scheduleConfig.start_date || null,
                        deadline_time: scheduleConfig.deadline_time || null,
                        version: 1,
                        is_active: true
                    })
                    .select()
                    .single();

                if (templateError) {
                    console.error("Erro ao criar template:", templateError);
                    throw new Error(`Erro ao criar: ${templateError.message}`);
                }
                savedTemplateId = templateData.id;
                setCurrentTemplateDbId(savedTemplateId);
            }

            // Insert questions
            const questionsToInsert = [];
            let globalIndex = 0;

            for (const section of sections) {
                const sectionData = JSON.stringify({
                    id: section.id,
                    title: section.title,
                    icon: section.icon,
                    color: section.color,
                    description: section.description,
                    order: section.order
                });

                for (const q of section.questions) {
                    if (!q.text.trim()) continue; // Skip empty questions
                    questionsToInsert.push({
                        template_id: savedTemplateId,
                        section: sectionData,
                        order_index: globalIndex++,
                        title: q.text,
                        type: q.type,
                        is_required: q.required,
                        weight: q.weight,
                        conditional_rules: q.conditionalRules.length > 0 ? q.conditionalRules : null,
                        instruction_media_url: q.mediaInstructions?.[0]?.url || null
                    });
                }
            }

            if (questionsToInsert.length > 0) {
                const { error: qsError } = await supabase.from("template_questions").insert(questionsToInsert);
                if (qsError) {
                    console.error("Erro ao inserir perguntas:", qsError);
                    throw new Error(`Erro ao inserir perguntas: ${qsError.message}`);
                }
            }

            // Save version snapshot
            const newQCount = questionsToInsert.length;
            const diff = newQCount - previousQuestionCount;
            await supabase.from("template_versions").insert({
                template_id: savedTemplateId,
                version: templateId ? 2 : 1,
                snapshot: { templateName, sections, sectorId, scheduleConfig },
                changes: [templateId ? "Template atualizado via construtor" : "Template criado via construtor"],
                questions_added: diff > 0 ? diff : 0,
                questions_removed: diff < 0 ? Math.abs(diff) : 0,
                questions_modified: templateId ? Math.min(newQCount, previousQuestionCount) : 0,
            });

            setSaved(true);
            setTimeout(() => {
                setSaved(false);
                if (onSave) onSave();
            }, 1000);
        } catch (error: any) {
            console.error("Erro ao salvar:", error);
            alert(`Erro ao salvar o checklist: ${error.message || "Erro desconhecido"}`);
        } finally {
            setIsSaving(false);
        }
    };

    const getPreviousQuestionCount = async (tplId: string): Promise<number> => {
        const { count } = await supabase
            .from("template_questions")
            .select("*", { count: "exact", head: true })
            .eq("template_id", tplId);
        return count || 0;
    };

    const handleReorderQuestions = (sectionId: string, newOrder: ChecklistQuestion[]) => {
        setSections(sections.map((s) => {
            if (s.id !== sectionId) return s;
            return { ...s, questions: newOrder.map((q, i) => ({ ...q, order: i })) };
        }));
    };

    const handleLoadTemplate = (loadedSections: ChecklistSection[], name: string) => {
        setSections(loadedSections);
        setTemplateName(name);
        setShowTemplates(false);
    };

    const handleRestoreVersion = (snapshot: any) => {
        if (snapshot.sections) setSections(snapshot.sections);
        if (snapshot.templateName) setTemplateName(snapshot.templateName);
        if (snapshot.sectorId) setSectorId(snapshot.sectorId);
        if (snapshot.scheduleConfig) setScheduleConfig(snapshot.scheduleConfig);
        // Backward compat
        if (snapshot.deadlineDate && !snapshot.scheduleConfig) {
            setScheduleConfig(prev => ({ ...prev, enabled: true, start_date: snapshot.deadlineDate, deadline_time: snapshot.deadlineTime || "" }));
        }
        setShowVersions(false);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)]">
            {/* Main Builder Area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-0 lg:pr-2">
                {isLoadingTemplate ? (
                    <div className="flex flex-col items-center justify-center h-full p-12 text-zinc-500">
                        <Loader2 className="w-8 h-8 animate-spin mb-4 text-orange-500" />
                        <p>Carregando template...</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-5 sticky top-0 z-10">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                                        <Layers className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={templateName}
                                            onChange={(e) => setTemplateName(e.target.value)}
                                            className="text-xl font-bold text-zinc-900 dark:text-zinc-50 bg-transparent border-none focus:outline-none w-full"
                                            placeholder="Nome do checklist..."
                                        />
                                        {sectors.length > 0 && (
                                            <select
                                                value={sectorId}
                                                onChange={(e) => setSectorId(e.target.value)}
                                                className="mt-1 text-sm bg-transparent border-none text-zinc-500 font-medium focus:outline-none focus:ring-0 cursor-pointer"
                                            >
                                                <option value="">-- Vincular a um setor (opcional) --</option>
                                                {sectors.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        )}
                                        <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                                            <span>📋 {totalQuestions} perguntas</span>
                                            <span>📂 {sections.length} seções</span>
                                            <span>⚖️ Peso total: {totalWeight}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Schedule Badge */}
                                <ScheduleBadge config={scheduleConfig} onClick={() => setShowSchedule(true)} />

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <button onClick={() => setShowTemplates(true)} className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex items-center gap-1.5">
                                        <Copy className="w-3.5 h-3.5" /> Templates
                                    </button>
                                    <button onClick={() => setShowVersions(true)} className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex items-center gap-1.5">
                                        <History className="w-3.5 h-3.5" /> Versões
                                    </button>
                                    <button onClick={() => setShowPreview(!showPreview)} className={cn("px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5", showPreview ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400")}>
                                        <Eye className="w-3.5 h-3.5" /> Preview
                                    </button>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                                            saved ? "bg-emerald-500 text-white" : "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-md disabled:opacity-50"
                                        )}
                                    >
                                        {isSaving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando...</> : saved ? <><Check className="w-3.5 h-3.5" /> Salvo!</> : <><Save className="w-3.5 h-3.5" /> Salvar</>}
                                    </motion.button>
                                </div>
                            </div>
                        </div>

                        {/* Preview Mode */}
                        <AnimatePresence>
                            {showPreview && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-white dark:bg-zinc-950 rounded-2xl border-2 border-violet-200 dark:border-violet-800 p-6 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Eye className="w-5 h-5 text-violet-500" />
                                                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">Preview do Checklist</h3>
                                            </div>
                                            <button onClick={() => setShowPreview(false)} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 bg-zinc-50 dark:bg-zinc-900/50">
                                            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-1">
                                                {templateName || "Sem título"}
                                            </h2>
                                            <p className="text-sm text-zinc-500 mb-1">
                                                {totalQuestions} perguntas • {sections.length} seções
                                            </p>
                                            {scheduleConfig.enabled && (
                                                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                    📅 {scheduleConfig.recurrence !== "none" ? `Recorrência: ${scheduleConfig.recurrence}` : "Agendado"}
                                                    {scheduleConfig.start_date && ` • ${new Date(scheduleConfig.start_date + "T00:00").toLocaleDateString("pt-BR")}`}
                                                    {scheduleConfig.deadline_time && ` às ${scheduleConfig.deadline_time}`}
                                                </p>
                                            )}
                                        </div>

                                        {sections.map((section, si) => (
                                            <div key={section.id} className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">{section.icon}</span>
                                                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50" style={{ color: section.color }}>
                                                        {section.title || `Seção ${si + 1}`}
                                                    </h4>
                                                </div>
                                                {section.questions.map((q, qi) => (
                                                    <div key={q.id} className={cn(
                                                        "flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800",
                                                        q.conditionalParentId && "ml-6 border-dashed"
                                                    )}>
                                                        <span className="text-xs font-bold text-zinc-400 mt-1 w-5 shrink-0">{qi + 1}</span>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                                                                {q.text || "Pergunta sem texto"}
                                                                {q.required && <span className="text-red-400 ml-1">*</span>}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1.5">
                                                                <span className="text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-full">
                                                                    {QUESTION_TYPE_CONFIG[q.type]?.icon} {QUESTION_TYPE_CONFIG[q.type]?.label}
                                                                </span>
                                                                {q.weight > 1 && (
                                                                    <span className="text-[10px] px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-600 rounded-full">
                                                                        Peso {q.weight}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Sections */}
                        {sections.map((section, si) => {
                            const isCollapsed = collapsedSections.includes(section.id);
                            const sectionWeight = section.questions.reduce((sum, q) => sum + q.weight, 0);

                            return (
                                <motion.div
                                    key={section.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: si * 0.05 }}
                                    className="bg-white dark:bg-zinc-950 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 overflow-hidden"
                                    style={{ borderLeftColor: section.color, borderLeftWidth: 4 }}
                                >
                                    {/* Section Header */}
                                    <div className="p-4 flex items-center gap-3 bg-zinc-50/50 dark:bg-zinc-900/50">
                                        <div className="cursor-grab active:cursor-grabbing p-1 text-zinc-300 hover:text-zinc-500">
                                            <GripVertical className="w-5 h-5" />
                                        </div>
                                        <span className="text-xl">{section.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <input
                                                type="text"
                                                value={section.title}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSection(section.id, { title: e.target.value })}
                                                className="font-bold text-zinc-900 dark:text-zinc-50 bg-transparent border-none focus:outline-none w-full text-sm"
                                                placeholder="Nome da seção..."
                                            />
                                            <input
                                                type="text"
                                                value={section.description || ""}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSection(section.id, { description: e.target.value })}
                                                className="text-xs text-zinc-400 bg-transparent border-none focus:outline-none w-full mt-0.5"
                                                placeholder="Descrição (opcional)..."
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">{section.questions.length} perguntas</span>
                                            <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">⚖️ {sectionWeight}</span>

                                            {/* Section Icon Picker */}
                                            <div className="relative group">
                                                <button className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-all">
                                                    <Settings2 className="w-4 h-4" />
                                                </button>
                                                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 p-3 z-20 hidden group-hover:block w-48">
                                                    <p className="text-[10px] font-bold text-zinc-400 mb-2">ÍCONE</p>
                                                    <div className="grid grid-cols-8 gap-1 mb-3">
                                                        {SECTION_ICONS.map((icon) => (
                                                            <button key={icon} onClick={() => updateSection(section.id, { icon })} className={cn("text-lg p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800", section.icon === icon && "bg-zinc-200 dark:bg-zinc-700")}>
                                                                {icon}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <p className="text-[10px] font-bold text-zinc-400 mb-2">COR</p>
                                                    <div className="grid grid-cols-8 gap-1">
                                                        {SECTION_COLORS.map((color) => (
                                                            <button key={color} onClick={() => updateSection(section.id, { color })} className={cn("w-5 h-5 rounded-full border-2", section.color === color ? "border-zinc-900 dark:border-zinc-100" : "border-transparent")} style={{ backgroundColor: color }} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <button onClick={() => duplicateSection(section.id)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-all" title="Duplicar seção">
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => deleteSection(section.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-zinc-400 hover:text-red-500 transition-all" title="Excluir seção">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => toggleSection(section.id)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-all">
                                                {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Questions */}
                                    <AnimatePresence>
                                        {!isCollapsed && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="p-3 space-y-2">
                                                    <Reorder.Group
                                                        axis="y"
                                                        values={section.questions}
                                                        onReorder={(newOrder) => handleReorderQuestions(section.id, newOrder)}
                                                        className="space-y-2"
                                                    >
                                                        {section.questions.map((question, qi) => (
                                                            <Reorder.Item key={question.id} value={question}>
                                                                <div
                                                                    className={cn(
                                                                        "group rounded-xl border-2 p-3 transition-all cursor-default",
                                                                        selectedQuestion === question.id
                                                                            ? "border-orange-400 dark:border-orange-600 bg-orange-50/50 dark:bg-orange-950/10"
                                                                            : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700",
                                                                        question.conditionalParentId && "ml-8 border-dashed"
                                                                    )}
                                                                    onClick={() => setSelectedQuestion(question.id === selectedQuestion ? null : question.id)}
                                                                >
                                                                    <div className="flex items-start gap-2">
                                                                        <div className="cursor-grab active:cursor-grabbing p-1 text-zinc-200 dark:text-zinc-600 hover:text-zinc-400 mt-0.5">
                                                                            <GripVertical className="w-4 h-4" />
                                                                        </div>

                                                                        {/* Question number */}
                                                                        <span className="text-xs font-bold text-zinc-300 dark:text-zinc-600 mt-1.5 w-5 shrink-0">
                                                                            {question.conditionalParentId ? "↳" : `${qi + 1}`}
                                                                        </span>

                                                                        <div className="flex-1 min-w-0">
                                                                            <input
                                                                                type="text"
                                                                                value={question.text}
                                                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateQuestion(section.id, question.id, { text: e.target.value })}
                                                                                className="w-full text-sm font-medium text-zinc-900 dark:text-zinc-50 bg-transparent border-none focus:outline-none"
                                                                                placeholder="Digite a pergunta..."
                                                                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                                                            />
                                                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                                <span className="text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-full flex items-center gap-1">
                                                                                    {QUESTION_TYPE_CONFIG[question.type].icon} {QUESTION_TYPE_CONFIG[question.type].label}
                                                                                </span>

                                                                                {question.weight > 1 && (
                                                                                    <span className="text-[10px] px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-600 rounded-full flex items-center gap-1">
                                                                                        <Weight className="w-3 h-3" /> Peso {question.weight}
                                                                                    </span>
                                                                                )}

                                                                                {question.conditionalRules.length > 0 && (
                                                                                    <span className="text-[10px] px-2 py-0.5 bg-violet-100 dark:bg-violet-950 text-violet-600 rounded-full flex items-center gap-1">
                                                                                        <Zap className="w-3 h-3" /> Condicional
                                                                                    </span>
                                                                                )}

                                                                                {question.mediaInstructions.length > 0 && (
                                                                                    <span className="text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-full flex items-center gap-1">
                                                                                        <ImageIcon className="w-3 h-3" /> {question.mediaInstructions.length} mídia
                                                                                    </span>
                                                                                )}

                                                                                {question.required && (
                                                                                    <span className="text-[10px] text-red-400">*obrigatória</span>
                                                                                )}

                                                                                {question.conditionalParentId && (
                                                                                    <span className="text-[10px] px-2 py-0.5 bg-violet-50 dark:bg-violet-950/50 text-violet-500 rounded-full">
                                                                                        ↳ Aparece se condição
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Quick Actions */}
                                                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                                            <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); duplicateQuestion(section.id, question.id); }} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400" title="Duplicar">
                                                                                <Copy className="w-3.5 h-3.5" />
                                                                            </button>
                                                                            <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); deleteQuestion(section.id, question.id); }} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950 text-zinc-400 hover:text-red-500" title="Excluir">
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </Reorder.Item>
                                                        ))}
                                                    </Reorder.Group>

                                                    {/* Add Question */}
                                                    <button
                                                        onClick={() => addQuestion(section.id)}
                                                        className="w-full py-3 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-600 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Plus className="w-4 h-4" /> Adicionar Pergunta
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}

                        {/* Add Section */}
                        <button
                            onClick={addSection}
                            className="w-full py-5 bg-white dark:bg-zinc-950 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm font-semibold text-zinc-400 hover:text-orange-500 hover:border-orange-300 dark:hover:border-orange-700 transition-all flex items-center justify-center gap-2"
                        >
                            <Layers className="w-5 h-5" /> Adicionar Seção
                        </button>
                    </>
                )}
            </div>

            {/* Right Panel — Question Editor */}
            <AnimatePresence>
                {selectedQuestion && (
                    <motion.div
                        initial={{ opacity: 0, x: 20, width: 0 }}
                        animate={{ opacity: 1, x: 0, width: 380 }}
                        exit={{ opacity: 0, x: 20, width: 0 }}
                        className="shrink-0 overflow-y-auto hidden lg:block"
                    >
                        <QuestionEditor
                            sections={sections}
                            questionId={selectedQuestion}
                            onUpdate={(sectionId: string, questionId: string, updates: any) => updateQuestion(sectionId, questionId, updates)}
                            onClose={() => setSelectedQuestion(null)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals */}
            <AnimatePresence>
                {showVersions && (
                    <VersionHistory
                        templateId={currentTemplateDbId}
                        onClose={() => setShowVersions(false)}
                        onRestore={handleRestoreVersion}
                    />
                )}
                {showTemplates && (
                    <TemplateManager
                        onClose={() => setShowTemplates(false)}
                        onLoad={handleLoadTemplate}
                    />
                )}
                {showSchedule && (
                    <ScheduleConfigModal
                        config={scheduleConfig}
                        onChange={setScheduleConfig}
                        onClose={() => setShowSchedule(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
