import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, X, Mic, MicOff, Sparkles, Filter, Clock, ArrowRight, 
  Newspaper, Play, ShieldAlert, Award, FileText, CheckCircle2, History, Trash2, ExternalLink 
} from 'lucide-react';
import { Article, ShortVideo, FakeNewsReport, Lesson, JournalFrontPage } from '../types';
import { performUnifiedSearch, SearchResultItem, SearchFilterOptions } from '../utils/searchEngine';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  videos: ShortVideo[];
  rumors: FakeNewsReport[];
  courses: Lesson[];
  frontpages: JournalFrontPage[];
  onSelectResult: (item: SearchResultItem) => void;
}

const TRENDING_TAGS = [
  '#Elections2026',
  '#FactChecking',
  '#PortDeCotonou',
  '#ANIP',
  '#Bac2026',
  '#PatriceTalon',
  '#ORTB',
  '#PoliceRépublicaine',
];

export function GlobalSearchModal({
  isOpen,
  onClose,
  articles,
  videos,
  rumors,
  courses,
  frontpages,
  onSelectResult,
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<SearchFilterOptions['type']>('all');
  const [filterDate, setFilterDate] = useState<SearchFilterOptions['dateRange']>('all');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize empty search history
  useEffect(() => {
    setSearchHistory([]);
  }, []);

  // Save query to history in-memory
  const saveToHistory = (term: string) => {
    if (!term.trim()) return;
    const cleanTerm = term.trim();
    const updated = [cleanTerm, ...searchHistory.filter(h => h.toLowerCase() !== cleanTerm.toLowerCase())].slice(0, 8);
    setSearchHistory(updated);
  };

  const clearHistory = () => {
    setSearchHistory([]);
  };

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle Keyboard Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Perform search on query / filters change
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchOptions: SearchFilterOptions = {
      type: filterType,
      dateRange: filterDate,
      minScore: 3,
    };

    const hits = performUnifiedSearch(
      query,
      { articles, videos, rumors, courses, frontpages },
      searchOptions
    );

    setResults(hits);
  }, [query, filterType, filterDate, articles, videos, rumors, courses, frontpages]);

  // Voice Search Handler
  const toggleVoiceSearch = () => {
    setVoiceError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError("La recherche vocale n'est pas supportée par votre navigateur.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setQuery(transcript);
          saveToHistory(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setVoiceError("Recherche vocale annulée ou non reconnue.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
      setVoiceError("Erreur d'accès au microphone.");
    }
  };

  const handleSelectResultItem = (item: SearchResultItem) => {
    saveToHistory(query);
    onSelectResult(item);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-start justify-center pt-8 sm:pt-16 px-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      
      {/* Modal Card Box */}
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Search Header Input Area */}
        <div className="p-4 sm:p-5 border-b border-slate-150 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-blue-600 dark:text-blue-400" />
            
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isListening ? "Écoute en cours... Parlez maintenant" : "Rechercher un article, décret, rumeur, vidéo, cours..."}
              className={`w-full pl-12 pr-24 py-3.5 rounded-2xl text-sm font-semibold border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isListening
                  ? 'border-red-500 bg-red-50/30 text-red-900 dark:text-red-200 placeholder-red-400 font-bold animate-pulse'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400'
              }`}
            />

            <div className="absolute right-3 flex items-center gap-1">
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition-colors"
                  title="Effacer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={toggleVoiceSearch}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isListening
                    ? 'text-red-600 bg-red-100 dark:bg-red-950/60 animate-bounce'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
                title="Recherche Vocale"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-xs font-mono font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer ml-1"
              >
                ESC
              </button>
            </div>
          </div>

          {voiceError && (
            <div className="text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2 rounded-xl border border-red-200 dark:border-red-900/40 font-mono">
              ⚠️ {voiceError}
            </div>
          )}

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto font-mono text-[11px]">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Tous
              </button>

              <button
                onClick={() => setFilterType('article')}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                  filterType === 'article'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Newspaper className="w-3 h-3" />
                <span>Articles</span>
              </button>

              <button
                onClick={() => setFilterType('rumor')}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                  filterType === 'rumor'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <ShieldAlert className="w-3 h-3" />
                <span>Fact-Checks</span>
              </button>

              <button
                onClick={() => setFilterType('video')}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                  filterType === 'video'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Play className="w-3 h-3" />
                <span>Shorts TV</span>
              </button>

              <button
                onClick={() => setFilterType('course')}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                  filterType === 'course'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Award className="w-3 h-3" />
                <span>Académie</span>
              </button>

              <button
                onClick={() => setFilterType('frontpage')}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                  filterType === 'frontpage'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>UNEs</span>
              </button>
            </div>

            {/* Date Dropdown */}
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value as any)}
              className="text-[11px] font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-2.5 py-1 focus:outline-none cursor-pointer"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Dernières 24 heures</option>
              <option value="week">7 derniers jours</option>
              <option value="month">Ce mois-ci</option>
            </select>
          </div>
        </div>

        {/* Results / Suggestions Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Empty state when no query typed */}
          {!query.trim() && (
            <div className="space-y-6">
              
              {/* History Section */}
              {searchHistory.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-blue-500" />
                      <span>Historique de recherche</span>
                    </span>
                    <button
                      onClick={clearHistory}
                      className="text-[10px] text-slate-400 hover:text-rose-500 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Effacer
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setQuery(term);
                          saveToHistory(term);
                        }}
                        className="text-xs bg-slate-100 dark:bg-slate-800/70 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 font-medium"
                      >
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Topics Suggestions */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Sujets et Mots-Clés Tendances au Bénin</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_TAGS.map((tag, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const clean = tag.replace('#', '');
                        setQuery(clean);
                        saveToHistory(clean);
                      }}
                      className="text-xs bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 px-3 py-1.5 rounded-xl font-mono font-bold transition-all cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Features Info Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 text-white space-y-2 text-xs">
                <span className="font-mono font-black text-emerald-400 uppercase text-[10px]">💡 Moteur de Recherche Intelligent</span>
                <p className="text-slate-200 leading-relaxed">
                  Saisissez n'importe quel mot-clé, phrase complète, nom de média, ou sujet pour effectuer une recherche croisée dans tous nos articles de presse, décryptages, vidéos et cours académiques.
                </p>
              </div>

            </div>
          )}

          {/* Results List */}
          {query.trim() && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                <span>Résultats trouvés ({results.length})</span>
                {results.length > 0 && <span>Trier par pertinence ⚡</span>}
              </div>

              {results.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Aucun résultat trouvé pour "{query}"</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Essayez d'utiliser d'autres mots-clés, d'enlever les filtres spécifiques ou de vérifier l'orthographe.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectResultItem(item)}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 hover:bg-slate-100/80 dark:bg-slate-950/40 dark:hover:bg-slate-800/60 transition-all cursor-pointer group space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${item.badgeColor}`}>
                          {item.typeLabel}
                        </span>

                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.sourceOrCategory}
                        </span>
                      </div>

                      <div className="flex gap-4 items-start">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800 bg-white"
                          />
                        )}

                        <div className="space-y-1 flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                            {item.title}
                          </h4>

                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {item.snippet}
                          </p>
                        </div>

                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
          <span>ActuHub Benin Smart Search v2.5</span>
          <span className="hidden sm:inline">Appuyez sur ESC pour fermer</span>
        </div>

      </div>
    </div>
  );
}
