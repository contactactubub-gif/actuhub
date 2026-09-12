import React from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface AnalysisProgressProps {
  currentStep: number;
}

const STEPS = [
  'Réception de l\'image',
  'Vérification du fichier & Magic Bytes',
  'Extraction des métadonnées EXIF/XMP',
  'Vérification de provenance C2PA',
  'Analyse forensique (ELA, bruit)',
  'Détection IA & Motifs synthétiques',
  'Calcul du score Actuhub',
  'Génération du rapport'
];

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ currentStep }) => {
  const percentage = Math.min(100, Math.round(((currentStep + 1) / STEPS.length) * 100));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 my-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Analyse d&apos;image en cours...
          </h3>
        </div>
        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{percentage}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
        <div 
          className="bg-indigo-600 h-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Steps List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {STEPS.map((stepName, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div 
              key={idx}
              className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                isCurrent 
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 font-semibold text-indigo-900 dark:text-indigo-200' 
                  : isDone 
                  ? 'text-slate-600 dark:text-slate-400' 
                  : 'opacity-40 text-slate-400'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0 flex items-center justify-center text-[10px]">
                  {idx + 1}
                </div>
              )}
              <span className="truncate">{stepName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
