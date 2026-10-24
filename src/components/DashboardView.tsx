import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  Percent, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  ArrowUpRight, 
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2,
  Inbox,
  Target,
  Edit2,
  Check,
  X,
  PiggyBank,
  Sparkles
} from 'lucide-react';
import { AnalyticsSummary, LeadRecord } from '../types.ts';

interface DashboardViewProps {
  summary: AnalyticsSummary | null;
  recentLeads: LeadRecord[];
  onNavigateToLeads: () => void;
  onOpenLeadDetails: (lead: LeadRecord) => void;
  onUpdateAdSpend?: (amount: number) => Promise<void>;
  onNavigateToInvestments?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  recentLeads,
  onNavigateToLeads,
  onOpenLeadDetails,
  onUpdateAdSpend,
  onNavigateToInvestments
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [isEditingAdSpend, setIsEditingAdSpend] = useState(false);
  const [adSpendInput, setAdSpendInput] = useState('');
  const [isSavingAdSpend, setIsSavingAdSpend] = useState(false);

  useEffect(() => {
    if (summary) {
      setAdSpendInput(summary.ad_spend ? String(summary.ad_spend) : '0');
    }
  }, [summary?.ad_spend]);

  const handleSaveAdSpend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!onUpdateAdSpend) return;

    const parsed = Math.max(0, parseFloat(adSpendInput.replace(',', '.')) || 0);
    setIsSavingAdSpend(true);
    try {
      await onUpdateAdSpend(parsed);
      setIsEditingAdSpend(false);
    } finally {
      setIsSavingAdSpend(false);
    }
  };

  if (!summary) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-2 border-[#00375a] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-medium">Carregando métricas e indicadores de tráfego pago...</span>
        </div>
      </div>
    );
  }

  // Filter conversions from recent leads
  const recentConversions = recentLeads.filter(l => l.is_converted).slice(0, 5);

  // Daily series dynamic values
  const dailySeries = summary.daily_series || [];
  const maxDailyReceived = Math.max(1, ...dailySeries.map(d => d.leads_received));

  // Weekly cohorts dynamic values
  const weeklyCohorts = summary.weekly_cohorts || [];
  const maxCohortReceived = Math.max(1, ...weeklyCohorts.map(c => c.leads_received));

  // Channel distribution
  const channels = summary.channel_distribution || [];
  const channelColors = ['#047857', '#0284c7', '#00375a', '#38bdf8', '#94a3b8'];

  // Monthly trends
  const monthlyTrends = summary.monthly_trends || [];

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
      {/* Active Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Filtros Ativos:
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Origem: <span className="font-mono text-[#00375a]">trafego_pago</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
            Conversão: <span className="font-mono text-emerald-700">Ganhamos</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Fuso: America/Belem
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onNavigateToLeads}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Ver Tabela de Leads</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION: INVESTIMENTO EM TRÁFEGO, CPL & CAC (MÉTRICAS)  */}
      {/* ======================================================== */}
      <section className="bg-gradient-to-br from-[#002139] to-[#00375a] p-5 sm:p-6 rounded-2xl text-white shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#c1ef6d]">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Investimento em Tráfego & Custo de Aquisição (CAC / CPL)
              </h2>
              <p className="text-xs text-slate-300">
                O CAC mede o valor médio gasto para conquistar um novo cliente no marketing e nas vendas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onNavigateToInvestments && (
              <button
                onClick={onNavigateToInvestments}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10 cursor-pointer"
              >
                <PiggyBank className="w-3.5 h-3.5 text-[#c1ef6d]" />
                <span>Lançamentos por Data</span>
              </button>
            )}

            {/* Quick Ad Spend Edit Trigger */}
            {!isEditingAdSpend ? (
              <button
                onClick={() => setIsEditingAdSpend(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#c1ef6d]" />
                <span>Ajuste Rápido</span>
              </button>
            ) : (
              <form onSubmit={handleSaveAdSpend} className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  autoFocus
                  value={adSpendInput}
                  onChange={e => setAdSpendInput(e.target.value)}
                  placeholder="0,00"
                  className="w-36 pl-8 pr-2.5 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-bold focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSavingAdSpend}
                className="px-3 py-1.5 rounded-xl bg-[#c1ef6d] hover:bg-[#aee64b] text-[#002139] text-xs font-bold transition-colors cursor-pointer"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdSpendInput(summary.ad_spend ? String(summary.ad_spend) : '0');
                  setIsEditingAdSpend(false);
                }}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Investimento Total */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Investimento em Tráfego
            </span>
            <span className="text-2xl font-extrabold text-white mt-2 block tabular-nums">
              R$ {(summary.ad_spend || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-slate-300 mt-2 block">
              Orçamento de anúncios pago
            </span>
          </div>

          {/* 2. Custo por Lead (CPL) */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Custo por Lead (CPL)
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-[#c1ef6d]">
                Investimento ÷ Leads
              </span>
            </div>
            <span className="text-2xl font-extrabold text-[#c1ef6d] mt-2 block tabular-nums">
              R$ {(summary.cost_per_lead || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-slate-300 mt-2 block">
              {summary.filtered_leads_total > 0 ? `Base: ${summary.filtered_leads_total} leads (trafego_pago)` : 'Nenhum lead no período'}
            </span>
          </div>

          {/* 3. CAC - Custo de Aquisição de Clientes */}
          <div className="bg-white/5 border border-[#c1ef6d]/40 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#c1ef6d] uppercase tracking-wider block">
                CAC (Custo de Aquisição)
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#c1ef6d]/20 text-[#c1ef6d]">
                Investimento ÷ Ganhamos
              </span>
            </div>
            <span className="text-2xl font-extrabold text-white mt-2 block tabular-nums">
              R$ {(summary.cac || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-slate-300 mt-2 block">
              {summary.filtered_leads_converted > 0 ? `Gasto médio por cliente (${summary.filtered_leads_converted} vendas)` : 'Aguardando conversões'}
            </span>
          </div>

          {/* 4. ROAS */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                ROAS (Retorno s/ Anúncios)
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-200">
                Receita ÷ Investimento
              </span>
            </div>
            <span className="text-2xl font-extrabold text-white mt-2 block tabular-nums">
              {summary.roas || 0}x
            </span>
            <span className="text-[11px] text-slate-300 mt-2 block">
              Receita: R$ {summary.total_revenue_period.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* ROW 1: 4 PRIMARY KPI CARDS                */}
      {/* ========================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Leads Hoje */}
        <article className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Leads Recebidos Hoje
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#00375a]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-3xl font-extrabold text-[#002139] tabular-nums font-['Plus_Jakarta_Sans',sans-serif]">
              {summary.leads_today}
            </span>
            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-bold ${
              summary.growth_today_vs_yesterday >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              <TrendingUp className="w-3 h-3" />
              {summary.growth_today_vs_yesterday > 0 ? `+${summary.growth_today_vs_yesterday}%` : `${summary.growth_today_vs_yesterday}%`} vs ontem
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Ontem: <strong>{summary.leads_yesterday}</strong></span>
            <span>Últimos 7 dias: <strong>{summary.leads_last_7_days}</strong></span>
          </div>
        </article>

        {/* Card 2: Leads no Mês */}
        <article className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Leads no Mês Atual
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#00375a]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-3xl font-extrabold text-[#002139] tabular-nums font-['Plus_Jakarta_Sans',sans-serif]">
              {summary.leads_this_month.toLocaleString('pt-BR')}
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
              Mês anterior: {summary.leads_last_month}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Acumulado no ano:</span>
            <span className="font-bold text-[#00375a]">{summary.leads_this_year.toLocaleString('pt-BR')}</span>
          </div>
        </article>

        {/* Card 3: Leads Convertidos */}
        <article className="bg-white p-5 rounded-2xl border-2 border-emerald-500/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Leads Convertidos (Ganhamos)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-800">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-800 tabular-nums font-['Plus_Jakarta_Sans',sans-serif]">
                {summary.filtered_leads_converted.toLocaleString('pt-BR')}
              </span>
              <span className="text-xs font-bold text-emerald-700">
                ({summary.filtered_conversion_rate}%)
              </span>
            </div>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800">
              <TrendingUp className="w-3 h-3" />
              Taxa Geral
            </span>
          </div>
          <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-600">Total de leads filtrados:</span>
            <span className="font-bold text-emerald-800">{summary.filtered_leads_total.toLocaleString('pt-BR')}</span>
          </div>
        </article>

        {/* Card 4: Taxa de Conversão */}
        <article className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Taxa de Conversão
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#00375a]">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-3xl font-extrabold text-[#002139] tabular-nums font-['Plus_Jakarta_Sans',sans-serif]">
              {summary.filtered_conversion_rate}%
            </span>
            <span className="text-xs text-slate-400">
              (Ganhamos ÷ Total)
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Em atendimento:</span>
            <span className="text-slate-800 font-bold">
              {summary.filtered_leads_in_progress} leads
            </span>
          </div>
        </article>
      </section>

      {/* ========================================== */}
      {/* ROW 2: SECONDARY FINANCIAL & SALES CARDS   */}
      {/* ========================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 5: Vendas Fechadas no Período */}
        <article className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Vendas Fechadas no Período
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#00375a]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl font-bold text-[#002139] tabular-nums">
              R$ {summary.sales_revenue_in_period.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 text-slate-500">
            <span className="font-medium text-slate-700">{summary.sales_closed_in_period} conversões registradas</span>
            <span className="text-[10px] text-slate-400">Origem: Chatwoot custom_attrs</span>
          </div>
        </article>

        {/* KPI 6: Leads na Semana */}
        <article className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Leads na Semana Atual
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#00375a]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl font-bold text-[#002139] tabular-nums">
              {summary.leads_this_week}
            </span>
            <span className="text-xs text-slate-400">
              Seg - Dom
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Fuso horário:</span>
            <span className="font-semibold text-slate-700">America/Belem</span>
          </div>
        </article>

        {/* KPI 7: Ticket Médio Real */}
        <article className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Ticket Médio de Venda
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#00375a]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl font-bold text-[#002139] tabular-nums">
              {summary.filtered_leads_converted > 0
                ? (summary.sales_revenue_in_period / summary.filtered_leads_converted).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : 'R$ 0,00'}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Total Histórico Geral:</span>
            <span className="font-bold text-[#00375a]">{summary.leads_total_historical.toLocaleString('pt-BR')} leads</span>
          </div>
        </article>

        {/* KPI 8: Leads Não Convertidos */}
        <article className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Leads Não Convertidos
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl font-bold text-[#002139] tabular-nums">
              {summary.filtered_leads_not_converted.toLocaleString('pt-BR')}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
              Aguardando 'Ganhamos'
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Em Atendimento:</span>
            <span className="font-bold text-[#00375a]">{summary.filtered_leads_in_progress}</span>
          </div>
        </article>
      </section>

      {/* ========================================== */}
      {/* CHARTS BENTO GRID (2x2 DYNAMIC)            */}
      {/* ========================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Evolução Diária de Leads (Últimos 30 dias) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#002139]">
                Evolução Diária de Leads (Últimos 30 dias)
              </h2>
              <p className="text-xs text-slate-500">
                Volume real de contatos com a etiqueta trafego_pago
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00375a]"></span>
                Leads Diários
              </span>
            </div>
          </div>

          {dailySeries.length === 0 || maxDailyReceived === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-slate-200 rounded-xl">
              <Inbox className="w-8 h-8 stroke-1 text-slate-300" />
              <span className="text-xs">Nenhum dado diário registrado no período.</span>
            </div>
          ) : (
            <div className="w-full h-64 mt-2">
              <div className="flex items-end justify-between h-48 gap-1 pt-6 px-2">
                {dailySeries.map((d, idx) => {
                  const heightPct = Math.max(4, Math.round((d.leads_received / maxDailyReceived) * 100));
                  const isHovered = hoveredPoint === idx;

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(idx)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      {/* Tooltip */}
                      {isHovered && (
                        <div className="absolute -top-10 bg-[#002139] text-white text-[10px] rounded-lg px-2 py-1 shadow-lg whitespace-nowrap z-10 font-mono">
                          {d.label}: {d.leads_received} leads ({d.leads_converted} ganhos)
                        </div>
                      )}
                      <div
                        className={`w-full rounded-xs transition-all ${
                          d.leads_received > 0 
                            ? (isHovered ? 'bg-[#1A94C5]' : 'bg-[#00375a]') 
                            : 'bg-slate-100'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      ></div>
                    </div>
                  );
                })}
              </div>
              {/* X Axis */}
              <div className="flex justify-between text-[10px] text-slate-400 pt-3 border-t border-slate-100 px-2">
                <span>{dailySeries[0]?.label || ''}</span>
                <span>{dailySeries[Math.floor(dailySeries.length / 2)]?.label || ''}</span>
                <span className="font-bold text-[#00375a]">{dailySeries[dailySeries.length - 1]?.label || ''}</span>
              </div>
            </div>
          )}
        </div>

        {/* CHART 2: Leads Recebidos x Leads Convertidos (Semanas) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#002139]">
                Leads Recebidos x Leads Convertidos
              </h2>
              <p className="text-xs text-slate-500">
                Coortes semanais com volume e qualificação (America/Belem)
              </p>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <span className="w-3 h-3 rounded-xs bg-[#00375a]"></span>
                <span>Recebidos</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <span className="w-3 h-3 rounded-xs bg-emerald-700"></span>
                <span>Convertidos</span>
              </div>
            </div>
          </div>

          {weeklyCohorts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-slate-200 rounded-xl">
              <Inbox className="w-8 h-8 stroke-1 text-slate-300" />
              <span className="text-xs">Nenhum dado semanal registrado no período.</span>
            </div>
          ) : (
            <div className="w-full h-64 mt-2 flex flex-col justify-end">
              <div className="flex items-end justify-around h-48 px-4">
                {weeklyCohorts.map((cohort, idx) => {
                  const recHeight = maxCohortReceived > 0 
                    ? Math.max(6, Math.round((cohort.leads_received / maxCohortReceived) * 160)) 
                    : 6;
                  const convHeight = maxCohortReceived > 0 
                    ? Math.max(4, Math.round((cohort.leads_converted / maxCohortReceived) * 160)) 
                    : 4;

                  return (
                    <div key={idx} className="flex flex-col items-center gap-2">
                      <div className="flex items-end gap-1.5 h-40">
                        {/* Received bar */}
                        <div className="flex flex-col items-center justify-end">
                          <span className="text-[10px] font-bold text-[#00375a] mb-1">
                            {cohort.leads_received}
                          </span>
                          <div
                            className="w-7 bg-[#00375a] rounded-t-sm transition-all"
                            style={{ height: `${recHeight}px` }}
                          ></div>
                        </div>
                        {/* Converted bar */}
                        <div className="flex flex-col items-center justify-end">
                          <span className="text-[10px] font-bold text-emerald-700 mb-1">
                            {cohort.leads_converted}
                          </span>
                          <div
                            className="w-7 bg-emerald-700 rounded-t-sm transition-all"
                            style={{ height: `${convHeight}px` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-slate-500">
                        {cohort.cohort_label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* CHART 3: Origem dos Leads por Canal */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="text-base font-bold text-[#002139]">
                Origem dos Leads por Canal
              </h2>
              <p className="text-xs text-slate-500">
                Caixas de entrada integradas ao Chatwoot
              </p>
            </div>
          </div>

          {channels.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-slate-200 rounded-xl my-2">
              <Inbox className="w-8 h-8 stroke-1 text-slate-300" />
              <span className="text-xs">Nenhum canal ativo com leads de tráfego pago.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3 my-3">
              {channels.map((ch, idx) => (
                <div key={ch.channel} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: channelColors[idx % channelColors.length] }}
                      ></span>
                      {ch.channel_detail || ch.channel}
                    </span>
                    <span className="text-slate-500 font-mono">
                      <strong>{ch.leads_received}</strong> leads ({ch.share_percentage}%) • <strong>{ch.conversion_rate}%</strong> conv.
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(100, ch.share_percentage)}%`,
                        backgroundColor: channelColors[idx % channelColors.length]
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Canal com maior taxa de conversão:</span>
            <span className="font-bold text-emerald-800">
              {summary.top_converting_channel.name} ({summary.top_converting_channel.rate}%)
            </span>
          </div>
        </div>

        {/* CHART 4: Evolução da Taxa de Conversão por Mês */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#002139]">
                Taxa de Conversão Mensal (%)
              </h2>
              <p className="text-xs text-slate-500">
                Histórico consolidado mês a mês
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <TrendingUp className="w-3.5 h-3.5" />
              Taxa Geral: {summary.filtered_conversion_rate}%
            </span>
          </div>

          {monthlyTrends.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-slate-200 rounded-xl">
              <Inbox className="w-8 h-8 stroke-1 text-slate-300" />
              <span className="text-xs">Histórico mensal será gerado conforme os leads chegarem.</span>
            </div>
          ) : (
            <div className="w-full h-56 flex flex-col justify-around">
              <div className="grid grid-cols-3 gap-3">
                {monthlyTrends.slice(-3).map((mt, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
                    <span className="text-xs font-semibold text-slate-500 block">{mt.month}</span>
                    <span className="text-2xl font-extrabold text-emerald-800 block font-mono">
                      {mt.conversion_rate}%
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {mt.conversions_count} de {mt.leads_count} leads
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Fórmula: (Convertidos com 'Ganhamos' ÷ Total de Leads) × 100</span>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* RECENT CONVERSIONS TABLE                   */}
      {/* ========================================== */}
      <section className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="p-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-[#002139]">
              Últimas Conversões Chatwoot em Tempo Real
            </h2>
            <p className="text-xs text-slate-500">
              Pipeline unificado com atribuição de canal e status de fechamento comercial
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Mostrando {recentConversions.length} conversões recentes
            </span>
            <button
              onClick={onNavigateToLeads}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-[#00375a] transition-colors cursor-pointer"
            >
              Ver Todos os Leads
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 h-10">
                <th className="px-6">Lead / Contato</th>
                <th className="px-6">Canal Chatwoot</th>
                <th className="px-6">Origem / Campanha</th>
                <th className="px-6">Valor da Venda</th>
                <th className="px-6">Status Comercial</th>
                <th className="px-6 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {recentConversions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="w-6 h-6 text-slate-300" />
                      <span>Nenhuma conversão registrada com a etiqueta 'Ganhamos' no momento.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                recentConversions.map(lead => {
                  const initials = lead.contact_name
                    .split(' ')
                    .map(n => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr 
                      key={lead.id} 
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => onOpenLeadDetails(lead)}
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#cee5ff] text-[#002139] flex items-center justify-center font-bold text-xs ring-1 ring-slate-200">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-[#002139] group-hover:text-[#1A94C5] transition-colors">
                              {lead.contact_name}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {lead.contact_phone || lead.contact_email || `#CW-${lead.conversation_id}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          {lead.channel_detail || lead.channel}
                        </span>
                      </td>

                      <td className="px-6 py-3.5 text-slate-600 font-medium text-[11px]">
                        {lead.campaign || 'Tráfego Pago • Campanha Direta'}
                      </td>

                      <td className="px-6 py-3.5 font-bold text-[#002139] tabular-nums">
                        {lead.value && lead.value > 0 ? `R$ ${lead.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                      </td>

                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#c1ef6d]/40 text-emerald-900 border border-[#c1ef6d]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          Convertido
                        </span>
                      </td>

                      <td className="px-6 py-3.5 text-right">
                        <a
                          href={lead.chatwoot_url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          title="Abrir no Chatwoot"
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-[#00375a] transition-colors inline-block"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
