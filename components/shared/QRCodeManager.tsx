"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import {
    QrCode,
    Printer,
    Download,
    Copy,
    Check,
    MapPin,
    ScanLine,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AreaQRCode {
    id: string;
    name: string;
    icon: string;
    checklistId: string;
    checklistTitle: string;
}

const mockAreas: AreaQRCode[] = [
    { id: "cozinha", name: "Cozinha", icon: "🍳", checklistId: "tpl-2", checklistTitle: "Controle APPCC" },
    { id: "salao", name: "Salão", icon: "🪑", checklistId: "tpl-1", checklistTitle: "Abertura do Restaurante" },
    { id: "estoque", name: "Estoque", icon: "📦", checklistId: "tpl-2", checklistTitle: "Controle APPCC" },
    { id: "banheiros", name: "Banheiros", icon: "🚿", checklistId: "tpl-1", checklistTitle: "Abertura do Restaurante" },
    { id: "bar", name: "Bar / Balcão", icon: "🍹", checklistId: "tpl-3", checklistTitle: "Fechamento Diário" },
    { id: "camara-fria", name: "Câmara Fria", icon: "🧊", checklistId: "tpl-2", checklistTitle: "Controle APPCC" },
];

export function QRCodeManager() {
    const [selected, setSelected] = useState<AreaQRCode | null>(null);
    const [copied, setCopied] = useState(false);
    const [showScanner, setShowScanner] = useState(false);

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://app.checklistpro.com.br";

    const getQRUrl = (area: AreaQRCode) =>
        `${baseUrl}/checklists?area=${area.id}&template=${area.checklistId}`;

    const handleCopy = (area: AreaQRCode) => {
        navigator.clipboard.writeText(getQRUrl(area));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrint = (area: AreaQRCode) => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        printWindow.document.write(`
      <html>
        <head>
          <title>QR Code — ${area.name}</title>
          <style>
            body { 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              font-family: -apple-system, sans-serif;
              margin: 0;
            }
            .qr-container {
              text-align: center;
              border: 3px dashed #e4e4e7;
              border-radius: 24px;
              padding: 40px;
            }
            h1 { font-size: 28px; margin: 0 0 8px; }
            p { color: #71717a; font-size: 14px; margin: 0 0 24px; }
            .icon { font-size: 48px; margin-bottom: 16px; }
            .footer { 
              margin-top: 24px; 
              font-size: 11px; 
              color: #a1a1aa;
              max-width: 200px;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="icon">${area.icon}</div>
            <h1>${area.name}</h1>
            <p>Escaneie para abrir o checklist</p>
            <div id="qr"></div>
            <p class="footer">${area.checklistTitle}</p>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"><\/script>
          <script>
            QRCode.toCanvas(
              document.createElement('canvas'),
              '${getQRUrl(area)}',
              { width: 200, margin: 0 },
              function(err, canvas) {
                if (!err) document.getElementById('qr').appendChild(canvas);
                setTimeout(function() { window.print(); }, 500);
              }
            );
          <\/script>
        </body>
      </html>
    `);
        printWindow.document.close();
    };

    const handleDownload = (area: AreaQRCode) => {
        const svgElement = document.getElementById(`qr-${area.id}`)?.querySelector("svg");
        if (!svgElement) return;

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, 512, 512);
            ctx.drawImage(img, 56, 56, 400, 400);
            const link = document.createElement("a");
            link.download = `qrcode-${area.id}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        };
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-zinc-500" />
                        QR Codes por Área
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">
                        Cole em cada área do restaurante para acesso rápido ao checklist
                    </p>
                </div>
                <button
                    onClick={() => setShowScanner(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
                >
                    <ScanLine className="w-4 h-4" />
                    Escanear QR
                </button>
            </div>

            {/* Area Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockAreas.map((area) => (
                    <motion.div
                        key={area.id}
                        whileHover={{ y: -4 }}
                        onClick={() => setSelected(area)}
                        className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-5 cursor-pointer hover:shadow-xl transition-all group"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-3xl">{area.icon}</span>
                            <div>
                                <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{area.name}</h3>
                                <p className="text-xs text-zinc-400">{area.checklistTitle}</p>
                            </div>
                        </div>

                        {/* Mini QR */}
                        <div id={`qr-${area.id}`} className="flex justify-center p-3 bg-white rounded-xl">
                            <QRCodeSVG
                                value={getQRUrl(area)}
                                size={120}
                                bgColor="#ffffff"
                                fgColor="#18181b"
                                level="M"
                                includeMargin={false}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleCopy(area); }}
                                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                                title="Copiar link"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDownload(area); }}
                                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                                title="Baixar PNG"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handlePrint(area); }}
                                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                                title="Imprimir"
                            >
                                <Printer className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Scanner Modal */}
            <AnimatePresence>
                {showScanner && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowScanner(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-white dark:bg-zinc-950 rounded-2xl p-6 w-full max-w-md text-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-zinc-900 dark:text-zinc-50">
                                    Escanear QR Code
                                </h3>
                                <button
                                    onClick={() => setShowScanner(false)}
                                    className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                >
                                    <X className="w-5 h-5 text-zinc-500" />
                                </button>
                            </div>
                            <div className="bg-zinc-100 dark:bg-zinc-900 rounded-xl aspect-square flex items-center justify-center">
                                <div className="text-center">
                                    <ScanLine className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                                    <p className="text-sm text-zinc-500">
                                        Aponte a câmera para o QR Code
                                    </p>
                                    <p className="text-xs text-zinc-400 mt-1">
                                        Permissão de câmera necessária
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs text-zinc-400 mt-3">
                                O checklist correspondente à área será aberto automaticamente
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
