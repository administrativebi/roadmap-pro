"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Clock,
    ClipboardCheck,
    Sun,
    Moon,
    Sunset,
    ChevronRight,
    Maximize,
    RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

function getGreeting(): { text: string; icon: typeof Sun } {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Bom dia", icon: Sun };
    if (hour < 18) return { text: "Boa tarde", icon: Sunset };
    return { text: "Boa noite", icon: Moon };
}

const kioskChecklists = [
    {
        id: "tpl-1",
        title: "Abertura do Restaurante",
        icon: "🌅",
        time: "07:00",
        status: "pending" as const,
        questions: 6,
        points: 90,
    },
    {
        id: "tpl-2",
        title: "Controle de Qualidade APPCC",
        icon: "🔬",
        time: "10:00",
        status: "pending" as const,
        questions: 10,
        points: 170,
    },
    {
        id: "tpl-3",
        title: "Fechamento Diário",
        icon: "🌙",
        time: "22:00",
        status: "pending" as const,
        questions: 8,
        points: 120,
    },
];

export default function KioskPage() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const greeting = getGreeting();
    const GreetingIcon = greeting.icon;

    // Relógio em tempo real
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    // Auto-fullscreen
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const timeStr = currentTime.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    });

    const dateStr = currentTime.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 p-8 flex flex-col">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-zinc-900 to-zinc-700 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-xl font-black text-white">✓</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                            <GreetingIcon className="w-5 h-5 text-amber-500" />
                            {greeting.text}!
                        </h1>
                        <p className="text-sm text-zinc-500 capitalize">{dateStr}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <motion.div
                        key={timeStr}
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 1 }}
                        className="text-5xl font-black text-zinc-900 dark:text-zinc-50 tabular-nums tracking-tight"
                    >
                        {timeStr}
                    </motion.div>
                    <div className="flex gap-2">
                        <button
                            onClick={toggleFullscreen}
                            className="p-3 rounded-xl bg-white dark:bg-zinc-800 shadow-sm hover:shadow-md transition-all"
                            title="Tela cheia"
                        >
                            <Maximize className="w-5 h-5 text-zinc-500" />
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="p-3 rounded-xl bg-white dark:bg-zinc-800 shadow-sm hover:shadow-md transition-all"
                            title="Recarregar"
                        >
                            <RefreshCw className="w-5 h-5 text-zinc-500" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col gap-6">
                {/* Title */}
                <div className="text-center">
                    <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-50">
                        Checklists de Hoje
                    </h2>
                    <p className="text-zinc-500 mt-1">
                        Toque em um checklist para começar
                    </p>
                </div>

                {/* Checklist Cards - Large for Touch */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
                    {kioskChecklists.map((checklist, i) => (
                        <motion.button
                            key={checklist.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.15 }}
                            whileHover={{ scale: 1.03, y: -8 }}
                            whileTap={{ scale: 0.97 }}
                            className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all text-left flex flex-col border border-zinc-100 dark:border-zinc-800"
                            onClick={() => {
                                window.location.href = `/checklists?template=${checklist.id}&kiosk=true`;
                            }}
                        >
                            <span className="text-6xl mb-6">{checklist.icon}</span>

                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                                {checklist.title}
                            </h3>

                            <div className="flex items-center gap-2 text-zinc-400 mb-6">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">{checklist.time}</span>
                            </div>

                            <div className="mt-auto">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="flex items-center gap-1.5 text-sm text-zinc-500">
                                        <ClipboardCheck className="w-4 h-4" />
                                        {checklist.questions} perguntas
                                    </span>
                                    <span className="text-sm font-bold text-amber-500">
                                        {checklist.points} pts
                                    </span>
                                </div>

                                <div className="flex items-center justify-center gap-2 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl font-bold text-zinc-700 dark:text-zinc-300">
                                    Iniciar Checklist
                                    <ChevronRight className="w-5 h-5" />
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8">
                <p className="text-xs text-zinc-400">
                    Modo Quiosque — Checklist Pro • Toque para interagir
                </p>
            </div>
        </div>
    );
}
