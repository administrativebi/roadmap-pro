"use client";

import { WifiOff, RefreshCw, Clock } from "lucide-react";
import { getPendingSyncCount } from "@/lib/offline";

export default function OfflinePage() {
    const pendingCount = typeof window !== "undefined" ? getPendingSyncCount() : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-6">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <WifiOff className="w-10 h-10 text-zinc-400" />
                </div>

                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
                    Você está offline
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mb-8">
                    Não se preocupe! Seus checklists salvos estão disponíveis e serão
                    sincronizados quando a conexão voltar.
                </p>

                {pendingCount > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
                        <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-300">
                            <Clock className="w-5 h-5" />
                            <p className="font-bold text-sm">
                                {pendingCount} {pendingCount === 1 ? "checklist aguardando" : "checklists aguardando"} sincronização
                            </p>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-xl font-semibold hover:shadow-lg transition-all mx-auto"
                >
                    <RefreshCw className="w-5 h-5" />
                    Tentar reconectar
                </button>
            </div>
        </div>
    );
}
