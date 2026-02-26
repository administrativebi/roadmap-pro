"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles, Users, Clock, RotateCcw, Check, ChevronDown,
    Zap, Award, AlertTriangle, CalendarDays, Shuffle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Collaborator {
    id: string;
    name: string;
    avatar: string;
    role: string;
    shift: "morning" | "afternoon" | "night";
    xp: number;
    completedToday: number;
    streak: number;
    specialties: string[];
    workload: number; // 0-100
}

interface ChecklistAssignment {
    checklistId: string;
    checklistName: string;
    icon: string;
    category: string;
    estimatedTime: string;
    difficulty: "easy" | "medium" | "hard";
    requiredSkills: string[];
    assignedTo?: Collaborator;
    reason?: string;
    confidence: number;
}

const collaborators: Collaborator[] = [
    { id: "c1", name: "Carlos Silva", avatar: "🧑‍🍳", role: "Cozinheiro Chefe", shift: "morning", xp: 2840, completedToday: 2, streak: 12, specialties: ["APPCC", "Cozinha", "Estoque"], workload: 45 },
    { id: "c2", name: "Ana Souza", avatar: "👩‍🍳", role: "Sub-chef", shift: "morning", xp: 2650, completedToday: 1, streak: 8, specialties: ["APPCC", "Limpeza", "Cozinha"], workload: 30 },
    { id: "c3", name: "Roberto Lima", avatar: "👨‍🍳", role: "Auxiliar de Cozinha", shift: "morning", xp: 2510, completedToday: 3, streak: 5, specialties: ["Limpeza", "Estoque"], workload: 70 },
    { id: "c4", name: "Maria Santos", avatar: "👩", role: "Atendente", shift: "afternoon", xp: 2380, completedToday: 0, streak: 3, specialties: ["Salão", "Atendimento"], workload: 15 },
    { id: "c5", name: "Pedro Costa", avatar: "🧑", role: "Auxiliar Geral", shift: "afternoon", xp: 2100, completedToday: 0, streak: 1, specialties: ["Limpeza", "Estoque", "Salão"], workload: 20 },
];

const pendingChecklists: ChecklistAssignment[] = [
    { checklistId: "ck1", checklistName: "Controle APPCC — Cozinha", icon: "🔬", category: "APPCC", estimatedTime: "15 min", difficulty: "hard", requiredSkills: ["APPCC", "Cozinha"], confidence: 95, reason: "Especialista em APPCC + menor carga horária" },
    { checklistId: "ck2", checklistName: "Limpeza Geral — Salão", icon: "🧹", category: "Limpeza", estimatedTime: "10 min", difficulty: "easy", requiredSkills: ["Limpeza", "Salão"], confidence: 88, reason: "Especialidade em salão + turno da tarde disponível" },
    { checklistId: "ck3", checklistName: "Verificação de Estoque", icon: "📦", category: "Estoque", estimatedTime: "12 min", difficulty: "medium", requiredSkills: ["Estoque"], confidence: 82, reason: "Experiência em estoque + carga baixa hoje" },
    { checklistId: "ck4", checklistName: "Fechamento Diário", icon: "🌙", category: "Operação", estimatedTime: "20 min", difficulty: "medium", requiredSkills: ["Salão", "Atendimento"], confidence: 78, reason: "Turno da tarde + menor QTD de checklists hoje" },
];

function getShiftLabel(shift: string) {
    switch (shift) {
        case "morning": return "☀️ Manhã";
        case "afternoon": return "🌅 Tarde";
        case "night": return "🌙 Noite";
        default: return shift;
    }
}

function getDifficultyBadge(d: string) {
    switch (d) {
        case "easy": return { label: "Fácil", color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" };
        case "medium": return { label: "Médio", color: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400" };
        case "hard": return { label: "Difícil", color: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400" };
        default: return { label: d, color: "bg-zinc-100 text-zinc-500" };
    }
}

export function SmartAssignment() {
    const [assignments, setAssignments] = useState<ChecklistAssignment[]>(pendingChecklists);
    const [autoMode, setAutoMode] = useState(true);
    const [showDetails, setShowDetails] = useState<string | null>(null);
    const [confirmed, setConfirmed] = useState<string[]>([]);

    // Simulate smart assignment
    const assignedMap: Record<string, Collaborator> = {
        ck1: collaborators[1], // Ana — APPCC expert, low workload
        ck2: collaborators[3], // Maria — Salão specialist, afternoon
        ck3: collaborators[4], // Pedro — Estoque, low workload
        ck4: collaborators[3], // Maria — afternoon shift
    };

    const handleConfirm = (checklistId: string) => {
        setConfirmed((prev) => [...prev, checklistId]);
    };

    const handleShuffle = (checklistId: string) => {
        // Simulate reassignment
        setAssignments((prev) => prev.map((a) => {
            if (a.checklistId === checklistId) {
                return { ...a, confidence: Math.max(60, a.confidence - 10), reason: "Redistribuído manualmente — próximo colaborador mais apto" };
            }
            return a;
        }));
    };

    const handleConfirmAll = () => {
        setConfirmed(assignments.map((a) => a.checklistId));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        Atribuição Inteligente
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">Checklists distribuídos automaticamente por IA</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setAutoMode(!autoMode)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                            autoMode ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                        )}
                    >
                        <Zap className={cn("w-4 h-4", autoMode && "animate-pulse")} />
                        {autoMode ? "Modo IA Ativo" : "Modo Manual"}
                    </button>
                    <button
                        onClick={handleConfirmAll}
                        disabled={confirmed.length === assignments.length}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-all"
                    >
                        <Check className="w-4 h-4" />
                        Confirmar Todos
                    </button>
                </div>
            </div>

            {/* Team Overview */}
            <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-5">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Equipe Disponível Agora</h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                    {collaborators.map((c) => (
                        <div key={c.id} className="flex-shrink-0 bg-zinc-50 dark:bg-zinc-900 rounded-xl p-3 min-w-[160px] border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">{c.avatar}</span>
                                <div>
                                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50">{c.name}</p>
                                    <p className="text-[10px] text-zinc-400">{c.role}</p>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-zinc-400">Carga</span>
                                    <span className={cn("font-bold", c.workload >= 70 ? "text-red-500" : c.workload >= 40 ? "text-amber-500" : "text-emerald-500")}>{c.workload}%</span>
                                </div>
                                <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full transition-all", c.workload >= 70 ? "bg-red-500" : c.workload >= 40 ? "bg-amber-500" : "bg-emerald-500")}
                                        style={{ width: `${c.workload}%` }}
                                    />
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                                    <span>{getShiftLabel(c.shift)}</span>
                                    <span>•</span>
                                    <span>🔥 {c.streak}d</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Assignment Cards */}
            <div className="space-y-3">
                {assignments.map((assignment, i) => {
                    const assigned = assignedMap[assignment.checklistId];
                    const isConfirmed = confirmed.includes(assignment.checklistId);
                    const isExpanded = showDetails === assignment.checklistId;
                    const diff = getDifficultyBadge(assignment.difficulty);

                    return (
                        <motion.div
                            key={assignment.checklistId}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className={cn(
                                "bg-white dark:bg-zinc-950 rounded-2xl border-2 overflow-hidden transition-all",
                                isConfirmed ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-950/10" : "border-zinc-100 dark:border-zinc-800"
                            )}
                        >
                            <div className="p-5 flex items-center gap-4">
                                <span className="text-3xl">{assignment.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">{assignment.checklistName}</h4>
                                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", diff.color)}>{diff.label}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                                        <span>⏱ {assignment.estimatedTime}</span>
                                        <span>📁 {assignment.category}</span>
                                        <span>🎯 {assignment.requiredSkills.join(", ")}</span>
                                    </div>
                                </div>

                                {/* Assigned Person */}
                                {assigned && (
                                    <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl px-4 py-2.5">
                                        <span className="text-xl">{assigned.avatar}</span>
                                        <div>
                                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{assigned.name}</p>
                                            <p className="text-[10px] text-zinc-400">{assigned.role}</p>
                                        </div>
                                        <div className="ml-2 flex items-center gap-1 bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 px-2 py-1 rounded-lg text-[10px] font-bold">
                                            <Sparkles className="w-3 h-3" />
                                            {assignment.confidence}% match
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {!isConfirmed ? (
                                        <>
                                            <button
                                                onClick={() => handleShuffle(assignment.checklistId)}
                                                className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                                                title="Redistribuir"
                                            >
                                                <Shuffle className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleConfirm(assignment.checklistId)}
                                                className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all"
                                                title="Confirmar"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                                            <Check className="w-4 h-4" /> Confirmado
                                        </span>
                                    )}
                                    <button
                                        onClick={() => setShowDetails(isExpanded ? null : assignment.checklistId)}
                                        className="p-2 text-zinc-400"
                                    >
                                        <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-5 pb-4 pt-0 border-t border-zinc-100 dark:border-zinc-800">
                                            <div className="bg-violet-50 dark:bg-violet-950/30 rounded-xl p-3 mt-3 flex items-start gap-2">
                                                <Sparkles className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 mb-0.5">MOTIVO DA ATRIBUIÇÃO (IA)</p>
                                                    <p className="text-xs text-violet-700 dark:text-violet-300">{assignment.reason}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
