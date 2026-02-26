"use client";

import { motion } from "framer-motion";
import { Gift, Zap, Ticket, Coffee, Car, Pizza, Calendar, Dice5, Coins, AlertCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const MOCK_REWARDS = [
    { id: 1, title: "Meia Folga", xp: 5000, icon: Calendar, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/40" },
    { id: 2, title: "Almoço Especial", xp: 2000, icon: Pizza, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/40" },
    { id: 3, title: "Café VIP", xp: 500, icon: Coffee, color: "text-amber-700", bg: "bg-amber-100 dark:bg-amber-900/40" },
    { id: 4, title: "Vaga VIP Estacionamento", xp: 3000, icon: Car, color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/40", limit: "1 Vaga Livre" },
];

export default function RewardsPage() {
    const [xpBalance, setXpBalance] = useState(2510);
    const [spinning, setSpinning] = useState(false);
    const [spinResult, setSpinResult] = useState<string | null>(null);

    const handleSpin = () => {
        if (spinning) return;
        setSpinning(true);
        setSpinResult(null);

        // Simulate spin wheel animation
        setTimeout(() => {
            setSpinning(false);
            const rewards = ["+50 XP", "+100 XP", "Badge Sorte 🍀", "Nada desta vez"];
            const prize = rewards[Math.floor(Math.random() * rewards.length)];
            setSpinResult(prize);
            if (prize.includes("XP")) {
                const amount = parseInt(prize.replace(/\D/g, ""), 10);
                setXpBalance(prev => prev + amount);
            }
        }, 3000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 max-w-5xl mx-auto"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Loja & Recompensas
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        Troque seus XP por prêmios reais ou tente a sorte
                    </p>
                </div>
                <div className="bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 rounded-2xl shadow-lg shadow-amber-500/20 text-white flex items-center justify-between min-w-[200px]">
                    <span className="text-xs font-bold opacity-80 uppercase tracking-wider">Saldo Total</span>
                    <div className="flex items-center gap-1 font-black text-2xl">
                        <Zap className="w-5 h-5 fill-white" />
                        {xpBalance} XP
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* 8. Daily Spin / Roda da Sorte */}
                <div className="md:col-span-1 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl shadow-purple-900/20 flex flex-col items-center text-center">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-3xl" />

                    <div className="mb-6 relative z-10 w-full flex justify-between items-start">
                        <div className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase">
                            Giro Diário 🎡
                        </div>
                        <div className="text-xs text-indigo-300">1 Disponível</div>
                    </div>

                    <div className="relative z-10 w-48 h-48 mb-6 mt-4">
                        {/* The Wheel */}
                        <motion.div
                            className={cn(
                                "w-full h-full rounded-full border-8 border-indigo-500/30 flex items-center justify-center relative shadow-[0_0_40px_rgba(168,85,247,0.4)] inset-0 bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-amber-500",
                                spinning && "animate-spin"
                            )}
                            animate={spinning ? { rotate: 360 * 5 } : { rotate: 0 }}
                            transition={{ duration: 3, ease: "easeOut" }}
                            style={{
                                background: "conic-gradient(from 0deg, #8b5cf6 0% 25%, #ec4899 25% 50%, #f59e0b 50% 75%, #10b981 75% 100%)"
                            }}
                        >
                            {/* Inner Circle hole */}
                            <div className="w-12 h-12 bg-indigo-950 rounded-full border-4 border-white/20 z-20 flex items-center justify-center text-xl">✨</div>
                        </motion.div>
                        {/* Selector Arrow */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl z-30 filter drop-shadow-md">👇</div>
                    </div>

                    {spinResult ? (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white text-purple-900 w-full rounded-xl py-3 font-black text-xl shadow-lg border-2 border-amber-400 relative z-10"
                        >
                            {spinResult}
                        </motion.div>
                    ) : (
                        <button
                            onClick={handleSpin}
                            disabled={spinning}
                            className="bg-gradient-to-r from-amber-400 to-orange-500 w-full rounded-xl py-3 font-black text-white shadow-lg hover:scale-105 active:scale-95 transition-all relative z-10 disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {spinning ? "GIRE A RODA..." : "GIRAR AGORA GRÁTIS"}
                        </button>
                    )}
                    <p className="text-[10px] text-indigo-300 mt-4 relative z-10 opacity-70">
                        Você ganhou um giro completando 100% dos checklists de hoje.
                    </p>
                </div>

                {/* 4. Loja de Recompensas */}
                <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                            <Gift className="w-5 h-5 text-fuchsia-500" />
                            <h2 className="font-bold text-lg">Catálogo de Prêmios</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {MOCK_REWARDS.map((reward) => {
                            const Icon = reward.icon;
                            const canAfford = xpBalance >= reward.xp;

                            return (
                                <div key={reward.id} className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                                    <div>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", reward.bg)}>
                                                <Icon className={cn("w-6 h-6", reward.color)} />
                                            </div>
                                            {reward.limit && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                                                    {reward.limit}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{reward.title}</h3>
                                        <div className="flex items-center gap-1.5 mt-2">
                                            <Zap className={cn("w-4 h-4", canAfford ? "text-amber-500 fill-amber-500" : "text-zinc-400")} />
                                            <span className={cn("font-bold", canAfford ? "text-amber-500" : "text-zinc-500 dark:text-zinc-400")}>
                                                {reward.xp.toLocaleString()} XP
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        disabled={!canAfford}
                                        className={cn(
                                            "mt-6 w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                                            canAfford
                                                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:scale-[1.02]"
                                                : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed"
                                        )}
                                    >
                                        <Ticket className="w-4 h-4" />
                                        {canAfford ? "Resgatar Prêmio" : "XP Insuficiente"}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50 rounded-xl p-4 flex items-start gap-3 mt-4">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-sm text-amber-800 dark:text-amber-400">Como funciona o resgate?</h4>
                            <p className="text-xs text-amber-700/80 dark:text-amber-500/80 mt-1">
                                O gestor da unidade define os prêmios disponíveis. Ao solicitar resgate, um voucher será gerado para ser validado com o gerente local. O uso do XP não diminui o seu Nível!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
