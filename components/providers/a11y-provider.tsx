"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface A11ySettings {
    fontSize: "normal" | "large" | "xlarge";
    highContrast: boolean;
    reduceMotion: boolean;
    screenReaderHints: boolean;
}

interface A11yContextType {
    settings: A11ySettings;
    updateSetting: <K extends keyof A11ySettings>(key: K, value: A11ySettings[K]) => void;
    fontScale: number;
}

const defaultSettings: A11ySettings = {
    fontSize: "normal",
    highContrast: false,
    reduceMotion: false,
    screenReaderHints: true,
};

const fontScales: Record<A11ySettings["fontSize"], number> = {
    normal: 1,
    large: 1.15,
    xlarge: 1.3,
};

const A11yContext = createContext<A11yContextType>({
    settings: defaultSettings,
    updateSetting: () => { },
    fontScale: 1,
});

export function A11yProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<A11ySettings>(defaultSettings);

    useEffect(() => {
        const saved = localStorage.getItem("checklist-a11y");
        if (saved) {
            try {
                setSettings({ ...defaultSettings, ...JSON.parse(saved) });
            } catch { }
        }
    }, []);

    useEffect(() => {
        const root = document.documentElement;

        // Font size
        root.style.fontSize = `${fontScales[settings.fontSize] * 16}px`;

        // High contrast
        if (settings.highContrast) {
            root.classList.add("high-contrast");
        } else {
            root.classList.remove("high-contrast");
        }

        // Reduce motion
        if (settings.reduceMotion) {
            root.classList.add("reduce-motion");
        } else {
            root.classList.remove("reduce-motion");
        }

        localStorage.setItem("checklist-a11y", JSON.stringify(settings));
    }, [settings]);

    const updateSetting = <K extends keyof A11ySettings>(key: K, value: A11ySettings[K]) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <A11yContext.Provider value={{ settings, updateSetting, fontScale: fontScales[settings.fontSize] }}>
            {children}
        </A11yContext.Provider>
    );
}

export const useA11y = () => useContext(A11yContext);
