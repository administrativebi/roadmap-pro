"use client";

import { motion } from "framer-motion";
import { Swords, User, Zap, Trophy, Flame, ChevronRight, Search, Play, X, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function DuelsPage() {
    const supabase = createClient();
    const [activeTab, setActiveTab] = useState("active");
    const [profileId, setProfileId] = useState<string | null>(null);
    const [invites, setInvites] = useState<any[]>([]);
    const [activeDuels, setActiveDuels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal Create Duel
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [checklists, setChecklists] = useState<any[]>([]);
    const [newDuel, setNewDuel] = useState({ opponent: '', checklist: '', wager: 100 });

    useEffect(() => {
        fetchDuels();
    }, []);

    const fetchDuels = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setProfileId(user.id);

            // Buscando Duelos
            // O select precisa dos dados do challenger, challenged e checklist
            const { data: duelsData } = await supabase
                .from('duels')
                .select(`
                    id, 
                    status, 
                    wager_xp, 
                    challenger_progress, 
                    challenger_score,
                    challenged_progress,
                    challenged_score,
                    challenger:profiles!challenger_id(id, name),
                    challenged:profiles!challenged_id(id, name),
                    checklist:checklist_templates(title)
                `)
                .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`);

            if (duelsData) {
                // Pendentes convidados a "Mim"
                const myInvites = duelsData.filter((d: any) => d.status === 'pending' && d.challenged.id === user.id);
                setInvites(myInvites);

                // Ativos (que eu participo)
                const active = duelsData.filter((d: any) => d.status === 'active');
                setActiveDuels(active);
            }

            // Options do Modal
            const { data: profiles } = await supabase.from('profiles').select('id, name').neq('id', user.id);
            if (profiles) setUsers(profiles);

            const { data: tmpl } = await supabase.from('checklist_templates').select('id, title');
            if (tmpl) setChecklists(tmpl);

        } catch (e) {
            console.error("Erro ao carregar duelos", e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDuel = async () => {
        if (!newDuel.opponent || !newDuel.checklist || !profileId) return;
        try {
            await supabase.from('duels').insert({
                challenger_id: profileId,
                challenged_id: newDuel.opponent,
                checklist_id: newDuel.checklist,
                wager_xp: newDuel.wager,
                status: 'pending'
            });
            setShowCreateModal(false);
            setNewDuel({ opponent: '', checklist: '', wager: 100 });
            alert("Desafio enviado!");
            fetchDuels();
        } catch (e) {
            console.error(e);
            alert("Erro ao criar desafio");
        }
    };

    const handleAccept = async (duelId: string) => {
        try {
            await supabase.from('duels').update({ status: 'active' }).eq('id', duelId);
            fetchDuels();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDecline = async (duelId: string) => {
        try {
            await supabase.from('duels').update({ status: 'declined' }).eq('id', duelId);
            fetchDuels();
        } catch (e) {
            console.error(e);
        }
    };

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

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-rose-500 to-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2"
                >
                    <Swords className="w-5 h-5" />
                    Desafiar Colega
                </button>
            </div>

            {/* CREATE DUEL MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg flex items-center gap-2"><Swords className="w-5 h-5 text-rose-500" /> Novo Duelo</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-zinc-500 mb-1 block">Escolha seu Adversário</label>
                                <select
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                                    value={newDuel.opponent}
                                    onChange={e => setNewDuel({ ...newDuel, opponent: e.target.value })}
                                >
                                    <option value="">Selecione um colega...</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-zinc-500 mb-1 block">Checklist da Disputa</label>
                                <select
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                                    value={newDuel.checklist}
                                    onChange={e => setNewDuel({ ...newDuel, checklist: e.target.value })}
                                >
                                    <option value="">Selecione o checklist...</option>
                                    {checklists.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-zinc-500 mb-1 block">Aposta de XP</label>
                                <input
                                    type="number"
                                    min={10}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                                    value={newDuel.wager}
                                    onChange={e => setNewDuel({ ...newDuel, wager: parseInt(e.target.value) || 0 })}
                                />
                                <p className="text-[10px] text-zinc-400 mt-1">O Vencedor leva o dobro!</p>
                            </div>

                            <button
                                onClick={handleCreateDuel}
                                disabled={!newDuel.opponent || !newDuel.checklist || newDuel.wager <= 0}
                                className="w-full mt-4 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold py-3 rounded-xl disabled:opacity-50"
                            >
                                Enviar Desafio
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Content - Duels */}
                <div className="lg:col-span-2 space-y-6">

                    {invites.length > 0 && (
                        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6 shadow-sm">
                            <h2 className="font-bold text-zinc-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
                                <Flame className="w-5 h-5 text-orange-500" />
                                Convites Pendentes
                            </h2>
                            <div className="space-y-3">
                                {invites.map((invite: any) => (
                                    <div key={invite.id} className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-bold text-white shadow-sm">
                                                {invite.challenger?.name ? invite.challenger.name.substring(0, 2).toUpperCase() : '??'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">
                                                    {invite.challenger?.name} desafiou você!
                                                </p>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                    Checklist: {invite.checklist?.title}
                                                </p>
                                                <div className="flex items-center gap-1 mt-1 font-bold text-amber-600 dark:text-amber-500 text-xs">
                                                    <Zap className="w-3 h-3 fill-amber-500" />
                                                    Aposta: {invite.wager_xp} XP
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleDecline(invite.id)} className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-colors">
                                                <X className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleAccept(invite.id)} className="px-4 h-10 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold text-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
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
                            {loading && <p className="text-zinc-500 text-center animate-pulse py-4">Carregando duelos...</p>}
                            {!loading && activeDuels.length === 0 && (
                                <div className="text-center p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400">
                                    Nenhum duelo ativo. Desafie alguém usando o botão acima!
                                </div>
                            )}
                            {activeDuels.map((duel: any) => {
                                const isChallenger = duel.challenger?.id === profileId;
                                const myProgress = isChallenger ? duel.challenger_progress : duel.challenged_progress;
                                const myScore = isChallenger ? duel.challenger_score : duel.challenged_score;
                                const oppProgress = isChallenger ? duel.challenged_progress : duel.challenger_progress;
                                const oppScore = isChallenger ? duel.challenged_score : duel.challenger_score;
                                const oppName = isChallenger ? duel.challenged?.name : duel.challenger?.name;
                                const oppAvatar = oppName ? oppName.substring(0, 2).toUpperCase() : '??';

                                return (
                                    <div key={duel.id} className="relative z-0">
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-rose-500 opacity-5 blur-xl rounded-2xl" />
                                        <div className="relative z-10 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{duel.checklist?.title || 'Checklist'}</h3>
                                                    <p className="text-xs text-zinc-500">Valendo: <span className="text-amber-500 font-bold">{duel.wager_xp * 2} XP</span></p>
                                                </div>
                                                <button className="w-10 h-10 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors tooltip" title="Iniciar execução na arena (em breve)">
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
                                                            <span className="text-zinc-500">{myScore} pts ({myProgress}%)</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${myProgress}%` }}
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
                                                        {oppAvatar}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between text-xs font-bold mb-1">
                                                            <span className="text-rose-600 dark:text-rose-400">{oppName}</span>
                                                            <span className="text-zinc-500">{oppScore} pts ({oppProgress}%)</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${oppProgress}%` }}
                                                                className="h-full bg-rose-500 rounded-full"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                );
                            })}
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
