import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { 
  getConfig, 
  getSanitizedConfig, 
  saveConfig, 
  getAllLeads, 
  getLeadById,
  upsertLead, 
  toggleLeadConversion,
  updateLeadValue,
  clearDatabase,
  getAllInvestments,
  addInvestment,
  updateInvestment,
  deleteInvestment
} from './server/storage.ts';
import { 
  testChatwootConnection, 
  syncChatwootHistory, 
  handleChatwootWebhook 
} from './server/chatwoot.ts';
import { 
  computeAnalytics, 
  getDateRangeForPeriod 
} from './server/analytics.ts';
import { AnalyticsFilter, PeriodFilter, LeadRecord } from './server/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ==========================================
// API ROUTES
// ==========================================

// 1. Config & Connection
app.get('/api/config', (_req: Request, res: Response) => {
  const sanitized = getSanitizedConfig();
  const host = _req.get('host') || `localhost:${PORT}`;
  const protocol = _req.protocol === 'https' || _req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const webhookUrl = `${protocol}://${host}/api/chatwoot/webhook`;
  
  res.json({
    ...sanitized,
    webhook_url: webhookUrl
  });
});

app.post('/api/config', (req: Request, res: Response) => {
  const { chatwoot_url, account_id, api_token } = req.body;
  
  if (!chatwoot_url || !account_id) {
    res.status(400).json({ error: 'URL do Chatwoot e Account ID são obrigatórios.' });
    return;
  }

  const updates: any = {
    chatwoot_url: chatwoot_url.trim().replace(/\/+$/, ''),
    account_id: String(account_id).trim()
  };

  if (api_token && !api_token.includes('••••')) {
    updates.api_token = api_token.trim();
  }

  if (req.body.ad_spend !== undefined) {
    updates.ad_spend = Math.max(0, Number(req.body.ad_spend) || 0);
  }

  const updated = saveConfig(updates);
  res.json({
    success: true,
    message: 'Configurações salvas com sucesso.',
    config: getSanitizedConfig()
  });
});

app.post('/api/config/ad-spend', (req: Request, res: Response) => {
  const { ad_spend } = req.body;
  if (ad_spend === undefined || isNaN(Number(ad_spend))) {
    res.status(400).json({ error: 'Informe um valor válido para o investimento em tráfego.' });
    return;
  }

  const amount = Math.max(0, Number(ad_spend));
  saveConfig({ ad_spend: amount });

  res.json({
    success: true,
    message: `Investimento em tráfego atualizado para R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
    ad_spend: amount,
    config: getSanitizedConfig()
  });
});

// 1.2 Investment Entries Management (Aportes por Data & Mês)
app.get('/api/investments', (_req: Request, res: Response) => {
  const investments = getAllInvestments();
  const totalAmount = investments.reduce((acc, inv) => acc + (inv.amount || 0), 0);
  res.json({
    data: investments,
    total_amount: totalAmount,
    count: investments.length
  });
});

app.post('/api/investments', (req: Request, res: Response) => {
  const { date, amount, channel, notes } = req.body;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: 'Informe uma data válida no formato AAAA-MM-DD.' });
    return;
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < 0) {
    res.status(400).json({ error: 'Informe um valor de investimento numérico válido.' });
    return;
  }

  const newEntry = addInvestment({
    date,
    amount: numAmount,
    channel: channel || 'Geral',
    notes: notes || ''
  });

  res.status(201).json({
    success: true,
    message: `Aporte de R$ ${numAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} registrado com sucesso.`,
    item: newEntry
  });
});

app.put('/api/investments/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { date, amount, channel, notes } = req.body;

  const updates: any = {};
  if (date !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: 'Data em formato inválido. Use AAAA-MM-DD.' });
      return;
    }
    updates.date = date;
  }

  if (amount !== undefined) {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      res.status(400).json({ error: 'Valor em formato inválido.' });
      return;
    }
    updates.amount = numAmount;
  }

  if (channel !== undefined) updates.channel = channel;
  if (notes !== undefined) updates.notes = notes;

  const updated = updateInvestment(id, updates);
  if (!updated) {
    res.status(404).json({ error: 'Lançamento de investimento não encontrado.' });
    return;
  }

  res.json({
    success: true,
    message: 'Lançamento de investimento atualizado com sucesso.',
    item: updated
  });
});

app.delete('/api/investments/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = deleteInvestment(id);
  if (!deleted) {
    res.status(404).json({ error: 'Lançamento não encontrado.' });
    return;
  }

  res.json({
    success: true,
    message: 'Lançamento de investimento removido com sucesso.'
  });
});

app.post('/api/test-connection', async (req: Request, res: Response) => {
  const currentConfig = getConfig();
  const url = (req.body.chatwoot_url || currentConfig.chatwoot_url || '').trim();
  const accountId = String(req.body.account_id || currentConfig.account_id || '').trim();
  const token = (req.body.api_token && !req.body.api_token.includes('••••')) 
    ? req.body.api_token.trim() 
    : currentConfig.api_token;

  if (!url || !accountId || !token) {
    res.status(400).json({
      success: false,
      message: 'Preencha a URL, Account ID e o Token da API do Chatwoot para testar a conexão.'
    });
    return;
  }

  const result = await testChatwootConnection(url, accountId, token);
  
  if (result.success) {
    saveConfig({
      chatwoot_url: url,
      account_id: accountId,
      api_token: token,
      connected: true,
      inboxes: result.inboxes || currentConfig.inboxes,
      last_error_message: undefined
    });
  } else {
    saveConfig({
      connected: false,
      last_error_message: result.message
    });
  }

  res.json(result);
});

// 2. Manual & Continuous Sync
app.post('/api/sync', async (_req: Request, res: Response) => {
  const config = getConfig();
  
  if (!config.api_token) {
    // If no real API token is configured, simulate a sync update preserving current records
    saveConfig({
      last_sync_at: new Date().toISOString(),
      last_sync_status: 'success'
    });
    res.json({
      success: true,
      simulated: true,
      message: 'Sincronização executada com sucesso na base local.',
      synced_at: new Date().toISOString()
    });
    return;
  }

  saveConfig({ last_sync_status: 'syncing' });

  const syncResult = await syncChatwootHistory(
    config.chatwoot_url,
    config.account_id,
    config.api_token,
    config.inboxes
  );

  saveConfig({
    last_sync_at: new Date().toISOString(),
    last_sync_status: syncResult.success ? 'success' : 'error',
    last_error_message: syncResult.success ? undefined : syncResult.message
  });

  res.json(syncResult);
});

// Auto-Sync background scheduler
let autoSyncIntervalTimer: NodeJS.Timeout | null = null;
let isAutoSyncRunning = false;

async function executeAutoSync(triggerSource: string = 'background') {
  if (isAutoSyncRunning) {
    console.log(`[AutoSync] Sincronização anterior em andamento. Ignorando gatilho: ${triggerSource}`);
    return null;
  }

  const config = getConfig();
  if (!config.api_token || !config.account_id || !config.chatwoot_url) {
    return null;
  }

  isAutoSyncRunning = true;
  console.log(`[AutoSync] Iniciando sincronização automática com Chatwoot (${triggerSource})...`);
  
  try {
    const result = await syncChatwootHistory(
      config.chatwoot_url,
      config.account_id,
      config.api_token,
      config.inboxes
    );

    const nowIso = new Date().toISOString();
    saveConfig({
      last_sync_at: nowIso,
      last_auto_sync_at: nowIso,
      last_sync_status: result.success ? 'success' : 'error',
      last_error_message: result.success ? undefined : result.message,
      last_auto_sync_result: {
        paid_leads_found: result.paid_leads_found,
        ganhamos_found: result.ganhamos_found,
        conversions_updated: result.conversions_updated,
        message: result.message
      }
    });

    console.log(`[AutoSync] Concluído com sucesso: ${result.message}`);
    return result;
  } catch (err: any) {
    console.error(`[AutoSync] Falha no sincronismo:`, err);
    saveConfig({
      last_auto_sync_at: new Date().toISOString(),
      last_error_message: err.message
    });
    return null;
  } finally {
    isAutoSyncRunning = false;
  }
}

function initAutoSyncScheduler() {
  if (autoSyncIntervalTimer) {
    clearInterval(autoSyncIntervalTimer);
  }

  // Periodic check every 30 seconds
  autoSyncIntervalTimer = setInterval(async () => {
    const config = getConfig();
    if (!config.auto_sync_enabled || !config.api_token || !config.account_id) {
      return;
    }

    const intervalMs = Math.max(1, config.auto_sync_interval_minutes || 10) * 60 * 1000;
    const lastSyncTime = config.last_auto_sync_at ? new Date(config.last_auto_sync_at).getTime() : 0;
    const timeSinceLast = Date.now() - lastSyncTime;

    if (timeSinceLast >= intervalMs) {
      await executeAutoSync('interval_timer');
    }
  }, 30000);
}

// 2.1 Auto-Sync Configuration Route
app.post('/api/config/auto-sync', async (req: Request, res: Response) => {
  const { enabled, interval_minutes, trigger_now } = req.body;
  const updates: any = {};

  if (typeof enabled === 'boolean') {
    updates.auto_sync_enabled = enabled;
  }

  if (typeof interval_minutes === 'number' && interval_minutes > 0) {
    updates.auto_sync_interval_minutes = Math.max(1, Math.min(1440, interval_minutes));
  }

  if (Object.keys(updates).length > 0) {
    saveConfig(updates);
  }

  let syncResult = null;
  if (trigger_now) {
    syncResult = await executeAutoSync('manual_trigger');
  }

  res.json({
    success: true,
    message: trigger_now 
      ? (syncResult?.message || 'Sincronismo disparado com sucesso.')
      : 'Configurações de sincronismo automático salvas.',
    config: getSanitizedConfig(),
    result: syncResult
  });
});

// 3. Chatwoot Inbound Webhook
app.post('/api/chatwoot/webhook', (req: Request, res: Response) => {
  const config = getConfig();
  const result = handleChatwootWebhook(req.body, config.account_id, config.chatwoot_url);
  res.json({ status: 'received', ...result });
});

// 4. Analytics Summary & Indicators
app.get('/api/stats', (req: Request, res: Response) => {
  const allLeads = getAllLeads();
  const allInvestments = getAllInvestments();
  
  const filter: AnalyticsFilter = {
    period: (req.query.period as PeriodFilter) || 'this_month',
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    channel: req.query.channel as string,
    inboxId: req.query.inboxId ? Number(req.query.inboxId) : undefined,
    status: (req.query.status as any) || 'all',
    search: req.query.search as string
  };

  const config = getConfig();
  const summary = computeAnalytics(allLeads, filter, config.ad_spend || 0, allInvestments);
  res.json(summary);
});

// 5. Leads Table & Search
app.get('/api/leads', (req: Request, res: Response) => {
  const allLeads = getAllLeads();
  const period = (req.query.period as PeriodFilter) || 'all';
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  const channel = req.query.channel as string;
  const inboxId = req.query.inboxId ? Number(req.query.inboxId) : undefined;
  const status = req.query.status as string;
  const search = req.query.search as string;

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));

  const activeRange = getDateRangeForPeriod(period, startDate, endDate);

  // Filter leads
  let filtered = allLeads.filter(l => {
    // Rule 3: Only paid traffic
    if (!l.is_lead) return false;

    if (period !== 'all') {
      const entryTime = new Date(l.entry_date).getTime();
      if (entryTime < activeRange.start.getTime() || entryTime > activeRange.end.getTime()) {
        return false;
      }
    }

    if (channel && channel !== 'all' && channel !== 'Todos') {
      if (l.channel !== channel && l.channel_detail !== channel) return false;
    }

    if (inboxId && inboxId !== 0) {
      if (l.inbox_id !== inboxId) return false;
    }

    if (status && status !== 'all' && status !== 'Todos') {
      const normalizedStatus = status === 'Convertido' ? 'converted' : (status === 'Lead' ? 'lead' : (status === 'Não Convertido' ? 'not_converted' : status));
      if (l.status !== normalizedStatus) return false;
    }

    if (search && search.trim().length > 0) {
      const q = search.toLowerCase().trim();
      const matchName = l.contact_name?.toLowerCase().includes(q);
      const matchEmail = l.contact_email?.toLowerCase().includes(q);
      const matchPhone = l.contact_phone?.toLowerCase().includes(q);
      const matchId = `cw-${l.conversation_id}`.toLowerCase().includes(q) || String(l.conversation_id).includes(q);
      const matchTags = l.tags?.some(t => t.toLowerCase().includes(q));
      if (!matchName && !matchEmail && !matchPhone && !matchId && !matchTags) return false;
    }

    return true;
  });

  // Sort by entry_date descending
  filtered.sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const items = filtered.slice(startIndex, startIndex + limit);

  // Summary counts for this specific filter set
  const convertedCount = filtered.filter(l => l.is_converted).length;
  const inProgressCount = filtered.filter(l => l.status === 'lead').length;
  const notConvertedCount = filtered.filter(l => l.status === 'not_converted').length;
  const conversionRate = total > 0 ? Number(((convertedCount / total) * 100).toFixed(1)) : 0;

  res.json({
    data: items,
    pagination: {
      total,
      page,
      limit,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1
    },
    metrics: {
      total,
      converted: convertedCount,
      in_progress: inProgressCount,
      not_converted: notConvertedCount,
      conversion_rate: conversionRate
    }
  });
});

// 6. Toggle Lead Conversion (Does NOT create a new lead or change entry date!)
app.post('/api/leads/:id/toggle-conversion', (req: Request, res: Response) => {
  const leadId = req.params.id;
  const updated = toggleLeadConversion(leadId);
  if (!updated) {
    res.status(404).json({ error: 'Lead não encontrado.' });
    return;
  }
  res.json({ success: true, lead: updated });
});

// 6.1 Update Lead Sale Value Manually
app.post('/api/leads/:id/value', (req: Request, res: Response) => {
  const leadId = req.params.id;
  const { value } = req.body;
  if (value === undefined || isNaN(Number(value))) {
    res.status(400).json({ error: 'Informe um valor numérico válido.' });
    return;
  }

  const numVal = Math.max(0, Number(value));
  const updated = updateLeadValue(leadId, numVal);
  if (!updated) {
    res.status(404).json({ error: 'Lead não encontrado.' });
    return;
  }

  res.json({
    success: true,
    message: `Valor da venda atualizado para R$ ${numVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
    lead: updated
  });
});

app.patch('/api/leads/:id/value', (req: Request, res: Response) => {
  const leadId = req.params.id;
  const { value } = req.body;
  if (value === undefined || isNaN(Number(value))) {
    res.status(400).json({ error: 'Informe um valor numérico válido.' });
    return;
  }

  const numVal = Math.max(0, Number(value));
  const updated = updateLeadValue(leadId, numVal);
  if (!updated) {
    res.status(404).json({ error: 'Lead não encontrado.' });
    return;
  }

  res.json({
    success: true,
    message: `Valor da venda atualizado para R$ ${numVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
    lead: updated
  });
});

// 7. Manual Lead Creation / Simulation
app.post('/api/leads/manual', (req: Request, res: Response) => {
  const { id, conversation_id, contact_name, contact_phone, contact_email, channel, channel_detail, value, is_converted } = req.body;
  
  // If updating an existing lead by ID
  if (id) {
    const existing = getLeadById(id);
    if (existing) {
      const willBeConverted = is_converted !== undefined ? Boolean(is_converted) : existing.is_converted;
      let tags = [...existing.tags];
      if (willBeConverted && !tags.some(t => t.toLowerCase() === 'ganhamos')) {
        tags.push('Ganhamos');
      } else if (!willBeConverted) {
        tags = tags.filter(t => t.toLowerCase() !== 'ganhamos');
      }

      const updatedLead: LeadRecord = {
        ...existing,
        contact_name: contact_name || existing.contact_name,
        contact_phone: contact_phone !== undefined ? contact_phone : existing.contact_phone,
        contact_email: contact_email !== undefined ? contact_email : existing.contact_email,
        channel: channel || existing.channel,
        channel_detail: channel_detail || existing.channel_detail,
        value: value !== undefined ? Number(value) : existing.value,
        is_converted: willBeConverted,
        tags,
        status: willBeConverted ? 'converted' : 'lead',
        conversion_date: willBeConverted ? (existing.conversion_date || new Date().toISOString()) : undefined
        // IMPORTANT: entry_date, id, account_id, conversation_id and first_identified_at are preserved!
      };
      const { lead } = upsertLead(updatedLead);
      res.json({ success: true, lead });
      return;
    }
  }

  if (!contact_name) {
    res.status(400).json({ error: 'Nome do contato é obrigatório.' });
    return;
  }

  const config = getConfig();
  const convId = conversation_id || Math.floor(95000 + Math.random() * 4000);
  const now = new Date().toISOString();

  const tags = ['trafego_pago'];
  if (is_converted) {
    tags.push('Ganhamos');
  }

  const newLead: LeadRecord = {
    id: `${config.account_id}_${convId}`,
    account_id: config.account_id,
    conversation_id: convId,
    contact_name,
    contact_phone: contact_phone || undefined,
    contact_email: contact_email || undefined,
    channel: channel || 'WhatsApp',
    channel_detail: channel_detail || `${channel || 'WhatsApp'} Direct`,
    inbox_id: 101,
    inbox_name: channel_detail || `${channel || 'WhatsApp'} Inbound`,
    tags,
    is_lead: true,
    is_converted: Boolean(is_converted),
    status: is_converted ? 'converted' : 'lead',
    entry_date: now,
    first_identified_at: now,
    conversion_date: is_converted ? now : undefined,
    value: Number(value) || 0,
    has_confirmed_timestamp: true,
    chatwoot_url: `${config.chatwoot_url}/app/accounts/${config.account_id}/conversations/${convId}`
  };

  const { lead } = upsertLead(newLead);
  res.json({ success: true, lead });
});

// 7. Demo Data Reset & Database Management
app.post('/api/seed-demo', (_req: Request, res: Response) => {
  res.json({ success: false, message: 'Dados simulados foram desativados. Conecte sua conta do Chatwoot para sincronização real.' });
});

app.post('/api/clear', (_req: Request, res: Response) => {
  clearDatabase();
  res.json({ success: true, message: 'Base de dados limpa.' });
});

// 8. CSV Export
app.get('/api/export/csv', (req: Request, res: Response) => {
  const allLeads = getAllLeads();
  const paidLeads = allLeads.filter(l => l.is_lead);

  // Portuguese CSV Header
  const headers = [
    'ID Conversa',
    'Contato',
    'Telefone',
    'E-mail',
    'Canal de Origem',
    'Caixa de Entrada',
    'Data de Entrada',
    'Status Comercial',
    'Convertido (Ganhamos)',
    'Data da Conversão',
    'Valor da Venda (R$)',
    'Etiquetas',
    'Link Chatwoot'
  ];

  const rows = paidLeads.map(l => [
    `#CW-${l.conversation_id}`,
    `"${(l.contact_name || '').replace(/"/g, '""')}"`,
    `"${l.contact_phone || ''}"`,
    `"${l.contact_email || ''}"`,
    `"${l.channel_detail || l.channel}"`,
    `"${l.inbox_name || ''}"`,
    new Date(l.entry_date).toLocaleString('pt-BR', { timeZone: 'America/Belem' }),
    l.status === 'converted' ? 'Convertido' : (l.status === 'not_converted' ? 'Não Convertido' : 'Em Atendimento'),
    l.is_converted ? 'Sim' : 'Não',
    l.conversion_date ? new Date(l.conversion_date).toLocaleString('pt-BR', { timeZone: 'America/Belem' }) : '-',
    l.value ? l.value.toFixed(2).replace('.', ',') : '0,00',
    `"${(l.tags || []).join(', ')}"`,
    l.chatwoot_url || ''
  ]);

  // UTF-8 BOM for Microsoft Excel compatibility
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="chatanalytics_leads_${Date.now()}.csv"`);
  res.send(csvContent);
});

// ==========================================
// VITE DEV SERVER OR STATIC PRODUCTION
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ChatAnalytics server running on http://0.0.0.0:${PORT}`);
    initAutoSyncScheduler();
  });
}

startServer();
