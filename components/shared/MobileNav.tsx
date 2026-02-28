"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    ClipboardCheck,
    Trophy,
    User,
    Menu,
    X,
    Hammer,
    CalendarDays,
    Lightbulb,
    ShoppingBag,
    Swords,
    BarChart3,
    ShieldPlus,
    Sparkles,
    ScanLine,
    ArrowRightLeft,
    GraduationCap,
    Rocket,
    Crown,
    ClipboardList,
    QrCode,
    Settings,
    LogOut,
    Flame,
    ChevronDown,
    ChevronRight,
    Award
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Bottom Tab Items (5 main items for bottom bar)
const bottomTabs = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/checklists", label: "Checklists", icon: ClipboardCheck },
    { href: "/ranking", label: "Ranking", icon: Trophy },
    { href: "/profile", label: "Perfil", icon: User },
];

// Full menu items for the drawer
const drawerItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/checklists", label: "Checklists", icon: ClipboardCheck },
    { href: "/builder", label: "Construtor", icon: Hammer },
    { href: "/schedule", label: "Agenda", icon: CalendarDays },
    { href: "/ranking", label: "Ranking", icon: Trophy },
    {
        label: "Planos de Ação",
        icon: Lightbulb,
        children: [
            { href: "/action-plans", label: "Meus Planos", icon: Lightbulb },
            { href: "/manager/action-plans", label: "Definir Pontuação", icon: Award, adminOnly: true },
        ]
    },
    { href: "/profile", label: "Meu Perfil", icon: User },
    { href: "/rewards", label: "Loja & Recompensas", icon: ShoppingBag },
    { href: "/duels", label: "Duelos", icon: Swords },
    { href: "/manager", label: "Painel Gestor", icon: BarChart3, adminOnly: true },
    { href: "/anvisa", label: "Painel ANVISA", icon: ShieldPlus, adminOnly: true },
    { href: "/smart-assign", label: "Atribuição IA", icon: Sparkles, adminOnly: true },
    { href: "/ai-scanner", label: "Scanner IA", icon: ScanLine, adminOnly: true },
    { href: "/shift-handoff", label: "Troca de Turno", icon: ArrowRightLeft },
    { href: "/training", label: "Treinamento", icon: GraduationCap },
    { href: "/onboarding", label: "Onboarding", icon: Rocket },
    { href: "/recognition", label: "Mural", icon: Crown },
    { href: "/evaluation", label: "Avaliação 360", icon: ClipboardList },
    { href: "/qrcodes", label: "QR Codes", icon: QrCode, adminOnly: true },
    { href: "/settings", label: "Configurações", icon: Settings, adminOnly: true },
];

export function MobileNav() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [expandedMenu, setExpandedMenu] = useState<string>("");
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from("profiles")
                    .select("name, level, total_xp, streak_days, avatar_url, role")
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

    const isAdmin = profile?.role === 'admin' || profile?.role === 'owner' || profile?.role === 'manager';

    const toggleMenu = (label: string) => {
        setExpandedMenu(expandedMenu === label ? "" : label);
    };

    const isChildActive = (children: any[]) => {
        return children.some(child => pathname === child.href || pathname.startsWith(child.href + "/"));
    };

    return (
        <>
            {/* ============ MOBILE TOP HEADER ============ */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-900 safe-top">
                <div className="flex items-center justify-between px-4 h-14">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 rounded-lg flex items-center justify-center shadow-md">
                            <span className="text-sm font-black text-white dark:text-zinc-900">✓</span>
                        </div>
                        <div>
                            <h2 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm leading-tight">
                                {profile?.name || "Checklist Pro"}
                            </h2>
                            {profile?.streak_days > 0 && (
                                <div className="flex items-center gap-1 text-[10px] text-orange-500 font-bold">
                                    <Flame className="w-3 h-3" />
                                    {profile.streak_days} dias seguidos
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-300 active:scale-90 transition-transform"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* ============ BOTTOM TAB BAR ============ */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-900 safe-bottom">
                <div className="flex items-center justify-around h-16 px-2">
                    {bottomTabs.map((tab) => {
                        const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
                        const Icon = tab.icon;

                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-0.5 w-16 py-1 rounded-xl transition-all active:scale-90",
                                    isActive
                                        ? "text-zinc-900 dark:text-zinc-50"
                                        : "text-zinc-400 dark:text-zinc-500"
                                )}
                            >
                                <div className="relative">
                                    <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
                                    {isActive && (
                                        <motion.div
                                            layoutId="mobile-tab-indicator"
                                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-zinc-900 dark:bg-zinc-50 rounded-full"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                </div>
                                <span className={cn(
                                    "text-[10px] font-semibold",
                                    isActive ? "font-bold" : "font-medium"
                                )}>
                                    {tab.label}
                                </span>
                            </Link>
                        );
                    })}

                    {/* Menu burger in bottom bar */}
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="flex flex-col items-center justify-center gap-0.5 w-16 py-1 text-zinc-400 dark:text-zinc-500 active:scale-90 transition-transform"
                    >
                        <Menu className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Mais</span>
                    </button>
                </div>
            </nav>

            {/* ============ FULL SCREEN DRAWER ============ */}
            <AnimatePresence>
                {drawerOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="drawer-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="lg:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                            onClick={() => setDrawerOpen(false)}
                        />
                        {/* Drawer Panel */}
                        <motion.div
                            key="drawer-panel"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="lg:hidden fixed right-0 top-0 bottom-0 z-[70] w-[85vw] max-w-sm bg-white dark:bg-zinc-950 shadow-2xl flex flex-col safe-top safe-bottom"
                        >
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-900">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-amber-500/20">
                                        {profile?.name ? profile.name.substring(0, 2).toUpperCase() : "U"}
                                    </div>
                                    <div>
                                        <p className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">
                                            {profile?.name || "Usuário"}
                                        </p>
                                        {profile && (
                                            <p className="text-xs text-zinc-500">
                                                Nível {profile.level} • {profile.total_xp} XP
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setDrawerOpen(false)}
                                    className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 active:scale-90 transition-transform"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* XP Progress */}
                            {profile && (
                                <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-900">
                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                        <span className="font-bold text-zinc-600 dark:text-zinc-400">Progresso</span>
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

                            {/* Drawer Nav */}
                            <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
                                {drawerItems.map((item) => {
                                    if (item.adminOnly && !isAdmin) return null;

                                    const hasChildren = !!item.children;
                                    const visibleChildren = hasChildren 
                                        ? item.children!.filter((c: any) => !c.adminOnly || isAdmin)
                                        : [];

                                    if (hasChildren && visibleChildren.length === 0) return null;

                                    const isActive = item.href ? pathname === item.href : (hasChildren && isChildActive(visibleChildren));
                                    const isExpanded = expandedMenu === item.label || isActive;
                                    const Icon = item.icon;

                                    if (hasChildren) {
                                        return (
                                            <div key={item.label} className="flex flex-col gap-0.5">
                                                <button
                                                    onClick={() => toggleMenu(item.label)}
                                                    className={cn(
                                                        "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all w-full",
                                                        isActive || isExpanded
                                                            ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 font-bold"
                                                            : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Icon className={cn("w-5 h-5 shrink-0", (isActive || isExpanded) && "stroke-[2.5] text-amber-500")} />
                                                        <span>{item.label}</span>
                                                    </div>
                                                    {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
                                                </button>

                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="flex flex-col gap-0.5 ml-4 pl-4 border-l-2 border-zinc-100 dark:border-zinc-800 overflow-hidden"
                                                        >
                                                            {visibleChildren.map((child: any) => {
                                                                const isChildActiveItem = pathname === child.href || pathname.startsWith(child.href + "/");
                                                                const ChildIcon = child.icon;
                                                                return (
                                                                    <Link
                                                                        key={child.href}
                                                                        href={child.href}
                                                                        onClick={() => setDrawerOpen(false)}
                                                                        className={cn(
                                                                            "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                                                                            isChildActiveItem
                                                                                ? "text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/30"
                                                                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                                                        )}
                                                                    >
                                                                        <ChildIcon className={cn("w-4 h-4", isChildActiveItem && "stroke-[2.5]")} />
                                                                        {child.label}
                                                                    </Link>
                                                                );
                                                            })}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href!}
                                            onClick={() => setDrawerOpen(false)}
                                        >
                                            <div
                                                className={cn(
                                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.97]",
                                                    isActive
                                                        ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 font-bold"
                                                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                                )}
                                            >
                                                <Icon className={cn("w-5 h-5 shrink-0", isActive && "stroke-[2.5]")} />
                                                <span className="flex-1">{item.label}</span>
                                                {isActive && (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </nav>

                            {/* Logout */}
                            <div className="p-4 border-t border-zinc-100 dark:border-zinc-900">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors w-full active:scale-[0.97]"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Sair da conta</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
