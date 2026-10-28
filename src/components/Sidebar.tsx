import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  Radio, 
  FileText, 
  Settings, 
  Download, 
  RefreshCw,
  Wallet,
  UserCheck,
  LogOut,
  X
} from 'lucide-react';
import { ChatwootConfig, AppUser } from '../types.ts';

export type NavTab = 'dashboard' | 'leads' | 'conversions' | 'investments' | 'channels' | 'reports' | 'users' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  config: ChatwootConfig | null;
  totalLeadsCount: number;
  onExportCsv: () => void;
  onQuickSync: () => void;
  isSyncing: boolean;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  currentUser?: AppUser | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  config,
  totalLeadsCount,
  onExportCsv,
  onQuickSync,
  isSyncing,
  isOpenMobile,
  onCloseMobile,
  currentUser,
  onLogout
}) => {
  const formatSyncTime = (dateStr?: string | null) => {
    if (!dateStr) return 'Nunca';
    const diffMin = Math.round((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diffMin <= 1) return 'há poucos segundos';
    if (diffMin < 60) return `há ${diffMin} min`;
    const hours = Math.floor(diffMin / 60);
    return `há ${hours}h`;
  };

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: <LayoutDashboard className="w-5 h-5" /> 
    },
    { 
      id: 'leads', 
      label: 'Leads', 
      icon: <Users className="w-5 h-5" />,
      badge: totalLeadsCount > 1000 ? `${(totalLeadsCount / 1000).toFixed(1)}k` : String(totalLeadsCount)
    },
    { 
      id: 'conversions', 
      label: 'Conversões', 
      icon: <TrendingUp className="w-5 h-5" /> 
    },
    { 
      id: 'investments', 
      label: 'Investimento', 
      icon: <Wallet className="w-5 h-5" /> 
    },
    { 
      id: 'channels', 
      label: 'Canais de Entrada', 
      icon: <Radio className="w-5 h-5" /> 
    },
    { 
      id: 'reports', 
      label: 'Relatórios', 
      icon: <FileText className="w-5 h-5" /> 
    },
    { 
      id: 'users', 
      label: 'Usuários', 
      icon: <UserCheck className="w-5 h-5" /> 
    },
    { 
      id: 'settings', 
      label: 'Configurações', 
      icon: <Settings className="w-5 h-5" /> 
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`fixed left-0 top-0 h-full w-64 z-50 lg:z-40 flex flex-col justify-between p-4 bg-[#002139] border-r border-[#00375a] select-none text-slate-100 transition-transform duration-200 ease-in-out ${
        isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Top Brand & Navigation */}
        <div className="flex flex-col gap-6">
          {/* Brand Header */}
          <div className="px-2 pt-2 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#00375a] to-[#1A94C5] flex items-center justify-center font-bold text-white shadow-md border border-cyan-400/20">
                <TrendingUp className="w-5 h-5 text-[#c1ef6d]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
                  ChatAnalytics
                </span>
                <div className="flex items-center gap-1.5 -mt-0.5">
                  <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-400">
                    Enterprise BI
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#00375a] text-[#c1ef6d] border border-[#c1ef6d]/20">
                    PRO
                  </span>
                </div>
              </div>
            </div>

            {/* Close Button on Mobile */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <nav aria-label="Navegação Principal" className="flex flex-col gap-1.5">
            {navItems.map(item => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left group cursor-pointer ${
                    isActive
                      ? 'bg-[#00375a] text-white border-l-4 border-[#c1ef6d] shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-[#00375a]/40'
                  }`}
                >
                  <span className={`${isActive ? 'text-[#c1ef6d]' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    {item.icon}
                  </span>
                  <span className="flex-1 whitespace-nowrap">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isActive 
                        ? 'bg-[#c1ef6d]/20 text-[#c1ef6d]' 
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

      {/* Bottom Section: Chatwoot Status & CTA */}
      <div className="flex flex-col gap-3 pt-4 border-t border-[#00375a]/70">
        {/* Sync Status Widget */}
        <div className="bg-[#00375a]/80 rounded-xl p-3 flex flex-col gap-2 border border-[#004c7a]/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                {config?.connected ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c1ef6d] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#c1ef6d]"></span>
                  </>
                ) : (
                  <span className="inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
                )}
              </span>
              <span className="text-xs font-semibold text-slate-200">
                {config?.connected ? 'Chatwoot Conectado' : 'Conexão Pendente'}
              </span>
            </div>
            <button
              onClick={onQuickSync}
              disabled={isSyncing}
              title="Sincronizar agora"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#c1ef6d]' : ''}`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Último sync:</span>
            <span className="text-slate-300 font-medium">{formatSyncTime(config?.last_sync_at)}</span>
          </div>

          <div className="text-[10px] text-cyan-300/80 bg-[#002946] px-2 py-1 rounded flex items-center justify-between">
            <span>Etiqueta:</span>
            <span className="font-mono text-[#c1ef6d] font-bold">trafego_pago</span>
          </div>
        </div>

        {/* Export Data Button */}
        <button
          onClick={onExportCsv}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all border border-white/10 active:scale-[0.98] cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#c1ef6d]" />
          <span>Exportar Dados</span>
        </button>

        {/* Current Logged User Profile & Logout */}
        {currentUser && (
          <div className="pt-2 border-t border-[#00375a]/70 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#1A94C5] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {(currentUser.name || currentUser.email || 'U').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate" title={currentUser.name}>
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-300 truncate" title={currentUser.email}>
                  {currentUser.email}
                </p>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                title="Sair do sistema"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
    </>
  );
};
