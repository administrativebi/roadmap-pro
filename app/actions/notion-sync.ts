"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { getActionPlansFromNotion, getNotionClient, syncUserToNotion } from "@/services/notion";

export async function syncActionPlansFromNotionAction() {
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) return { error: "Não autenticado" };

    // 1. Garantir que o usuário logado existe no Notion e temos o ID dele
    let { data: userData } = await supabase
        .from('profiles')
        .select('id, name, notion_page_id')
        .eq('id', user.id)
        .single();

    if (!userData) return { error: "Perfil não encontrado" };

    if (!userData.notion_page_id) {
        const notionId = await syncUserToNotion({ id: userData.id, name: userData.name || 'Sem Nome', is_active: true });
        if (notionId) {
            await supabase.from('profiles').update({ notion_page_id: notionId }).eq('id', user.id);
            userData.notion_page_id = notionId;
        } else {
            return { error: "Falha ao parear usuário com Notion" };
        }
    }

    // 2. Buscar no Notion os planos atribuídos a este usuário
    const notionPlans = await getActionPlansFromNotion(userData.notion_page_id);

    // 3. Salvar ou Atualizar no Supabase
    for (const page of notionPlans) {
        // @ts-ignore
        const props = page.properties;
        
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
        
        // Se o plano veio do Notion, precisamos tentar achar o Sector ID no Supabase
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

        const planData: any = {
            title,
            description: benefit, 
            benefit,
            step_by_step: stepByStep,
            due_date: dueDate,
            cost_type: costType,
            awarded_xp: awardedXp,
            status,
            assignee_id: userData.id,
            sector_id: sectorId,
            notion_page_id: page.id,
        };

        // Preservar evidências se já existirem e o status não mudou para in_progress via retorno
        const photoUrl = props["Foto"]?.url;
        const fileUrl = props["Arquivo"]?.url;
        const comment = props["Comentário de Finalização"]?.rich_text?.[0]?.plain_text;
        const satisfaction = props["Satisfação"]?.number;

        if (photoUrl) planData.photo_url = photoUrl;
        if (fileUrl) planData.file_url = fileUrl;
        if (comment) planData.closing_comment = comment;
        if (satisfaction) planData.satisfaction_rating = satisfaction;

        if (supabaseId) {
            await supabase.from('action_plans').update(planData).eq('id', supabaseId);
        } else {
            const { data: newPlan } = await supabase
                .from('action_plans')
                .insert(planData)
                .select('id')
                .single();
                
            if (newPlan) {
                const notion = getNotionClient();
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
