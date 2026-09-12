import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export const AnalysisDisclaimer: React.FC = () => {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 sm:p-5 my-6 text-amber-800 dark:text-amber-200 text-sm leading-relaxed shadow-sm">
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-1">
            Mise en garde et limites techniques
          </h4>
          <p className="mb-2">
            Cette analyse constitue une estimation technique et ne permet pas, à elle seule, d&apos;établir la véracité du contenu ou du contexte de l&apos;image.
          </p>
          <p className="text-xs opacity-90">
            Les détecteurs d&apos;images IA ne sont pas infaillibles. Une image peut être générée par IA sans être détectée, ou une image authentique peut présenter des caractéristiques similaires à une image synthétique en raison d&apos;une forte recompression ou d&apos;un traitement numérique.
          </p>
        </div>
      </div>
    </div>
  );
};
