import { ChecklistTemplate } from "@/types";

const DIFFICULTY_MULTIPLIER: Record<string, number> = {
    easy: 1,
    medium: 1.2,
    hard: 1.5,
};

const POINTS_PER_ITEM = 10;

/**
 * Calcula o score final de um checklist baseado no progresso e dificuldade.
 */
export function calculateScore(
    template: ChecklistTemplate,
    completedItemIds: string[]
): number {
    const basePoints = completedItemIds.length * POINTS_PER_ITEM;
    const multiplier = DIFFICULTY_MULTIPLIER[template.difficulty] || 1;

    // Bônus se 100% dos itens obrigatórios foram completados
    const requiredItems = template.questions.filter((i) => i.is_required);
    const allRequiredDone = requiredItems.every((i) =>
        completedItemIds.includes(i.id)
    );
    const completionBonus = allRequiredDone ? 20 : 0;

    return Math.floor((basePoints + completionBonus) * multiplier);
}

/**
 * Retorna o nível do usuário baseado no score global.
 */
export function getUserLevel(globalScore: number): {
    level: number;
    title: string;
    nextLevelAt: number;
    progress: number;
} {
    const levels = [
        { min: 0, title: "Iniciante" },
        { min: 500, title: "Aprendiz" },
        { min: 1500, title: "Competente" },
        { min: 3000, title: "Proficiente" },
        { min: 5000, title: "Expert" },
        { min: 8000, title: "Mestre" },
        { min: 12000, title: "Grão-Mestre" },
    ];

    let currentLevel = 0;
    for (let i = levels.length - 1; i >= 0; i--) {
        if (globalScore >= levels[i].min) {
            currentLevel = i;
            break;
        }
    }

    const nextLevel = levels[currentLevel + 1];
    const nextLevelAt = nextLevel ? nextLevel.min : levels[currentLevel].min;
    const currentMin = levels[currentLevel].min;
    const progress = nextLevel
        ? ((globalScore - currentMin) / (nextLevelAt - currentMin)) * 100
        : 100;

    return {
        level: currentLevel + 1,
        title: levels[currentLevel].title,
        nextLevelAt,
        progress: Math.min(100, Math.round(progress)),
    };
}
