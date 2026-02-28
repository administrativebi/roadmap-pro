import { NextResponse } from 'next/server';
import { syncUserToNotion, syncSectorToNotion } from '@/services/notion';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // Supabase Database Webhooks send:
        // { type: "INSERT" | "UPDATE" | "DELETE", table: string, schema: string, record: object, old_record: object }
        const { type, table, record, old_record } = body;

        if (table === 'profiles') {
            const userRecord = type === 'DELETE' ? old_record : record;
            
            if (userRecord) {
                const isActive = type !== 'DELETE';
                await syncUserToNotion({
                    id: userRecord.id,
                    name: userRecord.name || "Sem Nome",
                    is_active: isActive
                });
                return NextResponse.json({ success: true });
            }
        }

        if (table === 'sectors') {
            const sectorRecord = type === 'DELETE' ? old_record : record;
            
            if (sectorRecord) {
                const isActive = type === 'DELETE' ? false : sectorRecord.is_active;
                await syncSectorToNotion({
                    id: sectorRecord.id,
                    name: sectorRecord.name,
                    is_active: isActive
                });
                return NextResponse.json({ success: true });
            }
        }

        return NextResponse.json({ success: true, message: "Ignored" });

    } catch (error: any) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
