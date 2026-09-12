import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, HelpCircle, CheckCircle2 } from 'lucide-react';
import { ImageScanClassification, ImageScanConfidence } from '../../types';

interface ScoreCardProps {
  score: number;
  classification: ImageScanClassification;
  confidence: ImageScanConfidence;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ score, classification, confidence }) => {

  const getClassificationConfig = () => {
    switch (classification) {
      case 'PROBABLEMENT_AUTHENTIQUE':
        return {
          label: 'IMAGE PROBABLEMENT AUTHENTIQUE',
          badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          icon: ShieldCheck,
          color: 'text-emerald-600 dark:text-emerald-400',
          gaugeColor: 'bg-emerald-500'
        };
      case 'FAIBLE_SUSPICION':
        return {
          label: 'FAIBLE SUSPICION DE MODIFICATION',
          badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
          icon: CheckCircle2,
          color: 'text-blue-600 dark:text-blue-400',
          gaugeColor: 'bg-blue-500'
        };
      case 'INCONCLUSIF':
        return {
          label: 'RÉSULTAT INCONCLUSIF / INDICES INSUFFISANTS',
          badgeClass: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
          icon: HelpCircle,
          color: 'text-slate-600 dark:text-slate-400',
          gaugeColor: 'bg-slate-500'
        };
      case 'PROBABLEMENT_GENEREE_OU_MODIFIEE':
        return {
          label: 'PROBABLEMENT GÉNÉRÉE OU MODIFIÉE PAR IA',
          badgeClass: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
          icon: AlertTriangle,
          color: 'text-orange-600 dark:text-orange-400',
          gaugeColor: 'bg-orange-500'
        };
      case 'FORTEMENT_SUSPECTE':
      default:
        return {
          label: 'FORTEMENT SUSPECTE (INDICATIONS MULTIPLES)',
          badgeClass: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
          icon: ShieldAlert,
          color: 'text-red-600 dark:text-red-400',
          gaugeColor: 'bg-red-600'
        };
    }
  };

  const config = getClassificationConfig();
  const Icon = config.icon;

  const getConfidenceLabel = () => {
    switch (confidence) {
      case 'high':
        return { text: 'Niveau de confiance : ÉLEVÉ', class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' };
      case 'medium':
        return { text: 'Niveau de confiance : MOYEN', class: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' };
      case 'low':
      default:
        return { text: 'Niveau de confiance : FAIBLE', class: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200' };
    }
  };

  const confidenceInfo = getConfidenceLabel();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        
        {/* Score Meter */}
        <div className="flex items-center gap-5 w-full sm:w-auto">
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100 dark:text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={config.color}
                strokeWidth="3.5"
                strokeDasharray={`${score}, 100`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">{score}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">/ 100</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Score d&apos;Analyse Actuhub
            </span>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold text-xs ${config.badgeClass}`}>
              <Icon className="w-4 h-4 shrink-0" />
              <span>{config.label}</span>
            </div>
            <div>
              <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${confidenceInfo.class}`}>
                {confidenceInfo.text}
              </span>
            </div>
          </div>
        </div>

        {/* Informative Note */}
        <div className="text-right text-xs text-slate-500 dark:text-slate-400 max-w-xs hidden md:block">
          Score calculé par le moteur de fusion des signaux (Modèle IA local + Métadonnées + Analyse Forensique ELA + Provenance C2PA).
        </div>

      </div>
    </div>
  );
};
