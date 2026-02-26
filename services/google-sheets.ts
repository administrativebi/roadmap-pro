// Serviço de sincronização com Google Sheets
// Layout sugerido das colunas: ID | Data | Restaurante | Usuário | Pontuação | Status

export interface SheetRow {
    id: string;
    data: string;
    restaurante: string;
    usuario: string;
    pontuacao: number;
    status: string;
}

/**
 * Espelha dados de checklist para o Google Sheets via API.
 * Em produção, use uma Service Account e a API v4 do Google Sheets.
 * 
 * Alternativamente, esta função pode chamar um webhook do n8n
 * que faz o append no Google Sheets automaticamente.
 */
export async function syncToGoogleSheets(row: SheetRow): Promise<boolean> {
    const SHEETS_WEBHOOK = process.env.N8N_WEBHOOK_BASE_URL
        ? `${process.env.N8N_WEBHOOK_BASE_URL}/sync-sheets`
        : null;

    if (!SHEETS_WEBHOOK) {
        console.warn("[Google Sheets] Webhook URL não configurada. Pulando sincronização.");
        return false;
    }

    try {
        const response = await fetch(SHEETS_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(row),
        });

        if (!response.ok) {
            console.error("[Google Sheets] Falha ao sincronizar:", response.statusText);
        }

        return response.ok;
    } catch (error) {
        console.error("[Google Sheets] Erro ao sincronizar:", error);
        return false;
    }
}
