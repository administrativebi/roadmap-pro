// Tipos para o Construtor de Checklists

export type QuestionType = "yes_no" | "text" | "number" | "options" | "photo" | "rating";

export interface ConditionalRule {
    id: string;
    triggerAnswer: string; // e.g. "no", "< 5"
    action: "show_questions" | "require_photo" | "create_action_plan";
    targetQuestionIds: string[];
}

export interface MediaInstruction {
    id: string;
    type: "image" | "video";
    url: string;
    caption: string;
}

export interface ChecklistQuestion {
    id: string;
    text: string;
    type: QuestionType;
    required: boolean;
    weight: number; // 1-5, peso para score de conformidade
    options?: string[]; // para tipo "options"
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

export const QUESTION_TYPE_CONFIG: Record<QuestionType, { label: string; icon: string; description: string }> = {
    yes_no: { label: "Sim / Não", icon: "✅", description: "Resposta binária de conformidade" },
    text: { label: "Texto", icon: "📝", description: "Resposta descritiva livre" },
    number: { label: "Número", icon: "🔢", description: "Valor numérico (temperatura, quantidade)" },
    options: { label: "Múltipla Escolha", icon: "📋", description: "Selecionar entre opções pré-definidas" },
    photo: { label: "Foto", icon: "📸", description: "Capturar evidência fotográfica" },
    rating: { label: "Avaliação", icon: "⭐", description: "Escala de 1 a 5 estrelas" },
};

export const SECTION_COLORS = [
    "#ef4444", "#f59e0b", "#10b981", "#3b82f6",
    "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

export const SECTION_ICONS = [
    "🧹", "⚙️", "📦", "🌡️", "🛡️", "🍽️", "🧤", "📋",
    "🔬", "💡", "🚿", "🗑️", "🧊", "🔥", "🧴", "📐",
];
