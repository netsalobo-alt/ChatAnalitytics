import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  BarChart3,
  DollarSign,
  TrendingDown,
  Layers,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { AnalyticsSummary, PeriodFilter } from '../types.ts';

interface ReportsViewProps {
  summary: AnalyticsSummary | null;
  period: PeriodFilter;
  onExportCsv: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  summary,
  period,
  onExportCsv
}) => {
  const [activeTab, setActiveTab] = useState<'financial' | 'efficiency' | 'channels'>('financial');
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  if (!summary) return null;

  const handlePrint = () => {
    window.print();
  };

  const periodLabelMap: Record<PeriodFilter, string> = {
    today: 'Hoje',
    yesterday: 'Ontem',
    last_7_days: 'Últimos 7 dias',
    this_week: 'Semana Atual',
    this_month: 'Mês Atual',
    last_month: 'Mês Anterior',
    this_year: 'Ano Atual',
    all: 'Total Histórico',
    custom: 'Período Personalizado'
  };

  const monthlyPerf = summary.monthly_performance || [];

  // Determine scales for charts
  const maxSpendOrRevenue = Math.max(
    1000,
    ...monthlyPerf.map(m => Math.max(m.ad_spend, m.revenue))
  );

  const maxCacOrCpl = Math.max(
    50,
    ...monthlyPerf.map(m => Math.max(m.cac, m.cpl))
  );

  const maxLeads = Math.max(
    10,
    ...monthlyPerf.map(m => m.leads_count)
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto print:p-0 print:m-0">
      {/* Top Banner & Export Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:border-none print:shadow-none">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Relatório Executivo Oficial
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#002139] mt-1 font-['Plus_Jakarta_Sans',sans-serif]">
            Relatório de Performance Comercial & Mídia Paga
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dados sincronizados em tempo real com Chatwoot • Horário Oficial de Belém (America/Belem)
          </p>
        </div>

        <div className="flex items-center gap-3 print:hidden">
          <button
            onClick={onExportCsv}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#002139] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
          >
            <Download className="w-4 h-4 text-[#1A94C5]" />
            <span>Baixar Planilha (CSV)</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#002139] hover:bg-[#00375a] text-white text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-[0.98]"
          >
            <Printer className="w-4 h-4 text-[#c1ef6d]" />
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Highlights Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Leads Captados (trafego_pago)
          </span>
          <span className="text-2xl font-extrabold text-[#002139] mt-2 block tabular-nums">
            {summary.filtered_leads_total.toLocaleString('pt-BR')}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">Filtro: {periodLabelMap[period] || period}</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
            Leads Convertidos (Ganhamos)
          </span>
          <span className="text-2xl font-extrabold text-emerald-800 mt-2 block tabular-nums">
            {summary.filtered_leads_converted.toLocaleString('pt-BR')}
          </span>
          <span className="text-xs text-emerald-700 mt-1 block">
            Taxa: {summary.filtered_conversion_rate}%
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Investimento Alocado
          </span>
          <span className="text-2xl font-extrabold text-[#002139] mt-2 block tabular-nums">
            R$ {(summary.ad_spend || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">
            {summary.total_invested_all_time > 0 ? `Total Geral: R$ ${summary.total_invested_all_time.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Orçamento configurado'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Receita Total Rastreada
          </span>
          <span className="text-2xl font-extrabold text-emerald-700 mt-2 block tabular-nums">
            R$ {summary.total_revenue_period.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">
            ROAS: <strong className="text-emerald-700">{summary.roas || 0}x</strong>
          </span>
        </div>
      </section>

      {/* Traffic Cost & Efficiency Bar */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100">
          <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">
            CPL (Custo por Lead)
          </span>
          <span className="text-xl font-extrabold text-[#002139] mt-1.5 block tabular-nums">
            R$ {(summary.cost_per_lead || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">Investimento ÷ Total Leads</span>
        </div>

        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
            CAC (Custo de Aquisição)
          </span>
          <span className="text-xl font-extrabold text-emerald-900 mt-1.5 block tabular-nums">
            R$ {(summary.cac || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-emerald-700 mt-1 block">Investimento ÷ Clientes Ganhos</span>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Ticket Médio
          </span>
          <span className="text-xl font-extrabold text-[#002139] mt-1.5 block tabular-nums">
            R$ {summary.filtered_leads_converted > 0 ? (summary.total_revenue_period / summary.filtered_leads_converted).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Receita ÷ Vendas Ganhamos</span>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Melhor Canal
          </span>
          <span className="text-xl font-extrabold text-[#002139] mt-1.5 block truncate" title={summary.top_converting_channel.name}>
            {summary.top_converting_channel.name}
          </span>
          <span className="text-[11px] text-emerald-700 mt-1 block font-semibold">
            {summary.top_converting_channel.rate}% de conversão
          </span>
        </div>
      </section>

      {/* Visual Charts Container */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h3 className="text-base font-bold text-[#002139] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#1A94C5]" />
              <span>Análise Gráfica & Indicadores de Desempenho</span>
            </h3>
            <p className="text-xs text-slate-500">
              Evolução cronológica de investimento, captação, conversão e CAC mês a mês
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 print:hidden">
            <button
              onClick={() => setActiveTab('financial')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'financial' ? 'bg-white text-[#002139] shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Financeiro (Invest. x Receita)
            </button>
            <button
              onClick={() => setActiveTab('efficiency')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'efficiency' ? 'bg-white text-[#002139] shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Eficiência (CAC x CPL)
            </button>
            <button
              onClick={() => setActiveTab('channels')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'channels' ? 'bg-white text-[#002139] shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Canais & Conversão
            </button>
          </div>
        </div>

        {/* Tab 1: Financial Evolution (Investimento vs Receita) */}
        {activeTab === 'financial' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#002139]"></span>
                  <span className="font-semibold text-slate-700">Investimento em Tráfego (R$)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-emerald-600"></span>
                  <span className="font-semibold text-slate-700">Receita de Vendas (R$)</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-400">Passe o mouse nas colunas para detalhar</span>
            </div>

            {/* SVG Grouped Bar Chart */}
            <div className="relative h-64 w-full bg-slate-50/50 rounded-xl p-4 border border-slate-100 flex flex-col justify-end">
              {monthlyPerf.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  Sem dados suficientes para exibir o gráfico mensal.
                </div>
              ) : (
                <div className="h-48 w-full flex items-end justify-around gap-2 px-2 pt-6">
                  {monthlyPerf.map((point) => {
                    const spendHeightPct = maxSpendOrRevenue > 0 ? (point.ad_spend / maxSpendOrRevenue) * 100 : 0;
                    const revHeightPct = maxSpendOrRevenue > 0 ? (point.revenue / maxSpendOrRevenue) * 100 : 0;
                    const isHovered = hoveredMonth === point.month_key;

                    return (
                      <div
                        key={point.month_key}
                        className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                        onMouseEnter={() => setHoveredMonth(point.month_key)}
                        onMouseLeave={() => setHoveredMonth(null)}
                      >
                        {/* Tooltip */}
                        {isHovered && (
                          <div className="absolute -top-16 z-20 bg-[#002139] text-white text-[11px] py-1.5 px-3 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                            <p className="font-bold text-[#c1ef6d]">{point.month_label}</p>
                            <p>Investido: R$ {point.ad_spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            <p>Receita: R$ {point.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            <p>ROAS: {point.roas}x</p>
                          </div>
                        )}

                        {/* Bars container */}
                        <div className="w-full max-w-[64px] flex items-end justify-center gap-1.5 h-full">
                          {/* Spend Bar */}
                          <div
                            style={{ height: `${Math.max(4, spendHeightPct)}%` }}
                            className={`w-1/2 bg-[#002139] rounded-t-sm transition-all duration-300 ${
                              isHovered ? 'bg-[#00375a] scale-y-105' : ''
                            }`}
                          />
                          {/* Revenue Bar */}
                          <div
                            style={{ height: `${Math.max(4, revHeightPct)}%` }}
                            className={`w-1/2 bg-emerald-600 rounded-t-sm transition-all duration-300 ${
                              isHovered ? 'bg-emerald-500 scale-y-105' : ''
                            }`}
                          />
                        </div>

                        {/* Month Label */}
                        <span className="text-[11px] font-bold text-slate-600 mt-2 truncate w-full text-center">
                          {point.month_label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Efficiency (CAC x CPL) */}
        {activeTab === 'efficiency' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-600"></span>
                  <span className="font-semibold text-slate-700">CAC - Custo de Aquisição (R$)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-sky-600"></span>
                  <span className="font-semibold text-slate-700">CPL - Custo por Lead (R$)</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-400">Quanto menor a linha, maior a eficiência</span>
            </div>

            {/* SVG Line / Dot Chart */}
            <div className="relative h-64 w-full bg-slate-50/50 rounded-xl p-4 border border-slate-100 flex flex-col justify-end">
              <div className="h-48 w-full flex items-end justify-around gap-2 px-2 pt-6">
                {monthlyPerf.map((point) => {
                  const cacPct = maxCacOrCpl > 0 ? (point.cac / maxCacOrCpl) * 100 : 0;
                  const cplPct = maxCacOrCpl > 0 ? (point.cpl / maxCacOrCpl) * 100 : 0;
                  const isHovered = hoveredMonth === point.month_key;

                  return (
                    <div
                      key={point.month_key}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                      onMouseEnter={() => setHoveredMonth(point.month_key)}
                      onMouseLeave={() => setHoveredMonth(null)}
                    >
                      {/* Tooltip */}
                      {isHovered && (
                        <div className="absolute -top-16 z-20 bg-[#002139] text-white text-[11px] py-1.5 px-3 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                          <p className="font-bold text-[#c1ef6d]">{point.month_label}</p>
                          <p>CAC: R$ {point.cac.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <p>CPL: R$ {point.cpl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <p>Vendas: {point.conversions_count} ({point.conversion_rate}%)</p>
                        </div>
                      )}

                      {/* Visual Pill Column */}
                      <div className="w-full flex flex-col items-center justify-end h-full relative">
                        {/* CAC Marker */}
                        <div
                          style={{ bottom: `${Math.max(6, Math.min(92, cacPct))}%` }}
                          className="absolute w-3.5 h-3.5 rounded-full bg-rose-600 border-2 border-white shadow-sm flex items-center justify-center transition-all group-hover:scale-125"
                        />
                        {/* CPL Marker */}
                        <div
                          style={{ bottom: `${Math.max(6, Math.min(92, cplPct))}%` }}
                          className="absolute w-3 h-3 rounded-full bg-sky-600 border-2 border-white shadow-sm flex items-center justify-center transition-all group-hover:scale-125"
                        />
                        {/* Connecting background stick */}
                        <div className="w-0.5 h-full bg-slate-200 group-hover:bg-slate-300 transition-colors" />
                      </div>

                      <span className="text-[11px] font-bold text-slate-600 mt-2 truncate w-full text-center">
                        {point.month_label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Channels & Conversion */}
        {activeTab === 'channels' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Channel Conversion Bars */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Taxa de Conversão por Canal
                </span>
                {summary.channel_distribution.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">Nenhum canal registrado.</p>
                ) : (
                  summary.channel_distribution.map(ch => (
                    <div key={ch.channel} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-[#002139]">{ch.channel_detail || ch.channel}</span>
                        <span className="font-extrabold text-emerald-800 tabular-nums">{ch.conversion_rate}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, ch.conversion_rate)}%` }}
                          className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>{ch.leads_received} leads captados</span>
                        <span>{ch.leads_converted} convertidos</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Channel Volume Distribution */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Participação no Volume de Leads
                </span>
                {summary.channel_distribution.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">Nenhum canal registrado.</p>
                ) : (
                  summary.channel_distribution.map(ch => (
                    <div key={ch.channel} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-[#002139]">{ch.channel_detail || ch.channel}</span>
                        <span className="font-semibold text-slate-700 tabular-nums">{ch.share_percentage}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, ch.share_percentage)}%` }}
                          className="h-full bg-[#002139] rounded-full transition-all duration-500"
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Receita: R$ {ch.total_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span>{ch.leads_received} leads</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Monthly Performance Consolidated Table */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#002139]">
              Consolidação Mensal: Investimento, Leads, CAC e Receita
            </h3>
            <p className="text-xs text-slate-500">
              Histórico cruzado de investimento registrado mês a mês com os leads identificados com a tag trafego_pago
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[750px]">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 h-10">
                <th className="px-6">Mês</th>
                <th className="px-6 text-right">Investimento (R$)</th>
                <th className="px-6 text-right">Leads Captados</th>
                <th className="px-6 text-right">Clientes Ganhos</th>
                <th className="px-6 text-right">Taxa Conv.</th>
                <th className="px-6 text-right">CPL</th>
                <th className="px-6 text-right">CAC</th>
                <th className="px-6 text-right">Receita Total</th>
                <th className="px-6 text-right">ROAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyPerf.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-6 text-slate-400">
                    Aguardando primeiros registros de investimento e captação.
                  </td>
                </tr>
              ) : (
                monthlyPerf.map(m => (
                  <tr key={m.month_key} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-[#002139]">{m.month_label}</td>
                    <td className="px-6 py-3.5 text-right font-medium text-slate-800 tabular-nums">
                      R$ {m.ad_spend.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3.5 text-right tabular-nums">{m.leads_count}</td>
                    <td className="px-6 py-3.5 text-right font-bold text-emerald-800 tabular-nums">{m.conversions_count}</td>
                    <td className="px-6 py-3.5 text-right font-semibold text-emerald-800 tabular-nums">{m.conversion_rate}%</td>
                    <td className="px-6 py-3.5 text-right text-sky-800 font-medium tabular-nums">
                      R$ {m.cpl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3.5 text-right text-emerald-900 font-bold tabular-nums">
                      R$ {m.cac.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3.5 text-right font-medium text-slate-800 tabular-nums">
                      R$ {m.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3.5 text-right font-bold text-slate-900 tabular-nums">
                      {m.roas}x
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {monthlyPerf.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t border-slate-200">
                  <td className="px-6 py-3 text-slate-800 uppercase tracking-wider text-[11px]">
                    Total Consolidado
                  </td>
                  <td className="px-6 py-3 text-right text-[#002139] tabular-nums">
                    R$ {monthlyPerf.reduce((acc, m) => acc + m.ad_spend, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-3 text-right text-[#002139] tabular-nums">
                    {monthlyPerf.reduce((acc, m) => acc + m.leads_count, 0)}
                  </td>
                  <td className="px-6 py-3 text-right text-emerald-800 tabular-nums">
                    {monthlyPerf.reduce((acc, m) => acc + m.conversions_count, 0)}
                  </td>
                  <td className="px-6 py-3 text-right text-emerald-800 tabular-nums">
                    {(() => {
                      const totalL = monthlyPerf.reduce((acc, m) => acc + m.leads_count, 0);
                      const totalC = monthlyPerf.reduce((acc, m) => acc + m.conversions_count, 0);
                      return totalL > 0 ? `${((totalC / totalL) * 100).toFixed(1)}%` : '0%';
                    })()}
                  </td>
                  <td className="px-6 py-3 text-right text-sky-800 tabular-nums">
                    {(() => {
                      const totalS = monthlyPerf.reduce((acc, m) => acc + m.ad_spend, 0);
                      const totalL = monthlyPerf.reduce((acc, m) => acc + m.leads_count, 0);
                      return totalL > 0 ? `R$ ${(totalS / totalL).toFixed(2).replace('.', ',')}` : 'R$ 0,00';
                    })()}
                  </td>
                  <td className="px-6 py-3 text-right text-emerald-900 tabular-nums">
                    {(() => {
                      const totalS = monthlyPerf.reduce((acc, m) => acc + m.ad_spend, 0);
                      const totalC = monthlyPerf.reduce((acc, m) => acc + m.conversions_count, 0);
                      return totalC > 0 ? `R$ ${(totalS / totalC).toFixed(2).replace('.', ',')}` : 'R$ 0,00';
                    })()}
                  </td>
                  <td className="px-6 py-3 text-right text-[#002139] tabular-nums">
                    R$ {monthlyPerf.reduce((acc, m) => acc + m.revenue, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-3 text-right text-[#002139] tabular-nums">
                    {(() => {
                      const totalS = monthlyPerf.reduce((acc, m) => acc + m.ad_spend, 0);
                      const totalR = monthlyPerf.reduce((acc, m) => acc + m.revenue, 0);
                      return totalS > 0 ? `${(totalR / totalS).toFixed(2)}x` : '0x';
                    })()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* Breakdown by Periods Table */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-base font-bold text-[#002139]">
            Consolidação dos Períodos de Auditoria (Regras de Fechamento)
          </h3>
          <p className="text-xs text-slate-500">
            Fuso horário America/Belem com semana iniciando na Segunda-feira
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[650px]">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 h-10">
                <th className="px-6">Período de Referência</th>
                <th className="px-6 text-right">Leads Recebidos (trafego_pago)</th>
                <th className="px-6 text-right">Comparativo / Variação</th>
                <th className="px-6 text-right">Status do Período</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-3.5 font-bold text-[#002139]">Hoje</td>
                <td className="px-6 py-3.5 text-right font-semibold text-slate-800 tabular-nums">{summary.leads_today}</td>
                <td className="px-6 py-3.5 text-right font-bold text-emerald-700 tabular-nums">
                  {summary.growth_today_vs_yesterday > 0 ? `+${summary.growth_today_vs_yesterday}%` : `${summary.growth_today_vs_yesterday}%`} vs ontem
                </td>
                <td className="px-6 py-3.5 text-right text-slate-500">Em andamento</td>
              </tr>
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-3.5 font-bold text-[#002139]">Ontem</td>
                <td className="px-6 py-3.5 text-right font-semibold text-slate-800 tabular-nums">{summary.leads_yesterday}</td>
                <td className="px-6 py-3.5 text-right text-slate-500 tabular-nums">-</td>
                <td className="px-6 py-3.5 text-right text-slate-500">Consolidado</td>
              </tr>
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-3.5 font-bold text-[#002139]">Últimos 7 dias</td>
                <td className="px-6 py-3.5 text-right font-semibold text-slate-800 tabular-nums">{summary.leads_last_7_days}</td>
                <td className="px-6 py-3.5 text-right text-slate-500 tabular-nums">Janela móvel</td>
                <td className="px-6 py-3.5 text-right text-slate-500">7 dias corridos</td>
              </tr>
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-3.5 font-bold text-[#002139]">Semana Atual (Seg - Dom)</td>
                <td className="px-6 py-3.5 text-right font-semibold text-slate-800 tabular-nums">{summary.leads_this_week}</td>
                <td className="px-6 py-3.5 text-right text-slate-500 tabular-nums">Semana em curso</td>
                <td className="px-6 py-3.5 text-right text-slate-500">America/Belem</td>
              </tr>
              <tr className="hover:bg-slate-50/80 transition-colors bg-emerald-50/30">
                <td className="px-6 py-3.5 font-bold text-[#002139]">Mês Atual</td>
                <td className="px-6 py-3.5 text-right font-extrabold text-[#002139] tabular-nums">{summary.leads_this_month.toLocaleString('pt-BR')}</td>
                <td className="px-6 py-3.5 text-right font-bold text-emerald-700 tabular-nums">
                  {summary.growth_month_vs_last_month > 0 ? `+${summary.growth_month_vs_last_month}%` : `${summary.growth_month_vs_last_month}%`} vs mês anterior
                </td>
                <td className="px-6 py-3.5 text-right font-bold text-emerald-800">Em curso</td>
              </tr>
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-3.5 font-bold text-[#002139]">Mês Anterior</td>
                <td className="px-6 py-3.5 text-right font-semibold text-slate-800 tabular-nums">{summary.leads_last_month.toLocaleString('pt-BR')}</td>
                <td className="px-6 py-3.5 text-right text-slate-500 tabular-nums">-</td>
                <td className="px-6 py-3.5 text-right text-slate-500">Consolidado</td>
              </tr>
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-3.5 font-bold text-[#002139]">Ano Atual</td>
                <td className="px-6 py-3.5 text-right font-semibold text-slate-800 tabular-nums">{summary.leads_this_year.toLocaleString('pt-BR')}</td>
                <td className="px-6 py-3.5 text-right text-slate-500 tabular-nums">-</td>
                <td className="px-6 py-3.5 text-right text-slate-500">Ano civil</td>
              </tr>
              <tr className="hover:bg-slate-50/80 transition-colors font-bold text-slate-900 bg-slate-50">
                <td className="px-6 py-3.5">Total Histórico Auditado</td>
                <td className="px-6 py-3.5 text-right tabular-nums">{summary.leads_total_historical.toLocaleString('pt-BR')}</td>
                <td className="px-6 py-3.5 text-right text-emerald-700">100% Rastreável</td>
                <td className="px-6 py-3.5 text-right text-slate-600">Base total</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
