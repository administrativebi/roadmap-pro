import { Client } from "@notionhq/client";

// IDs dos Bancos de Dados criados na sua conta
export const NOTION_DATABASES = {
    SECTORS: "315ad933-b441-8146-acd9-decf7303d529",
    USERS: "315ad933-b441-8191-8371-c4b79dfda69b",
    ACTION_PLANS: "315ad933-b441-8171-97a6-c913beb098be",
};

// Singleton pattern seguro para Next.js
export const getNotionClient = () => {
    return new Client({
        auth: process.env.NOTION_API_KEY,
    });
};

/**
 * Sincroniza um Usuário (Cria ou Atualiza) no Notion.
 */
export async function syncUserToNotion(user: { id: string; name: string; is_active: boolean }) {
    if (!process.env.NOTION_API_KEY) return null;
    
    const notion = getNotionClient();
    
    // 1. Verifica se já existe
    const { results } = await notion.databases.query({
        database_id: NOTION_DATABASES.USERS,
        filter: {
            property: "Supabase_ID",
            rich_text: {
                equals: user.id,
            },
        },
    });

    const properties = {
        Nome: { title: [{ text: { content: user.name } }] },
        Supabase_ID: { rich_text: [{ text: { content: user.id } }] },
        Ativo: { checkbox: user.is_active },
    };

    if (results.length > 0) {
        // Atualiza
        const pageId = results[0].id;
        await notion.pages.update({ page_id: pageId, properties });
        return pageId;
    } else {
        // Cria
        const newPage = await notion.pages.create({
            parent: { database_id: NOTION_DATABASES.USERS },
            properties,
        });
        return newPage.id;
    }
}

/**
 * Sincroniza um Setor (Cria ou Atualiza) no Notion.
 */
export async function syncSectorToNotion(sector: { id: string; name: string; is_active: boolean }) {
    if (!process.env.NOTION_API_KEY) return null;
    const notion = getNotionClient();

    const { results } = await notion.databases.query({
        database_id: NOTION_DATABASES.SECTORS,
        filter: {
            property: "Supabase_ID",
            rich_text: {
                equals: sector.id,
            },
        },
    });

    const properties = {
        Nome: { title: [{ text: { content: sector.name } }] },
        Supabase_ID: { rich_text: [{ text: { content: sector.id } }] },
        Ativo: { checkbox: sector.is_active },
    };

    if (results.length > 0) {
        const pageId = results[0].id;
        await notion.pages.update({ page_id: pageId, properties });
        return pageId;
    } else {
        const newPage = await notion.pages.create({
            parent: { database_id: NOTION_DATABASES.SECTORS },
            properties,
        });
        return newPage.id;
    }
}

/**
 * Busca Planos de Ação no Notion para um determinado Usuário (Just-in-Time)
 */
export async function getActionPlansFromNotion(assigneeNotionId: string, lastSyncDate?: Date) {
    if (!process.env.NOTION_API_KEY) return [];
    const notion = getNotionClient();

    const filter: Record<string, unknown> = {
        and: [
            {
                property: "Quem vai resolver?",
                relation: {
                    contains: assigneeNotionId
                }
            }
        ]
    };

    // Se passarmos a data do último sync, filtra apenas os modificados depois dessa data
    if (lastSyncDate) {
        (filter.and as Record<string, unknown>[]).push({
            timestamp: "last_edited_time",
            last_edited_time: {
                on_or_after: lastSyncDate.toISOString()
            }
        });
    }

    const { results } = await notion.databases.query({
        database_id: NOTION_DATABASES.ACTION_PLANS,
        filter: filter as any,
        sorts: [
            {
                timestamp: "last_edited_time",
                direction: "descending"
            }
        ]
    });

    return results;
}

/**
 * Atualiza o XP concedido a um Plano de Ação no Notion
 */
export async function updateActionPlanXPInNotion(pageId: string, xp: number) {
    if (!process.env.NOTION_API_KEY) return null;
    const notion = getNotionClient();
    
    return await notion.pages.update({
        page_id: pageId,
        properties: {
            "XP Concedido": {
                number: xp
            }
        }
    });
}

/**
 * Atualiza o status de um Plano de Ação no Notion
 */
export async function updateActionPlanStatusInNotion(
    pageId: string, 
    statusRaw: "pending" | "in_progress" | "resolved" | "canceled",
    extraData?: {
        photo_url?: string;
        file_url?: string;
        closing_comment?: string;
        satisfaction_rating?: number;
    }
) {
    if (!process.env.NOTION_API_KEY) return null;
    const notion = getNotionClient();
    
    let notionStatus = "Pendente";
    if (statusRaw === "in_progress") notionStatus = "Em andamento";
    if (statusRaw === "resolved") notionStatus = "Resolvido";
    if (statusRaw === "canceled") notionStatus = "Cancelado";

    const properties: any = {
        "Status": {
            select: { name: notionStatus }
        }
    };

    if (extraData?.photo_url) {
        properties["Foto"] = { url: extraData.photo_url };
    }
    if (extraData?.file_url) {
        properties["Arquivo"] = { url: extraData.file_url };
    }
    if (extraData?.closing_comment) {
        properties["Comentário de Finalização"] = { rich_text: [{ text: { content: extraData.closing_comment } }] };
    }
    if (extraData?.satisfaction_rating) {
        properties["Satisfação"] = { number: extraData.satisfaction_rating };
    }

    return await notion.pages.update({
        page_id: pageId,
        properties
    });
}

/**
 * Cria um Plano de Ação diretamente no Notion a partir do App
 */
export async function createActionPlanInNotion(planData: Record<string, unknown>) {
    if (!process.env.NOTION_API_KEY) return null;
    const notion = getNotionClient();

    const properties: Record<string, unknown> = {
        "Tarefa ou Problema": { title: [{ text: { content: planData.title } }] },
        "Status": { select: { name: "Pendente" } },
        "Supabase_ID": { rich_text: [{ text: { content: planData.id } }] }
    };

    if (planData.benefit) {
        properties["Qual o benefício de solucionar?"] = { rich_text: [{ text: { content: planData.benefit } }] };
    }
    if (planData.step_by_step) {
        properties["Qual o passo a passo básico?"] = { rich_text: [{ text: { content: planData.step_by_step } }] };
    }
    if (planData.cost_type) {
        properties["Vai custar dinheiro ou só tempo?"] = { select: { name: planData.cost_type === "dinheiro" ? "Dinheiro" : "Apenas Tempo" } };
    }
    if (planData.due_date) {
        properties["Qual o prazo final?"] = { date: { start: planData.due_date as string } };
    }
    if (planData.assignee_notion_id) {
        properties["Quem vai resolver?"] = { relation: [{ id: planData.assignee_notion_id as string }] };
    }
    if (planData.sector_notion_id) {
        properties["Em que setor?"] = { relation: [{ id: planData.sector_notion_id as string }] };
    }
    if (planData.checklist_response_id) {
        properties["Checklist_ID"] = { rich_text: [{ text: { content: planData.checklist_response_id } }] };
    }

    const newPage = await notion.pages.create({
        parent: { database_id: NOTION_DATABASES.ACTION_PLANS },
        properties: properties as Record<string, any>
    });

    return newPage.id;
}

