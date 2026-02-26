"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowRightLeft, Clock, AlertTriangle, CheckCircle2,
    ChevronRight, MessageSquare, Camera, Send, Pen,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HandoffItem {
    id: string;
    type: "pending" | "issue" | "note" | "completed";
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    area: string;
    photo?: string;
    timestamp: string;
}

const mockHandoffItems: HandoffItem[] = [
    { id: "h1", type: "pending", title: "Checklist Fechamento — Cozinha", description: "Faltam 3 perguntas para completar. Cooktop foi desligado mas geladeira industrial precisa verificar.", priority: "high", area: "Cozinha", timestamp: "21:45" },
    { id: "h2", type: "issue", title: "Ralo da cozinha entupido", description: "Ralo perto da área de preparo está lento. Maintenance avisada, previsão de reparo amanhã 8h.", priority: "high", area: "Cozinha", timestamp: "20:30" },
    { id: "h3", type: "note", title: "Entrega de fornecedor amanhã", description: "Laticínios Bom Gosto entrega às 7h. Conferir 50kg queijo mozzarella + 30L leite integral.", priority: "medium", area: "Estoque", timestamp: "19:15" },
    { id: "h4", type: "completed", title: "Limpeza do salão", description: "Salão completo, mesas higienizadas, cadeiras organizadas.", priority: "low", area: "Salão", timestamp: "21:30" },
    { id: "h5", type: "issue", title: "Câmara fria com temperatura instável", description: "Temperatura oscilando entre 4.5°C e 5.2°C. Técnico chamado. Monitorar pela manhã.", priority: "high", area: "Cozinha", timestamp: "20:00" },
    { id: "h6", type: "note", title: "Cliente VIP confirmado para amanhã", description: "Mesa 12 reservada para 12h30. Prato especial: risotto de cogumelos sem glúten.", priority: "medium", area: "Salão", timestamp: "18:45" },
];

const typeConfig = {
    pending: { icon: Clock, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30", label: "Pendente" },
    issue: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30", label: "Problema" },
    note: { icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30", label: "Nota" },
    completed: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", label: "Concluído" },
};

const priorityConfig = {
    high: { color: "bg-red-500", label: "Alta" },
    medium: { color: "bg-amber-500", label: "Média" },
    low: { color: "bg-emerald-500", label: "Baixa" },
};

export function ShiftHandoff() {
    const [view, setView] = useState<"receive" | "send">("receive");
    const [items, setItems] = useState<HandoffItem[]>(mockHandoffItems);
    const [acknowledged, setAcknowledged] = useState<string[]>([]);
    const [newNote, setNewNote] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);

    const handleAcknowledge = (id: string) => {
        setAcknowledged((prev) => [...prev, id]);
    };

    const handleAcknowledgeAll = () => {
        setAcknowledged(items.map((i) => i.id));
    };

    const handleAddNote = () => {
        if (!newNote.trim()) return;
        const newItem: HandoffItem = {
            id: `h${Date.now()}`,
            type: "note",
            title: "Nota do turno",
            description: newNote,
            priority: "medium",
            area: "Geral",
            timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        };
        setItems([newItem, ...items]);
        setNewNote("");
        setShowAddForm(false);
    };

    const pendingItems = items.filter((i) => i.type === "pending" || i.type === "issue");
    const allItems = items;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            <ArrowRightLeft className="w-5 h-5 text-white" />
                        </div>
                        Troca de Turno
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">Handoff digital entre turnos</p>
                </div>
            </div>

            {/* Toggle View */}
            <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1">
                <button
                    onClick={() => setView("receive")}
                    className={cn("flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2",
                        view === "receive" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm" : "text-zinc-500"
                    )}
                >
                    📥 Receber Turno
                </button>
                <button
                    onClick={() => setView("send")}
                    className={cn("flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2",
                        view === "send" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm" : "text-zinc-500"
                    )}
                >
                    📤 Passar Turno
                </button>
            </div>

            <AnimatePresence mode="wait">
                {view === "receive" ? (
                    <motion.div key="receive" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                        {/* Incoming shift summary */}
                        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 rounded-2xl p-5 border border-cyan-200 dark:border-cyan-800">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Turno Anterior: Noite (22h – 06h)</p>
                                    <p className="text-sm text-zinc-500 mt-0.5">Registrado por <strong>Roberto Lima</strong> às 05:45</p>
                                </div>
                                <button
                                    onClick={handleAcknowledgeAll}
                                    disabled={acknowledged.length === items.length}
                                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-xl text-xs font-semibold hover:bg-cyan-600 disabled:opacity-50 transition-all"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Ciente de Tudo
                                </button>
                            </div>

                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    { label: "Pendências", count: pendingItems.filter((i) => i.type === "pending").length, color: "text-amber-600", emoji: "⏳" },
                                    { label: "Problemas", count: pendingItems.filter((i) => i.type === "issue").length, color: "text-red-600", emoji: "⚠️" },
                                    { label: "Notas", count: items.filter((i) => i.type === "note").length, color: "text-blue-600", emoji: "📝" },
                                    { label: "Concluídos", count: items.filter((i) => i.type === "completed").length, color: "text-emerald-600", emoji: "✅" },
                                ].map((stat) => (
                                    <div key={stat.label} className="bg-white/60 dark:bg-zinc-800/60 rounded-xl p-3 text-center">
                                        <span className="text-xl block">{stat.emoji}</span>
                                        <p className={cn("text-xl font-black", stat.color)}>{stat.count}</p>
                                        <p className="text-[10px] text-zinc-400">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="space-y-2">
                            {items.map((item, i) => {
                                const config = typeConfig[item.type];
                                const pConfig = priorityConfig[item.priority];
                                const Icon = config.icon;
                                const isAcked = acknowledged.includes(item.id);

                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                        className={cn(
                                            "bg-white dark:bg-zinc-950 rounded-xl border p-4 transition-all",
                                            isAcked ? "border-emerald-200 dark:border-emerald-800 opacity-60" : "border-zinc-100 dark:border-zinc-800"
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", config.bg)}>
                                                <Icon className={cn("w-5 h-5", config.color)} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">{item.title}</h4>
                                                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", config.bg, config.color)}>{config.label}</span>
                                                    <div className={cn("w-2 h-2 rounded-full shrink-0", pConfig.color)} title={`Prioridade: ${pConfig.label}`} />
                                                </div>
                                                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.description}</p>
                                                <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-400">
                                                    <span>📍 {item.area}</span>
                                                    <span>🕐 {item.timestamp}</span>
                                                </div>
                                            </div>
                                            {!isAcked && (
                                                <button
                                                    onClick={() => handleAcknowledge(item.id)}
                                                    className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all shrink-0"
                                                >
                                                    Ciente ✓
                                                </button>
                                            )}
                                            {isAcked && (
                                                <span className="text-emerald-500 text-[10px] font-bold shrink-0">✓ Ciente</span>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="send" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                        {/* Add Note Form */}
                        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-5">
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm mb-4 flex items-center gap-2">
                                <Pen className="w-4 h-4 text-zinc-400" />
                                Registrar Ocorrência para o Próximo Turno
                            </h3>

                            {showAddForm ? (
                                <div className="space-y-3">
                                    <textarea
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder="Descreva pendências, problemas ou notas importantes..."
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                    <div className="flex items-center gap-2">
                                        <button onClick={handleAddNote} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-xl text-sm font-semibold hover:bg-cyan-600 transition-all">
                                            <Send className="w-4 h-4" /> Registrar
                                        </button>
                                        <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-zinc-400 text-sm">Cancelar</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { label: "Pendência", icon: "⏳", type: "pending" },
                                        { label: "Problema", icon: "⚠️", type: "issue" },
                                        { label: "Nota Geral", icon: "📝", type: "note" },
                                    ].map((btn) => (
                                        <button
                                            key={btn.type}
                                            onClick={() => setShowAddForm(true)}
                                            className="flex items-center justify-center gap-2 py-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-cyan-400 dark:hover:border-cyan-700 transition-all text-sm font-medium text-zinc-600 dark:text-zinc-400"
                                        >
                                            <span className="text-xl">{btn.icon}</span>
                                            {btn.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Current Shift Summary */}
                        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-5">
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm mb-4">Resumo do Seu Turno</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: "Checklists completados", value: "5/6", color: "text-emerald-500" },
                                    { label: "Score médio", value: "92", color: "text-amber-500" },
                                    { label: "Registros feitos", value: String(items.length), color: "text-blue-500" },
                                    { label: "Tempo no turno", value: "7h45m", color: "text-zinc-500" },
                                ].map((stat) => (
                                    <div key={stat.label} className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-3">
                                        <p className={cn("text-xl font-black", stat.color)}>{stat.value}</p>
                                        <p className="text-[10px] text-zinc-400">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
