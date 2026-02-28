"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { updateActionPlanStatusInNotion } from "@/services/notion";

export async function updateActionPlanStatusAction(
    planId: string, 
    status: "pending" | "in_progress" | "resolved" | "canceled", 
    notionPageId?: string,
    extraData?: any
) {
    const supabase = await createServerSupabase();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const updatePayload: any = {
        status,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null
    };

    if (extraData?.photo_url) updatePayload.photo_url = extraData.photo_url;
    if (extraData?.file_url) updatePayload.file_url = extraData.file_url;
    if (extraData?.closing_comment) updatePayload.closing_comment = extraData.closing_comment;
    if (extraData?.satisfaction_rating) updatePayload.satisfaction_rating = extraData.satisfaction_rating;

    // Se estiver devolvendo o plano, vamos limpar os campos de resolução
    if (status === 'in_progress' && extraData?.is_returning) {
        updatePayload.closing_comment = null;
        updatePayload.satisfaction_rating = null;
    }

    const { error } = await supabase
        .from('action_plans')
        .update(updatePayload)
        .eq('id', planId);

    if (error) return { error: error.message };

    if (notionPageId) {
        try {
            await updateActionPlanStatusInNotion(notionPageId, status, extraData);
        } catch (notionError) {
            console.error("Falha ao atualizar status no Notion:", notionError);
        }
    }

    return { success: true };
}
