export interface ChatwootConfig {
  chatwoot_url: string;
  account_id: string;
  api_token: string;
  has_token: boolean;
  connected: boolean;
  last_sync_at: string | null;
  last_sync_count: number;
  last_sync_status: 'idle' | 'success' | 'error' | 'syncing';
  last_error_message?: string;
  inboxes: {
    id: number;
    name: string;
    channel_type: string;
    phone_number?: string;
  }[];
  webhook_url?: string;
  auto_sync_enabled: boolean;
  auto_sync_interval_minutes: number;
  last_auto_sync_at?: string | null;
  last_auto_sync_result?: {
    paid_leads_found: number;
    ganhamos_found: number;
    conversions_updated: number;
    message: string;
  };
  ad_spend?: number;
}

export interface LeadRecord {
  id: string;
  account_id: string;
  conversation_id: number;
  contact_id?: number;
  contact_name: string;
  contact_email?: string;
  contact_phone?: string;
  contact_avatar?: string;
  inbox_id: number;
  inbox_name: string;
  channel: 'WhatsApp' | 'Instagram' | 'Facebook' | 'Webchat' | 'Outros';
  channel_detail: string;
  campaign?: string;
  tags: string[];
  is_lead: boolean;
  is_converted: boolean;
  entry_date: string;
  first_identified_at: string;
  conversion_date?: string;
  value?: number;
  status: 'lead' | 'converted' | 'not_converted';
  has_confirmed_timestamp: boolean;
  chatwoot_url?: string;
}

export interface InvestmentRecord {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number; // in BRL
  channel?: string; // e.g. "Meta Ads", "Google Ads", "TikTok Ads", "Geral"
  notes?: string;
  created_at: string;
}

export type PeriodFilter = 
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'all'
  | 'custom';

export interface ChannelPerformance {
  channel: string;
  channel_detail?: string;
  inbox_id?: number;
  leads_received: number;
  leads_converted: number;
  not_converted: number;
  conversion_rate: number;
  share_percentage: number;
  total_revenue: number;
  average_ticket: number;
}

export interface DailyTimeSeriesPoint {
  date: string;
  label: string;
  leads_received: number;
  leads_converted: number;
  conversion_rate: number;
}

export interface CohortPoint {
  cohort_label: string;
  leads_received: number;
  leads_converted: number;
  conversion_rate: number;
}

export interface MonthlyTrendPoint {
  month: string;
  conversion_rate: number;
  leads_count: number;
  conversions_count: number;
  note?: string;
}

export interface MonthlyPerformancePoint {
  month_key: string; // e.g. "2026-03"
  month_label: string; // e.g. "Mar 2026"
  ad_spend: number;
  leads_count: number;
  conversions_count: number;
  revenue: number;
  cpl: number;
  cac: number;
  roas: number;
  conversion_rate: number;
}

export interface AnalyticsSummary {
  leads_today: number;
  leads_yesterday: number;
  leads_this_week: number;
  leads_last_7_days: number;
  leads_this_month: number;
  leads_last_month: number;
  leads_this_year: number;
  leads_total_historical: number;
  
  filtered_leads_total: number;
  filtered_leads_converted: number;
  filtered_leads_in_progress: number;
  filtered_leads_not_converted: number;
  filtered_conversion_rate: number;
  
  sales_closed_in_period: number;
  sales_revenue_in_period: number;
  
  growth_today_vs_yesterday: number;
  growth_month_vs_last_month: number;
  growth_week_vs_last_week: number;
  growth_conversion_rate: number;

  daily_series: DailyTimeSeriesPoint[];
  weekly_cohorts: CohortPoint[];
  channel_distribution: ChannelPerformance[];
  monthly_trends: MonthlyTrendPoint[];
  monthly_performance: MonthlyPerformancePoint[];

  // Traffic Investment & CAC / CPL Metrics
  ad_spend: number;
  cost_per_lead: number;
  cac: number;
  roas: number;
  total_invested_all_time: number;
  total_invested_period: number;

  avg_first_response_time: string;
  top_converting_channel: { name: string; rate: number };
  total_revenue_period: number;
}
