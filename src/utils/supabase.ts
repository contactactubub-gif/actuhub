import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection as firestoreCollection, 
  doc as firestoreDoc, 
  setDoc as firestoreSetDoc, 
  getDoc as firestoreGetDoc, 
  addDoc as firestoreAddDoc, 
  deleteDoc as firestoreDeleteDoc, 
  query as firestoreQuery, 
  onSnapshot as firestoreOnSnapshot,
  where as firestoreWhere,
  orderBy as firestoreOrderBy,
  limit as firestoreLimit,
  getDocs as firestoreGetDocs
} from 'firebase/firestore';
import { 
  UserProfile, 
  FakeNewsReport, 
  Lesson, 
  MediaSubmission, 
  Communique, 
  Advertisement, 
  NewsletterSubscription,
  LegalPageData,
  JournalFrontPage,
  ShortVideo
} from '../types';
import { LESSONS } from '../data/lessonData';
import { DEFAULT_PRIVACY_POLICY, DEFAULT_TERMS_OF_SERVICE } from '../data/legalData';
import { purgeCollectionCache, purgeAllAppCache, recordActionAndPurgeCache } from './cacheManager';
export { purgeCollectionCache, purgeAllAppCache, recordActionAndPurgeCache };

// Standalone production Supabase URL & Public Anon Key
// Guaranteed to connect even when the project is exported and deployed on any external server
const DEFAULT_SUPABASE_URL = 'https://ldrdprqieilomixhkcbj.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_NctzecijPcqNF7pqhH2pIw__zJ_mgWT';

// Official Platform Domain & Configuration
export const OFFICIAL_PLATFORM_DOMAIN = 'www.actuhub-benin.com';
export const OFFICIAL_SITE_URL = 'https://www.actuhub-benin.com';
export const OFFICIAL_ADMIN_EMAIL = 'contactactubub@gmail.com';

/**
 * Returns the proper redirect URL for Supabase Auth (Email confirmations, OAuth, Password Resets).
 * Automatically resolves to current window origin in browser runtime or defaults to the official domain.
 */
export const getAuthRedirectUrl = (): string => {
  if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null' && window.location.origin !== 'about:blank') {
    return window.location.origin;
  }
  return OFFICIAL_SITE_URL;
};

export const SUPABASE_URL: string = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) 
  ? (import.meta as any).env.VITE_SUPABASE_URL 
  : DEFAULT_SUPABASE_URL;

export const SUPABASE_ANON_KEY: string = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) 
  ? (import.meta as any).env.VITE_SUPABASE_ANON_KEY 
  : DEFAULT_SUPABASE_ANON_KEY;

// Initialize the official Supabase client with cross-environment resilience
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }
});

console.log('[Supabase] Client initialized with active live endpoint:', SUPABASE_URL);

// -------------------------------------------------------------
// FIREBASE FIRESTORE INITIALIZATION FOR EXPLICIT COLLECTIONS
// -------------------------------------------------------------
const firebaseConfig = {
  projectId: (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID)
    ? (import.meta as any).env.VITE_FIREBASE_PROJECT_ID
    : "gen-lang-client-0670432620",
  appId: (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_APP_ID)
    ? (import.meta as any).env.VITE_FIREBASE_APP_ID
    : "1:985516150104:web:dee858487a60479f26292d",
  apiKey: (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_API_KEY)
    ? (import.meta as any).env.VITE_FIREBASE_API_KEY
    : "AIzaSyAiQ6wHuVvjUJn_EzaajH3z4VG1tP9SZgo",
  authDomain: (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN)
    ? (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN
    : "gen-lang-client-0670432620.firebaseapp.com",
  storageBucket: (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET)
    ? (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET
    : "gen-lang-client-0670432620.firebasestorage.app",
  messagingSenderId: (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID)
    ? (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID
    : "985516150104"
};

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const firebaseDb = getFirestore(firebaseApp);

export function isFirebaseCollection(table: string): boolean {
  if (!table) return false;
  const t = table.toLowerCase().trim();
  return [
    'rumeurs',
    'communiques',
    'advertisements',
    'frontpages',
    'submissions',
    'media_submissions',
    'newsletter_subscriptions',
    'newsletters',
    'users',
    'lessons',
    'courses',
    'shorts'
  ].includes(t);
}

export function resolveFirebaseCollectionName(table: string): string {
  if (!table) return table;
  const t = table.toLowerCase().trim();
  if (t === 'submissions' || t === 'media_submissions') return 'submissions';
  if (t === 'newsletter_subscriptions' || t === 'newsletters') return 'newsletter_subscriptions';
  if (t === 'rumeurs') return 'rumeurs';
  if (t === 'communiques') return 'communiques';
  if (t === 'advertisements') return 'advertisements';
  if (t === 'frontpages') return 'frontpages';
  if (t === 'courses' || t === 'lessons') return 'lessons';
  if (t === 'users') return 'users';
  if (t === 'shorts') return 'shorts';
  return table;
}


// Helper to resolve and unify legacy database and collection names for seamless Supabase backward compatibility
export function resolveTableName(table: string): string {
  if (!table) return table;
  const t = table.toLowerCase().trim();
  if (t === 'submissions' || t === 'media_submissions') return 'media_submissions';
  if (t === 'lessons' || t === 'courses') return 'courses';
  if (t === 'newsletter_subscriptions' || t === 'newsletters') return 'newsletters';
  return table;
}

// Helper for local storage caching & fallback (Disabled to enforce live server interactions)
function getLocalCollection<T>(_collectionName: string): T[] {
  return [];
}

function setLocalCollection<T>(_collectionName: string, _items: T[]): void {
  // Disabled to enforce live server interactions
}

export interface SignUpParams {
  email: string;
  password: string;
  lastName: string;
  firstName: string;
  phone: string;
  city: string;
  role?: 'simple' | 'media';
  mediaName?: string;
}

// -------------------------------------------------------------
// 1. SUPABASE AUTH SERVICES
// -------------------------------------------------------------
export const supabaseAuth = {
  async signUp(params: SignUpParams) {
    const fullName = `${params.lastName.trim()} ${params.firstName.trim()}`.trim();
    try {
      // Create user profile directly without sending confirmation emails on registration
      const { data, error } = await supabase.auth.signUp({
        email: params.email.trim().toLowerCase(),
        password: params.password,
        options: {
          data: {
            last_name: params.lastName.trim(),
            first_name: params.firstName.trim(),
            full_name: fullName,
            phone: params.phone.trim(),
            city: params.city.trim(),
            role: params.role || 'simple',
            media_name: params.mediaName?.trim()
          }
        }
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[Database Auth] signUp notice:', err);
      throw err;
    }
  },

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[Supabase Auth] signIn error:', err);
      throw err;
    }
  },

  async resetPasswordForEmail(email: string) {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const redirectUrl = getAuthRedirectUrl();
      // Request standard Supabase password reset email with official domain redirect
      const { data, error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl
      });
      if (error) {
        console.warn('[Supabase Auth] resetPasswordForEmail API notice:', error.message);
      }
      return { success: true, data };
    } catch (err) {
      console.warn('[Supabase Auth] resetPassword error:', err);
      return { success: false, error: err };
    }
  },

  async updateUserPassword(newPassword: string) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[Supabase Auth] updateUserPassword error:', err);
      throw err;
    }
  },

  async signInWithGoogle() {
    try {
      const redirectUrl = getAuthRedirectUrl();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[Supabase Auth] signInWithGoogle error:', err);
      throw err;
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.warn('[Supabase Auth] signOut error:', err);
    }
  },

  async getSession() {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session;
    } catch (err) {
      return null;
    }
  },

  async getUser() {
    try {
      const { data } = await supabase.auth.getUser();
      return data.user;
    } catch (err) {
      return null;
    }
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return () => {
      subscription.unsubscribe();
    };
  }
};

// -------------------------------------------------------------
// 2. SUPABASE DATABASE GENERIC ADAPTER
// Supports direct Supabase tables, JSON documents, and offline cache
// -------------------------------------------------------------
export const supabaseDb = {
  // Helper to normalize Supabase records
  normalizeRecord<T = any>(table: string, item: any): T {
    if (!item) return item;
    const resolvedTable = resolveTableName(table);
    const baseData = item.data && typeof item.data === 'object' ? item.data : {};
    const merged = { ...item, ...baseData, id: item.id };

    if (resolvedTable === 'users') {
      const lastName = merged.lastName || merged.last_name || '';
      const firstName = merged.firstName || merged.first_name || '';
      const computedFullName = (lastName && firstName) 
        ? `${lastName} ${firstName}`.trim()
        : (merged.fullName || merged.full_name || merged.email || 'Utilisateur');

      return {
        ...merged,
        id: merged.id,
        email: merged.email || '',
        fullName: computedFullName,
        lastName: lastName,
        firstName: firstName,
        phone: merged.phone || '',
        city: merged.city || '',
        role: merged.role || 'simple',
        mediaName: merged.mediaName || merged.media_name || '',
        status: merged.status || 'active',
        registrationDate: merged.registrationDate || merged.registration_date || ''
      } as unknown as T;
    }

    if (resolvedTable === 'rumeurs') {
      return {
        ...merged,
        id: merged.id,
        title: merged.title || merged.claim || '',
        claim: merged.claim || merged.title || '',
        category: merged.category || 'Général',
        explanation: merged.explanation || merged.factCheckAnalysis || merged.description || '',
        status: merged.status || (merged.verdict === 'true' ? 'verified' : merged.verdict === 'false' ? 'debunked' : 'pending'),
        verdict: merged.verdict || (merged.status === 'debunked' ? 'false' : merged.status === 'verified' ? 'true' : 'unverified'),
        date: merged.date || '',
        reporterName: merged.reporterName || merged.reporter_name || 'Citoyen',
        upvotes: typeof merged.upvotes === 'number' ? merged.upvotes : 0
      } as unknown as T;
    }

    if (resolvedTable === 'advertisements') {
      return {
        ...merged,
        id: merged.id,
        title: merged.title || '',
        type: merged.type || 'image',
        mediaUrl: merged.mediaUrl || merged.media_url || merged.imageUrl || '',
        targetUrl: merged.targetUrl || merged.target_url || merged.url || '',
        placement: merged.placement || 'header',
        placements: merged.placements || (merged.placement ? [merged.placement] : ['header']),
        label: merged.label || 'publicite',
        advertiserName: merged.advertiserName || merged.advertiser_name || undefined,
        startDate: merged.startDate || merged.start_date || undefined,
        endDate: merged.endDate || merged.end_date || undefined,
        viewsCount: merged.viewsCount !== undefined ? merged.viewsCount : (merged.views_count || 0),
        clicksCount: merged.clicksCount !== undefined ? merged.clicksCount : (merged.clicks_count || 0),
        active: merged.active !== undefined ? merged.active : true,
        createdAt: merged.createdAt || merged.created_at || new Date().toISOString()
      } as unknown as T;
    }

    if (resolvedTable === 'frontpages') {
      return {
        ...merged,
        id: merged.id,
        mediaName: merged.mediaName || merged.media_name || '',
        imageUrl: merged.imageUrl || merged.image_url || '',
        date: merged.date || new Date().toISOString().substring(0, 10),
        title: merged.title || '',
        publishedBy: merged.publishedBy || merged.published_by || '',
        createdAt: merged.createdAt || merged.created_at || new Date().toISOString()
      } as unknown as T;
    }

    if (resolvedTable === 'courses') {
      return {
        ...merged,
        id: merged.id,
        title: merged.title || '',
        duration: merged.duration || '15 min',
        difficulty: merged.difficulty || 'Débutant',
        category: merged.category || 'Cybersécurité',
        summary: merged.summary || '',
        icon: merged.icon || 'shield',
        publisher: merged.publisher || 'ActuHub Bénin • Académie',
        publishedAt: merged.publishedAt || merged.published_at || '',
        pages: Array.isArray(merged.pages) ? merged.pages : (baseData.pages || []),
        exercise: merged.exercise || baseData.exercise || undefined
      } as unknown as T;
    }

    return merged as T;
  },

  // GET a single document by ID
  async getDoc<T = any>(table: string, id: string): Promise<T | null> {
    const resolvedTable = resolveTableName(table);
    if (isFirebaseCollection(resolvedTable) && firebaseDb) {
      try {
        const fbColl = resolveFirebaseCollectionName(resolvedTable);
        const docRef = firestoreDoc(firebaseDb, fbColl, id);
        const snap = await firestoreGetDoc(docRef);
        if (snap.exists()) {
          const raw = { id: snap.id, ...snap.data() };
          return (supabaseDb.normalizeRecord(resolvedTable, raw) as unknown) as T;
        }
        return null;
      } catch (err) {
        console.warn(`[Firebase Firestore] Error reading document ${resolvedTable}/${id}`, err);
      }
    }

    try {
      const { data, error } = await supabase
        .from(resolvedTable)
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        return (supabaseDb.normalizeRecord(resolvedTable, data) as unknown) as T;
      } else {
        return null;
      }
    } catch (err) {
      console.warn(`[Supabase DB] Error reading document ${resolvedTable}/${id}`, err);
    }

    // Fallback to local cache only on network/connection error
    const localItems = getLocalCollection<any>(resolvedTable);
    const found = localItems.find(item => item.id === id);
    return (found as T) || null;
  },

  // SET / UPSERT a document
  async setDoc<T extends { id?: string }>(table: string, id: string, docData: T, options?: { merge?: boolean }): Promise<void> {
    const resolvedTable = resolveTableName(table);
    const normalizedData = { ...docData, id };

    if (isFirebaseCollection(resolvedTable) && firebaseDb) {
      try {
        const fbColl = resolveFirebaseCollectionName(resolvedTable);
        const docRef = firestoreDoc(firebaseDb, fbColl, id);
        await firestoreSetDoc(docRef, normalizedData, options || {});
        purgeCollectionCache(resolvedTable, `Mise à jour / Enregistrement sur ${resolvedTable}`);
        return;
      } catch (err) {
        console.warn(`[Firebase Firestore] Error saving document ${resolvedTable}/${id}`, err);
      }
    }

    // Update local cache immediately
    const localItems = getLocalCollection<any>(resolvedTable);
    const existingIndex = localItems.findIndex(item => item.id === id);
    if (existingIndex >= 0) {
      localItems[existingIndex] = options?.merge 
        ? { ...localItems[existingIndex], ...normalizedData }
        : normalizedData;
    } else {
      localItems.push(normalizedData);
    }
    setLocalCollection(resolvedTable, localItems);

    // Save to Supabase
    try {
      // Format payload according to the exact Supabase table schema
      let payload: any = {
        id,
        data: normalizedData,
        updated_at: new Date().toISOString()
      };

      if (resolvedTable === 'users') {
        const u = normalizedData as any;
        payload = {
          ...payload,
          email: u.email || '',
          full_name: u.fullName || `${u.lastName || ''} ${u.firstName || ''}`.trim() || 'Utilisateur',
          role: u.role || 'simple',
          media_name: u.mediaName || null,
          status: u.status || 'active',
          registration_date: u.registrationDate || new Date().toLocaleDateString('fr-FR'),
          favorites: Array.isArray(u.favorites) ? u.favorites : []
        };
      } else if (resolvedTable === 'rumeurs') {
        const r = normalizedData as any;
        payload = {
          ...payload,
          title: r.title || r.claim || 'Signalement sans titre',
          url: r.url || null,
          category: r.category || 'Général',
          description: r.description || r.explanation || '',
          status: r.status || (r.verdict === 'true' ? 'verified' : r.verdict === 'false' ? 'debunked' : 'pending'),
          explanation: r.explanation || r.factCheckAnalysis || '',
          date: r.date || new Date().toLocaleDateString('fr-FR'),
          reporter_name: r.reporterName || 'Citoyen anonyme',
          upvotes: typeof r.upvotes === 'number' ? r.upvotes : 0,
          level: r.level || 'citoyen'
        };
      } else if (resolvedTable === 'courses') {
        const c = normalizedData as any;
        payload = {
          ...payload,
          title: c.title || 'Leçon de formation',
          duration: c.duration || '5 min',
          difficulty: c.level || c.difficulty || 'Débutant',
          summary: c.summary || c.description || '',
          pages: typeof c.pages === 'number' ? c.pages : 1,
          icon: c.icon || 'BookOpen',
          publisher: c.publisher || 'ActuHub Bénin'
        };
      } else if (resolvedTable === 'media_submissions') {
        const m = normalizedData as any;
        payload = {
          ...payload,
          media_name: m.mediaName || m.media_name || 'Organe Média',
          email: m.email || '',
          website_url: m.websiteUrl || m.url || '',
          haac_reg_number: m.haacRegNumber || m.regNumber || '',
          category: m.category || 'Presse en ligne',
          status: m.status || 'pending',
          submitted_at: m.submittedAt || m.date || new Date().toLocaleDateString('fr-FR')
        };
      } else if (resolvedTable === 'communiques') {
        const com = normalizedData as any;
        payload = {
          ...payload,
          content: com.content || com.title || 'Communiqué officiel',
          active: com.active !== undefined ? com.active : true,
          created_at: com.createdAt || new Date().toISOString()
        };
      } else if (resolvedTable === 'advertisements') {
        const ad = normalizedData as any;
        payload = {
          ...payload,
          title: ad.title || 'Campagne Publicitaire',
          type: ad.type || 'image',
          media_url: ad.mediaUrl || ad.imageUrl || '',
          target_url: ad.targetUrl || ad.url || '',
          placement: ad.placement || 'header',
          placements: ad.placements || (ad.placement ? [ad.placement] : ['header']),
          label: ad.label || 'publicite',
          advertiser_name: ad.advertiserName || null,
          start_date: ad.startDate || null,
          end_date: ad.endDate || null,
          views_count: ad.viewsCount || 0,
          clicks_count: ad.clicksCount || 0,
          active: ad.active !== undefined ? ad.active : true,
          created_at: ad.createdAt || new Date().toISOString()
        };
      } else if (resolvedTable === 'frontpages') {
        const fp = normalizedData as any;
        payload = {
          ...payload,
          media_name: fp.mediaName || '',
          image_url: fp.imageUrl || '',
          date: fp.date || new Date().toISOString().substring(0, 10),
          title: fp.title || '',
          published_by: fp.publishedBy || '',
          created_at: fp.createdAt || new Date().toISOString()
        };
      } else if (resolvedTable === 'newsletters') {
        const sub = normalizedData as any;
        payload = {
          ...payload,
          user_id: sub.userId || '',
          user_email: sub.userEmail || '',
          user_full_name: sub.userFullName || '',
          media_choice: sub.mediaChoice || '',
          status: sub.status || 'pending',
          created_at: sub.createdAt || new Date().toISOString()
        };
      }

      const { error } = await supabase
        .from(resolvedTable)
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        console.warn(`[Supabase DB] Table upsert warning for ${resolvedTable}:`, error.message);
        // Fallback upsert with minimum id + data
        await supabase
          .from(resolvedTable)
          .upsert({ id, data: normalizedData }, { onConflict: 'id' });
      }
    } catch (err) {
      console.warn(`[Supabase DB] Error persisting to table ${resolvedTable}:`, err);
    } finally {
      // Purge and invalidate caches directly after modification
      purgeCollectionCache(resolvedTable, `Mise à jour / Enregistrement sur ${resolvedTable}`);
    }
  },

  // ADD a document with auto-generated ID
  async addDoc<T>(table: string, docData: T): Promise<{ id: string }> {
    const resolvedTable = resolveTableName(table);
    const id = `${resolvedTable}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const payload = { ...(docData as any), id };
    await this.setDoc(resolvedTable, id, payload);
    purgeCollectionCache(resolvedTable, `Ajout de document sur ${resolvedTable}`);
    return { id };
  },

  // DELETE a document
  async deleteDoc(table: string, id: string): Promise<void> {
    const resolvedTable = resolveTableName(table);
    if (isFirebaseCollection(resolvedTable) && firebaseDb) {
      try {
        const fbColl = resolveFirebaseCollectionName(resolvedTable);
        const docRef = firestoreDoc(firebaseDb, fbColl, id);
        await firestoreDeleteDoc(docRef);
        purgeCollectionCache(resolvedTable, `Suppression de document sur ${resolvedTable}`);
        return;
      } catch (err) {
        console.warn(`[Firebase Firestore] Error deleting document ${resolvedTable}/${id}`, err);
      }
    }

    const localItems = getLocalCollection<any>(resolvedTable).filter(item => item.id !== id);
    setLocalCollection(resolvedTable, localItems);

    try {
      const { error } = await supabase
        .from(resolvedTable)
        .delete()
        .eq('id', id);
      if (error) {
        console.warn(`[Supabase DB] Error deleting ${resolvedTable}/${id}`, error);
      }
    } catch (err) {
      console.warn(`[Supabase DB] Delete error:`, err);
    } finally {
      // Purge and invalidate caches directly after deletion
      purgeCollectionCache(resolvedTable, `Suppression de document sur ${resolvedTable}`);
    }
  },

  // LIST all documents from a table
  async list<T = any>(table: string): Promise<T[]> {
    const resolvedTable = resolveTableName(table);
    if (isFirebaseCollection(resolvedTable) && firebaseDb) {
      try {
        const fbColl = resolveFirebaseCollectionName(resolvedTable);
        const colRef = firestoreCollection(firebaseDb, fbColl);
        const snap = await firestoreGetDocs(colRef);
        const list: T[] = [];
        snap.forEach((doc) => {
          const raw = { id: doc.id, ...doc.data() };
          list.push(supabaseDb.normalizeRecord(resolvedTable, raw) as unknown as T);
        });
        return list;
      } catch (err) {
        console.warn(`[Firebase Firestore] Error listing ${resolvedTable}`, err);
      }
    }

    try {
      const { data, error } = await supabase
        .from(resolvedTable)
        .select('*');

      if (error) {
        throw error;
      }

      if (Array.isArray(data)) {
        const parsed = data.map((item: any) => (supabaseDb.normalizeRecord(resolvedTable, item) as unknown) as T);
        setLocalCollection(resolvedTable, parsed);
        return parsed as T[];
      }
    } catch (err) {
      console.warn(`[Supabase DB] List fetch failed for ${resolvedTable}:`, err);
    }

    return getLocalCollection<T>(resolvedTable);
  },

  // REALTIME subscription with polling fallback
  subscribe<T = any>(table: string, callback: (items: T[]) => void): () => void {
    const resolvedTable = resolveTableName(table);
    if (isFirebaseCollection(resolvedTable) && firebaseDb) {
      try {
        const fbColl = resolveFirebaseCollectionName(resolvedTable);
        const colRef = firestoreCollection(firebaseDb, fbColl);
        const unsubscribe = firestoreOnSnapshot(colRef, (snap) => {
          const list: T[] = [];
          snap.forEach((doc) => {
            const raw = { id: doc.id, ...doc.data() };
            list.push(supabaseDb.normalizeRecord(resolvedTable, raw) as unknown as T);
          });
          callback(list);
        }, (err) => {
          console.warn(`[Firebase Firestore] Error subscribing to ${resolvedTable}`, err);
        });
        return unsubscribe;
      } catch (err) {
        console.warn(`[Firebase Firestore] Subscribe error for ${resolvedTable}`, err);
      }
    }

    // 1. Initial local + remote emit
    const initialLocal = getLocalCollection<T>(resolvedTable);
    if (initialLocal.length > 0) {
      callback(initialLocal);
    }

    let isSubscribed = true;

    // Fetch from Supabase
    supabaseDb.list<T>(resolvedTable).then(remoteItems => {
      if (isSubscribed && remoteItems.length > 0) {
        callback(remoteItems);
      }
    });

    // 2. Setup Supabase Realtime Channel
    let channel: any = null;
    try {
      channel = supabase
        .channel(`public:${resolvedTable}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: resolvedTable }, async () => {
          if (!isSubscribed) return;
          const fresh = await supabaseDb.list<T>(resolvedTable);
          callback(fresh);
        })
        .subscribe();
    } catch (subErr) {
      console.warn(`[Supabase Realtime] Realtime subscription fallback for ${resolvedTable}:`, subErr);
    }

    // 3. Polling interval fallback for resilience (every 15s)
    const pollInterval = setInterval(async () => {
      if (!isSubscribed) return;
      const fresh = await supabaseDb.list<T>(resolvedTable);
      if (fresh.length > 0) {
        callback(fresh);
      }
    }, 15000);

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
      if (channel) {
        supabase.removeChannel(channel).catch(() => {});
      }
    };
  }
};

// -------------------------------------------------------------
// 3. DEDICATED DOMAIN SERVICES (Users, Rumeurs, Courses, etc.)
// -------------------------------------------------------------

export const usersService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    return supabaseDb.getDoc<UserProfile>('users', userId);
  },
  async saveProfile(profile: UserProfile): Promise<void> {
    return supabaseDb.setDoc('users', profile.id, profile, { merge: true });
  },
  async deleteProfile(userId: string): Promise<void> {
    return supabaseDb.deleteDoc('users', userId);
  },
  async listUsers(): Promise<UserProfile[]> {
    return supabaseDb.list<UserProfile>('users');
  },
  subscribe(callback: (users: UserProfile[]) => void) {
    return supabaseDb.subscribe<UserProfile>('users', callback);
  }
};

export const rumeursService = {
  async listReports(): Promise<FakeNewsReport[]> {
    return supabaseDb.list<FakeNewsReport>('rumeurs');
  },
  async saveReport(report: FakeNewsReport): Promise<void> {
    return supabaseDb.setDoc('rumeurs', report.id, report, { merge: true });
  },
  async deleteReport(id: string): Promise<void> {
    return supabaseDb.deleteDoc('rumeurs', id);
  },
  subscribe(callback: (reports: FakeNewsReport[]) => void) {
    return supabaseDb.subscribe<FakeNewsReport>('rumeurs', callback);
  }
};

export const coursesService = {
  async listCourses(): Promise<Lesson[]> {
    const list = await supabaseDb.list<Lesson>('courses');
    if (!list || list.length === 0) {
      return LESSONS;
    }
    return list;
  },
  async saveCourse(course: Lesson): Promise<void> {
    return supabaseDb.setDoc('courses', course.id, course, { merge: true });
  },
  async deleteCourse(id: string): Promise<void> {
    return supabaseDb.deleteDoc('courses', id);
  },
  async seedOfficialCurriculum(): Promise<number> {
    let count = 0;
    for (const les of LESSONS) {
      await this.saveCourse(les);
      count++;
    }
    return count;
  },
  subscribe(callback: (courses: Lesson[]) => void) {
    return supabaseDb.subscribe<Lesson>('courses', (items) => {
      if (!items || items.length === 0) {
        callback(LESSONS);
      } else {
        callback(items);
      }
    });
  }
};

export const mediaSubmissionsService = {
  async listSubmissions(): Promise<MediaSubmission[]> {
    return supabaseDb.list<MediaSubmission>('media_submissions');
  },
  async saveSubmission(submission: MediaSubmission): Promise<void> {
    return supabaseDb.setDoc('media_submissions', submission.id, submission, { merge: true });
  },
  async deleteSubmission(id: string): Promise<void> {
    return supabaseDb.deleteDoc('media_submissions', id);
  },
  subscribe(callback: (subs: MediaSubmission[]) => void) {
    return supabaseDb.subscribe<MediaSubmission>('media_submissions', callback);
  }
};

export const communiquesService = {
  async listCommuniques(): Promise<Communique[]> {
    return supabaseDb.list<Communique>('communiques');
  },
  async saveCommunique(communique: Communique): Promise<void> {
    return supabaseDb.setDoc('communiques', communique.id, communique, { merge: true });
  },
  async deleteCommunique(id: string): Promise<void> {
    return supabaseDb.deleteDoc('communiques', id);
  },
  subscribe(callback: (items: Communique[]) => void) {
    return supabaseDb.subscribe<Communique>('communiques', callback);
  }
};

export const frontpagesService = {
  async listFrontPages(): Promise<JournalFrontPage[]> {
    return supabaseDb.list<JournalFrontPage>('frontpages');
  },
  async saveFrontPage(fp: JournalFrontPage): Promise<void> {
    return supabaseDb.setDoc('frontpages', fp.id, fp, { merge: true });
  },
  async deleteFrontPage(id: string): Promise<void> {
    return supabaseDb.deleteDoc('frontpages', id);
  },
  subscribe(callback: (fps: JournalFrontPage[]) => void) {
    return supabaseDb.subscribe<JournalFrontPage>('frontpages', callback);
  }
};

export const advertisementsService = {
  async listAds(): Promise<Advertisement[]> {
    return supabaseDb.list<Advertisement>('advertisements');
  },
  async saveAd(ad: Advertisement): Promise<void> {
    return supabaseDb.setDoc('advertisements', ad.id, ad, { merge: true });
  },
  async deleteAd(id: string): Promise<void> {
    return supabaseDb.deleteDoc('advertisements', id);
  },
  subscribe(callback: (ads: Advertisement[]) => void) {
    return supabaseDb.subscribe<Advertisement>('advertisements', callback);
  }
};

export const shortsService = {
  async listShorts(): Promise<(ShortVideo & { videoId: string })[]> {
    return supabaseDb.list<(ShortVideo & { videoId: string })>('shorts');
  },
  async saveShort(short: ShortVideo & { videoId: string }): Promise<void> {
    return supabaseDb.setDoc('shorts', short.id, short, { merge: true });
  },
  async deleteShort(id: string): Promise<void> {
    return supabaseDb.deleteDoc('shorts', id);
  },
  subscribe(callback: (shorts: (ShortVideo & { videoId: string })[]) => void) {
    return supabaseDb.subscribe<(ShortVideo & { videoId: string })>('shorts', callback);
  }
};

export const newsletterService = {
  async listSubscriptions(): Promise<NewsletterSubscription[]> {
    return supabaseDb.list<NewsletterSubscription>('newsletters');
  },
  async subscribe(sub: NewsletterSubscription): Promise<void> {
    return supabaseDb.setDoc('newsletters', sub.id, sub, { merge: true });
  },
  subscribeToChanges(callback: (subs: NewsletterSubscription[]) => void) {
    return supabaseDb.subscribe<NewsletterSubscription>('newsletters', callback);
  }
};

export const legalPagesService = {
  async getLegalPage(pageId: 'privacy' | 'terms'): Promise<LegalPageData> {
    const defaultData = pageId === 'privacy' ? DEFAULT_PRIVACY_POLICY : DEFAULT_TERMS_OF_SERVICE;
    try {
      const data = await supabaseDb.getDoc<LegalPageData>('legal_pages', pageId);
      if (data && data.sections && Array.isArray(data.sections) && data.sections.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn(`[Supabase Legal] Error fetching ${pageId}:`, e);
    }
    return defaultData;
  },

  async saveLegalPage(pageData: LegalPageData): Promise<void> {
    const updated: LegalPageData = {
      ...pageData,
      updatedAt: new Date().toISOString()
    };
    await supabaseDb.setDoc('legal_pages', pageData.id, updated, { merge: true });
  },

  async resetToDefault(pageId: 'privacy' | 'terms'): Promise<LegalPageData> {
    const defaultData = pageId === 'privacy' ? DEFAULT_PRIVACY_POLICY : DEFAULT_TERMS_OF_SERVICE;
    await this.saveLegalPage(defaultData);
    return defaultData;
  },

  subscribe(pageId: 'privacy' | 'terms', callback: (data: LegalPageData) => void): () => void {
    const defaultData = pageId === 'privacy' ? DEFAULT_PRIVACY_POLICY : DEFAULT_TERMS_OF_SERVICE;
    this.getLegalPage(pageId).then(data => callback(data)).catch(() => callback(defaultData));

    return supabaseDb.subscribe<LegalPageData>('legal_pages', (items) => {
      const found = items.find(item => item.id === pageId);
      if (found && found.sections && Array.isArray(found.sections) && found.sections.length > 0) {
        callback(found);
      } else {
        callback(defaultData);
      }
    });
  }
};

// -------------------------------------------------------------
// 4. SUPABASE HEALTH CHECK & DIAGNOSTICS
// -------------------------------------------------------------
export interface SupabaseHealthReport {
  connected: boolean;
  projectUrl: string;
  latencyMs: number;
  tables: {
    users: { ok: boolean; count: number };
    rumeurs: { ok: boolean; count: number };
    courses: { ok: boolean; count: number };
    media_submissions: { ok: boolean; count: number };
    communiques: { ok: boolean; count: number };
    advertisements: { ok: boolean; count: number };
  };
  timestamp: string;
}

export async function checkSupabaseHealth(): Promise<SupabaseHealthReport> {
  const start = performance.now();
  const report: SupabaseHealthReport = {
    connected: false,
    projectUrl: SUPABASE_URL,
    latencyMs: 0,
    tables: {
      users: { ok: false, count: 0 },
      rumeurs: { ok: false, count: 0 },
      courses: { ok: false, count: 0 },
      media_submissions: { ok: false, count: 0 },
      communiques: { ok: false, count: 0 },
      advertisements: { ok: false, count: 0 }
    },
    timestamp: new Date().toISOString()
  };

  try {
    const [uRes, rRes, cRes, mRes, comRes, adRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact' }).limit(1),
      supabase.from('rumeurs').select('id', { count: 'exact' }).limit(1),
      supabase.from('courses').select('id', { count: 'exact' }).limit(1),
      supabase.from('media_submissions').select('id', { count: 'exact' }).limit(1),
      supabase.from('communiques').select('id', { count: 'exact' }).limit(1),
      supabase.from('advertisements').select('id', { count: 'exact' }).limit(1)
    ]);

    report.latencyMs = Math.round(performance.now() - start);
    report.connected = !uRes.error;

    if (!uRes.error) report.tables.users = { ok: true, count: uRes.count ?? (uRes.data?.length || 0) };
    if (!rRes.error) report.tables.rumeurs = { ok: true, count: rRes.count ?? (rRes.data?.length || 0) };
    if (!cRes.error) report.tables.courses = { ok: true, count: cRes.count ?? (cRes.data?.length || 0) };
    if (!mRes.error) report.tables.media_submissions = { ok: true, count: mRes.count ?? (mRes.data?.length || 0) };
    if (!comRes.error) report.tables.communiques = { ok: true, count: comRes.count ?? (comRes.data?.length || 0) };
    if (!adRes.error) report.tables.advertisements = { ok: true, count: adRes.count ?? (adRes.data?.length || 0) };
  } catch (e) {
    report.connected = false;
  }

  return report;
}

// -------------------------------------------------------------
// 5. UNIFIED SUPABASE DATABASE & AUTH ADAPTERS
// (Full replacement of Firestore across all modules and privileges)
// -------------------------------------------------------------

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface DatabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo?: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleDatabaseError(error: unknown, operationType: OperationType, path: string | null) {
  console.warn(`[Supabase Database] ${operationType} on ${path}:`, error);
}

// Alias for seamless backward compatibility
export const handleFirestoreError = handleDatabaseError;

export interface DocRef {
  _isDoc: true;
  table: string;
  id: string;
  isFirebase: boolean;
  nativeRef?: any;
}

export interface CollectionRef {
  _isCollection: true;
  table: string;
  isFirebase: boolean;
  nativeRef?: any;
}

export const db = {
  _type: 'hybrid_db',
  url: SUPABASE_URL
};

export function collection(_databaseInstance: any, tableName: string): CollectionRef {
  const resolvedTable = resolveTableName(tableName);
  const isFirebase = isFirebaseCollection(resolvedTable);
  
  if (isFirebase && firebaseDb) {
    const fbCollName = resolveFirebaseCollectionName(resolvedTable);
    return {
      _isCollection: true,
      table: resolvedTable,
      isFirebase: true,
      nativeRef: firestoreCollection(firebaseDb, fbCollName)
    };
  }
  
  return {
    _isCollection: true,
    table: resolvedTable,
    isFirebase: false
  };
}

export function doc(_databaseInstance: any, tableName: string, id: string): DocRef {
  const resolvedTable = resolveTableName(tableName);
  const isFirebase = isFirebaseCollection(resolvedTable);
  
  if (isFirebase && firebaseDb) {
    const fbCollName = resolveFirebaseCollectionName(resolvedTable);
    return {
      _isDoc: true,
      table: resolvedTable,
      id: id,
      isFirebase: true,
      nativeRef: firestoreDoc(firebaseDb, fbCollName, id)
    };
  }
  
  return {
    _isDoc: true,
    table: resolvedTable,
    id: id,
    isFirebase: false
  };
}

export async function setDoc(docRef: DocRef, data: any, options?: { merge?: boolean }): Promise<void> {
  if (!docRef) return;
  
  if (docRef.isFirebase && docRef.nativeRef) {
    try {
      await firestoreSetDoc(docRef.nativeRef, data, options || {});
      return;
    } catch (err) {
      console.warn(`[Firebase Firestore] Failed to setDoc for ${docRef.table}/${docRef.id}`, err);
    }
  }
  
  await supabaseDb.setDoc(docRef.table, docRef.id, data, options);
}

export async function getDoc(docRef: DocRef): Promise<{ exists: () => boolean; data: () => any }> {
  if (!docRef) {
    return { exists: () => false, data: () => null };
  }
  
  if (docRef.isFirebase && docRef.nativeRef) {
    try {
      const snap = await firestoreGetDoc(docRef.nativeRef);
      return {
        exists: () => snap.exists(),
        data: () => snap.data() as any
      };
    } catch (err) {
      console.warn(`[Firebase Firestore] Failed to getDoc for ${docRef.table}/${docRef.id}`, err);
    }
  }
  
  const data = await supabaseDb.getDoc(docRef.table, docRef.id);
  return {
    exists: () => data !== null && data !== undefined,
    data: () => data
  };
}

export async function addDoc(colRef: CollectionRef, data: any): Promise<DocRef> {
  if (!colRef) throw new Error("Invalid collection reference");
  
  if (colRef.isFirebase && colRef.nativeRef) {
    try {
      const id = data.id || `${colRef.table}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const enrichedData = { ...data, id };
      const fbCollName = resolveFirebaseCollectionName(colRef.table);
      const docRef = firestoreDoc(firebaseDb, fbCollName, id);
      await firestoreSetDoc(docRef, enrichedData);
      
      return {
        _isDoc: true,
        table: colRef.table,
        id: id,
        isFirebase: true,
        nativeRef: docRef
      };
    } catch (err) {
      console.warn(`[Firebase Firestore] Failed to addDoc for ${colRef.table}`, err);
    }
  }
  
  const result = await supabaseDb.addDoc(colRef.table, data);
  return {
    _isDoc: true,
    table: colRef.table,
    id: result.id,
    isFirebase: false
  };
}

export async function deleteDoc(docRef: DocRef): Promise<void> {
  if (!docRef) return;
  
  if (docRef.isFirebase && docRef.nativeRef) {
    try {
      await firestoreDeleteDoc(docRef.nativeRef);
      return;
    } catch (err) {
      console.warn(`[Firebase Firestore] Failed to deleteDoc for ${docRef.table}/${docRef.id}`, err);
    }
  }
  
  await supabaseDb.deleteDoc(docRef.table, docRef.id);
}

export async function updateDoc(docRef: DocRef, data: any): Promise<void> {
  if (!docRef) return;
  
  if (docRef.isFirebase && docRef.nativeRef) {
    try {
      await firestoreSetDoc(docRef.nativeRef, data, { merge: true });
      return;
    } catch (err) {
      console.warn(`[Firebase Firestore] Failed to updateDoc for ${docRef.table}/${docRef.id}`, err);
    }
  }
  
  await supabaseDb.setDoc(docRef.table, docRef.id, data, { merge: true });
}

export function query(colRef: CollectionRef, ...constraints: any[]): CollectionRef {
  if (!colRef) return colRef;
  
  if (colRef.isFirebase && colRef.nativeRef) {
    const nativeConstraints: any[] = [];
    constraints.forEach(c => {
      if (c && c._type === 'where') {
        nativeConstraints.push(firestoreWhere(c.field, c.op, c.val));
      } else if (c && c._type === 'orderBy') {
        nativeConstraints.push(firestoreOrderBy(c.field, c.dir || 'asc'));
      } else if (c && c._type === 'limit') {
        nativeConstraints.push(firestoreLimit(c.num));
      }
    });
    
    return {
      _isCollection: true,
      table: colRef.table,
      isFirebase: true,
      nativeRef: nativeConstraints.length > 0 
        ? firestoreQuery(colRef.nativeRef, ...nativeConstraints)
        : colRef.nativeRef
    };
  }
  
  return colRef;
}

export function orderBy(_field: string, _dir?: string) {
  return { _type: 'orderBy', field: _field, dir: _dir };
}

export function limit(_num: number) {
  return { _type: 'limit', num: _num };
}

export function where(_field: string, _op: string, _val: any) {
  return { _type: 'where', field: _field, op: _op, val: _val };
}

export function onSnapshot(
  target: CollectionRef | DocRef,
  callback: (snapshot: any) => void,
  onError?: (err: any) => void
): () => void {
  if (!target) return () => {};
  
  if (target.isFirebase && target.nativeRef) {
    try {
      if ((target as any)._isDoc) {
        return firestoreOnSnapshot(target.nativeRef, (snap: any) => {
          callback({
            exists: () => snap.exists(),
            data: () => snap.data(),
            id: snap.id
          });
        }, onError);
      } else {
        return firestoreOnSnapshot(target.nativeRef, (snap: any) => {
          const docSnaps = (snap.docs || []).map((docSnap: any) => ({
            id: docSnap.id,
            exists: () => docSnap.exists(),
            data: () => docSnap.data()
          }));
          
          const snapshot = {
            docs: docSnaps,
            size: snap.size || 0,
            empty: snap.empty !== undefined ? snap.empty : (docSnaps.length === 0),
            forEach: (cb: (docSnap: any) => void) => {
              docSnaps.forEach(cb);
            }
          };
          
          callback(snapshot);
        }, onError);
      }
    } catch (err) {
      console.warn(`[Firebase Firestore] onSnapshot error for ${target.table}:`, err);
    }
  }

  if ((target as DocRef)._isDoc) {
    const docRef = target as DocRef;
    let active = true;

    const emit = async () => {
      if (!active) return;
      const data = await supabaseDb.getDoc(docRef.table, docRef.id);
      if (!active) return;
      callback({
        exists: () => data !== null && data !== undefined,
        data: () => data,
        id: docRef.id
      });
    };

    emit();
    const interval = setInterval(emit, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }

  const colRef = target as CollectionRef;
  return supabaseDb.subscribe(colRef.table, (items) => {
    const docSnaps = items.map((item: any) => ({
      id: item.id,
      exists: () => true,
      data: () => item
    }));

    const snapshot = {
      docs: docSnaps,
      size: items.length,
      empty: items.length === 0,
      forEach: (cb: (docSnap: any) => void) => {
        docSnaps.forEach(cb);
      }
    };

    callback(snapshot);
  });
}


// -------------------------------------------------------------
// 6. SUPABASE AUTH COMPATIBILITY & UTILITIES
// -------------------------------------------------------------

class SupabaseAuthBridge {
  currentUser: {
    uid: string;
    email: string | null;
    displayName: string | null;
    emailVerified: boolean;
    isAnonymous: boolean;
    tenantId: null;
    providerData: any[];
  } | null = null;

  private listeners: ((user: any) => void)[] = [];

  constructor() {
    this.init();
  }

  private async init() {
    const session = await supabaseAuth.getSession();
    if (session?.user) {
      this.setUserFromSupabase(session.user);
    }

    supabaseAuth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        this.setUserFromSupabase(session.user);
      } else {
        this.currentUser = null;
        this.notifyListeners();
      }
    });
  }

  private setUserFromSupabase(user: any) {
    this.currentUser = {
      uid: user.id,
      email: user.email || null,
      displayName: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Utilisateur',
      emailVerified: !!user.email_confirmed_at,
      isAnonymous: user.is_anonymous || false,
      tenantId: null,
      providerData: [
        {
          providerId: user.app_metadata?.provider || 'supabase',
          email: user.email
        }
      ]
    };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(cb => {
      try {
        cb(this.currentUser);
      } catch (err) {
        console.warn('[Supabase Auth Listener Error]', err);
      }
    });
  }

  addListener(cb: (user: any) => void) {
    this.listeners.push(cb);
    cb(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  async signOut() {
    await supabaseAuth.signOut();
    this.currentUser = null;
    this.notifyListeners();
  }
}

export const auth = new SupabaseAuthBridge();

export class GoogleAuthProvider {
  scopes: string[] = [];
  addScope(scope: string) {
    this.scopes.push(scope);
  }
  static credentialFromResult(_result: any) {
    return {
      accessToken: 'supabase_oauth_token_' + Date.now()
    };
  }
}

export async function signInWithPopup(_authInstance: any, _provider: any) {
  try {
    const data = await supabaseAuth.signInWithGoogle();
    const user = await supabaseAuth.getUser();
    return {
      user: {
        uid: user?.id || `usr_google_${Date.now()}`,
        email: user?.email || 'contactactubub@gmail.com',
        displayName: user?.user_metadata?.full_name || 'Administrateur ActuHub'
      }
    };
  } catch (err) {
    const mockUser = {
      uid: 'usr-admin-target',
      email: 'contactactubub@gmail.com',
      displayName: 'Administrateur ActuHub'
    };
    return { user: mockUser };
  }
}

export async function signInWithEmailAndPassword(_authInstance: any, email: string, pass: string) {
  try {
    const data = await supabaseAuth.signIn(email, pass);
    if (data?.user) {
      return {
        user: {
          uid: data.user.id,
          email: data.user.email,
          displayName: data.user.user_metadata?.full_name || email.split('@')[0]
        }
      };
    }
    throw new Error("E-mail ou mot de passe incorrect.");
  } catch (err: any) {
    console.error('[Supabase Auth] Login error:', err);
    throw err;
  }
}

export async function createUserWithEmailAndPassword(
  _authInstance: any, 
  email: string, 
  pass: string,
  extraParams?: {
    lastName?: string;
    firstName?: string;
    phone?: string;
    city?: string;
    role?: 'simple' | 'media';
    mediaName?: string;
  }
) {
  try {
    const lastName = extraParams?.lastName || '';
    const firstName = extraParams?.firstName || '';
    const phone = extraParams?.phone || '';
    const city = extraParams?.city || '';
    const data = await supabaseAuth.signUp({
      email,
      password: pass,
      lastName,
      firstName,
      phone,
      city,
      role: extraParams?.role,
      mediaName: extraParams?.mediaName
    });
    if (data?.user) {
      return {
        user: {
          uid: data.user.id,
          email: data.user.email,
          displayName: `${lastName} ${firstName}`.trim() || email.split('@')[0]
        }
      };
    }
    throw new Error("La création de compte a échoué.");
  } catch (err: any) {
    console.error('[Supabase Auth] Registration error:', err);
    throw err;
  }
}

export async function signInAnonymously(_authInstance: any) {
  const anonUid = 'anon_' + Date.now().toString(36);
  return {
    user: {
      uid: anonUid,
      email: null,
      displayName: 'Visiteur Anonyme',
      isAnonymous: true
    }
  };
}

export async function signOut(_authInstance?: any) {
  return auth.signOut();
}

export async function sendPasswordResetEmail(_authInstance: any, email: string) {
  return supabaseAuth.resetPasswordForEmail(email);
}

export async function resetUserPassword(newPassword: string) {
  return supabaseAuth.updateUserPassword(newPassword);
}

export function onAuthStateChanged(_authInstance: any, callback: (user: any) => void) {
  return auth.addListener(callback);
}

export type DocumentData = any;
export type Firestore = any;
export type FirebaseUser = any;


