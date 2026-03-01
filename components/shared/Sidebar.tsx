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
    ChevronDown,
    ChevronRight,
    Award
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
        label: "Checklist",
        icon: ClipboardCheck,
        children: [
            { href: "/checklists/dashboard", label: "Dashboard", icon: BarChart3 },
            { href: "/checklists", label: "Realizar", icon: ClipboardCheck },
            { href: "/checklists/history", label: "Histórico", icon: ClipboardList },
            { href: "/builder", label: "Construtor", icon: Hammer },
        ]
    },
    { href: "/schedule", label: "Agenda", icon: CalendarDays },
    { href: "/ranking", label: "Ranking", icon: Trophy },
    {
        label: "Planos de Ação",
        icon: Lightbulb,
        children: [
            { href: "/action-plans/dashboard", label: "Dashboard", icon: BarChart3, adminOnly: true },
            { href: "/action-plans", label: "Meus Planos", icon: Lightbulb },
            { href: "/manager/action-plans", label: "Definir Pontuação", icon: Award, adminOnly: true },
        ]
    },
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
    const [profile, setProfile] = useState<any>(null);
    const [expandedMenu, setExpandedMenu] = useState<string>("Checklist"); // Starts open if desired

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from("profiles")
                    .select("name, level, total_xp, streak_days, role")
                    .eq("id", user.id)
                    .single();
                setProfile(data);
            }
        }
        loadProfile();
    }, [supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    const toggleMenu = (label: string) => {
        setExpandedMenu(expandedMenu === label ? "" : label);
    };

    const isChildActive = (children: any[]) => {
        return children.some(child => pathname === child.href || pathname.startsWith(child.href + "/"));
    };

    const isAdmin = profile?.role === 'admin' || profile?.role === 'owner' || profile?.role === 'manager';

    return (
        <aside data-tour="sidebar" className="fixed left-0 top-0 z-40 h-screen w-64 bg-white dark:bg-zinc-950 border-r border-zinc-100 dark:border-zinc-900 flex flex-col">
            {/* Logo with streak */}
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-900">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-lg font-black text-white dark:text-zinc-900">✓</span>
                    </div>
                    <div>
                        <h2 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">
                            {profile ? profile.name : "Checklist Pro"}
                        </h2>
                        <p className="text-xs text-zinc-400">Gamificado</p>
                    </div>
                </div>
                {/* Mini Streak */}
                {profile && profile.streak_days > 0 && (
                    <div data-tour="streak" className="mt-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 rounded-xl p-3 flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                            <Flame className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-orange-700 dark:text-orange-300">{profile.streak_days} dias seguidos!</p>
                            <p className="text-[10px] text-orange-500 dark:text-orange-400">Sequência de checklists</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden custom-scrollbar">
                {navItems.map((item: any) => {
                    if (item.adminOnly && !isAdmin) return null;

                    const hasChildren = !!item.children;
                    // Filter children that are adminOnly if user is not admin
                    const visibleChildren = hasChildren 
                        ? item.children.filter((c: any) => !c.adminOnly || isAdmin)
                        : [];

                    // If it has children but all are filtered out, don't show the parent if parent only exists for children
                    if (hasChildren && visibleChildren.length === 0) return null;

                    const isActive = item.href ? pathname === item.href : (hasChildren && isChildActive(visibleChildren));
                    const isExpanded = expandedMenu === item.label || isActive;
                    const Icon = item.icon;

                    if (hasChildren) {
                        return (
                            <div key={item.label} className="flex flex-col gap-1">
                                <button
                                    onClick={() => toggleMenu(item.label)}
                                    className={cn(
                                        "relative flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full",
                                        isActive || isExpanded
                                            ? "text-zinc-900 dark:text-zinc-50"
                                            : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className={cn("w-5 h-5", isActive || isExpanded ? "text-orange-500" : "text-zinc-400")} />
                                        <span>{item.label}</span>
                                    </div>
                                    {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
                                </button>

                                {isExpanded && (
                                    <div className="flex flex-col gap-1 ml-4 pl-4 border-l-2 border-zinc-100 dark:border-zinc-800">
                                        {visibleChildren.map((child: any) => {
                                            const isChildCurrent = pathname === child.href || pathname.startsWith(child.href + "/") && child.href !== "/checklists";
                                            // Handle special case for /checklists so it doesn't stay active on /checklists/dashboard
                                            const isExactMatch = pathname === child.href;
                                            const isChildTrulyActive = child.href === "/checklists" ? isExactMatch : isChildCurrent;

                                            return (
                                                <Link key={child.href} href={child.href}>
                                                    <div
                                                        className={cn(
                                                            "relative flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                                            isChildTrulyActive
                                                                ? "text-zinc-900 dark:text-zinc-50 bg-zinc-100 dark:bg-zinc-900"
                                                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                                                        )}
                                                    >
                                                        <child.icon className="w-4 h-4" />
                                                        <span>{child.label}</span>
                                                    </div>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <Link key={item.href} href={item.href!} data-tour={`nav-${item.href?.slice(1)}`}>
                            <div
                                className={cn(
                                    "relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                                    isActive
                                        ? "text-zinc-900 dark:text-zinc-50"
                                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute inset-0 bg-zinc-100 dark:bg-zinc-900 rounded-xl"
                                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                    />
                                )}
                                <Icon className={cn("w-5 h-5 relative z-10", isActive && "text-orange-500")} />
                                <span className="relative z-10">{item.label}</span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* XP Bar + Level */}
            <div data-tour="xp-bar" className="p-4 border-t border-zinc-100 dark:border-zinc-900">
                {profile && (
                    <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-zinc-600 dark:text-zinc-400">Nível {profile.level}</span>
                            <span className="text-zinc-400">{profile.total_xp} / {profile.level * 1000} XP</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all"
                                style={{ width: `${Math.min((profile.total_xp / (profile.level * 1000)) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                )}

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
