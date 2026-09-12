import React from 'react';
import { Microscope, AlertCircle, ShieldCheck } from 'lucide-react';
import { ImageForensics } from '../../types';

interface ForensicsPanelProps {
  forensics?: ImageForensics;
}

export const ForensicsPanel: React.FC<ForensicsPanelProps> = ({ forensics }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Microscope className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        <h3 className="font-bold text-slate-900 dark:text-white text-base">
          🧪 Analyse Forensique Détaillée
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        
        {/* ELA Score */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-300">Analyse ELA (Error Level)</span>
            <span className="font-bold text-slate-900 dark:text-white">{forensics?.ela_score ?? 0}/100</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full ${forensics && forensics.ela_score > 60 ? 'bg-amber-500' : 'bg-blue-500'}`} 
              style={{ width: `${forensics?.ela_score ?? 0}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Écarts de compression JPEG locaux
          </span>
        </div>

        {/* Compression Score */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-300">Indice de Compression</span>
            <span className="font-bold text-slate-900 dark:text-white">{forensics?.compression_score ?? 0}/100</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full ${forensics && forensics.compression_score > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
              style={{ width: `${forensics?.compression_score ?? 0}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Analyse des tables de quantification
          </span>
        </div>

        {/* Noise Uniformity */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-300">Régularité du Bruit</span>
            <span className="font-bold text-slate-900 dark:text-white">{forensics?.noise_score ?? 0}/100</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full ${forensics && forensics.noise_score > 60 ? 'bg-indigo-500' : 'bg-slate-500'}`} 
              style={{ width: `${forensics?.noise_score ?? 0}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Uniformité spectrale du grain
          </span>
        </div>

      </div>

      {/* Anomalies List */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Signaux d&apos;Anomalie Identifiés
        </h4>
        {(!forensics?.anomalies || forensics.anomalies.length === 0) ? (
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg">
            <ShieldCheck className="w-4 h-4" />
            <span>Aucune anomalie forensique majeure détectée.</span>
          </div>
        ) : (
          forensics.anomalies.map((anomaly, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>{anomaly}</span>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
