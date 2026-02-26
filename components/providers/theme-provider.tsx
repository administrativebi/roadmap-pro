"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: "system",
    setTheme: () => { },
    isDark: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("system");
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("checklist-theme") as Theme | null;
        if (saved) {
            setThemeState(saved);
        }
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        let dark = false;

        if (theme === "dark") {
            dark = true;
        } else if (theme === "system") {
            dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        }

        if (dark) {
            root.classList.add("dark");
            // Override inline theme.json variables for dark mode
            document.body.style.setProperty("--bg-color", "#09090b");
            document.body.style.setProperty("--surface-color", "#18181b");
            document.body.style.setProperty("--text-color", "#fafafa");
            document.body.style.backgroundColor = "#09090b";
            document.body.style.color = "#fafafa";
        } else {
            root.classList.remove("dark");
            // Restore light theme (from theme.json)
            document.body.style.setProperty("--bg-color", "#F9F9F9");
            document.body.style.setProperty("--surface-color", "#FFFFFF");
            document.body.style.setProperty("--text-color", "#1A1A1A");
            document.body.style.backgroundColor = "";
            document.body.style.color = "";
        }

        setIsDark(dark);
        localStorage.setItem("checklist-theme", theme);
    }, [theme]);

    // Listen for system theme changes
    useEffect(() => {
        if (theme !== "system") return;
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = (e: MediaQueryListEvent) => {
            const root = document.documentElement;
            if (e.matches) {
                root.classList.add("dark");
                setIsDark(true);
            } else {
                root.classList.remove("dark");
                setIsDark(false);
            }
        };
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [theme]);

    const setTheme = (t: Theme) => setThemeState(t);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
