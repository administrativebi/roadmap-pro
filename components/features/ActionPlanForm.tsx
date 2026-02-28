"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createActionPlanInNotion } from "@/services/notion";

interface ActionPlanFormProps {
    onClose: () => void;
    onSuccess: () => void;
    checklistResponseId?: string; // Opcional, usado quando gerado dentro de um checklist
    initialTitle?: string;
}

interface UserProfile {
    id: string;
    name: string;
    notion_page_id?: string;
}

interface SectorInfo {
    id: string;
    name: string;
    notion_page_id?: string;
}

export function ActionPlanForm({ onClose, onSuccess, checklistResponseId, initialTitle }: ActionPlanFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [sectors, setSectors] = useState<SectorInfo[]>([]);
    const supabase = createClient();

    const [formData, setFormData] = useState({
        title: initialTitle || "",
        benefit: "",
        step_by_step: "",
        assignee_id: "",
        sector_id: "",
        due_date: "",
        cost_type: "apenas_tempo",
        estimated_cost: ""
    });

    useEffect(() => {
        async function fetchAuxData() {
            const [{ data: profs }, { data: sects }] = await Promise.all([
                supabase.from('profiles').select('id, name, notion_page_id'),
                supabase.from('sectors').select('id, name, notion_page_id')
            ]);
            if (profs) setProfiles(profs);
            if (sects) setSectors(sects);
        }
        fetchAuxData();
    }, [supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. Inserir no Supabase
            const { data: newPlan, error } = await supabase
                .from('action_plans')
                .insert({
                    title: formData.title,
                    benefit: formData.benefit,
                    step_by_step: formData.step_by_step,
                    assignee_id: formData.assignee_id || null,
                    sector_id: formData.sector_id || null,
                    due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
                    cost_type: formData.cost_type,
                    estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
                    checklist_response_id: checklistResponseId || null,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;

            // 2. Chamar a Action do Servidor para empurrar pro Notion (para evitar expor a API Key no client)
            await fetch('/api/actions/push-notion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planData: {
                        id: newPlan.id,
                        title: formData.title,
                        benefit: formData.benefit,
                        step_by_step: formData.step_by_step,
                        cost_type: formData.cost_type,
                        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
                        assignee_notion_id: profiles.find(p => p.id === formData.assignee_id)?.notion_page_id || null,
                        sector_notion_id: sectors.find(s => s.id === formData.sector_id)?.notion_page_id || null,
                        assignee_id: formData.assignee_id || null,
                        sector_id: formData.sector_id || null,
                        checklist_response_id: checklistResponseId
                    }
                })
            });

            onSuccess();
        } catch (err) {
            console.error(err);
            alert("Erro ao criar plano de ação.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-950 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Novo Plano de Ação</h2>
                        <p className="text-xs text-zinc-500 mt-1">Preencha o 5W2H para resolver a não-conformidade.</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                        <X className="w-5 h-5 text-zinc-500" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <form id="action-plan-form" onSubmit={handleSubmit} className="space-y-5">
                        
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">1. Qual é a tarefa ou problema? *</label>
                            <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none" placeholder="Ex: Consertar vedação da geladeira 02" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">2. Qual o benefício de solucionar?</label>
                            <textarea value={formData.benefit} onChange={e => setFormData({...formData, benefit: e.target.value})} rows={2} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none" placeholder="Ex: Evitar perda de alimentos e desperdício de energia" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">3. Quem vai fazer?</label>
                                <select value={formData.assignee_id} onChange={e => setFormData({...formData, assignee_id: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none">
                                    <option value="">Selecione um responsável...</option>
                                    {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">4. Em que setor?</label>
                                <select value={formData.sector_id} onChange={e => setFormData({...formData, sector_id: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none">
                                    <option value="">Selecione o setor...</option>
                                    {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">5. Qual o prazo final?</label>
                                <input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">6. Custos envolvidos?</label>
                                <select value={formData.cost_type} onChange={e => setFormData({...formData, cost_type: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none">
                                    <option value="apenas_tempo">Apenas Tempo / Esforço</option>
                                    <option value="dinheiro">Requer Dinheiro / Investimento</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">7. Qual o passo a passo básico?</label>
                            <textarea value={formData.step_by_step} onChange={e => setFormData({...formData, step_by_step: e.target.value})} rows={3} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none" placeholder="1. Ligar para o técnico&#10;2. Esvaziar a geladeira..." />
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-5 py-3 rounded-xl font-bold text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-sm">
                        Cancelar
                    </button>
                    <button form="action-plan-form" type="submit" disabled={isLoading} className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:scale-105 transition-all disabled:opacity-50 text-sm">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Criar Plano
                    </button>
                </div>
            </div>
        </div>
    );
}
