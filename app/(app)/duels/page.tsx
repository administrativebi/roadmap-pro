"use client";

import { motion } from "framer-motion";
import { Swords, User, Zap, Trophy, Flame, ChevronRight, Search, Play, X, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const MOCK_ACTIVE_DUELS = [
    {
        id: 1,
        opponent: "Carlos Silva",
        opponentAvatar: "CS",
        checklist: "Fechamento da Cozinha",
        myProgress: 60,
        myScore: 450,
        opponentProgress: 45,
        opponentScore: 320,
        timeLeft: "04:20",
        winning: true,
    }
];

const MOCK_INVITES = [
    {
        id: 2,
        challenger: "Ana Beatriz",
        challengerAvatar: "AB",
        checklist: "Controle de Temperatura",
        wager: 100, // XP apostado
    }
];

export default function DuelsPage() {
    const [activeTab, setActiveTab] = useState("active"); // active, history

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 max-w-5xl mx-auto"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
                        <Swords className="w-8 h-8 text-rose-500" />
                        Duelos & Multiplayer
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        Desafie seus colegas, faça checklists mais rápido e ganhe XP extra!
                    </p>
                </div>

                <button className="bg-gradient-to-r from-rose-500 to-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2">
                    <Swords className="w-5 h-5" />
                    Desafiar Colega
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Content - Duels */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Invites Segment */}
                    {MOCK_INVITES.length > 0 && (
                        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6 shadow-sm">
                            <h2 className="font-bold text-zinc-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
                                <Flame className="w-5 h-5 text-orange-500" />
                                Convites Pendentes
                            </h2>
                            <div className="space-y-3">
                                {MOCK_INVITES.map(invite => (
                                    <div key={invite.id} className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-bold text-white shadow-sm">
                                                {invite.challengerAvatar}
                                            </div>
                                            <div>
                                                <p className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">
                                                    {invite.challenger} desafiou você!
                                                </p>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                    Checklist: {invite.checklist}
                                                </p>
                                                <div className="flex items-center gap-1 mt-1 font-bold text-amber-600 dark:text-amber-500 text-xs">
                                                    <Zap className="w-3 h-3 fill-amber-500" />
                                                    Aposta: {invite.wager} XP
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-colors">
                                                <X className="w-5 h-5" />
                                            </button>
                                            <button className="px-4 h-10 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold text-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                                                <Check className="w-4 h-4" /> Aceitar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Active Duels */}
                    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">Duelos em Andamento</h2>
                        </div>

                        <div className="space-y-6">
                            {MOCK_ACTIVE_DUELS.map(duel => (
                                <div key={duel.id} className="relative z-0">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-rose-500 opacity-5 blur-xl rounded-2xl" />
                                    <div className="relative z-10 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{duel.checklist}</h3>
                                                <p className="text-xs text-zinc-500">Tempo Restante: <span className="font-mono text-rose-500 font-bold">{duel.timeLeft}</span></p>
                                            </div>
                                            <button className="w-10 h-10 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
                                                <Play className="w-4 h-4 ml-0.5" />
                                            </button>
                                        </div>

                                        {/* Battle Bar */}
                                        <div className="space-y-4">
                                            {/* Você */}
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                                                    VO
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between text-xs font-bold mb-1">
                                                        <span className="text-blue-600 dark:text-blue-400">Você</span>
                                                        <span className="text-zinc-500">{duel.myScore} pts ({duel.myProgress}%)</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${duel.myProgress}%` }}
                                                            className="h-full bg-blue-500 rounded-full"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* VS divider */}
                                            <div className="relative h-4 flex items-center justify-center">
                                                <div className="absolute w-full h-[1px] bg-zinc-100 dark:bg-zinc-800" />
                                                <span className="relative z-10 bg-white dark:bg-zinc-950 px-2 text-[10px] font-black italic text-zinc-400">VS</span>
                                            </div>

                                            {/* Oponente */}
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400 flex items-center justify-center font-bold text-xs">
                                                    {duel.opponentAvatar}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between text-xs font-bold mb-1">
                                                        <span className="text-rose-600 dark:text-rose-400">{duel.opponent}</span>
                                                        <span className="text-zinc-500">{duel.opponentScore} pts ({duel.opponentProgress}%)</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${duel.opponentProgress}%` }}
                                                            className="h-full bg-rose-500 rounded-full"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar - Leaderboard / Rules */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-zinc-900 dark:bg-white rounded-2xl p-6 text-white dark:text-zinc-900">
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy className="w-5 h-5 text-amber-400" />
                            <h3 className="font-bold text-lg">Top Duelistas</h3>
                        </div>
                        <div className="space-y-4">
                            {[
                                { name: "Marcos T.", wins: 24, winRate: "82%" },
                                { name: "Você", wins: 18, winRate: "65%" },
                                { name: "Ana B.", wins: 15, winRate: "58%" },
                            ].map((p, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-zinc-500 dark:text-zinc-400">#{i + 1}</span>
                                        <span className="font-medium">{p.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-emerald-400">{p.wins} V</span>
                                        <span className="text-[10px] text-zinc-400 block">{p.winRate} win rate</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900 p-6">
                        <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">Como funcionam os duelos?</h3>
                        <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-2 list-disc pl-4">
                            <li>Convide um colega para o mesmo checklist.</li>
                            <li>Aquele que terminar mais rápido com mais precisão ganha.</li>
                            <li>O vencedor leva todo o XP apostado mais um bônus da casa!</li>
                            <li>Se houver empate, ambos recebem o XP de volta.</li>
                        </ul>
                    </div>
                </div>

            </div>
        </motion.div>
    );
}
