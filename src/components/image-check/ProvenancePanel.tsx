import React from 'react';
import { Fingerprint, CheckCircle, XCircle, Info } from 'lucide-react';
import { ImageProvenance } from '../../types';

interface ProvenancePanelProps {
  provenance?: ImageProvenance;
}

export const ProvenancePanel: React.FC<ProvenancePanelProps> = ({ provenance }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Fingerprint className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <h3 className="font-bold text-slate-900 dark:text-white text-base">
          🔐 Traçabilité & Provenance C2PA
        </h3>
      </div>

      <div className="space-y-3 text-xs">
        
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
          <span className="font-medium text-slate-600 dark:text-slate-300">Certificat Content Credentials (C2PA)</span>
          {provenance?.c2pa_found ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle className="w-3.5 h-3.5" /> Présent & Valide
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <XCircle className="w-3.5 h-3.5" /> Non détecté
            </span>
          )}
        </div>

        {provenance?.software && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
            <span className="text-slate-400 block mb-1">Logiciel ou Générateur déclaré :</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{provenance.software}</span>
          </div>
        )}

        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block">Vérification SynthID</span>
            <span className="text-slate-500 dark:text-slate-400 block">
              {provenance?.synthid_status || 'SynthID : non vérifiable localement.'}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Historique de provenance :
          </span>
          {provenance?.provenance.map((item, idx) => (
            <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-800/30 rounded text-slate-600 dark:text-slate-400 text-xs">
              • {item}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
