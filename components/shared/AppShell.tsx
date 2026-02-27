"use client";

import { ReactNode } from "react";
import { Sidebar } from "@/components/shared/Sidebar";
import { MobileNav } from "@/components/shared/MobileNav";
import { useFocusMode } from "@/components/providers/focus-mode-provider";
import { OnboardingTour } from "@/components/features/OnboardingTour";
import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
    const { isFocused, exitFocus } = useFocusMode();

    return (
        <div className="flex min-h-screen bg-[var(--bg-color)] dark:bg-zinc-950">
            {/* Desktop Sidebar — hidden on mobile, hidden on Focus Mode */}
            <AnimatePresence>
                {!isFocused && (
                    <motion.div
                        initial={{ x: -260, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -260, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="hidden lg:block"
                    >
                        <Sidebar />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Navigation — header + bottom bar + drawer */}
            <MobileNav />

            <main className={cn(
                "flex-1 transition-all duration-300",
                // Desktop: ml-64, paddings normais 
                "lg:p-8",
                isFocused ? "lg:ml-0" : "lg:ml-64",
                // Mobile: sem margin-left, padding menor, com espaço pro header (pt) e bottom bar (pb)
                "p-4 pt-[72px] pb-[88px]",
                "lg:pt-8 lg:pb-8"
            )}>
                {/* Focus Mode indicator */}
                <AnimatePresence>
                    {isFocused && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed top-4 right-4 z-50 flex items-center gap-2"
                        >
                            <div className="bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-violet-500/30">
                                <Maximize2 className="w-3.5 h-3.5" />
                                Modo Foco
                                <button
                                    onClick={exitFocus}
                                    className="ml-1 p-0.5 rounded-md hover:bg-violet-600 transition-colors"
                                    aria-label="Sair do modo foco"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {children}
            </main>

            {/* Onboarding Tour */}
            <OnboardingTour />
        </div>
    );
}
