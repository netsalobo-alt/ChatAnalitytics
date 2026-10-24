import { ChatwootInbox, LeadRecord } from './types.ts';
import { upsertLead, bulkUpsertLeads, getAllLeads } from './storage.ts';

export interface ChatwootConnectionResult {
  success: boolean;
  message: string;
  inboxes?: ChatwootInbox[];
  latency_ms?: number;
  account_name?: string;
}

export interface SyncHistoryResult {
  success: boolean;
  total_synced: number;
  paid_leads_found: number;
  ganhamos_found: number;
  conversions_updated: number;
  message: string;
}

export async function testChatwootConnection(
  baseUrl: string,
  accountId: string,
  apiToken: string
): Promise<ChatwootConnectionResult> {
  const cleanUrl = baseUrl.replace(/\/+$/, '');
  const startTime = Date.now();

  try {
    // Check inboxes first - tests both account_id and api_token
    const inboxesUrl = `${cleanUrl}/api/v1/accounts/${accountId}/inboxes`;
    const res = await fetch(inboxesUrl, {
      method: 'GET',
      headers: {
        'api_access_token': apiToken,
        'Content-Type': 'application/json'
      }
    });

    const latency = Date.now() - startTime;

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          message: 'Token de API inválido ou sem permissão para esta conta.',
          latency_ms: latency
        };
      }
      if (res.status === 404) {
        return {
          success: false,
          message: `Conta ${accountId} não encontrada na URL informada.`,
          latency_ms: latency
        };
      }
      return {
        success: false,
        message: `Falha na conexão com Chatwoot: HTTP ${res.status} ${res.statusText}`,
        latency_ms: latency
      };
    }

    const data = await res.json();
    const inboxesList: ChatwootInbox[] = (data.payload || data || []).map((ib: any) => ({
      id: ib.id,
      name: ib.name || `Inbox #${ib.id}`,
      channel_type: ib.channel_type || 'Channel::WebWidget',
      phone_number: ib.phone_number
    }));

    return {
      success: true,
      message: `Conexão estabelecida com sucesso! ${inboxesList.length} canais/caixas encontrados.`,
      inboxes: inboxesList,
      latency_ms: latency
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Não foi possível conectar ao servidor Chatwoot: ${error.message}`,
      latency_ms: Date.now() - startTime
    };
  }
}

/**
 * Full automatic or manual synchronization with Chatwoot:
 * 1. Consults conversations with label 'trafego_pago' (Lead identification)
 * 2. Consults conversations with label 'Ganhamos' (Conversion into sale)
 * 3. Enforces Rule 3 & 4: Only leads with trafego_pago count, and Ganhamos with trafego_pago count as conversion
 * 4. Extracts real revenue from Chatwoot custom_attributes (no mock numbers)
 */
export async function syncChatwootHistory(
  baseUrl: string,
  accountId: string,
  apiToken: string,
  inboxes: ChatwootInbox[] = []
): Promise<SyncHistoryResult> {
  const cleanUrl = baseUrl.replace(/\/+$/, '');
  const inboxMap = new Map<number, ChatwootInbox>();
  inboxes.forEach(ib => inboxMap.set(ib.id, ib));

  try {
    const leadsMap = new Map<string, LeadRecord>();
    let paidLeadsFound = 0;
    let ganhamosFound = 0;
    let conversionsUpdated = 0;

    // STEP 1: Fetch all conversations with label 'trafego_pago'
    let pageTrafego = 1;
    let hasMoreTrafego = true;
    const maxPages = 25;

    while (hasMoreTrafego && pageTrafego <= maxPages) {
      const url = `${cleanUrl}/api/v1/accounts/${accountId}/conversations?status=all&labels=trafego_pago&page=${pageTrafego}`;
      const res = await fetch(url, {
        headers: {
          'api_access_token': apiToken,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        // If query with label parameter fails (older Chatwoot version), try standard conversations endpoint
        if (pageTrafego === 1) {
          const fallbackUrl = `${cleanUrl}/api/v1/accounts/${accountId}/conversations?status=all&page=${pageTrafego}`;
          const fallbackRes = await fetch(fallbackUrl, {
            headers: { 'api_access_token': apiToken, 'Content-Type': 'application/json' }
          });
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            const items = fallbackData.data?.payload || fallbackData.payload || [];
            for (const item of items) {
              const lead = parseChatwootConversation(item, accountId, cleanUrl, inboxMap);
              if (lead && lead.is_lead) {
                leadsMap.set(lead.id, lead);
                paidLeadsFound++;
                if (lead.is_converted) {
                  ganhamosFound++;
                  conversionsUpdated++;
                }
              }
            }
          }
        }
        break;
      }

      const json = await res.json();
      const payload = json.data?.payload || json.payload || [];

      if (!Array.isArray(payload) || payload.length === 0) {
        hasMoreTrafego = false;
        break;
      }

      for (const item of payload) {
        const lead = parseChatwootConversation(item, accountId, cleanUrl, inboxMap);
        if (lead && lead.is_lead) {
          leadsMap.set(lead.id, lead);
          paidLeadsFound++;
          if (lead.is_converted) {
            ganhamosFound++;
            conversionsUpdated++;
          }
        }
      }

      pageTrafego++;
      if (payload.length < 20) {
        hasMoreTrafego = false;
      }
    }

    // STEP 2: Fetch all conversations with label 'Ganhamos' to detect any conversions
    let pageGanhamos = 1;
    let hasMoreGanhamos = true;

    while (hasMoreGanhamos && pageGanhamos <= maxPages) {
      const url = `${cleanUrl}/api/v1/accounts/${accountId}/conversations?status=all&labels=Ganhamos&page=${pageGanhamos}`;
      const res = await fetch(url, {
        headers: {
          'api_access_token': apiToken,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        break;
      }

      const json = await res.json();
      const payload = json.data?.payload || json.payload || [];

      if (!Array.isArray(payload) || payload.length === 0) {
        hasMoreGanhamos = false;
        break;
      }

      for (const item of payload) {
        const rawLabels: any[] = item.labels || [];
        const tags: string[] = rawLabels.map(l => (typeof l === 'string' ? l : l.title || l.name || '')).filter(Boolean);
        const hasTrafego = tags.some(t => t.toLowerCase() === 'trafego_pago');

        // Rule 4: "Ganhamos sem trafego_pago não deve entrar na conversão das campanhas de tráfego pago."
        const id = `${accountId}_${item.id}`;
        const existingInMap = leadsMap.get(id);

        if (existingInMap || hasTrafego) {
          ganhamosFound++;
          const parsedLead = parseChatwootConversation(item, accountId, cleanUrl, inboxMap);
          if (parsedLead) {
            parsedLead.is_converted = true;
            parsedLead.status = 'converted';
            if (!parsedLead.tags.some(t => t.toLowerCase() === 'ganhamos')) {
              parsedLead.tags.push('Ganhamos');
            }
            parsedLead.conversion_date = parsedLead.conversion_date || new Date().toISOString();
            leadsMap.set(parsedLead.id, parsedLead);
            conversionsUpdated++;
          }
        }
      }

      pageGanhamos++;
      if (payload.length < 20) {
        hasMoreGanhamos = false;
      }
    }

    const collectedLeads = Array.from(leadsMap.values());

    if (collectedLeads.length > 0) {
      const { added, updated } = bulkUpsertLeads(collectedLeads);
      return {
        success: true,
        total_synced: collectedLeads.length,
        paid_leads_found: paidLeadsFound,
        ganhamos_found: ganhamosFound,
        conversions_updated: conversionsUpdated,
        message: `Sincronização concluída: ${collectedLeads.length} leads de tráfego pago auditados (${conversionsUpdated} convertidos com 'Ganhamos').`
      };
    } else {
      return {
        success: true,
        total_synced: 0,
        paid_leads_found: 0,
        ganhamos_found: 0,
        conversions_updated: 0,
        message: `Sincronização realizada. Nenhuma conversa com a etiqueta 'trafego_pago' foi encontrada no Chatwoot.`
      };
    }
  } catch (error: any) {
    return {
      success: false,
      total_synced: 0,
      paid_leads_found: 0,
      ganhamos_found: 0,
      conversions_updated: 0,
      message: `Erro durante sincronização com Chatwoot: ${error.message}`
    };
  }
}

/**
 * Real conversation parser:
 * Revenue is extracted strictly from Chatwoot custom_attributes (e.g. valor, deal_value, receita, valor_venda).
 * If no custom attribute is defined in Chatwoot, value is 0 (NO mock numbers).
 */
export function parseChatwootConversation(
  conv: any,
  accountId: string,
  baseUrl: string,
  inboxMap: Map<number, ChatwootInbox>
): LeadRecord | null {
  const convId = conv.id;
  if (!convId) return null;

  // Extract labels
  const rawLabels: any[] = conv.labels || [];
  const tags: string[] = rawLabels.map(l => (typeof l === 'string' ? l : l.title || l.name || '')).filter(Boolean);

  const hasTrafegoPago = tags.some(t => t.toLowerCase() === 'trafego_pago');
  const hasGanhamos = tags.some(t => t.toLowerCase() === 'ganhamos');

  // Rule 3: Only count if it has 'trafego_pago'
  if (!hasTrafegoPago) {
    return null;
  }

  const sender = conv.meta?.sender || conv.contact || {};
  const contactName = sender.name || `Contato #${sender.id || convId}`;
  const contactEmail = sender.email || undefined;
  const contactPhone = sender.phone_number || undefined;

  const inboxId = conv.inbox_id || 0;
  const inboxInfo = inboxMap.get(inboxId);
  const inboxName = inboxInfo?.name || conv.inbox?.name || `Caixa #${inboxId}`;
  const channelType = inboxInfo?.channel_type || conv.inbox?.channel_type || '';

  // Determine standard channel
  let channel: 'WhatsApp' | 'Instagram' | 'Facebook' | 'Webchat' | 'Outros' = 'Outros';
  let channelDetail = inboxName;

  if (channelType.includes('Whatsapp') || inboxName.toLowerCase().includes('whatsapp')) {
    channel = 'WhatsApp';
    channelDetail = inboxName.includes('Ads') ? inboxName : `${inboxName} (WhatsApp)`;
  } else if (channelType.includes('Instagram') || inboxName.toLowerCase().includes('instagram')) {
    channel = 'Instagram';
    channelDetail = inboxName.includes('Direct') ? inboxName : `${inboxName} (Instagram)`;
  } else if (channelType.includes('Facebook') || inboxName.toLowerCase().includes('facebook')) {
    channel = 'Facebook';
    channelDetail = inboxName.includes('Leads') ? inboxName : `${inboxName} (Facebook)`;
  } else if (channelType.includes('WebWidget') || inboxName.toLowerCase().includes('webchat') || inboxName.toLowerCase().includes('site')) {
    channel = 'Webchat';
    channelDetail = inboxName;
  }

  // Parse entry date
  const createdAtEpoch = conv.created_at 
    ? (typeof conv.created_at === 'number' ? conv.created_at * 1000 : new Date(conv.created_at).getTime()) 
    : Date.now();
  const entryDateIso = new Date(createdAtEpoch).toISOString();

  // Status
  let status: 'lead' | 'converted' | 'not_converted' = 'lead';
  if (hasGanhamos) {
    status = 'converted';
  } else if (tags.some(t => t.toLowerCase().includes('desqualificado') || t.toLowerCase().includes('perdemos'))) {
    status = 'not_converted';
  }

  // REVENUE EXTRACTION:
  // Strictly extracted from Chatwoot custom attributes on conversation or contact!
  // No mock fallback (e.g. no default 3500)
  const customAttrs = conv.custom_attributes || {};
  const contactCustomAttrs = sender.custom_attributes || {};
  
  const rawValue = 
    customAttrs.valor ?? 
    customAttrs.deal_value ?? 
    customAttrs.receita ?? 
    customAttrs.valor_venda ?? 
    customAttrs.value ?? 
    customAttrs.amount ?? 
    customAttrs.preco ?? 
    contactCustomAttrs.valor ?? 
    contactCustomAttrs.deal_value ?? 
    contactCustomAttrs.receita ?? 
    0;

  let value = 0;
  if (typeof rawValue === 'number') {
    value = rawValue;
  } else if (typeof rawValue === 'string') {
    const cleanNum = rawValue.replace(/[^\d.,-]/g, '').replace(',', '.');
    value = parseFloat(cleanNum) || 0;
  }

  // Conversion date from updated_at or current
  let conversionDate: string | undefined = undefined;
  if (hasGanhamos) {
    if (conv.updated_at) {
      const updatedAtEpoch = typeof conv.updated_at === 'number' ? conv.updated_at * 1000 : new Date(conv.updated_at).getTime();
      conversionDate = new Date(updatedAtEpoch).toISOString();
    } else {
      conversionDate = new Date().toISOString();
    }
  }

  const cleanBase = baseUrl.replace(/\/+$/, '');
  const chatwootUrl = `${cleanBase}/app/accounts/${accountId}/conversations/${convId}`;

  return {
    id: `${accountId}_${convId}`,
    account_id: String(accountId),
    conversation_id: convId,
    contact_name: contactName,
    contact_email: contactEmail,
    contact_phone: contactPhone,
    inbox_id: inboxId,
    inbox_name: inboxName,
    channel,
    channel_detail: channelDetail,
    tags,
    is_lead: true,
    is_converted: hasGanhamos,
    status,
    entry_date: entryDateIso,
    first_identified_at: entryDateIso,
    conversion_date: conversionDate,
    value,
    has_confirmed_timestamp: true,
    chatwoot_url: chatwootUrl
  };
}

export function handleChatwootWebhook(body: any, accountId: string, baseUrl: string): { processed: boolean; leadId?: string; action?: string } {
  if (!body) return { processed: false };

  const conversation = body.conversation || body;
  if (!conversation.id) {
    return { processed: false };
  }

  const rawLabels: any[] = conversation.labels || body.labels || [];
  const tags: string[] = rawLabels.map(l => (typeof l === 'string' ? l : l.title || l.name || '')).filter(Boolean);

  const hasTrafegoPago = tags.some(t => t.toLowerCase() === 'trafego_pago');
  if (!hasTrafegoPago) {
    return { processed: true, action: 'ignored_not_paid_traffic' };
  }

  const emptyMap = new Map<number, ChatwootInbox>();
  const lead = parseChatwootConversation(conversation, accountId || body.account?.id || '1', baseUrl, emptyMap);
  
  if (lead) {
    const { lead: savedLead, isNew } = upsertLead(lead);
    return { 
      processed: true, 
      leadId: savedLead.id, 
      action: isNew ? 'created' : 'updated' 
    };
  }

  return { processed: false };
}
