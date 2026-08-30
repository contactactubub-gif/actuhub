import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Heart, Share2, Clock, Sparkles, Flame, Grid, Mail, 
  CheckCircle, Trash2, RefreshCw, ChevronLeft, ChevronRight, 
  ExternalLink, Sliders, Info, ShieldAlert, Award, Wifi, Terminal, Activity, Radio,
  Play, X, Pause, Square, Volume2, Mic, MicOff,
  Tv, Newspaper, Megaphone, Video, Landmark, TrendingUp, Trophy, Palette, Users, Globe
} from 'lucide-react';
import { Article, RSSSource, JournalFrontPage, UserProfile, ShortVideo } from '../types';
import { AdCarousel } from './AdCarousel';
import { filterValid24hUnes, getUneRemainingTime } from '../utils/uneUtils';
import { BENIN_RSS_SOURCES, CATEGORIES_LABELS, SEEDED_ARTICLES } from '../data/newsData';
import { SHORTS_VIDEO_SEEDS } from '../data/shortsData';
import { db, collection, query, orderBy, onSnapshot, addDoc } from '../utils/supabase';
import { triggerToast } from '../utils/toast';
import { calculateRelevanceScore } from '../utils/searchEngine';

const ACTUHUB_PERSISTENT_CACHE_KEY = 'actuhub_persistent_news_cache';
const ACTUHUB_PERSISTENT_CACHE_TIME_KEY = 'actuhub_persistent_news_cache_time';
const MAX_PERSISTENT_CACHE_AGE_MS = 15 * 60 * 1000; // 15 minutes MAX TTL for RSS news cache

const getPersistentCachedArticles = (): Article[] | null => {
  try {
    const rawTime = localStorage.getItem(ACTUHUB_PERSISTENT_CACHE_TIME_KEY);
    if (rawTime) {
      const age = Date.now() - parseInt(rawTime, 10);
      if (isNaN(age) || age > MAX_PERSISTENT_CACHE_AGE_MS) {
        console.info(`[ActuHub Cache] Cache local RSS expiré (${Math.round((age || 0) / 60000)} min). Purge automatique.`);
        localStorage.removeItem(ACTUHUB_PERSISTENT_CACHE_KEY);
        localStorage.removeItem(ACTUHUB_PERSISTENT_CACHE_TIME_KEY);
        return null;
      }
    }
    const raw = localStorage.getItem(ACTUHUB_PERSISTENT_CACHE_KEY);
    if (raw) {
      const parsed: Article[] = JSON.parse(raw);
      const now = Date.now();
      // Keep only articles published within the last 48 hours
      const freshOnly = parsed.filter(art => {
        if (!art || !art.pubDate) return false;
        const d = new Date(art.pubDate).getTime();
        return !isNaN(d) && (now - d) < 48 * 60 * 60 * 1000;
      });
      if (freshOnly.length > 0) {
        return freshOnly;
      }
    }
  } catch (e) {
    console.warn("[Cache] Error reading persistent cache:", e);
  }
  return null;
};

const setPersistentCachedArticles = (articles: Article[]): void => {
  try {
    const now = Date.now();
    // Filter to retain only fresh articles (last 48 hours)
    const freshArticles = articles.filter(art => {
      if (!art || !art.pubDate) return false;
      const d = art.pubDate instanceof Date ? art.pubDate.getTime() : new Date(art.pubDate).getTime();
      return !isNaN(d) && (now - d) < 48 * 60 * 60 * 1000;
    });

    localStorage.removeItem(ACTUHUB_PERSISTENT_CACHE_KEY);
    localStorage.setItem(ACTUHUB_PERSISTENT_CACHE_KEY, JSON.stringify(freshArticles.slice(0, 150)));
    localStorage.setItem(ACTUHUB_PERSISTENT_CACHE_TIME_KEY, now.toString());
  } catch (e) {
    console.warn("[Cache] Error writing persistent cache:", e);
  }
};

const purgePersistentCache = (): void => {
  try {
    localStorage.removeItem(ACTUHUB_PERSISTENT_CACHE_KEY);
    localStorage.removeItem(ACTUHUB_PERSISTENT_CACHE_TIME_KEY);
  } catch (e) {}
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'all': return <Grid className="w-3.5 h-3.5 shrink-0" />;
    case 'politique': return <Landmark className="w-3.5 h-3.5 shrink-0" />;
    case 'economie': return <TrendingUp className="w-3.5 h-3.5 shrink-0" />;
    case 'sport': return <Trophy className="w-3.5 h-3.5 shrink-0" />;
    case 'culture': return <Palette className="w-3.5 h-3.5 shrink-0" />;
    case 'societe': return <Users className="w-3.5 h-3.5 shrink-0" />;
    case 'international': return <Globe className="w-3.5 h-3.5 shrink-0" />;
    default: return <Grid className="w-3.5 h-3.5 shrink-0" />;
  }
};

const getArticleSourceIcon = (iconStr: string) => {
  if (iconStr === "📺") return <Tv className="w-3.5 h-3.5 text-blue-500 shrink-0 inline-block" />;
  if (iconStr === "📻") return <Radio className="w-3.5 h-3.5 text-emerald-500 shrink-0 inline-block" />;
  if (iconStr === "📰" || iconStr === "🗞️") return <Newspaper className="w-3.5 h-3.5 text-indigo-500 shrink-0 inline-block" />;
  if (iconStr === "☀️") return <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 inline-block" />;
  if (iconStr === "💪") return <Activity className="w-3.5 h-3.5 text-red-500 shrink-0 inline-block" />;
  if (iconStr === "🌍") return <Globe className="w-3.5 h-3.5 text-teal-500 shrink-0 inline-block" />;
  if (iconStr === "🛣️") return <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0 inline-block" />;
  if (iconStr === "🎭") return <Palette className="w-3.5 h-3.5 text-purple-500 shrink-0 inline-block" />;
  return <Newspaper className="w-3.5 h-3.5 text-indigo-500 shrink-0 inline-block" />;
};

const CATEGORY_KEYWORDS: { [key: string]: string[] } = {
  politique: ['politique', 'cena', 'gouvernement', 'président', 'ministre', 'élection', 'député', 'assemblée', 'décret', 'patrice talon', 'parti', 'partis', 'héritiers', 'talon', 'up le', 'les démocrates', 'fcbe', 'loi'],
  economie: ['économie', 'economie', 'finances', 'port', 'cotonou', 'banque', 'investissement', 'commerce', 'entreprise', 'marché', 'douane', 'francs', 'cfa', 'budget', 'pib', 'fmi', 'douanes', 'ministère du numérique', 'startup'],
  sport: ['sport', 'football', 'basket', 'match', 'équipe', 'joueur', 'champion', 'guépards', 'guepards', 'can', 'ballon', 'stade', 'caf', 'fifa', 'sélectionneur', 'can-2024'],
  culture: ['culture', 'musique', 'art', 'festival', 'cinéma', 'artiste', 'œuvres', 'exposition', 'patrimoine', 'danse', 'vodoun', 'voodoo', 'théâtre', 'tourisme', 'nikki', 'abomey', 'musée'],
  societe: ['société', 'social', 'éducation', 'education', 'santé', 'femme', 'jeune', 'lycée', 'lycee', 'baccalauréat', 'universitaire', 'hôpital', 'hopital', 'médecin', 'médical', 'securite', 'sécurité', 'accident', 'pluie', 'inondation', 'climat'],
  international: ['international', 'afrique', 'monde', 'onu', 'cedeao', 'nigeria', 'france', 'coopération', 'diplomatie', 'ambassade', 'usa', 'brics']
};

const formatCountdown = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) {
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  }
  return `${s}s`;
};

interface NewsSectionProps {
  favorites: string[];
  toggleFavorite: (id: string) => void;
  openShareModal: (article: Article) => void;
  history: string[];
  addToHistory: (id: string) => void;
  onNavigateToAcademy?: () => void;
  onNavigateToSignaler?: () => void;
  onNavigateToVerify?: () => void;
  onNewArticles?: (articles: Article[]) => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  advertisements?: any[];
  onTrackView?: (id: string) => void;
  onTrackClick?: (id: string) => void;
  currentUser?: UserProfile | null;
  onLoginClick?: () => void;
  allShorts?: (ShortVideo & { videoId: string })[];
}

function NewsSection({ 
  favorites, 
  toggleFavorite, 
  openShareModal, 
  history, 
  addToHistory,
  onNavigateToAcademy,
  onNavigateToSignaler,
  onNavigateToVerify,
  onNewArticles,
  searchQuery: externalSearchQuery,
  onSearchQueryChange: onExternalSearchQueryChange,
  advertisements = [],
  onTrackView,
  onTrackClick,
  currentUser,
  onLoginClick,
  allShorts = [],
}: NewsSectionProps) {
  const [allNews, setAllNewsState] = useState<Article[]>([]);
  const [allFrontPages, setAllFrontPages] = useState<JournalFrontPage[]>([]);
  const [selectedFrontPageForModal, setSelectedFrontPageForModal] = useState<JournalFrontPage | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<string[]>([]);

  // Real-time synchronization of journal front pages (La UNE des journaux)
  useEffect(() => {
    const q = query(collection(db, 'frontpages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: JournalFrontPage[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as JournalFrontPage);
      });
      setAllFrontPages(list);
    }, (err) => {
      console.warn("Error synchronizing frontpages in NewsSection:", err);
    });
    return unsubscribe;
  }, []);
  const [liveLogs, setLiveLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString('fr-FR')}] Console de surveillance ActuHub Bénin initialisée.`,
    `[${new Date().toLocaleTimeString('fr-FR')}] Surveillance et synchronisation automatique activées pour l'ensemble des ${BENIN_RSS_SOURCES.length} flux médias (toutes les 1 min).`
  ]);
  const [sourceStatuses, setSourceStatuses] = useState<{
    [key: string]: { status: 'idle' | 'fetching' | 'success' | 'error'; latency?: number; count?: number }
  }>({});
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [recentlyAppliedIds, setRecentlyAppliedIds] = useState<string[]>([]);

  const allNewsRef = useRef<Article[]>([]);
  useEffect(() => {
    allNewsRef.current = allNews;
  }, [allNews]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('fr-FR');
    setLiveLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 40));
  };

  const updateAllNews = (uncleanArticles: Article[]) => {
    const seen = new Set<string>();
    const cleaned: Article[] = [];
    uncleanArticles.forEach(item => {
      let cleanId = item.id;
      // If the ID is a duplicate, too short (indicating a truncated btoa id), or missing, generate a safe deterministic one
      if (!cleanId || cleanId.length <= 15 || seen.has(cleanId)) {
        let hash = 0;
        const key = `${item.link || ''}-${item.title}`;
        for (let i = 0; i < key.length; i++) {
          hash = ((hash << 5) - hash) + key.charCodeAt(i);
          hash |= 0;
        }
        cleanId = `bj-cln-${Math.abs(hash).toString(36)}-${key.length}`;
      }
      
      // Secondary fallback (duplicate keys resolved with unique counter suffix)
      let testId = cleanId;
      let suffix = 1;
      while (seen.has(testId)) {
        testId = `${cleanId}-${suffix}`;
        suffix++;
      }
      
      seen.add(testId);
      cleaned.push({
        ...item,
        id: testId
      });
    });
    setAllNewsState(cleaned);
  };
  const [filteredNews, setFilteredNews] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSource, setActiveSource] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : localSearchQuery;
  const setSearchQuery = onExternalSearchQueryChange !== undefined ? onExternalSearchQueryChange : setLocalSearchQuery;
  const [isListening, setIsListening] = useState(false);
  const [voiceSearchError, setVoiceSearchError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (voiceSearchError) {
      const timer = setTimeout(() => {
        setVoiceSearchError(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [voiceSearchError]);

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addLog("Erreur: La reconnaissance vocale n'est pas supportée par votre navigateur.");
      setVoiceSearchError("La reconnaissance vocale n'est pas supportée par votre navigateur. Veuillez utiliser Chrome, Safari ou Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'fr-FR';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceSearchError(null);
        addLog("🎙️ Recherche vocale activée. Parlez maintenant...");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          const cleanTranscript = transcript.trim().replace(/\.$/, '');
          setSearchQuery(cleanTranscript);
          addLog(`🎙️ Recherche vocale reçue : "${cleanTranscript}"`);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          addLog("🎙️ Permission d'accès au micro refusée.");
          setVoiceSearchError("L'accès au microphone est bloqué. Veuillez autoriser le microphone dans votre navigateur.");
        } else {
          addLog(`🎙️ Erreur reconnaissance vocale : ${event.error}`);
          setVoiceSearchError(`Reconnaissance vocale interrompue ou non disponible.`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        addLog("🎙️ Recherche vocale arrêtée.");
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn("Speech recognition start failed:", err);
      addLog(`🎙️ Échec d'activation vocale : ${err.message || err}`);
      setVoiceSearchError("Échec de l'activation du microphone.");
      setIsListening(false);
    }
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleVoiceSearch = () => {
    if (isListening) {
      stopVoiceSearch();
    } else {
      startVoiceSearch();
    }
  };
  const [displayedCount, setDisplayedCount] = useState(12);
  const [heroIndex, setHeroIndex] = useState(0);
  const [countdown, setCountdown] = useState(60); // 1 minute in seconds (1 * 60)
  const [lastCheckTime, setLastCheckTime] = useState<string>('');
  const [userBehavior, setUserBehavior] = useState<{
    categories: { [key: string]: number };
    totalClicks: number;
    clickedIds: string[];
  }>({ categories: {}, totalClicks: 0, clickedIds: [] });

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSuccess] = useState(false);
  const [newsletterMediaChoice, setNewsletterMediaChoice] = useState('Tous les flux');
  const [selectedNewsletterMedias, setSelectedNewsletterMedias] = useState<string[]>(['Tous les flux']);
  const [isNewsletterSubmitting, setIsNewsletterSubmitting] = useState(false);

  const toggleNewsletterMedia = (mediaName: string) => {
    if (mediaName === 'Tous les flux') {
      setSelectedNewsletterMedias(['Tous les flux']);
      return;
    }
    setSelectedNewsletterMedias(prev => {
      const filtered = prev.filter(m => m !== 'Tous les flux');
      if (filtered.includes(mediaName)) {
        const next = filtered.filter(m => m !== mediaName);
        return next.length === 0 ? ['Tous les flux'] : next;
      } else {
        return [...filtered, mediaName];
      }
    });
  };

  const selectAllNewsletterMedias = () => {
    const allNames = BENIN_RSS_SOURCES.map(s => s.name);
    setSelectedNewsletterMedias(allNames);
  };
  const [showNewsletterInputs, setShowNewsletterInputs] = useState(false);
  const heroAutoplayRef = useRef<NodeJS.Timeout | null>(null);

  // Bottom 16:9 Shorts TV carousel state and actions
  const [activeCarouselVideo, setActiveCarouselVideo] = useState<string | null>(null);
  const [activeCarouselVideoTitle, setActiveCarouselVideoTitle] = useState<string>('');
  const [activeCarouselVideoChannel, setActiveCarouselVideoChannel] = useState<string>('');
  const [shuffledShorts, setShuffledShorts] = useState<any[]>([]);
  
  // Custom Article Reader Modal & Text-to-Speech (TTS) states
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const startSpeech = (article: Article) => {
    if (!('speechSynthesis' in window)) {
      addLog("Erreur: La synthèse vocale n'est pas supportée par votre navigateur.");
      return;
    }

    // Stop current
    window.speechSynthesis.cancel();

    // Prepare text to read gracefully in French
    const textToRead = `Article de l'organe ${article.source}. Titre: ${article.title}. Description: ${article.description}.`;
    
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'fr-FR';
    utterance.rate = speechRate;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      addLog(`Lecture audio démarrée pour l'article : "${article.title.substring(0, 30)}..."`);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      addLog("Lecture audio de l'article terminée.");
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted') {
        setIsSpeaking(false);
        setIsPaused(false);
        addLog(`Erreur de synthèse vocale : ${e.error}`);
      }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const pauseSpeech = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      addLog("Lecture audio mise en pause.");
    }
  };

  const resumeSpeech = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      addLog("Lecture audio reprise.");
    }
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    addLog("Lecture audio arrêtée.");
  };

  // Automatically update and restart the speed if currently speaking
  useEffect(() => {
    if (readingArticle && isSpeaking && utteranceRef.current) {
      startSpeech(readingArticle);
    }
  }, [speechRate]);

  // Cleanup speech synthesis and recognition on component unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const mixShorts = React.useCallback(() => {
    const list = allShorts && allShorts.length > 0 ? allShorts : SHORTS_VIDEO_SEEDS;
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setShuffledShorts(arr);
  }, [allShorts]);

  useEffect(() => {
    mixShorts();
  }, [mixShorts]);
  
  const carouselNewsRef = useRef<HTMLDivElement>(null);
  
  const scrollCarouselNews = (direction: 'left' | 'right') => {
    if (carouselNewsRef.current) {
      const scrollAmount = 300;
      carouselNewsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Load user behavior and initialize news with persistent cache and live system
  useEffect(() => {
    const cached = getPersistentCachedArticles();
    if (cached && cached.length > 0) {
      const parsed = cached.map(art => ({
        ...art,
        pubDate: parsePubDate(art.pubDate)
      }));
      updateAllNews(parsed);
      setFilteredNews(parsed);
      addLog(`Chargement instantané de la plateforme depuis le cache d'actualités récentes (${parsed.length} articles).`);
      
      // Execute a non-blocking check to retrieve any new live updates immediately
      fetchRealNews(parsed, true);
    } else {
      let initialArticles = SEEDED_ARTICLES;
      updateAllNews(initialArticles);
      setFilteredNews(initialArticles);

      // Non-blocking background fetch for fresh new info feeds
      addLog("Aucun cache récent trouvé. Vérification en arrière-plan des nouveaux flux RSS...");
      fetchRealNews(initialArticles, true);
    }
  }, []);

  // Update filtered news when filters change with smart search scoring
  useEffect(() => {
    let result = [...allNews];

    if (activeSource !== 'all') {
      result = result.filter(n => n.source === activeSource);
    }

    if (activeCategory !== 'all') {
      result = result.filter(n => n.category === activeCategory);
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.trim();
      const scored = result.map(n => {
        const { score } = calculateRelevanceScore(q, {
          title: n.title,
          description: n.description,
          sourceOrCategory: `${n.source} ${n.category}`,
          date: n.pubDate,
        });
        return { article: n, score };
      });

      // Keep items with score > 2 and sort descending by score
      result = scored
        .filter(item => item.score > 2)
        .sort((a, b) => b.score - a.score)
        .map(item => item.article);
    }

    setFilteredNews(result);
  }, [allNews, activeSource, activeCategory, searchQuery]);

  // Countdown timer clock (1 minute auto-refresh, automatic cache purge and fresh pull)
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          addLog("Purge automatique du cache de secours effectuée pour recharger et identifier de nouvelles informations...");
          purgePersistentCache();
          silentRefresh();
          return 60; // Reset to 1 minute
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [allNews]);

  // Tab visibility listener for autonomous background sync when returning
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        addLog("Retour sur la plateforme : Synchronisation automatique en arrière-plan...");
        silentRefresh();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Autoplay hero slideshow
  useEffect(() => {
    startHeroAutoplay();
    return () => stopHeroAutoplay();
  }, [filteredNews, heroIndex]);

  const startHeroAutoplay = () => {
    if (heroAutoplayRef.current) clearInterval(heroAutoplayRef.current);
    heroAutoplayRef.current = setInterval(() => {
      const heroArticles = getHeroArticles();
      if (heroArticles.length > 0) {
        setHeroIndex(prev => (prev + 1) % heroArticles.length);
      }
    }, 6000);
  };

  const stopHeroAutoplay = () => {
    if (heroAutoplayRef.current) clearInterval(heroAutoplayRef.current);
  };

  // Detect category based on title & description
  const detectCategory = (title: string, desc: string): string => {
    const text = `${title} ${desc}`.toLowerCase();
    for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
      if (words.some(word => text.includes(word))) return cat;
    }
    return 'societe'; // Default
  };

  // Standard strip HTML helper with robust entity decoding
  const stripHtml = (html: string): string => {
    if (!html) return '';
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      let text = doc.body.textContent || doc.body.innerText || '';
      return text
        .replace(/&#8211;/g, '–')
        .replace(/&#8212;/g, '—')
        .replace(/&#8217;/g, "'")
        .replace(/&#8216;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&#8230;/g, '…')
        .replace(/&#038;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&rsquo;/g, "'")
        .replace(/&lsquo;/g, "'")
        .replace(/&rdquo;/g, '"')
        .replace(/&ldquo;/g, '"')
        .replace(/&hellip;/g, '…')
        .replace(/&eacute;/g, 'é')
        .replace(/&egrave;/g, 'è')
        .replace(/&ecirc;/g, 'ê')
        .replace(/&agrave;/g, 'à')
        .replace(/&ocirc;/g, 'ô')
        .replace(/&ugrave;/g, 'ù')
        .replace(/&ccedil;/g, 'ç')
        .trim();
    } catch {
      return html.replace(/<[^>]+>/g, '').trim();
    }
  };

  // Parse thumbnails helper
  const extractImage = (desc: string): string | null => {
    if (!desc) return null;
    const match = desc.match(/<img[^>]+src=["']([^"'>]+)["']/i) || desc.match(/src=["']([^"']+\.(?:jpg|jpeg|png|webp|gif)[^"']*)["']/i);
    return match ? match[1] : null;
  };

  // Robust date parser for RSS feeds
  const parsePubDate = (dateVal: any): Date => {
    if (!dateVal) return new Date(0);
    if (dateVal instanceof Date) {
      return isNaN(dateVal.getTime()) ? new Date(0) : dateVal;
    }
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) return d;
    if (typeof dateVal === 'string') {
      const fixed = dateVal.trim().replace(' ', 'T');
      const d2 = new Date(fixed);
      if (!isNaN(d2.getTime())) return d2;
    }
    return new Date(0);
  };

  const getArticleTimestamp = (art: Article): number => {
    if (!art || !art.pubDate) return 0;
    const d = art.pubDate instanceof Date ? art.pubDate : parsePubDate(art.pubDate);
    const t = d.getTime();
    return isNaN(t) ? 0 : t;
  };

  // Reset all news cache and reload fresh RSS feeds from scratch
  const handleResetAndReload = async () => {
    purgePersistentCache();
    updateAllNews([]);
    setFilteredNews([]);
    setDisplayedCount(12);
    setHeroIndex(0);
    setCountdown(60);
    addLog("Réinitialisation complète lancée : Cache effacé. Rechargement direct de tous les flux RSS récents...");

    await fetchRealNews([], false);
    triggerToast("Réinitialisation réussie ! Toutes les récentes actualités des flux RSS ont été chargées.", "success");
  };

  // Silent refresh in background (automatic cycle every 1 minute)
  const silentRefresh = async () => {
    addLog("Vérification et mise à jour automatique de tous les flux RSS (Cycle 1 min)...");
    fetchRealNews(allNewsRef.current.length > 0 ? allNewsRef.current : SEEDED_ARTICLES, true);
  };

  const backendAvailableRef = useRef<boolean | null>(null);

  // Fetch real-time RSS news with robust 3-tier fallback optimized for both Node server and Static hosting
  const fetchRealNews = async (existingArticles: Article[], isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
      addLog(`Lancement de la vérification globale autonome des ${BENIN_RSS_SOURCES.length} flux médias...`);
    }
    
    const fetchedResults: Article[] = [];
    const seenUrls = new Set<string>();

    // 1. Query server-side autonomous engine for fresh news if backend is available
    if (backendAvailableRef.current !== false) {
      try {
        const cacheBustUrl = isSilent 
          ? `/api/rss-feed?t=${Date.now()}` 
          : `/api/rss-feed?force=true&t=${Date.now()}`;
        const serverResp = await fetch(cacheBustUrl, { signal: AbortSignal.timeout(8000) });
        if (serverResp.ok) {
          const contentType = serverResp.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const serverData = await serverResp.json();
            if (serverData && Array.isArray(serverData.articles) && serverData.articles.length > 0) {
              backendAvailableRef.current = true;
              serverData.articles.forEach((art: any) => {
                if (art.link && !seenUrls.has(art.link)) {
                  seenUrls.add(art.link);
                  fetchedResults.push({
                    ...art,
                    pubDate: parsePubDate(art.pubDate)
                  });
                }
              });
              addLog(`Moteur Serveur Autonome: ${serverData.articles.length} actualités fraîches chargées instantanément.`);
            }
          } else {
            backendAvailableRef.current = false; // SPA static host
          }
        } else {
          backendAvailableRef.current = false;
        }
      } catch {
        backendAvailableRef.current = false;
      }
    }
    
    // 2. Parse all sources using staggered batching to avoid API rate limiting
    const sourceBatchSize = backendAvailableRef.current === false ? 6 : 4; // Faster concurrency on static host
    for (let i = 0; i < BENIN_RSS_SOURCES.length; i += sourceBatchSize) {
      const batch = BENIN_RSS_SOURCES.slice(i, i + sourceBatchSize);
      await Promise.all(batch.map(async (source) => {
        setSourceStatuses(prev => ({
          ...prev,
          [source.name]: { status: 'fetching' }
        }));
        const startTime = Date.now();
        let parsedItems: any[] = [];

        try {
          // 1. On static hosting (or generally if CORS is enabled on the target), try Direct Fetch first
          let xmlText = '';
          try {
            const directResp = await fetch(source.url, { signal: AbortSignal.timeout(3000) });
            if (directResp.ok) {
              const txt = await directResp.text();
              if (txt && (txt.includes('<item') || txt.includes('<entry'))) {
                xmlText = txt;
              }
            }
          } catch (e) {
            // Direct fetch blocked by CORS or failed, proceed to other options
          }

          // 2. Try rss2json (fast and parses XML automatically into clean JSON on the client)
          if (!xmlText && parsedItems.length === 0) {
            try {
              const r2jResp = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`, { signal: AbortSignal.timeout(4500) });
              if (r2jResp.ok) {
                const r2jData = await r2jResp.json();
                if (r2jData && Array.isArray(r2jData.items) && r2jData.items.length > 0) {
                  r2jData.items.slice(0, 10).forEach((it: any) => {
                    if (it.title && it.link) {
                      parsedItems.push({
                        title: it.title,
                        link: it.link,
                        description: it.description || it.content || '',
                        pubDate: it.pubDate || '',
                        thumbnail: it.thumbnail || it.enclosure?.link || null
                      });
                    }
                  });
                }
              }
            } catch {
              // Ignore rss2json error and proceed to XML proxy fallback
            }
          }

          // 3. If items not yet found, try different XML CORS proxies to get the raw XML string
          if (parsedItems.length === 0 && !xmlText) {
            // Try Node server proxy if backend is available
            if (backendAvailableRef.current !== false) {
              try {
                const xmlResp = await fetch(`/api/rss-proxy?url=${encodeURIComponent(source.url)}&t=${Date.now()}`, { signal: AbortSignal.timeout(4000) });
                if (xmlResp.ok) {
                  const txt = await xmlResp.text();
                  if (txt && !txt.includes('<!DOCTYPE html') && (txt.includes('<item') || txt.includes('<entry'))) {
                    xmlText = txt;
                  }
                }
              } catch {
                // Server proxy failed
              }
            }

            // Try corsproxy.io (Very fast, highly reliable public proxy)
            if (!xmlText) {
              try {
                const fallbackResp = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(source.url)}`, { signal: AbortSignal.timeout(4000) });
                if (fallbackResp.ok) {
                  const txt = await fallbackResp.text();
                  if (txt && (txt.includes('<item') || txt.includes('<entry'))) {
                    xmlText = txt;
                  }
                }
              } catch (e) {
                // Ignore and proceed to next proxy
              }
            }

            // Try allorigins CORS proxy fallback
            if (!xmlText) {
              try {
                const fallbackResp = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(source.url)}`, { signal: AbortSignal.timeout(4000) });
                if (fallbackResp.ok) {
                  xmlText = await fallbackResp.text();
                }
              } catch {
                // Ignore fallback error
              }
            }

            // Try alternative codetabs CORS proxy fallback
            if (!xmlText) {
              try {
                const fallbackResp = await fetch(`https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(source.url)}`, { signal: AbortSignal.timeout(4000) });
                if (fallbackResp.ok) {
                  xmlText = await fallbackResp.text();
                }
              } catch {
                // Ignore
              }
            }
          }

          // 4. Parse retrieved raw XML text
          if (parsedItems.length === 0 && xmlText && (xmlText.includes('<item') || xmlText.includes('<entry'))) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            const xmlElements = xmlDoc.querySelectorAll('item, entry');
            xmlElements.forEach((el, idx) => {
              if (idx >= 10) return;
              const title = el.querySelector('title')?.textContent || '';
              const link = el.querySelector('link')?.textContent || el.querySelector('link')?.getAttribute('href') || '';
              const description = el.querySelector('description, summary, content\\:encoded, content')?.textContent || '';
              const pubDate = el.querySelector('pubDate, pubdate, dc\\:date, updated, date')?.textContent || '';
              const enclosure = el.querySelector('enclosure')?.getAttribute('url') || 
                                el.querySelector('media\\:content')?.getAttribute('url') ||
                                el.querySelector('media\\:thumbnail')?.getAttribute('url');
              
              if (title && link) {
                parsedItems.push({
                  title,
                  link,
                  description,
                  pubDate,
                  thumbnail: enclosure || null
                });
              }
            });
          }

          // 5. Final fallback attempt with rss2json if not already tried
          if (parsedItems.length === 0) {
            try {
              const r2jResp = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`, { signal: AbortSignal.timeout(4000) });
              if (r2jResp.ok) {
                const r2jData = await r2jResp.json();
                if (r2jData && Array.isArray(r2jData.items)) {
                  r2jData.items.slice(0, 10).forEach((it: any) => {
                    if (it.title && it.link) {
                      parsedItems.push({
                        title: it.title,
                        link: it.link,
                        description: it.description || it.content || '',
                        pubDate: it.pubDate || '',
                        thumbnail: it.thumbnail || it.enclosure?.link || null
                      });
                    }
                  });
                }
              }
            } catch {
              // Ignore
            }
          }

          if (parsedItems.length > 0) {
            const latency = Date.now() - startTime;
            setSourceStatuses(prev => ({
              ...prev,
              [source.name]: { status: 'success', latency, count: parsedItems.length }
            }));

            parsedItems.forEach((item: any) => {
              if (!item.link || seenUrls.has(item.link)) return;
              seenUrls.add(item.link);

              const decodedTitle = stripHtml(item.title);
              const lowerTitle = decodedTitle.toLowerCase();
              if (
                !decodedTitle || 
                decodedTitle.length < 5 || 
                lowerTitle.includes('404') || 
                lowerTitle.includes('not found') || 
                lowerTitle.includes('erreur') || 
                lowerTitle.includes('maintenance') || 
                lowerTitle.includes('access denied') ||
                !item.link || 
                (!item.link.startsWith('http://') && !item.link.startsWith('https://'))
              ) {
                return;
              }

              const decodedDesc = stripHtml(item.description || '').substring(0, 190) + '...';
              const cat = detectCategory(decodedTitle, decodedDesc);

              let linkHash = 0;
              for (let i = 0; i < item.link.length; i++) {
                linkHash = ((linkHash << 5) - linkHash) + item.link.charCodeAt(i);
                linkHash |= 0;
              }
              const safeId = `bj-${Math.abs(linkHash).toString(36)}-${item.link.length}`;

              fetchedResults.push({
                id: safeId,
                title: decodedTitle,
                link: item.link,
                description: decodedDesc,
                pubDate: parsePubDate(item.pubDate),
                source: source.name,
                sourceColor: source.color,
                sourceIcon: source.icon,
                image: item.thumbnail || extractImage(item.description) || null,
                category: cat
              });
            });
          } else {
            setSourceStatuses(prev => ({
              ...prev,
              [source.name]: { status: 'error' }
            }));
          }
        } catch(e) {
          setSourceStatuses(prev => ({
            ...prev,
            [source.name]: { status: 'error' }
          }));
        }
      }));
    }

    const currentList = allNewsRef.current;
    
    // Identify truly new articles comparing with current list
    const trulyNewArticles = fetchedResults.filter(fetched => {
      const isDuplicate = currentList.some(curr => 
        curr.link === fetched.link || 
        curr.title.toLowerCase().trim().substring(0, 35) === fetched.title.toLowerCase().trim().substring(0, 35)
      );
      return !isDuplicate;
    });

    if (trulyNewArticles.length > 0) {
      addLog(`Synchronisateur: ${trulyNewArticles.length} nouvelles actualités intégrées en direct.`);
      if (onNewArticles) {
        onNewArticles(trulyNewArticles);
      }
      setRecentlyAppliedIds(prev => [...prev, ...trulyNewArticles.map(t => t.id)]);
      setTimeout(() => {
        setRecentlyAppliedIds(prev => prev.filter(id => !trulyNewArticles.some(t => t.id === id)));
      }, 6000);
    } else {
      addLog(`Synchronisateur: Analyse terminée. Tous les flux sont à jour.`);
    }

    // Prioritize freshly fetched live articles over old cached items, filtering out items older than 72 hours
    const nowMs = Date.now();
    const maxAgeMs = 72 * 60 * 60 * 1000;
    const mergedList = [...fetchedResults, ...currentList, ...existingArticles];
    const uniqueMap = new Map<string, Article>();
    
    mergedList.forEach(art => {
      if (!art || !art.title) return;
      const parsedDate = parsePubDate(art.pubDate);
      const t = parsedDate.getTime();
      if (isNaN(t) || t === 0 || (nowMs - t) > maxAgeMs) return; // Discard stale/invalid items older than 72 hours

      const slug = art.title.toLowerCase().trim().replace(/[^a-z0-9]/g, '').substring(0, 45);
      if (slug.length < 5) return;
      
      const artObj = {
        ...art,
        pubDate: parsedDate
      };

      if (!uniqueMap.has(slug)) {
        uniqueMap.set(slug, artObj);
      } else {
        const existing = uniqueMap.get(slug)!;
        const existingT = getArticleTimestamp(existing);
        if (t > existingT || (!existing.image && art.image)) {
          uniqueMap.set(slug, artObj);
        }
      }
    });

    const finalArticles = Array.from(uniqueMap.values()).sort((a,b) => getArticleTimestamp(b) - getArticleTimestamp(a));
    
    if (finalArticles.length > 0) {
      updateAllNews(finalArticles);
      // Mise en cache des actualités fraîches
      setPersistentCachedArticles(finalArticles);
    }

    setLastCheckTime(`Mis à jour: ${new Date().toLocaleTimeString('fr-FR')}`);
    setLoading(false);
  };

  const pingSingleSource = async (source: RSSSource) => {
    addLog(`Démarrage du diagnostic pour : ${source.name}...`);
    setSourceStatuses(prev => ({
      ...prev,
      [source.name]: { status: 'fetching' }
    }));
    const startTime = Date.now();
    const proxy = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`;
    try {
      const response = await fetch(proxy);
      const latency = Date.now() - startTime;
      const data = await response.json();
      if (data.status === 'ok') {
        const itemsCount = data.items?.length || 0;
        addLog(`Succès ! ${source.name} connecté en ${latency}ms • ${itemsCount} articles trouvés.`);
        setSourceStatuses(prev => ({
          ...prev,
          [source.name]: { status: 'success', latency, count: itemsCount }
        }));
        
        if (data.items) {
          const fresh: Article[] = [];
          data.items.slice(0, 8).forEach((item: any) => {
            const decodedTitle = stripHtml(item.title);
            const decodedDesc = stripHtml(item.description || '').substring(0, 190) + '...';
            const cat = detectCategory(decodedTitle, decodedDesc);
            
            let hash = 0;
            for (let i = 0; i < item.link.length; i++) {
              hash = ((hash << 5) - hash) + item.link.charCodeAt(i);
              hash |= 0;
            }
            const safeId = `bj-${Math.abs(hash).toString(36)}-${item.link.length}`;
            
            const alreadyExists = allNewsRef.current.some(x => x.link === item.link || x.title.toLowerCase().trim().substring(0, 35) === decodedTitle.toLowerCase().trim().substring(0, 35));
            if (!alreadyExists) {
              fresh.push({
                id: safeId,
                title: decodedTitle,
                link: item.link,
                description: decodedDesc,
                pubDate: parsePubDate(item.pubDate),
                source: source.name,
                sourceColor: source.color,
                sourceIcon: source.icon,
                image: item.thumbnail || item.enclosure?.link || extractImage(item.description) || null,
                category: cat
              });
            }
          });
          
          if (fresh.length > 0) {
            addLog(`Importation de ${fresh.length} nouveautés depuis ${source.name} !`);
            const merged = [...fresh, ...allNewsRef.current];
            const uniqueMap = new Map<string, Article>();
            merged.forEach(art => {
              const slug = art.title.toLowerCase().trim().replace(/[^a-z0-9]/g, '').substring(0, 45);
              if (!uniqueMap.has(slug)) uniqueMap.set(slug, art);
            });
            const finalArticles = Array.from(uniqueMap.values()).sort((a,b) => getArticleTimestamp(b) - getArticleTimestamp(a));
            updateAllNews(finalArticles);
            setRecentlyAppliedIds(prev => [...prev, ...fresh.map(f => f.id)]);
            setTimeout(() => {
              setRecentlyAppliedIds(prev => prev.filter(id => !fresh.some(f => f.id === id)));
            }, 6000);
          }
        }
      } else {
        throw new Error('Échec de la réponse de l’API RSS');
      }
    } catch (e) {
      addLog(`Erreur de diagnostic pour ${source.name} : ${String(e)}`);
      setSourceStatuses(prev => ({
        ...prev,
        [source.name]: { status: 'error' }
      }));
    }
  };

  const pingAllSources = async () => {
    addLog(`Lancement de l'actualisation de l'ensemble des ${BENIN_RSS_SOURCES.length} flux médias...`);
    for (let i = 0; i < BENIN_RSS_SOURCES.length; i += 3) {
      const slice = BENIN_RSS_SOURCES.slice(i, i + 3);
      await Promise.all(slice.map(s => pingSingleSource(s)));
    }
    addLog(`Vérification globale des canaux terminée avec succès.`);
  };

  const getRandomSourcePlaceholder = (cat: string) => {
    const images: { [key: string]: string[] } = {
      politique: [
        "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?q=80&w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop"
      ],
      economie: [
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600&auto=format&fit=crop"
      ],
      sport: [
        "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600&auto=format&fit=crop"
      ],
      culture: [
        "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop"
      ],
      societe: [
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=600&auto=format&fit=crop"
      ]
    };
    const list = images[cat] || images['societe'];
    return list[Math.floor(Math.random() * list.length)];
  };

  // Track behavior on clicking articles to customize personal suggestions
  const handleArticleClick = (art: Article) => {
    addToHistory(art.id);
    
    const updatedBehavior = {
      categories: { ...userBehavior.categories },
      totalClicks: userBehavior.totalClicks + 1,
      clickedIds: [...userBehavior.clickedIds]
    };

    updatedBehavior.categories[art.category] = (updatedBehavior.categories[art.category] || 0) + 1;
    if (!updatedBehavior.clickedIds.includes(art.id)) {
      updatedBehavior.clickedIds.push(art.id);
    }

    setUserBehavior(updatedBehavior);

    // Open article in custom reader modal containing TTS synthesis
    setReadingArticle(art);
  };

  // Compute suggestions based on top read categories (Interactive Customization)
  const getSuggestions = (): Article[] => {
    if (userBehavior.totalClicks < 2) return []; // Only show after user interacts

    // Find favorite category
    let favoriteCategory = 'societe';
    let maxCount = 0;
    Object.entries(userBehavior.categories).forEach(([cat, val]) => {
      const valNum = Number(val) || 0;
      if (valNum > maxCount) {
        maxCount = valNum;
        favoriteCategory = cat;
      }
    });

    // Recommend articles in this category that the user hasn't clicked yet
    return allNews
      .filter(art => art.category === favoriteCategory && !userBehavior.clickedIds.includes(art.id))
      .slice(0, 4);
  };

  // Reset behaviors
  const handleResetSuggestions = () => {
    const empty = { categories: {}, totalClicks: 0, clickedIds: [] };
    setUserBehavior(empty);
  };

  // Extract Carousel slides (e.g. articles that have premium images)
  const getHeroArticles = (): Article[] => {
    return filteredNews.filter(art => art.image !== null && !failedImageIds.includes(art.id)).slice(0, 4);
  };

  // Auto-populate email when user is connected
  useEffect(() => {
    if (currentUser) {
      setNewsletterEmail(currentUser.email);
    }
  }, [currentUser]);

  // Newsletter subscription
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      triggerToast("Veuillez entrer une adresse email valide.", "error");
      return;
    }

    if (!selectedNewsletterMedias || selectedNewsletterMedias.length === 0) {
      triggerToast("Veuillez choisir au moins un média ou 'Tous les flux'.", "error");
      return;
    }

    setIsNewsletterSubmitting(true);
    try {
      const mediaChoiceString = selectedNewsletterMedias.join(', ');
      const subData = {
        userId: currentUser?.id || 'guest',
        userEmail: newsletterEmail.trim(),
        userFullName: currentUser?.fullName || 'Abonné Citoyen',
        mediaChoice: mediaChoiceString,
        mediaChoices: selectedNewsletterMedias,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'newsletter_subscriptions'), subData);

      // Send direct email copy to contactactubub@gmail.com
      try {
        await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: subData.userFullName,
            email: subData.userEmail,
            subject: `[ABONNEMENT NEWSLETTER] ${subData.userEmail}`,
            message: `Nouvel abonnement newsletter sur la plateforme ActuHub :\n- Email: ${subData.userEmail}\n- Choix médias: ${subData.mediaChoice}\n- Utilisateur: ${subData.userFullName}`,
            type: 'Abonnement Newsletter'
          })
        });
      } catch (e) {}

      triggerToast(`Demande d'abonnement pour ${selectedNewsletterMedias.length} média(s) soumise avec succès à l'administration !`, 'success');
      setNewsletterSuccess(true);
      setNewsletterEmail('');
    } catch (err) {
      console.error("Error creating newsletter subscription:", err);
      triggerToast("Erreur lors de l'inscription à la newsletter. Veuillez réessayer.", "error");
    } finally {
      setIsNewsletterSubmitting(false);
    }
  };

  const heroArticles = getHeroArticles();
  const personalSuggestions = getSuggestions();
  const currentHero = heroArticles[heroIndex];

  return (
    <div id="news-section-main" className="space-y-6">
      
      {/* 23 Dynamic RSS sources bar */}
      <div 
        id="sources-slider" 
        className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-none relative"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        <button
          id="source-btn-all"
          onClick={() => { setActiveSource('all'); setDisplayedCount(12); }}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-all ${
            activeSource === 'all' 
              ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
              : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-slate-700'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Tous les Flux ({allNews.length})
        </button>

        {BENIN_RSS_SOURCES.map((source) => {
          const count = allNews.filter(n => n.source === source.name).length;
          const isActive = activeSource === source.name;
          return (
            <button
              id={`source-btn-${source.name.replace(/\s+/g, '-').toLowerCase()}`}
              key={source.name}
              onClick={() => { setActiveSource(source.name); setDisplayedCount(12); }}
              className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-medium transition-all ${
                isActive 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <span className="text-sm flex items-center justify-center">{getArticleSourceIcon(source.icon)}</span>
              <span>{source.name}</span>
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-300'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Category filters & Search & Countdown clock */}
      <div id="filters-search-bar" className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
        
        {/* Categories row */}
        <div id="categories-row" className="flex gap-2 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: 'none' }}>
          {Object.entries(CATEGORIES_LABELS).map(([key, value]) => (
            <button
              id={`cat-chip-${key}`}
              key={key}
              onClick={() => { setActiveCategory(key); setDisplayedCount(12); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === key 
                  ? 'bg-gray-900 border-gray-900 text-white dark:bg-blue-600 dark:border-blue-600 shadow-sm' 
                  : 'bg-transparent border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:border-gray-300 dark:hover:border-slate-600'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {getCategoryIcon(key)}
                <span>{value}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Search bar input */}
        <div id="search-input-box" className="relative flex-1 max-w-sm w-full">
          <input
            id="news-query-input"
            type="text"
            placeholder={isListening ? "Parlez maintenant..." : "Rechercher des actualités béninoises..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-10 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              isListening 
                ? 'border-red-550 bg-red-50/20 dark:bg-red-950/10 placeholder-red-400 font-medium' 
                : 'border-gray-250'
            }`}
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          
          <button
            id="mic-search-button"
            type="button"
            onClick={toggleVoiceSearch}
            className={`absolute right-2.5 top-1.5 p-1 rounded-md transition-all cursor-pointer ${
              isListening 
                ? 'text-red-600 bg-red-100 dark:bg-red-900/40 animate-pulse' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
            title={isListening ? "Arrêter la recherche vocale" : "Rechercher par commande vocale (Microphone)"}
          >
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          {voiceSearchError && (
            <div className="absolute top-full mt-1.5 left-0 right-0 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-[10px] px-2.5 py-1.5 rounded-md border border-red-100 dark:border-red-900/30 shadow-sm z-30 flex items-center justify-between">
              <span className="truncate">{voiceSearchError}</span>
              <button 
                type="button"
                onClick={() => setVoiceSearchError(null)} 
                className="ml-1 text-red-400 hover:text-red-600 font-bold text-xs"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Refreshed telemetry details */}
        <div id="refresh-telemetry" className="flex flex-wrap items-center justify-between md:justify-end gap-2 sm:gap-3 text-xs text-gray-400 pl-1 w-full md:w-auto">
          <div className="flex items-center gap-1.5 shrink-0" title="Mise à jour et vérification automatique de tous les flux RSS chaque minute">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-gray-500 dark:text-gray-400 font-medium text-[11px] sm:text-xs">
              Vérification auto (1 min) : <span className="font-extrabold text-blue-600 dark:text-blue-400 font-mono">{formatCountdown(countdown)}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button 
              id="refresh-feed-trigger"
              onClick={() => {
                fetchRealNews(allNews.length > 0 ? allNews : SEEDED_ARTICLES);
                setCountdown(60);
              }}
              disabled={loading}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-gray-700 dark:text-gray-300 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer border border-gray-200 dark:border-slate-700/60 shrink-0 whitespace-nowrap"
              title="Lancer la vérification instantanée de tous les flux RSS"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-500' : 'text-blue-600 dark:text-blue-400'}`} />
              <span className="inline">Vérifier</span>
            </button>

            <button 
              id="reset-news-trigger"
              onClick={handleResetAndReload}
              disabled={loading}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer border border-amber-200 dark:border-amber-800/60 shadow-xs shrink-0 whitespace-nowrap"
              title="Vider le cache local et recharger toutes les récentes actualités directement"
            >
              <Trash2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="inline">Réinitialiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* Emplacement publicitaire au-dessus de l'Espace Signalements & Rumeurs */}
      {searchQuery === '' && (
        <AdCarousel
          advertisements={advertisements}
          placementFilter="above_rumors"
          onTrackView={onTrackView}
          onTrackClick={onTrackClick}
          autoPlayInterval={3000}
          className="mb-2"
        />
      )}

      {/* Navigation Banner to Signalement & Verification Page */}
      {(onNavigateToSignaler || onNavigateToVerify) && (
        <div id="home-signalement-banner" className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 rounded-3xl p-5 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wide">Espace Signalements & Rumeurs</h3>
              <p className="text-xs text-red-100">Soumettez un message suspect, consultez les enquêtes citoyennes ou vérifiez la fiabilité d'un lien.</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            {onNavigateToVerify && (
              <button
                id="home-verify-link-btn"
                onClick={onNavigateToVerify}
                className="bg-white/15 hover:bg-white/25 border border-white/30 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer justify-center flex-1 sm:flex-initial"
              >
                <span>Auditer un lien</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {onNavigateToSignaler && (
              <button
                id="home-signaler-rumeur-btn"
                onClick={onNavigateToSignaler}
                className="bg-white hover:bg-red-50 text-red-700 font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow-sm transition-all flex items-center gap-2 cursor-pointer justify-center flex-1 sm:flex-initial"
              >
                <span>Signaler une rumeur</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 🧭 CONSOLE DE SURVEILLANCE & SYNCHRONISATION LIVE */}
      {consoleOpen && (
        <div id="live-monitoring-console" className="bg-slate-950 border border-slate-850 rounded-xl shadow-lg p-4 space-y-4 text-white animate-fade-in relative overflow-hidden font-sans">
          {/* Subtle live radar grid effect */}
          <div className="absolute top-0 right-0 p-10 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          {/* Diagnostic Console Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-3 gap-3">
            <div className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-blue-400 animate-pulse" />
              <div>
                <h3 className="text-sm font-extrabold tracking-wider uppercase flex items-center gap-1.5 text-slate-200">
                  <span>Moniteur de Liaison RSS béninois</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">{BENIN_RSS_SOURCES.length} Canaux officiels inspectés en direct • Cycle auto 1 min</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs w-full sm:w-auto flex-wrap justify-between sm:justify-end">


              {/* Ping all button */}
              <button
                onClick={pingAllSources}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                Interroger Tous les Flux
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left side: Grid of Sources with latency tracker */}
            <div className="lg:col-span-8 space-y-2">
              <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-widest pl-1">Matrice de Liaison Média (Cliquer pour tester la liaison)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                {BENIN_RSS_SOURCES.map((source) => {
                  const stateStatus = sourceStatuses[source.name] || { status: 'idle' };
                  let statusColor = "bg-slate-600";
                  let statusBorder = "border-slate-800";
                  
                  if (stateStatus.status === 'fetching') {
                    statusColor = "bg-amber-500 animate-ping";
                    statusBorder = "border-amber-500/35";
                  } else if (stateStatus.status === 'success') {
                    statusColor = "bg-emerald-500 animate-pulse";
                    statusBorder = "border-emerald-500/20";
                  } else if (stateStatus.status === 'error') {
                    statusColor = "bg-rose-500";
                    statusBorder = "border-rose-500/30";
                  }

                  return (
                    <button
                      key={source.name}
                      onClick={() => pingSingleSource(source)}
                      className={`text-left p-1.5 rounded bg-slate-900 border ${statusBorder} hover:border-blue-500/50 transition-all flex items-center justify-between gap-1.5 group cursor-pointer`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs shrink-0">{source.icon}</span>
                        <span className="text-[10px] font-bold truncate text-slate-300 group-hover:text-white transition-colors">
                          {source.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {stateStatus.status === 'success' && stateStatus.latency !== undefined && (
                          <span className="text-[8px] font-mono text-emerald-400 font-bold bg-emerald-950/40 px-1 py-0.5 rounded-sm">
                            {stateStatus.latency}ms
                          </span>
                        )}
                        <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`}></span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right side: Developer Terminal */}
            <div className="lg:col-span-4 flex flex-col space-y-4">
              {/* Sidebar Advertisement space - CNIN BÉNIN Carousel */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-blue-600 dark:text-blue-400">
                    Campagne CNIN BÉNIN
                  </span>
                </div>
                <AdCarousel 
                  advertisements={advertisements} 
                  placementFilter="sidebar" 
                  autoPlayInterval={3000} 
                  onTrackView={onTrackView} 
                  onTrackClick={onTrackClick} 
                />
              </div>

              <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider text-slate-400 px-1">
                <span>Journal d'activité de flux</span>
                <button 
                  onClick={() => setLiveLogs([`[${new Date().toLocaleTimeString('fr-FR')}] Console vidée.`])}
                  className="text-rose-400 hover:text-rose-300 font-bold hover:underline cursor-pointer"
                >
                  Vider
                </button>
              </div>
              <div className="bg-black/95 rounded border border-slate-800 p-2.5 h-[160px] lg:h-[220px] overflow-y-auto font-mono text-[9px] text-slate-300 space-y-1">
                {liveLogs.map((log, idx) => {
                  let logColor = "text-slate-300";
                  if (log.includes("Erreur")) logColor = "text-rose-400";
                  if (log.includes("Succès")) logColor = "text-emerald-400 font-semibold";
                  if (log.includes("Nouveauté") || log.includes("Importation")) logColor = "text-blue-400 font-bold";
                  if (log.includes("Option")) logColor = "text-amber-400";

                  return (
                    <div key={idx} className={`${logColor} leading-relaxed break-all`}>
                      {log}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Hero premium Slideshow */}
      {heroArticles.length > 0 && searchQuery === '' && (
        <div 
          id="hero-slideshow-container" 
          className="relative bg-gray-900 rounded-2xl border border-gray-200 shadow-md h-[300px] md:h-[400px] overflow-hidden group"
          onMouseEnter={stopHeroAutoplay}
          onMouseLeave={startHeroAutoplay}
        >
          {heroArticles.map((art, idx) => (
            <div
              id={`hero-slide-${idx}`}
              key={art.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${idx === heroIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            >
              {art.image && (
                <img 
                  id={`hero-img-${idx}`}
                  src={art.image} 
                  alt={art.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-center opacity-70 group-hover:scale-102 transition-transform duration-500" 
                />
              )}
              <div id={`hero-shadow-${idx}`} className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
              
              {/* Slides details metadata */}
              <div id={`hero-card-meta-${idx}`} className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white space-y-3 z-15">
                <div id={`hero-label-${idx}`} className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-600">
                    A la une
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/20">
                    {CATEGORIES_LABELS[art.category] || art.category}
                  </span>
                  <span className="text-xs text-white/70 flex items-center gap-1.5 ml-2">
                    {getArticleSourceIcon(art.sourceIcon)} {art.source}
                  </span>
                </div>
                <h1 id={`hero-title-${idx}`} className="text-lg md:text-2xl font-extrabold tracking-tight line-clamp-2 hover:underline cursor-pointer" onClick={() => handleArticleClick(art)}>
                  {art.title}
                </h1>
                <p id={`hero-desc-${idx}`} className="text-xs text-white/80 line-clamp-2 max-w-2xl hidden md:block">
                  {art.description}
                </p>
                
                {/* Actions row */}
                <div id={`hero-acts-${idx}`} className="flex items-center justify-between pt-2">
                  <span id={`hero-date-${idx}`} className="text-xs text-white/60 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {art.pubDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div id={`hero-buttons-${idx}`} className="flex items-center gap-2">
                    <button
                      id={`hero-fav-btn-${art.id}`}
                      onClick={() => toggleFavorite(art.id)}
                      className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-transform"
                    >
                      <Heart className={`w-4 h-4 ${favorites.includes(art.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>
                    <button
                      id={`hero-share-btn-${art.id}`}
                      onClick={() => openShareModal(art)}
                      className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-transform"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      id={`hero-link-btn-${art.id}`}
                      onClick={() => handleArticleClick(art)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      <span>Lire l'organe</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Dots navigation indicator */}
          <div id="hero-dots-indicator" className="absolute top-4 right-4 z-20 flex gap-1.5">
            {heroArticles.map((_, idx) => (
              <button
                id={`hero-dot-btn-${idx}`}
                key={idx}
                onClick={() => setHeroIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${idx === heroIndex ? 'bg-blue-500 w-5' : 'bg-white/50'}`}
              />
            ))}
          </div>

          {/* Previous & Next arrows */}
          <button
            id="hero-nav-prev"
            onClick={() => setHeroIndex(prev => (prev - 1 + heroArticles.length) % heroArticles.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            id="hero-nav-next"
            onClick={() => setHeroIndex(prev => (prev + 1) % heroArticles.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION CARROUSEL : LA UNE DES JOURNAUX BÉNINOIS (Durée de vie stricte de 24h) */}
      {(() => {
        const validFrontPages = filterValid24hUnes(allFrontPages);
        if (validFrontPages.length === 0 || searchQuery !== '') return null;

        return (
          <div id="journal-frontpages-section" className="bg-gradient-to-br from-rose-50 to-amber-50 dark:from-slate-900/60 dark:to-slate-950/40 border border-rose-100 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm animate-fade-in font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1 px-2.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm font-mono">
                  <Newspaper className="w-3.5 h-3.5 animate-pulse" /> La UNE des Journaux
                </span>
                <h3 className="text-xs font-black text-slate-850 dark:text-slate-100 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <span>Kiosque du jour (24h) 🇧🇯</span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-full border border-gray-100 dark:border-slate-800">
                  ⏱️ Validité : 24h max
                </span>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => {
                      const el = document.getElementById('frontpages-carousel-container');
                      if (el) el.scrollBy({ left: -260, behavior: 'smooth' });
                    }}
                    className="p-1.5 rounded-full bg-white dark:bg-slate-800 shadow hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-100 dark:border-slate-700 cursor-pointer text-slate-700 dark:text-slate-300 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      const el = document.getElementById('frontpages-carousel-container');
                      if (el) el.scrollBy({ left: 260, behavior: 'smooth' });
                    }}
                    className="p-1.5 rounded-full bg-white dark:bg-slate-800 shadow hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-100 dark:border-slate-700 cursor-pointer text-slate-700 dark:text-slate-300 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div 
              id="frontpages-carousel-container" 
              className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-hide snap-x"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {validFrontPages.map((une) => {
                const timeInfo = getUneRemainingTime(une);
                return (
                  <div
                    key={une.id}
                    onClick={() => setSelectedFrontPageForModal(une)}
                    className="min-w-[190px] w-[190px] bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-2.5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group snap-start flex flex-col justify-between"
                  >
                    <div className="space-y-2 text-left">
                      <div className="aspect-[3/4] w-full rounded-xl bg-slate-100 dark:bg-slate-950 overflow-hidden relative border border-gray-100 dark:border-slate-800">
                        {une.imageUrl ? (
                          <img
                            src={une.imageUrl}
                            alt={une.mediaName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-rose-50 text-rose-500 p-3 text-center">
                            <span className="text-[10px] font-black uppercase font-mono">{une.mediaName}</span>
                            <span className="text-[9px] text-gray-400 mt-1">Image indisponible</span>
                          </div>
                        )}
                        
                        <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full font-mono shadow-sm">
                          {une.date}
                        </div>

                        {/* 24h Remaining Timer Pill */}
                        <div className="absolute bottom-1.5 right-1.5 bg-rose-600/90 text-white text-[8px] font-black px-2 py-0.5 rounded-full font-mono shadow-md backdrop-blur-sm flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{timeInfo.formattedRemaining}</span>
                        </div>
                      </div>

                      <div className="space-y-0.5 text-left px-0.5">
                        <span className="text-[8px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 font-mono block">
                          {une.mediaName}
                        </span>
                        <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                          {une.title || "Édition Standard"}
                        </h4>
                      </div>
                    </div>

                    <div className="pt-2 mt-2 border-t border-dashed border-gray-100 dark:border-slate-800 flex items-center justify-between text-[8px] font-mono font-bold text-slate-400 text-left">
                      <span>Zoom 🔍</span>
                      <span className="text-[9px] text-indigo-500">Aperçu direct</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* MODALE LIGHTBOX POUR ZOOM DE LA UNE */}
      {selectedFrontPageForModal && (
        <div 
          onClick={() => setSelectedFrontPageForModal(null)}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-950/20">
              <div className="text-left">
                <span className="bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase font-mono">
                  {selectedFrontPageForModal.mediaName}
                </span>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {selectedFrontPageForModal.title || "Édition Nationale"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedFrontPageForModal(null)}
                className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image container */}
            <div className="p-6 bg-slate-950/10 dark:bg-slate-950/30 flex items-center justify-center max-h-[70vh] overflow-y-auto">
              {selectedFrontPageForModal.imageUrl ? (
                <img
                  src={selectedFrontPageForModal.imageUrl}
                  alt={selectedFrontPageForModal.mediaName}
                  className="max-h-[60vh] w-auto object-contain rounded-xl shadow-md border border-slate-200 dark:border-slate-850"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="p-8 text-center text-gray-400 font-mono text-xs">
                  Pas d'image de UNE disponible pour cette parution.
                </div>
              )}
            </div>

            {/* Footer with actions */}
            <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-gray-500 font-mono bg-gray-50/30 dark:bg-slate-950/10">
              <div className="text-left">
                <span>Date de parution: </span>
                <strong className="text-slate-800 dark:text-slate-100">{selectedFrontPageForModal.date}</strong>
              </div>
              <button
                onClick={() => {
                  if (selectedFrontPageForModal.imageUrl) {
                    const win = window.open(selectedFrontPageForModal.imageUrl, '_blank');
                    if (win) win.focus();
                  }
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ouvrir en HD</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Carousel publicitaire défilable (3s) au-dessus des Recommandations IA */}
      {searchQuery === '' && (
        <AdCarousel
          advertisements={advertisements}
          onTrackView={onTrackView}
          onTrackClick={onTrackClick}
          autoPlayInterval={3000}
          className="mb-6"
        />
      )}

      {/* Interactive suggestions panel (Customized suggestion based on behavioral patterns) */}
      {personalSuggestions.length > 0 && searchQuery === '' && (
        <div id="custom-suggestions-box" className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl p-5 space-y-4">
          <div id="suggest-header-row" className="flex items-center justify-between">
            <div id="suggest-title-group" className="flex items-center gap-2">
              <span className="p-1 px-2 rounded-md bg-violet-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Recommandations IA
              </span>
              <h3 id="suggest-subtitle" className="text-sm font-extrabold text-violet-950 font-sans tracking-tight">
              </h3>
            </div>
            <button
              id="reset-behavior-btn"
              onClick={handleResetSuggestions}
              className="text-[10px] text-violet-500 hover:text-red-500 cursor-pointer font-medium hover:underline transition-colors"
            >
              Réinitialiser les préférences
            </button>
          </div>
          
          <div id="suggest-articles-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {personalSuggestions.map(art => (
              <div
                id={`suggest-card-${art.id}`}
                key={art.id}
                onClick={() => handleArticleClick(art)}
                className="bg-white dark:bg-slate-900 hover:shadow-lg transition-transform cursor-pointer border border-violet-100/60 dark:border-slate-800 p-3 rounded-xl flex flex-col justify-between space-y-3 group hover:-translate-y-1"
              >
                <div id={`suggest-meta-${art.id}`} className="flex items-center justify-between text-[10px] text-violet-600 dark:text-violet-400">
                  <span className="font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-violet-50 dark:bg-violet-950/60">
                    {CATEGORIES_LABELS[art.category]}
                  </span>
                  <span className="text-gray-400 dark:text-slate-500 flex items-center gap-1.5">{getArticleSourceIcon(art.sourceIcon)} {art.source}</span>
                </div>
                <h4 id={`suggest-title-${art.id}`} className="text-xs font-bold text-gray-800 dark:text-slate-100 leading-snug line-clamp-3 group-hover:text-violet-700 dark:group-hover:text-violet-400">
                  {art.title}
                </h4>
                <div id={`suggest-date-${art.id}`} className="text-[9px] text-gray-400 dark:text-slate-500 flex items-center gap-1 pt-1 border-t border-gray-50 dark:border-slate-800 uppercase tracking-widest font-semibold font-mono">
                  <Clock className="w-2.5 h-2.5" />
                  il y a {Math.max(1, Math.round((Date.now() - art.pubDate.getTime()) / 3600000))} h
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Short TV 16:9 Streams Carousel Section */}
      <div className="bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 text-slate-800 dark:text-white shadow-xl backdrop-blur-sm mb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
            </span>
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-rose-600 font-mono block">
                Short TV
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              id="news-carousel-btn-reload"
              type="button"
              onClick={(e) => { e.stopPropagation(); mixShorts(); }}
              className="p-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-all active:scale-95 cursor-pointer border border-gray-200/50 dark:border-slate-700/60 flex items-center gap-1 px-3"
              title="Charger d'autres vidéos aléatoirement"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-pulse" />
              <span className="text-[10.5px] font-bold font-sans">Mélanger</span>
            </button>
            <button
              id="news-carousel-btn-prev"
              type="button"
              onClick={(e) => { e.stopPropagation(); scrollCarouselNews('left'); }}
              className="p-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-all active:scale-95 cursor-pointer border border-gray-200/50 dark:border-slate-700/60"
              title="Précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="news-carousel-btn-next"
              type="button"
              onClick={(e) => { e.stopPropagation(); scrollCarouselNews('right'); }}
              className="p-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-all active:scale-95 cursor-pointer border border-gray-200/50 dark:border-slate-700/60"
              title="Suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div 
          ref={carouselNewsRef}
          className="flex gap-4 overflow-x-auto pb-3 pt-1 scroll-smooth snap-x scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent pr-4"
          style={{ scrollbarWidth: 'thin' }}
        >
          {(shuffledShorts.length > 0 ? shuffledShorts : SHORTS_VIDEO_SEEDS).map((vid) => {
            return (
              <button
                id={`news-carousel-item-${vid.id}`}
                key={vid.id}
                type="button"
                onClick={() => {
                  setActiveCarouselVideo(vid.videoId);
                  setActiveCarouselVideoTitle(vid.title);
                  setActiveCarouselVideoChannel(vid.channel);
                }}
                className="snap-start shrink-0 w-[240px] sm:w-[280px] text-left rounded-2xl overflow-hidden cursor-pointer border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 hover:border-blue-500/55 dark:hover:border-cyan-500/55 hover:bg-white dark:hover:bg-slate-950/80 transition-all duration-300 flex flex-col group shadow-sm hover:shadow text-slate-800 dark:text-white"
              >
                {/* 16:9 Aspect Video design */}
                <div className="relative aspect-video w-full bg-slate-950 overflow-hidden rounded-t-2xl">
                  <img
                    src={`https://img.youtube.com/vi/${vid.videoId}/hqdefault.jpg`}
                    alt={vid.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  {/* Dark transparent fade */}
                  <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/85 to-transparent" />
                  
                  {/* 16:9 HD standard Tag indicator */}

                  <div className="absolute bottom-2 right-2 bg-black/70 text-[8px] font-extrabold px-1.5 py-0.5 rounded font-mono text-cyan-400 border border-cyan-800/40 uppercase tracking-widest">
                    16:9 HD
                  </div>

                  {/* Play Hover Overlay Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/45 backdrop-blur-[1px] transition-all duration-300">
                    <div className="w-12 h-12 rounded-full bg-rose-600 flex items-center justify-center text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300 border border-rose-500/30">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Info and metadata area in bottom card */}
                <div className="p-3.5 space-y-2 w-full shrink-0 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[12px] font-extrabold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 h-[36px] group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                      {vid.title}
                    </h4>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Online Academy Pitch banner banner */}
      <div 
        id="academy-pro-pitch-banner" 
        className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md relative overflow-hidden"
      >
        <div id="pitch-background-pattern" className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-2xl transform translate-x-20 -translate-y-20"></div>
        <div id="pitch-context-details" className="space-y-2 relative z-10 max-w-xl">
          <div id="pitch-badge-group" className="flex items-center gap-1.5">
            <span className="p-1 px-2.5 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-sm">
              <Award className="w-3 h-3 animate-pulse" /> Certificat Gratuit
            </span>
            <span className="p-1 px-2.5 rounded-full bg-white/20 text-white text-[9px] font-bold uppercase tracking-wider">
              Académie Citoyenne
            </span>
          </div>
          <h3 id="pitch-heading" className="text-lg md:text-xl font-extrabold leading-snug">
            Devenez un rempart contre la désinformation au Bénin !
          </h3>
          <p id="pitch-body" className="text-xs text-white/80 leading-relaxed">
            Rejoignez notre académie en ligne. Suivez 4 leçons interactives guidées par des experts en fact-checking, passez le test, et obtenez votre Certificat de Citoyen Numérique Responsable.
          </p>
        </div>
        <button
          id="pitch-action-trigger"
          onClick={onNavigateToAcademy}
          className="bg-white hover:bg-yellow-400 text-blue-900 hover:text-black hover:scale-102 transition-all font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-2xl shadow shadow-black/10 shrink-0 relative z-10"
        >
          Ouvrir l'Académie
        </button>
      </div>

      {/* Main Grid Articles section */}
      <div id="primary-grid-news" className="space-y-4">

        <div id="primary-grid-header" className="flex items-center gap-1.5 pl-1">
          <Grid className="w-4 h-4 text-blue-600" />
          <h2 id="last-news-sec-title" className="text-sm font-extrabold text-slate-800 dark:text-slate-200 font-sans tracking-tight uppercase">
            {activeSource !== 'all' ? `Organe : ${activeSource}` : `Toutes les actualités`}
            {activeCategory !== 'all' && ` - ${CATEGORIES_LABELS[activeCategory]}`}
          </h2>
          <span id="grid-meta-count" className="text-[10px] bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-sm font-bold ml-1">
            {filteredNews.length} articles
          </span>
        </div>

        {loading ? (
          <div id="news-loading-skeletons" className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div id={`skeleton-item-${i}`} key={i} className="animate-pulse bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row h-[180px] gap-4">
                <div className="w-full sm:w-32 h-36 sm:h-24 bg-gray-200 dark:bg-slate-800 rounded shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="bg-gray-200 dark:bg-slate-800 h-3 w-1/4 rounded"></div>
                  <div className="bg-gray-200 dark:bg-slate-800 h-4 w-full rounded"></div>
                  <div className="bg-gray-200 dark:bg-slate-800 h-4 w-full rounded"></div>
                  <div className="bg-gray-200 dark:bg-slate-800 h-3 w-2/3 rounded mt-2"></div>
                  <div className="flex items-center justify-between pt-2 mt-auto border-t border-slate-100 dark:border-slate-800">
                    <div className="bg-gray-200 dark:bg-slate-800 h-3 w-20 rounded"></div>
                    <div className="flex gap-1.5">
                      <div className="bg-gray-200 dark:bg-slate-800 h-6 w-14 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNews.length === 0 ? (
          <div id="news-empty-container" className="text-center py-16 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <span id="empty-icon-shield" className="inline-flex p-4 rounded-full bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500">
              <Search className="w-8 h-8" />
            </span>
            <h3 id="empty-title" className="text-lg font-bold text-gray-800 dark:text-slate-100">Aucun résultat</h3>
            <p id="empty-subtitle" className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
              Nous n'avons trouvé aucun article correspondant à vos filtres ou termes de recherche. Modifiez vos options ou relancez le chargement.
            </p>
            <button
              id="reset-active-filters"
              onClick={() => { setActiveSource('all'); setActiveCategory('all'); setSearchQuery(''); }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/40 hover:bg-blue-50 dark:hover:bg-blue-900/60 px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              Réinitialiser tous les filtres
            </button>
          </div>
        ) : (
          <div id="main-articles-grid" className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredNews.slice(0, displayedCount).flatMap((art, i) => {
              const isRead = history.includes(art.id);
              const isLiked = favorites.includes(art.id);
              const isNew = recentlyAppliedIds.includes(art.id);
              const hasValidImage = art.image && !failedImageIds.includes(art.id);
              const arr = [
                hasValidImage ? (
                  <article
                    id={`article-card-${art.id}`}
                    key={art.id}
                    className={`border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row h-full group p-4 gap-4 ${
                      isNew 
                        ? 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/50 animate-pulse' 
                        : isRead 
                          ? 'bg-slate-50/50 border-slate-200 dark:border-slate-800/80 opacity-75' 
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Photo area */}
                    <div id={`art-image-block-${art.id}`} className="relative w-full sm:w-32 h-36 sm:h-24 bg-gray-100 dark:bg-slate-950 rounded overflow-hidden cursor-pointer shrink-0 self-center sm:self-start" onClick={() => handleArticleClick(art)}>
                      <img
                        id={`art-img-${art.id}`}
                        src={art.image || undefined}
                        alt={art.title}
                        loading="lazy"
                        className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                        onError={() => {
                          setFailedImageIds(prev => [...prev, art.id]);
                        }}
                      />
                    </div>

                    {/* Body textual content */}
                    <div id={`art-text-block-${art.id}`} className="flex-1 flex flex-col justify-between min-w-0">
                      <div id={`art-body-main-${art.id}`} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span id={`art-cat-label-${art.id}`} className="text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase tracking-wide block">
                            {CATEGORIES_LABELS[art.category]}
                          </span>
                          {isNew && (
                            <span className="bg-blue-600 text-white font-extrabold text-[8px] px-1 py-0.5 rounded animate-pulse">
                              EN DIRECT
                            </span>
                          )}
                        </div>
                        <h3 
                          id={`art-title-${art.id}`}
                          onClick={() => handleArticleClick(art)}
                          className="text-[14px] font-bold text-slate-900 dark:text-slate-100 leading-snug hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer text-left"
                        >
                          {art.title}
                        </h3>
                        <p id={`art-desc-${art.id}`} className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 text-left">
                          {art.description}
                        </p>
                      </div>

                      {/* Footer timeline and actions */}
                      <div id={`art-footer-${art.id}`} className="flex items-center justify-between pt-2 mt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 gap-2 flex-wrap">
                        <div id={`art-date-group-${art.id}`} className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">{getArticleSourceIcon(art.sourceIcon)} {art.source}</span>
                          <span className="text-slate-300 dark:text-slate-800">•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {art.pubDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} • {art.pubDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <div id={`art-actions-btn-${art.id}`} className="flex items-center gap-1.5 ml-auto shrink-0">
                          <button
                            id={`art-share-btn-${art.id}`}
                            onClick={() => openShareModal(art)}
                            className="p-1 px-1.5 rounded hover:bg-blue-50 dark:hover:bg-slate-800 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Partager l'article"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`art-fav-btn-${art.id}`}
                            onClick={() => toggleFavorite(art.id)}
                            className="p-1 px-1.5 rounded hover:bg-red-50 dark:hover:bg-slate-800 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Ajouter aux favoris"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                          </button>
                          <button
                            id={`art-read-btn-${art.id}`}
                            onClick={() => handleArticleClick(art)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-1 px-2.5 rounded text-[11px] transition-colors uppercase tracking-wider cursor-pointer"
                          >
                            Consulter
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ) : (
                  <article
                    id={`article-card-${art.id}`}
                    key={art.id}
                    className={`border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full group p-5 text-white ${
                      isNew 
                        ? 'ring-2 ring-blue-500/50 animate-pulse' 
                        : ''
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${art.sourceColor || '#3b82f6'}e0 0%, #0f172a 100%)`,
                      borderColor: art.sourceColor || '#3b82f6'
                    }}
                  >
                    <div className="space-y-3 cursor-pointer text-left" onClick={() => handleArticleClick(art)}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
                          {CATEGORIES_LABELS[art.category]}
                        </span>
                        {isNew && (
                          <span className="bg-red-500 text-white font-black text-[9px] px-2 py-0.5 rounded-full animate-bounce">
                            EN DIRECT
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-base font-extrabold leading-snug tracking-tight hover:underline text-white">
                        {art.title}
                      </h3>
                    </div>

                    {/* Footer with actions for color card */}
                    <div className="flex items-center justify-between pt-3 mt-4 border-t border-white/20 text-[11px] text-white/80 gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap font-bold">
                        <span className="flex items-center gap-1">{getArticleSourceIcon(art.sourceIcon)} {art.source}</span>
                        <span className="opacity-40">•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {art.pubDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} • {art.pubDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 ml-auto shrink-0">
                        <button
                          onClick={() => openShareModal(art)}
                          className="p-1 px-1.5 rounded hover:bg-white/10 text-white transition-colors cursor-pointer"
                          title="Partager l'article"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleFavorite(art.id)}
                          className="p-1 px-1.5 rounded hover:bg-white/10 text-white transition-colors cursor-pointer"
                          title="Ajouter aux favoris"
                        >
                          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500 stroke-red-500' : 'text-white'}`} />
                        </button>
                        <button
                          onClick={() => handleArticleClick(art)}
                          className="bg-white text-slate-900 font-extrabold p-1.5 px-3.5 rounded-xl text-[11px] transition-all hover:bg-gray-100 uppercase tracking-wider cursor-pointer shadow-sm"
                        >
                          Consulter
                        </button>
                      </div>
                    </div>
                  </article>
                )
              ];
              
              // Inject active in-feed advertisement after the 4th article (index 3) - CNIN BÉNIN Carousel
              if (i === 3) {
                arr.push(
                  <div key={`in-feed-ad-cnin-carousel`} className="col-span-1 xl:col-span-2 my-4 animate-fade-in">
                    <div className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-blue-600 dark:text-blue-400 mb-1.5 px-1">
                      Campagne CNIN BÉNIN
                    </div>
                    <AdCarousel 
                      advertisements={advertisements} 
                      placementFilter="in_feed" 
                      autoPlayInterval={3000} 
                      onTrackView={onTrackView} 
                      onTrackClick={onTrackClick} 
                    />
                  </div>
                );
              }
              
              return arr;
            })}
          </div>
        )}

        {/* Load more trigger */}
        {filteredNews.length > displayedCount && !loading && (
          <div id="load-more-container" className="text-center pt-4">
            <button
              id="load-more-trigger-btn"
              onClick={() => setDisplayedCount(prev => prev + 12)}
              className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 text-xs font-bold text-gray-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 hover:-translate-y-0.5 inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Afficher plus d'actualités Béninoises</span>
              <RefreshCw className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 group-hover:rotate-180 transition-transform" />
            </button>
          </div>
        )}
      </div>


      {/* Newsletter system */}
      <section id="news-letter-sec" className="bg-slate-900 text-white rounded-3xl p-8 relative overflow-hidden">
        <div id="newsletter-bg-flare" className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>
        
        <div id="newsletter-content-inner" className="max-w-2xl mx-auto text-center space-y-6 relative z-10">
          <span id="newsletter-icon-frame" className="inline-flex p-3 rounded-2xl bg-white/10 text-blue-400 text-2xl">
            <Mail className="w-6 h-6" />
          </span>
          <h3 id="newsletter-heading" className="text-lg md:text-xl font-extrabold tracking-tight scale-102">
            Alerte Info & Newsletter Béninoise
          </h3>
          <p id="newsletter-body-desc" className="text-xs text-slate-300 leading-relaxed max-w-lg mx-auto">
            Abonnez-vous à l'actualité de vos médias préférés ou à l'ensemble des publications pour recevoir des alertes par e-mail en direct du Bénin.
          </p>

          <AnimatePresence mode="wait">
            {!newsletterSubscribed ? (
              !showNewsletterInputs ? (
                <motion.div
                  key="subscribe-button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-md mx-auto"
                >
                  <button
                    type="button"
                    onClick={() => setShowNewsletterInputs(true)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-5 py-3.5 rounded-xl transition-all cursor-pointer shadow-md hover:shadow-lg uppercase tracking-wider font-mono flex items-center justify-center gap-2 hover:scale-101 active:scale-99"
                  >
                    <Mail className="w-4 h-4" />
                    <span>S'inscrire à la newsletter</span>
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="newsletter-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  id="newsletter-input-form"
                  onSubmit={handleNewsletterSubmit}
                  className="space-y-4 max-w-md mx-auto"
                >
                  <div className="space-y-3 text-left">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 font-mono">
                        Votre adresse email de réception
                      </label>
                      <input
                        id="newsletter-email-field"
                        type="email"
                        placeholder="Entrez votre adresse email..."
                        required
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        className="w-full bg-white/10 border border-slate-700/60 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/15"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                          Médias & Flux à suivre ({selectedNewsletterMedias.length})
                        </label>
                        <button
                          type="button"
                          onClick={selectAllNewsletterMedias}
                          className="text-[10px] text-blue-400 hover:text-blue-300 font-bold underline cursor-pointer font-mono"
                        >
                          Tout sélectionner
                        </button>
                      </div>

                      <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2 text-xs scrollbar-thin">
                        {/* Global option */}
                        <button
                          type="button"
                          onClick={() => toggleNewsletterMedia('Tous les flux')}
                          className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer text-left ${
                            selectedNewsletterMedias.includes('Tous les flux')
                              ? 'bg-blue-600/30 border-blue-500 text-white font-extrabold'
                              : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>🌍</span>
                            <span>Tous les flux (Globalité)</span>
                          </span>
                          <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-black ${
                            selectedNewsletterMedias.includes('Tous les flux') ? 'bg-blue-500 text-white' : 'border border-slate-600'
                          }`}>
                            {selectedNewsletterMedias.includes('Tous les flux') ? '✓' : ''}
                          </span>
                        </button>

                        {/* Individual media list */}
                        <div className="grid grid-cols-1 gap-1.5 pt-1">
                          {BENIN_RSS_SOURCES.map((src) => {
                            const isSelected = selectedNewsletterMedias.includes(src.name);
                            return (
                              <button
                                key={src.name}
                                type="button"
                                onClick={() => toggleNewsletterMedia(src.name)}
                                className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-600/35 border-blue-400 text-white font-bold'
                                    : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                                }`}
                              >
                                <span className="flex items-center gap-2 truncate">
                                  <span className="text-xs">📰</span>
                                  <span className="truncate text-xs">{src.name}</span>
                                </span>
                                <span className={`w-4 h-4 rounded shrink-0 flex items-center justify-center text-[10px] font-black ${
                                  isSelected ? 'bg-blue-500 text-white' : 'border border-slate-600'
                                }`}>
                                  {isSelected ? '✓' : ''}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1 font-mono">
                        💡 Vous pouvez cocher plusieurs médias ou choisir "Tous les flux".
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewsletterInputs(false)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-4 py-3 rounded-xl transition-all cursor-pointer uppercase tracking-wider font-mono text-center"
                    >
                      Annuler
                    </button>
                    <button
                      id="newsletter-submit-trigger"
                      type="submit"
                      disabled={isNewsletterSubmitting}
                      className="flex-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-5 py-3 rounded-xl transition-all cursor-pointer shadow hover:shadow-lg uppercase tracking-wider font-mono flex items-center justify-center gap-2"
                    >
                      {isNewsletterSubmitting ? "Envoi de la demande..." : "Confirmer l'abonnement"}
                    </button>
                  </div>
                </motion.form>
              )
            ) : (
              <motion.div
                key="success-box"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                id="newsletter-success-box"
                className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-6 max-w-md mx-auto space-y-2 text-center text-emerald-400"
              >
                <CheckCircle className="w-8 h-8 mx-auto text-emerald-400 animate-bounce" />
                <p className="text-xs font-bold uppercase tracking-wide">Demande envoyée !</p>
                <p className="text-[11px] text-emerald-300/85 leading-relaxed">
                  Votre demande d'inscription pour <strong className="text-white font-black">"{selectedNewsletterMedias.join(', ')}"</strong> a été transmise au tableau de bord administrateur. Lorsqu'elle sera acceptée par l'administrateur, les actualités et flux seront directement envoyés dans votre boîte e-mail. Vous pouvez également suivre le statut de vos abonnements dans votre espace compte citoyen.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div id="newsletter-policy-badges" className="flex items-center justify-center gap-4 text-[9px] text-slate-400 font-semibold uppercase tracking-wider pt-2">
            <span>✓ Respect de la vie privée</span>
            <span>✓ Choix de flux individuel</span>
            <span>✓ Modération & Fact-Checking</span>
          </div>
        </div>
      </section>



      {/* Embedded 16:9 YouTube Live Player dialog Modal for home screen */}
      {activeCarouselVideo && (
        <div id="modal-homepage-video-player" className="fixed inset-0 z-55 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/85 backdrop-blur-md" 
            onClick={() => setActiveCarouselVideo(null)}
          ></div>
          
          <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-[24px] shadow-2xl p-2 sm:p-3 overflow-hidden z-20 animate-scale-up">
            
            {/* Modal header block */}
            <div className="flex items-center justify-between px-3 py-1.5 pb-2.5 border-b border-slate-900 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse shrink-0"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 font-mono shrink-0">DIFFUSION SHORT TV</span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <h3 className="text-xs font-bold text-slate-200 truncate pr-4">{activeCarouselVideoTitle}</h3>
              </div>
              <button 
                onClick={() => setActiveCarouselVideo(null)} 
                className="text-slate-400 hover:text-white hover:bg-slate-900 p-1.5 rounded-xl cursor-pointer transition-colors shrink-0"
                title="Fermer la vidéo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video embed ratio wrapper (strictly 16:9 standard alignment) */}
            <div className="aspect-video w-full rounded-2xl overflow-hidden mt-2 bg-black border border-slate-900">
              <iframe
                id="homepage-youtube-iframe-player"
                src={`https://www.youtube.com/embed/${activeCarouselVideo}?autoplay=1&rel=0&modestbranding=1&showinfo=0`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                title={activeCarouselVideoTitle}
              ></iframe>
            </div>

            {/* Bottom details block inside playback interface */}
            <div className="px-3 pt-3 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
              <div className="space-y-0.5">
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="bg-slate-900 text-slate-450 font-mono text-[9px] px-2.5 py-1 rounded border border-slate-850">
                  Liaison cryptée
                </span>
                <button
                  onClick={() => setActiveCarouselVideo(null)}
                  className="bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs px-4 py-2 rounded-xl transition-all hover:bg-slate-850"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📖 ARTICLE READING MODAL WITH TEXT-TO-SPEECH (TTS) */}
      {readingArticle && (
        <div id="modal-article-reader" className="fixed inset-0 z-55 flex items-center justify-center p-4 animate-fade-in font-sans">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => {
              stopSpeech();
              setReadingArticle(null);
            }}
          ></div>
          
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-20 flex flex-col max-h-[90vh] animate-scale-up text-slate-800 dark:text-gray-100">
            
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm shrink-0 flex items-center justify-center">{getArticleSourceIcon(readingArticle.sourceIcon)}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 font-mono shrink-0">
                  {readingArticle.source}
                </span>
                <span className="text-gray-305 dark:text-slate-800 shrink-0">•</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 shrink-0 truncate">
                  {CATEGORIES_LABELS[readingArticle.category] || readingArticle.category}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  id="reader-fav-btn"
                  onClick={() => toggleFavorite(readingArticle.id)}
                  className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-red-500 transition-colors"
                  title="Ajouter aux favoris"
                >
                  <Heart className={`w-4 h-4 ${favorites.includes(readingArticle.id) ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
                <button
                  id="reader-share-btn"
                  onClick={() => openShareModal(readingArticle)}
                  className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Partager"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    stopSpeech();
                    setReadingArticle(null);
                  }} 
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 p-1.5 rounded-xl transition-colors cursor-pointer"
                  title="Fermer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Scrollable contents zone */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
              
              {/* 🎧 TEXT-TO-SPEECH INTERACTIVE DOCK/PLAYER HEADER */}
              <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-slate-950/80 dark:to-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className={`p-2.5 rounded-xl ${isSpeaking && !isPaused ? 'bg-blue-600 text-white shadow-md animate-pulse' : 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'}`}>
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-blue-900 dark:text-blue-400 font-sans">
                      Synthèse Vocale ActuHub
                    </h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                      {isSpeaking && !isPaused 
                        ? "Lecture vocale en cours..." 
                        : isPaused 
                          ? "Lecture vocale en pause" 
                          : "Écoutez cet article lu par notre IA béninoise"}
                    </p>
                  </div>
                </div>

                {/* Player button controls & Speed Rate selector */}
                <div className="flex items-center gap-3 shrink-0 flex-wrap w-full md:w-auto justify-end">
                  
                  {/* Visual wave equalizer representation if speaking */}
                  {isSpeaking && !isPaused && (
                    <div className="flex items-end gap-0.5 h-3.5 px-2">
                      <span className="w-0.5 bg-blue-500 rounded-full animate-[bounce_0.8s_infinite_-0.2s] h-full"></span>
                      <span className="w-0.5 bg-indigo-500 rounded-full animate-[bounce_0.8s_infinite_-0.4s] h-[70%]"></span>
                      <span className="w-0.5 bg-blue-500 rounded-full animate-[bounce_0.8s_infinite_-0.1s] h-[50%]"></span>
                      <span className="w-0.5 bg-indigo-500 rounded-full animate-[bounce_0.8s_infinite_-0.6s] h-[85%]"></span>
                    </div>
                  )}

                  {/* Speech rate controller */}
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-850 px-2.5 py-1.5 rounded-xl border border-gray-150 dark:border-slate-800 text-[10px] font-bold text-gray-600 dark:text-gray-300">
                    <span>Vitesse:</span>
                    <select 
                      value={speechRate} 
                      onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                      className="bg-transparent focus:outline-none cursor-pointer text-blue-600 dark:text-blue-450 font-extrabold"
                    >
                      <option value="0.8">0.8x</option>
                      <option value="1">1.0x</option>
                      <option value="1.2">1.2x</option>
                      <option value="1.5">1.5x</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-850 p-1 rounded-xl border border-gray-150 dark:border-slate-800 shadow-sm shrink-0">
                    {/* Play / Resume / Pause button */}
                    {!isSpeaking ? (
                      <button
                        onClick={() => startSpeech(readingArticle)}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shadow-sm transition-all"
                        title="Démarrer la lecture vocale"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                      </button>
                    ) : isPaused ? (
                      <button
                        onClick={resumeSpeech}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                        title="Reprendre la lecture"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                      </button>
                    ) : (
                      <button
                        onClick={pauseSpeech}
                        className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                        title="Mettre en pause"
                      >
                        <Pause className="w-3.5 h-3.5 text-white" />
                      </button>
                    )}

                    {/* Stop button always available if speaking */}
                    {isSpeaking && (
                      <button
                        onClick={stopSpeech}
                        className="bg-rose-600 hover:bg-rose-700 text-white p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                        title="Arrêter la lecture"
                      >
                        <Square className="w-3.5 h-3.5 text-white" />
                      </button>
                    )}
                  </div>

                </div>
              </div>

              {/* Title & Date */}
              <div className="space-y-3">
                <h1 className="text-lg md:text-xl font-black text-gray-950 dark:text-white leading-normal tracking-tight font-sans">
                  {readingArticle.title}
                </h1>
                
                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 font-medium flex-wrap">
                  <span className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-400">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {readingArticle.pubDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span>•</span>
                  <span>{readingArticle.pubDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>•</span>
                  <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-extrabold text-[9px] px-2 py-0.5 rounded tracking-wider uppercase">
                    Flux Média Certifié
                  </span>
                </div>
              </div>

              {/* Image banner */}
              {readingArticle.image && (
                <div className="relative aspect-[16/9] w-full bg-gray-100 dark:bg-slate-950 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-800 shadow-sm">
                  <img 
                    src={readingArticle.image} 
                    alt={readingArticle.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Text contents body */}
              <div className="text-gray-700 dark:text-gray-350 text-xs leading-relaxed space-y-4 font-sans">
                <p className="font-medium text-gray-850 dark:text-gray-200 border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 dark:bg-slate-950/50 rounded-r-lg text-sm leading-snug">
                  {readingArticle.description}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Cet article a été capté en direct depuis le flux officiel de l'organe de presse béninois <span className="font-bold text-gray-900 dark:text-white">{readingArticle.source}</span>. Pour consulter l'article d'origine et la mise en page originale du média, vous pouvez visiter le site source d'un simple clic.
                </p>
              </div>

            </div>

            {/* Modal footer controls with call to action */}
            <div className="p-5 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between bg-gray-50/50 dark:bg-slate-950/30 shrink-0">
              <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Id unique: {readingArticle.id}
              </span>
              
              <div className="flex gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => {
                    stopSpeech();
                    setReadingArticle(null);
                  }}
                  className="flex-1 sm:flex-none border border-gray-200 dark:border-slate-800 hover:bg-gray-150 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 font-bold text-xs px-5 py-2.5 rounded-2xl transition-all cursor-pointer text-center whitespace-nowrap"
                >
                  Fermer
                </button>
                <a
                  href={readingArticle.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => addToHistory(readingArticle.id)}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-2xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
                >
                  <span>Visiter le site source</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

function NewsAdCard({ 
  ad, 
  onTrackView, 
  onTrackClick 
}: { 
  ad: any; 
  onTrackView?: (id: string) => void; 
  onTrackClick?: (id: string) => void; 
}) {
  useEffect(() => {
    if (onTrackView) {
      onTrackView(ad.id);
    }
  }, [ad.id, onTrackView]);

  const getLabelText = () => {
    if (ad.label === 'publicite') return 'Publicité';
    if (ad.label === 'annonce') return 'Annonce';
    if (ad.label === 'none') return '';
    return 'Sponsor'; // Default fallback
  };

  const labelText = getLabelText();

  return (
    <a 
      href={ad.targetUrl} 
      target="_blank" 
      rel="noopener noreferrer" 
      onClick={() => onTrackClick && onTrackClick(ad.id)}
      className="group block overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow transition-all relative p-1"
    >
      {ad.type === 'image' ? (
        <div className="relative min-h-[180px] sm:min-h-[220px] max-h-[360px] w-full rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center">
          {/* Ambient Blurred Background */}
          <img 
            src={ad.mediaUrl} 
            alt="" 
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-xl opacity-35 scale-110 pointer-events-none"
            referrerPolicy="no-referrer"
          />
          {/* Real Size Original Aspect-Ratio Image */}
          <img 
            src={ad.mediaUrl} 
            alt={ad.title} 
            loading="lazy"
            className="relative z-10 max-h-[340px] w-auto max-w-full object-contain mx-auto transition-transform duration-500 group-hover:scale-[1.01]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3 text-left z-20">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-white uppercase font-mono tracking-wider drop-shadow-sm leading-tight flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5 text-blue-400 shrink-0 inline-block" />
                <span>{labelText ? `${labelText}: ` : ''}{ad.title}</span>
              </span>
              {ad.advertiserName && (
                <span className="text-[8px] text-gray-300 font-mono tracking-wide block">
                  Annonceur: {ad.advertiserName}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative min-h-[180px] sm:min-h-[220px] max-h-[360px] w-full bg-black flex items-center justify-center overflow-hidden rounded-xl">
          {ad.mediaUrl.includes('youtube.com') || ad.mediaUrl.includes('youtu.be') || ad.mediaUrl.includes('/embed/') ? (
            <iframe 
              src={`${ad.mediaUrl}?autoplay=1&mute=1&loop=1`} 
              title={ad.title}
              className="w-full h-[220px] sm:h-[260px] border-0 pointer-events-none scale-[1.1]" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <video src={ad.mediaUrl} className="w-full h-full max-h-[340px] object-contain" autoPlay muted loop playsInline />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3 text-left z-20">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-white uppercase font-mono tracking-wider drop-shadow-sm leading-tight flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-blue-400 shrink-0 inline-block" />
                <span>{labelText ? `${labelText}: ` : ''}{ad.title}</span>
              </span>
              {ad.advertiserName && (
                <span className="text-[8px] text-gray-300 font-mono tracking-wide block">
                  Annonceur: {ad.advertiserName}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      {labelText && (
        <span className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-sm text-[8px] font-black text-white uppercase tracking-widest px-2 py-0.5 rounded-full font-mono">
          {labelText}
        </span>
      )}
    </a>
  );
}

export default React.memo(NewsSection);
