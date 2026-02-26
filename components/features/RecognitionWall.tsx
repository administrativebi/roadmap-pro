"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Heart, MessageCircle, Trophy, Flame, Star, Sparkles, Crown, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedItem {
    id: string;
    type: "milestone" | "badge" | "streak" | "shoutout" | "level_up";
    user: { name: string; avatar: string; role: string };
    title: string;
    description: string;
    emoji: string;
    timestamp: string;
    likes: number;
    liked: boolean;
    comments: number;
}

const feedItems: FeedItem[] = [
    { id: "f1", type: "milestone", user: { name: "Carlos Silva", avatar: "🧑‍🍳", role: "Cozinheiro Chefe" }, title: "100 checklists completados! 🎯", description: "Carlos atingiu a marca de 100 checklists concluídos com nota média de 94!", emoji: "💯", timestamp: "Há 2 horas", likes: 12, liked: false, comments: 3 },
    { id: "f2", type: "badge", user: { name: "Ana Souza", avatar: "👩‍🍳", role: "Sub-chef" }, title: "Badge: Mestre APPCC 🛡️", description: "Completou todos os treinamentos de segurança alimentar com score 100%.", emoji: "🏅", timestamp: "Há 4 horas", likes: 8, liked: true, comments: 2 },
    { id: "f3", type: "streak", user: { name: "Roberto Lima", avatar: "👨‍🍳", role: "Auxiliar de Cozinha" }, title: "30 dias seguidos! 🔥", description: "Um mês inteiro completando checklists sem falhar um dia sequer. Impressionante!", emoji: "🔥", timestamp: "Há 5 horas", likes: 15, liked: false, comments: 5 },
    { id: "f4", type: "level_up", user: { name: "Maria Santos", avatar: "👩", role: "Atendente" }, title: "Subiu para Nível 5: Expert! ⭐", description: "Com 5.000 XP acumulados, Maria alcançou o nível Expert. Próxima meta: 8.000 XP.", emoji: "⬆️", timestamp: "Há 6 horas", likes: 10, liked: false, comments: 1 },
    { id: "f5", type: "shoutout", user: { name: "Gestor", avatar: "👔", role: "Gerente" }, title: "Parabéns equipe da manhã! 🌟", description: "O turno da manhã alcançou 98% de conformidade esta semana. Vocês são incríveis!", emoji: "🌟", timestamp: "Há 1 dia", likes: 22, liked: true, comments: 8 },
    { id: "f6", type: "badge", user: { name: "Pedro Costa", avatar: "🧑", role: "Auxiliar Geral" }, title: "Badge: Speed Demon ⚡", description: "Completou 10 checklists em menos da metade do tempo estimado. Rápido e preciso!", emoji: "⚡", timestamp: "Há 1 dia", likes: 6, liked: false, comments: 1 },
    { id: "f7", type: "milestone", user: { name: "Ana Souza", avatar: "👩‍🍳", role: "Sub-chef" }, title: "3.000 XP acumulados! 🎮", description: "Ana continua subindo no ranking. Atualmente em 2° lugar geral!", emoji: "🎮", timestamp: "Há 2 dias", likes: 9, liked: false, comments: 2 },
];

const typeConfig = {
    milestone: { color: "from-amber-500 to-orange-500", icon: Trophy, bgLight: "bg-amber-50 dark:bg-amber-950/30" },
    badge: { color: "from-violet-500 to-purple-500", icon: Award, bgLight: "bg-violet-50 dark:bg-violet-950/30" },
    streak: { color: "from-red-500 to-orange-500", icon: Flame, bgLight: "bg-red-50 dark:bg-red-950/30" },
    shoutout: { color: "from-pink-500 to-rose-500", icon: Star, bgLight: "bg-pink-50 dark:bg-pink-950/30" },
    level_up: { color: "from-cyan-500 to-blue-500", icon: Sparkles, bgLight: "bg-cyan-50 dark:bg-cyan-950/30" },
};

export function RecognitionWall() {
    const [items, setItems] = useState(feedItems);
    const [filter, setFilter] = useState<"all" | "milestone" | "badge" | "streak" | "shoutout">("all");
    const [newShoutout, setNewShoutout] = useState("");
    const [showShoutout, setShowShoutout] = useState(false);

    const toggleLike = (id: string) => {
        setItems((prev) => prev.map((item) => item.id === id ? { ...item, liked: !item.liked, likes: item.liked ? item.likes - 1 : item.likes + 1 } : item));
    };

    const filtered = items.filter((i) => filter === "all" || i.type === filter);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Crown className="w-5 h-5 text-white" />
                        </div>
                        Mural de Reconhecimento
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">Celebre as conquistas da equipe!</p>
                </div>
                <button
                    onClick={() => setShowShoutout(!showShoutout)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-semibold hover:from-pink-600 hover:to-rose-600 transition-all"
                >
                    <Star className="w-4 h-4" />
                    Reconhecer Alguém
                </button>
            </div>

            {/* Shoutout Form */}
            <AnimatePresence>
                {showShoutout && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 rounded-2xl p-5 border border-pink-200 dark:border-pink-800">
                            <textarea
                                value={newShoutout}
                                onChange={(e) => setNewShoutout(e.target.value)}
                                placeholder="Reconheça alguém da equipe... Ex: 'Parabéns Maria pela dedicação excepcional hoje!'"
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-pink-200 dark:border-pink-800 bg-white dark:bg-zinc-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-500"
                            />
                            <div className="flex justify-end mt-3">
                                <button
                                    onClick={() => { setShowShoutout(false); setNewShoutout(""); }}
                                    className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-xl text-sm font-semibold hover:bg-pink-600 transition-all"
                                >
                                    <Send className="w-4 h-4" /> Publicar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {[
                    { id: "all" as const, label: "Todos", emoji: "📋" },
                    { id: "milestone" as const, label: "Conquistas", emoji: "🏆" },
                    { id: "badge" as const, label: "Badges", emoji: "🏅" },
                    { id: "streak" as const, label: "Streaks", emoji: "🔥" },
                    { id: "shoutout" as const, label: "Destaques", emoji: "🌟" },
                ].map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 flex items-center gap-1.5",
                            filter === f.id ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                        )}
                    >
                        {f.emoji} {f.label}
                    </button>
                ))}
            </div>

            {/* Feed */}
            <div className="space-y-4">
                {filtered.map((item, i) => {
                    const config = typeConfig[item.type];
                    const Icon = config.icon;

                    return (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden"
                        >
                            {/* Colored accent bar */}
                            <div className={cn("h-1 bg-gradient-to-r", config.color)} />

                            <div className="p-5">
                                {/* Author */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl">
                                        {item.user.avatar}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-zinc-900 dark:text-zinc-50">{item.user.name}</p>
                                        <p className="text-[10px] text-zinc-400">{item.user.role} • {item.timestamp}</p>
                                    </div>
                                    <div className={cn("ml-auto w-9 h-9 rounded-lg flex items-center justify-center", config.bgLight)}>
                                        <Icon className={cn("w-5 h-5")} style={{ color: config.color.includes("amber") ? "#f59e0b" : config.color.includes("violet") ? "#8b5cf6" : config.color.includes("red") ? "#ef4444" : config.color.includes("pink") ? "#ec4899" : "#06b6d4" }} />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className={cn("rounded-xl p-4 mb-4", config.bgLight)}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-2xl">{item.emoji}</span>
                                        <h4 className="font-bold text-zinc-900 dark:text-zinc-50">{item.title}</h4>
                                    </div>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.description}</p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-6">
                                    <button
                                        onClick={() => toggleLike(item.id)}
                                        className={cn("flex items-center gap-1.5 text-sm font-medium transition-all",
                                            item.liked ? "text-red-500" : "text-zinc-400 hover:text-red-500"
                                        )}
                                    >
                                        <Heart className={cn("w-4 h-4", item.liked && "fill-red-500")} />
                                        {item.likes}
                                    </button>
                                    <button className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-blue-500 transition-all">
                                        <MessageCircle className="w-4 h-4" />
                                        {item.comments}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
