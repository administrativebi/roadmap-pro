"use client";

import { motion } from "framer-motion";
import {
    Building2, Palette, Bell, Save, Sun, Moon,
    Monitor, Languages, Eye, Type, RefreshCcw,
    Volume2, Sparkles, Accessibility,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import { useA11y } from "@/components/providers/a11y-provider";
import { useI18n, Locale } from "@/components/providers/i18n-provider";
import { useLevelUp } from "@/components/features/LevelUpAnimation";
import { cn } from "@/lib/utils";

const themeOptions = [
    { value: "light" as const, label: "Claro", labelKey: "settings.theme.light", icon: Sun, preview: "bg-zinc-50 border-zinc-300" },
    { value: "dark" as const, label: "Escuro", labelKey: "settings.theme.dark", icon: Moon, preview: "bg-zinc-900 border-zinc-600" },
    { value: "system" as const, label: "Sistema", labelKey: "settings.theme.system", icon: Monitor, preview: "bg-gradient-to-r from-zinc-50 to-zinc-900 border-zinc-500" },
];

const languageOptions: { value: Locale; label: string; flag: string }[] = [
    { value: "pt", label: "Português (BR)", flag: "🇧🇷" },
    { value: "es", label: "Español", flag: "🇪🇸" },
    { value: "en", label: "English", flag: "🇺🇸" },
];

const fontOptions = [
    { value: "normal" as const, label: "Normal", size: "14px" },
    { value: "large" as const, label: "Grande", size: "16px" },
    { value: "xlarge" as const, label: "Extra Grande", size: "18px" },
];

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
    return (
        <label className="flex items-center justify-between cursor-pointer py-2">
            <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</p>
                {description && <p className="text-xs text-zinc-400 mt-0.5">{description}</p>}
            </div>
            <button
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={cn("w-11 h-6 rounded-full transition-colors relative", checked ? "bg-orange-500" : "bg-zinc-300 dark:bg-zinc-600")}
            >
                <div className={cn("absolute top-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform", checked ? "left-[22px]" : "left-[2px]")} />
            </button>
        </label>
    );
}

export default function SettingsPage() {
    const [orgName, setOrgName] = useState("Restaurante Premium");
    const [primaryColor, setPrimaryColor] = useState("#000000");
    const [accentColor, setAccentColor] = useState("#FFD700");
    const [saved, setSaved] = useState(false);

    const { theme, setTheme } = useTheme();
    const { settings, updateSetting } = useA11y();
    const { locale, setLocale, t } = useI18n();
    const { levelData, triggerLevelUp, handleComplete, LevelUpComponent } = useLevelUp();

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleTestLevelUp = () => {
        triggerLevelUp({
            newLevel: 5,
            levelName: "Especialista em Qualidade",
            xpTotal: 5000,
            xpNext: 7500,
            unlockedReward: "Badge Mestre APPCC 🛡️",
        });
    };

    const handleRestartTour = () => {
        if (typeof window !== "undefined" && (window as any).__restartTour) {
            (window as any).__restartTour();
        }
    };

    return (
        <>
            <LevelUpComponent data={levelData} onComplete={handleComplete} />

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 max-w-2xl"
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        {t("settings.title")}
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">Personalize seu restaurante e conta</p>
                </div>

                {/* DARK MODE / THEME */}
                <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <Palette className="w-4.5 h-4.5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-zinc-900 dark:text-zinc-50">{t("settings.theme")}</h2>
                            <p className="text-xs text-zinc-400">Escolha o visual da interface</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {themeOptions.map((opt) => {
                            const Icon = opt.icon;
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => setTheme(opt.value)}
                                    className={cn(
                                        "rounded-xl border-2 p-4 transition-all flex flex-col items-center gap-2.5",
                                        theme === opt.value
                                            ? "border-orange-400 bg-orange-50 dark:bg-orange-950/30 shadow-md"
                                            : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700"
                                    )}
                                >
                                    <div className={cn("w-full h-10 rounded-lg border", opt.preview)} />
                                    <div className="flex items-center gap-1.5">
                                        <Icon className="w-4 h-4 text-zinc-500" />
                                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{t(opt.labelKey)}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Custom colors */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Cor Primária</label>
                            <div className="flex items-center gap-2">
                                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer" />
                                <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs font-mono" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Cor de Destaque</label>
                            <div className="flex items-center gap-2">
                                <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-10 h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer" />
                                <input type="text" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs font-mono" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* LANGUAGE / i18n */}
                <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <Languages className="w-4.5 h-4.5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-zinc-900 dark:text-zinc-50">{t("settings.language")}</h2>
                            <p className="text-xs text-zinc-400">Para franquias internacionais</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {languageOptions.map((lang) => (
                            <button
                                key={lang.value}
                                onClick={() => setLocale(lang.value)}
                                className={cn(
                                    "rounded-xl border-2 p-3 transition-all flex items-center gap-2.5",
                                    locale === lang.value
                                        ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30 shadow-md"
                                        : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700"
                                )}
                            >
                                <span className="text-2xl">{lang.flag}</span>
                                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{lang.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ACCESSIBILITY */}
                <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                            <Accessibility className="w-4.5 h-4.5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-zinc-900 dark:text-zinc-50">{t("settings.accessibility")}</h2>
                            <p className="text-xs text-zinc-400">Tamanho de fonte, contraste e leitores de tela</p>
                        </div>
                    </div>

                    {/* Font Size */}
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-2 flex items-center gap-1">
                            <Type className="w-3.5 h-3.5" /> {t("settings.font_size")}
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {fontOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => updateSetting("fontSize", opt.value)}
                                    className={cn(
                                        "rounded-xl border-2 py-3 px-4 transition-all text-center",
                                        settings.fontSize === opt.value
                                            ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 shadow-md"
                                            : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700"
                                    )}
                                >
                                    <span className="font-bold text-zinc-700 dark:text-zinc-300" style={{ fontSize: opt.size }}>{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-1 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                        <Toggle
                            checked={settings.highContrast}
                            onChange={(v) => updateSetting("highContrast", v)}
                            label={t("settings.high_contrast")}
                            description="Aumenta o contraste entre texto e fundo"
                        />
                        <Toggle
                            checked={settings.reduceMotion}
                            onChange={(v) => updateSetting("reduceMotion", v)}
                            label={t("settings.reduce_motion")}
                            description="Desativa confetti, transições e animações"
                        />
                        <Toggle
                            checked={settings.screenReaderHints}
                            onChange={(v) => updateSetting("screenReaderHints", v)}
                            label={t("settings.screen_reader")}
                            description="Adiciona aria-labels e descrições extras"
                        />
                    </div>
                </div>

                {/* ORGANIZATION */}
                <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                            <Building2 className="w-4.5 h-4.5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-zinc-900 dark:text-zinc-50">Organização</h2>
                            <p className="text-xs text-zinc-400">Dados do restaurante</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Nome do Restaurante</label>
                        <input
                            type="text"
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                        />
                    </div>
                </div>

                {/* NOTIFICATIONS */}
                <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6 space-y-2">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                            <Bell className="w-4.5 h-4.5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-zinc-900 dark:text-zinc-50">Notificações</h2>
                            <p className="text-xs text-zinc-400">Alertas e webhooks</p>
                        </div>
                    </div>
                    <Toggle
                        checked={true}
                        onChange={() => { }}
                        label="Notificar via WhatsApp ao completar checklist"
                        description="Dispara via webhook n8n"
                    />
                    <Toggle
                        checked={true}
                        onChange={() => { }}
                        label="Notificar responsáveis em planos de ação"
                        description="Dispara via webhook n8n"
                    />
                </div>

                {/* TESTING / DEMOS */}
                <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-500 flex items-center justify-center">
                            <Sparkles className="w-4.5 h-4.5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-zinc-900 dark:text-zinc-50">Demonstrações</h2>
                            <p className="text-xs text-zinc-400">Testar funcionalidades</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleTestLevelUp} className="py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-bold hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> Testar Level Up
                        </button>
                        <button onClick={handleRestartTour} className="py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-xs font-bold hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-1.5">
                            <RefreshCcw className="w-3.5 h-3.5" /> Reiniciar Tour
                        </button>
                    </div>
                </div>

                {/* Save */}
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-xl font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-sm shadow-sm"
                >
                    <Save className="w-4 h-4" />
                    {saved ? "Salvo ✓" : t("common.save") + " alterações"}
                </button>
            </motion.div>
        </>
    );
}
