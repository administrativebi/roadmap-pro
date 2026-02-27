"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    X, Copy, Search, Star, Clock,
    FileText, Layers, Check, Loader2, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
    ChecklistSection, ChecklistQuestion,
    SECTION_COLORS, SECTION_ICONS,
} from "@/types/checklist-builder";

interface TemplateManagerProps {
    onClose: () => void;
    onLoad?: (sections: ChecklistSection[], name: string) => void;
}

function generateId() {
    return `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function TemplateManager({ onClose, onLoad }: TemplateManagerProps) {
    const [search, setSearch] = useState("");
    const [templates, setTemplates] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [duplicatedId, setDuplicatedId] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        async function fetchTemplates() {
            setIsLoading(true);
            const { data, error } = await supabase
                .from("checklist_templates")
                .select(`
                    id,
                    title,
                    description,
                    icon,
                    version,
                    created_at,
                    sectors(name),
                    template_questions(id)
                `)
                .eq("is_active", true)
                .order("created_at", { ascending: false });

            if (data) {
                setTemplates(data.map((t: any) => ({
                    id: t.id,
                    name: t.title,
                    description: t.description || "",
                    icon: t.icon || "📋",
                    sector: t.sectors?.name || "Geral",
                    questionsCount: t.template_questions?.length || 0,
                    version: `v${t.version || 1}`,
                    lastUpdated: new Date(t.created_at).toLocaleDateString("pt-BR"),
                })));
            }
            setIsLoading(false);
        }
        fetchTemplates();
    }, [supabase]);

    const filtered = templates.filter((t) => {
        return t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.description.toLowerCase().includes(search.toLowerCase()) ||
            t.sector.toLowerCase().includes(search.toLowerCase());
    });

    const handleLoadTemplate = async (templateId: string) => {
        if (!onLoad) return;
        setLoadingId(templateId);

        try {
            const { data: tData } = await supabase
                .from("checklist_templates")
                .select("*")
                .eq("id", templateId)
                .single();

            const { data: qData } = await supabase
                .from("template_questions")
                .select("*")
                .eq("template_id", templateId)
                .order("order_index", { ascending: true });

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
                                color: sectionMeta.color || SECTION_COLORS[0],
                                icon: sectionMeta.icon || SECTION_ICONS[0],
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
                            mediaInstructions: Array.isArray(q.media_instructions) ? q.media_instructions : (q.instruction_media_url ? [{ type: 'image', url: q.instruction_media_url }] : []),
                            conditionalRules: q.conditional_rules || [],
                            properties: q.properties || [q.type],
                            optionItems: q.option_items || [],
                            order: q.order_index,
                        });
                    } catch (err) {
                        console.error("Erro ao processar questão:", err);
                    }
                }

                const loadedSections = Array.from(sectionMap.values()).sort((a, b) => a.order - b.order);
                onLoad(loadedSections, `${tData?.title || "Checklist"} (Cópia)`);
            }
        } catch (err) {
            console.error("Erro ao carregar template:", err);
        } finally {
            setDuplicatedId(templateId);
            setLoadingId(null);
            setTimeout(() => setDuplicatedId(null), 2000);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 lg:p-6"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="font-bold text-lg text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-orange-500" /> Templates Disponíveis
                        </h2>
                        <p className="text-xs text-zinc-400 mt-0.5">Carregue um template existente como base para o seu checklist</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar template..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                </div>

                {/* Template List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
                            <Loader2 className="w-6 h-6 animate-spin mb-2 text-orange-500" />
                            <p className="text-sm">Carregando templates...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center p-12 text-zinc-500 text-sm">
                            Nenhum template encontrado.
                        </div>
                    ) : (
                        filtered.map((template) => (
                            <div
                                key={template.id}
                                className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 border border-zinc-100 dark:border-zinc-700 hover:border-orange-200 dark:hover:border-orange-800 transition-all"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                                        {template.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">{template.name}</h4>
                                            <span className="text-[10px] text-zinc-400 font-mono">{template.version}</span>
                                        </div>
                                        <p className="text-xs text-zinc-500 mb-2">{template.description}</p>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="text-[10px] px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full font-bold">
                                                {template.sector}
                                            </span>
                                            <span className="text-[10px] text-zinc-400">
                                                <FileText className="w-3 h-3 inline" /> {template.questionsCount} perguntas
                                            </span>
                                            <span className="text-[10px] text-zinc-400">
                                                <Clock className="w-3 h-3 inline" /> {template.lastUpdated}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleLoadTemplate(template.id)}
                                        disabled={loadingId === template.id}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0",
                                            duplicatedId === template.id
                                                ? "bg-emerald-500 text-white"
                                                : "bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900"
                                        )}
                                    >
                                        {loadingId === template.id ? (
                                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando...</>
                                        ) : duplicatedId === template.id ? (
                                            <><Check className="w-3.5 h-3.5" /> Carregado!</>
                                        ) : (
                                            <><Download className="w-3.5 h-3.5" /> Usar Template</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
