import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import type { ChatwootConfig, InvestmentRecord, LeadRecord } from './types.ts';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
let firestoreDb: any = null;

export function getRemoteFirestore() {
  if (firestoreDb) return firestoreDb;
  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(raw);
      const existingApps = getApps();
      const app = existingApps.find(a => a.name === 'server-firestore') || initializeApp(config, 'server-firestore');
      firestoreDb = getFirestore(app, config.firestoreDatabaseId || '(default)');
      return firestoreDb;
    }
  } catch (err: any) {
    console.warn('[FirestorePersistence] Falha ao inicializar conexão Firestore:', err.message);
  }
  return null;
}

export async function loadAppDataFromFirestore(): Promise<{
  config?: Partial<ChatwootConfig>;
  investments?: InvestmentRecord[];
  leads?: Record<string, LeadRecord>;
} | null> {
  const db = getRemoteFirestore();
  if (!db) return null;

  try {
    const configSnap = await getDoc(doc(db, 'app_data', 'config'));
    const investmentsSnap = await getDoc(doc(db, 'app_data', 'investments'));
    const leadsSnap = await getDoc(doc(db, 'app_data', 'leads'));

    const result: {
      config?: Partial<ChatwootConfig>;
      investments?: InvestmentRecord[];
      leads?: Record<string, LeadRecord>;
    } = {};

    let hasAnyData = false;

    if (configSnap.exists()) {
      result.config = configSnap.data() as Partial<ChatwootConfig>;
      hasAnyData = true;
    }

    if (investmentsSnap.exists()) {
      const data = investmentsSnap.data();
      result.investments = Array.isArray(data?.items) ? data.items : [];
      hasAnyData = true;
    }

    if (leadsSnap.exists()) {
      const data = leadsSnap.data();
      result.leads = data?.items && typeof data.items === 'object' ? data.items : {};
      hasAnyData = true;
    }

    if (hasAnyData) {
      console.log('[FirestorePersistence] Dados restaurados com sucesso do Firestore!');
      return result;
    }
  } catch (err: any) {
    console.warn('[FirestorePersistence] Erro ao carregar dados do Firestore:', err.message);
  }

  return null;
}

export async function saveConfigToFirestore(config: ChatwootConfig): Promise<boolean> {
  const db = getRemoteFirestore();
  if (!db) return false;

  try {
    // Sanitize config to prevent undefined properties in Firestore
    const cleanConfig = JSON.parse(JSON.stringify(config));
    await setDoc(doc(db, 'app_data', 'config'), {
      ...cleanConfig,
      _persisted_at: new Date().toISOString()
    });
    return true;
  } catch (err: any) {
    console.warn('[FirestorePersistence] Erro ao persistir config:', err.message);
    return false;
  }
}

export async function saveInvestmentsToFirestore(investments: InvestmentRecord[]): Promise<boolean> {
  const db = getRemoteFirestore();
  if (!db) return false;

  try {
    const cleanInvestments = JSON.parse(JSON.stringify(investments || []));
    await setDoc(doc(db, 'app_data', 'investments'), {
      items: cleanInvestments,
      _persisted_at: new Date().toISOString()
    });
    return true;
  } catch (err: any) {
    console.warn('[FirestorePersistence] Erro ao persistir investimentos:', err.message);
    return false;
  }
}

export async function saveLeadsToFirestore(leads: Record<string, LeadRecord>): Promise<boolean> {
  const db = getRemoteFirestore();
  if (!db) return false;

  try {
    const cleanLeads = JSON.parse(JSON.stringify(leads || {}));
    await setDoc(doc(db, 'app_data', 'leads'), {
      items: cleanLeads,
      _count: Object.keys(cleanLeads).length,
      _persisted_at: new Date().toISOString()
    });
    return true;
  } catch (err: any) {
    console.warn('[FirestorePersistence] Erro ao persistir leads:', err.message);
    return false;
  }
}

export async function saveAllAppDataToFirestore(data: {
  config: ChatwootConfig;
  investments: InvestmentRecord[];
  leads: Record<string, LeadRecord>;
}): Promise<boolean> {
  const [resConfig, resInv, resLeads] = await Promise.all([
    saveConfigToFirestore(data.config),
    saveInvestmentsToFirestore(data.investments),
    saveLeadsToFirestore(data.leads)
  ]);
  return resConfig && resInv && resLeads;
}
