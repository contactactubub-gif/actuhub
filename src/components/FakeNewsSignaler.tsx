import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Send, ThumbsUp, Calendar, User, Search, 
  CheckCircle2, AlertOctagon, HelpCircle, Eye, ChevronDown, ChevronUp, Plus, Mic, MicOff,
  XCircle, AlertTriangle, CheckCircle, Loader2, ShieldCheck
} from 'lucide-react';
import { FakeNewsReport, Advertisement } from '../types';
import { db, collection, setDoc, doc, onSnapshot, handleDatabaseError, handleFirestoreError, OperationType } from '../utils/supabase';
import { AdCarousel } from './AdCarousel';
import { ConfirmationModal, ConfirmationType } from './ConfirmationModal';


const INITIAL_REPORTS: FakeNewsReport[] = [];

export default function FakeNewsSignaler({ 
  initialActiveReportId,
  searchQuery,
  onSearchQueryChange,
  currentUser,
  advertisements = [],
  onTrackView,
  onTrackClick
}: { 
  initialActiveReportId?: string;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  currentUser?: any;
  advertisements?: Advertisement[];
  onTrackView?: (id: string) => void;
  onTrackClick?: (id: string) => void;
}) {
  const [reports, setReports] = useState<FakeNewsReport[]>([]);
  const [localSearch, setLocalSearch] = useState('');
  const search = searchQuery !== undefined ? searchQuery : localSearch;
  const setSearch = onSearchQueryChange !== undefined ? onSearchQueryChange : setLocalSearch;
  
  const [isListening, setIsListening] = useState(false);
  const [voiceSearchError, setVoiceSearchError] = useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);

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
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          const cleanTranscript = transcript.trim().replace(/\.$/, '');
          setSearch(cleanTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          setVoiceSearchError("L'accès au microphone est bloqué. Veuillez autoriser le microphone dans votre navigateur.");
        } else {
          setVoiceSearchError("Reconnaissance vocale interrompue ou non disponible.");
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn("Speech recognition start failed:", err);
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

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const [filterCat, setFilterCat] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [activeReportId, setActiveReportId] = useState<string | null>(initialActiveReportId || null);

  useEffect(() => {
    if (initialActiveReportId) {
      setActiveReportId(initialActiveReportId);
    }
  }, [initialActiveReportId]);

  // Form Fields State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('société');
  const [formUrl, setFormUrl] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formName, setFormName] = useState(currentUser?.fullName || '');
  const [formLevel, setFormLevel] = useState<'bas' | 'moyen' | 'critique'>('moyen');
  const [successToast, setSuccessToast] = useState(false);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type?: ConfirmationType;
    title: string;
    message: string;
    details?: string | React.ReactNode;
    confirmText?: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const triggerConfirm = (options: {
    type?: ConfirmationType;
    title: string;
    message: string;
    details?: string | React.ReactNode;
    confirmText?: string;
    onConfirm: () => void | Promise<void>;
  }) => {
    setConfirmDialog({
      isOpen: true,
      type: options.type || 'warning',
      title: options.title,
      message: options.message,
      details: options.details,
      confirmText: options.confirmText,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        await options.onConfirm();
      }
    });
  };

  useEffect(() => {
    if (currentUser?.fullName) {
      setFormName(currentUser.fullName);
    }
  }, [currentUser]);

  // Load from real-time Firestore database rumeurs!
  useEffect(() => {
    const q = collection(db, "rumeurs");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: FakeNewsReport[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as FakeNewsReport);
      });
      if (fetched.length > 0) {
        setReports(fetched);
      } else {
        // Seed initial reports to Firestore on first run
        INITIAL_REPORTS.forEach((r) => {
          setDoc(doc(db, "rumeurs", r.id), r).catch(err => {
            console.warn("Could not seed rumeur to Firestore:", err);
          });
        });
        setReports(INITIAL_REPORTS);
      }
    }, (err) => {
      console.warn("Firestore rumeurs connection failed:", err);
      try {
        handleFirestoreError(err, OperationType.GET, "rumeurs");
      } catch (e) {}
      setReports(INITIAL_REPORTS);
    });

    return () => unsubscribe();
  }, []);

  const handleUpvote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetReport = reports.find(rep => rep.id === id);
    if (!targetReport) return;
    
    const nextReport = { ...targetReport, upvotes: targetReport.upvotes + 1 };
    
    // Sync single report document update to Firestore
    try {
      await setDoc(doc(db, "rumeurs", id), nextReport);
    } catch (err) {
      console.warn("Failed syncing upvote to Firestore", err);
      try {
        handleFirestoreError(err, OperationType.UPDATE, `rumeurs/${id}`);
      } catch (e) {}
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDesc.trim()) return;

    triggerConfirm({
      type: 'add',
      title: "Transmettre ce signalement ?",
      message: `Voulez-vous vraiment publier le signalement "${formTitle.trim()}" pour analyse par l'équipe de vérification ?`,
      confirmText: "Transmettre le signalement",
      onConfirm: async () => {
        const freshReport: FakeNewsReport = {
          id: "user-" + Date.now().toString().slice(-6),
          title: formTitle.trim(),
          category: formCategory,
          url: formUrl.trim() || undefined,
          description: formDesc.trim(),
          status: 'pending',
          explanation: "Ce signalement citoyen a bien été partagé et enregistré en temps réel. Un modérateur ou journaliste de l'ActuHub va examiner les preuves sous 24h pour y associer un verdict de confiance officiel.",
          date: new Date().toLocaleDateString('fr-FR'),
          reporterName: formName.trim() || "Citoyen Anonyme",
          upvotes: 1,
          level: formLevel
        };

        // Upload to Firebase Firestore in real-time
        try {
          await setDoc(doc(db, "rumeurs", freshReport.id), freshReport);
        } catch (err) {
          console.warn("Failed sending report to Firestore", err);
          try {
            handleFirestoreError(err, OperationType.CREATE, `rumeurs/${freshReport.id}`);
          } catch (e) {}
        }

        // Send direct notification email to contactactubub@gmail.com
        try {
          await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: freshReport.reporterName,
              email: 'contactactubub@gmail.com',
              subject: `[SIGNALEMENT CITOYEN URGENT] ${freshReport.title}`,
              message: `Nouveau signalement citoyen recu :\n- Titre: ${freshReport.title}\n- Categorie: ${freshReport.category}\n- Niveau d'urgence: ${freshReport.level}\n- URL Source: ${freshReport.url || 'Non fournie'}\n- Description: ${freshReport.description}\n- Auteur: ${freshReport.reporterName}`,
              type: 'Signalement Rumeur/Fake News'
            })
          });
        } catch (mailErr) {
          console.warn("Erreur envoi notification email signalement", mailErr);
        }

        // Reset Form
        setFormTitle('');
        setFormUrl('');
        setFormDesc('');
        setFormName('');
        setFormOpen(false);
        
        setSuccessToast(true);
        setTimeout(() => setSuccessToast(false), 4000);
      }
    });
  };

  const filteredReports = reports.filter(rep => {
    const matchesSearch = rep.title.toLowerCase().includes(search.toLowerCase()) || 
                          rep.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCat === 'all' || rep.category === filterCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div id="fake-signaler-main" className="space-y-6 max-w-3xl mx-auto">
      
      {/* Emplacement publicitaire au-dessus de l'Espace Signalements & Rumeurs */}
      <AdCarousel
        advertisements={advertisements}
        placementFilter="above_rumors"
        onTrackView={onTrackView}
        onTrackClick={onTrackClick}
        autoPlayInterval={3000}
        className="mb-2"
      />

      {/* Platform Welcome details */}
      <div id="signaler-intro-card" className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 animate-pulse animate-duration-1000" />
            <span className="text-base font-extrabold text-gray-900 dark:text-slate-100 leading-none">Centre de Signalement Citoyen de Fakes</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 max-w-lg">
            Vous avez vu un message suspect, une rumeur inquiétante ou un faux site sur WhatsApp, Facebook ou en ruelle au Bénin ? Signalez-le ci-dessous pour lancer l'audit.
          </p>
        </div>
        <button
          id="toggle-signaling-form"
          onClick={() => setFormOpen(!formOpen)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-2xl transition-all shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Faire un Signalement</span>
        </button>
      </div>

      {/* Success notification toast banner */}
      {successToast && (
        <div id="reporting-success-toast" className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Votre signalement a bien été publié avec succès. La communauté et l'équipe de modération ont été informées !</span>
        </div>
      )}

      {/* Submit signaling Form */}
      {formOpen && (
        <form id="signaler-input-form" onSubmit={handleFormSubmit} className="bg-white dark:bg-slate-900 border-2 border-red-100 dark:border-red-900/40 rounded-3xl p-6 md:p-8 shadow-md space-y-4 animate-slide-down">
          <div id="form-header-row" className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
            <h3 className="text-sm font-extrabold text-red-950 dark:text-red-200 uppercase tracking-wide flex items-center gap-1 shadow-sm px-2.5 py-1 bg-red-50 dark:bg-red-950/50 rounded-lg">
              Formulaire de Signalement Citoyen Urgent
            </h3>
            <button 
              id="form-close-x"
              type="button" 
              onClick={() => setFormOpen(false)}
              className="text-gray-400 hover:text-gray-800 dark:hover:text-slate-200 px-2.5 py-1 rounded-md hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              Fermer
            </button>
          </div>

          <div id="form-row-1" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                Titre de la Rumeur / Intitulé du message suspect
              </label>
              <input
                id="form-input-title"
                type="text"
                required
                maxLength={100}
                placeholder="Ex: Faux communiqué de recrutement à la douane béninoise..."
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full text-xs border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-red-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                Thématique du message
              </label>
              <select
                id="form-input-cat"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full text-xs border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-red-500 focus:outline-none cursor-pointer"
              >
                <option value="société">Société & Commérages</option>
                <option value="santé">Pharmacie & Santé</option>
                <option value="politique">Politique & Institutions</option>
                <option value="finance">Économie & Arnaque Argent</option>
                <option value="autre">Autre Thème</option>
              </select>
            </div>
          </div>

          <div id="form-row-2" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                Lien de la fake news (Optionnel, URL du site suspect)
              </label>
              <input
                id="form-input-link"
                type="url"
                placeholder="https://communique-arnaque-benin.info"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                className="w-full text-xs border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-red-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                Niveau de danger / Urgence du signalement
              </label>
              <select
                id="form-input-level"
                value={formLevel}
                onChange={(e) => setFormLevel(e.target.value as any)}
                className="w-full text-xs border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-red-500 focus:outline-none cursor-pointer"
              >
                <option value="bas">Bas - Risque d'erreur isolée</option>
                <option value="moyen">Moyen - propagation modeste</option>
                <option value="critique">Critique - Alarme générale et panique</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
              Explication de la suspicion d'information
            </label>
            <textarea
              id="form-input-desc"
              required
              rows={3}
              placeholder="Expliquez ici pourquoi vous suspectez que cette information est fausse et partagez les éléments observables (preuves, contradictions locales)..."
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              className="w-full text-xs border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-red-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                Votre Nom / Pseudo (Optionnel)
              </label>
              <input
                id="form-input-name"
                type="text"
                placeholder="Ex: Christian G. de Parakou"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full text-xs border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-red-500 focus:outline-none"
              />
            </div>
            <div className="flex items-end pt-2">
              <button
                id="form-submit-btn"
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-2xl transition-all shadow shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Envoyer le Signalement Urgents</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Admin Publications & Verdicts on Signalisations */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
              Publications et Verdicts sur les Signalisations
            </h3>
          </div>
        </div>

        {/* Categories sorting and Search row */}
        <div id="reported-controls-box" className="bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/60 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
          
          {/* Category buttons filters */}
          <div id="filter-rep-row" className="flex gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            {['all', 'société', 'santé', 'politique', 'finance'].map(cat => (
              <button
                id={`chip-rep-cat-${cat}`}
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                  filterCat === cat 
                    ? 'bg-gray-900 border-gray-900 text-white dark:bg-blue-600 dark:border-blue-600' 
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                }`}
              >
                {cat === 'all' ? 'Tous les Thèmes' : cat.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Search */}
          <div id="search-rep-box" className="relative w-full sm:w-64">
            <input
              id="reported-query-input"
              type="text"
              placeholder={isListening ? "Parlez maintenant..." : "Rechercher une rumeur..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-8 pr-10 py-1.5 rounded-lg border text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors dark:bg-slate-800 dark:text-slate-100 ${
                isListening 
                  ? 'border-red-500 bg-red-50/25 dark:bg-red-950/10 placeholder-red-400 font-medium' 
                  : 'border-gray-250 dark:border-slate-700'
              }`}
            />
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
            
            <button
              id="mic-rumor-search-button"
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
        </div>

        {/* Grid List Alerts of Signalings */}
        <div id="reported-news-list" className="space-y-4">
          {filteredReports.length === 0 ? (
            <div id="empty-signaling-container" className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-4">
              <HelpCircle className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 opacity-60" />
              <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-2">Aucun signalement trouvé</h4>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 max-w-[240px] mx-auto mt-1">Aucune rumeur ne correspond à vos filtres. Soyez vigilant.</p>
            </div>
          ) : (
            filteredReports.map((rep) => {
              const isExpanded = activeReportId === rep.id;
              return (
                <div
                  id={`report-item-box-${rep.id}`}
                  key={rep.id}
                  onClick={() => setActiveReportId(isExpanded ? null : rep.id)}
                  className={`bg-white dark:bg-slate-800/70 border rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer space-y-4 ${
                    isExpanded ? 'border-blue-400 dark:border-blue-500' : 'border-gray-200 dark:border-slate-700/80 hover:-translate-y-0.5'
                  }`}
                >
                  {/* Header row */}
                  <div id={`rep-head-${rep.id}`} className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      {/* Status Badge indicator */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide border ${
                        rep.status === 'fake' 
                          ? 'bg-rose-100 border-rose-300 text-rose-950 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-200' 
                          : rep.status === 'misleading'
                            ? 'bg-amber-100 border-amber-300 text-amber-950 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-200'
                            : rep.status === 'verified'
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-950 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-200'
                              : 'bg-blue-100 border-blue-300 text-blue-950 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-200'
                      }`}>
                        {rep.status === 'fake' && <XCircle className="w-3.5 h-3.5 text-rose-800 dark:text-rose-300 shrink-0" />}
                        {rep.status === 'fake' && "Vérifié Faux"}
                        
                        {rep.status === 'misleading' && <AlertTriangle className="w-3.5 h-3.5 text-amber-800 dark:text-amber-300 shrink-0" />}
                        {rep.status === 'misleading' && "Trompeur/Décontextualisé"}
                        
                        {rep.status === 'verified' && <CheckCircle className="w-3.5 h-3.5 text-emerald-800 dark:text-emerald-300 shrink-0" />}
                        {rep.status === 'verified' && "Vrai et Vérifié"}
                        
                        {rep.status !== 'fake' && rep.status !== 'misleading' && rep.status !== 'verified' && <Loader2 className="w-3.5 h-3.5 text-blue-800 dark:text-blue-300 animate-spin shrink-0" />}
                        {rep.status !== 'fake' && rep.status !== 'misleading' && rep.status !== 'verified' && "En cours d'analyse"}
                      </span>

                      {/* Urgency Badge */}
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        rep.level === 'critique' 
                          ? 'bg-white dark:bg-slate-900 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 animate-pulse' 
                          : 'bg-white dark:bg-slate-900 border-neutral-200 dark:border-slate-700 text-neutral-500 dark:text-slate-400'
                      }`}>
                        Danger {rep.level}
                      </span>
                    </div>

                    <span className="text-[10px] bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                      {rep.category}
                    </span>
                  </div>

                  {/* Title and Short descriptions */}
                  <div id={`rep-summary-${rep.id}`} className="space-y-1.5">
                    <h4 className="text-xs md:text-sm font-extrabold text-gray-900 dark:text-gray-100 tracking-tight leading-snug">
                      {rep.title}
                    </h4>
                    <p className={`text-xs text-gray-500 dark:text-gray-400 ${isExpanded ? '' : 'line-clamp-2'}`}>
                      {rep.description}
                    </p>
                  </div>

                  {/* Extra Metadata row in card footer */}
                  <div id={`rep-footer-${rep.id}`} className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-700 text-[10px] text-gray-400 dark:text-gray-500">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        <span>Par: {rep.reporterName}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{rep.date}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pointer-events-auto">
                      {/* Citizen upvote system of alarms */}
                      <button
                        id={`upvote-rep-${rep.id}`}
                        onClick={(e) => handleUpvote(rep.id, e)}
                        className="p-1 px-2.5 rounded bg-gray-50 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest font-black font-mono flex items-center gap-1 shrink-0 cursor-pointer shadow-sm border border-gray-200 dark:border-slate-600"
                        title="Soutenir ce signalement alarmiste"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{rep.upvotes}</span>
                      </button>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                    </div>
                  </div>

                  {/* Dropdown open explanation factcheck reviews drawer */}
                  {isExpanded && (
                    <div 
                      id={`rep-verdict-box-${rep.id}`} 
                      className="p-4 bg-slate-50 dark:bg-slate-900/80 border border-gray-200 dark:border-slate-700 rounded-2xl space-y-3 animate-fade-in"
                    >
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-2.5 py-1 rounded-lg w-max shrink-0 shadow-sm">
                        {rep.status === 'fake' || rep.status === 'misleading' ? (
                          <AlertOctagon className="w-4 h-4 text-red-600 dark:text-red-400" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        )}
                        <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-200">
                          {rep.reason || "Vérification Fact-Check Officielle"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium font-sans">
                        {rep.explanation}
                      </p>
                      {rep.url && (
                        <div className="pt-2 border-t border-gray-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                          <span className="text-gray-400">Source signalée :</span>
                          <a 
                            href={rep.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[200px]"
                          >
                            {rep.url}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Confirmation Dialog Component */}
      <ConfirmationModal
        isOpen={confirmDialog.isOpen}
        type={confirmDialog.type}
        title={confirmDialog.title}
        message={confirmDialog.message}
        details={confirmDialog.details}
        confirmText={confirmDialog.confirmText}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
}
