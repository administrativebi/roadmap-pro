"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Wifi, WifiOff } from "lucide-react";

export function PWAProvider({ children }: { children: React.ReactNode }) {
    const [isOffline, setIsOffline] = useState(false);
    const [showInstall, setShowInstall] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);

    useEffect(() => {
        // Register Service Worker
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((reg) => {
                    console.log("Service Worker registrado:", reg.scope);
                })
                .catch((err) => {
                    console.error("SW registration failed:", err);
                });

            // Listen for sync messages from SW
            navigator.serviceWorker.addEventListener("message", (event) => {
                if (event.data?.type === "SYNC_COMPLETE") {
                    const { synced, remaining } = event.data;
                    setSyncMessage(
                        `✅ ${synced} checklist${synced > 1 ? "s" : ""} sincronizado${synced > 1 ? "s" : ""}!${remaining > 0 ? ` (${remaining} pendente${remaining > 1 ? "s" : ""})` : ""
                        }`
                    );
                    setTimeout(() => setSyncMessage(null), 4000);
                }
            });
        }

        // Online/Offline detection
        const handleOnline = () => {
            setIsOffline(false);
            setSyncMessage("🔄 Conexão restaurada! Sincronizando...");
            setTimeout(() => setSyncMessage(null), 3000);
        };
        const handleOffline = () => setIsOffline(true);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        setIsOffline(!navigator.onLine);

        // Install prompt
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstall(true);
        };
        window.addEventListener("beforeinstallprompt", handleBeforeInstall);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        if (result.outcome === "accepted") {
            setShowInstall(false);
        }
        setDeferredPrompt(null);
    };

    return (
        <>
            {children}

            {/* Offline Banner */}
            <AnimatePresence>
                {isOffline && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-4 left-4 right-4 z-50 bg-zinc-900 text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3 max-w-md mx-auto"
                    >
                        <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0">
                            <WifiOff className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Sem conexão</p>
                            <p className="text-xs text-zinc-400">
                                Seus dados serão salvos e sincronizados automaticamente
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sync Message */}
            <AnimatePresence>
                {syncMessage && (
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white rounded-xl px-5 py-3 shadow-xl text-sm font-semibold flex items-center gap-2"
                    >
                        <Wifi className="w-4 h-4" />
                        {syncMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Install Banner */}
            <AnimatePresence>
                {showInstall && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-4 left-4 right-4 z-50 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white rounded-2xl p-5 shadow-2xl max-w-md mx-auto"
                    >
                        <button
                            onClick={() => setShowInstall(false)}
                            className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                                <Download className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold">Instalar Checklist Pro</p>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                    Acesse mais rápido direto da tela inicial
                                </p>
                            </div>
                            <button
                                onClick={handleInstall}
                                className="px-4 py-2 bg-white text-zinc-900 rounded-xl text-sm font-bold hover:bg-zinc-100 transition-colors shrink-0"
                            >
                                Instalar
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
