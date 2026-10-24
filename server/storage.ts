import fs from 'fs';
import path from 'path';
import { ChatwootConfig, LeadRecord, InvestmentRecord } from './types.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'chatanalytics_db.json');

interface DatabaseSchema {
  config: ChatwootConfig;
  leads: Record<string, LeadRecord>; // keyed by `${account_id}_${conversation_id}`
  investments: InvestmentRecord[];
}

const DEFAULT_CONFIG: ChatwootConfig = {
  chatwoot_url: 'https://app.chatwoot.com',
  account_id: '',
  api_token: '',
  connected: false,
  last_sync_at: null,
  last_sync_count: 0,
  last_sync_status: 'idle',
  inboxes: [],
  auto_sync_enabled: true,
  auto_sync_interval_minutes: 10,
  last_auto_sync_at: null,
  last_auto_sync_result: undefined,
  ad_spend: 0
};

function ensureDbExists(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.leads === 'object') {
        // If config is missing auto-sync keys, merge default
        parsed.config = { ...DEFAULT_CONFIG, ...(parsed.config || {}) };
        parsed.investments = Array.isArray(parsed.investments) ? parsed.investments : [];
        return parsed;
      }
    } catch (e) {
      console.warn('Erro ao ler chatanalytics_db.json, inicializando base limpa...', e);
    }
  }

  // Pure clean database with 0 mock leads
  const initialDb: DatabaseSchema = {
    config: DEFAULT_CONFIG,
    leads: {},
    investments: []
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
  return initialDb;
}

let dbCache: DatabaseSchema | null = null;

function getDb(): DatabaseSchema {
  if (!dbCache) {
    dbCache = ensureDbExists();
  }
  return dbCache;
}

function saveDb(db: DatabaseSchema) {
  dbCache = db;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

export function getConfig(): ChatwootConfig {
  return getDb().config;
}

export function getSanitizedConfig() {
  const config = getConfig();
  return {
    ...config,
    // Mask token for client-side security
    api_token: config.api_token ? `${config.api_token.slice(0, 4)}••••••••${config.api_token.slice(-3)}` : '',
    has_token: Boolean(config.api_token)
  };
}

export function saveConfig(updates: Partial<ChatwootConfig>): ChatwootConfig {
  const db = getDb();
  // Don't overwrite token with masked version
  if (updates.api_token && updates.api_token.includes('••••')) {
    delete updates.api_token;
  }
  db.config = {
    ...db.config,
    ...updates
  };
  saveDb(db);
  return db.config;
}

export function getAllLeads(): LeadRecord[] {
  const db = getDb();
  return Object.values(db.leads);
}

export function getLeadById(id: string): LeadRecord | undefined {
  return getDb().leads[id];
}

/**
 * Idempotent upsert: Key = `${account_id}_${conversation_id}`
 * Rule 3: Count each conversation once.
 * Rule 4: Converted lead = 'trafego_pago' + 'Ganhamos'
 * Rule 11: Preserve first observed timestamp if not provided
 */
export function upsertLead(lead: LeadRecord): { lead: LeadRecord; isNew: boolean } {
  const db = getDb();
  const id = `${lead.account_id}_${lead.conversation_id}`;
  const existing = db.leads[id];

  const hasTrafegoPago = lead.tags.some(t => t.toLowerCase() === 'trafego_pago');
  const hasGanhamos = lead.tags.some(t => t.toLowerCase() === 'ganhamos');

  const isLead = hasTrafegoPago;
  const isConverted = hasTrafegoPago && hasGanhamos;

  let conversionDate = lead.conversion_date;
  if (isConverted && !conversionDate) {
    conversionDate = existing?.conversion_date || new Date().toISOString();
  }

  const status: 'lead' | 'converted' | 'not_converted' = isConverted 
    ? 'converted' 
    : (lead.status === 'not_converted' ? 'not_converted' : 'lead');

  const record: LeadRecord = {
    ...lead,
    id,
    is_lead: isLead,
    is_converted: isConverted,
    status,
    first_identified_at: existing ? existing.first_identified_at : (lead.first_identified_at || new Date().toISOString()),
    conversion_date: isConverted ? conversionDate : undefined,
    entry_date: existing ? existing.entry_date : (lead.entry_date || new Date().toISOString()),
    value: lead.value !== undefined ? Number(lead.value) : (existing?.value || 0)
  };

  db.leads[id] = record;
  saveDb(db);

  return { lead: record, isNew: !existing };
}

export function toggleLeadConversion(leadId: string): LeadRecord | null {
  const db = getDb();
  const existing = db.leads[leadId];
  if (!existing) return null;

  const willBeConverted = !existing.is_converted;
  let newTags = [...existing.tags];

  if (willBeConverted) {
    if (!newTags.some(t => t.toLowerCase() === 'ganhamos')) {
      newTags.push('Ganhamos');
    }
  } else {
    newTags = newTags.filter(t => t.toLowerCase() !== 'ganhamos');
  }

  const updatedRecord: LeadRecord = {
    ...existing,
    tags: newTags,
    is_converted: willBeConverted,
    status: willBeConverted ? 'converted' : 'lead',
    conversion_date: willBeConverted ? (existing.conversion_date || new Date().toISOString()) : undefined,
    value: existing.value || 0
    // entry_date, id, account_id, conversation_id, first_identified_at remain STRICTLY untouched
  };

  db.leads[leadId] = updatedRecord;
  saveDb(db);
  return updatedRecord;
}

export function updateLeadValue(leadId: string, value: number): LeadRecord | null {
  const db = getDb();
  const existing = db.leads[leadId];
  if (!existing) return null;

  const numVal = Math.max(0, isNaN(Number(value)) ? 0 : Number(value));
  const updatedRecord: LeadRecord = {
    ...existing,
    value: numVal
  };

  db.leads[leadId] = updatedRecord;
  saveDb(db);
  return updatedRecord;
}

export function bulkUpsertLeads(leads: LeadRecord[]): { added: number; updated: number } {
  const db = getDb();
  let added = 0;
  let updated = 0;

  for (const l of leads) {
    const id = `${l.account_id}_${l.conversation_id}`;
    const existing = db.leads[id];
    if (existing) {
      updated++;
    } else {
      added++;
    }

    const hasTrafegoPago = l.tags.some(t => t.toLowerCase() === 'trafego_pago');
    const hasGanhamos = l.tags.some(t => t.toLowerCase() === 'ganhamos');
    const isConverted = hasTrafegoPago && hasGanhamos;

    db.leads[id] = {
      ...l,
      id,
      is_lead: hasTrafegoPago,
      is_converted: isConverted,
      status: isConverted ? 'converted' : (l.status || 'lead'),
      first_identified_at: existing ? existing.first_identified_at : (l.first_identified_at || new Date().toISOString()),
      conversion_date: isConverted ? (l.conversion_date || existing?.conversion_date || new Date().toISOString()) : undefined,
      entry_date: existing ? existing.entry_date : (l.entry_date || new Date().toISOString()),
      value: l.value !== undefined ? Number(l.value) : (existing?.value || 0)
    };
  }

  db.config.last_sync_at = new Date().toISOString();
  db.config.last_sync_count = Object.keys(db.leads).length;
  db.config.last_sync_status = 'success';

  saveDb(db);
  return { added, updated };
}

export function clearDatabase(): void {
  const db = getDb();
  db.leads = {};
  db.config.last_sync_count = 0;
  db.config.last_sync_at = null;
  db.config.last_sync_status = 'idle';
  saveDb(db);
}

export function getAllInvestments(): InvestmentRecord[] {
  const db = getDb();
  const list = db.investments || [];
  // Sort descending by date
  return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getInvestmentById(id: string): InvestmentRecord | undefined {
  const db = getDb();
  return (db.investments || []).find(inv => inv.id === id);
}

export function addInvestment(data: {
  date: string;
  amount: number;
  channel?: string;
  notes?: string;
}): InvestmentRecord {
  const db = getDb();
  if (!db.investments) {
    db.investments = [];
  }

  const id = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const record: InvestmentRecord = {
    id,
    date: data.date,
    amount: Math.max(0, Number(data.amount) || 0),
    channel: data.channel?.trim() || 'Geral',
    notes: data.notes?.trim() || '',
    created_at: new Date().toISOString()
  };

  db.investments.push(record);
  saveDb(db);
  return record;
}

export function updateInvestment(
  id: string,
  updates: Partial<{ date: string; amount: number; channel?: string; notes?: string }>
): InvestmentRecord | null {
  const db = getDb();
  if (!db.investments) return null;

  const index = db.investments.findIndex(inv => inv.id === id);
  if (index === -1) return null;

  const current = db.investments[index];
  const updated: InvestmentRecord = {
    ...current,
    date: updates.date !== undefined ? updates.date : current.date,
    amount: updates.amount !== undefined ? Math.max(0, Number(updates.amount) || 0) : current.amount,
    channel: updates.channel !== undefined ? updates.channel.trim() : current.channel,
    notes: updates.notes !== undefined ? updates.notes.trim() : current.notes
  };

  db.investments[index] = updated;
  saveDb(db);
  return updated;
}

export function deleteInvestment(id: string): boolean {
  const db = getDb();
  if (!db.investments) return false;

  const initialLen = db.investments.length;
  db.investments = db.investments.filter(inv => inv.id !== id);
  if (db.investments.length !== initialLen) {
    saveDb(db);
    return true;
  }
  return false;
}

