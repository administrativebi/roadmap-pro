"use client";

import { motion } from "framer-motion";
import { Camera, ScanLine, AlertTriangle, CheckCircle2, FileWarning, Zap, Bot, Smartphone, RotateCcw } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function AiScannerPage() {
    const [scanState, setScanState] = useState<"idle" | "scanning" | "result_success" | "result_danger">("idle");
    const [scanType, setScanType] = useState<"temperature" | "label">("label");

    // Mock progress for simulation
    const [progress, setProgress] = useState(0);

    const startScan = (type: "temperature" | "label") => {
        setScanType(type);
        setScanState("scanning");
        setProgress(0);

        // Simulate AI thinking
        let currentProgress = 0;
        const interval = setInterval(() => {
            currentProgress += 10;
            setProgress(currentProgress);
            if (currentProgress >= 100) {
                clearInterval(interval);
                // Randomly choose success or danger for demonstration, or hardcode based on type
                if (type === "label") {
                    setScanState("result_danger"); // Show auto-escalation
                } else {
                    setScanState("result_success"); // Show normal success
                }
            }
        }, 300);
    };

    const resetScan = () => {
        setScanState("idle");
        setProgress(0);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-3xl mx-auto"
        >
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                    <Bot className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Scanner IA Vision
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2 max-w-md mx-auto">
                    Tire fotos de rótulos ou equipamentos. A Inteligência Artificial analisa a imagem, extrai dados (OCR) e identifica não conformidades instantaneamente.
                </p>
            </div>

            {/* Camera Viewfinder Mock */}
            <div className="bg-zinc-900 dark:bg-black rounded-3xl overflow-hidden relative aspect-[4/3] md:aspect-video shadow-2xl ring-1 ring-zinc-800">
                {/* Visualizer Frame */}
                <div className="absolute inset-0 z-0">
                    {/* Simulated Camera Feed */}
                    <img
                        src={scanType === "label"
                            ? "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?q=80&w=640"
                            : "https://images.unsplash.com/photo-1584346133934-a3afd2a33c4c?q=80&w=640"
                        }
                        alt="Camera Feed"
                        className={cn("w-full h-full object-cover opacity-60 transition-all duration-1000", scanState !== "idle" && "blur-sm brightness-50")}
                    />
                </div>

                {/* HUD Elements */}
                <div className="absolute inset-0 z-10 p-6 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-bold border border-white/10 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> REC
                        </div>
                        {scanState === "idle" && (
                            <div className="flex bg-black/50 backdrop-blur-md rounded-xl p-1 border border-white/10">
                                <button
                                    onClick={() => setScanType("label")}
                                    className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-colors", scanType === "label" ? "bg-white text-black" : "text-white")}
                                >
                                    Rótulos
                                </button>
                                <button
                                    onClick={() => setScanType("temperature")}
                                    className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-colors", scanType === "temperature" ? "bg-white text-black" : "text-white")}
                                >
                                    Visão Geral
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Interactive Area */}
                    <div className="flex-1 flex items-center justify-center relative">
                        {scanState === "idle" && (
                            <div className="w-48 h-48 border-2 border-white/40 rounded-2xl relative">
                                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white" />
                                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-white" />
                                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-white" />
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <ScanLine className="w-8 h-8 text-white/50" />
                                </div>
                            </div>
                        )}

                        {scanState === "scanning" && (
                            <div className="w-full max-w-sm bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center shadow-2xl">
                                <div className="relative w-16 h-16 mx-auto mb-4">
                                    <svg className="animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                                        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                                    </svg>
                                    <Bot className="w-6 h-6 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <h3 className="text-white font-bold mb-1">Processando Imagem</h3>
                                <p className="text-white/60 text-xs mb-4">A IA está lendo o contexto...</p>
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                                        animate={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {scanState === "result_danger" && (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-full max-w-md bg-white dark:bg-zinc-900 border-2 border-rose-500 rounded-2xl overflow-hidden shadow-2xl"
                            >
                                <div className="bg-rose-500 text-white p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2 font-bold">
                                        <AlertTriangle className="w-5 h-5" /> Não Conformidade Crítica
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/50 rounded-xl flex items-center justify-center text-rose-600 shrink-0">
                                            <FileWarning className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-zinc-900 dark:text-zinc-50">Produto Vencido Identificado (OCR)</h4>
                                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                                                A IA extraiu as seguintes informações do rótulo:
                                            </p>
                                            <ul className="text-sm space-y-1 mt-2 mb-4">
                                                <li><strong className="text-zinc-700 dark:text-zinc-300">Produto:</strong> Molho de Tomate Tradicional</li>
                                                <li><strong className="text-zinc-700 dark:text-zinc-300">Lote:</strong> TX-99201</li>
                                                <li><strong className="text-zinc-700 dark:text-zinc-300">Validade:</strong> <span className="text-rose-500 font-bold">12/Fev/2026 (Expirado)</span></li>
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Auto-escalonamento */}
                                    <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl p-4 flex gap-3 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl" />
                                        <Zap className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                                        <div>
                                            <h5 className="font-bold text-rose-800 dark:text-rose-400 text-sm flex items-center gap-2">
                                                Auto-escalonamento Acionado
                                                <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider">Automático</span>
                                            </h5>
                                            <p className="text-xs text-rose-700/80 dark:text-rose-400/80 mt-1">
                                                Um Plano de Ação foi gerado: "Descartar Produto".<br />
                                                O Gerente e o Supervisor foram notificados via WhatsApp.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {scanState === "result_success" && (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-emerald-500 text-white rounded-2xl p-6 text-center shadow-2xl flex flex-col items-center"
                            >
                                <div className="w-16 h-16 bg-white/20 rounded-full border-4 border-white flex items-center justify-center mb-3">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-lg">Visão Limpa</h3>
                                <p className="text-emerald-100 text-sm mt-1 mb-4">Nenhuma anomalia identificada no equipamento.</p>
                                <div className="bg-black/20 px-4 py-2 rounded-lg text-xs font-mono">
                                    Confiança da IA: 98.4%
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Camera Controls */}
                    <div className="flex justify-center mt-6">
                        {scanState === "idle" ? (
                            <button
                                onClick={() => startScan(scanType)}
                                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all outline-none focus:ring-4 focus:ring-white/20"
                            >
                                <div className="w-12 h-12 bg-white rounded-full relative shadow-lg">
                                    <Camera className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-800" />
                                </div>
                            </button>
                        ) : (
                            <button
                                onClick={resetScan}
                                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors border border-white/20"
                            >
                                <RotateCcw className="w-4 h-4" /> Nova Leitura
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20 rounded-2xl p-5 flex items-start gap-4 text-sm mt-6">
                <Smartphone className="w-6 h-6 text-indigo-500 shrink-0" />
                <div>
                    <strong className="text-zinc-900 dark:text-zinc-50 block mb-1">Tecnologia OCR & Auto-escalonamento (IDs 22, 23, 37)</strong>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        O app usa modelos de Visão Computacional de Borda. Basta focar a câmera no rótulo para ele extrair instantaneamente Lote e Validade. Caso encontre problemas críticos (como expiração), ele gera um Plano de Ação automaticamente sem intervenção humana, e avisa supervisores via WhatsApp.
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
