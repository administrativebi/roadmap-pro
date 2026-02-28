"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { getActionPlansFromNotion, getNotionClient } from "@/services/notion";

export async function syncActionPlansFromNotionAction() {
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) return { error: "Não autenticado" };

    // Buscar o usuário no banco de dados para pegar o ID dele no Notion
    const { data: userData } = await supabase
        .from('profiles')
        .select('id, notion_page_id')
        .eq('id', user.id)
        .single();

    if (!userData || !userData.notion_page_id) {
        return { error: "Usuário não possui mapeamento no Notion" };
    }

    // Buscar no Notion os planos atribuídos a este usuário
    const notionPlans = await getActionPlansFromNotion(userData.notion_page_id);

    // Salvar ou Atualizar no Supabase
    for (const page of notionPlans) {
        // @ts-ignore - The Notion API types are complex, bypassing for property extraction
        const props = page.properties;
        
        // Extração das propriedades 5W2H do Notion
        const title = props["Tarefa ou Problema"]?.title?.[0]?.plain_text || "Sem título";
        const benefit = props["Qual o benefício de solucionar?"]?.rich_text?.[0]?.plain_text || "";
        const stepByStep = props["Qual o passo a passo básico?"]?.rich_text?.[0]?.plain_text || "";
        const dueDate = props["Qual o prazo final?"]?.date?.start || null;
        
        const costTypeRaw = props["Vai custar dinheiro ou só tempo?"]?.select?.name;
        const costType = costTypeRaw === "Dinheiro" ? "dinheiro" : "apenas_tempo";

        const awardedXp = props["XP Concedido"]?.number || null;
        
        const statusRaw = props["Status"]?.select?.name;
        let status = "pending";
        if (statusRaw === "Em andamento") status = "in_progress";
        if (statusRaw === "Resolvido") status = "resolved";
        if (statusRaw === "Cancelado") status = "canceled";

        const supabaseId = props["Supabase_ID"]?.rich_text?.[0]?.plain_text;
        const checklistIdRaw = props["Checklist_ID"]?.rich_text?.[0]?.plain_text;
        // UUID check for checklist_id
        const checklistId = (checklistIdRaw && checklistIdRaw.length > 30) ? checklistIdRaw : null;

        // Buscar Sector ID no Supabase através do ID do Notion (Relação)
        const sectorNotionId = props["Em que setor?"]?.relation?.[0]?.id;
        let sectorId = null;
        if (sectorNotionId) {
            const { data: sectorData } = await supabase
                .from('sectors')
                .select('id')
                .eq('notion_page_id', sectorNotionId)
                .single();
            if (sectorData) sectorId = sectorData.id;
        }

        const planData = {
            title,
            description: benefit, // Usamos benefit no lugar de description antiga
            benefit,
            step_by_step: stepByStep,
            due_date: dueDate,
            cost_type: costType,
            awarded_xp: awardedXp,
            status,
            assignee_id: userData.id,
            sector_id: sectorId,
            notion_page_id: page.id,
            checklist_entry_id: checklistId
        };

        if (supabaseId) {
            // Atualiza registro existente
            await supabase.from('action_plans').update(planData).eq('id', supabaseId);
        } else {
            // É um registro novo (criado direto no Notion)
            const { data: newPlan } = await supabase
                .from('action_plans')
                .insert(planData)
                .select('id')
                .single();
                
            // Retorna o ID gerado pelo Supabase lá pro Notion
            if (newPlan) {
                await notion.pages.update({
                    page_id: page.id,
                    properties: {
                        "Supabase_ID": {
                            rich_text: [{ text: { content: newPlan.id } }]
                        }
                    }
                });
            }
        }
    }

    return { success: true };
}
