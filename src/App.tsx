import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavTab } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { LeadsView } from './components/LeadsView.tsx';
import { ConversionsView } from './components/ConversionsView.tsx';
import { InvestmentsView } from './components/InvestmentsView.tsx';
import { ChannelsView } from './components/ChannelsView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { UsersView } from './components/UsersView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { LoginView } from './components/LoginView.tsx';
import { LeadDetailModal } from './components/LeadDetailModal.tsx';
import { NewLeadModal } from './components/NewLeadModal.tsx';
import { 
  ChatwootConfig, 
  AnalyticsSummary, 
  LeadRecord, 
  PeriodFilter,
  AppUser 
} from './types.ts';
import { auth, db } from './lib/firebase.ts';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [period, setPeriod] = useState<PeriodFilter>('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Data states
  const [config, setConfig] = useState<ChatwootConfig | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter states
  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // UI state
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeLeadModal, setActiveLeadModal] = useState<LeadRecord | null>(null);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Authentication state
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setCurrentUser(userDoc.data() as AppUser);
          } else {
            const fallback: AppUser = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Administrador',
              email: firebaseUser.email || '',
              role: 'admin',
              status: 'active',
              createdAt: new Date().toISOString()
            };
            setCurrentUser(fallback);
          }
        } catch (err) {
          console.warn('Error fetching user profile:', err);
          setCurrentUser({
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Administrador',
            email: firebaseUser.email || '',
            role: 'admin',
            status: 'active',
            createdAt: new Date().toISOString()
          });
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      showToast('info', 'Sessão encerrada com sucesso.');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // 1. Fetch Config
  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {
      console.error('Error loading config:', e);
    }
  }, []);

  // 2. Fetch Stats
  const loadStats = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        period,
        ...(customStartDate ? { startDate: customStartDate } : {}),
        ...(customEndDate ? { endDate: customEndDate } : {}),
        ...(selectedChannel ? { channel: selectedChannel } : {}),
        ...(selectedStatus && selectedStatus !== 'all' ? { status: selectedStatus } : {}),
        ...(searchQuery ? { search: searchQuery } : {})
      });
      const res = await fetch(`/api/stats?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (e) {
      console.error('Error loading stats:', e);
    }
  }, [period, customStartDate, customEndDate, selectedChannel, selectedStatus, searchQuery]);

  // 3. Fetch Leads
  const loadLeads = useCallback(async (page: number = currentPage) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        period,
        ...(customStartDate ? { startDate: customStartDate } : {}),
        ...(customEndDate ? { endDate: customEndDate } : {}),
        ...(selectedChannel ? { channel: selectedChannel } : {}),
        ...(selectedStatus && selectedStatus !== 'all' ? { status: selectedStatus } : {}),
        ...(searchQuery ? { search: searchQuery } : {})
      });
      const res = await fetch(`/api/leads?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setLeads(json.data || []);
        setTotalLeads(json.pagination?.total || 0);
        setTotalPages(json.pagination?.total_pages || 1);
        setCurrentPage(json.pagination?.page || 1);
      }
    } catch (e) {
      console.error('Error loading leads:', e);
    }
  }, [period, customStartDate, customEndDate, selectedChannel, selectedStatus, searchQuery, currentPage]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    loadStats();
    loadLeads(1);
  }, [loadStats, loadLeads]);

  // Handlers
  const handlePeriodChange = (newPeriod: PeriodFilter, start?: string, end?: string) => {
    setPeriod(newPeriod);
    if (start && end) {
      setCustomStartDate(start);
      setCustomEndDate(end);
    } else {
      setCustomStartDate('');
      setCustomEndDate('');
    }
    setCurrentPage(1);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        showToast('success', json.message || 'Sincronização concluída com sucesso!');
        await loadConfig();
        await loadStats();
        await loadLeads(1);
      } else {
        showToast('error', json.message || 'Erro durante a sincronização.');
      }
    } catch (error: any) {
      showToast('error', `Falha ao sincronizar: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportCsv = () => {
    window.location.href = '/api/export/csv';
    showToast('info', 'Download da planilha CSV de leads iniciado.');
  };

  const handleSaveConfig = async (url: string, accountId: string, token: string) => {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatwoot_url: url, account_id: accountId, api_token: token })
    });
    const json = await res.json();
    if (json.success) {
      showToast('success', 'Configurações do Chatwoot salvas com sucesso.');
      loadConfig();
    } else {
      showToast('error', json.error || 'Erro ao salvar configurações.');
    }
    return json;
  };

  const handleTestConnection = async (url: string, accountId: string, token: string) => {
    const res = await fetch('/api/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatwoot_url: url, account_id: accountId, api_token: token })
    });
    const json = await res.json();
    if (json.success) {
      loadConfig();
    }
    return json;
  };

  const handleUpdateAutoSync = async (enabled?: boolean, intervalMinutes?: number, triggerNow?: boolean) => {
    try {
      const res = await fetch('/api/config/auto-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          interval_minutes: intervalMinutes,
          trigger_now: triggerNow
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', json.message || 'Configuração atualizada.');
        await loadConfig();
        if (triggerNow) {
          await loadStats();
          await loadLeads(1);
        }
      } else {
        showToast('error', json.message || 'Falha ao atualizar sincronismo automático.');
      }
      return json;
    } catch (e: any) {
      showToast('error', `Erro ao atualizar sincronismo: ${e.message}`);
    }
  };

  const handleClearDb = async () => {
    const res = await fetch('/api/clear', { method: 'POST' });
    const json = await res.json();
    showToast('info', json.message || 'Base de dados limpa.');
    await loadConfig();
    await loadStats();
    await loadLeads(1);
  };

  const handleBackupRestored = async (message: string) => {
    showToast('success', message || 'Backup restaurado com sucesso!');
    await loadConfig();
    await loadStats();
    await loadLeads(1);
  };

  const handleCreateLead = async (data: any) => {
    const res = await fetch('/api/leads/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (json.success) {
      showToast('success', `Lead "${data.contact_name}" registrado com sucesso no pipeline de tráfego pago.`);
      await loadStats();
      await loadLeads(1);
    } else {
      showToast('error', json.error || 'Erro ao cadastrar lead.');
    }
  };

  const handleToggleConverted = async (lead: LeadRecord) => {
    try {
      const res = await fetch(`/api/leads/${lead.id}/toggle-conversion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const json = await res.json();
      if (json.success && json.lead) {
        const isNowConverted = json.lead.is_converted;
        showToast('success', isNowConverted 
          ? `Lead "${lead.contact_name}" marcado como Ganhamos!` 
          : `Etiqueta Ganhamos desmarcada de "${lead.contact_name}". Conversão atualizada.`);
        
        if (activeLeadModal && activeLeadModal.id === lead.id) {
          setActiveLeadModal(json.lead);
        }
        await loadStats();
        await loadLeads(currentPage);
      } else {
        showToast('error', json.error || 'Erro ao atualizar status de conversão.');
      }
    } catch (e: any) {
      showToast('error', `Falha ao alternar conversão: ${e.message}`);
    }
  };

  const handleUpdateLeadValue = async (lead: LeadRecord, newValue: number) => {
    try {
      const res = await fetch(`/api/leads/${lead.id}/value`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: newValue })
      });
      const json = await res.json();
      if (json.success && json.lead) {
        showToast('success', `Valor da venda de "${lead.contact_name}" atualizado para R$ ${newValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`);
        if (activeLeadModal && activeLeadModal.id === lead.id) {
          setActiveLeadModal(json.lead);
        }
        await loadStats();
        await loadLeads(currentPage);
      } else {
        showToast('error', json.error || 'Erro ao atualizar valor da venda.');
      }
    } catch (e: any) {
      showToast('error', `Falha ao salvar valor: ${e.message}`);
    }
  };

  const handleUpdateAdSpend = async (amount: number) => {
    try {
      const res = await fetch('/api/config/ad-spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ad_spend: amount })
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', json.message || 'Investimento em tráfego atualizado!');
        await loadConfig();
        await loadStats();
      } else {
        showToast('error', json.error || 'Erro ao salvar investimento.');
      }
    } catch (e: any) {
      showToast('error', `Falha ao salvar investimento: ${e.message}`);
    }
  };

  const handleSimulateWebhook = async () => {
    const randomNames = ['Bruna Takahashi', 'Marcos Vinicius Paiva', 'Larissa Figueiredo', 'Renato Albuquerque'];
    const randomChannels: ('WhatsApp' | 'Instagram' | 'Facebook' | 'Webchat')[] = ['WhatsApp', 'Instagram', 'Facebook', 'Webchat'];
    const chosenName = randomNames[Math.floor(Math.random() * randomNames.length)];
    const chosenChannel = randomChannels[Math.floor(Math.random() * randomChannels.length)];

    await handleCreateLead({
      contact_name: chosenName,
      contact_phone: `(11) 9${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}`,
      contact_email: `${chosenName.toLowerCase().replace(/ /g, '.')}@empresa.com.br`,
      channel: chosenChannel,
      channel_detail: `${chosenChannel} Direct Ads`,
      is_converted: false
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#002139] flex flex-col items-center justify-center text-white p-4">
        <div className="w-9 h-9 border-3 border-white/20 border-t-[#c1ef6d] rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">ChatAnalytics</p>
        <p className="text-xs text-slate-400 mt-1">Carregando credenciais seguras...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onSuccess={user => setCurrentUser(user)} />;
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fc] text-slate-900 font-sans antialiased selection:bg-[#c1ef6d] selection:text-[#002139]">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl bg-white border border-slate-200 text-xs font-semibold animate-in slide-in-from-top-3 duration-200">
          {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
          {notification.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
          {notification.type === 'info' && <Info className="w-4 h-4 text-[#1A94C5] shrink-0" />}
          <span className="text-slate-800">{notification.message}</span>
          <button 
            onClick={() => setNotification(null)}
            className="ml-2 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sidebar (Fixed Navigation Spine) */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={tab => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        config={config}
        totalLeadsCount={summary?.leads_this_month ?? totalLeads ?? 0}
        onExportCsv={handleExportCsv}
        onQuickSync={handleManualSync}
        isSyncing={isSyncing}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Workspace Canvas */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          period={period}
          onPeriodChange={handlePeriodChange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onSync={handleManualSync}
          isSyncing={isSyncing}
          onExportCsv={handleExportCsv}
          onOpenNewLeadModal={() => setIsNewLeadModalOpen(true)}
          lastSyncAt={config?.last_sync_at}
          onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        />

        {/* View Switcher */}
        <main className="flex-1 pb-16">
          {currentTab === 'dashboard' && (
            <DashboardView
              summary={summary}
              recentLeads={leads}
              onNavigateToLeads={() => setCurrentTab('leads')}
              onOpenLeadDetails={lead => setActiveLeadModal(lead)}
              onUpdateAdSpend={handleUpdateAdSpend}
              onNavigateToInvestments={() => setCurrentTab('investments')}
            />
          )}

          {currentTab === 'leads' && (
            <LeadsView
              leads={leads}
              summary={summary}
              totalLeads={totalLeads}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={page => {
                setCurrentPage(page);
                loadLeads(page);
              }}
              selectedChannel={selectedChannel}
              onChannelChange={ch => {
                setSelectedChannel(ch);
                setCurrentPage(1);
              }}
              selectedStatus={selectedStatus}
              onStatusChange={st => {
                setSelectedStatus(st);
                setCurrentPage(1);
              }}
              searchQuery={searchQuery}
              onSearchChange={q => {
                setSearchQuery(q);
                setCurrentPage(1);
              }}
              onOpenDetails={lead => setActiveLeadModal(lead)}
              onQuickToggleConverted={handleToggleConverted}
            />
          )}

          {currentTab === 'conversions' && (
            <ConversionsView
              summary={summary}
              convertedLeads={leads.filter(l => l.is_converted)}
              onOpenLeadDetails={lead => setActiveLeadModal(lead)}
            />
          )}

          {currentTab === 'investments' && (
            <InvestmentsView
              summary={summary}
              onRefreshStats={loadStats}
              showToast={showToast}
            />
          )}

          {currentTab === 'channels' && (
            <ChannelsView
              summary={summary}
              onFilterByChannel={ch => {
                setSelectedChannel(ch);
                setCurrentTab('leads');
              }}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              summary={summary}
              period={period}
              onExportCsv={handleExportCsv}
            />
          )}

          {currentTab === 'users' && (
            <UsersView
              currentUser={currentUser}
              showToast={showToast}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              config={config}
              onSaveConfig={handleSaveConfig}
              onTestConnection={handleTestConnection}
              onManualSync={handleManualSync}
              isSyncing={isSyncing}
              onClearDb={handleClearDb}
              onUpdateAutoSync={handleUpdateAutoSync}
              onUpdateAdSpend={handleUpdateAdSpend}
              onBackupRestored={handleBackupRestored}
            />
          )}
        </main>
      </div>

      {/* Modals & Drawers */}
      <LeadDetailModal
        lead={activeLeadModal}
        onClose={() => setActiveLeadModal(null)}
        onToggleConverted={handleToggleConverted}
        onUpdateValue={handleUpdateLeadValue}
      />

      <NewLeadModal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        onSubmit={handleCreateLead}
      />
    </div>
  );
}
