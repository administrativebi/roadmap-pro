// Serviço de integração com n8n via Webhooks

const N8N_BASE_URL = process.env.N8N_WEBHOOK_BASE_URL || "";

export type WebhookEvent = "onChecklistComplete" | "onActionPlanCreated";

interface ChecklistCompletePayload {
    entry_id: string;
    template_title: string;
    organization_name: string;
    user_name: string;
    score: number;
    completed_at: string;
}

interface ActionPlanPayload {
    plan_id: string;
    title: string;
    description: string;
    ai_suggestion?: string;
    organization_name: string;
    responsible_user: string;
}

export async function triggerWebhook(
    event: WebhookEvent,
    payload: ChecklistCompletePayload | ActionPlanPayload
) {
    const webhookUrls: Record<WebhookEvent, string> = {
        onChecklistComplete: `${N8N_BASE_URL}/checklist-complete`,
        onActionPlanCreated: `${N8N_BASE_URL}/action-plan-created`,
    };

    try {
        const response = await fetch(webhookUrls[event], {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                event,
                timestamp: new Date().toISOString(),
                data: payload,
            }),
        });

        if (!response.ok) {
            console.error(`[n8n Webhook] Falha ao disparar ${event}:`, response.statusText);
        }

        return response.ok;
    } catch (error) {
        console.error(`[n8n Webhook] Erro ao disparar ${event}:`, error);
        return false;
    }
}
