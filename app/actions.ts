"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { triggerWebhook } from "@/services/n8n-webhook";
import { syncToGoogleSheets } from "@/services/google-sheets";
import { revalidatePath } from "next/cache";

// ─── Completar Checklist ───────────────────────────────────
export async function completeChecklist(
    entryId: string,
    score: number,
    templateTitle: string,
    orgName: string,
    userName: string
) {
    const supabase = await createServerSupabase();
    const now = new Date().toISOString();

    // 1. Atualizar a entry no banco
    const { error: entryError } = await supabase
        .from("checklists_entries")
        .update({
            status: "completed",
            score,
            completed_at: now,
        })
        .eq("id", entryId);

    if (entryError) throw new Error(entryError.message);

    // 2. Buscar user_id e org_id da entry
    const { data: entry } = await supabase
        .from("checklists_entries")
        .select("user_id, organization_id")
        .eq("id", entryId)
        .single();

    if (!entry) throw new Error("Entry não encontrada");

    // 3. Registrar log de gamificação
    const { error: gamError } = await supabase.from("gamification_logs").insert({
        user_id: entry.user_id,
        organization_id: entry.organization_id,
        checklist_entry_id: entryId,
        points: score,
        reason: `Checklist "${templateTitle}" concluído`,
    });

    if (gamError) throw new Error(gamError.message);

    // 4. Disparar Webhook n8n (onChecklistComplete)
    await triggerWebhook("onChecklistComplete", {
        entry_id: entryId,
        template_title: templateTitle,
        organization_name: orgName,
        user_name: userName,
        score,
        completed_at: now,
    });

    // 5. Espelhar para Google Sheets
    await syncToGoogleSheets({
        id: entryId,
        data: now,
        restaurante: orgName,
        usuario: userName,
        pontuacao: score,
        status: "completed",
    });

    revalidatePath("/dashboard");
    revalidatePath("/checklists");
    revalidatePath("/ranking");

    return { success: true, score };
}

// ─── Criar Entrada de Checklist ────────────────────────────
export async function createChecklistEntry(
    templateId: string,
    organizationId: string
) {
    const supabase = await createServerSupabase();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
        .from("checklists_entries")
        .insert({
            template_id: templateId,
            organization_id: organizationId,
            user_id: user.id,
            status: "in_progress",
            responses: {},
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
}

// ─── Criar Plano de Ação ──────────────────────────────────
export async function createActionPlan(
    checklistEntryId: string,
    title: string,
    description: string,
    aiSuggestion?: string
) {
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
        .from("action_plans")
        .insert({
            checklist_entry_id: checklistEntryId,
            title,
            description,
            ai_suggestion: aiSuggestion || null,
        })
        .select()
        .single();

    if (error) throw new Error(error.message);

    // Buscar dados acompanhantes para o webhook
    const { data: entry } = await supabase
        .from("checklists_entries")
        .select("organization_id, user_id")
        .eq("id", checklistEntryId)
        .single();

    if (entry) {
        const { data: org } = await supabase
            .from("organizations")
            .select("name")
            .eq("id", entry.organization_id)
            .single();

        const { data: user } = await supabase
            .from("users")
            .select("full_name")
            .eq("id", entry.user_id)
            .single();

        // Disparar webhook n8n (onActionPlanCreated)
        await triggerWebhook("onActionPlanCreated", {
            plan_id: data.id,
            title,
            description,
            ai_suggestion: aiSuggestion,
            organization_name: org?.name || "N/A",
            responsible_user: user?.full_name || "N/A",
        });
    }

    revalidatePath("/action-plans");

    return data;
}

// ─── Buscar Ranking Global ────────────────────────────────
export async function getGlobalRanking(limit = 20) {
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
        .from("users")
        .select("id, full_name, avatar_url, global_score")
        .order("global_score", { ascending: false })
        .limit(limit);

    if (error) throw new Error(error.message);
    return data;
}

// ─── Buscar Templates de Checklist da Org ──────────────────
export async function getChecklistTemplates(organizationId: string) {
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
        .from("checklists_templates")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
}

// ─── Buscar Dados do Dashboard ─────────────────────────────
export async function getDashboardData(organizationId: string) {
    const supabase = await createServerSupabase();

    // Entries dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: entries, error } = await supabase
        .from("checklists_entries")
        .select("id, status, score, completed_at, created_at, user_id")
        .eq("organization_id", organizationId)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    const totalEntries = entries?.length || 0;
    const completedEntries = entries?.filter((e) => e.status === "completed").length || 0;
    const avgScore =
        completedEntries > 0
            ? Math.round(
                (entries?.filter((e) => e.status === "completed").reduce((acc, e) => acc + e.score, 0) || 0) /
                completedEntries
            )
            : 0;

    // Agrupar por dia para o gráfico
    const dailyData: Record<string, { date: string; completed: number; total: number }> = {};
    entries?.forEach((entry) => {
        const date = entry.created_at.substring(0, 10);
        if (!dailyData[date]) {
            dailyData[date] = { date, completed: 0, total: 0 };
        }
        dailyData[date].total += 1;
        if (entry.status === "completed") {
            dailyData[date].completed += 1;
        }
    });

    return {
        totalEntries,
        completedEntries,
        completionRate: totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0,
        avgScore,
        chartData: Object.values(dailyData),
    };
}
