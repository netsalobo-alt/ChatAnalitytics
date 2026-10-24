import React from 'react';
import { 
  Radio, 
  TrendingUp, 
  MessageSquare, 
  DollarSign, 
  BarChart, 
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { AnalyticsSummary, ChannelPerformance } from '../types.ts';

interface ChannelsViewProps {
  summary: AnalyticsSummary | null;
  onFilterByChannel: (channel: string) => void;
}

export const ChannelsView: React.FC<ChannelsViewProps> = ({
  summary,
  onFilterByChannel
}) => {
  if (!summary) return null;

  const channels = summary.channel_distribution || [];

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#002139] flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#1A94C5]" />
            Atribuição e Desempenho por Canal de Entrada
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Mapeamento dinâmico baseado nos <span className="font-mono text-[#00375a] font-semibold">inbox_id</span> do Chatwoot e campanhas de tráfego pago associadas.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <span>Total de Canais Ativos:</span>
          <span className="font-bold text-[#00375a]">{channels.length}</span>
        </div>
      </div>

      {/* Channel Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {channels.map(ch => {
          const isTop = ch.channel === summary.top_converting_channel.name || ch.channel_detail === summary.top_converting_channel.name;

          return (
            <div 
              key={ch.channel} 
              className={`bg-white rounded-2xl p-5 border shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                isTop ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-slate-200/90'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#00375a]"></span>
                    <h3 className="text-sm font-bold text-[#002139]">
                      {ch.channel_detail || ch.channel}
                    </h3>
                  </div>
                  {isTop && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <Sparkles className="w-3 h-3" />
                      Maior Conversão
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Recebidos
                    </span>
                    <span className="text-xl font-extrabold text-[#002139] tabular-nums">
                      {ch.leads_received.toLocaleString('pt-BR')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                      Convertidos
                    </span>
                    <span className="text-xl font-extrabold text-emerald-800 tabular-nums">
                      {ch.leads_converted.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>

                {/* Progress bar of share */}
                <div className="mt-4">
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>Participação no Volume:</span>
                    <span className="font-bold text-[#00375a]">{ch.share_percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isTop ? 'bg-emerald-600' : 'bg-[#00375a]'}`} 
                      style={{ width: `${ch.share_percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Taxa de Conversão</span>
                  <span className="text-base font-bold text-[#002139]">{ch.conversion_rate}%</span>
                </div>
                <button
                  onClick={() => onFilterByChannel(ch.channel)}
                  className="px-3 py-1 rounded-lg text-xs font-bold text-[#00375a] bg-slate-100 hover:bg-[#00375a] hover:text-white transition-all cursor-pointer"
                >
                  Filtrar Leads
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {/* Consolidated Channels Comparison Table */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#002139]">
              Matriz Comparativa Oficial dos Canais Chatwoot
            </h3>
            <p className="text-xs text-slate-500">
              Contabilização exata de leads com etiqueta trafego_pago e conversões com Ganhamos
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 h-10">
                <th className="px-6">Canal / Caixa Chatwoot</th>
                <th className="px-6 text-right">Leads Recebidos (trafego_pago)</th>
                <th className="px-6 text-right">Leads Convertidos (Ganhamos)</th>
                <th className="px-6 text-right">Não Convertidos</th>
                <th className="px-6 text-right">Conversão (%)</th>
                <th className="px-6 text-right">Participação (%)</th>
                <th className="px-6 text-right">Receita Total</th>
                <th className="px-6 text-right">Ticket Médio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {channels.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Nenhum canal com leads de tráfego pago registrado no momento.
                  </td>
                </tr>
              ) : (
                channels.map(ch => (
                  <tr key={ch.channel} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#00375a]"></span>
                        <span className="font-bold text-[#002139]">{ch.channel_detail || ch.channel}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-800 tabular-nums">
                      {ch.leads_received.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-800 tabular-nums">
                      {ch.leads_converted.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500 tabular-nums">
                      {ch.not_converted.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-800">
                        {ch.conversion_rate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-700 tabular-nums">
                      {ch.share_percentage}%
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 tabular-nums">
                      R$ {(ch.total_revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-600 tabular-nums">
                      R$ {(ch.average_ticket || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
