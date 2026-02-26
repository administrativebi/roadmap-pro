"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    X, Weight, Zap, Image as ImageIcon, Video, Plus,
    Trash2, MessageSquare, Star, ToggleLeft, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    ChecklistSection, ChecklistQuestion, QuestionType,
    QUESTION_TYPE_CONFIG, ConditionalRule, MediaInstruction,
} from "@/types/checklist-builder";

interface QuestionEditorProps {
    sections: ChecklistSection[];
    questionId: string;
    onUpdate: (sectionId: string, questionId: string, updates: Partial<ChecklistQuestion>) => void;
    onClose: () => void;
}

function generateId() {
    return `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function QuestionEditor({ sections, questionId, onUpdate, onClose }: QuestionEditorProps) {
    const [activeTab, setActiveTab] = useState<"general" | "conditional" | "media">("general");

    // Find the question and its section
    let question: ChecklistQuestion | undefined;
    let sectionId = "";
    for (const s of sections) {
        const q = s.questions.find((q) => q.id === questionId);
        if (q) { question = q; sectionId = s.id; break; }
    }

    if (!question) return null;

    const update = (updates: Partial<ChecklistQuestion>) => onUpdate(sectionId, questionId, updates);

    const addConditionalRule = () => {
        const rule: ConditionalRule = {
            id: generateId(),
            triggerAnswer: "no",
            action: "show_questions",
            targetQuestionIds: [],
        };
        update({ conditionalRules: [...question!.conditionalRules, rule] });
    };

    const removeConditionalRule = (ruleId: string) => {
        update({ conditionalRules: question!.conditionalRules.filter((r) => r.id !== ruleId) });
    };

    const updateConditionalRule = (ruleId: string, updates: Partial<ConditionalRule>) => {
        update({
            conditionalRules: question!.conditionalRules.map((r) => r.id === ruleId ? { ...r, ...updates } : r),
        });
    };

    const addMedia = (type: "image" | "video") => {
        const media: MediaInstruction = {
            id: generateId(),
            type,
            url: type === "image" ? "/placeholder.jpg" : "#",
            caption: type === "image" ? "Imagem de referência" : "Vídeo de instrução",
        };
        update({ mediaInstructions: [...question!.mediaInstructions, media] });
    };

    const removeMedia = (mediaId: string) => {
        update({ mediaInstructions: question!.mediaInstructions.filter((m) => m.id !== mediaId) });
    };

    return (
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 h-full overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800 p-4 flex items-center justify-between">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Editar Pergunta</h3>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-100 dark:border-zinc-800">
                {[
                    { id: "general" as const, label: "Geral", icon: "⚙️" },
                    { id: "conditional" as const, label: "Condições", icon: "⚡" },
                    { id: "media" as const, label: "Mídia", icon: "📷" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex-1 py-2.5 text-xs font-semibold text-center transition-all border-b-2",
                            activeTab === tab.id
                                ? "text-orange-600 dark:text-orange-400 border-orange-500"
                                : "text-zinc-400 border-transparent hover:text-zinc-600"
                        )}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <div className="p-4 space-y-4">
                {activeTab === "general" && (
                    <>
                        {/* Question Text */}
                        <div>
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Pergunta</label>
                            <textarea
                                value={question.text}
                                onChange={(e) => update({ text: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="Digite a pergunta..."
                            />
                        </div>

                        {/* Question Type */}
                        <div>
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Tipo de Resposta</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(Object.entries(QUESTION_TYPE_CONFIG) as [QuestionType, typeof QUESTION_TYPE_CONFIG[QuestionType]][]).map(([key, config]) => (
                                    <button
                                        key={key}
                                        onClick={() => update({ type: key })}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-left border-2 transition-all",
                                            question!.type === key
                                                ? "border-orange-400 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300"
                                                : "border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-200"
                                        )}
                                    >
                                        <span className="text-base">{config.icon}</span>
                                        {config.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Options (for multiple choice) */}
                        {question.type === "options" && (
                            <div>
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Opções</label>
                                <div className="space-y-2">
                                    {(question.options || []).map((opt, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-600 shrink-0" />
                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={(e) => {
                                                    const newOpts = [...(question!.options || [])];
                                                    newOpts[i] = e.target.value;
                                                    update({ options: newOpts });
                                                }}
                                                className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            />
                                            <button onClick={() => {
                                                const newOpts = (question!.options || []).filter((_, j) => j !== i);
                                                update({ options: newOpts });
                                            }} className="text-zinc-300 hover:text-red-500">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => update({ options: [...(question!.options || []), `Opção ${(question!.options?.length || 0) + 1}`] })}
                                        className="text-xs text-orange-500 font-semibold flex items-center gap-1 hover:text-orange-600"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Adicionar opção
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Weight */}
                        <div>
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                                <Weight className="w-3.5 h-3.5" /> Peso (Conformidade)
                            </label>
                            <p className="text-[10px] text-zinc-400 mb-2">Perguntas críticas valem mais no score de conformidade</p>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((w) => (
                                    <button
                                        key={w}
                                        onClick={() => update({ weight: w })}
                                        className={cn(
                                            "flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-all",
                                            question!.weight === w
                                                ? w >= 4 ? "border-red-400 bg-red-50 text-red-600 dark:bg-red-950 dark:border-red-700 dark:text-red-400"
                                                    : w >= 2 ? "border-amber-400 bg-amber-50 text-amber-600 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-400"
                                                        : "border-zinc-300 bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-400"
                                                : "border-zinc-100 dark:border-zinc-800 text-zinc-400"
                                        )}
                                    >
                                        {w}
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                                <span>Normal</span>
                                <span>Crítico</span>
                            </div>
                        </div>

                        {/* Help Text */}
                        <div>
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                                <MessageSquare className="w-3.5 h-3.5" /> Texto de Ajuda
                            </label>
                            <input
                                type="text"
                                value={question.helpText || ""}
                                onChange={(e) => update({ helpText: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder='Ex: "Deve estar ≤ 5°C"'
                            />
                        </div>

                        {/* Toggles */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Obrigatória</span>
                                <button
                                    onClick={() => update({ required: !question!.required })}
                                    className={cn("w-10 h-6 rounded-full transition-all flex items-center px-0.5", question.required ? "bg-orange-500 justify-end" : "bg-zinc-300 dark:bg-zinc-600 justify-start")}
                                >
                                    <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === "conditional" && (
                    <>
                        <div className="bg-violet-50 dark:bg-violet-950/30 rounded-xl p-3 mb-4">
                            <p className="text-xs text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                                <Zap className="w-4 h-4" />
                                <strong>Lógica Condicional</strong>
                            </p>
                            <p className="text-[10px] text-violet-500 mt-1">Defina ações automáticas baseadas na resposta desta pergunta</p>
                        </div>

                        {/* Existing Rules */}
                        <div className="space-y-3">
                            {question.conditionalRules.map((rule) => (
                                <div key={rule.id} className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-zinc-500">Regra Condicional</span>
                                        <button onClick={() => removeConditionalRule(rule.id)} className="text-zinc-300 hover:text-red-500">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {/* Trigger */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-zinc-500 shrink-0">Se resposta =</span>
                                            <select
                                                value={rule.triggerAnswer}
                                                onChange={(e) => updateConditionalRule(rule.id, { triggerAnswer: e.target.value })}
                                                className="flex-1 px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                                            >
                                                {question!.type === "yes_no" ? (
                                                    <>
                                                        <option value="no">Não</option>
                                                        <option value="yes">Sim</option>
                                                    </>
                                                ) : question!.type === "number" ? (
                                                    <>
                                                        <option value="above">Acima do limite</option>
                                                        <option value="below">Abaixo do limite</option>
                                                    </>
                                                ) : (
                                                    <>
                                                        <option value="any">Qualquer valor</option>
                                                        <option value="empty">Vazio</option>
                                                    </>
                                                )}
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-zinc-500 shrink-0">Então →</span>
                                            <select
                                                value={rule.action}
                                                onChange={(e) => updateConditionalRule(rule.id, { action: e.target.value as ConditionalRule["action"] })}
                                                className="flex-1 px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                                            >
                                                <option value="show_questions">Mostrar perguntas extras</option>
                                                <option value="require_photo">Exigir foto</option>
                                                <option value="create_action_plan">Criar plano de ação</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={addConditionalRule}
                                className="w-full py-2.5 border-2 border-dashed border-violet-200 dark:border-violet-800 rounded-xl text-xs font-medium text-violet-500 hover:text-violet-600 hover:border-violet-300 transition-all flex items-center justify-center gap-1.5"
                            >
                                <Plus className="w-3.5 h-3.5" /> Adicionar Regra
                            </button>
                        </div>
                    </>
                )}

                {activeTab === "media" && (
                    <>
                        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 mb-4">
                            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                <ImageIcon className="w-4 h-4" />
                                <strong>Instruções com Mídia</strong>
                            </p>
                            <p className="text-[10px] text-blue-500 mt-1">Adicione fotos/vídeos de referência mostrando como deve ficar</p>
                        </div>

                        {/* Existing Media */}
                        <div className="space-y-3">
                            {question.mediaInstructions.map((media) => (
                                <div key={media.id} className="bg-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                                    <div className="aspect-video bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                                        {media.type === "image" ? (
                                            <ImageIcon className="w-10 h-10 text-zinc-300" />
                                        ) : (
                                            <Video className="w-10 h-10 text-zinc-300" />
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <input
                                            type="text"
                                            value={media.caption}
                                            onChange={(e) => {
                                                const updated = question!.mediaInstructions.map((m) =>
                                                    m.id === media.id ? { ...m, caption: e.target.value } : m
                                                );
                                                update({ mediaInstructions: updated });
                                            }}
                                            className="w-full text-xs text-zinc-600 dark:text-zinc-400 bg-transparent border-none focus:outline-none"
                                            placeholder="Legenda..."
                                        />
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-[10px] text-zinc-400 uppercase font-bold">
                                                {media.type === "image" ? "📸 Imagem" : "🎬 Vídeo"}
                                            </span>
                                            <button onClick={() => removeMedia(media.id)} className="text-zinc-300 hover:text-red-500">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Add Media Buttons */}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => addMedia("image")}
                                    className="py-4 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-xl text-xs font-medium text-blue-500 hover:text-blue-600 hover:border-blue-300 transition-all flex flex-col items-center gap-1"
                                >
                                    <ImageIcon className="w-5 h-5" />
                                    Foto Referência
                                </button>
                                <button
                                    onClick={() => addMedia("video")}
                                    className="py-4 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-xl text-xs font-medium text-blue-500 hover:text-blue-600 hover:border-blue-300 transition-all flex flex-col items-center gap-1"
                                >
                                    <Video className="w-5 h-5" />
                                    Vídeo Instrução
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
