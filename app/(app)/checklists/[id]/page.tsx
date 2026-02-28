"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { GamifiedChecklist } from "@/components/shared/GamifiedChecklist";
import { ChecklistTemplate, QuestionResponse } from "@/types";

export default function ChecklistExecutionPage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const templateId = params.id as string;

    const [template, setTemplate] = useState<ChecklistTemplate | null>(null);
    const [executionId, setExecutionId] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
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

                // Fetch questions
                const { data: qData, error: qError } = await supabase
                    .from('template_questions')
                    .select('*')
                    .eq('template_id', templateId)
                    .order('order_index');

                if (qError) throw qError;

                const parsedQuestions = (qData || []).map((q: any) => {
                    let parsedSection: any = { id: "default", title: "Geral", order: 0 };
                    try {
                        if (q.section) {
                            const raw = typeof q.section === 'string' ? JSON.parse(q.section) : q.section;
                            if (typeof raw === 'object' && raw !== null) {
                                parsedSection = {
                                    id: raw.id || String(raw.title || "unknown"),
                                    title: raw.title || "Seção",
                                    icon: raw.icon,
                                    color: raw.color,
                                    order: raw.order ?? 0,
                                };
                            }
                        }
                    } catch (e) {
                        parsedSection = { id: String(q.section), title: String(q.section), order: 0 };
                    }

                    return {
                        ...q,
                        parsedSection,
                        properties: q.properties || [q.type],
                        option_items: q.option_items || [],
                        conditional_rules: q.conditional_rules || [],
                        media_instructions: q.media_instructions || []
                    };
                });

                const fullTemplate: ChecklistTemplate = {
                    ...tplData,
                    questions: parsedQuestions,
                };
                
                setTemplate(fullTemplate);

                // Existing execution check (Resume flow)
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

        if (templateId) {
            loadTemplateAndStart();
        }
    }, [templateId, supabase, router]);

    const handleComplete = async (responses: QuestionResponse[], score: number, signature?: string) => {
        if (!executionId || !userId || !template) return;

        try {
            // Salvar respostas na tabela intermediária (se quiser manter histórico detalhado)
            const responsesArray = responses.map(r => ({
                checklist_id: executionId,
                question_id: r.question_id,
                answer_value: typeof r.value === 'object' ? JSON.stringify(r.value) : String(r.value),
                photo_url: r.photo_urls?.[0] || null, // Simplified media fallback
                has_issue: false // Action plans are now handled natively inside the component
            }));

            if (responsesArray.length > 0) {
                await supabase.from('checklist_responses').upsert(
                    responsesArray,
                    { onConflict: 'checklist_id,question_id', ignoreDuplicates: false }
                );
            }

            // Atualizar status final do checklist
            await supabase.from('checklists').update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                score: Math.round(score),
                // signature_url could go here if your DB supports it
            }).eq('id', executionId);

            // Redireciona
            const xpEarned = Math.round(score * 0.5);
            router.push(`/checklists/sucesso?score=${Math.round(score)}&earned=${score}&total=100&xp=${xpEarned}&title=${encodeURIComponent(template.title)}`);

        } catch (err: any) {
            console.error("Erro completo ao salvar:", err);
            alert(`Erro ao salvar: ${err.message || 'Desconhecido'}`);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Preparando ambiente...</p>
            </div>
        );
    }

    if (!template) {
        return <div className="p-8 text-center text-zinc-500">Checklist não encontrado.</div>;
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8 px-4">
            <GamifiedChecklist 
                template={template} 
                onComplete={handleComplete} 
            />
        </div>
    );
}
