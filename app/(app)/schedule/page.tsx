"use client";

import { useState, useMemo, useEffect } from "react";
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
    Lightbulb,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChecklistSchedule, ActionPlan } from "@/types";
import { createClient } from "@/lib/supabase/client";

const statusConfig = {
    pending: { label: "Pendente", icon: Clock, color: "text-amber-500", bg: "bg-amber-500", dot: "bg-amber-400" },
    completed: { label: "Concluído", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500", dot: "bg-emerald-400" },
    overdue: { label: "Atrasado", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500", dot: "bg-red-400" },
    skipped: { label: "Pulado", icon: SkipForward, color: "text-zinc-400", bg: "bg-zinc-400", dot: "bg-zinc-400" },
    // Action Plan styles
    in_progress: { label: "Em andamento", icon: Loader2, color: "text-blue-500", bg: "bg-blue-500", dot: "bg-blue-400" },
    resolved: { label: "Resolvido", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500", dot: "bg-emerald-400" },
    canceled: { label: "Cancelado", icon: X, color: "text-zinc-400", bg: "bg-zinc-400", dot: "bg-zinc-400" },
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
    const supabase = createClient();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [selectedDate, setSelectedDate] = useState<string | null>(
        today.toISOString().substring(0, 10)
    );
    const [showNewModal, setShowNewModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [schedules, setSchedules] = useState<ChecklistSchedule[]>([]);
    const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const todayStr = today.toISOString().substring(0, 10);

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Fetch schedules
                const { data: schedData } = await supabase
                    .from('checklist_schedules')
                    .select('*')
                    .or(`assigned_user_id.eq.${user.id},assigned_user_id.is.null`);

                // Fetch action plans with due date
                const { data: apData } = await supabase
                    .from('action_plans')
                    .select('*')
                    .not('due_date', 'is', null);

                if (schedData) setSchedules(schedData);
                if (apData) setActionPlans(apData);
            } catch (err) {
                console.error("Erro ao carregar agenda:", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [supabase]);

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

    const itemsByDate = useMemo(() => {
        const map: Record<string, { type: 'schedule' | 'action_plan'; data: any }[]> = {};
        
        schedules.forEach((s) => {
            if (!map[s.scheduled_date]) map[s.scheduled_date] = [];
            map[s.scheduled_date].push({ type: 'schedule', data: s });
        });

        actionPlans.forEach((ap) => {
            if (!ap.due_date) return;
            const dateStr = ap.due_date.substring(0, 10);
            if (!map[dateStr]) map[dateStr] = [];
            map[dateStr].push({ type: 'action_plan', data: ap });
        });

        return map;
    }, [schedules, actionPlans]);

    const selectedItems = selectedDate ? (itemsByDate[selectedDate] || []) : [];

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
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 uppercase">
                        Agenda
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                        Compromissos e prazos de Planos de Ação
                    </p>
                </div>
                <button
                    onClick={() => setShowNewModal(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-lg shadow-zinc-500/20"
                >
                    <Plus className="w-4 h-4" />
                    Agendar
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-900 p-6 md:p-8 shadow-sm">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-4" />
                            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Sincronizando Agenda...</p>
                        </div>
                    ) : (
                        <>
                            {/* Month Navigator */}
                            <div className="flex items-center justify-between mb-8">
                                <button
                                    onClick={prevMonth}
                                    className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5 text-zinc-500" />
                                </button>
                                <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-tighter">
                                    {MONTH_NAMES[currentMonth]} {currentYear}
                                </h2>
                                <button
                                    onClick={nextMonth}
                                    className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5 text-zinc-500" />
                                </button>
                            </div>

                            {/* Weekday Headers */}
                            <div className="grid grid-cols-7 gap-2 mb-4">
                                {WEEKDAYS.map((wd) => (
                                    <div
                                        key={wd}
                                        className="text-center text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest py-2"
                                    >
                                        {wd}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-2">
                                {calendarDays.map((day, i) => {
                                    const dayItems = itemsByDate[day.date] || [];
                                    const isSelected = selectedDate === day.date;
                                    const hasActionPlans = dayItems.some(item => item.type === 'action_plan');
                                    const hasOverdue = dayItems.some(item => item.type === 'schedule' && item.data.status === 'overdue');

                                    return (
                                        <motion.button
                                            key={i}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setSelectedDate(day.date)}
                                            className={cn(
                                                "relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all",
                                                !day.isCurrentMonth && "opacity-20",
                                                day.isToday && !isSelected && "bg-orange-50 dark:bg-orange-950/30 text-orange-600 font-black",
                                                isSelected
                                                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xl font-black scale-105 z-10"
                                                    : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400",
                                            )}
                                        >
                                            <span className="text-sm">{day.day}</span>
                                            {dayItems.length > 0 && (
                                                <div className="flex gap-1 mt-1">
                                                    {hasActionPlans && <div className={cn("w-1.5 h-1.5 rounded-full bg-orange-500", isSelected && "bg-white dark:bg-orange-500")} />}
                                                    {hasOverdue && <div className={cn("w-1.5 h-1.5 rounded-full bg-red-500", isSelected && "bg-white")} />}
                                                    {!hasActionPlans && !hasOverdue && <div className={cn("w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700", isSelected && "bg-white")} />}
                                                </div>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Day Detail Panel */}
                <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-900 p-6 md:p-8 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-900 rounded-xl flex items-center justify-center">
                            <CalendarDays className="w-5 h-5 text-zinc-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-lg uppercase tracking-tight">
                                {selectedDate
                                    ? new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", {
                                        day: "numeric",
                                        month: "long",
                                    })
                                    : "Selecione"}
                            </h3>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                {selectedDate ? new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long" }) : "Escolha um dia"}
                            </p>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {selectedItems.length > 0 ? (
                            <motion.div
                                key={selectedDate}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar"
                            >
                                {selectedItems
                                    .map((item) => {
                                        const isActionPlan = item.type === 'action_plan';
                                        const data = item.data;
                                        const status = statusConfig[data.status as keyof typeof statusConfig] || statusConfig.pending;
                                        const StatusIcon = status.icon;

                                        return (
                                            <motion.div
                                                key={`${item.type}-${data.id}`}
                                                whileHover={{ x: 4 }}
                                                className={cn(
                                                    "p-5 rounded-3xl border-l-4 transition-all cursor-pointer hover:shadow-lg",
                                                    isActionPlan 
                                                        ? "bg-orange-50/50 dark:bg-orange-950/10 border-orange-500" 
                                                        : "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800"
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            {isActionPlan ? (
                                                                <Lightbulb className="w-3 h-3 text-orange-500" />
                                                            ) : (
                                                                <CheckCircle2 className="w-3 h-3 text-zinc-400" />
                                                            )}
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">
                                                                {isActionPlan ? "Plano de Ação" : "Checklist"}
                                                            </span>
                                                        </div>
                                                        <h4 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm truncate leading-tight">
                                                            {data.title}
                                                        </h4>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            {data.scheduled_time && (
                                                                <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-500">
                                                                    <Clock className="w-3 h-3" />
                                                                    {data.scheduled_time}
                                                                </span>
                                                            )}
                                                            <span className="text-[10px] text-zinc-400 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-100 dark:border-zinc-700">
                                                                {isActionPlan ? "Prazo Final" : recurrenceLabel[data.recurrence || "none"]}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className={cn("shrink-0 p-2 rounded-full", status.color, "bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800")}>
                                                        <StatusIcon className="w-4 h-4" />
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
                                className="flex-1 flex flex-col items-center justify-center text-center px-6"
                            >
                                <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                                    <CalendarDays className="w-8 h-8 text-zinc-200 dark:text-zinc-800" />
                                </div>
                                <p className="text-sm font-bold text-zinc-400">Nenhum compromisso</p>
                                <p className="text-xs text-zinc-400 mt-1">Selecione outro dia ou agende um novo item.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* New Schedule Modal (Simplified) */}
            <AnimatePresence>
                {showNewModal && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-zinc-950 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-zinc-100 dark:border-zinc-900">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-tighter">Novo Agendamento</h3>
                                <button onClick={() => setShowNewModal(false)} className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-full"><X className="w-5 h-5 text-zinc-500" /></button>
                            </div>
                            <p className="text-sm text-zinc-500 mb-6">Funcionalidade de criação de agendamentos em desenvolvimento.</p>
                            <button onClick={() => setShowNewModal(false)} className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Fechar</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
