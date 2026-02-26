"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface FocusModeContextType {
    isFocused: boolean;
    enterFocus: () => void;
    exitFocus: () => void;
    toggleFocus: () => void;
}

const FocusModeContext = createContext<FocusModeContextType>({
    isFocused: false,
    enterFocus: () => { },
    exitFocus: () => { },
    toggleFocus: () => { },
});

export function FocusModeProvider({ children }: { children: ReactNode }) {
    const [isFocused, setIsFocused] = useState(false);

    const enterFocus = () => setIsFocused(true);
    const exitFocus = () => setIsFocused(false);
    const toggleFocus = () => setIsFocused((prev) => !prev);

    return (
        <FocusModeContext.Provider value={{ isFocused, enterFocus, exitFocus, toggleFocus }}>
            {children}
        </FocusModeContext.Provider>
    );
}

export const useFocusMode = () => useContext(FocusModeContext);
