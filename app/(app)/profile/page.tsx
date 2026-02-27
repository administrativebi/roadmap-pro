"use client";

import { motion } from "framer-motion";
import { User, Shield, Trophy, Star, Medal, Crown, Zap, Gift, ShieldAlert, Sparkles, Target, Palette } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const BADGES_DICTIONARY = [
    { id: "primeiros_passos", name: "Primeiros Passos", desc: "Completou o primeiro checklist", icon: "🚀", color: "from-blue-400 to-blue-600" },
    { id: "fogo_diario", name: "Fogo Diário", desc: "5 dias seguidos", icon: "🔥", color: "from-orange-400 to-red-600" },
    { id: "visao_laser", name: "Visão Laser", desc: "Zero não conformidades em 1 semana", icon: "👁️", color: "from-emerald-400 to-green-600" },
    { id: "centuriao", name: "Centurião", desc: "100 checklists completados", icon: "💯", color: "from-purple-400 to-indigo-600" },
    { id: "mestre_appcc", name: "Mestre APPCC", desc: "Score 100% em Segurança Alimentar", icon: "🛡️", color: "from-amber-400 to-orange-600" },
];

export default function ProfilePage() {
    const [shieldActive, setShieldActive] = useState(false);
    const [avatarAccessory, setAvatarAccessory] = useState("none");
    const [profile, setProfile] = useState<any>(null);
    const [unlockedBadges, setUnlockedBadges] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const supabase = createClient();

    const fetchProfileData = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Busca Perfil
            const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (prof) {
                setProfile(prof);
                setShieldActive(prof.streak_shield_available || false);
                setAvatarAccessory(prof.avatar_url?.includes('crown') ? 'crown' : prof.avatar_url?.includes('glasses') ? 'glasses' : 'none');
            }

            // Busca Badges desbloqueados
            const { data: userBadges } = await supabase.from('user_badges').select('*').eq('user_id', user.id);
            if (userBadges) {
                setUnlockedBadges(userBadges);
            }
        } catch (e) {
            console.error("Erro ao carregar perfil:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, [supabase]);

    const useShield = async () => {
        if (!profile) return;
        setShieldActive(true);
        await supabase.from('profiles').update({ streak_shield_available: true }).eq('id', profile.id);
    };

    const updateAvatarAccessory = async (acc: string) => {
        if (!profile) return;
        setAvatarAccessory(acc);
        // Simulando que o avatar_url no banco serve como configuração do avatar customizado
        await supabase.from('profiles').update({ avatar_url: `avatar_${acc}` }).eq('id', profile.id);
    };

    if (isLoading) return <div className="p-10 text-center animate-pulse">Carregando perfil...</div>;

    // Merge dictionary with user unlocked state
    const displayBadges = BADGES_DICTIONARY.map(def => {
        const found = unlockedBadges.find(ub => ub.badge_id === def.id);
        return {
            ...def,
            unlocked: !!found,
            date: found ? new Date(found.unlocked_at).toLocaleDateString() : null
        };
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 max-w-5xl mx-auto"
        >
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Meu Perfil
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                    Gerencie seu avatar, vitrine de conquistas e progresso na temporada
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* 5. Avatar Customizável */}
                <div className="md:col-span-1 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 overflow-hidden shadow-sm flex flex-col">
                    <div className="h-32 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 relative">
                        <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1">
                            Nível {profile?.level || 1} <Star className="w-3 h-3 fill-white" />
                        </div>
                    </div>
                    <div className="px-6 pb-6 pt-0 flex-1 flex flex-col items-center">
                        <div className="relative -mt-16 mb-4">
                            <motion.div
                                className="w-32 h-32 rounded-full border-4 border-white dark:border-zinc-950 bg-gradient-to-b from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center text-6xl shadow-xl relative"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            >
                                {/* Avatar Base */}
                                👤
                                {/* Accessórios Baseados no Nível/Ecolha */}
                                {avatarAccessory === "crown" && (
                                    <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute -top-6 text-5xl">👑</motion.div>
                                )}
                                {avatarAccessory === "glasses" && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-8 text-5xl">🕶️</motion.div>
                                )}
                            </motion.div>
                        </div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{profile?.name || profile?.full_name || "Sem Nome"}</h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">{profile?.role || "Membro da Equipe"}</p>

                        <div className="w-full bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-2 mb-3 text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                <Palette className="w-4 h-4 text-violet-500" />
                                Estilizar Avatar
                            </div>
                            <div className="flex justify-center gap-3">
                                <button onClick={() => updateAvatarAccessory('none')} className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all", avatarAccessory === 'none' ? "bg-violet-100 dark:bg-violet-900/40 border-2 border-violet-500" : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-violet-300")}>👤</button>
                                <button onClick={() => updateAvatarAccessory('glasses')} className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all", avatarAccessory === 'glasses' ? "bg-violet-100 dark:bg-violet-900/40 border-2 border-violet-500" : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-violet-300")}>🕶️</button>
                                <button onClick={() => updateAvatarAccessory('crown')} disabled={(profile?.level || 1) < 5} className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all", avatarAccessory === 'crown' ? "bg-violet-100 dark:bg-violet-900/40 border-2 border-violet-500" : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-violet-300 disabled:opacity-50 disabled:grayscale")}>👑</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                    {/* 6. Streak Protection */}
                    <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-indigo-500/20">
                        {/* Background Decor */}
                        <ShieldAlert className="absolute -right-6 -top-6 w-32 h-32 text-white/10 rotate-12" />

                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Shield className="w-6 h-6 text-blue-200" />
                                    <h2 className="text-xl font-bold">Escudo de Streak</h2>
                                </div>
                                <p className="text-indigo-100 text-sm max-w-md">
                                    O escudo protege sua sequência perfeita caso você falte um dia. Renova todo domingo.
                                </p>
                            </div>
                            <button
                                onClick={useShield}
                                disabled={shieldActive}
                                className={cn(
                                    "whitespace-nowrap px-6 py-3 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2",
                                    shieldActive
                                        ? "bg-indigo-400/50 text-indigo-100 cursor-not-allowed border border-white/10"
                                        : "bg-white text-indigo-600 hover:bg-zinc-50 hover:scale-105 active:scale-95"
                                )}
                            >
                                {shieldActive ? (
                                    <>Proteção Ativa ✓</>
                                ) : (
                                    <><Shield className="w-4 h-4" /> Ativar Proteção</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* 3. Liga / Temporadas */}
                    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                                    <Trophy className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-zinc-900 dark:text-zinc-50">Temporada Atual: Liga de Prata</h2>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Termina em 12 dias</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">#4</p>
                                <p className="text-xs font-medium text-emerald-500">Subindo ▲</p>
                            </div>
                        </div>

                        <div className="relative pt-8 pb-4">
                            {/* Linha da Liga */}
                            <div className="absolute top-1/2 left-0 w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full -translate-y-1/2" />
                            <div className="absolute top-1/2 left-0 w-[50%] h-1.5 bg-gradient-to-r from-zinc-300 via-zinc-400 to-amber-500 rounded-full -translate-y-1/2" />

                            {/* Posições */}
                            <div className="relative flex justify-between">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 border-4 border-white dark:border-zinc-950 flex items-center justify-center shadow-sm z-10 text-xs font-bold text-zinc-500">B</div>
                                    <span className="text-[10px] font-bold text-zinc-500 mt-2">Bronze</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-400 border-4 border-white dark:border-zinc-950 flex items-center justify-center shadow-lg z-10">
                                        <Trophy className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-xs font-black text-zinc-700 dark:text-zinc-300 mt-2">PRATA</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 border-4 border-white dark:border-zinc-950 flex items-center justify-center shadow-sm z-10 text-xs font-bold text-zinc-400">O</div>
                                    <span className="text-[10px] font-bold text-zinc-400 mt-2">Ouro</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-4">
                            Você tem <strong className="text-indigo-500 font-black">{profile?.total_xp || 0} XP</strong> totais ganhos.
                        </p>
                    </div>
                </div>

                {/* 1. Badges / Conquistas */}
                <div className="md:col-span-3 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500">
                                <Medal className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-zinc-900 dark:text-zinc-50">Vitrine de Conquistas</h2>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">{unlockedBadges.length} de {BADGES_DICTIONARY.length} badges desbloqueadas</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {displayBadges.map((badge) => (
                            <div
                                key={badge.id}
                                className={cn(
                                    "relative p-4 rounded-2xl border flex flex-col items-center text-center transition-all",
                                    badge.unlocked
                                        ? "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:scale-105 cursor-pointer"
                                        : "bg-transparent border-dashed border-zinc-200 dark:border-zinc-800 opacity-60 grayscale"
                                )}
                            >
                                <div className={cn(
                                    "w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3 shadow-inner relative",
                                    badge.unlocked ? `bg-gradient-to-br ${badge.color} text-white` : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                                )}>
                                    {badge.icon}
                                    {badge.unlocked && (
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center border-2 border-zinc-50 dark:border-zinc-900 shadow-sm">
                                            <Sparkles className="w-3 h-3 text-amber-500" />
                                        </div>
                                    )}
                                </div>
                                <h3 className={cn("text-xs font-bold leading-tight mb-1", badge.unlocked ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-400")}>
                                    {badge.name}
                                </h3>
                                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                    {badge.desc}
                                </p>
                                {badge.unlocked && badge.date && (
                                    <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400 mt-2 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                        {badge.date}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </motion.div>
    );
}
