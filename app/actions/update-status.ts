"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { updateActionPlanStatusInNotion } from "@/services/notion";

export async function updateActionPlanStatusAction(planId: string, status: "pending" | "in_progress" | "resolved" | "canceled", notionPageId?: string) {
    const supabase = await createServerSupabase();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const { error } = await supabase
        .from('action_plans')
        .update({
            status,
            resolved_at: status === 'resolved' ? new Date().toISOString() : null
        })
        .eq('id', planId);

    if (error) return { error: error.message };

    if (notionPageId) {
        try {
            await updateActionPlanStatusInNotion(notionPageId, status);
        } catch (notionError) {
            console.error("Falha ao atualizar status no Notion:", notionError);
        }
    }

    return { success: true };
}
