import React, { useState, useEffect } from 'react';
import { ImageUploader } from './ImageUploader';
import { AnalysisProgress } from './AnalysisProgress';
import { ImageCheckResult } from './ImageCheckResult';
import { ImageScanReport, UserProfile } from '../../types';
import { imageCheckService } from '../../utils/supabase';
import { 
  ShieldAlert, 
  History, 
  Search, 
  Sparkles, 
  Database, 
  Trash2, 
  Layers, 
  Calendar, 
  Eye, 
  Lock, 
  User, 
  X,
  CheckCircle2,
  ShieldCheck,
  Bookmark
} from 'lucide-react';

interface ImageCheckProps {
  currentUser?: UserProfile | null;
  onLoginClick?: () => void;
  initialFactCheckId?: string;
}

export const ImageCheck: React.FC<ImageCheckProps> = ({ 
  currentUser, 
  onLoginClick,
  initialFactCheckId 
}) => {
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [currentReport, setCurrentReport] = useState<ImageScanReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);
  const [historyScans, setHistoryScans] = useState<ImageScanReport[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'new' | 'history'>('new');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [isSavingToDb, setIsSavingToDb] = useState<boolean>(false);
  const [isSavedInDb, setIsSavedInDb] = useState<boolean>(false);

  const isGuest = !currentUser;

  // Load user scan history from Supabase if logged in
  useEffect(() => {
    if (!currentUser) {
      setHistoryScans([]);
      return;
    }

    imageCheckService.listScans(currentUser.id)
      .then(scans => {
        setHistoryScans(scans);
      })
      .catch((err) => {
        console.warn('[ImageCheck] Impossible de charger l\'historique Supabase:', err);
      });

    const unsubscribe = imageCheckService.subscribe(scans => {
      setHistoryScans(scans);
    }, currentUser.id);

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUser]);

  // Handle Image Submission
  const handleImageSelected = async (base64: string, filename: string, deleteAfter: boolean) => {
    // Strict authentication gate
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    setErrorMessage(null);
    setSavedSuccessMessage(null);
    setCurrentReport(null);
    setIsSavedInDb(false);
    setCurrentStep(0);

    // Realistic progressive step feedback
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= 6) {
          clearInterval(stepInterval);
          return 6;
        }
        return prev + 1;
      });
    }, 280);

    try {
      const response = await fetch('/api/image-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          filename,
          userId: currentUser.id,
          userEmail: currentUser.email || `${currentUser.id}@actuhub.bj`,
          factCheckId: initialFactCheckId,
          deleteAfterAnalysis: deleteAfter
        })
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          setShowAuthModal(true);
          throw new Error(errData.error || "Connexion requise pour lancer l'analyse d'image.");
        }
        throw new Error(errData.error || 'Erreur lors du traitement de l\'analyse.');
      }

      const data = await response.json();
      setCurrentStep(7);

      setTimeout(() => {
        setCurrentStep(-1);
        
        // Assemble final report with user context (IN-MEMORY ONLY, NOT saved in Supabase automatically)
        const reportResult: ImageScanReport = {
          ...data.report,
          user_id: currentUser.id,
          user_email: currentUser.email || undefined,
          is_saved_in_database: false
        };

        setCurrentReport(reportResult);
      }, 400);

    } catch (err: any) {
      clearInterval(stepInterval);
      setCurrentStep(-1);
      setErrorMessage(err.message || 'Échec du traitement de l\'image.');
    }
  };

  // Optional manual save to Supabase
  const handleManualSaveToSupabase = async () => {
    if (!currentReport || !currentUser) return;
    setIsSavingToDb(true);
    try {
      const reportToSave: ImageScanReport = {
        ...currentReport,
        is_saved_in_database: true
      };
      await imageCheckService.saveScan(reportToSave);
      setIsSavedInDb(true);
      setSavedSuccessMessage("Analyse enregistrée avec succès dans votre historique personnel.");
      const updated = await imageCheckService.listScans(currentUser.id);
      setHistoryScans(updated);
    } catch (saveErr) {
      console.error('[ImageCheck] Erreur enregistrement Supabase:', saveErr);
      setErrorMessage("Impossible d'enregistrer dans l'historique.");
    } finally {
      setIsSavingToDb(false);
    }
  };

  const handleReset = () => {
    setCurrentReport(null);
    setCurrentStep(-1);
    setErrorMessage(null);
    setSavedSuccessMessage(null);
    setIsSavedInDb(false);
  };

  const handleDeleteScan = async (id: string) => {
    try {
      await imageCheckService.deleteScan(id);
      fetch(`/api/image-check/${id}`, { method: 'DELETE' }).catch(() => {});
      if (currentUser) {
        const updated = await imageCheckService.listScans(currentUser.id);
        setHistoryScans(updated);
      }
      if (currentReport?.id === id) {
        handleReset();
      }
    } catch (err) {
      console.warn('Erreur suppression scan:', err);
    }
  };

  const handleOpenAuth = () => {
    if (onLoginClick) {
      onLoginClick();
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Module Forensique Visuel & IA Multimodale
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            🔎 ACTUHUB IMAGE CHECK
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Analyse d&apos;authenticité visuelle haute précision, détection d&apos;images générées par IA (Midjourney, DALL-E, Flux, Stable Diffusion), métadonnées EXIF et vérification forensique. Vos images analysées restent strictement privées et ne sont pas enregistrées automatiquement dans la base de données.
          </p>
        </div>
      </div>

      {/* Guest Authentication Warning Banner */}
      {isGuest && (
        <div id="image-check-auth-alert" className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-extrabold text-amber-950 dark:text-amber-200">
                Fonctionnalité réservée aux utilisateurs connectés
              </h2>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed max-w-xl">
                L&apos;analyse approfondie d&apos;images et la détection forensique par IA visuelle sont réservées aux membres connectés afin de garantir un service de qualité et de préserver la confidentialité de vos vérifications.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAuth}
            className="w-full sm:w-auto px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-extrabold shadow-sm transition-all inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <User className="w-4 h-4" /> Se connecter / S&apos;inscrire
          </button>
        </div>
      )}

      {/* Sub Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => { setActiveSubTab('new'); handleReset(); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'new'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Search className="w-4 h-4" /> Nouvelle Analyse
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'history'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" /> Historique Enregistré {currentUser ? `(${historyScans.length})` : ''}
        </button>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 rounded-2xl text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 text-red-500" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Success Banner */}
      {savedSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedSuccessMessage}</span>
        </div>
      )}

      {/* NEW ANALYSIS VIEW */}
      {activeSubTab === 'new' && (
        <>
          {currentStep >= 0 ? (
            <AnalysisProgress currentStep={currentStep} />
          ) : currentReport ? (
            <div className="space-y-4">
              <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-slate-800 dark:text-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>
                    {isSavedInDb 
                      ? "Cette analyse a été enregistrée dans votre historique." 
                      : "Analyse terminée avec succès. Non enregistrée dans la base de données (Privé)."}
                  </span>
                </div>

                {!isSavedInDb && (
                  <button
                    onClick={handleManualSaveToSupabase}
                    disabled={isSavingToDb}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all text-xs cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    {isSavingToDb ? "Sauvegarde..." : "Sauvegarder dans mon historique"}
                  </button>
                )}
              </div>

              <ImageCheckResult 
                report={currentReport} 
                onReset={handleReset} 
                onDelete={handleDeleteScan}
                onSaveToSupabase={handleManualSaveToSupabase}
                isSavingToDb={isSavingToDb}
                isSavedInDb={isSavedInDb}
              />
            </div>
          ) : (
            <ImageUploader 
              onImageSelected={handleImageSelected} 
              isGuest={isGuest}
              onRequireLogin={handleOpenAuth}
            />
          )}
        </>
      )}

      {/* HISTORY VIEW (SUPABASE PERSISTED) */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              Historique de vos Analyses Enregistrées
            </h3>
            {currentUser && historyScans.length > 0 && (
              <span className="text-xs text-slate-500 font-mono">
                {historyScans.length} rapport{historyScans.length > 1 ? 's' : ''} enregistré{historyScans.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {isGuest ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Connectez-vous pour voir votre historique
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Les analyses que vous choisissez d&apos;enregistrer manuellement seront accessibles ici.
                </p>
              </div>
              <button
                onClick={handleOpenAuth}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-extrabold shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4" /> Se connecter maintenant
              </button>
            </div>
          ) : historyScans.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <History className="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                Aucune analyse enregistrée dans votre historique.
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Par défaut, vos analyses sont éphémères et ne sont pas enregistrées dans la base de données. Vous pouvez cliquer sur &quot;Sauvegarder dans mon historique&quot; lors d&apos;un audit pour le conserver ici.
              </p>
              <button
                onClick={() => setActiveSubTab('new')}
                className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4" /> Lancer une analyse
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {historyScans.map((scan) => {
                const isSuspicious = scan.score < 50;
                const isModerate = scan.score >= 50 && scan.score < 75;
                const badgeColor = isSuspicious 
                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
                  : isModerate
                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900';

                return (
                  <div 
                    key={scan.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs truncate max-w-[200px]" title={scan.filename}>
                          {scan.filename}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                          Score : {scan.score}/100
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                          <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{scan.classification}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({scan.confidence})</span>
                        </div>
                        {scan.explanation && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                            &quot;{scan.explanation}&quot;
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(scan.created_at).toLocaleString('fr-FR')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => { setCurrentReport(scan); setActiveSubTab('new'); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition-all text-xs font-bold cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Voir le rapport complet
                      </button>

                      <button
                        onClick={() => handleDeleteScan(scan.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                        title="Supprimer définitivement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Auth Modal required dialog for guests */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 text-center relative">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Connexion requise pour l&apos;analyse d&apos;image
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                L&apos;analyse forensique et la détection d&apos;authenticité visuelle sont exclusivement réservées aux utilisateurs connectés.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl text-left border border-slate-200 dark:border-slate-700 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Identification visuelle et description précise du contenu</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Détection avancée d&apos;images générées par IA (Midjourney, Flux, DALL-E)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Analyse détaillée permanente (EXIF, ELA, C2PA, bruit forensique)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Confidentialité totale : aucune sauvegarde automatique sans votre choix</span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  if (onLoginClick) onLoginClick();
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider font-mono"
              >
                <User className="w-4 h-4" />
                <span>Se connecter ou S&apos;inscrire</span>
              </button>
              <button
                onClick={() => setShowAuthModal(false)}
                className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 py-1 cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
