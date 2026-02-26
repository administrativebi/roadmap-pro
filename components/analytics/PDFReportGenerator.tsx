"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileDown, Calendar, Filter, Loader2, FileText, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type ReportType = "daily" | "weekly" | "monthly" | "audit";

const reportTypes: { id: ReportType; label: string; desc: string; icon: string }[] = [
    { id: "daily", label: "Relatório Diário", desc: "Resumo do dia com todas as respostas", icon: "📋" },
    { id: "weekly", label: "Relatório Semanal", desc: "Comparativo e tendências da semana", icon: "📊" },
    { id: "monthly", label: "Relatório Mensal", desc: "Análise completa com gráficos e fotos", icon: "📈" },
    { id: "audit", label: "Relatório de Auditoria (ANVISA)", desc: "Formato oficial para fiscalização sanitária", icon: "🛡️" },
];

const sections = [
    { id: "summary", label: "Resumo Executivo", default: true },
    { id: "scores", label: "Score de Conformidade", default: true },
    { id: "heatmap", label: "Mapa de Calor (Falhas)", default: true },
    { id: "shifts", label: "Indicadores por Turno", default: false },
    { id: "photos", label: "Evidências Fotográficas", default: true },
    { id: "trends", label: "Tendências e IA", default: false },
    { id: "actions", label: "Planos de Ação Ativos", default: true },
    { id: "nps", label: "NPS / Clima da Equipe", default: false },
    { id: "signatures", label: "Assinaturas Digitais", default: true },
    { id: "ranking", label: "Ranking de Colaboradores", default: false },
];

export function PDFReportGenerator() {
    const [selectedType, setSelectedType] = useState<ReportType>("monthly");
    const [selectedSections, setSelectedSections] = useState<string[]>(
        sections.filter((s) => s.default).map((s) => s.id)
    );
    const [dateRange, setDateRange] = useState({ from: "", to: "" });
    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);

    const toggleSection = (id: string) => {
        setSelectedSections((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
        );
    };

    const handleGenerate = async () => {
        setGenerating(true);
        setGenerated(false);

        // Simulate PDF generation
        await new Promise((res) => setTimeout(res, 3000));

        try {
            const { default: jsPDF } = await import("jspdf");
            const doc = new jsPDF("p", "mm", "a4");

            // Header
            doc.setFillColor(24, 24, 27);
            doc.rect(0, 0, 210, 45, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("Checklist Pro", 15, 20);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");

            const typeLabel = reportTypes.find((t) => t.id === selectedType)?.label || "";
            doc.text(typeLabel, 15, 28);
            doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 15, 35);

            // Score de Conformidade
            doc.setTextColor(24, 24, 27);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Score de Conformidade", 15, 60);

            doc.setFontSize(48);
            doc.setTextColor(16, 185, 129);
            doc.text("87", 85, 85);
            doc.setFontSize(14);
            doc.setTextColor(107, 114, 128);
            doc.text("/ 100", 110, 85);

            doc.setFontSize(10);
            doc.setTextColor(24, 24, 27);
            doc.text("Classificação: BOM", 15, 100);
            doc.text("Período anterior: 82 (+5 pts)", 15, 107);

            // Indicadores
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Indicadores Gerais", 15, 125);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            const indicators = [
                ["Checklists Concluídos", "128"],
                ["Taxa de Conclusão", "87%"],
                ["Pontuação Média", "92"],
                ["Não Conformidades", "15"],
                ["Planos de Ação Ativos", "3"],
            ];

            indicators.forEach(([label, value], i) => {
                const y = 135 + i * 8;
                doc.text(label, 15, y);
                doc.setFont("helvetica", "bold");
                doc.text(value, 160, y, { align: "right" });
                doc.setFont("helvetica", "normal");
                doc.setDrawColor(228, 228, 231);
                doc.line(15, y + 2, 195, y + 2);
            });

            // Top Falhas
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Top 5 — Maiores Não Conformidades", 15, 190);

            const topFails = [
                { q: "Equipamentos calibrados?", rate: "67%" },
                { q: "Ralos limpos e sem odor?", rate: "55%" },
                { q: "Temperatura câmara fria ≤ 5°C?", rate: "42%" },
                { q: "Lixeiras tampadas e forradas?", rate: "38%" },
                { q: "EPIs utilizados corretamente?", rate: "35%" },
            ];

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            topFails.forEach((fail, i) => {
                const y = 200 + i * 8;
                doc.setTextColor(239, 68, 68);
                doc.text(`${i + 1}.`, 15, y);
                doc.setTextColor(24, 24, 27);
                doc.text(fail.q, 25, y);
                doc.setTextColor(239, 68, 68);
                doc.setFont("helvetica", "bold");
                doc.text(fail.rate, 170, y, { align: "right" });
                doc.setFont("helvetica", "normal");
            });

            // Footer
            doc.setTextColor(161, 161, 170);
            doc.setFontSize(8);
            doc.text(
                "Relatório gerado automaticamente pelo Checklist Pro — Documento para uso interno",
                105,
                285,
                { align: "center" }
            );

            // Save
            doc.save(`relatorio-${selectedType}-${new Date().toISOString().split("T")[0]}.pdf`);
        } catch (err) {
            console.error("PDF generation error:", err);
        }

        setGenerating(false);
        setGenerated(true);
        setTimeout(() => setGenerated(false), 5000);
    };

    return (
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-6">
            <div className="flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Gerar Relatório PDF</h3>
            </div>

            {/* Report Type */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {reportTypes.map((type) => (
                    <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={cn(
                            "text-left p-4 rounded-xl border-2 transition-all",
                            selectedType === type.id
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                        )}
                    >
                        <span className="text-2xl block mb-2">{type.icon}</span>
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{type.label}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{type.desc}</p>
                    </button>
                ))}
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-4 mb-6">
                <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
                <div className="flex items-center gap-2 flex-1">
                    <input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm"
                    />
                    <span className="text-zinc-400 text-sm">até</span>
                    <input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm"
                    />
                </div>
            </div>

            {/* Sections */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Seções incluídas</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {sections.map((section) => {
                        const isSelected = selectedSections.includes(section.id);
                        return (
                            <button
                                key={section.id}
                                onClick={() => toggleSection(section.id)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left",
                                    isSelected
                                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                                        : "bg-zinc-50 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500"
                                )}
                            >
                                <div className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                                    isSelected ? "bg-blue-500 border-blue-500" : "border-zinc-300 dark:border-zinc-600"
                                )}>
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                {section.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Generate Button */}
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                disabled={generating}
                className={cn(
                    "w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                    generating
                        ? "bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-wait"
                        : generated
                            ? "bg-emerald-500 text-white"
                            : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                )}
            >
                {generating ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Gerando relatório...
                    </>
                ) : generated ? (
                    <>
                        <Check className="w-5 h-5" />
                        PDF gerado com sucesso!
                    </>
                ) : (
                    <>
                        <FileDown className="w-5 h-5" />
                        Gerar e Baixar PDF
                    </>
                )}
            </motion.button>
        </div>
    );
}
