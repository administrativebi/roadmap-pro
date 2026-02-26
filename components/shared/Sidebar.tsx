"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    ClipboardCheck,
    Trophy,
    Lightbulb,
    Settings,
    LogOut,
    CalendarDays,
    Flame,
    QrCode,
    BarChart3,
    Sparkles,
    ArrowRightLeft,
    GraduationCap,
    Rocket,
    Crown,
    ClipboardList,
    Hammer,
    User,
    ShoppingBag,
    Swords,
    ScanLine,
    ShieldPlus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/checklists", label: "Checklists", icon: ClipboardCheck },
    { href: "/builder", label: "Construtor", icon: Hammer },
    { href: "/schedule", label: "Agenda", icon: CalendarDays },
    { href: "/ranking", label: "Ranking", icon: Trophy },
    { href: "/action-plans", label: "Planos de Ação", icon: Lightbulb },
    { href: "/profile", label: "Meu Perfil", icon: User },
    { href: "/rewards", label: "Loja & Recompensas", icon: ShoppingBag },
    { href: "/duels", label: "Duelos", icon: Swords },
    { href: "/manager", label: "Painel Gestor", icon: BarChart3 },
    { href: "/anvisa", label: "Painel ANVISA", icon: ShieldPlus },
    { href: "/smart-assign", label: "Atribuição IA", icon: Sparkles },
    { href: "/ai-scanner", label: "Scanner IA", icon: ScanLine },
    { href: "/shift-handoff", label: "Troca de Turno", icon: ArrowRightLeft },
    { href: "/training", label: "Treinamento", icon: GraduationCap },
    { href: "/onboarding", label: "Onboarding", icon: Rocket },
    { href: "/recognition", label: "Mural", icon: Crown },
    { href: "/evaluation", label: "Avaliação 360", icon: ClipboardList },
    { href: "/qrcodes", label: "QR Codes", icon: QrCode },
    { href: "/settings", label: "Configurações", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <aside data-tour="sidebar" className="fixed left-0 top-0 z-40 h-screen w-64 bg-white dark:bg-zinc-950 border-r border-zinc-100 dark:border-zinc-900 flex flex-col">
            {/* Logo with streak */}
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-900">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-lg font-black text-white dark:text-zinc-900">✓</span>
                    </div>
                    <div>
                        <h2 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">Checklist Pro</h2>
                        <p className="text-xs text-zinc-400">Gamificado</p>
                    </div>
                </div>
                {/* Mini Streak */}
                <div data-tour="streak" className="mt-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 rounded-xl p-3 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                        <Flame className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-orange-700 dark:text-orange-300">5 dias seguidos!</p>
                        <p className="text-[10px] text-orange-500 dark:text-orange-400">Sequência de checklists</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link key={item.href} href={item.href} data-tour={`nav-${item.href.slice(1)}`}>
                            <div
                                className={cn(
                                    "relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                                    isActive
                                        ? "text-zinc-900 dark:text-zinc-50"
                                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute inset-0 bg-zinc-100 dark:bg-zinc-900 rounded-xl"
                                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                    />
                                )}
                                <Icon className="w-5 h-5 relative z-10" />
                                <span className="relative z-10">{item.label}</span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* XP Bar + Level */}
            <div data-tour="xp-bar" className="p-4 border-t border-zinc-100 dark:border-zinc-900">
                <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-zinc-600 dark:text-zinc-400">Nível 3 — Competente</span>
                        <span className="text-zinc-400">2510 / 3000 XP</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all"
                            style={{ width: "83%" }}
                        />
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-500 hover:text-red-500 transition-colors w-full"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Sair</span>
                </button>
            </div>
        </aside>
    );
}
