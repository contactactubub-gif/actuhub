/**
 * ActuHub Benin - Real-time Cache Purge & Fresh Data Manager
 * Automatically purges and invalidates local, memory, and database caches
 * after any modification, edit, addition, or deletion on the platform and dashboards.
 */

export interface CachePurgeEventDetail {
  source?: string;
  table?: string;
  timestamp: number;
  message?: string;
}

// All known cache prefixes and keys used across ActuHub Bénin
export const CACHE_KEYS_PATTERNS = [
  'sb_cache_',
  'benin-actu-news-cache',
  'actuhub_persistent_news_cache',
  'benin-actu-behavior',
  'actuhub_cache_',
  'actuhub_temp_',
  'sb_sub_cache_'
];

/**
 * Purges all application caches from localStorage, sessionStorage, and cache storage
 */
export function purgeAllAppCache(reason?: string): void {
  try {
    const keysToRemove: string[] = [];
    
    // 1. Identify all cache-related keys in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const isCacheKey = CACHE_KEYS_PATTERNS.some(prefix => key.startsWith(prefix) || key.includes('cache'));
        // We preserve authentication credentials and user session identity
        const isAuthKey = key === 'benin-current-user' || key === 'sb-' || key.includes('auth-token');
        if (isCacheKey && !isAuthKey) {
          keysToRemove.push(key);
        }
      }
    }

    // Remove identified keys
    keysToRemove.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    });

    // 2. Clear SessionStorage cache items
    try {
      sessionStorage.clear();
    } catch (e) {}

    // 3. Clear Service Worker & Browser Caches API if accessible
    if (typeof window !== 'undefined' && 'caches' in window) {
      window.caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('actuhub') || name.includes('dynamic') || name.includes('api')) {
            window.caches.delete(name);
          }
        });
      }).catch(() => {});
    }

    console.info(`[ActuHub Cache Manager] 🧹 Cache purged successfully. Reason: ${reason || 'Action / Modification effectuée'}`);

    // 4. Dispatch a custom browser event for live UI reactivity
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<CachePurgeEventDetail>('actuhub:cache_purged', {
          detail: {
            source: reason || 'system_action',
            timestamp: Date.now(),
            message: 'Cache entièrement purgé avec succès.'
          }
        })
      );
    }
  } catch (err) {
    console.warn('[ActuHub Cache Manager] Cache purge warning:', err);
  }
}

/**
 * Purges cache for a specific table or collection (e.g. 'users', 'rumeurs', 'advertisements', 'frontpages', etc.)
 */
export function purgeCollectionCache(tableName: string, reason?: string): void {
  try {
    const specificKey = `sb_cache_${tableName}`;
    localStorage.removeItem(specificKey);

    // Also remove any related sub-keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(tableName)) {
        localStorage.removeItem(key);
      }
    }

    console.info(`[ActuHub Cache Manager] 🧹 Cache purged for table "${tableName}". (${reason || 'Action spécifique'})`);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<CachePurgeEventDetail>('actuhub:cache_purged', {
          detail: {
            table: tableName,
            source: reason || 'table_action',
            timestamp: Date.now()
          }
        })
      );
    }
  } catch (err) {
    console.warn(`[ActuHub Cache Manager] Error purging table ${tableName} cache:`, err);
  }
}

/**
 * Automatic trigger helper to execute immediately after any user or dashboard mutation
 */
export function recordActionAndPurgeCache(actionName: string, targetTable?: string): void {
  if (targetTable) {
    purgeCollectionCache(targetTable, actionName);
  }
  purgeAllAppCache(actionName);
}
