import React from 'react';
import { Cpu, FileText, Camera, Fingerprint, Eye, Sparkles, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import { ImageScanReport } from '../../types';

interface EvidenceCardProps {
  report: ImageScanReport;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ report }) => {
  const isSuspicious = report.classification === 'PROBABLEMENT_GENEREE_OU_MODIFIEE' || report.classification === 'FORTEMENT_SUSPECTE';
  const isAuthentic = report.classification === 'PROBABLEMENT_AUTHENTIQUE' || report.classification === 'FAIBLE_SUSPICION';

  return (
    <div className="space-y-4 my-6">
      {/* 4-Stat Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. AI Probability */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Suspicion IA</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">
                {report.ai_analysis?.ai_probability ?? report.score}%
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate" title={report.ai_analysis?.model_name}>
            {report.ai_analysis?.detected_generator || report.ai_analysis?.model_name || 'Vision Forensics'}
          </p>
        </div>

        {/* 2. C2PA Provenance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Provenance C2PA</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {report.provenance?.c2pa_found ? 'Détecté ✅' : 'Non détecté ⚪'}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {report.provenance?.software || 'Aucun certificat'}
          </p>
        </div>

        {/* 3. Metadata */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Métadonnées EXIF</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate block max-w-[140px]">
                {report.metadata?.camera || report.metadata?.software || 'Aucune EXIF'}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {report.metadata?.date_taken || 'Date non spécifiée'}
          </p>
        </div>

        {/* 4. Forensics */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Intégrité & ELA</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">
                {100 - (report.manipulation_score || 0)}%
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {report.forensics?.anomalies.length || 0} observation(s)
          </p>
        </div>
      </div>

      {/* Visual Content Recognition & Scene Identification Box */}
      {(report.image_description || report.ai_analysis?.image_description) && (
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <Eye className="w-4 h-4 text-indigo-500" />
            Identification du Contenu Visuel & Scène
          </div>
          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
            {report.image_description || report.ai_analysis?.image_description}
          </p>
        </div>
      )}

      {/* Key Visual Forensics Observations */}
      {report.ai_analysis?.signals && report.ai_analysis.signals.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Observations Visuelles Précises
            </h4>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              isAuthentic 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                : isSuspicious
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
            }`}>
              {report.ai_analysis.signals.length} signal(s) analysé(s)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {report.ai_analysis.signals.map((signal, idx) => (
              <div 
                key={idx} 
                className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
              >
                {isSuspicious ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                )}
                <span>{signal}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fact-Checking Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-300">
            <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Recommandations de Fact-Checking
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 leading-relaxed">
            {report.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
