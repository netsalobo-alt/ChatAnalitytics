import React, { useState } from 'react';
import { X, Plus, User, Phone, Mail, Radio, DollarSign, CheckCircle } from 'lucide-react';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    contact_name: string;
    contact_phone?: string;
    contact_email?: string;
    channel: 'WhatsApp' | 'Instagram' | 'Facebook' | 'Webchat' | 'Outros';
    channel_detail?: string;
    value?: number;
    is_converted?: boolean;
  }) => Promise<void>;
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [channel, setChannel] = useState<'WhatsApp' | 'Instagram' | 'Facebook' | 'Webchat' | 'Outros'>('WhatsApp');
  const [channelDetail, setChannelDetail] = useState('WhatsApp Ads');
  const [value, setValue] = useState('');
  const [isConverted, setIsConverted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        contact_name: name.trim(),
        contact_phone: phone.trim() || undefined,
        contact_email: email.trim() || undefined,
        channel,
        channel_detail: channelDetail || `${channel} Ads`,
        value: value ? Number(value) : 0,
        is_converted: isConverted
      });
      // reset
      setName('');
      setPhone('');
      setEmail('');
      setValue('');
      setIsConverted(false);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChannelSelect = (ch: typeof channel) => {
    setChannel(ch);
    switch (ch) {
      case 'WhatsApp':
        setChannelDetail('WhatsApp Ads');
        break;
      case 'Instagram':
        setChannelDetail('Instagram Direct');
        break;
      case 'Facebook':
        setChannelDetail('Facebook Leads');
        break;
      case 'Webchat':
        setChannelDetail('Webchat Site');
        break;
      default:
        setChannelDetail('API Inbound');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00375a] text-white flex items-center justify-center">
              <Plus className="w-4 h-4 text-[#c1ef6d]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#002139] font-['Plus_Jakarta_Sans',sans-serif]">
                Registrar Novo Lead Manual
              </h3>
              <p className="text-[11px] text-slate-400">
                Aplica automaticamente a etiqueta obrigatória <span className="font-mono text-[#00375a] font-bold">trafego_pago</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Nome do Contato *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Fernanda Lima"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A94C5] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Telefone / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A94C5] focus:bg-white transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="fernanda@empresa.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A94C5] focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Canal de Entrada
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['WhatsApp', 'Instagram', 'Facebook', 'Webchat', 'Outros'] as const).map(ch => (
                <button
                  type="button"
                  key={ch}
                  onClick={() => handleChannelSelect(ch)}
                  className={`py-1.5 px-2 rounded-lg font-semibold text-center transition-all cursor-pointer ${
                    channel === ch
                      ? 'bg-[#00375a] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle converted */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isConverted}
                onChange={e => setIsConverted(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-bold text-slate-800">
                Lead já fechou venda (Adicionar etiqueta <span className="font-mono text-emerald-700">Ganhamos</span>)
              </span>
            </label>

            {isConverted && (
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Valor da Venda (R$)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder="3490.00"
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#00375a] hover:bg-[#002139] text-white font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Cadastrando...' : 'Criar Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
