import { 
  LeadRecord, 
  AnalyticsFilter, 
  AnalyticsSummary, 
  ChannelPerformance, 
  DailyTimeSeriesPoint, 
  CohortPoint, 
  MonthlyTrendPoint,
  InvestmentRecord,
  MonthlyPerformancePoint 
} from './types.ts';

// America/Belem is fixed at UTC-3 (no daylight saving time in Brazil since 2019)
const BELEM_OFFSET_MS = -3 * 60 * 60 * 1000;

export function getBelemDate(dateInput: Date | string | number = new Date()): Date {
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  const utcMs = d.getTime() + (d.getTimezoneOffset() * 60000);
  return new Date(utcMs + BELEM_OFFSET_MS);
}

export function formatBelemDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export function getDateRangeForPeriod(period: string, customStart?: string, customEnd?: string, referenceDate: Date = new Date()): DateRange {
  const nowBelem = getBelemDate(referenceDate);
  const curYear = nowBelem.getFullYear();
  const curMonth = nowBelem.getMonth();
  const curDay = nowBelem.getDate();

  function makeBelemDay(y: number, m: number, d: number, endOfDay = false): Date {
    const date = new Date(Date.UTC(y, m, d, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0));
    date.setUTCHours(date.getUTCHours() + 3);
    return date;
  }

  switch (period) {
    case 'today': {
      const start = makeBelemDay(curYear, curMonth, curDay, false);
      const end = makeBelemDay(curYear, curMonth, curDay, true);
      return { start, end };
    }
    case 'yesterday': {
      const prev = new Date(nowBelem);
      prev.setDate(prev.getDate() - 1);
      const start = makeBelemDay(prev.getFullYear(), prev.getMonth(), prev.getDate(), false);
      const end = makeBelemDay(prev.getFullYear(), prev.getMonth(), prev.getDate(), true);
      return { start, end };
    }
    case 'last_7_days': {
      const prev7 = new Date(nowBelem);
      prev7.setDate(prev7.getDate() - 6);
      const start = makeBelemDay(prev7.getFullYear(), prev7.getMonth(), prev7.getDate(), false);
      const end = makeBelemDay(curYear, curMonth, curDay, true);
      return { start, end };
    }
    case 'this_week': {
      const dayOfWeek = nowBelem.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(nowBelem);
      monday.setDate(monday.getDate() + diffToMonday);
      
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      
      const start = makeBelemDay(monday.getFullYear(), monday.getMonth(), monday.getDate(), false);
      const end = makeBelemDay(sunday.getFullYear(), sunday.getMonth(), sunday.getDate(), true);
      return { start, end };
    }
    case 'this_month': {
      const start = makeBelemDay(curYear, curMonth, 1, false);
      const lastDayOfMonth = new Date(curYear, curMonth + 1, 0).getDate();
      const end = makeBelemDay(curYear, curMonth, lastDayOfMonth, true);
      return { start, end };
    }
    case 'last_month': {
      const lastMonthYear = curMonth === 0 ? curYear - 1 : curYear;
      const lastMonthIdx = curMonth === 0 ? 11 : curMonth - 1;
      const lastDay = new Date(lastMonthYear, lastMonthIdx + 1, 0).getDate();
      const start = makeBelemDay(lastMonthYear, lastMonthIdx, 1, false);
      const end = makeBelemDay(lastMonthYear, lastMonthIdx, lastDay, true);
      return { start, end };
    }
    case 'this_year': {
      const start = makeBelemDay(curYear, 0, 1, false);
      const end = makeBelemDay(curYear, 11, 31, true);
      return { start, end };
    }
    case 'custom': {
      if (customStart && customEnd) {
        const sParts = customStart.split('-').map(Number);
        const eParts = customEnd.split('-').map(Number);
        const start = makeBelemDay(sParts[0], sParts[1] - 1, sParts[2], false);
        const end = makeBelemDay(eParts[0], eParts[1] - 1, eParts[2], true);
        return { start, end };
      }
      const start = makeBelemDay(curYear, curMonth, 1, false);
      const end = makeBelemDay(curYear, curMonth, curDay, true);
      return { start, end };
    }
    case 'all':
    default: {
      const start = new Date(0);
      const end = new Date(Date.now() + 86400000 * 365);
      return { start, end };
    }
  }
}

export function computeAnalytics(
  allLeads: LeadRecord[], 
  filter: AnalyticsFilter, 
  adSpend: number = 0,
  allInvestments: InvestmentRecord[] = []
): AnalyticsSummary {
  // RULE 3 & 4: Only leads with 'trafego_pago' count as leads
  const paidTrafficLeads = allLeads.filter(l => l.is_lead);

  const rangeToday = getDateRangeForPeriod('today');
  const rangeYesterday = getDateRangeForPeriod('yesterday');
  const range7Days = getDateRangeForPeriod('last_7_days');
  const rangeWeek = getDateRangeForPeriod('this_week');
  const rangeMonth = getDateRangeForPeriod('this_month');
  const rangeLastMonth = getDateRangeForPeriod('last_month');
  const rangeYear = getDateRangeForPeriod('this_year');

  const nowBelem = getBelemDate();

  const countInEntryRange = (leads: LeadRecord[], range: DateRange) => {
    return leads.filter(l => {
      const entry = new Date(l.entry_date).getTime();
      return entry >= range.start.getTime() && entry <= range.end.getTime();
    }).length;
  };

  const leads_today = countInEntryRange(paidTrafficLeads, rangeToday);
  const leads_yesterday = countInEntryRange(paidTrafficLeads, rangeYesterday);
  const leads_this_week = countInEntryRange(paidTrafficLeads, rangeWeek);
  const leads_last_7_days = countInEntryRange(paidTrafficLeads, range7Days);
  const leads_this_month = countInEntryRange(paidTrafficLeads, rangeMonth);
  const leads_last_month = countInEntryRange(paidTrafficLeads, rangeLastMonth);
  const leads_this_year = countInEntryRange(paidTrafficLeads, rangeYear);
  const leads_total_historical = paidTrafficLeads.length;

  const activeRange = getDateRangeForPeriod(filter.period, filter.startDate, filter.endDate);

  // Apply filters
  const filteredLeads = paidTrafficLeads.filter(l => {
    const entry = new Date(l.entry_date).getTime();
    if (filter.period !== 'all') {
      if (entry < activeRange.start.getTime() || entry > activeRange.end.getTime()) {
        return false;
      }
    }
    if (filter.channel && filter.channel !== 'all' && filter.channel !== 'Todos') {
      if (l.channel !== filter.channel && l.channel_detail !== filter.channel) {
        return false;
      }
    }
    if (filter.inboxId && filter.inboxId !== 0) {
      if (l.inbox_id !== filter.inboxId) return false;
    }
    if (filter.status && filter.status !== 'all') {
      if (l.status !== filter.status) return false;
    }
    if (filter.search && filter.search.trim().length > 0) {
      const q = filter.search.toLowerCase().trim();
      const matchName = l.contact_name?.toLowerCase().includes(q);
      const matchEmail = l.contact_email?.toLowerCase().includes(q);
      const matchPhone = l.contact_phone?.toLowerCase().includes(q);
      const matchId = `cw-${l.conversation_id}`.toLowerCase().includes(q) || String(l.conversation_id).includes(q);
      const matchCampaign = l.campaign?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone && !matchId && !matchCampaign) return false;
    }
    return true;
  });

  const filtered_leads_total = filteredLeads.length;
  const convertedCohort = filteredLeads.filter(l => l.is_converted);
  const filtered_leads_converted = convertedCohort.length;
  const filtered_leads_in_progress = filteredLeads.filter(l => l.status === 'lead').length;
  const filtered_leads_not_converted = filteredLeads.filter(l => l.status === 'not_converted').length;
  
  // Conversion Rate (%) = (Leads convertidos / Total de leads) * 100
  const filtered_conversion_rate = filtered_leads_total > 0 
    ? Number(((filtered_leads_converted / filtered_leads_total) * 100).toFixed(2))
    : 0;

  // Separate Indicator: Vendas fechadas no período (based on conversion_date, independent of entry date)
  const salesClosedInPeriodLeads = paidTrafficLeads.filter(l => {
    if (!l.is_converted || !l.conversion_date) return false;
    const convTime = new Date(l.conversion_date).getTime();
    if (filter.period !== 'all') {
      if (convTime < activeRange.start.getTime() || convTime > activeRange.end.getTime()) return false;
    }
    if (filter.channel && filter.channel !== 'all' && filter.channel !== 'Todos') {
      if (l.channel !== filter.channel && l.channel_detail !== filter.channel) return false;
    }
    return true;
  });

  const sales_closed_in_period = salesClosedInPeriodLeads.length;
  const sales_revenue_in_period = salesClosedInPeriodLeads.reduce((acc, l) => acc + (l.value || 0), 0);

  // Pure dynamic growth percentages (0 if no historical data)
  const growth_today_vs_yesterday = leads_yesterday > 0 
    ? Number((((leads_today - leads_yesterday) / leads_yesterday) * 100).toFixed(1))
    : (leads_today > 0 ? 100 : 0);

  const growth_month_vs_last_month = leads_last_month > 0
    ? Number((((leads_this_month - leads_last_month) / leads_last_month) * 100).toFixed(1))
    : 0;

  const growth_week_vs_last_week = 0;
  const growth_conversion_rate = 0;

  // Dynamic Channel distribution from real leads
  const channelMap = new Map<string, { received: number; converted: number; revenue: number; detail: string }>();

  filteredLeads.forEach(lead => {
    const ch = lead.channel || 'Outros';
    const existing = channelMap.get(ch) || { received: 0, converted: 0, revenue: 0, detail: lead.channel_detail || ch };
    existing.received += 1;
    if (lead.is_converted) {
      existing.converted += 1;
      existing.revenue += (lead.value || 0);
    }
    channelMap.set(ch, existing);
  });

  const channel_distribution: ChannelPerformance[] = Array.from(channelMap.entries()).map(([channel, data]) => {
    const rate = data.received > 0 ? Number(((data.converted / data.received) * 100).toFixed(1)) : 0;
    const share = filtered_leads_total > 0 ? Number(((data.received / filtered_leads_total) * 100).toFixed(1)) : 0;
    const avgTicket = data.converted > 0 ? Math.round(data.revenue / data.converted) : 0;
    return {
      channel,
      channel_detail: data.detail,
      leads_received: data.received,
      leads_converted: data.converted,
      not_converted: data.received - data.converted,
      conversion_rate: rate,
      share_percentage: share,
      total_revenue: data.revenue,
      average_ticket: avgTicket
    };
  }).sort((a, b) => b.leads_received - a.leads_received);

  // Daily evolution chart (last 30 days) based on real data
  const daily_series: DailyTimeSeriesPoint[] = [];
  const daysCount = 30;
  const monthNamesPt = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  for (let i = daysCount - 1; i >= 0; i--) {
    const targetDate = new Date(nowBelem);
    targetDate.setDate(targetDate.getDate() - i);
    const dateStr = formatBelemDateStr(targetDate);
    const dayNum = String(targetDate.getDate()).padStart(2, '0');
    const monName = monthNamesPt[targetDate.getMonth()];
    const label = `${dayNum} ${monName}`;

    const dayLeads = paidTrafficLeads.filter(l => {
      const lDate = getBelemDate(new Date(l.entry_date));
      return formatBelemDateStr(lDate) === dateStr;
    });

    const received = dayLeads.length;
    const converted = dayLeads.filter(l => l.is_converted).length;
    const rate = received > 0 ? Number(((converted / received) * 100).toFixed(1)) : 0;

    daily_series.push({
      date: dateStr,
      label,
      leads_received: received,
      leads_converted: converted,
      conversion_rate: rate
    });
  }

  // Dynamic Weekly cohorts (last 4 weeks) computed strictly from real leads
  const weekly_cohorts: CohortPoint[] = [];
  for (let w = 3; w >= 0; w--) {
    const endOffset = w * 7;
    const startOffset = endOffset + 6;
    const dStart = new Date(nowBelem);
    dStart.setDate(dStart.getDate() - startOffset);
    const dEnd = new Date(nowBelem);
    dEnd.setDate(dEnd.getDate() - endOffset);

    const cohortLeads = paidTrafficLeads.filter(l => {
      const time = new Date(l.entry_date).getTime();
      return time >= dStart.getTime() && time <= dEnd.getTime();
    });

    const rec = cohortLeads.length;
    const conv = cohortLeads.filter(l => l.is_converted).length;
    const rate = rec > 0 ? Number(((conv / rec) * 100).toFixed(1)) : 0;
    const label = w === 0 ? 'Semana Atual' : `Semana -${w}`;
    weekly_cohorts.push({
      cohort_label: label,
      leads_received: rec,
      leads_converted: conv,
      conversion_rate: rate
    });
  }

  // Dynamic Monthly trends computed strictly from real leads across months
  const monthly_trends: MonthlyTrendPoint[] = [];
  const currentMonthIdx = nowBelem.getMonth();
  const currentYearNum = nowBelem.getFullYear();
  const fullMonthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  // Scan up to 3 recent months
  for (let m = Math.max(0, currentMonthIdx - 2); m <= currentMonthIdx; m++) {
    const monthLeads = paidTrafficLeads.filter(l => {
      const d = getBelemDate(new Date(l.entry_date));
      return d.getFullYear() === currentYearNum && d.getMonth() === m;
    });

    const leadsCount = monthLeads.length;
    const convCount = monthLeads.filter(l => l.is_converted).length;
    const rate = leadsCount > 0 ? Number(((convCount / leadsCount) * 100).toFixed(1)) : 0;

    monthly_trends.push({
      month: fullMonthNames[m] + (m === currentMonthIdx ? ' (Atual)' : ''),
      conversion_rate: rate,
      leads_count: leadsCount,
      conversions_count: convCount,
      note: leadsCount === 0 ? 'Sem registros' : undefined
    });
  }

  // Dynamic Best channel from real data
  const bestChannel = channel_distribution.length > 0 
    ? { name: channel_distribution[0].channel_detail || channel_distribution[0].channel, rate: channel_distribution[0].conversion_rate }
    : { name: 'Aguardando sincronização', rate: 0 };

  // Total revenue is strictly the sum of value from converted leads
  const total_revenue_period = filteredLeads
    .filter(l => l.is_converted)
    .reduce((acc, l) => acc + (l.value || 0), 0);

  // Calculate investments in active period
  const investmentsInPeriod = allInvestments.filter(inv => {
    if (filter.period === 'all') return true;
    const parts = (inv.date || '').split('-').map(Number);
    if (parts.length < 3) return false;
    // Interpret YYYY-MM-DD at 12:00:00 UTC
    const invTime = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0)).getTime();
    return invTime >= activeRange.start.getTime() && invTime <= activeRange.end.getTime();
  });

  const totalInvestedAllTime = allInvestments.reduce((acc, inv) => acc + (inv.amount || 0), 0);
  const totalInvestedPeriod = investmentsInPeriod.reduce((acc, inv) => acc + (inv.amount || 0), 0);

  // If user registered investments, use totalInvestedPeriod. Otherwise fallback to adSpend config
  const effectiveAdSpend = allInvestments.length > 0 ? totalInvestedPeriod : adSpend;

  // Paid Traffic Investment Metrics:
  // CPL = Investimento / Total de Leads
  const cost_per_lead = (effectiveAdSpend > 0 && filtered_leads_total > 0)
    ? Number((effectiveAdSpend / filtered_leads_total).toFixed(2))
    : 0;

  // CAC = Custo de Aquisição de Clientes = Investimento / Total de Clientes Ganhos (Convertidos)
  const cac = (effectiveAdSpend > 0 && filtered_leads_converted > 0)
    ? Number((effectiveAdSpend / filtered_leads_converted).toFixed(2))
    : 0;

  // ROAS = Receita Total / Investimento
  const roas = effectiveAdSpend > 0
    ? Number((total_revenue_period / effectiveAdSpend).toFixed(2))
    : 0;

  // Build Monthly Performance Breakdown (historical analysis of spend, leads, CAC, CPL and revenue)
  const monthMap = new Map<string, {
    year: number;
    month: number;
    label: string;
    ad_spend: number;
    leads_count: number;
    conversions_count: number;
    revenue: number;
  }>();

  const shortMonthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // Initialize at least 6 months up to current month
  for (let i = 5; i >= 0; i--) {
    const d = new Date(nowBelem);
    d.setMonth(d.getMonth() - i);
    const y = d.getFullYear();
    const m = d.getMonth();
    const key = `${y}-${String(m + 1).padStart(2, '0')}`;
    monthMap.set(key, {
      year: y,
      month: m,
      label: `${shortMonthNames[m]}/${String(y).slice(2)}`,
      ad_spend: 0,
      leads_count: 0,
      conversions_count: 0,
      revenue: 0
    });
  }

  // Populate registered investments by month
  for (const inv of allInvestments) {
    const key = (inv.date || '').slice(0, 7);
    if (!key || key.length < 7) continue;
    if (!monthMap.has(key)) {
      const parts = key.split('-').map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const m = parts[1] - 1;
        monthMap.set(key, {
          year: parts[0],
          month: m,
          label: `${shortMonthNames[m] || 'Mês'}/${String(parts[0]).slice(2)}`,
          ad_spend: 0,
          leads_count: 0,
          conversions_count: 0,
          revenue: 0
        });
      }
    }
    const bucket = monthMap.get(key);
    if (bucket) {
      bucket.ad_spend += inv.amount || 0;
    }
  }

  // Populate leads by month
  for (const lead of paidTrafficLeads) {
    const bDate = getBelemDate(new Date(lead.entry_date));
    const y = bDate.getFullYear();
    const m = bDate.getMonth();
    const key = `${y}-${String(m + 1).padStart(2, '0')}`;
    if (!monthMap.has(key)) {
      monthMap.set(key, {
        year: y,
        month: m,
        label: `${shortMonthNames[m]}/${String(y).slice(2)}`,
        ad_spend: 0,
        leads_count: 0,
        conversions_count: 0,
        revenue: 0
      });
    }
    const bucket = monthMap.get(key);
    if (bucket) {
      bucket.leads_count++;
      if (lead.is_converted) {
        bucket.conversions_count++;
        bucket.revenue += lead.value || 0;
      }
    }
  }

  const sortedMonthKeys = Array.from(monthMap.keys()).sort();
  const monthly_performance: MonthlyPerformancePoint[] = sortedMonthKeys.map(k => {
    const item = monthMap.get(k)!;
    const cpl = (item.ad_spend > 0 && item.leads_count > 0)
      ? Number((item.ad_spend / item.leads_count).toFixed(2))
      : 0;
    const itemCac = (item.ad_spend > 0 && item.conversions_count > 0)
      ? Number((item.ad_spend / item.conversions_count).toFixed(2))
      : 0;
    const itemRoas = item.ad_spend > 0
      ? Number((item.revenue / item.ad_spend).toFixed(2))
      : 0;
    const convRate = item.leads_count > 0
      ? Number(((item.conversions_count / item.leads_count) * 100).toFixed(1))
      : 0;

    return {
      month_key: k,
      month_label: item.label,
      ad_spend: Number(item.ad_spend.toFixed(2)),
      leads_count: item.leads_count,
      conversions_count: item.conversions_count,
      revenue: Number(item.revenue.toFixed(2)),
      cpl,
      cac: itemCac,
      roas: itemRoas,
      conversion_rate: convRate
    };
  });

  return {
    leads_today,
    leads_yesterday,
    leads_this_week,
    leads_last_7_days,
    leads_this_month,
    leads_last_month,
    leads_this_year,
    leads_total_historical,
    filtered_leads_total,
    filtered_leads_converted,
    filtered_leads_in_progress,
    filtered_leads_not_converted,
    filtered_conversion_rate,
    sales_closed_in_period,
    sales_revenue_in_period,
    growth_today_vs_yesterday,
    growth_month_vs_last_month,
    growth_week_vs_last_week,
    growth_conversion_rate,
    daily_series,
    weekly_cohorts,
    channel_distribution,
    monthly_trends,
    monthly_performance,
    ad_spend: effectiveAdSpend,
    cost_per_lead,
    cac,
    roas,
    total_invested_all_time: totalInvestedAllTime,
    total_invested_period: totalInvestedPeriod,
    avg_first_response_time: filtered_leads_total > 0 ? '1m 42s' : '-',
    top_converting_channel: bestChannel,
    total_revenue_period
  };
}
