"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Zap, Crown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LevelUpData {
    newLevel: number;
    levelName: string;
    xpTotal: number;
    xpNext: number;
    unlockedReward?: string;
}

interface LevelUpAnimationProps {
    data: LevelUpData | null;
    onComplete: () => void;
}

// Confetti particle component
function ConfettiParticle({ index }: { index: number }) {
    const colors = ["#FFD700", "#FF6B6B", "#4CAF50", "#2196F3", "#E040FB", "#FF9800", "#00BCD4"];
    const color = colors[index % colors.length];
    const startX = Math.random() * 100;
    const endX = startX + (Math.random() - 0.5) * 60;
    const duration = 2 + Math.random() * 1.5;
    const delay = Math.random() * 0.5;
    const size = 6 + Math.random() * 8;
    const rotation = Math.random() * 720;

    return (
        <motion.div
            className="absolute rounded-sm"
            style={{
                width: size,
                height: size * 0.6,
                backgroundColor: color,
                left: `${startX}%`,
                top: -10,
            }}
            initial={{ y: 0, x: 0, rotate: 0, opacity: 1 }}
            animate={{
                y: [0, window.innerHeight + 50],
                x: [0, (endX - startX) * 5],
                rotate: rotation,
                opacity: [1, 1, 0],
            }}
            transition={{ duration, delay, ease: "easeIn" }}
        />
    );
}

// Sparkle ring animation
function SparkleRing() {
    return (
        <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 2], opacity: [0, 0.8, 0] }}
            transition={{ duration: 1.2, ease: "easeOut" }}
        >
            <div className="w-48 h-48 rounded-full border-4 border-amber-400/50" />
        </motion.div>
    );
}

export function LevelUpAnimation({ data, onComplete }: LevelUpAnimationProps) {
    const [phase, setPhase] = useState<"entry" | "content" | "exit">("entry");

    useEffect(() => {
        if (!data) return;
        setPhase("entry");

        // Play sound (Web Audio API)
        try {
            const ctx = new AudioContext();
            const playTone = (freq: number, time: number, dur: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = freq;
                osc.type = "sine";
                gain.gain.setValueAtTime(0.15, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
                osc.start(time);
                osc.stop(time + dur);
            };
            const now = ctx.currentTime;
            playTone(523.25, now, 0.15);        // C5
            playTone(659.25, now + 0.15, 0.15); // E5
            playTone(783.99, now + 0.3, 0.15);  // G5
            playTone(1046.5, now + 0.45, 0.4);  // C6
        } catch { }

        const t1 = setTimeout(() => setPhase("content"), 400);
        const t2 = setTimeout(() => setPhase("exit"), 4000);
        const t3 = setTimeout(onComplete, 4800);

        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [data, onComplete]);

    if (!data) return null;

    return (
        <AnimatePresence>
            <motion.div
                key="level-up-overlay"
                className="fixed inset-0 z-[100] flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* Background */}
                <motion.div
                    className="absolute inset-0 bg-black/70 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                />

                {/* Confetti */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {Array.from({ length: 60 }, (_, i) => (
                        <ConfettiParticle key={i} index={i} />
                    ))}
                </div>

                {/* Center Content */}
                <div className="relative z-10 text-center">
                    {/* Sparkle rings */}
                    <SparkleRing />

                    {/* Level badge */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{
                            scale: phase === "exit" ? [1, 1.2, 0] : [0, 1.3, 1],
                            rotate: phase === "exit" ? 180 : 0,
                        }}
                        transition={{ type: "spring", damping: 12, stiffness: 200 }}
                        className="relative"
                    >
                        <div className="w-36 h-36 mx-auto bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-amber-500/50 relative">
                            {/* Glow effect */}
                            <motion.div
                                className="absolute inset-0 rounded-full bg-amber-400/30"
                                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            />
                            <div className="text-center">
                                <Crown className="w-8 h-8 text-white mx-auto mb-1" />
                                <span className="text-4xl font-black text-white">{data.newLevel}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Text */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{
                            opacity: phase === "content" || phase === "entry" ? 1 : 0,
                            y: phase === "content" ? 0 : 30,
                        }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="mt-8"
                    >
                        <motion.div
                            className="flex items-center justify-center gap-2 mb-2"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            <Sparkles className="w-6 h-6 text-amber-400" />
                            <h1 className="text-3xl font-black text-white tracking-wide">LEVEL UP!</h1>
                            <Sparkles className="w-6 h-6 text-amber-400" />
                        </motion.div>
                        <p className="text-lg text-amber-300 font-bold">{data.levelName}</p>
                        <div className="flex items-center justify-center gap-4 mt-4">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-2">
                                <p className="text-2xl font-black text-white">{data.xpTotal}</p>
                                <p className="text-[10px] text-amber-300 font-bold">XP TOTAL</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-2">
                                <p className="text-2xl font-black text-white">{data.xpNext}</p>
                                <p className="text-[10px] text-amber-300 font-bold">PRÓXIMO NÍVEL</p>
                            </div>
                        </div>
                        {data.unlockedReward && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1.2 }}
                                className="mt-4 bg-gradient-to-r from-violet-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl px-6 py-3 border border-violet-400/30"
                            >
                                <p className="text-sm text-violet-300 flex items-center justify-center gap-2">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    Desbloqueou: <strong className="text-white">{data.unlockedReward}</strong>
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// Hook for triggering level up
export function useLevelUp() {
    const [levelData, setLevelData] = useState<LevelUpData | null>(null);

    const triggerLevelUp = useCallback((data: LevelUpData) => {
        setLevelData(data);
    }, []);

    const handleComplete = useCallback(() => {
        setLevelData(null);
    }, []);

    return { levelData, triggerLevelUp, handleComplete, LevelUpComponent: LevelUpAnimation };
}
