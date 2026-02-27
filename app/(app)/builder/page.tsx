"use client";

import { useState } from "react";
import { ChecklistBuilder } from "@/components/builder/ChecklistBuilder";
import { Hammer, Plus, Edit2, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function BuilderPage() {
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
    const [isBuilding, setIsBuilding] = useState(false);

    const [templates, setTemplates] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchTemplates() {
            setIsLoading(true);
            const { data, error } = await supabase
                .from("checklist_templates")
                .select(`
                    id,
                    title,
                    created_at,
                    template_questions (id)
                `)
                .order("created_at", { ascending: false });

            if (data) {
                setTemplates(data.map((t: any) => ({
                    id: t.id,
                    name: t.title,
                    questions: t.template_questions?.length || 0,
                    lastEdit: new Date(t.created_at).toLocaleDateString("pt-BR")
                })));
            }
            setIsLoading(false);
        }

        if (!isBuilding) {
            fetchTemplates();
        }
    }, [isBuilding, supabase]);

    const handleCreateNew = () => {
        setEditingTemplateId(null);
        setIsBuilding(true);
    };

    const handleEdit = (id: string) => {
        setEditingTemplateId(id);
        setIsBuilding(true);
    };

    const deleteTemplate = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este checklist?")) return;

        await supabase.from("checklist_templates").delete().eq("id", id);
        setTemplates(templates.filter(t => t.id !== id));
    };

    if (isBuilding) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6">
                <button
                    onClick={() => setIsBuilding(false)}
                    className="mb-4 flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Voltar para lista
                </button>
                <ChecklistBuilder templateId={editingTemplateId} onSave={() => setIsBuilding(false)} />
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
                        <Hammer className="w-8 h-8 text-orange-500" />
                        Construtor de Checklists
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        Gerencie seus modelos, crie novos questionários ou edite os existentes.
                    </p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                >
                    <Plus className="w-5 h-5" /> Novo Checklist
                </button>
            </div>

            <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                            <tr>
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider w-full">Nome do Checklist</th>
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Perguntas</th>
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Última Edição</th>
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {templates.map(tpl => (
                                <tr key={tpl.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors group">
                                    <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-50">{tpl.name}</td>
                                    <td className="px-6 py-4 text-zinc-500">
                                        <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md text-xs font-bold">{tpl.questions}</span>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500">{tpl.lastEdit}</td>
                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => handleEdit(tpl.id)}
                                            className="p-2 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteTemplate(tpl.id)}
                                            className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {isLoading && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
                                        Carregando templates...
                                    </td>
                                </tr>
                            )}
                            {!isLoading && templates.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                                        Nenhum checklist cadastrado. Crie o primeiro!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}
