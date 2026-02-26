/// <reference lib="webworker" />

const CACHE_NAME = "checklist-pro-v1";
const OFFLINE_QUEUE_KEY = "offline-queue";

// Arquivos para cache estático (App Shell)
const STATIC_ASSETS = [
    "/",
    "/dashboard",
    "/checklists",
    "/schedule",
    "/ranking",
    "/offline",
    "/manifest.json",
];

// ─── INSTALL ─────────────────────────────────────────────
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// ─── ACTIVATE ────────────────────────────────────────────
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// ─── FETCH (Network First, fallback to Cache) ───────────
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests (POST para sync offline depois)
    if (request.method !== "GET") return;

    // Skip API/Supabase requests
    if (url.pathname.startsWith("/api") || url.hostname.includes("supabase")) return;

    event.respondWith(
        fetch(request)
            .then((response) => {
                // Cache successful responses
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, clone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Offline: serve from cache
                return caches.match(request).then((cached) => {
                    if (cached) return cached;
                    // Fallback para página offline
                    if (request.destination === "document") {
                        return caches.match("/offline");
                    }
                    return new Response("Offline", { status: 503 });
                });
            })
    );
});

// ─── BACKGROUND SYNC ────────────────────────────────────
self.addEventListener("sync", (event) => {
    if (event.tag === "sync-checklists") {
        event.waitUntil(syncOfflineChecklists());
    }
});

async function syncOfflineChecklists() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const queueResponse = await cache.match(OFFLINE_QUEUE_KEY);
        if (!queueResponse) return;

        const queue = await queueResponse.json();
        if (!queue || queue.length === 0) return;

        const successfulSyncs = [];

        for (const item of queue) {
            try {
                const response = await fetch(item.url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(item.data),
                });
                if (response.ok) {
                    successfulSyncs.push(item.id);
                }
            } catch {
                // Will retry next sync
            }
        }

        // Remove synced items from queue
        const remaining = queue.filter((item) => !successfulSyncs.includes(item.id));
        await cache.put(
            OFFLINE_QUEUE_KEY,
            new Response(JSON.stringify(remaining))
        );

        // Notify client
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
            client.postMessage({
                type: "SYNC_COMPLETE",
                synced: successfulSyncs.length,
                remaining: remaining.length,
            });
        });
    } catch (err) {
        console.error("Sync failed:", err);
    }
}

// ─── PUSH NOTIFICATIONS ─────────────────────────────────
self.addEventListener("push", (event) => {
    let data = { title: "Checklist Pro", body: "Você tem checklists pendentes!" };

    if (event.data) {
        try {
            data = event.data.json();
        } catch {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        vibrate: [100, 50, 100],
        tag: data.tag || "checklist-notification",
        renotify: true,
        requireInteraction: data.requireInteraction || false,
        data: {
            url: data.url || "/checklists",
            dateOfArrival: Date.now(),
        },
        actions: data.actions || [
            { action: "open", title: "Abrir", icon: "/icons/icon-72x72.png" },
            { action: "dismiss", title: "Dispensar" },
        ],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
});

// ─── NOTIFICATION CLICK ─────────────────────────────────
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    if (event.action === "dismiss") return;

    const urlToOpen = event.notification.data?.url || "/checklists";

    event.waitUntil(
        self.clients.matchAll({ type: "window" }).then((clientList) => {
            // Focus existing window if available
            for (const client of clientList) {
                if (client.url.includes(urlToOpen) && "focus" in client) {
                    return client.focus();
                }
            }
            // Open new window
            return self.clients.openWindow(urlToOpen);
        })
    );
});

// ─── PERIODIC SYNC (Widget / Background Updates) ────────
self.addEventListener("periodicsync", (event) => {
    if (event.tag === "update-widget") {
        event.waitUntil(updateWidget());
    }
    if (event.tag === "check-streak") {
        event.waitUntil(checkStreakReminder());
    }
});

async function updateWidget() {
    // Update cached widget data
    try {
        const response = await fetch("/api/next-schedule");
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put("/api/next-schedule", response.clone());
        }
    } catch { }
}

async function checkStreakReminder() {
    // Check if user might lose their streak
    try {
        const response = await fetch("/api/streak-status");
        if (response.ok) {
            const data = await response.json();
            if (data.atRisk) {
                self.registration.showNotification("🔥 Sua sequência está em risco!", {
                    body: `Você tem ${data.streakDays} dias seguidos. Complete um checklist hoje para não perder!`,
                    icon: "/icons/icon-192x192.png",
                    tag: "streak-warning",
                    requireInteraction: true,
                    data: { url: "/checklists" },
                });
            }
        }
    } catch { }
}
