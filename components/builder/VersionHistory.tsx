"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    X, History, GitBranch, ArrowRight, Eye,
    RotateCcw, Clock, User, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Version {
    id: string;
    version: string;
    date: string;
    author: string;
    changes: string[];
    questionsAdded: number;
    questionsRemoved: number;
    questionsModified: number;
    isCurrent: boolean;
}

const versions: Version[] = [
    { id: "v6", version: "v3.2", date: "Hoje, 10:30", author: "Gestor", changes: ["Adicionou peso 5 à temperatura da câmara fria", "Incluiu foto de referência na pergunta de higienização"], questionsAdded: 0, questionsRemoved: 0, questionsModified: 2, isCurrent: true },
    { id: "v5", version: "v3.1", date: "Ontem, 14:15", author: "Gestor", changes: ["Adicionou seção 'Estoque e FIFO' com 4 perguntas", "Reorganizou ordem das seções"], questionsAdded: 4, questionsRemoved: 0, questionsModified: 0, isCurrent: false },
    { id: "v4", version: "v3.0", date: "22/02/2026", author: "Admin", changes: ["Reformulação completa: nova estrutura de seções", "Adicionou lógica condicional em 3 perguntas", "Removeu perguntas redundantes"], questionsAdded: 5, questionsRemoved: 3, questionsModified: 8, isCurrent: false },
    { id: "v3", version: "v2.2", date: "15/02/2026", author: "Gestor", changes: ["Ajustou texto de 2 perguntas para maior clareza"], questionsAdded: 0, questionsRemoved: 0, questionsModified: 2, isCurrent: false },
    { id: "v2", version: "v2.1", date: "10/02/2026", author: "Admin", changes: ["Adicionou perguntas de controle de pragas", "Incluiu vídeo de treinamento no controle de temperatura"], questionsAdded: 2, questionsRemoved: 0, questionsModified: 1, isCurrent: false },
    { id: "v1", version: "v2.0", date: "01/02/2026", author: "Admin", changes: ["Versão inicial do novo modelo de checklist", "22 perguntas em 3 seções"], questionsAdded: 22, questionsRemoved: 0, questionsModified: 0, isCurrent: false },
];

interface VersionHistoryProps {
    onClose: () => void;
}

export function VersionHistory({ onClose }: VersionHistoryProps) {
    const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="font-bold text-lg text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                            <History className="w-5 h-5 text-violet-500" /> Histórico de Versões
                        </h2>
                        <p className="text-xs text-zinc-400 mt-0.5">Registros anteriores são mantidos para auditoria</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Version Timeline */}
                <div className="flex-1 overflow-y-auto p-5">
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-700" />

                        <div className="space-y-4">
                            {versions.map((version, i) => (
                                <motion.div
                                    key={version.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="relative flex gap-4"
                                >
                                    {/* Timeline dot */}
                                    <div className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 border-4",
                                        version.isCurrent
                                            ? "bg-violet-500 border-violet-200 dark:border-violet-800"
                                            : "bg-zinc-100 dark:bg-zinc-800 border-white dark:border-zinc-900"
                                    )}>
                                        {version.isCurrent ? (
                                            <GitBranch className="w-5 h-5 text-white" />
                                        ) : (
                                            <span className="text-xs font-bold text-zinc-400">{version.version}</span>
                                        )}
                                    </div>

                                    {/* Version content */}
                                    <div className={cn(
                                        "flex-1 rounded-xl border p-4 transition-all",
                                        version.isCurrent
                                            ? "bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800"
                                            : "bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 hover:border-zinc-200 dark:hover:border-zinc-600"
                                    )}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">{version.version}</h4>
                                                {version.isCurrent && (
                                                    <span className="text-[10px] px-2 py-0.5 bg-violet-500 text-white rounded-full font-bold">ATUAL</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] text-zinc-400">
                                                <span className="flex items-center gap-1"><User className="w-3 h-3" /> {version.author}</span>
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {version.date}</span>
                                            </div>
                                        </div>

                                        {/* Changes */}
                                        <div className="space-y-1 mb-3">
                                            {version.changes.map((change, ci) => (
                                                <p key={ci} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                                                    <ChevronRight className="w-3 h-3 text-zinc-300 shrink-0" />
                                                    {change}
                                                </p>
                                            ))}
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center gap-3">
                                            {version.questionsAdded > 0 && (
                                                <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full font-bold">
                                                    +{version.questionsAdded} adicionadas
                                                </span>
                                            )}
                                            {version.questionsRemoved > 0 && (
                                                <span className="text-[10px] px-2 py-0.5 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-full font-bold">
                                                    -{version.questionsRemoved} removidas
                                                </span>
                                            )}
                                            {version.questionsModified > 0 && (
                                                <span className="text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-full font-bold">
                                                    ~{version.questionsModified} modificadas
                                                </span>
                                            )}
                                            {!version.isCurrent && (
                                                <button className="ml-auto flex items-center gap-1 text-[10px] text-violet-500 hover:text-violet-600 font-semibold">
                                                    <RotateCcw className="w-3 h-3" /> Restaurar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
