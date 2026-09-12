import React, { useState } from 'react';
import { ScoreCard } from './ScoreCard';
import { EvidenceCard } from './EvidenceCard';
import { MetadataPanel } from './MetadataPanel';
import { ForensicsPanel } from './ForensicsPanel';
import { ProvenancePanel } from './ProvenancePanel';
import { AnalysisDisclaimer } from './AnalysisDisclaimer';
import { PdfReportModal } from './PdfReportModal';
import { ImageScanReport } from '../../types';
import { Share2, Download, RefreshCw, Trash2, FileText, Check, Microscope, Bookmark, BookmarkCheck, Shield, Loader2 } from 'lucide-react';

interface ImageCheckResultProps {
  report: ImageScanReport;
  onReset: () => void;
  onDelete?: (id: string) => void;
  onSaveToSupabase?: () => void;
  isSavingToDb?: boolean;
  isSavedInDb?: boolean;
}

export const ImageCheckResult: React.FC<ImageCheckResultProps> = ({ 
  report, 
  onReset, 
  onDelete,
  onSaveToSupabase,
  isSavingToDb = false,
  isSavedInDb = false
}) => {
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/report/image/${report.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const isStored = isSavedInDb || report.is_saved_in_database;

  return (
    <div className="space-y-6 my-6">
      
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 text-white rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider block">
              Rapport Actuhub Image Check
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
              isStored 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}>
              <Shield className="w-3 h-3" />
              {isStored ? 'Enregistré dans l\'historique' : 'Non sauvegardé dans la base (Privé)'}
            </span>
          </div>
          <h2 className="text-base font-bold text-white truncate max-w-md">
            {report.filename}
          </h2>
          <span className="text-[11px] text-slate-400">
            Analysé le {new Date(report.created_at).toLocaleString('fr-FR')} | ID : {report.id}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Optional manual save to Supabase button */}
          {onSaveToSupabase && !isStored && (
            <button
              onClick={onSaveToSupabase}
              disabled={isSavingToDb}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              title="Conserver ce rapport dans votre historique de la base de données"
            >
              {isSavingToDb ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" /> Sauvegarder dans l&apos;historique
                </>
              )}
            </button>
          )}

          {isStored && (
            <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-semibold">
              <BookmarkCheck className="w-4 h-4 text-emerald-400" /> Sauvegardé
            </span>
          )}

          <button
            onClick={handleCopyShareLink}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            {copiedLink ? 'Lien copié !' : 'Partager'}
          </button>

          <button
            onClick={() => setShowPdfModal(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> PDF
          </button>

          <button
            onClick={onReset}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
            title="Nouvelle analyse"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Score & Classification */}
      <ScoreCard 
        score={report.score} 
        classification={report.classification} 
        confidence={report.confidence} 
      />

      {/* Primary Visual Evidence Summary */}
      <EvidenceCard report={report} />

      {/* Human Readable Explanation Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-500" />
          Conclusion & Explication de l&apos;Analyse
        </h3>
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
          &quot;{report.explanation}&quot;
        </p>
      </div>

      {/* Mandatory Technical Disclaimer Box */}
      <AnalysisDisclaimer />

      {/* Detailed Technical Breakdown - Toujours affiché sans masquage */}
      <div id="detailed-forensic-analysis" className="space-y-6 pt-2">
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Microscope className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
              Analyse Forensique Détaillée Complète
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit approfondi permanent : provenance & C2PA, métadonnées EXIF, artefacts ELA et signatures de manipulation.
            </p>
          </div>
        </div>

        <ProvenancePanel provenance={report.provenance} />
        <MetadataPanel metadata={report.metadata} />
        <ForensicsPanel forensics={report.forensics} />

        {/* Delete Option */}
        {onDelete && isStored && (
          <div className="flex justify-end pt-2">
            <button
              onClick={() => onDelete(report.id)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-red-600 hover:text-red-700 dark:text-red-400 text-xs font-medium transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Supprimer définitivement de l&apos;historique
            </button>
          </div>
        )}
      </div>

      {/* PDF Modal */}
      {showPdfModal && (
        <PdfReportModal 
          report={report} 
          onClose={() => setShowPdfModal(false)} 
        />
      )}

    </div>
  );
};
