"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Eraser, Check, Undo2, Pen } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignatureCanvasProps {
    onSave: (signatureDataUrl: string) => void;
    onCancel: () => void;
    title?: string;
}

export function SignatureCanvas({
    onSave,
    onCancel,
    title = "Assinatura do responsável",
}: SignatureCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasContent, setHasContent] = useState(false);
    const [history, setHistory] = useState<ImageData[]>([]);

    const getCtx = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        return ctx;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // High DPI support
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.scale(dpr, dpr);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#18181b";
    }, []);

    const saveToHistory = () => {
        const ctx = getCtx();
        const canvas = canvasRef.current;
        if (!ctx || !canvas) return;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory((prev) => [...prev.slice(-20), imageData]);
    };

    const getPos = (e: React.TouchEvent | React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        if ("touches" in e) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top,
            };
        }
        return {
            x: (e as React.MouseEvent).clientX - rect.left,
            y: (e as React.MouseEvent).clientY - rect.top,
        };
    };

    const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault();
        saveToHistory();
        const ctx = getCtx();
        if (!ctx) return;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        setIsDrawing(true);
        setHasContent(true);
    };

    const draw = (e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault();
        if (!isDrawing) return;
        const ctx = getCtx();
        if (!ctx) return;
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    };

    const stopDrawing = (e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault();
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const ctx = getCtx();
        const canvas = canvasRef.current;
        if (!ctx || !canvas) return;
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        setHasContent(false);
        setHistory([]);
    };

    const undo = () => {
        const ctx = getCtx();
        const canvas = canvasRef.current;
        if (!ctx || !canvas || history.length === 0) return;
        const prev = history[history.length - 1];
        ctx.putImageData(prev, 0, 0);
        setHistory((h) => h.slice(0, -1));
        if (history.length <= 1) setHasContent(false);
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        onSave(dataUrl);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xl"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Pen className="w-5 h-5 text-zinc-500" />
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{title}</h3>
                </div>
                <p className="text-xs text-zinc-400">Desenhe com o dedo ou mouse</p>
            </div>

            {/* Canvas */}
            <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
                <canvas
                    ref={canvasRef}
                    className="w-full cursor-crosshair touch-none"
                    style={{ height: 200 }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                {/* Linha guia */}
                <div className="absolute bottom-8 left-6 right-6 border-b border-zinc-300 dark:border-zinc-600" />
                {!hasContent && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-sm text-zinc-300 dark:text-zinc-600">
                            Assine aqui
                        </p>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={undo}
                        disabled={history.length === 0}
                        className={cn(
                            "p-2 rounded-lg text-sm transition-colors",
                            history.length === 0
                                ? "text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
                                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                        )}
                        title="Desfazer"
                    >
                        <Undo2 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={clearCanvas}
                        className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                        title="Limpar"
                    >
                        <Eraser className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasContent}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                            hasContent
                                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:shadow-lg"
                                : "bg-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600"
                        )}
                    >
                        <Check className="w-4 h-4" />
                        Confirmar Assinatura
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
