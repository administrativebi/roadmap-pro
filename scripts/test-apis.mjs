import fetch from 'node-fetch'; // Se usar Node >= 18, o fetch é nativo.

const LOCAL_URL = 'http://localhost:3000';

async function testWebhookSimulandoSupabase() {
    console.log("🚀 [TESTE 1] Simulando Webhook do Supabase (Atualização de Usuário)...");
    
    // Simula o payload exato que o Supabase envia
    const payload = {
        type: "UPDATE",
        table: "profiles",
        schema: "public",
        record: {
            id: "teste-local-id-123", // Será criado/atualizado no Notion
            name: "Usuário Teste Local",
        },
        old_record: {
            id: "teste-local-id-123",
            name: "Nome Antigo",
        }
    };

    try {
        const response = await fetch(`${LOCAL_URL}/api/webhooks/supabase-to-notion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log("✅ Resposta do Webhook Local:", data);
    } catch (error) {
        console.error("❌ Falha no Webhook Local. O servidor localhost:3000 está rodando?");
        console.error(error.message);
    }
}

async function testPushNotionApi() {
    console.log("\n🚀 [TESTE 2] Simulando envio de Plano de Ação direto para a API...");
    
    const payload = {
        planData: {
            id: "plano-local-id-456",
            title: "[TESTE LOCAL] Vazamento na pia",
            benefit: "Evitar poças d'água",
            step_by_step: "1. Fechar registro\\n2. Chamar encanador",
            cost_type: "apenas_tempo",
        }
    };

    try {
        const response = await fetch(`${LOCAL_URL}/api/actions/push-notion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log("✅ Resposta da API de Planos Local:", data);
        if(data.notionId) {
            console.log("🔗 ID criado no Notion:", data.notionId);
        }
    } catch (error) {
        console.error("❌ Falha na API. O servidor localhost:3000 está rodando?");
        console.error(error.message);
    }
}

// Executar os testes em sequência
async function runTests() {
    await testWebhookSimulandoSupabase();
    await testPushNotionApi();
}

runTests();
