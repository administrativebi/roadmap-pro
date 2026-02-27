// ─── Push Notifications Helper ─────────────────────────
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

export async function requestNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;

    const result = await Notification.requestPermission();
    return result === "granted";
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
    try {
        const registration = await navigator.serviceWorker.ready;

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any,
        });

        // TODO: Enviar subscription para o backend (Supabase)
        // await saveSubscription(subscription);

        return subscription;
    } catch (err) {
        console.error("Push subscription failed:", err);
        return null;
    }
}

export async function sendLocalNotification(
    title: string,
    options?: NotificationOptions
) {
    if (Notification.permission !== "granted") return;

    const registration = await navigator.serviceWorker.ready;
    registration.showNotification(title, {
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        vibrate: [100, 50, 100],
        ...options,
    } as any);
}

// Notificações pré-configuradas
export const notifications = {
    checklistPending: (title: string, time: string) =>
        sendLocalNotification(`📋 ${title} pendente!`, {
            body: `Agendado para ${time}. Toque para iniciar.`,
            tag: "checklist-pending",
            data: { url: "/checklists" },
        }),

    streakWarning: (days: number) =>
        sendLocalNotification("🔥 Sua sequência está em risco!", {
            body: `${days} dias seguidos! Complete um checklist hoje.`,
            tag: "streak-warning",
            requireInteraction: true,
            data: { url: "/checklists" },
        }),

    checklistCompleted: (points: number) =>
        sendLocalNotification("🏆 Checklist concluído!", {
            body: `Você ganhou +${points} XP! Continue assim!`,
            tag: "checklist-complete",
            data: { url: "/dashboard" },
        }),

    newBadge: (badgeName: string) =>
        sendLocalNotification("🏅 Nova conquista desbloqueada!", {
            body: `Parabéns! Você ganhou a badge "${badgeName}"`,
            tag: "new-badge",
            data: { url: "/ranking" },
        }),

    scheduleReminder: (title: string, minutesBefore: number) =>
        sendLocalNotification(`⏰ Em ${minutesBefore} minutos`, {
            body: `${title} começa em breve. Prepare-se!`,
            tag: "schedule-reminder",
            data: { url: "/schedule" },
        }),

    notifySupervisor: (tplTitle: string, questionTitle: string, reason: string) =>
        sendLocalNotification("⚠️ Alerta p/ Supervisor", {
            body: `Não conformidade crítica em "${tplTitle}": ${questionTitle}. Motivo: ${reason}`,
            tag: "supervisor-alert",
            requireInteraction: true,
            data: { url: "/manager" },
        }),
};

// Helper: Convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
