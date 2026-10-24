export interface ChatwootConfig {
  chatwoot_url: string;
  account_id: string;
  api_token: string;
  connected: boolean;
  last_sync_at: string | null;
  last_sync_count: number;
  last_sync_status: 'idle' | 'success' | 'error' | 'syncing';
  last_error_message?: string;
  inboxes: ChatwootInbox[];
  auto_sync_enabled: boolean;
  auto_sync_interval_minutes: number;
  last_auto_sync_at?: string | null;
  last_auto_sync_result?: {
    paid_leads_found: number;
    ganhamos_found: number;
    conversions_updated: number;
    message: string;
  };
  ad_spend?: number; // Total amount invested in paid traffic (in BRL)
}

export interface ChatwootInbox {
  id: number;
  name: string;
  channel_type: string;
  phone_number?: string;
}

export interface LeadRecord {
  id: string; // key: `${account_id}_${conversation_id}`
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
  channel_detail: string; // e.g. "WhatsApp Ads", "Instagram Direct", "Facebook Leads", "Webchat Site"
  campaign?: string; // e.g. "Google Ads • [Search_Enterprise]"
  tags: string[];
  is_lead: boolean; // has 'trafego_pago'
  is_converted: boolean; // has 'trafego_pago' AND 'Ganhamos'
  entry_date: string; // ISO string in UTC, interpreted in America/Belem
  first_identified_at: string;
  conversion_date?: string; // ISO string when 'Ganhamos' was applied or observed
  value?: number; // monetary value in BRL (e.g. 3490.00)
  status: 'lead' | 'converted' | 'not_converted';
  has_confirmed_timestamp: boolean; // flag if date was confirmed or first observed
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

export interface AnalyticsFilter {
  period: PeriodFilter;
  startDate?: string;
  endDate?: string;
  channel?: string;
  inboxId?: number;
  status?: 'all' | 'lead' | 'converted' | 'not_converted';
  search?: string;
}

export interface ChannelPerformance {
  channel: string;
  channel_detail?: string;
  inbox_id?: number;
  leads_received: number;
  leads_converted: number;
  not_converted: number;
  conversion_rate: number; // percentage
  share_percentage: number; // percentage of total
  total_revenue: number;
  average_ticket: number;
}

export interface DailyTimeSeriesPoint {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "28 Fev"
  leads_received: number;
  leads_converted: number;
  conversion_rate: number;
}

export interface CohortPoint {
  cohort_label: string; // e.g. "Semana 05"
  leads_received: number;
  leads_converted: number;
  conversion_rate: number;
}

export interface MonthlyTrendPoint {
  month: string; // e.g. "Janeiro", "Fevereiro", "Março"
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
  // Top KPIs
  leads_today: number;
  leads_yesterday: number;
  leads_this_week: number;
  leads_last_7_days: number;
  leads_this_month: number;
  leads_last_month: number;
  leads_this_year: number;
  leads_total_historical: number;
  
  // Converted in current filter cohort
  filtered_leads_total: number;
  filtered_leads_converted: number;
  filtered_leads_in_progress: number;
  filtered_leads_not_converted: number;
  filtered_conversion_rate: number;
  
  // Dedicated indicator for sales closed in the period (independent of entry date)
  sales_closed_in_period: number;
  sales_revenue_in_period: number;
  
  // Growth indicators vs previous periods
  growth_today_vs_yesterday: number;
  growth_month_vs_last_month: number;
  growth_week_vs_last_week: number;
  growth_conversion_rate: number;

  // Chart datasets
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

  // SLA & Insights
  avg_first_response_time: string;
  top_converting_channel: { name: string; rate: number };
  total_revenue_period: number;
}
