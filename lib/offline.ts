// ─── Offline Sync Manager ──────────────────────────────
const OFFLINE_QUEUE_KEY = "checklist-offline-queue";

export interface OfflineEntry {
    id: string;
    url: string;
    data: Record<string, unknown>;
    timestamp: number;
    type: "checklist_complete" | "checklist_response" | "action_plan";
}

// Check if online
export function isOnline(): boolean {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
}

// Save data for later sync
export function queueOfflineAction(entry: Omit<OfflineEntry, "id" | "timestamp">) {
    const queue = getOfflineQueue();
    const newEntry: OfflineEntry = {
        ...entry,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
    };
    queue.push(newEntry);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));

    // Request background sync
    if ("serviceWorker" in navigator && "SyncManager" in window) {
        navigator.serviceWorker.ready.then((registration) => {
            (registration as any).sync.register("sync-checklists");
        });
    }

    return newEntry.id;
}

// Get pending offline actions
export function getOfflineQueue(): OfflineEntry[] {
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
    } catch {
        return [];
    }
}

// Get count of pending syncs
export function getPendingSyncCount(): number {
    return getOfflineQueue().length;
}

// Clear synced items
export function removeFromQueue(id: string) {
    const queue = getOfflineQueue();
    const filtered = queue.filter((item) => item.id !== id);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
}

// Manual sync attempt
export async function trySyncNow(): Promise<{ synced: number; failed: number }> {
    if (!isOnline()) return { synced: 0, failed: 0 };

    const queue = getOfflineQueue();
    let synced = 0;
    let failed = 0;

    for (const item of queue) {
        try {
            const response = await fetch(item.url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(item.data),
            });
            if (response.ok) {
                removeFromQueue(item.id);
                synced++;
            } else {
                failed++;
            }
        } catch {
            failed++;
        }
    }

    return { synced, failed };
}

// Save checklist responses locally for offline access
export function saveChecklistLocally(
    templateId: string,
    responses: Record<string, unknown>
) {
    const key = `checklist-draft-${templateId}`;
    localStorage.setItem(
        key,
        JSON.stringify({
            responses,
            savedAt: Date.now(),
        })
    );
}

// Load saved checklist draft
export function loadChecklistDraft(
    templateId: string
): { responses: Record<string, unknown>; savedAt: number } | null {
    const key = `checklist-draft-${templateId}`;
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

// Clear draft after submission
export function clearChecklistDraft(templateId: string) {
    localStorage.removeItem(`checklist-draft-${templateId}`);
}
