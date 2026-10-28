import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  Tag, 
  MessageSquare, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  DollarSign,
  Radio,
  CheckCircle2,
  Edit2,
  Check,
  RotateCcw
} from 'lucide-react';
import { LeadRecord } from '../types.ts';

interface LeadDetailModalProps {
  lead: LeadRecord | null;
  onClose: () => void;
  onToggleConverted: (lead: LeadRecord) => void;
  onUpdateValue?: (lead: LeadRecord, value: number) => Promise<void>;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  onClose,
  onToggleConverted,
  onUpdateValue
}) => {
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [valueInput, setValueInput] = useState('');
  const [isSavingValue, setIsSavingValue] = useState(false);

  useEffect(() => {
    if (lead) {
      setValueInput(lead.value !== undefined ? String(lead.value) : '0');
      setIsEditingValue(false);
    }
  }, [lead]);

  if (!lead) return null;

  const handleSaveValue = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!onUpdateValue) return;

    const num = Math.max(0, parseFloat(valueInput.replace(',', '.')) || 0);
    setIsSavingValue(true);
    try {
      await onUpdateValue(lead, num);
      setIsEditingValue(false);
    } finally {
      setIsSavingValue(false);
    }
  };

  const initials = lead.contact_name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const entryDateFormatted = new Date(lead.entry_date).toLocaleString('pt-BR', { timeZone: 'America/Belem' });
  const conversionDateFormatted = lead.conversion_date 
    ? new Date(lead.conversion_date).toLocaleString('pt-BR', { timeZone: 'America/Belem' }) 
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#cee5ff] text-[#002139] flex items-center justify-center font-bold text-base ring-2 ring-white shadow-xs">
              {initials}
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#002139] font-['Plus_Jakarta_Sans',sans-serif]">
                {lead.contact_name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xs text-[#00375a] font-bold">
                  #CW-{lead.conversation_id}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500">
                  Conta #{lead.account_id}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* Status & Value Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Status Comercial
              </span>
              <div className="mt-1">
                {lead.status === 'converted' ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#c1ef6d]/40 text-emerald-900 border border-[#c1ef6d]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      Convertido (Ganhamos)
                    </span>
                    {lead.manually_converted && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                        Manual • Protegido
                      </span>
                    )}
                  </div>
                ) : lead.status === 'not_converted' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                    Não Convertido
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                    Lead em Atendimento
                  </span>
                )}
              </div>
            </div>

            {/* Editable Sale Value */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Valor da Venda (R$)
                </span>
                {!isEditingValue && onUpdateValue && (
                  <button
                    type="button"
                    onClick={() => setIsEditingValue(true)}
                    className="text-[10px] text-[#1A94C5] hover:text-[#00375a] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                    Editar
                  </button>
                )}
              </div>

              {isEditingValue ? (
                <form onSubmit={handleSaveValue} className="mt-1 flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      autoFocus
                      value={valueInput}
                      onChange={e => setValueInput(e.target.value)}
                      placeholder="0,00"
                      className="w-full pl-8 pr-2 py-1 bg-white border border-[#1A94C5] rounded-lg text-xs font-bold text-[#002139] focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingValue}
                    className="p-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer transition-colors disabled:opacity-50"
                    title="Salvar valor da venda"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValueInput(lead.value !== undefined ? String(lead.value) : '0');
                      setIsEditingValue(false);
                    }}
                    className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 cursor-pointer transition-colors"
                    title="Cancelar edição"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <div 
                  onClick={() => onUpdateValue && setIsEditingValue(true)}
                  className="mt-1 group flex items-baseline gap-1.5 cursor-pointer"
                  title="Clique para editar o valor da venda"
                >
                  <span className="text-base font-extrabold text-[#002139] tabular-nums group-hover:text-[#1A94C5] transition-colors">
                    {lead.value && lead.value > 0 ? `R$ ${lead.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                  </span>
                  <Edit2 className="w-3 h-3 text-slate-300 group-hover:text-[#1A94C5] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Dados do Contato
            </h4>
            <div className="space-y-1.5 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium">{lead.contact_phone || 'Telefone não informado'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium">{lead.contact_email || 'E-mail não informado'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Radio className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium">Canal: {lead.channel_detail || lead.channel} ({lead.inbox_name})</span>
              </div>
            </div>
          </div>

          {/* Attribution & Campaign */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Rastreamento de Tráfego Pago
            </h4>
            <div className="p-3 rounded-xl border border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-slate-700">
                <span>Campanha Detectada:</span>
                <span className="font-semibold text-[#00375a]">{lead.campaign || 'Tráfego Pago Geral'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>Data de Entrada (Belém):</span>
                <span className="font-medium">{entryDateFormatted}</span>
              </div>
              {conversionDateFormatted && (
                <div className="flex items-center justify-between text-slate-700">
                  <span>Data da Conversão:</span>
                  <span className="font-bold text-emerald-800">{conversionDateFormatted}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tags / Labels */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Etiquetas no Chatwoot (Labels)
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {lead.tags.map((tag, i) => (
                <span 
                  key={i} 
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold flex items-center gap-1 ${
                    tag.toLowerCase() === 'trafego_pago'
                      ? 'bg-sky-50 text-sky-800 border border-sky-200'
                      : tag.toLowerCase() === 'ganhamos'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <Tag className="w-3 h-3 opacity-60" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onToggleConverted(lead)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              lead.is_converted
                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                : 'bg-emerald-700 text-white hover:bg-emerald-800'
            }`}
          >
            {lead.is_converted ? 'Remover Tag Ganhamos' : 'Marcar Venda (Ganhamos)'}
          </button>

          <a
            href={lead.chatwoot_url || '#'}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00375a] hover:bg-[#002139] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <span>Abrir no Chatwoot</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#c1ef6d]" />
          </a>
        </div>
      </div>
    </div>
  );
};
