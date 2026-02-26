"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    CalendarDays,
    CheckCircle2,
    AlertTriangle,
    SkipForward,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChecklistSchedule } from "@/types";

// Mock schedules
const mockSchedules: ChecklistSchedule[] = [
    {
        id: "s1", template_id: "tpl-1", organization_id: "org-1",
        assigned_user_id: "u1", title: "Abertura do Restaurante",
        scheduled_date: "2026-02-26", scheduled_time: "07:00",
        recurrence: "daily", status: "completed", created_at: "2026-01-01",
    },
    {
        id: "s2", template_id: "tpl-2", organization_id: "org-1",
        assigned_user_id: "u2", title: "Controle de Qualidade APPCC",
        scheduled_date: "2026-02-26", scheduled_time: "10:00",
        recurrence: "daily", status: "pending", created_at: "2026-01-01",
    },
    {
        id: "s3", template_id: "tpl-3", organization_id: "org-1",
        assigned_user_id: "u1", title: "Fechamento Diário",
        scheduled_date: "2026-02-26", scheduled_time: "22:00",
        recurrence: "daily", status: "pending", created_at: "2026-01-01",
    },
    {
        id: "s4", template_id: "tpl-2", organization_id: "org-1",
        title: "Inspeção Sanitária Mensal",
        scheduled_date: "2026-02-28", scheduled_time: "09:00",
        recurrence: "monthly", status: "pending", created_at: "2026-01-01",
    },
    {
        id: "s5", template_id: "tpl-1", organization_id: "org-1",
        title: "Abertura do Restaurante",
        scheduled_date: "2026-02-27", scheduled_time: "07:00",
        recurrence: "daily", status: "pending", created_at: "2026-01-01",
    },
    {
        id: "s6", template_id: "tpl-3", organization_id: "org-1",
        title: "Treinamento Semanal",
        scheduled_date: "2026-02-25", scheduled_time: "14:00",
        recurrence: "weekly", status: "overdue", created_at: "2026-01-01",
    },
    {
        id: "s7", template_id: "tpl-1", organization_id: "org-1",
        title: "Abertura do Restaurante",
        scheduled_date: "2026-03-01", scheduled_time: "07:00",
        recurrence: "daily", status: "pending", created_at: "2026-01-01",
    },
    {
        id: "s8", template_id: "tpl-1", organization_id: "org-1",
        title: "Limpeza Profunda",
        scheduled_date: "2026-03-05", scheduled_time: "08:00",
        recurrence: "none", status: "pending", created_at: "2026-01-01",
    },
];

const statusConfig = {
    pending: { label: "Pendente", icon: Clock, color: "text-amber-500", bg: "bg-amber-500", dot: "bg-amber-400" },
    completed: { label: "Concluído", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500", dot: "bg-emerald-400" },
    overdue: { label: "Atrasado", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500", dot: "bg-red-400" },
    skipped: { label: "Pulado", icon: SkipForward, color: "text-zinc-400", bg: "bg-zinc-400", dot: "bg-zinc-400" },
};

const recurrenceLabel: Record<string, string> = {
    none: "Único",
    daily: "Diário",
    weekly: "Semanal",
    monthly: "Mensal",
};

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function SchedulePage() {
    const today = new Date();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [selectedDate, setSelectedDate] = useState<string | null>(
        today.toISOString().substring(0, 10)
    );
    const [showNewModal, setShowNewModal] = useState(false);

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const todayStr = today.toISOString().substring(0, 10);

    const calendarDays = useMemo(() => {
        const days: { date: string; day: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

        // Previous month padding
        const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);
        for (let i = firstDay - 1; i >= 0; i--) {
            const d = prevMonthDays - i;
            const m = currentMonth === 0 ? 11 : currentMonth - 1;
            const y = currentMonth === 0 ? currentYear - 1 : currentYear;
            const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            days.push({ date: dateStr, day: d, isCurrentMonth: false, isToday: false });
        }

        // Current month
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            days.push({ date: dateStr, day: d, isCurrentMonth: true, isToday: dateStr === todayStr });
        }

        // Next month padding
        const remaining = 42 - days.length;
        for (let d = 1; d <= remaining; d++) {
            const m = currentMonth === 11 ? 0 : currentMonth + 1;
            const y = currentMonth === 11 ? currentYear + 1 : currentYear;
            const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            days.push({ date: dateStr, day: d, isCurrentMonth: false, isToday: false });
        }

        return days;
    }, [currentYear, currentMonth, daysInMonth, firstDay, todayStr]);

    const schedulesByDate = useMemo(() => {
        const map: Record<string, ChecklistSchedule[]> = {};
        mockSchedules.forEach((s) => {
            if (!map[s.scheduled_date]) map[s.scheduled_date] = [];
            map[s.scheduled_date].push(s);
        });
        return map;
    }, []);

    const selectedSchedules = selectedDate ? (schedulesByDate[selectedDate] || []) : [];

    const prevMonth = () => {
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
        else setCurrentMonth(currentMonth - 1);
    };

    const nextMonth = () => {
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
        else setCurrentMonth(currentMonth + 1);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Agenda
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        Planeje e acompanhe seus checklists
                    </p>
                </div>
                <button
                    onClick={() => setShowNewModal(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 text-white dark:text-zinc-900 rounded-xl font-semibold hover:shadow-lg transition-all text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Agendar Checklist
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6 shadow-sm">
                    {/* Month Navigator */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={prevMonth}
                            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-zinc-500" />
                        </button>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                            {MONTH_NAMES[currentMonth]} {currentYear}
                        </h2>
                        <button
                            onClick={nextMonth}
                            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-zinc-500" />
                        </button>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {WEEKDAYS.map((wd) => (
                            <div
                                key={wd}
                                className="text-center text-xs font-semibold text-zinc-400 dark:text-zinc-500 py-2"
                            >
                                {wd}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, i) => {
                            const daySchedules = schedulesByDate[day.date] || [];
                            const isSelected = selectedDate === day.date;
                            const hasOverdue = daySchedules.some((s) => s.status === "overdue");
                            const hasCompleted = daySchedules.some((s) => s.status === "completed");
                            const hasPending = daySchedules.some((s) => s.status === "pending");

                            return (
                                <motion.button
                                    key={i}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedDate(day.date)}
                                    className={cn(
                                        "relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all text-sm",
                                        !day.isCurrentMonth && "opacity-30",
                                        day.isToday && !isSelected && "bg-zinc-100 dark:bg-zinc-900 font-bold",
                                        isSelected
                                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-lg font-bold"
                                            : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50",
                                        day.isCurrentMonth
                                            ? "text-zinc-900 dark:text-zinc-100"
                                            : "text-zinc-300 dark:text-zinc-600"
                                    )}
                                >
                                    <span>{day.day}</span>
                                    {/* Dots para indicar agendamentos */}
                                    {daySchedules.length > 0 && (
                                        <div className="flex gap-0.5 mt-0.5">
                                            {hasOverdue && <div className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-red-300" : "bg-red-400")} />}
                                            {hasPending && <div className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-amber-300" : "bg-amber-400")} />}
                                            {hasCompleted && <div className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-emerald-300" : "bg-emerald-400")} />}
                                        </div>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Day Detail Panel */}
                <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <CalendarDays className="w-5 h-5 text-zinc-500" />
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-50">
                            {selectedDate
                                ? new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                })
                                : "Selecione um dia"}
                        </h3>
                    </div>

                    <AnimatePresence mode="wait">
                        {selectedSchedules.length > 0 ? (
                            <motion.div
                                key={selectedDate}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-3"
                            >
                                {selectedSchedules
                                    .sort((a, b) => (a.scheduled_time || "").localeCompare(b.scheduled_time || ""))
                                    .map((schedule) => {
                                        const status = statusConfig[schedule.status];
                                        const StatusIcon = status.icon;

                                        return (
                                            <motion.div
                                                key={schedule.id}
                                                whileHover={{ x: 4 }}
                                                className={cn(
                                                    "p-4 rounded-xl border-l-4 bg-zinc-50 dark:bg-zinc-900/50 transition-all cursor-pointer hover:shadow-md",
                                                    `border-l-${schedule.status === "completed" ? "emerald" : schedule.status === "overdue" ? "red" : "amber"}-500`
                                                )}
                                                style={{
                                                    borderLeftColor:
                                                        schedule.status === "completed"
                                                            ? "#10b981"
                                                            : schedule.status === "overdue"
                                                                ? "#ef4444"
                                                                : "#f59e0b",
                                                }}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-semibold text-zinc-900 dark:text-zinc-50 text-sm">
                                                            {schedule.title}
                                                        </h4>
                                                        <div className="flex items-center gap-3 mt-1.5">
                                                            {schedule.scheduled_time && (
                                                                <span className="flex items-center gap-1 text-xs text-zinc-500">
                                                                    <Clock className="w-3 h-3" />
                                                                    {schedule.scheduled_time}
                                                                </span>
                                                            )}
                                                            <span className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                                                                {recurrenceLabel[schedule.recurrence || "none"]}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className={cn("flex items-center gap-1 text-xs font-semibold", status.color)}>
                                                        <StatusIcon className="w-3.5 h-3.5" />
                                                        {status.label}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-12"
                            >
                                <CalendarDays className="w-12 h-12 text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
                                <p className="text-sm text-zinc-400">Nenhum checklist agendado</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* New Schedule Modal */}
            <AnimatePresence>
                {showNewModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowNewModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-zinc-950 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                                    Agendar Checklist
                                </h3>
                                <button
                                    onClick={() => setShowNewModal(false)}
                                    className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                >
                                    <X className="w-5 h-5 text-zinc-500" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                        Checklist
                                    </label>
                                    <select className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                                        <option>Abertura do Restaurante</option>
                                        <option>Controle de Qualidade APPCC</option>
                                        <option>Fechamento Diário</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                            Data
                                        </label>
                                        <input
                                            type="date"
                                            defaultValue={selectedDate || todayStr}
                                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                            Horário
                                        </label>
                                        <input
                                            type="time"
                                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                        Recorrência
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {(["none", "daily", "weekly", "monthly"] as const).map((r) => (
                                            <button
                                                key={r}
                                                className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                                            >
                                                {recurrenceLabel[r]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                        Responsável (opcional)
                                    </label>
                                    <select className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                                        <option value="">Qualquer membro</option>
                                        <option>Carlos Silva</option>
                                        <option>Ana Beatriz</option>
                                        <option>Roberto Santos</option>
                                    </select>
                                </div>

                                <button className="w-full py-3 bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 text-white dark:text-zinc-900 rounded-xl font-semibold hover:shadow-lg transition-all text-sm">
                                    Agendar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
