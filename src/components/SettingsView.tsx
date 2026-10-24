import React, { useState } from 'react';
import { 
  Settings, 
  Key, 
  Globe, 
  Hash, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  Database, 
  Trash2, 
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  Radio,
  Clock,
  DollarSign,
  TrendingUp,
  Tag,
  CheckCircle2
} from 'lucide-react';
import { ChatwootConfig } from '../types.ts';

interface SettingsViewProps {
  config: ChatwootConfig | null;
  onSaveConfig: (url: string, accountId: string, token: string) => Promise<{ success: boolean; message: string }>;
  onTestConnection: (url: string, accountId: string, token: string) => Promise<{ success: boolean; message: string; inboxes?: any[]; latency_ms?: number }>;
  onManualSync: () => Promise<void>;
  isSyncing: boolean;
  onClearDb: () => Promise<void>;
  onUpdateAutoSync: (enabled?: boolean, intervalMinutes?: number, triggerNow?: boolean) => Promise<any>;
  onUpdateAdSpend?: (amount: number) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onSaveConfig,
  onTestConnection,
  onManualSync,
  isSyncing,
  onClearDb,
  onUpdateAutoSync,
  onUpdateAdSpend
}) => {
  const [url, setUrl] = useState(config?.chatwoot_url || 'https://app.chatwoot.com');
  const [accountId, setAccountId] = useState(config?.account_id || '1');
  const [apiToken, setApiToken] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency_ms?: number; inboxes?: any[] } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Auto-Sync local controls
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(config?.auto_sync_enabled ?? true);
  const [autoSyncInterval, setAutoSyncInterval] = useState(config?.auto_sync_interval_minutes ?? 10);
  const [isUpdatingAutoSync, setIsUpdatingAutoSync] = useState(false);

  // Traffic Investment (Ad Spend)
  const [adSpendInput, setAdSpendInput] = useState(config?.ad_spend ? String(config.ad_spend) : '0');
  const [isSavingAdSpend, setIsSavingAdSpend] = useState(false);
  const [adSpendMessage, setAdSpendMessage] = useState<string | null>(null);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await onTestConnection(url, accountId, apiToken);
      setTestResult(res);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setActionMessage(null);
    try {
      const res = await onSaveConfig(url, accountId, apiToken);
      setActionMessage(res.message);
      setApiToken(''); // clear plain input after save
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAutoSync = async () => {
    const nextState = !autoSyncEnabled;
    setAutoSyncEnabled(nextState);
    setIsUpdatingAutoSync(true);
    try {
      await onUpdateAutoSync(nextState, autoSyncInterval, false);
    } finally {
      setIsUpdatingAutoSync(false);
    }
  };

  const handleChangeInterval = async (minutes: number) => {
    setAutoSyncInterval(minutes);
    setIsUpdatingAutoSync(true);
    try {
      await onUpdateAutoSync(autoSyncEnabled, minutes, false);
    } finally {
      setIsUpdatingAutoSync(false);
    }
  };

  const handleTriggerAutoSyncNow = async () => {
    setIsUpdatingAutoSync(true);
    try {
      await onUpdateAutoSync(autoSyncEnabled, autoSyncInterval, true);
    } finally {
      setIsUpdatingAutoSync(false);
    }
  };

  const handleCopyWebhook = () => {
    if (config?.webhook_url) {
      navigator.clipboard.writeText(config.webhook_url);
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-4xl w-full mx-auto">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#00375a]">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#002139] font-['Plus_Jakarta_Sans',sans-serif]">
              Configurações da Integração com Chatwoot
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Conecte sua instalação em nuvem ou auto-hospedada para extração automática de leads e conversões.
            </p>
          </div>
        </div>
      </div>

      {/* Main Connection Form */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
        <h3 className="text-sm font-bold text-[#002139] flex items-center gap-2 border-b border-slate-100 pb-3">
          <Globe className="w-4 h-4 text-[#1A94C5]" />
          Credenciais da API do Chatwoot
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* URL */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              URL da Instalação do Chatwoot
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="url"
                required
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://app.chatwoot.com ou https://chatwoot.suaempresa.com.br"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A94C5] focus:bg-white transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              URL raiz do seu servidor Chatwoot sem barra final.
            </p>
          </div>

          {/* Account ID */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              ID da Conta (account_id)
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                placeholder="Ex: 1"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A94C5] focus:bg-white transition-all font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Encontrado na URL da sua conta: /app/accounts/<span className="font-bold">1</span>/conversations
            </p>
          </div>

          {/* API Access Token */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Token de Acesso à API
            </label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={apiToken}
                onChange={e => setApiToken(e.target.value)}
                placeholder={config?.has_token ? "Token salvo no servidor (••••••••)" : "Cole seu User API Token"}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A94C5] focus:bg-white transition-all font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Chatwoot &gt; Configurações do Perfil &gt; Token de Acesso da API.
            </p>
          </div>
        </div>

        {/* Action Buttons: Test Connection & Save */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting || (!apiToken && !config?.has_token)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#1A94C5] ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testando Conexão...' : 'Testar Conexão com Chatwoot'}</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#00375a] hover:bg-[#002139] text-white text-xs font-bold transition-all shadow-sm active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <span>{isSaving ? 'Salvando...' : 'Salvar Configurações'}</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {actionMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {testResult && (
          <div className={`p-4 rounded-xl border text-xs flex flex-col gap-2 ${
            testResult.success 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <div className="flex items-center gap-2 font-bold">
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testResult.message}</span>
              {testResult.latency_ms && (
                <span className="text-[10px] font-mono text-slate-500 font-normal ml-auto">
                  Latência: {testResult.latency_ms}ms
                </span>
              )}
            </div>

            {testResult.inboxes && testResult.inboxes.length > 0 && (
              <div className="mt-2 pt-2 border-t border-emerald-200/60">
                <span className="text-[11px] font-bold block mb-1">Caixas de Entrada Mapeadas:</span>
                <div className="flex flex-wrap gap-1.5">
                  {testResult.inboxes.map(ib => (
                    <span key={ib.id} className="px-2 py-0.5 rounded bg-white text-emerald-800 text-[11px] font-medium border border-emerald-200">
                      #{ib.id} {ib.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </form>

      {/* AUTOMATIC SYNCHRONIZATION SECTION */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#1A94C5] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#002139]">
                Sincronismo Automático com o Chatwoot
              </h3>
              <p className="text-[11px] text-slate-400">
                O servidor consulta periodicamente conversas com as etiquetas <span className="font-mono text-[#00375a] font-semibold">trafego_pago</span> e <span className="font-mono text-emerald-700 font-semibold">Ganhamos</span>.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700">
              {autoSyncEnabled ? 'Ativado' : 'Desativado'}
            </span>
            <button
              type="button"
              onClick={handleToggleAutoSync}
              disabled={isUpdatingAutoSync}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoSyncEnabled ? 'bg-[#00375a]' : 'bg-slate-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  autoSyncEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Interval Selector & Quick Run */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Intervalo de Consulta Periódica
            </label>
            <div className="flex flex-wrap gap-2">
              {[5, 10, 15, 30, 60].map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleChangeInterval(mins)}
                  disabled={!autoSyncEnabled || isUpdatingAutoSync}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    autoSyncInterval === mins
                      ? 'bg-[#00375a] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          <div className="flex sm:justify-end items-center gap-2 pt-2 sm:pt-0">
            <button
              type="button"
              onClick={handleTriggerAutoSyncNow}
              disabled={isUpdatingAutoSync || isSyncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#002139] text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#1A94C5] ${isUpdatingAutoSync ? 'animate-spin' : ''}`} />
              <span>{isUpdatingAutoSync ? 'Consultando...' : 'Executar Sincronismo Automático Agora'}</span>
            </button>
          </div>
        </div>

        {/* Auto-Sync Status Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between text-xs gap-2">
            <span className="text-slate-500 font-medium">Última Execução do Sincronismo Automático:</span>
            <span className="font-bold text-[#002139] font-mono">
              {config?.last_auto_sync_at 
                ? new Date(config.last_auto_sync_at).toLocaleString('pt-BR', { timeZone: 'America/Belem' })
                : 'Aguardando primeiro ciclo periódico'}
            </span>
          </div>

          {config?.last_auto_sync_result && (
            <div className="text-xs text-slate-600 pt-2 border-t border-slate-200/60 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{config.last_auto_sync_result.message}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-[11px] text-slate-500 mt-1">
                <span>Leads Auditados: <strong>{config.last_auto_sync_result.paid_leads_found}</strong></span>
                <span>Conversões 'Ganhamos': <strong>{config.last_auto_sync_result.conversions_updated}</strong></span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* PAID TRAFFIC INVESTMENT (AD SPEND) SECTION */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#002139]">
              Investimento em Tráfego Pago & Cálculo de CAC / CPL
            </h3>
            <p className="text-[11px] text-slate-400">
              Informe o valor total investido em mídia para calcular o Custo por Lead (CPL) e o Custo de Aquisição de Clientes (CAC).
            </p>
          </div>
        </div>

        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!onUpdateAdSpend) return;
          setIsSavingAdSpend(true);
          setAdSpendMessage(null);
          try {
            const parsed = Math.max(0, parseFloat(adSpendInput.replace(',', '.')) || 0);
            await onUpdateAdSpend(parsed);
            setAdSpendMessage(`Investimento em tráfego atualizado para R$ ${parsed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`);
          } finally {
            setIsSavingAdSpend(false);
          }
        }} className="space-y-3">
          <div className="space-y-1.5 max-w-sm">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Valor Investido em Tráfego (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={adSpendInput}
                onChange={e => setAdSpendInput(e.target.value)}
                placeholder="Ex: 5000.00"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A94C5] focus:bg-white transition-all font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={isSavingAdSpend}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00375a] hover:bg-[#002139] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5 text-[#c1ef6d]" />
              <span>{isSavingAdSpend ? 'Salvando...' : 'Salvar Investimento'}</span>
            </button>
            {adSpendMessage && (
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {adSpendMessage}
              </span>
            )}
          </div>
        </form>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
          <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">Fórmulas Oficiais Aplicadas:</span>
          <p>• <strong>CPL (Custo por Lead):</strong> Investimento ÷ Total de Leads que entraram em contato com tag <span className="font-mono text-[#00375a]">trafego_pago</span>.</p>
          <p>• <strong>CAC (Custo de Aquisição de Clientes):</strong> Investimento ÷ Total de Vendas fechadas com tag <span className="font-mono text-emerald-700">Ganhamos</span>.</p>
        </div>
      </section>

      {/* REVENUE ATTRIBUTION CARD - "DE ONDE O SISTEMA CAPTURA A RECEITA?" */}
      <section className="bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 p-6 rounded-2xl border border-emerald-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-emerald-100 pb-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#002139] flex items-center gap-2">
              De onde o ChatAnalytics captura a Receita das Vendas?
            </h3>
            <p className="text-xs text-slate-500">
              Entenda como os valores monetários são extraídos do Chatwoot sem nenhum dado fictício.
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
          <p>
            O Chatwoot não possui um carrinho de compras nativo. Por isso, o ChatAnalytics captura o valor da venda diretamente dos <strong>Atributos Personalizados (*Custom Attributes*)</strong> da conversa ou do contato no Chatwoot.
          </p>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs space-y-2">
            <span className="font-bold text-slate-800 block text-xs">
              Chaves reconhecidas automaticamente pelo ChatAnalytics:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
              <div className="p-2 rounded bg-slate-50 border border-slate-200 text-center font-bold text-[#00375a]">
                valor
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200 text-center font-bold text-[#00375a]">
                deal_value
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200 text-center font-bold text-[#00375a]">
                receita
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200 text-center font-bold text-[#00375a]">
                valor_venda
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Também são aceitas: <span className="font-mono">value</span>, <span className="font-mono">amount</span> e <span className="font-mono">preco</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                Como configurar no seu Chatwoot:
              </span>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                <li>No Chatwoot, vá em <strong>Configurações &gt; Atributos Personalizados</strong>.</li>
                <li>Clique em <strong>Adicionar Atributo</strong>.</li>
                <li>Selecione Tipo: <strong>Conversa</strong>.</li>
                <li>Nome: <strong>Valor da Venda</strong> | Chave: <strong className="font-mono">valor</strong> ou <strong className="font-mono">deal_value</strong>.</li>
                <li>Tipo de dado: <strong>Número</strong> ou <strong>Moeda</strong>.</li>
              </ol>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
                Regras de Integridade Financeira:
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                <li><strong>Sem dados inventados:</strong> Se a conversa convertida não tiver o atributo preenchido no Chatwoot, a receita é calculada estritamente como <strong>R$ 0,00</strong>.</li>
                <li><strong>Edição Manual no ChatAnalytics:</strong> Você pode clicar em qualquer lead na tabela e preencher ou ajustar o valor da venda a qualquer momento.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Manual Sync & Connection Status */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-[#002139] flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[#1A94C5]" />
            Sincronização Manual & Base de Dados
          </h3>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
            config?.connected 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${config?.connected ? 'bg-emerald-600' : 'bg-amber-500'}`}></span>
            {config?.connected ? 'Conexão Ativa' : 'Desconectado'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-slate-400 block text-[11px]">Última Sincronização:</span>
            <span className="font-bold text-[#002139] text-sm mt-0.5 block">
              {config?.last_sync_at 
                ? new Date(config.last_sync_at).toLocaleString('pt-BR', { timeZone: 'America/Belem' })
                : 'Nenhuma sincronização executada'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-slate-400 block text-[11px]">Total de Leads no Banco:</span>
            <span className="font-bold text-[#002139] text-sm mt-0.5 block">
              {(config?.last_sync_count ?? 0).toLocaleString('pt-BR')} registros únicos
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-xs text-slate-500 max-w-md">
            Consulta imediata de todas as páginas da API do Chatwoot buscando conversas com <span className="font-mono text-[#00375a] font-bold">trafego_pago</span> e <span className="font-mono text-emerald-700 font-bold">Ganhamos</span>.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onManualSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00375a] hover:bg-[#002139] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#c1ef6d] ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Manualmente Agora'}</span>
            </button>
            <button
              type="button"
              onClick={onClearDb}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Dados</span>
            </button>
          </div>
        </div>
      </section>

      {/* Webhook Configuration for Continuous Real-Time Updates */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#002139] flex items-center gap-2 border-b border-slate-100 pb-3">
          <Radio className="w-4 h-4 text-[#1A94C5]" />
          Webhook para Sincronização em Tempo Real (Opcional)
        </h3>

        <p className="text-xs text-slate-600">
          Além do sincronismo automático periódico, você pode cadastrar o webhook abaixo no Chatwoot para registrar leads e conversões instantaneamente no exato segundo em que uma conversa for criada ou etiquetada.
        </p>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            URL do Webhook do ChatAnalytics
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={config?.webhook_url || 'https://seu-dominio.run.app/api/chatwoot/webhook'}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
            />
            <button
              type="button"
              onClick={handleCopyWebhook}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs"
            >
              {copiedWebhook ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copiedWebhook ? 'Copiado!' : 'Copiar URL'}</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-xs text-slate-600 space-y-1.5">
          <span className="font-bold text-slate-800 block">Como configurar no Chatwoot:</span>
          <ol className="list-decimal list-inside space-y-1 text-slate-600">
            <li>Acesse o Chatwoot e vá em <span className="font-semibold">Configurações &gt; Integrações &gt; Webhooks</span>.</li>
            <li>Clique em <span className="font-semibold">Adicionar novo webhook</span> e cole a URL acima.</li>
            <li>Selecione os eventos: <span className="font-mono font-semibold">Conversation Created</span> e <span className="font-mono font-semibold">Conversation Updated</span>.</li>
            <li>Clique em Criar.</li>
          </ol>
        </div>
      </section>

      {/* Rules Constitution Card */}
      <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
        <h3 className="text-sm font-bold text-[#002139] flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-700" />
          Regras de Negócio e Consistência Implementadas
        </h3>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
          <li><strong>Lead de Tráfego Pago:</strong> Controlado exclusivamente pela etiqueta <span className="font-mono font-bold text-[#00375a]">trafego_pago</span>.</li>
          <li><strong>Conversão em Venda:</strong> Controlado pela combinação de <span className="font-mono font-bold text-[#00375a]">trafego_pago</span> + <span className="font-mono font-bold text-emerald-700">Ganhamos</span>.</li>
          <li><strong>Chave Única Idempotente:</strong> <span className="font-mono font-bold">account_id + conversation_id</span> garante contagem única mesmo com novas mensagens ou sincronizações repetidas.</li>
          <li><strong>Fuso Horário Estrito:</strong> Todos os períodos são calculados em <span className="font-mono font-bold text-slate-800">America/Belem</span> (UTC-3), com a semana de Segunda a Domingo.</li>
          <li><strong>Receita Real:</strong> Obtida de atributos personalizados (<span className="font-mono">valor</span>, <span className="font-mono">deal_value</span>) ou informada pelo usuário, sem dados inventados.</li>
        </ul>
      </section>
    </div>
  );
};
