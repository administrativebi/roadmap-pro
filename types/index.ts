// ─── Theme / Skins ─────────────────────────────────────────
export type ThemeConfig = {
    name?: string;
    colors: {
        primary: string;
        accent: string;
        background: string;
        surface?: string;
        text?: string;
    };
    assets: {
        logo?: string | null;
        dashboard_bg?: string | null;
    };
};

// ─── Organizações ──────────────────────────────────────────
export type Organization = {
    id: string;
    name: string;
    theme: ThemeConfig;
    created_at: string;
    updated_at: string;
};

// ─── Usuários ──────────────────────────────────────────────
export type User = {
    id: string;
    full_name: string;
    avatar_url?: string;
    global_score: number;
    level: number;
    streak_days: number;
    badges: string[];
    created_at: string;
};

export type OrganizationUser = {
    id: string;
    organization_id: string;
    user_id: string;
    role: "owner" | "admin" | "member";
    created_at: string;
};

// ─── Checklist Question Types ──────────────────────────────
export type QuestionType =
    | "yes_no"         // Sim ou Não
    | "text"           // Resposta descritiva (texto livre)
    | "number"         // Preencher quantidade numérica
    | "multi_choice"   // Selecionar uma opção entre várias
    | "checkbox"       // Flechar múltiplas opções
    | "photo"          // Apenas foto obrigatória
    | "rating";        // Nota de 1 a 5 (estrelas)

export type ChecklistQuestion = {
    id: string;
    text: string;
    type: QuestionType;
    is_required: boolean;
    options?: string[];           // Para multi_choice e checkbox
    allow_photo?: boolean;        // Permite anexar foto além da resposta
    photo_required?: boolean;     // Foto obrigatória nesta pergunta
    placeholder?: string;         // Placeholder para campos text/number
    min_value?: number;           // Para type number
    max_value?: number;           // Para type number
    points: number;               // Pontos por responder esta pergunta
};

// ─── Checklist Template ────────────────────────────────────
export type ChecklistTemplate = {
    id: string;
    organization_id: string;
    title: string;
    description?: string;
    icon?: string;
    difficulty: "easy" | "medium" | "hard";
    category?: string;
    estimated_minutes?: number;
    questions: ChecklistQuestion[];
    max_score: number;
    created_at: string;
    updated_at: string;
};

// ─── Respostas Individuais ─────────────────────────────────
export type QuestionResponse = {
    question_id: string;
    value: string | number | boolean | string[];
    photo_urls?: string[];
    answered_at: string;
};

// ─── Checklist Entry (Execução) ────────────────────────────
export type ChecklistEntry = {
    id: string;
    template_id: string;
    organization_id: string;
    user_id: string;
    schedule_id?: string;
    status: "in_progress" | "completed" | "canceled";
    score: number;
    max_score: number;
    percentage: number;
    completed_at?: string;
    responses: QuestionResponse[];
    created_at: string;
};

// ─── Agenda / Scheduling ──────────────────────────────────
export type ChecklistSchedule = {
    id: string;
    template_id: string;
    organization_id: string;
    assigned_user_id?: string;
    title: string;
    scheduled_date: string;       // YYYY-MM-DD
    scheduled_time?: string;      // HH:mm
    recurrence?: "none" | "daily" | "weekly" | "monthly";
    status: "pending" | "completed" | "overdue" | "skipped";
    entry_id?: string;            // Vincula à entry quando executado
    notes?: string;
    created_at: string;
};

// ─── Planos de Ação ────────────────────────────────────────
export type ActionPlan = {
    id: string;
    checklist_entry_id: string;
    title: string;
    description?: string;
    ai_suggestion?: string;
    status: "pending" | "in_progress" | "resolved";
    created_at: string;
    resolved_at?: string;
};

// ─── Gamificação ───────────────────────────────────────────
export type Badge = {
    id: string;
    name: string;
    description: string;
    icon: string;
    requirement: string;
    threshold: number;
};

export type GamificationLog = {
    id: string;
    user_id: string;
    organization_id: string;
    checklist_entry_id?: string;
    points: number;
    reason: string;
    badge_earned?: string;
    created_at: string;
};

// ─── Calendar View Helpers ─────────────────────────────────
export type CalendarDay = {
    date: string;
    isCurrentMonth: boolean;
    isToday: boolean;
    schedules: ChecklistSchedule[];
};
