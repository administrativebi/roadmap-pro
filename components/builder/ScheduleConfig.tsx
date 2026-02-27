"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Calendar, Clock, Repeat, Bell,
    ChevronDown, Check, CalendarDays,
    CalendarClock, Timer, Zap, Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ScheduleConfig {
    enabled: boolean;
    recurrence: "none" | "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";
    days_of_week: number[]; // 0=Dom, 1=Seg ... 6=Sab
    day_of_month: number | null;
    start_date: string;
    end_date: string;
    deadline_time: string;
    notify_before_minutes: number;
    auto_create: boolean;
}

const DEFAULT_SCHEDULE: ScheduleConfig = {
    enabled: false,
    recurrence: "none",
    days_of_week: [],
    day_of_month: null,
    start_date: "",
    end_date: "",
    deadline_time: "",
    notify_before_minutes: 60,
    auto_create: true,
};

const RECURRENCE_OPTIONS = [
    { value: "none", label: "Sem repetição", desc: "Aplicação única", icon: "📌" },
    { value: "daily", label: "Diário", desc: "Todos os dias", icon: "☀️" },
    { value: "weekly", label: "Semanal", desc: "Uma vez por semana", icon: "📅" },
    { value: "biweekly", label: "Quinzenal", desc: "A cada 15 dias", icon: "📆" },
    { value: "monthly", label: "Mensal", desc: "Uma vez por mês", icon: "🗓️" },
    { value: "quarterly", label: "Trimestral", desc: "A cada 3 meses", icon: "📊" },
    { value: "yearly", label: "Anual", desc: "Uma vez por ano", icon: "🎯" },
];

const WEEK_DAYS = [
    { value: 0, label: "Dom", short: "D" },
    { value: 1, label: "Seg", short: "S" },
    { value: 2, label: "Ter", short: "T" },
    { value: 3, label: "Qua", short: "Q" },
    { value: 4, label: "Qui", short: "Q" },
    { value: 5, label: "Sex", short: "S" },
    { value: 6, label: "Sáb", short: "S" },
];

const NOTIFY_OPTIONS = [
    { value: 0, label: "Sem notificação" },
    { value: 15, label: "15 min antes" },
    { value: 30, label: "30 min antes" },
    { value: 60, label: "1 hora antes" },
    { value: 120, label: "2 horas antes" },
    { value: 480, label: "8 horas antes" },
];

interface ScheduleConfigModalProps {
    config: ScheduleConfig;
    onChange: (config: ScheduleConfig) => void;
    onClose: () => void;
}

export function ScheduleConfigModal({ config, onChange, onClose }: ScheduleConfigModalProps) {
    const [local, setLocal] = useState<ScheduleConfig>({ ...DEFAULT_SCHEDULE, ...config });

    const update = (partial: Partial<ScheduleConfig>) => {
        setLocal(prev => ({ ...prev, ...partial }));
    };

    const handleSave = () => {
        onChange(local);
        onClose();
    };

    const toggleDay = (day: number) => {
        const current = local.days_of_week;
        const next = current.includes(day)
            ? current.filter(d => d !== day)
            : [...current, day].sort();
        update({ days_of_week: next });
    };

    const summaryText = () => {
        if (!local.enabled || local.recurrence === "none") return "Sem agendamento";
        const recLabel = RECURRENCE_OPTIONS.find(r => r.value === local.recurrence)?.label || "";
        const timeText = local.deadline_time ? ` às ${local.deadline_time}` : "";
        if (local.recurrence === "weekly" || local.recurrence === "biweekly") {
            const dayNames = local.days_of_week.map(d => WEEK_DAYS[d].label).join(", ");
            return `${recLabel} (${dayNames})${timeText}`;
        }
        if (local.recurrence === "monthly" && local.day_of_month) {
            return `${recLabel} (dia ${local.day_of_month})${timeText}`;
        }
        return `${recLabel}${timeText}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
                    <div>
                        <h2 className="font-bold text-lg text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                            <CalendarClock className="w-5 h-5 text-orange-500" /> Agendamento & Recorrência
                        </h2>
                        <p className="text-xs text-zinc-400 mt-0.5">Configure quando e com que frequência o checklist deve ser aplicado</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-6">
                    {/* Enable toggle */}
                    <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-950 rounded-xl flex items-center justify-center">
                                <Zap className="w-5 h-5 text-orange-500" />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Ativar Agendamento</p>
                                <p className="text-[10px] text-zinc-400">Definir regras de periodicidade e prazo</p>
                            </div>
                        </div>
                        <button
                            onClick={() => update({ enabled: !local.enabled })}
                            className={cn(
                                "w-12 h-7 rounded-full transition-all relative",
                                local.enabled ? "bg-orange-500" : "bg-zinc-300 dark:bg-zinc-600"
                            )}
                        >
                            <div className={cn(
                                "w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm",
                                local.enabled ? "left-6" : "left-1"
                            )} />
                        </button>
                    </div>

                    {local.enabled && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-5"
                        >
                            {/* Recurrence Type */}
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <Repeat className="w-3.5 h-3.5" /> Periodicidade
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {RECURRENCE_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => update({ recurrence: opt.value as any })}
                                            className={cn(
                                                "p-3 rounded-xl border text-left transition-all",
                                                local.recurrence === opt.value
                                                    ? "border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 ring-1 ring-orange-500/20"
                                                    : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-zinc-300"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{opt.icon}</span>
                                                <div>
                                                    <p className={cn(
                                                        "text-xs font-bold",
                                                        local.recurrence === opt.value ? "text-orange-600 dark:text-orange-400" : "text-zinc-700 dark:text-zinc-300"
                                                    )}>{opt.label}</p>
                                                    <p className="text-[10px] text-zinc-400">{opt.desc}</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Days of Week (for weekly/biweekly) */}
                            {(local.recurrence === "weekly" || local.recurrence === "biweekly") && (
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                        <CalendarDays className="w-3.5 h-3.5" /> Dias da Semana
                                    </label>
                                    <div className="flex gap-2">
                                        {WEEK_DAYS.map(day => (
                                            <button
                                                key={day.value}
                                                onClick={() => toggleDay(day.value)}
                                                className={cn(
                                                    "flex-1 py-3 rounded-xl border text-xs font-bold transition-all",
                                                    local.days_of_week.includes(day.value)
                                                        ? "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20"
                                                        : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500"
                                                )}
                                            >
                                                <div className="text-center">
                                                    <p>{day.short}</p>
                                                    <p className="text-[8px] opacity-70">{day.label}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Day of Month (for monthly) */}
                            {local.recurrence === "monthly" && (
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" /> Dia do Mês
                                    </label>
                                    <div className="grid grid-cols-7 gap-1.5">
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                            <button
                                                key={day}
                                                onClick={() => update({ day_of_month: day })}
                                                className={cn(
                                                    "py-2 rounded-lg border text-xs font-bold transition-all",
                                                    local.day_of_month === day
                                                        ? "bg-orange-500 border-orange-500 text-white shadow-sm"
                                                        : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-orange-300"
                                                )}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Deadline Time */}
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <Timer className="w-3.5 h-3.5" /> Horário Limite
                                </label>
                                <p className="text-[10px] text-zinc-400 mb-2">Até que horas o checklist deve ser finalizado</p>
                                <input
                                    type="time"
                                    value={local.deadline_time}
                                    onChange={e => update({ deadline_time: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            {/* Date Range */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">
                                        Data Início
                                    </label>
                                    <input
                                        type="date"
                                        value={local.start_date}
                                        onChange={e => update({ start_date: e.target.value })}
                                        className="w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">
                                        Data Fim <span className="text-zinc-300">(opcional)</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={local.end_date}
                                        onChange={e => update({ end_date: e.target.value })}
                                        className="w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                            </div>

                            {/* Notification */}
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <Bell className="w-3.5 h-3.5" /> Notificação
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {NOTIFY_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => update({ notify_before_minutes: opt.value })}
                                            className={cn(
                                                "py-2.5 px-2 rounded-xl border text-[11px] font-bold transition-all",
                                                local.notify_before_minutes === opt.value
                                                    ? "border-violet-300 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20"
                                                    : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Auto Create toggle */}
                            <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl">
                                <div>
                                    <p className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Lançar na Agenda</p>
                                    <p className="text-[10px] text-zinc-400">Cria automaticamente o checklist na agenda dos responsáveis</p>
                                </div>
                                <button
                                    onClick={() => update({ auto_create: !local.auto_create })}
                                    className={cn(
                                        "w-12 h-7 rounded-full transition-all relative",
                                        local.auto_create ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
                                    )}
                                >
                                    <div className={cn(
                                        "w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm",
                                        local.auto_create ? "left-6" : "left-1"
                                    )} />
                                </button>
                            </div>

                            {/* Summary */}
                            <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30">
                                <p className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-1 flex items-center gap-1">
                                    <Settings2 className="w-3.5 h-3.5" /> Resumo do Agendamento
                                </p>
                                <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">{summaryText()}</p>
                                {local.start_date && (
                                    <p className="text-[10px] text-zinc-400 mt-1">
                                        A partir de {new Date(local.start_date + "T12:00:00").toLocaleDateString("pt-BR")}
                                        {local.end_date && ` até ${new Date(local.end_date + "T12:00:00").toLocaleDateString("pt-BR")}`}
                                    </p>
                                )}
                                {local.notify_before_minutes > 0 && (
                                    <p className="text-[10px] text-zinc-400">
                                        🔔 Notificação {NOTIFY_OPTIONS.find(n => n.value === local.notify_before_minutes)?.label}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 flex gap-3 sticky bottom-0 bg-white dark:bg-zinc-900">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-lg hover:shadow-orange-500/25 flex items-center justify-center gap-2"
                    >
                        <Check className="w-4 h-4" /> Salvar Configuração
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// Mini badge component to display on the builder header
export function ScheduleBadge({ config, onClick }: { config: ScheduleConfig; onClick: () => void }) {
    if (!config.enabled) {
        return (
            <button
                onClick={onClick}
                className="px-3 py-1.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-xs font-medium text-zinc-400 hover:border-orange-300 hover:text-orange-500 transition-all flex items-center gap-1.5"
            >
                <CalendarClock className="w-3.5 h-3.5" /> Agendar
            </button>
        );
    }

    const recLabel = RECURRENCE_OPTIONS.find(r => r.value === config.recurrence)?.label || "Agendado";
    const recIcon = RECURRENCE_OPTIONS.find(r => r.value === config.recurrence)?.icon || "📅";

    return (
        <button
            onClick={onClick}
            className="px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950/50 transition-all flex items-center gap-1.5"
        >
            <span>{recIcon}</span>
            {recLabel}
            {config.deadline_time && <span className="opacity-60">• {config.deadline_time}</span>}
        </button>
    );
}
