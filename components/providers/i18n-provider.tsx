"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

export type Locale = "pt" | "es" | "en";

const translations: Record<Locale, Record<string, string>> = {
    pt: {
        // Navigation
        "nav.dashboard": "Dashboard",
        "nav.checklists": "Checklists",
        "nav.builder": "Construtor",
        "nav.schedule": "Agenda",
        "nav.ranking": "Ranking",
        "nav.action_plans": "Planos de Ação",
        "nav.manager": "Painel Gestor",
        "nav.smart_assign": "Atribuição IA",
        "nav.shift_handoff": "Troca de Turno",
        "nav.training": "Treinamento",
        "nav.onboarding": "Onboarding",
        "nav.recognition": "Mural",
        "nav.evaluation": "Avaliação 360",
        "nav.qrcodes": "QR Codes",
        "nav.settings": "Configurações",
        "nav.logout": "Sair",
        // Common
        "common.save": "Salvar",
        "common.cancel": "Cancelar",
        "common.confirm": "Confirmar",
        "common.delete": "Excluir",
        "common.edit": "Editar",
        "common.search": "Buscar",
        "common.filter": "Filtrar",
        "common.all": "Todos",
        "common.yes": "Sim",
        "common.no": "Não",
        "common.loading": "Carregando...",
        "common.back": "Voltar",
        "common.next": "Próximo",
        "common.previous": "Anterior",
        "common.close": "Fechar",
        "common.complete": "Concluir",
        // Dashboard
        "dashboard.welcome": "Bem-vindo de volta",
        "dashboard.streak": "dias seguidos!",
        "dashboard.streak_desc": "Sequência de checklists",
        "dashboard.today_checklists": "Checklists de Hoje",
        "dashboard.completion_rate": "Taxa de Conclusão",
        "dashboard.xp_earned": "XP Ganhos",
        "dashboard.level": "Nível",
        // Checklists
        "checklist.start": "Iniciar Checklist",
        "checklist.complete": "Finalizar Checklist",
        "checklist.progress": "Progresso",
        "checklist.question": "Pergunta",
        "checklist.questions": "perguntas",
        "checklist.required": "Obrigatória",
        "checklist.optional": "Opcional",
        "checklist.score": "Pontuação",
        "checklist.status.pending": "Pendente",
        "checklist.status.in_progress": "Em Andamento",
        "checklist.status.completed": "Concluído",
        // Gamification
        "game.level_up": "Subiu de Nível!",
        "game.xp": "XP",
        "game.badge_earned": "Badge Conquistada!",
        "game.streak_bonus": "Bônus de Sequência",
        "game.speed_bonus": "Bônus de Velocidade",
        "game.focus_bonus": "Bônus de Foco",
        // Settings
        "settings.title": "Configurações",
        "settings.theme": "Tema",
        "settings.theme.light": "Claro",
        "settings.theme.dark": "Escuro",
        "settings.theme.system": "Sistema",
        "settings.language": "Idioma",
        "settings.accessibility": "Acessibilidade",
        "settings.font_size": "Tamanho da Fonte",
        "settings.font_size.normal": "Normal",
        "settings.font_size.large": "Grande",
        "settings.font_size.xlarge": "Extra Grande",
        "settings.high_contrast": "Alto Contraste",
        "settings.reduce_motion": "Reduzir Animações",
        "settings.screen_reader": "Dicas para Leitores de Tela",
    },
    es: {
        // Navigation
        "nav.dashboard": "Panel",
        "nav.checklists": "Checklists",
        "nav.builder": "Constructor",
        "nav.schedule": "Agenda",
        "nav.ranking": "Ranking",
        "nav.action_plans": "Planes de Acción",
        "nav.manager": "Panel del Gerente",
        "nav.smart_assign": "Asignación IA",
        "nav.shift_handoff": "Cambio de Turno",
        "nav.training": "Capacitación",
        "nav.onboarding": "Onboarding",
        "nav.recognition": "Reconocimientos",
        "nav.evaluation": "Evaluación 360",
        "nav.qrcodes": "Códigos QR",
        "nav.settings": "Configuración",
        "nav.logout": "Salir",
        // Common
        "common.save": "Guardar",
        "common.cancel": "Cancelar",
        "common.confirm": "Confirmar",
        "common.delete": "Eliminar",
        "common.edit": "Editar",
        "common.search": "Buscar",
        "common.filter": "Filtrar",
        "common.all": "Todos",
        "common.yes": "Sí",
        "common.no": "No",
        "common.loading": "Cargando...",
        "common.back": "Volver",
        "common.next": "Siguiente",
        "common.previous": "Anterior",
        "common.close": "Cerrar",
        "common.complete": "Completar",
        // Dashboard
        "dashboard.welcome": "Bienvenido de vuelta",
        "dashboard.streak": "días seguidos!",
        "dashboard.streak_desc": "Racha de checklists",
        "dashboard.today_checklists": "Checklists de Hoy",
        "dashboard.completion_rate": "Tasa de Completado",
        "dashboard.xp_earned": "XP Ganados",
        "dashboard.level": "Nivel",
        // Checklists
        "checklist.start": "Iniciar Checklist",
        "checklist.complete": "Finalizar Checklist",
        "checklist.progress": "Progreso",
        "checklist.question": "Pregunta",
        "checklist.questions": "preguntas",
        "checklist.required": "Obligatoria",
        "checklist.optional": "Opcional",
        "checklist.score": "Puntuación",
        "checklist.status.pending": "Pendiente",
        "checklist.status.in_progress": "En Progreso",
        "checklist.status.completed": "Completado",
        // Gamification
        "game.level_up": "¡Subiste de Nivel!",
        "game.xp": "XP",
        "game.badge_earned": "¡Badge Conseguido!",
        "game.streak_bonus": "Bonus de Racha",
        "game.speed_bonus": "Bonus de Velocidad",
        "game.focus_bonus": "Bonus de Enfoque",
        // Settings
        "settings.title": "Configuración",
        "settings.theme": "Tema",
        "settings.theme.light": "Claro",
        "settings.theme.dark": "Oscuro",
        "settings.theme.system": "Sistema",
        "settings.language": "Idioma",
        "settings.accessibility": "Accesibilidad",
        "settings.font_size": "Tamaño de Fuente",
        "settings.font_size.normal": "Normal",
        "settings.font_size.large": "Grande",
        "settings.font_size.xlarge": "Extra Grande",
        "settings.high_contrast": "Alto Contraste",
        "settings.reduce_motion": "Reducir Animaciones",
        "settings.screen_reader": "Pistas para Lectores de Pantalla",
    },
    en: {
        // Navigation
        "nav.dashboard": "Dashboard",
        "nav.checklists": "Checklists",
        "nav.builder": "Builder",
        "nav.schedule": "Schedule",
        "nav.ranking": "Ranking",
        "nav.action_plans": "Action Plans",
        "nav.manager": "Manager Panel",
        "nav.smart_assign": "AI Assignment",
        "nav.shift_handoff": "Shift Handoff",
        "nav.training": "Training",
        "nav.onboarding": "Onboarding",
        "nav.recognition": "Recognition",
        "nav.evaluation": "360° Evaluation",
        "nav.qrcodes": "QR Codes",
        "nav.settings": "Settings",
        "nav.logout": "Logout",
        // Common
        "common.save": "Save",
        "common.cancel": "Cancel",
        "common.confirm": "Confirm",
        "common.delete": "Delete",
        "common.edit": "Edit",
        "common.search": "Search",
        "common.filter": "Filter",
        "common.all": "All",
        "common.yes": "Yes",
        "common.no": "No",
        "common.loading": "Loading...",
        "common.back": "Back",
        "common.next": "Next",
        "common.previous": "Previous",
        "common.close": "Close",
        "common.complete": "Complete",
        // Dashboard
        "dashboard.welcome": "Welcome back",
        "dashboard.streak": "day streak!",
        "dashboard.streak_desc": "Checklist streak",
        "dashboard.today_checklists": "Today's Checklists",
        "dashboard.completion_rate": "Completion Rate",
        "dashboard.xp_earned": "XP Earned",
        "dashboard.level": "Level",
        // Checklists
        "checklist.start": "Start Checklist",
        "checklist.complete": "Finish Checklist",
        "checklist.progress": "Progress",
        "checklist.question": "Question",
        "checklist.questions": "questions",
        "checklist.required": "Required",
        "checklist.optional": "Optional",
        "checklist.score": "Score",
        "checklist.status.pending": "Pending",
        "checklist.status.in_progress": "In Progress",
        "checklist.status.completed": "Completed",
        // Gamification
        "game.level_up": "Level Up!",
        "game.xp": "XP",
        "game.badge_earned": "Badge Earned!",
        "game.streak_bonus": "Streak Bonus",
        "game.speed_bonus": "Speed Bonus",
        "game.focus_bonus": "Focus Bonus",
        // Settings
        "settings.title": "Settings",
        "settings.theme": "Theme",
        "settings.theme.light": "Light",
        "settings.theme.dark": "Dark",
        "settings.theme.system": "System",
        "settings.language": "Language",
        "settings.accessibility": "Accessibility",
        "settings.font_size": "Font Size",
        "settings.font_size.normal": "Normal",
        "settings.font_size.large": "Large",
        "settings.font_size.xlarge": "Extra Large",
        "settings.high_contrast": "High Contrast",
        "settings.reduce_motion": "Reduce Motion",
        "settings.screen_reader": "Screen Reader Hints",
    },
};

interface I18nContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
    locale: "pt",
    setLocale: () => { },
    t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>("pt");

    useEffect(() => {
        const saved = localStorage.getItem("checklist-locale") as Locale | null;
        if (saved && translations[saved]) {
            setLocaleState(saved);
        }
    }, []);

    const setLocale = (l: Locale) => {
        setLocaleState(l);
        localStorage.setItem("checklist-locale", l);
        document.documentElement.lang = l === "pt" ? "pt-BR" : l === "es" ? "es" : "en";
    };

    const t = useCallback(
        (key: string) => translations[locale]?.[key] ?? translations.pt?.[key] ?? key,
        [locale]
    );

    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export const useI18n = () => useContext(I18nContext);
