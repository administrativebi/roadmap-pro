"use client";

import { motion } from "framer-motion";
import { ShieldAlert, Download, FileText, CheckCircle2, TrendingUp, AlertTriangle, Calendar, Award, ExternalLink, Printer } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
} from "recharts";

const ANVISA_MOCK_DATA = [
    { label: "Temperatura Congelamento", conformidade: 98 },
    { label: "Higienização Hortifruti", conformidade: 100 },
    { label: "Armazenamento Seco", conformidade: 85 },
    { label: "Validade de Produtos", conformidade: 92 },
    { label: "Controle de Pragas", conformidade: 100 },
];

export default function AnvisaDashboard() {
    const [generatingCert, setGeneratingCert] = useState(false);
    const [certReady, setCertReady] = useState(false);

    const generateCertificate = () => {
        setGeneratingCert(true);
        setTimeout(() => {
            setGeneratingCert(false);
            setCertReady(true);
        }, 3000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-7xl mx-auto p-2"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-emerald-900 dark:text-emerald-50 flex items-center gap-3">
                        <ShieldAlert className="w-8 h-8 text-emerald-500" />
                        Painel ANVISA Integrado
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        Console centralizado para vigilância sanitária e auditorias de conformidade legal.
                    </p>
                </div>

                <button
                    onClick={generateCertificate}
                    disabled={generatingCert}
                    className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 active:scale-95 transition-all shadow-lg flex items-center gap-2 disabled:opacity-70 disabled:active:scale-100"
                >
                    {generatingCert ? (
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                            Auditoria...
                        </div>
                    ) : (
                        <>
                            <Award className="w-5 h-5" />
                            Certificado Digital (Fev/2026)
                        </>
                    )}
                </button>
            </div>

            {/* Certificado Modal/Overlay */}
            {certReady && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-zinc-50 dark:bg-zinc-900 border-2 border-emerald-500/20 max-w-2xl w-full rounded-2xl shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />

                        <div className="p-8 relative z-10 text-center border-[12px] border-double border-emerald-100 dark:border-emerald-900 m-2 rounded-xl">
                            <button onClick={() => setCertReady(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900">
                                Fechar
                            </button>

                            <Award className="w-20 h-20 text-emerald-500 mx-auto mt-4 mb-2" />
                            <h2 className="text-3xl font-serif font-bold text-zinc-900 dark:text-zinc-50 mb-2">Certificado de Excelência Sanitária</h2>

                            <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-md mx-auto text-lg leading-relaxed">
                                Certificamos, para os devidos fins legais e de fiscalização, que a unidade <strong className="text-zinc-900 dark:text-zinc-50">Matriz Paulista</strong> operou com
                                <span className="mx-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">96.8%</span>
                                de conformidade nas normas da ANVISA durante o mês de <strong>Fevereiro de 2026</strong>.
                            </p>

                            <div className="flex justify-center gap-6 mb-8">
                                <div className="text-center">
                                    <div className="w-full h-[1px] bg-zinc-300 dark:bg-zinc-700 w-40 mb-2" />
                                    <p className="text-xs uppercase tracking-wider font-bold text-zinc-500">Rafael Marquês</p>
                                    <p className="text-[10px] text-zinc-400">Diretor de Operações</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-full h-[1px] bg-zinc-300 dark:bg-zinc-700 w-40 mb-2" />
                                    <p className="text-xs uppercase tracking-wider font-bold text-zinc-500">Auditoria A.I.</p>
                                    <p className="text-[10px] text-zinc-400">Hash: aa2b3c...f9</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-4 border-t border-emerald-100 dark:border-emerald-900 pt-6">
                                <button className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-emerald-700 font-bold transition-all text-sm">
                                    <Download className="w-4 h-4" /> Baixar PDF
                                </button>
                                <button className="bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-zinc-300 transition-all font-bold text-sm">
                                    <Printer className="w-4 h-4" /> Imprimir
                                </button>
                            </div>

                            <div className="absolute top-4 left-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 text-[10px] font-bold px-2 py-1 rounded border border-emerald-200">
                                OFICIAL VERIFIED ✓
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Dash Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
                <div className="col-span-1 md:col-span-1 bg-white dark:bg-zinc-950 border-l-4 border-emerald-500 rounded-r-2xl border-y border-r border-zinc-100 dark:border-zinc-800 p-5 shadow-sm">
                    <p className="text-sm font-bold text-zinc-500">Risco Sanitário Global</p>
                    <p className="text-4xl font-black text-emerald-600 mt-2 mb-1">Baixo</p>
                    <div className="flex items-center gap-1 text-xs text-emerald-500 font-bold">
                        <TrendingUp className="w-3 h-3" /> -12% incidentes críticos
                    </div>
                </div>

                <div className="col-span-1 md:col-span-3 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                            <FileText className="w-5 h-5 text-zinc-400" />
                            Sub-Índices de Conformidade (RDC 216)
                        </h3>
                        <span className="text-xs text-blue-500 flex items-center gap-1 hover:underline cursor-pointer font-semibold">
                            Ver Relatórios RAW <ExternalLink className="w-3 h-3" />
                        </span>
                    </div>

                    <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={ANVISA_MOCK_DATA} layout="vertical" margin={{ left: 50, right: 10, top: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f4f5" />
                            <XAxis type="number" domain={[0, 100]} hide />
                            <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} fontSize={11} width={180} />
                            <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', borderColor: '#10b981' }} />
                            <Bar dataKey="conformidade" fill="#10b981" radius={[0, 4, 4, 0]} barSize={16}>
                                {/* Text overlay on bars */}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-6">
                    <h3 className="font-bold text-amber-900 dark:text-amber-500 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Atenção Requerida ({`< 90%`})
                    </h3>
                    <div className="space-y-3">
                        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <div>
                                <p className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">Armazenamento Seco</p>
                                <p className="text-xs text-zinc-500">Paletes muito próximos à parede (Regra 3.2 ANVISA)</p>
                            </div>
                            <span className="bg-amber-100 text-amber-700 px-3 py-1 text-xs font-black rounded-lg">85%</span>
                        </div>
                    </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-6">
                    <h3 className="font-bold text-emerald-900 dark:text-emerald-500 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Auditorias Prontas para Assinatura (Gov.Br)
                    </h3>
                    <div className="space-y-3">
                        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-emerald-500" />
                                <div>
                                    <p className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">Semana 12 (04 - 10 Fev)</p>
                                    <p className="text-xs text-zinc-500">Pacote contendo 140 registros diários unificados.</p>
                                </div>
                            </div>
                            <button className="text-emerald-600 bg-emerald-100 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-200 transition-colors">
                                Assinar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </motion.div>
    );
}
