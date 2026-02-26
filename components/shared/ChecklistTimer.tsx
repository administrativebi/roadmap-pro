"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Zap, Pause, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistTimerProps {
    estimatedMinutes: number;
    isActive: boolean;
    onTimeUpdate?: (elapsed: number) => void;
    onInactivityPenalty?: () => void;
}

interface TimerState {
    elapsed: number;           // Total seconds elapsed
    isRunning: boolean;
    idleTime: number;          // Current idle streak (seconds)
    totalIdleTime: number;     // Accumulated idle time
    hadInactivityPenalty: boolean;
    speedBonus: boolean;       // Finished before estimated time
    focusBonus: boolean;       // No inactivity > 5min
}

const INACTIVITY_THRESHOLD = 5 * 60; // 5 minutes in seconds
const IDLE_CHECK_INTERVAL = 1000;    // Check every second
const IDLE_RESET_ACTIONS = ["click", "touchstart", "keydown", "scroll"];

export function ChecklistTimer({
    estimatedMinutes,
    isActive,
    onTimeUpdate,
    onInactivityPenalty,
}: ChecklistTimerProps) {
    const [state, setState] = useState<TimerState>({
        elapsed: 0,
        isRunning: false,
        idleTime: 0,
        totalIdleTime: 0,
        hadInactivityPenalty: false,
        speedBonus: false,
        focusBonus: true,
    });

    const lastActivityRef = useRef<number>(Date.now());
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const estimatedSeconds = estimatedMinutes * 60;

    // Reset activity timestamp on user interaction
    const resetIdleTimer = useCallback(() => {
        lastActivityRef.current = Date.now();
        setState((prev) => ({ ...prev, idleTime: 0 }));
    }, []);

    // Listen for user activity
    useEffect(() => {
        if (!isActive) return;

        IDLE_RESET_ACTIONS.forEach((event) => {
            window.addEventListener(event, resetIdleTimer, { passive: true });
        });

        return () => {
            IDLE_RESET_ACTIONS.forEach((event) => {
                window.removeEventListener(event, resetIdleTimer);
            });
        };
    }, [isActive, resetIdleTimer]);

    // Main timer loop
    useEffect(() => {
        if (!isActive) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        setState((prev) => ({ ...prev, isRunning: true }));

        intervalRef.current = setInterval(() => {
            const now = Date.now();
            const idleSecs = Math.floor((now - lastActivityRef.current) / 1000);

            setState((prev) => {
                const newElapsed = prev.elapsed + 1;
                const newIdle = idleSecs;
                let newPenalty = prev.hadInactivityPenalty;
                let newFocusBonus = prev.focusBonus;

                // Check inactivity threshold
                if (newIdle >= INACTIVITY_THRESHOLD && !prev.hadInactivityPenalty) {
                    newPenalty = true;
                    newFocusBonus = false;
                    onInactivityPenalty?.();
                }

                // Speed bonus check
                const newSpeedBonus = newElapsed <= estimatedSeconds;

                onTimeUpdate?.(newElapsed);

                return {
                    ...prev,
                    elapsed: newElapsed,
                    isRunning: true,
                    idleTime: newIdle,
                    totalIdleTime: prev.totalIdleTime + (newIdle > 30 ? 1 : 0),
                    hadInactivityPenalty: newPenalty,
                    speedBonus: newSpeedBonus,
                    focusBonus: newFocusBonus,
                };
            });
        }, IDLE_CHECK_INTERVAL);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive, estimatedSeconds, onTimeUpdate, onInactivityPenalty]);

    // Format time
    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const progressPercent = Math.min((state.elapsed / estimatedSeconds) * 100, 100);
    const isOverTime = state.elapsed > estimatedSeconds;
    const isWarningZone = state.elapsed > estimatedSeconds * 0.8 && !isOverTime;
    const isIdleWarning = state.idleTime > 120; // > 2 min idle warning

    return (
        <div className="space-y-2">
            {/* Main Timer Bar */}
            <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-900 p-3">
                <div className="flex items-center justify-between mb-2">
                    {/* Timer Display */}
                    <div className="flex items-center gap-2">
                        <div
                            className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                isOverTime
                                    ? "bg-red-100 dark:bg-red-950"
                                    : isWarningZone
                                        ? "bg-amber-100 dark:bg-amber-950"
                                        : "bg-emerald-100 dark:bg-emerald-950"
                            )}
                        >
                            <Timer
                                className={cn(
                                    "w-4 h-4",
                                    isOverTime
                                        ? "text-red-500"
                                        : isWarningZone
                                            ? "text-amber-500"
                                            : "text-emerald-500"
                                )}
                            />
                        </div>
                        <div>
                            <motion.p
                                key={state.elapsed}
                                className={cn(
                                    "text-lg font-mono font-bold tabular-nums",
                                    isOverTime
                                        ? "text-red-500"
                                        : isWarningZone
                                            ? "text-amber-500"
                                            : "text-zinc-900 dark:text-zinc-50"
                                )}
                            >
                                {formatTime(state.elapsed)}
                            </motion.p>
                            <p className="text-[10px] text-zinc-400">
                                Estimado: {formatTime(estimatedSeconds)}
                            </p>
                        </div>
                    </div>

                    {/* Bonus Indicators */}
                    <div className="flex items-center gap-1.5">
                        {/* Speed Bonus */}
                        <div
                            className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all",
                                state.speedBonus
                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 line-through"
                            )}
                            title={state.speedBonus ? "Bônus de velocidade ativo!" : "Bônus perdido (tempo excedido)"}
                        >
                            <Zap className="w-3 h-3" />
                            Speed
                        </div>

                        {/* Focus Bonus */}
                        <div
                            className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all",
                                state.focusBonus
                                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 line-through"
                            )}
                            title={state.focusBonus ? "Bônus de foco ativo!" : "Bônus perdido (inatividade > 5min)"}
                        >
                            <Coffee className="w-3 h-3" />
                            Foco
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="relative w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                        className={cn(
                            "absolute inset-y-0 left-0 rounded-full transition-colors",
                            isOverTime
                                ? "bg-red-500"
                                : isWarningZone
                                    ? "bg-amber-500"
                                    : "bg-gradient-to-r from-emerald-400 to-teal-500"
                        )}
                        animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                        transition={{ duration: 0.3 }}
                    />
                    {isOverTime && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="absolute inset-0 bg-red-500/20 rounded-full"
                        />
                    )}
                </div>
            </div>

            {/* Idle Warning */}
            <AnimatePresence>
                {isIdleWarning && !state.hadInactivityPenalty && (
                    <motion.div
                        initial={{ opacity: 0, y: -5, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -5, height: 0 }}
                        className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl p-3"
                    >
                        <div className="flex items-center gap-2">
                            <Pause className="w-4 h-4 text-amber-500" />
                            <div>
                                <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                    Inatividade detectada ({formatTime(state.idleTime)})
                                </p>
                                <p className="text-[10px] text-amber-600 dark:text-amber-400">
                                    Bônus de foco será perdido em {formatTime(INACTIVITY_THRESHOLD - state.idleTime)}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Penalty Applied */}
            <AnimatePresence>
                {state.hadInactivityPenalty && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl p-3"
                    >
                        <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                            <Coffee className="w-3.5 h-3.5" />
                            Bônus de foco perdido — inatividade de mais de 5 minutos
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Calcular bônus de XP ─────────────────────────────
export function calculateTimerBonuses(
    elapsed: number,
    estimatedMinutes: number,
    hadInactivityPenalty: boolean,
    baseScore: number
): { speedBonus: number; focusBonus: number; totalBonus: number } {
    const estimatedSeconds = estimatedMinutes * 60;

    // Speed Bonus: +20% se terminar antes do estimado
    const speedBonus = elapsed <= estimatedSeconds ? Math.floor(baseScore * 0.2) : 0;

    // Focus Bonus: +15% se não teve inatividade > 5 min
    const focusBonus = !hadInactivityPenalty ? Math.floor(baseScore * 0.15) : 0;

    return {
        speedBonus,
        focusBonus,
        totalBonus: speedBonus + focusBonus,
    };
}
