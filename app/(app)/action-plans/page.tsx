"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Clock,
    CheckCircle2,
    Loader2,
    AlertTriangle,
    Plus,
    Calendar,
    Camera,
    Paperclip,
    Star,
    Send,
    X,
    User as UserIcon,
    Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { syncActionPlansFromNotionAction } from "@/app/actions/notion-sync";
import { updateActionPlanStatusAction } from "@/app/actions/update-status";
import { ActionPlanForm } from "@/components/features/ActionPlanForm";

type PlanStatus = "pending" | "in_progress" | "resolved" | "canceled";

interface ActionPlan {
    id: string;
    title: string;
    description: string;
    benefit?: string;
    step_by_step?: string;
    cost_type?: string;
    due_date?: string;
    awarded_xp?: number;
    status: PlanStatus;
    priority?: string;
    created_at: string;
    notion_page_id?: string;
    photo_url?: string;
    file_url?: string;
    closing_comment?: string;
    satisfaction_rating?: number;
    profiles?: { name: string } | null;
    sectors?: { name: string } | null;
}

const statusConfig: Record<PlanStatus, { label: string; icon: any; color: string; bg: string }> = {
    pending: { label: "Pendente", icon: Clock, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950" },
    in_progress: { label: "Em andamento", icon: Loader2, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950" },
    resolved: { label: "Resolvido", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950" },
    canceled: { label: "Cancelado", icon: AlertTriangle, color: "text-zinc-500", bg: "bg-zinc-100 dark:bg-zinc-900" },
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
};

export default function ActionPlansPage() {
    const [plans, setPlans] = useState<ActionPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    // Filters and Tabs
    const [activeTab, setActiveTab] = useState<PlanStatus | 'all'>("pending");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [relativeFilter, setRelativeFilter] = useState<string>("all");
    const [userFilter, setUserFilter] = useState<string>("me");
    const [sectorFilter, setSectorFilter] = useState<string>("all");
    const [groupBy, setGroupBy] = useState<'sector' | 'user'>('sector');

    const [profiles, setProfiles] = useState<{ id: string; name: string }[]>([]);
    const [sectors, setSectors] = useState<{ id: string; name: string }[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);

    // Resolution Modal State
    const [resolvingPlanId, setResolvingPlanId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [resolutionData, setResolutionData] = useState({
        photo_url: "",
        file_url: "",
        closing_comment: "",
        satisfaction_rating: 5,
    });
    
    const supabase = createClient();

    const fetchPlans = async () => {
        setIsLoading(true);
        try {
            await syncActionPlansFromNotionAction();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Check permissions
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            const admin = profile?.role === 'admin' || profile?.role === 'owner' || profile?.role === 'manager';
            setIsAdmin(admin);

            let query = supabase.from('action_plans').select('*, profiles!action_plans_assignee_id_fkey(name), sectors(name)');
            
            if (!admin || userFilter === 'me') {
                query = query.eq('assignee_id', user.id);
            } else if (userFilter !== 'all') {
                query = query.eq('assignee_id', userFilter);
            }

            if (sectorFilter !== 'all') {
                query = query.eq('sector_id', sectorFilter);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            setPlans(data || []);

            if (admin) {
                const [{ data: pData }, { data: sData }] = await Promise.all([
                    supabase.from('profiles').select('id, name'),
                    supabase.from('sectors').select('id, name')
                ]);
                if (pData) setProfiles(pData);
                if (sData) setSectors(sData);
            }
        } catch (err) {
            console.error("Erro ao buscar planos:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, [supabase, userFilter, sectorFilter]);

    const filteredPlans = useMemo(() => {
        return plans.filter(p => {
            const matchesStatus = activeTab === 'all' || p.status === activeTab;
            
            let matchesDate = true;
            if (startDate || endDate) {
                const planDateStr = p.due_date ? p.due_date.split('T')[0] : "9999-12-31"; // Use due_date for date filtering since user wants to display by due_date
                if (startDate && planDateStr < startDate) matchesDate = false;
                if (endDate && planDateStr > endDate) matchesDate = false;
            } else if (relativeFilter !== 'all') {
                const now = new Date();
                const planDate = new Date(p.created_at);
                if (relativeFilter === 'today') {
                    matchesDate = planDate.toDateString() === now.toDateString();
                } else if (relativeFilter === 'week') {
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(now.getDate() - 7);
                    matchesDate = planDate >= sevenDaysAgo;
                }
            }

            return matchesStatus && matchesDate;
        });
    }, [plans, activeTab, startDate, endDate, relativeFilter]);

    const plansBySector = useMemo(() => {
        const grouped: Record<string, ActionPlan[]> = {};
        filteredPlans.forEach(plan => {
            const sectorName = plan.sectors?.name || "Sem Setor";
            if (!grouped[sectorName]) grouped[sectorName] = [];
            grouped[sectorName].push(plan);
        });
        return grouped;
    }, [filteredPlans]);

    const updateStatus = async (planId: string, newStatus: PlanStatus, notionPageId?: string, extraData?: any) => {
        try {
            const result = await updateActionPlanStatusAction(planId, newStatus, notionPageId, extraData);
            if (result.error) throw new Error(result.error);
            setPlans(prev => prev.map(p => p.id === planId ? { ...p, status: newStatus, ...extraData } : p));
        } catch (err) {
            console.error("Erro ao atualizar status:", err);
            alert("Erro ao atualizar.");
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'file') => {
        const file = e.target.files?.[0];
        if (!file || !resolvingPlanId) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${resolvingPlanId}_${type}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `action-plans/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('public')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('public')
                .getPublicUrl(filePath);

            setResolutionData(prev => ({
                ...prev,
                [type === 'photo' ? 'photo_url' : 'file_url']: publicUrl
            }));
        } catch (err) {
            console.error("Erro no upload:", err);
            alert("Erro ao enviar arquivo.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleResolveSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resolvingPlanId) return;
        
        const plan = plans.find(p => p.id === resolvingPlanId);
        if (!plan) return;

        await updateStatus(plan.id, 'resolved', plan.notion_page_id, resolutionData);
        setResolvingPlanId(null);
        setResolutionData({ photo_url: "", file_url: "", closing_comment: "", satisfaction_rating: 5 });
    };

    return (
        <div className="space-y-8 relative pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Planos de Ação
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1 font-medium text-sm">
                        Gerencie e resolva não-conformidades identificadas.
                    </p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Novo Plano
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-zinc-900 p-2 sm:p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col gap-4">
                <div className="flex bg-zinc-50 dark:bg-zinc-950 p-1 rounded-xl w-full overflow-x-auto scrollbar-none">
                    {(['all', 'pending', 'in_progress', 'resolved', 'canceled'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setActiveTab(s)}
                            className={cn(
                                "flex-1 px-4 py-2 rounded-lg text-[10px] sm:text-xs font-black transition-all uppercase tracking-wider whitespace-nowrap",
                                activeTab === s 
                                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm" 
                                    : "text-zinc-400 hover:text-zinc-600"
                            )}
                        >
                            {s === 'all' ? 'Tudo' : statusConfig[s].label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 w-full p-1">
                    {isAdmin && (
                        <>
                            <div className="relative col-span-2 sm:flex-1">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                                <select 
                                    value={userFilter}
                                    onChange={(e) => setUserFilter(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-[10px] sm:text-xs focus:ring-2 focus:ring-orange-500 outline-none appearance-none font-bold text-zinc-600 dark:text-zinc-400"
                                >
                                    <option value="me">Meus Planos</option>
                                    <option value="all">Todos os Usuários</option>
                                    {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            <div className="relative col-span-2 sm:flex-1">
                                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                                <select 
                                    value={sectorFilter}
                                    onChange={(e) => setSectorFilter(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-[10px] sm:text-xs focus:ring-2 focus:ring-orange-500 outline-none appearance-none font-bold text-zinc-600 dark:text-zinc-400"
                                >
                                    <option value="all">Todos os Setores</option>
                                    {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </>
                    )}

                    <div className="relative flex-1">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                        <input 
                            type="date" 
                            value={dateFilter}
                            onChange={(e) => { setDateFilter(e.target.value); setRelativeFilter('all'); }}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-[10px] sm:text-xs focus:ring-2 focus:ring-orange-500 outline-none font-bold text-zinc-600 dark:text-zinc-400"
                        />
                    </div>
                    
                    <div className="relative flex-1">
                        <select 
                            value={relativeFilter}
                            onChange={(e) => { setRelativeFilter(e.target.value); setDateFilter(''); }}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-[10px] sm:text-xs focus:ring-2 focus:ring-orange-500 outline-none appearance-none font-bold text-zinc-600 dark:text-zinc-400 text-center"
                        >
                            <option value="all">Datas</option>
                            <option value="today">Hoje</option>
                            <option value="week">Últimos 7 dias</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Modal de Formulário */}
            {isFormOpen && (
                <ActionPlanForm 
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={() => {
                        setIsFormOpen(false);
                        fetchPlans();
                    }}
                />
            )}

            {/* Plans List */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-orange-500" />
                    <p className="font-bold uppercase tracking-widest text-xs">Sincronizando...</p>
                </div>
            ) : filteredPlans.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-zinc-500 bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-zinc-800 shadow-inner">
                    <CheckCircle2 className="w-12 h-12 mb-4 text-emerald-500/50" />
                    <p className="font-bold text-zinc-900 dark:text-zinc-50">Nenhum plano encontrado!</p>
                    <p className="text-sm">Tente ajustar os filtros ou abas.</p>
                </div>
            ) : (
                <div className="space-y-12 pb-20">
                    {Object.entries(plansBySector).map(([sectorName, items]) => (
                        <div key={sectorName} className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 bg-zinc-50 dark:bg-zinc-950 px-4 py-1 rounded-full border border-zinc-100 dark:border-zinc-800">
                                    {sectorName}
                                </h2>
                                <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
                            </div>

                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="space-y-4 max-w-3xl"
                            >
                                {items.map((plan) => {
                                    const status = statusConfig[plan.status || 'pending'];
                                    const StatusIcon = status.icon;
                                    const isExpanded = expandedId === plan.id;

                                    return (
                                        <motion.div
                                            key={plan.id}
                                            variants={itemVariants}
                                            className="bg-white dark:bg-zinc-950 rounded-[2rem] border border-zinc-100 dark:border-zinc-900 overflow-hidden hover:shadow-xl transition-all shadow-sm"
                                        >
                                            {/* Header */}
                                            <div
                                                onClick={() => setExpandedId(isExpanded ? null : plan.id)}
                                                className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 sm:p-6 cursor-pointer"
                                            >
                                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                                    <div className={cn("p-3 rounded-2xl shadow-inner shrink-0", plan.priority === 'high' ? "bg-rose-50 text-rose-500 dark:bg-rose-950/30" : "bg-zinc-50 text-zinc-500 dark:bg-zinc-900")}>
                                                        <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h3 className="font-bold text-zinc-900 dark:text-zinc-50 truncate">{plan.title}</h3>
                                                            {plan.priority === 'high' && <span className="bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-[8px] font-black px-1.5 py-0.5 rounded uppercase shrink-0">Urgente</span>}
                                                        </div>
                                                        <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                                                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
                                                                <UserIcon className="w-3 h-3" /> <span className="truncate max-w-[80px] sm:max-w-none">{plan.profiles?.name || "Sem atribuição"}</span>
                                                            </p>
                                                            <span className="hidden sm:block w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                                            <p className={cn("text-[10px] font-black uppercase tracking-wider flex items-center gap-1 whitespace-nowrap", plan.due_date ? "text-orange-500" : "text-zinc-400")}>
                                                                <Calendar className="w-3 h-3" /> Prazo: {plan.due_date ? new Date(plan.due_date).toLocaleDateString("pt-BR") : "S/ Data"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={cn("flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider w-fit sm:w-auto", status.bg, status.color)}>
                                                    <StatusIcon className={cn("w-3.5 h-3.5", plan.status === "in_progress" && "animate-spin")} />
                                                    {status.label}
                                                </div>
                                            </div>

                                            {/* Expanded Content */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden bg-zinc-50 dark:bg-zinc-900/50"
                                                    >
                                                        <div className="p-6 pt-0 space-y-6">
                                                            
                                                            {/* Detalhamento 5W2H */}
                                                            <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-5">
                                                                <div>
                                                                    <h4 className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">Qual é a tarefa ou problema?</h4>
                                                                    <p className="text-sm text-zinc-800 dark:text-zinc-200 mt-1 font-medium">{plan.title}</p>
                                                                    {plan.description && <p className="text-xs text-zinc-500 mt-1">{plan.description}</p>}
                                                                </div>
                                                                
                                                                {plan.benefit && (
                                                                    <div>
                                                                        <h4 className="text-[10px] font-black tracking-widest text-emerald-500/80 uppercase">Benefício esperado</h4>
                                                                        <p className="text-sm text-zinc-800 dark:text-zinc-200 mt-1">{plan.benefit}</p>
                                                                    </div>
                                                                )}

                                                                {plan.step_by_step && (
                                                                    <div>
                                                                        <h4 className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">Passo a passo</h4>
                                                                        <p className="text-sm text-zinc-800 dark:text-zinc-200 mt-1 whitespace-pre-line leading-relaxed">{plan.step_by_step}</p>
                                                                    </div>
                                                                )}

                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-50 dark:border-zinc-800/50">
                                                                    <div>
                                                                        <h4 className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">Custo Estimado</h4>
                                                                        <p className="text-sm text-zinc-800 dark:text-zinc-200 mt-1 font-medium">
                                                                            {plan.cost_type === 'dinheiro' ? '💰 Requer Investimento' : '⏳ Apenas Tempo'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">Data de Criação</h4>
                                                                        <p className="text-sm text-zinc-800 dark:text-zinc-200 mt-1 font-medium">
                                                                            {new Date(plan.created_at).toLocaleDateString("pt-BR")}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Exibição das Evidências (Se Resolvido) */}
                                                            {plan.status === 'resolved' && (
                                                                <div className="p-5 bg-emerald-50/30 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 space-y-4 shadow-inner">
                                                                    <h4 className="text-[10px] font-black tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">Resultado da Resolução</h4>
                                                                    
                                                                    {plan.closing_comment && (
                                                                        <p className="text-sm text-zinc-700 dark:text-zinc-300 italic">"{plan.closing_comment}"</p>
                                                                    )}

                                                                    <div className="flex gap-4">
                                                                        {plan.photo_url && (
                                                                            <a href={plan.photo_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-800 rounded-xl text-[10px] font-bold text-zinc-600 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-700 shadow-sm transition-transform hover:scale-105">
                                                                                <Camera className="w-3.5 h-3.5 text-emerald-500" /> Ver Foto
                                                                            </a>
                                                                        )}
                                                                        {plan.file_url && (
                                                                            <a href={plan.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-800 rounded-xl text-[10px] font-bold text-zinc-600 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-700 shadow-sm transition-transform hover:scale-105">
                                                                                <Paperclip className="w-3.5 h-3.5 text-indigo-500" /> Ver Anexo
                                                                            </a>
                                                                        )}
                                                                    </div>

                                                                    {plan.satisfaction_rating && (
                                                                        <div className="flex gap-1 pt-2">
                                                                            {[1,2,3,4,5].map(s => (
                                                                                <Star key={s} className={cn("w-4 h-4", s <= plan.satisfaction_rating! ? "fill-amber-400 text-amber-400" : "text-zinc-200 dark:text-zinc-800")} />
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
                                                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                                                                    ID: {plan.id.split('-')[0]}
                                                                </span>
                                                                <div className="flex gap-2">
                                                                    {plan.status !== 'resolved' && plan.status !== 'canceled' && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setResolvingPlanId(plan.id);
                                                                                setExpandedId(plan.id);
                                                                            }}
                                                                            className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                                                                        >
                                                                            Finalizar e Resolver
                                                                        </button>
                                                                    )}
                                                                    {plan.status === 'pending' && (
                                                                        <button
                                                                            onClick={() => updateStatus(plan.id, 'in_progress', plan.notion_page_id)}
                                                                            className="px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-black uppercase hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                                                                        >
                                                                            Iniciar Agora
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Resolution Form Form */}
                                                            <AnimatePresence>
                                                                {resolvingPlanId === plan.id && (
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: "auto", opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        className="overflow-hidden"
                                                                    >
                                                                        <div className="mt-4 p-5 bg-zinc-100 dark:bg-zinc-900 rounded-3xl border border-emerald-100 dark:border-emerald-900/30 space-y-5">
                                                                            <div className="flex items-center justify-between">
                                                                                <h4 className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2 uppercase tracking-tighter">
                                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                                    Evidências da Solução
                                                                                </h4>
                                                                                <button onClick={() => setResolvingPlanId(null)} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                                                                    <X className="w-4 h-4 text-zinc-400" />
                                                                                </button>
                                                                            </div>
                                                                            
                                                                            <div>
                                                                                <label className="block text-[10px] font-black text-zinc-500 mb-2 uppercase tracking-widest">Comentário de Finalização</label>
                                                                                <textarea
                                                                                    value={resolutionData.closing_comment}
                                                                                    onChange={e => setResolutionData({...resolutionData, closing_comment: e.target.value})}
                                                                                    rows={3}
                                                                                    placeholder="Descreva brevemente o que foi feito..."
                                                                                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all resize-none"
                                                                                />
                                                                            </div>

                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                                <div>
                                                                                    <label className="block text-[10px] font-black text-zinc-500 mb-2 uppercase tracking-widest text-center">Anexar Foto</label>
                                                                                    <label className="cursor-pointer flex flex-col items-center justify-center p-5 bg-white dark:bg-zinc-950 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/10 transition-all">
                                                                                        {resolutionData.photo_url ? <CheckCircle2 className="w-8 h-8 text-emerald-500" /> : <Camera className="w-8 h-8 text-zinc-300" />}
                                                                                        <span className="text-[10px] mt-2 text-zinc-500 font-bold">{isUploading ? "Enviando..." : resolutionData.photo_url ? "Pronto!" : "Câmera / Galeria"}</span>
                                                                                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileUpload(e, 'photo')} />
                                                                                    </label>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="block text-[10px] font-black text-zinc-500 mb-2 uppercase tracking-widest text-center">Anexar Arquivo</label>
                                                                                    <label className="cursor-pointer flex flex-col items-center justify-center p-5 bg-white dark:bg-zinc-950 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/10 transition-all">
                                                                                        {resolutionData.file_url ? <CheckCircle2 className="w-8 h-8 text-emerald-500" /> : <Paperclip className="w-8 h-8 text-zinc-300" />}
                                                                                        <span className="text-[10px] mt-2 text-zinc-500 font-bold">{isUploading ? "Enviando..." : resolutionData.file_url ? "Pronto!" : "Docs / PDF / Outros"}</span>
                                                                                        <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'file')} />
                                                                                    </label>
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex flex-col items-center gap-3 py-2">
                                                                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">Satisfação com o Resultado</label>
                                                                                <div className="flex justify-center gap-3">
                                                                                    {[1,2,3,4,5].map(star => (
                                                                                        <button
                                                                                            key={star}
                                                                                            type="button"
                                                                                            onClick={() => setResolutionData({...resolutionData, satisfaction_rating: star})}
                                                                                            className={cn("text-4xl transition-all hover:scale-125 active:scale-90", star <= resolutionData.satisfaction_rating ? "text-amber-400 drop-shadow-sm" : "text-zinc-200 dark:text-zinc-800")}
                                                                                        >
                                                                                            ★
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex gap-3 pt-2">
                                                                                <button
                                                                                    onClick={handleResolveSubmit}
                                                                                    disabled={isUploading || !resolutionData.closing_comment}
                                                                                    className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
                                                                                >
                                                                                    <Send className="w-5 h-5" />
                                                                                    Concluir e Ganhar XP
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
