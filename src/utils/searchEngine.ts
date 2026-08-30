import { Article, ShortVideo, FakeNewsReport, Lesson, JournalFrontPage } from '../types';
import { isUneValid24h } from './uneUtils';

export interface SearchResultItem {
  id: string;
  type: 'article' | 'video' | 'rumor' | 'course' | 'frontpage';
  typeLabel: string;
  badgeColor: string;
  title: string;
  snippet: string;
  date?: string | Date;
  sourceOrCategory?: string;
  imageUrl?: string | null;
  link?: string;
  score: number;
  originalData: any;
  matchedTerms: string[];
}

export interface SearchFilterOptions {
  type?: 'all' | 'article' | 'video' | 'rumor' | 'course' | 'frontpage';
  category?: string;
  source?: string;
  dateRange?: 'all' | 'today' | 'week' | 'month';
  minScore?: number;
}

// Map of common synonyms and keyword associations in Benin context
const BENIN_SYNONYMS: Record<string, string[]> = {
  haac: ['haute autorite', 'audiovisuel', 'communication', 'presse', 'reglementation', 'carte de presse', 'republicain'],
  ortb: ['srtb', 'office de radiodiffusion', 'television', 'radio', 'chaine nationale'],
  talon: ['patrice talon', 'president', 'presidence', 'chef de l etat', 'gouvernement'],
  cotonou: ['littoral', 'port', 'marina', 'gbegamey', 'akpakpa', 'fidjrosse', 'cadjehoun'],
  'porto-novo': ['porto novo', 'capitale', 'oueme', 'assemblee nationale', 'palais des gouverneurs'],
  anip: ['agence nationale d identification', 'ravip', 'acte de naissance', 'passeport', 'carte cip', 'identite'],
  'fake news': ['rumeur', 'intox', 'desinformation', 'rumeurs', 'verificateur', 'fact check', 'fausse nouvelle', 'intoxication'],
  rumeur: ['fake news', 'intox', 'desinformation', 'rumeurs', 'signalement'],
  cours: ['academie', 'lecon', 'formation', 'sensibilisation', 'module', 'desinformation academy'],
  journal: ['une', 'presse', 'quotidien', 'parution', 'frontpage', 'actu'],
  parlement: ['assemblee nationale', 'depute', 'loi', 'vote', 'commission'],
  bac: ['examen', 'baccalaureat', 'epreuve', 'bac 2026', 'enseignements'],
  police: ['republicaine', 'securite', 'commissariat', 'dgpr', 'patrouille'],
};

/**
 * Normalizes text by converting to lower case, removing accents/diacritics,
 * and replacing special characters with whitespace.
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s]/g, ' ') // replace punctuation with spaces
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .trim();
}

/**
 * Tokenizes text into individual normalized search terms.
 */
export function tokenizeText(text: string): string[] {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  // Filter out tiny stopwords unless query is short
  const rawTokens = normalized.split(' ');
  if (rawTokens.length <= 2) return rawTokens;
  const stopWords = new Set(['le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'en', 'et', 'a', 'au', 'aux', 'pour', 'par', 'dans', 'sur', 'qui', 'que']);
  return rawTokens.filter(t => t.length > 1 && !stopWords.has(t));
}

/**
 * Calculates a search relevance score for a set of text fields against a user query.
 */
export function calculateRelevanceScore(
  query: string,
  fields: {
    title?: string;
    description?: string;
    content?: string;
    sourceOrCategory?: string;
    tags?: string[];
    date?: string | Date;
  }
): { score: number; matchedTerms: string[] } {
  const normQuery = normalizeText(query);
  if (!normQuery) return { score: 0, matchedTerms: [] };

  const normTitle = normalizeText(fields.title);
  const normDesc = normalizeText(fields.description);
  const normContent = normalizeText(fields.content);
  const normSourceCat = normalizeText(fields.sourceOrCategory);
  const normTags = (fields.tags || []).map(t => normalizeText(t)).join(' ');

  let score = 0;
  const matchedTermsSet = new Set<string>();

  // 1. Exact Phrase Matching (highest weight)
  if (normQuery.length >= 3) {
    if (normTitle.includes(normQuery)) {
      score += 100;
      matchedTermsSet.add(normQuery);
    } else if (normDesc.includes(normQuery)) {
      score += 65;
      matchedTermsSet.add(normQuery);
    } else if (normContent.includes(normQuery)) {
      score += 40;
      matchedTermsSet.add(normQuery);
    }
  }

  // 2. Token Matching
  const queryTokens = tokenizeText(normQuery);
  if (queryTokens.length === 0) return { score, matchedTerms: Array.from(matchedTermsSet) };

  let tokensMatchedCount = 0;

  for (const token of queryTokens) {
    let tokenMatched = false;

    // Title match
    if (normTitle.includes(token)) {
      score += normTitle.startsWith(token) ? 35 : 25;
      tokenMatched = true;
      matchedTermsSet.add(token);
    }

    // Category / Source match
    if (normSourceCat.includes(token) || normTags.includes(token)) {
      score += 20;
      tokenMatched = true;
      matchedTermsSet.add(token);
    }

    // Description match
    if (normDesc.includes(token)) {
      score += 12;
      tokenMatched = true;
      matchedTermsSet.add(token);
    }

    // Content match
    if (normContent.includes(token)) {
      score += 6;
      tokenMatched = true;
      matchedTermsSet.add(token);
    }

    // Check Benin Synonym Expansion
    for (const [key, synonyms] of Object.entries(BENIN_SYNONYMS)) {
      if (token === key || synonyms.includes(token)) {
        if (normTitle.includes(key) || normDesc.includes(key) || synonyms.some(s => normTitle.includes(s) || normDesc.includes(s))) {
          score += 15;
          tokenMatched = true;
          matchedTermsSet.add(key);
        }
      }
    }

    if (tokenMatched) {
      tokensMatchedCount++;
    }
  }

  // Multi-word completeness bonus: if query had multiple tokens and all/most matched
  if (queryTokens.length > 1) {
    const matchRatio = tokensMatchedCount / queryTokens.length;
    if (matchRatio === 1) {
      score += 45; // All words present in document!
    } else if (matchRatio >= 0.5) {
      score += 20;
    }
  }

  // Recency bonus: slightly boost recent items (within last 7 days)
  if (fields.date) {
    try {
      const itemTime = new Date(fields.date).getTime();
      const now = Date.now();
      const diffDays = (now - itemTime) / (1000 * 60 * 60 * 24);
      if (diffDays >= 0 && diffDays <= 7) {
        score += Math.max(0, 15 - Math.floor(diffDays * 2));
      }
    } catch (e) {
      // ignore date parse errors
    }
  }

  return {
    score,
    matchedTerms: Array.from(matchedTermsSet),
  };
}

/**
 * Searches across all dataset types in ActuHub Benin and returns a unified ranked list.
 */
export function performUnifiedSearch(
  query: string,
  datasets: {
    articles?: Article[];
    videos?: ShortVideo[];
    rumors?: FakeNewsReport[];
    courses?: Lesson[];
    frontpages?: JournalFrontPage[];
  },
  options: SearchFilterOptions = {}
): SearchResultItem[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const results: SearchResultItem[] = [];

  // Filter Date Range Cutoff Helper
  let dateCutoffTime = 0;
  if (options.dateRange && options.dateRange !== 'all') {
    const now = Date.now();
    if (options.dateRange === 'today') {
      dateCutoffTime = now - 24 * 60 * 60 * 1000;
    } else if (options.dateRange === 'week') {
      dateCutoffTime = now - 7 * 24 * 60 * 60 * 1000;
    } else if (options.dateRange === 'month') {
      dateCutoffTime = now - 30 * 24 * 60 * 60 * 1000;
    }
  }

  // 1. Search Articles
  if ((!options.type || options.type === 'all' || options.type === 'article') && datasets.articles) {
    for (const art of datasets.articles) {
      if (options.source && options.source !== 'all' && art.source !== options.source) continue;
      if (options.category && options.category !== 'all' && art.category !== options.category) continue;

      if (dateCutoffTime > 0) {
        const itemTime = new Date(art.pubDate).getTime();
        if (itemTime < dateCutoffTime) continue;
      }

      const { score, matchedTerms } = calculateRelevanceScore(trimmed, {
        title: art.title,
        description: art.description,
        sourceOrCategory: `${art.source} ${art.category}`,
        date: art.pubDate,
      });

      if (score > (options.minScore || 5)) {
        results.push({
          id: `article-${art.id}`,
          type: 'article',
          typeLabel: 'Article Press',
          badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          title: art.title,
          snippet: art.description,
          date: art.pubDate,
          sourceOrCategory: `${art.source} • ${art.category}`,
          imageUrl: art.image,
          link: art.link,
          score,
          originalData: art,
          matchedTerms,
        });
      }
    }
  }

  // 2. Search Videos (Shorts TV)
  if ((!options.type || options.type === 'all' || options.type === 'video') && datasets.videos) {
    for (const vid of datasets.videos) {
      const { score, matchedTerms } = calculateRelevanceScore(trimmed, {
        title: vid.title,
        description: vid.channel,
        sourceOrCategory: vid.channel,
      });

      if (score > (options.minScore || 5)) {
        results.push({
          id: `video-${vid.id}`,
          type: 'video',
          typeLabel: 'Short TV',
          badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 border-rose-200 dark:border-rose-800',
          title: vid.title,
          snippet: `Chaîne officielle : ${vid.channel}`,
          sourceOrCategory: vid.channel,
          score,
          originalData: vid,
          matchedTerms,
        });
      }
    }
  }

  // 3. Search Fact-Checking & Rumors (HAAC)
  if ((!options.type || options.type === 'all' || options.type === 'rumor') && datasets.rumors) {
    for (const rum of datasets.rumors) {
      const verdictText = rum.status === 'fake' ? 'Vérifié Faux ❌' : rum.status === 'misleading' ? 'Trompeur ⚠️' : 'Vrai et Vérifié ✅';
      const { score, matchedTerms } = calculateRelevanceScore(trimmed, {
        title: rum.title,
        description: `${rum.description} ${rum.explanation} ${rum.reason || ''}`,
        sourceOrCategory: `ActuHub Fact-checking ${rum.category} ${verdictText}`,
        date: rum.date,
      });

      if (score > (options.minScore || 5)) {
        results.push({
          id: `rumor-${rum.id}`,
          type: 'rumor',
          typeLabel: 'Fact-Checking',
          badgeColor: rum.status === 'fake' 
            ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 border-rose-200 dark:border-rose-800'
            : rum.status === 'misleading'
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800'
            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          title: rum.title,
          snippet: rum.explanation || rum.description,
          date: rum.date,
          sourceOrCategory: `ActuHub • ${verdictText}`,
          score,
          originalData: rum,
          matchedTerms,
        });
      }
    }
  }

  // 4. Search Academy Courses
  if ((!options.type || options.type === 'all' || options.type === 'course') && datasets.courses) {
    for (const les of datasets.courses) {
      // Gather text from lesson pages
      const pageContent = (les.pages || []).flatMap(p => p.sections.flatMap(s => [s.title, ...s.body])).join(' ');

      const { score, matchedTerms } = calculateRelevanceScore(trimmed, {
        title: les.title,
        description: les.summary,
        content: pageContent,
        sourceOrCategory: `Académie ${les.category || ''} ${les.difficulty}`,
      });

      if (score > (options.minScore || 5)) {
        results.push({
          id: `course-${les.id}`,
          type: 'course',
          typeLabel: 'Académie',
          badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
          title: les.title,
          snippet: les.summary,
          sourceOrCategory: `Académie • ${les.difficulty} (${les.duration})`,
          score,
          originalData: les,
          matchedTerms,
        });
      }
    }
  }

  // 5. Search Frontpages (UNEs) - Only include UNEs published within the last 24h
  if ((!options.type || options.type === 'all' || options.type === 'frontpage') && datasets.frontpages) {
    for (const fp of datasets.frontpages) {
      if (!isUneValid24h(fp)) continue; // Enforce 24h expiration rule

      const { score, matchedTerms } = calculateRelevanceScore(trimmed, {
        title: `UNE ${fp.mediaName} - ${fp.title || 'Édition du jour'}`,
        description: `Une du journal ${fp.mediaName} paru le ${fp.date}`,
        sourceOrCategory: fp.mediaName,
        date: fp.date,
      });

      if (score > (options.minScore || 5)) {
        results.push({
          id: `frontpage-${fp.id}`,
          type: 'frontpage',
          typeLabel: 'UNE Journal',
          badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          title: `UNE : ${fp.mediaName}`,
          snippet: fp.title || `Édition officielle du journal du ${fp.date}`,
          date: fp.date,
          sourceOrCategory: fp.mediaName,
          imageUrl: fp.imageUrl,
          score,
          originalData: fp,
          matchedTerms,
        });
      }
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results;
}

/**
 * Helper to safely format text preview with search highlights.
 */
export function getHighlightedSnippet(text: string, matchedTerms: string[], maxLength = 180): string {
  if (!text) return '';
  let snippet = text.slice(0, maxLength);
  if (text.length > maxLength) snippet += '...';
  return snippet;
}
