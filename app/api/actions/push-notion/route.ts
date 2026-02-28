import { NextResponse } from 'next/server';
import { createActionPlanInNotion } from '@/services/notion';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        if (!body.planData) {
            return NextResponse.json({ error: "Missing plan data" }, { status: 400 });
        }

        const notionId = await createActionPlanInNotion(body.planData);

        return NextResponse.json({ success: true, notionId });
    } catch (error: any) {
        console.error("Notion Push Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
