"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Weight, Zap, Image as ImageIcon, Video, Plus,
    Trash2, MessageSquare, Star, ToggleLeft, ChevronDown,
    Upload, AlertCircle, Bell, GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    ChecklistSection, ChecklistQuestion, QuestionType, QuestionProperty,
    QUESTION_TYPE_CONFIG, ConditionalRule, MediaInstruction,
    ComparisonOperator, COMPARISON_OPERATORS, OptionItem,
} from "@/types/checklist-builder";
import { createClient } from "@/lib/supabase/client";

interface QuestionEditorProps {
    sections: ChecklistSection[];
    questionId: string;
    onUpdate: (sectionId: string, questionId: string, updates: Partial<ChecklistQuestion>) => void;
    onClose: () => void;
}

function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function QuestionEditor({ sections, questionId, onUpdate, onClose }: QuestionEditorProps) {
    const [activeTab, setActiveTab] = useState<"general" | "conditional" | "media">("general");
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    // Find the question and its section
    let question: ChecklistQuestion | undefined;
    let sectionId = "";
    for (const s of sections) {
        const q = s.questions.find((q) => q.id === questionId);
        if (q) { question = q; sectionId = s.id; break; }
    }

    if (!question) return null;

    // Ensure properties array exists (backward compatibility)
    const properties = question.properties || [question.type];

    const update = (updates: Partial<ChecklistQuestion>) => onUpdate(sectionId, questionId, updates);

    // --- Property toggle (allows multiple) ---
    const toggleProperty = (prop: QuestionProperty) => {
        const current = [...properties];
        const idx = current.indexOf(prop);
        if (idx >= 0) {
            if (current.length <= 1) return; // must have at least 1
            current.splice(idx, 1);
        } else {
            current.push(prop);
        }
        // Set primary type as the first non-photo property, or first property
        const primaryType = current.find(p => p !== "photo") || current[0];
        update({ properties: current, type: primaryType });
    };

    // --- Conditional Rules ---
    const addConditionalRule = (parentRules?: ConditionalRule[], parentRuleId?: string) => {
        const rule: ConditionalRule = {
            id: generateId(),
            operator: "equals",
            compareValue: "",
            triggerAnswer: "no",
            action: "show_questions",
            targetQuestionIds: [],
            nestedRules: [],
        };

        if (parentRuleId) {
            // Add nested rule
            const addNested = (rules: ConditionalRule[]): ConditionalRule[] => {
                return rules.map(r => {
                    if (r.id === parentRuleId) {
                        return { ...r, nestedRules: [...(r.nestedRules || []), rule] };
                    }
                    if (r.nestedRules?.length) {
                        return { ...r, nestedRules: addNested(r.nestedRules) };
                    }
                    return r;
                });
            };
            update({ conditionalRules: addNested(question!.conditionalRules) });
        } else {
            update({ conditionalRules: [...question!.conditionalRules, rule] });
        }
    };

    const removeConditionalRule = (ruleId: string) => {
        const removeFromList = (rules: ConditionalRule[]): ConditionalRule[] => {
            return rules
                .filter(r => r.id !== ruleId)
                .map(r => ({
                    ...r,
                    nestedRules: r.nestedRules ? removeFromList(r.nestedRules) : [],
                }));
        };
        update({ conditionalRules: removeFromList(question!.conditionalRules) });
    };

    const updateConditionalRule = (ruleId: string, updates: Partial<ConditionalRule>) => {
        const updateInList = (rules: ConditionalRule[]): ConditionalRule[] => {
            return rules.map(r => {
                if (r.id === ruleId) return { ...r, ...updates };
                if (r.nestedRules?.length) return { ...r, nestedRules: updateInList(r.nestedRules) };
                return r;
            });
        };
        update({ conditionalRules: updateInList(question!.conditionalRules) });
    };

    // --- Media upload ---
    const handleFileUpload = async (file: File, type: "image" | "video") => {
        setIsUploading(true);
        try {
            const ext = file.name.split('.').pop();
            const fileName = `checklist-media/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('public')
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (uploadError) {
                // Fallback: use local URL
                const localUrl = URL.createObjectURL(file);
                const media: MediaInstruction = {
                    id: generateId(),
                    type,
                    url: localUrl,
                    caption: type === "image" ? "Foto de referência" : "Vídeo de execução",
                };
                update({ mediaInstructions: [...question!.mediaInstructions, media] });
                return;
            }

            const { data: { publicUrl } } = supabase.storage.from('public').getPublicUrl(fileName);

            const media: MediaInstruction = {
                id: generateId(),
                type,
                url: publicUrl,
                caption: type === "image" ? "Foto de referência" : "Vídeo de execução",
            };
            update({ mediaInstructions: [...question!.mediaInstructions, media] });
        } catch (err) {
            console.error("Erro no upload:", err);
            alert("Erro ao enviar arquivo. Tente novamente.");
        } finally {
            setIsUploading(false);
        }
    };

    const removeMedia = (mediaId: string) => {
        update({ mediaInstructions: question!.mediaInstructions.filter((m) => m.id !== mediaId) });
    };

    // --- Options with score ---
    const addOptionWithScore = () => {
        const items = question!.optionItems || [];
        update({
            optionItems: [...items, { label: `Opção ${items.length + 1}`, score: 0 }],
            options: [...(question!.options || []), `Opção ${items.length + 1}`],
        });
    };

    const updateOptionItem = (idx: number, updates: Partial<OptionItem>) => {
        const items = [...(question!.optionItems || [])];
        items[idx] = { ...items[idx], ...updates };
        // Also sync labels to legacy options
        update({
            optionItems: items,
            options: items.map(i => i.label),
        });
    };

    const removeOptionItem = (idx: number) => {
        const items = (question!.optionItems || []).filter((_, i) => i !== idx);
        update({
            optionItems: items,
            options: items.map(i => i.label),
        });
    };

    // --- Render conditional rule (recursive) ---
    const renderRule = (rule: ConditionalRule, depth: number = 0) => {
        const allQuestions = sections.flatMap(s => s.questions).filter(q => q.id !== questionId);

        // Get answer options based on question type
        const getAnswerOptions = () => {
            const type = question!.type;
            if (type === "yes_no") return [
                { value: "yes", label: "Sim / Conforme" },
                { value: "no", label: "Não / Não Conforme" },
                { value: "na", label: "N/A" },
            ];
            if (type === "rating") return [
                { value: "1", label: "1 estrela" }, { value: "2", label: "2 estrelas" },
                { value: "3", label: "3 estrelas" }, { value: "4", label: "4 estrelas" },
                { value: "5", label: "5 estrelas" },
            ];
            if (type === "options") return (question!.optionItems || []).map(o => ({ value: o.label, label: o.label }));
            return [];
        };

        const showCompareValue = !["yes_no"].includes(question!.type);

        return (
            <div key={rule.id} className={cn("rounded-xl p-3 border", depth > 0 ? "bg-violet-50/50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800 ml-3 mt-2" : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800")}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                        {depth > 0 && <GitBranch className="w-3 h-3 text-violet-400" />}
                        {depth > 0 ? "E também..." : "Regra Condicional"}
                    </span>
                    <button onClick={() => removeConditionalRule(rule.id)} className="text-zinc-300 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="space-y-2">
                    {/* Operator + Compare */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-zinc-500 shrink-0">Se resposta</span>
                        <select
                            value={rule.operator || "equals"}
                            onChange={(e) => updateConditionalRule(rule.id, { operator: e.target.value as ComparisonOperator })}
                            className="px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs min-w-0"
                        >
                            {Object.entries(COMPARISON_OPERATORS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>

                        {/* Compare Value */}
                        {question!.type === "yes_no" || question!.type === "rating" || question!.type === "options" ? (
                            <select
                                value={rule.compareValue || rule.triggerAnswer}
                                onChange={(e) => updateConditionalRule(rule.id, { compareValue: e.target.value, triggerAnswer: e.target.value })}
                                className="flex-1 px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs min-w-0"
                            >
                                {getAnswerOptions().map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type={question!.type === "number" ? "number" : "text"}
                                value={rule.compareValue || ""}
                                onChange={(e) => updateConditionalRule(rule.id, { compareValue: e.target.value })}
                                placeholder="Valor..."
                                className="flex-1 px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs min-w-0"
                            />
                        )}
                    </div>

                    {/* Action */}
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
                            <option value="notify_supervisor">🔔 Comunicar ao superior</option>
                        </select>
                    </div>

                    {/* Target Questions (for show_questions) */}
                    {rule.action === "show_questions" && allQuestions.length > 0 && (
                        <div className="mt-1">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase">Perguntas alvo:</span>
                            <div className="max-h-24 overflow-y-auto mt-1 space-y-1">
                                {allQuestions.slice(0, 10).map(q => (
                                    <label key={q.id} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={rule.targetQuestionIds.includes(q.id)}
                                            onChange={(e) => {
                                                const ids = e.target.checked
                                                    ? [...rule.targetQuestionIds, q.id]
                                                    : rule.targetQuestionIds.filter(id => id !== q.id);
                                                updateConditionalRule(rule.id, { targetQuestionIds: ids });
                                            }}
                                            className="rounded"
                                        />
                                        <span className="truncate">{q.text || "Sem texto"}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Nested rules */}
                {(rule.nestedRules || []).map(nested => renderRule(nested, depth + 1))}

                {/* Add nested condition */}
                <button
                    onClick={() => addConditionalRule(undefined, rule.id)}
                    className="mt-2 w-full py-1.5 border border-dashed border-violet-300 dark:border-violet-700 rounded-lg text-[10px] font-medium text-violet-500 hover:text-violet-600 hover:border-violet-400 transition-all flex items-center justify-center gap-1"
                >
                    <GitBranch className="w-3 h-3" /> Adicionar condição aninhada (E)
                </button>
            </div>
        );
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

                        {/* Properties - Multi-select */}
                        <div>
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                                Propriedades da Pergunta
                            </label>
                            <p className="text-[10px] text-zinc-400 mb-2">Selecione uma ou mais propriedades. Ex: Sim/Não + Foto</p>
                            <div className="grid grid-cols-2 gap-2">
                                {(Object.entries(QUESTION_TYPE_CONFIG) as [QuestionType, typeof QUESTION_TYPE_CONFIG[QuestionType]][]).map(([key, config]) => {
                                    const isSelected = properties.includes(key as QuestionProperty);
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => toggleProperty(key as QuestionProperty)}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-left border-2 transition-all relative",
                                                isSelected
                                                    ? "border-orange-400 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300"
                                                    : "border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-200"
                                            )}
                                        >
                                            <span className="text-base">{config.icon}</span>
                                            <span className="flex-1">{config.label}</span>
                                            {isSelected && (
                                                <span className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                                                    <span className="text-white text-[8px] font-black">✓</span>
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            {properties.length > 1 && (
                                <p className="text-[10px] text-orange-500 mt-2 font-medium">
                                    ✨ {properties.length} propriedades selecionadas — o usuário responderá com todas
                                </p>
                            )}
                        </div>

                        {/* Options with Score (for multiple choice) */}
                        {(properties.includes("options") || properties.includes("multiple_selection")) && (
                            <div>
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1.5 flex items-center gap-2">
                                    Opções com Pontuação
                                    {properties.includes("multiple_selection") && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md font-black">MÚLTIPLA SELEÇÃO ONDE É POSSÍVEL ESCOLHER MAIS DE UMA PONTUAÇÃO</span>}
                                </label>
                                <p className="text-[10px] text-zinc-400 mb-2">Defina a pontuação individual de cada opção</p>
                                <div className="space-y-2">
                                    {(question.optionItems || []).map((opt, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-600 shrink-0 flex items-center justify-center text-[9px] font-bold text-zinc-400">
                                                {i + 1}
                                            </span>
                                            <input
                                                type="text"
                                                value={opt.label}
                                                onChange={(e) => updateOptionItem(i, { label: e.target.value })}
                                                className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                placeholder={`Opção ${i + 1}`}
                                            />
                                            <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 px-2 py-1">
                                                <Star className="w-3 h-3 text-amber-500" />
                                                <input
                                                    type="number"
                                                    value={opt.score}
                                                    onChange={(e) => updateOptionItem(i, { score: parseInt(e.target.value) || 0 })}
                                                    className="w-12 text-xs text-center bg-transparent border-none focus:outline-none font-bold text-amber-700 dark:text-amber-300"
                                                    placeholder="pts"
                                                />
                                            </div>
                                            <button onClick={() => removeOptionItem(i)} className="text-zinc-300 hover:text-red-500">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={addOptionWithScore}
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
                                <strong>Lógica Condicional Avançada</strong>
                            </p>
                            <p className="text-[10px] text-violet-500 mt-1">
                                Defina regras com operadores de comparação e aninhe condições para lógica complexa
                            </p>
                        </div>

                        <div className="space-y-3">
                            {question.conditionalRules.map((rule) => renderRule(rule))}

                            <button
                                onClick={() => addConditionalRule()}
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
                            <p className="text-[10px] text-blue-500 mt-1">
                                Adicione fotos de referência ou vídeos de execução para guiar a inspeção. O upload é feito aqui no momento da criação do checklist.
                            </p>
                        </div>

                        {/* Hidden file inputs */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file, "image");
                                e.target.value = "";
                            }}
                        />
                        <input
                            ref={videoInputRef}
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file, "video");
                                e.target.value = "";
                            }}
                        />

                        {isUploading && (
                            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs text-blue-600 font-medium">Enviando arquivo...</span>
                            </div>
                        )}

                        {/* Existing Media */}
                        <div className="space-y-3">
                            {question.mediaInstructions.map((media) => (
                                <div key={media.id} className="bg-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                                    <div className="aspect-video bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                                        {media.type === "image" && media.url && !media.url.includes("placeholder") ? (
                                            <img src={media.url} alt={media.caption} className="w-full h-full object-cover" />
                                        ) : media.type === "video" && media.url && media.url !== "#" ? (
                                            <video src={media.url} controls className="w-full h-full object-cover" />
                                        ) : media.type === "image" ? (
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
                                                {media.type === "image" ? "📸 Foto de Referência" : "🎬 Vídeo de Execução"}
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
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="py-4 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-xl text-xs font-medium text-blue-500 hover:text-blue-600 hover:border-blue-300 transition-all flex flex-col items-center gap-1 disabled:opacity-50"
                                >
                                    <Upload className="w-5 h-5" />
                                    Foto Referência
                                    <span className="text-[9px] text-zinc-400">Clique para enviar</span>
                                </button>
                                <button
                                    onClick={() => videoInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="py-4 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-xl text-xs font-medium text-blue-500 hover:text-blue-600 hover:border-blue-300 transition-all flex flex-col items-center gap-1 disabled:opacity-50"
                                >
                                    <Video className="w-5 h-5" />
                                    Vídeo Execução
                                    <span className="text-[9px] text-zinc-400">Clique para enviar</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
