import React, { useState } from 'react';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  UserX, 
  Search, 
  ExternalLink, 
  MessageSquare, 
  Eye, 
  Edit3, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  RotateCcw,
  Sparkles,
  Zap,
  DollarSign
} from 'lucide-react';
import { LeadRecord, AnalyticsSummary } from '../types.ts';

interface LeadsViewProps {
  leads: LeadRecord[];
  summary: AnalyticsSummary | null;
  totalLeads: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  selectedChannel: string;
  onChannelChange: (channel: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenDetails: (lead: LeadRecord) => void;
  onQuickToggleConverted: (lead: LeadRecord) => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  summary,
  totalLeads,
  currentPage,
  totalPages,
  onPageChange,
  selectedChannel,
  onChannelChange,
  selectedStatus,
  onStatusChange,
  searchQuery,
  onSearchChange,
  onOpenDetails,
  onQuickToggleConverted
}) => {
  const channels = ['Todos', 'WhatsApp', 'Instagram', 'Facebook', 'Webchat'];
  const statuses = [
    { id: 'all', label: 'Todos' },
    { id: 'lead', label: 'Lead' },
    { id: 'converted', label: 'Convertido' },
    { id: 'not_converted', label: 'Não Convertido' }
  ];

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMin = Math.round(diffMs / 60000);
      const diffHours = Math.round(diffMs / 3600000);
      const diffDays = Math.round(diffMs / 86400000);

      const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Belem' });
      const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Belem' });

      if (diffMin < 60) {
        return { main: `Hoje, ${timeStr}`, sub: `há ${diffMin} minutos` };
      } else if (diffHours < 24) {
        return { main: `Hoje, ${timeStr}`, sub: `há ${diffHours}h` };
      } else if (diffDays === 1) {
        return { main: `${dateStr} ${timeStr}`, sub: 'Ontem' };
      } else {
        return { main: `${dateStr} ${timeStr}`, sub: `${diffDays} dias atrás` };
      }
    } catch {
      return { main: '-', sub: '-' };
    }
  };

  const getChannelBadge = (lead: LeadRecord) => {
    const ch = lead.channel || 'Outros';
    const detail = lead.channel_detail || ch;

    switch (ch) {
      case 'WhatsApp':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#E0F7F6] text-[#006A68] border border-[#B2EBE8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#006A68]"></span>
            {detail}
          </span>
        );
      case 'Instagram':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0369A1]"></span>
            {detail}
          </span>
        );
      case 'Facebook':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#EDF3F8] text-[#00386E] border border-[#C5D7E8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00386E]"></span>
            {detail}
          </span>
        );
      case 'Webchat':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#F4F9EB] text-[#4C6C00] border border-[#DCEDB5]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4C6C00]"></span>
            {detail}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {detail}
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
      {/* ========================================== */}
      {/* 1. SUMMARY STAT STRIP                      */}
      {/* ========================================== */}
      <section aria-label="Estatísticas de Resumo" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Leads */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Leads no Período
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#00375a]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#002139] tabular-nums font-['Plus_Jakarta_Sans',sans-serif]">
              {summary ? summary.filtered_leads_total.toLocaleString('pt-BR') : totalLeads.toLocaleString('pt-BR')}
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
              {summary?.growth_month_vs_last_month ? `${summary.growth_month_vs_last_month > 0 ? '+' : ''}${summary.growth_month_vs_last_month}%` : '0%'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Mês atual vs anterior ({summary?.leads_last_month || 0} leads)
          </p>
        </div>

        {/* Convertidos */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Convertidos (Ganhamos)
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#c1ef6d]/40 flex items-center justify-center text-emerald-800">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#002139] tabular-nums font-['Plus_Jakarta_Sans',sans-serif]">
                {summary ? summary.filtered_leads_converted.toLocaleString('pt-BR') : '0'}
              </span>
              <span className="text-xs font-bold text-emerald-700">
                ({summary?.filtered_conversion_rate || 0}%)
              </span>
            </div>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
              Ganhamos
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Taxa média de fechamento do time
          </p>
        </div>

        {/* Em Atendimento */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Em Atendimento
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-800">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#002139] tabular-nums font-['Plus_Jakarta_Sans',sans-serif]">
              {summary ? summary.filtered_leads_in_progress.toLocaleString('pt-BR') : '0'}
            </span>
            <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              {summary && summary.filtered_leads_total > 0 ? `${((summary.filtered_leads_in_progress / summary.filtered_leads_total) * 100).toFixed(1)}%` : '0%'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Conversas ativas nos canais integrados
          </p>
        </div>

        {/* Não Convertidos */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Não Convertidos
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#002139] tabular-nums font-['Plus_Jakarta_Sans',sans-serif]">
              {summary ? summary.filtered_leads_not_converted.toLocaleString('pt-BR') : '0'}
            </span>
            <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700">
              {summary && summary.filtered_leads_total > 0 ? `${((summary.filtered_leads_not_converted / summary.filtered_leads_total) * 100).toFixed(1)}%` : '0%'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Abandonos ou desqualificados
          </p>
        </div>
      </section>

      {/* ========================================== */}
      {/* 2. CONTROLS BAR & ADVANCED FILTERS        */}
      {/* ========================================== */}
      <section aria-label="Filtros e Busca" className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Live Search Input */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Buscar por nome, telefone, e-mail ou ID Chatwoot..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1A94C5] focus:bg-white transition-all font-medium"
            />
          </div>

          {/* Status Filter Group (Channel filter removed per user request) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
            <span className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider">
              Status:
            </span>
            {statuses.map(st => {
              const isActive = (selectedStatus === st.id) || (st.id === 'all' && (!selectedStatus || selectedStatus === 'all'));
              return (
                <button
                  key={st.id}
                  onClick={() => onStatusChange(st.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#002139] text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Counter and status line */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">
              Mostrando {leads.length > 0 ? (currentPage - 1) * 10 + 1 : 0} - {Math.min(currentPage * 10, totalLeads)} de {totalLeads.toLocaleString('pt-BR')} leads
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-400">
              Atualização contínua via Webhook Chatwoot
            </span>
          </div>

          <button
            onClick={() => {
              onChannelChange('');
              onStatusChange('all');
              onSearchChange('');
            }}
            className="text-slate-400 hover:text-slate-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar filtros</span>
          </button>
        </div>
      </section>

      {/* ========================================== */}
      {/* 3. LEADS TABLE                             */}
      {/* ========================================== */}
      <section aria-label="Tabela de Leads" className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-6">Contato</th>
                <th className="py-3.5 px-4">Data de Entrada</th>
                <th className="py-3.5 px-4">Canal de Origem</th>
                <th className="py-3.5 px-4">ID da Conversa</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Data da Conversão</th>
                <th className="py-3.5 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Nenhum lead encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                leads.map(lead => {
                  const time = formatRelativeTime(lead.entry_date);
                  const convTime = lead.conversion_date ? formatRelativeTime(lead.conversion_date) : null;
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
                      onClick={() => onOpenDetails(lead)}
                    >
                      {/* Contato */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#cee5ff] text-[#002139] flex items-center justify-center font-bold text-xs ring-1 ring-slate-200 shrink-0">
                            {initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-[#002139] group-hover:text-[#1A94C5] transition-colors">
                              {lead.contact_name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {lead.contact_email ? `${lead.contact_email} • ` : ''}{lead.contact_phone || 'Sem telefone'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Data de Entrada */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">
                            {time.main}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {time.sub}
                          </span>
                        </div>
                      </td>

                      {/* Canal de Origem */}
                      <td className="py-3.5 px-4">
                        {getChannelBadge(lead)}
                      </td>

                      {/* ID da Conversa */}
                      <td className="py-3.5 px-4">
                        <a
                          href={lead.chatwoot_url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1 font-mono text-xs text-[#00375a] font-bold hover:underline bg-slate-100 px-2 py-1 rounded-md border border-slate-200"
                        >
                          #CW-{lead.conversation_id}
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {lead.status === 'converted' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#c1ef6d]/40 text-emerald-900 border border-[#c1ef6d]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Convertido
                          </span>
                        ) : lead.status === 'not_converted' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Não Convertido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-600"></span>
                            Lead
                          </span>
                        )}
                      </td>

                      {/* Data da Conversão */}
                      <td className="py-3.5 px-4">
                        {lead.is_converted && convTime ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800">
                              {convTime.main}
                            </span>
                            <span className="text-[11px] font-bold text-emerald-700">
                              {lead.value && lead.value > 0 ? `R$ ${lead.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-bold">-</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={lead.chatwoot_url || '#'}
                            target="_blank"
                            rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            title="Ver conversa no Chatwoot"
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-[#00375a] transition-colors"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              onOpenDetails(lead);
                            }}
                            title="Detalhes do Lead"
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-[#00375a] transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              onQuickToggleConverted(lead);
                            }}
                            title={lead.is_converted ? 'Remover tag Ganhamos' : 'Marcar como Convertido (Ganhamos)'}
                            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                              lead.is_converted 
                                ? 'text-emerald-700 hover:bg-emerald-50' 
                                : 'text-slate-400 hover:text-emerald-700 hover:bg-slate-100'
                            }`}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. PAGINATION FOOTER */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span>Mostrando 10 registros por página</span>
            <span>•</span>
            <span className="font-semibold text-slate-800">
              Página {currentPage} de {totalPages || 1}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold transition-colors flex items-center gap-1 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            {/* Page number buttons */}
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const p = i + 1;
              const isActive = p === currentPage;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#002139] text-white shadow-xs'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            {totalPages > 5 && (
              <>
                <span className="px-1 text-slate-400">...</span>
                <button
                  onClick={() => onPageChange(totalPages)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all cursor-pointer ${
                    currentPage === totalPages ? 'bg-[#002139] text-white' : ''
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold transition-colors flex items-center gap-1 disabled:opacity-40 cursor-pointer"
            >
              <span>Próxima</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 5. SLA & INSIGHTS SUB-BANNER              */}
      {/* ========================================== */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-700">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Tempo Médio de 1ª Resposta
            </p>
            <p className="text-base font-bold text-[#002139]">
              1m 42s <span className="text-xs text-emerald-700 font-normal">(Ótimo SLA)</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 rounded-xl text-sky-800">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Canal com Maior Conversão
            </p>
            <p className="text-base font-bold text-[#002139]">
              {summary?.top_converting_channel?.name || 'Aguardando dados'} {summary?.top_converting_channel?.rate ? <span className="text-xs text-sky-700 font-normal">({summary.top_converting_channel.rate}%)</span> : null}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-800">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Receita Rastreada no Período
            </p>
            <p className="text-base font-bold text-[#002139]">
              R$ {(summary?.total_revenue_period ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
