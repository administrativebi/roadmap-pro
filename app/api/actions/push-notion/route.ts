import { NextResponse } from 'next/server';
import { createActionPlanInNotion, syncUserToNotion, syncSectorToNotion } from '@/services/notion';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        if (!body.planData) {
            return NextResponse.json({ error: "Missing plan data" }, { status: 400 });
        }

        const supabase = await createServerSupabase();
        const planData = body.planData;

        // Ensure Assignee is synced to Notion and we have the ID
        if (planData.assignee_id && !planData.assignee_notion_id) {
            const { data: user } = await supabase.from('profiles').select('id, name').eq('id', planData.assignee_id).single();
            if (user) {
                const notionId = await syncUserToNotion({ id: user.id, name: user.name || 'Sem Nome', is_active: true });
                if (notionId) {
                    await supabase.from('profiles').update({ notion_page_id: notionId }).eq('id', user.id);
                    planData.assignee_notion_id = notionId;
                }
            }
        }

        // Ensure Sector is synced to Notion and we have the ID
        if (planData.sector_id && !planData.sector_notion_id) {
            const { data: sector } = await supabase.from('sectors').select('id, name, is_active').eq('id', planData.sector_id).single();
            if (sector) {
                const notionId = await syncSectorToNotion({ id: sector.id, name: sector.name, is_active: sector.is_active });
                if (notionId) {
                    await supabase.from('sectors').update({ notion_page_id: notionId }).eq('id', sector.id);
                    planData.sector_notion_id = notionId;
                }
            }
        }

        const notionId = await createActionPlanInNotion({
            ...planData,
            due_date: planData.due_date ? new Date(planData.due_date).toISOString().split('T')[0] : null
        });
        
        if (notionId && planData.id) {
            await supabase.from('action_plans').update({ notion_page_id: notionId }).eq('id', planData.id);
        }

        return NextResponse.json({ success: true, notionId });
    } catch (error: any) {
        console.error("Notion Push Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
