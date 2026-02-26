"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
    Plus, GripVertical, Trash2, Copy, Settings2,
    ChevronDown, ChevronUp, Save, Eye, History,
    Zap, Image as ImageIcon, Weight, Layers,
    FileText, Sparkles, MoreVertical, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    ChecklistSection, ChecklistQuestion, QuestionType,
    QUESTION_TYPE_CONFIG, SECTION_COLORS, SECTION_ICONS,
} from "@/types/checklist-builder";
import { QuestionEditor } from "./QuestionEditor";
import { TemplateManager } from "./TemplateManager";
import { VersionHistory } from "./VersionHistory";

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

// Mock initial data
const initialSections: ChecklistSection[] = [
    {
        id: "sec1", title: "Limpeza e Higienização", color: "#10b981", icon: "🧹", order: 0,
        description: "Verificação de limpeza em todas as áreas",
        questions: [
            { id: "q1", text: "Área de preparo higienizada?", type: "yes_no", required: true, weight: 3, mediaInstructions: [{ id: "m1", type: "image", url: "/placeholder.jpg", caption: "Exemplo de bancada limpa e organizada" }], conditionalRules: [{ id: "cr1", triggerAnswer: "no", action: "require_photo", targetQuestionIds: ["q1b"] }], order: 0 },
            { id: "q1b", text: "Foto da área suja (evidência)", type: "photo", required: false, weight: 1, mediaInstructions: [], conditionalRules: [], conditionalParentId: "q1", order: 1 },
            { id: "q2", text: "Ralos limpos e sem odor?", type: "yes_no", required: true, weight: 2, mediaInstructions: [], conditionalRules: [], order: 2 },
            { id: "q3", text: "Lixeiras tampadas e forradas?", type: "yes_no", required: true, weight: 2, mediaInstructions: [], conditionalRules: [], order: 3 },
        ],
    },
    {
        id: "sec2", title: "Controle de Temperatura", color: "#3b82f6", icon: "🌡️", order: 1,
        description: "APPCC — Registro de temperaturas críticas",
        questions: [
            { id: "q4", text: "Temperatura da câmara fria (°C)", type: "number", required: true, weight: 5, placeholder: "Ex: 3.5", helpText: "Deve estar ≤ 5°C", mediaInstructions: [{ id: "m2", type: "video", url: "#", caption: "Como usar termômetro infravermelho" }], conditionalRules: [], order: 0 },
            { id: "q5", text: "Temperatura do congelador (°C)", type: "number", required: true, weight: 5, placeholder: "Ex: -18", helpText: "Deve estar ≤ -18°C", mediaInstructions: [], conditionalRules: [], order: 1 },
            { id: "q6", text: "Equipamentos calibrados?", type: "yes_no", required: true, weight: 4, mediaInstructions: [], conditionalRules: [{ id: "cr2", triggerAnswer: "no", action: "create_action_plan", targetQuestionIds: [] }], order: 2 },
        ],
    },
    {
        id: "sec3", title: "Estoque e FIFO", color: "#f59e0b", icon: "📦", order: 2,
        questions: [
            { id: "q7", text: "FIFO aplicado no estoque?", type: "yes_no", required: true, weight: 3, mediaInstructions: [], conditionalRules: [], order: 0 },
            { id: "q8", text: "Produtos com rótulo visível?", type: "yes_no", required: true, weight: 2, mediaInstructions: [], conditionalRules: [], order: 1 },
            { id: "q9", text: "Estoque mínimo mantido?", type: "options", required: true, weight: 2, options: ["Completo", "Parcial", "Abaixo do mínimo"], mediaInstructions: [], conditionalRules: [], order: 2 },
            { id: "q10", text: "Avaliação geral do estoque", type: "rating", required: false, weight: 1, mediaInstructions: [], conditionalRules: [], order: 3 },
        ],
    },
];

export function ChecklistBuilder() {
    const [sections, setSections] = useState<ChecklistSection[]>(initialSections);
    const [templateName, setTemplateName] = useState("Checklist de Abertura — Cozinha");
    const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [showVersions, setShowVersions] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState<string[]>([]);
    const [dragOverSection, setDragOverSection] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

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

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleReorderQuestions = (sectionId: string, newOrder: ChecklistQuestion[]) => {
        setSections(sections.map((s) => {
            if (s.id !== sectionId) return s;
            return { ...s, questions: newOrder.map((q, i) => ({ ...q, order: i })) };
        }));
    };

    return (
        <div className="flex gap-6 h-[calc(100vh-2rem)]">
            {/* Main Builder Area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {/* Header */}
                <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-5 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
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
                                <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5">
                                    <span>📋 {totalQuestions} perguntas</span>
                                    <span>📂 {sections.length} seções</span>
                                    <span>⚖️ Peso total: {totalWeight}</span>
                                    <span>v3.2</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
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
                                className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                                    saved ? "bg-emerald-500 text-white" : "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-md"
                                )}
                            >
                                {saved ? <><Check className="w-3.5 h-3.5" /> Salvo!</> : <><Save className="w-3.5 h-3.5" /> Salvar</>}
                            </motion.button>
                        </div>
                    </div>
                </div>

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
                                        onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                        className="font-bold text-zinc-900 dark:text-zinc-50 bg-transparent border-none focus:outline-none w-full text-sm"
                                        placeholder="Nome da seção..."
                                    />
                                    <input
                                        type="text"
                                        value={section.description || ""}
                                        onChange={(e) => updateSection(section.id, { description: e.target.value })}
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
                                                                        onChange={(e) => updateQuestion(section.id, question.id, { text: e.target.value })}
                                                                        className="w-full text-sm font-medium text-zinc-900 dark:text-zinc-50 bg-transparent border-none focus:outline-none"
                                                                        placeholder="Digite a pergunta..."
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                        {/* Type Badge */}
                                                                        <span className="text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-full flex items-center gap-1">
                                                                            {QUESTION_TYPE_CONFIG[question.type].icon} {QUESTION_TYPE_CONFIG[question.type].label}
                                                                        </span>

                                                                        {/* Weight */}
                                                                        {question.weight > 1 && (
                                                                            <span className="text-[10px] px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-600 rounded-full flex items-center gap-1">
                                                                                <Weight className="w-3 h-3" /> Peso {question.weight}
                                                                            </span>
                                                                        )}

                                                                        {/* Conditional */}
                                                                        {question.conditionalRules.length > 0 && (
                                                                            <span className="text-[10px] px-2 py-0.5 bg-violet-100 dark:bg-violet-950 text-violet-600 rounded-full flex items-center gap-1">
                                                                                <Zap className="w-3 h-3" /> Condicional
                                                                            </span>
                                                                        )}

                                                                        {/* Media */}
                                                                        {question.mediaInstructions.length > 0 && (
                                                                            <span className="text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-full flex items-center gap-1">
                                                                                <ImageIcon className="w-3 h-3" /> {question.mediaInstructions.length} mídia
                                                                            </span>
                                                                        )}

                                                                        {/* Required */}
                                                                        {question.required && (
                                                                            <span className="text-[10px] text-red-400">*obrigatória</span>
                                                                        )}

                                                                        {/* Conditional parent indicator */}
                                                                        {question.conditionalParentId && (
                                                                            <span className="text-[10px] px-2 py-0.5 bg-violet-50 dark:bg-violet-950/50 text-violet-500 rounded-full">
                                                                                ↳ Aparece se condição
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Quick Actions */}
                                                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                                    <button onClick={(e) => { e.stopPropagation(); duplicateQuestion(section.id, question.id); }} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400" title="Duplicar">
                                                                        <Copy className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button onClick={(e) => { e.stopPropagation(); deleteQuestion(section.id, question.id); }} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950 text-zinc-400 hover:text-red-500" title="Excluir">
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
            </div>

            {/* Right Panel — Question Editor */}
            <AnimatePresence>
                {selectedQuestion && (
                    <motion.div
                        initial={{ opacity: 0, x: 20, width: 0 }}
                        animate={{ opacity: 1, x: 0, width: 380 }}
                        exit={{ opacity: 0, x: 20, width: 0 }}
                        className="shrink-0 overflow-y-auto"
                    >
                        <QuestionEditor
                            sections={sections}
                            questionId={selectedQuestion}
                            onUpdate={(sectionId, questionId, updates) => updateQuestion(sectionId, questionId, updates)}
                            onClose={() => setSelectedQuestion(null)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals */}
            <AnimatePresence>
                {showVersions && <VersionHistory onClose={() => setShowVersions(false)} />}
                {showTemplates && <TemplateManager onClose={() => setShowTemplates(false)} />}
            </AnimatePresence>
        </div>
    );
}
