"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    X, Copy, Plus, Search, Star, Building2,
    Clock, FileText, Layers, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Template {
    id: string;
    name: string;
    description: string;
    category: string;
    sectionsCount: number;
    questionsCount: number;
    estimatedTime: number;
    difficulty: "easy" | "medium" | "hard";
    usedBy: string[];
    rating: number;
    version: string;
    lastUpdated: string;
    icon: string;
}

const templates: Template[] = [
    { id: "t1", name: "Checklist de Abertura — Cozinha", description: "Verificação completa para início do turno na cozinha", category: "Operacional", sectionsCount: 4, questionsCount: 22, estimatedTime: 15, difficulty: "medium", usedBy: ["Matriz", "Filial 1"], rating: 4.8, version: "v3.2", lastUpdated: "Hoje, 10:30", icon: "🍳" },
    { id: "t2", name: "Checklist de Fechamento — Cozinha", description: "Procedimentos de encerramento do turno", category: "Operacional", sectionsCount: 3, questionsCount: 18, estimatedTime: 12, difficulty: "medium", usedBy: ["Matriz"], rating: 4.5, version: "v2.1", lastUpdated: "Ontem", icon: "🌙" },
    { id: "t3", name: "Checklist APPCC Diário", description: "Análise de perigos e pontos críticos de controle", category: "Segurança", sectionsCount: 5, questionsCount: 30, estimatedTime: 25, difficulty: "hard", usedBy: ["Matriz", "Filial 1", "Filial 2"], rating: 4.9, version: "v5.0", lastUpdated: "3 dias atrás", icon: "🛡️" },
    { id: "t4", name: "Inspeção do Salão", description: "Conferência de mesas, decoração e limpeza", category: "Operacional", sectionsCount: 2, questionsCount: 12, estimatedTime: 8, difficulty: "easy", usedBy: ["Matriz"], rating: 4.3, version: "v1.4", lastUpdated: "1 semana", icon: "🍽️" },
    { id: "t5", name: "Recebimento de Mercadoria", description: "Verificação na entrada de produtos e insumos", category: "Estoque", sectionsCount: 3, questionsCount: 15, estimatedTime: 20, difficulty: "medium", usedBy: ["Matriz", "Filial 1"], rating: 4.6, version: "v2.3", lastUpdated: "5 dias atrás", icon: "📦" },
    { id: "t6", name: "Auditoria Mensal ANVISA", description: "Checklist completo para preparação de auditoria", category: "Compliance", sectionsCount: 8, questionsCount: 60, estimatedTime: 45, difficulty: "hard", usedBy: ["Todas"], rating: 5.0, version: "v4.1", lastUpdated: "2 semanas", icon: "📋" },
];

const diffLabel = {
    easy: { label: "Fácil", color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" },
    medium: { label: "Médio", color: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400" },
    hard: { label: "Avançado", color: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400" },
};

interface TemplateManagerProps {
    onClose: () => void;
}

export function TemplateManager({ onClose }: TemplateManagerProps) {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [duplicated, setDuplicated] = useState<string | null>(null);

    const categories = ["all", ...Array.from(new Set(templates.map((t) => t.category)))];

    const filtered = templates.filter((t) => {
        const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
        const matchCat = category === "all" || t.category === category;
        return matchSearch && matchCat;
    });

    const handleDuplicate = (id: string) => {
        setDuplicated(id);
        setTimeout(() => setDuplicated(null), 2000);
    };

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
                className="w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="font-bold text-lg text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-orange-500" /> Templates de Checklists
                        </h2>
                        <p className="text-xs text-zinc-400 mt-0.5">Duplique e customize para qualquer unidade</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search & Filters */}
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                    <div className="relative mb-3">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar template..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize",
                                    category === cat ? "bg-orange-500 text-white" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                                )}
                            >
                                {cat === "all" ? "Todos" : cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Template List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {filtered.map((template) => {
                        const diff = diffLabel[template.difficulty];
                        return (
                            <div
                                key={template.id}
                                className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 border border-zinc-100 dark:border-zinc-700 hover:border-orange-200 dark:hover:border-orange-800 transition-all"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                                        {template.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">{template.name}</h4>
                                            <span className="text-[10px] text-zinc-400 font-mono">{template.version}</span>
                                        </div>
                                        <p className="text-xs text-zinc-500 mb-2">{template.description}</p>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", diff.color)}>{diff.label}</span>
                                            <span className="text-[10px] text-zinc-400"><FileText className="w-3 h-3 inline" /> {template.questionsCount} perguntas</span>
                                            <span className="text-[10px] text-zinc-400"><Layers className="w-3 h-3 inline" /> {template.sectionsCount} seções</span>
                                            <span className="text-[10px] text-zinc-400"><Clock className="w-3 h-3 inline" /> ~{template.estimatedTime}min</span>
                                            <span className="text-[10px] text-zinc-400"><Building2 className="w-3 h-3 inline" /> {template.usedBy.join(", ")}</span>
                                            <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5"><Star className="w-3 h-3 fill-amber-400" /> {template.rating}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDuplicate(template.id)}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0",
                                            duplicated === template.id
                                                ? "bg-emerald-500 text-white"
                                                : "bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900"
                                        )}
                                    >
                                        {duplicated === template.id ? <><Check className="w-3.5 h-3.5" /> Duplicado!</> : <><Copy className="w-3.5 h-3.5" /> Duplicar</>}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        </motion.div>
    );
}
