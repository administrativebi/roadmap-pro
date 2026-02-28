"use server";

import { createClient } from "@/lib/supabase/server";
import { updateActionPlanXPInNotion } from "@/services/notion";

export async function assignXPToActionPlan(planId: string, notionPageId: string, xp: number) {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    // Verificar se quem está logado é admin/owner (Regra de Permissão)
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
        
    if (!profile || (profile.role !== "admin" && profile.role !== "owner" && profile.role !== "manager")) {
        return { error: "Sem permissão" };
    }

    // 1. Atualizar no Supabase
    const { error } = await supabase
        .from("action_plans")
        .update({ awarded_xp: xp })
        .eq("id", planId);

    if (error) return { error: error.message };

    // 2. Criar log de gamificação para o usuário que resolveu
    // Primeiro buscamos de quem era o plano
    const { data: planData } = await supabase
        .from("action_plans")
        .select("assignee_id")
        .eq("id", planId)
        .single();

    if (planData && planData.assignee_id) {
        await supabase.from("activity_logs").insert({
            user_id: planData.assignee_id,
            action_type: "action_plan_resolved",
            description: "Resolvido plano de ação",
            xp_earned: xp
        });
        
        // Note: No seu schema o profile total_xp é atualizado via trigger ou deve ser atualizado manualmente aqui.
        // Assumindo que a trigger cuidará disso através da activity_logs ou gamification_logs
    }

    // 3. Atualizar no Notion
    if (notionPageId) {
        await updateActionPlanXPInNotion(notionPageId, xp);
    }

    return { success: true };
}
