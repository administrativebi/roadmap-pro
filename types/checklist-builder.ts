// Tipos para o Construtor de Checklists

export type QuestionType = "yes_no" | "text" | "number" | "options" | "photo" | "rating";

// Helper types for properties that can be combined
export type QuestionProperty = "yes_no" | "text" | "number" | "options" | "multiple_selection" | "photo" | "rating";

export type ComparisonOperator = "equals" | "not_equals" | "greater_than" | "less_than" | "gte" | "lte";

export interface ConditionalRule {
    id: string;
    operator: ComparisonOperator;
    compareValue: string; // value to compare against
    triggerAnswer: string; // legacy - kept for backward compat
    action: "show_questions" | "require_photo" | "create_action_plan" | "notify_supervisor";
    targetQuestionIds: string[];
    nestedRules?: ConditionalRule[]; // support nested/chained conditions
}

export interface MediaInstruction {
    id: string;
    type: "image" | "video";
    url: string;
    caption: string;
    file?: File; // for upload
}

export interface OptionItem {
    label: string;
    score: number; // pontuação individual por opção
}

export interface ChecklistQuestion {
    id: string;
    text: string;
    type: QuestionType;
    properties: QuestionProperty[]; // NEW: multiple properties per question (e.g. ["yes_no", "photo"])
    required: boolean;
    weight: number; // 1-5, peso para score de conformidade
    options?: string[]; // para tipo "options" (legacy)
    optionItems?: OptionItem[]; // NEW: options with individual scores
    placeholder?: string;
    helpText?: string;
    mediaInstructions: MediaInstruction[];
    conditionalRules: ConditionalRule[];
    conditionalParentId?: string; // se essa pergunta é condicional de outra
    order: number;
}

export interface ChecklistSection {
    id: string;
    title: string;
    description?: string;
    color: string;
    icon: string;
    questions: ChecklistQuestion[];
    collapsed?: boolean;
    order: number;
}

export interface ChecklistVersion {
    id: string;
    version: number;
    createdAt: string;
    createdBy: string;
    changes: string;
    sectionsSnapshot: ChecklistSection[];
}

export interface ChecklistTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    estimatedTime: number; // minutos
    difficulty: "easy" | "medium" | "hard";
    sections: ChecklistSection[];
    versions: ChecklistVersion[];
    currentVersion: number;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    isPublished: boolean;
    assignedUnits: string[];
}

export const QUESTION_TYPE_CONFIG: Record<QuestionType | "multiple_selection", { label: string; icon: string; description: string }> = {
    yes_no: { label: "Sim / Não", icon: "✅", description: "Resposta binária de conformidade" },
    text: { label: "Texto", icon: "📝", description: "Resposta descritiva livre" },
    number: { label: "Número", icon: "🔢", description: "Valor numérico (temperatura, quantidade)" },
    options: { label: "Múltipla Escolha", icon: "📋", description: "Selecionar entre opções pré-definidas" },
    multiple_selection: { label: "Múltipla Seleção", icon: "☑️", description: "Selecionar mais de uma opção" },
    photo: { label: "Foto", icon: "📸", description: "Capturar evidência fotográfica" },
    rating: { label: "Avaliação", icon: "⭐", description: "Escala de 1 a 5 estrelas" },
};

export const COMPARISON_OPERATORS: Record<ComparisonOperator, string> = {
    equals: "Igual a",
    not_equals: "Diferente de",
    greater_than: "Maior que",
    less_than: "Menor que",
    gte: "Igual ou maior que",
    lte: "Igual ou menor que",
};

export const SECTION_COLORS = [
    "#ef4444", "#f59e0b", "#10b981", "#3b82f6",
    "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

export const SECTION_ICONS = [
    "🧹", "⚙️", "📦", "🌡️", "🛡️", "🍽️", "🧤", "📋",
    "🔬", "💡", "🚿", "🗑️", "🧊", "🔥", "🧴", "📐",
];
