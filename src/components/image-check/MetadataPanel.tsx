import React from 'react';
import { Camera, Calendar, HardDrive, MapPin, Maximize2, AlertCircle } from 'lucide-react';
import { ImageMetadataInfo } from '../../types';

interface MetadataPanelProps {
  metadata?: ImageMetadataInfo;
}

export const MetadataPanel: React.FC<MetadataPanelProps> = ({ metadata }) => {
  const hasMetadata = Boolean(
    metadata && (metadata.camera || metadata.device || metadata.software || metadata.date_taken || metadata.gps)
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="font-bold text-slate-900 dark:text-white text-base">
          📷 Métadonnées d&apos;Image
        </h3>
      </div>

      {!hasMetadata ? (
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-slate-600 dark:text-slate-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-slate-400" />
          <span>Aucune métadonnée exploitable trouvée (métadonnées effacées ou absentes). L&apos;absence de métadonnées est courante sur le web et ne signifie pas automatiquement que l&apos;image est générée par IA.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg flex items-center gap-3">
            <Camera className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-slate-400 font-medium block">Appareil / Modèle</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {metadata?.camera || metadata?.device || 'Non spécifié'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-slate-400 font-medium block">Date de prise de vue</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {metadata?.date_taken || 'Inconnue'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg flex items-center gap-3">
            <HardDrive className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-slate-400 font-medium block">Logiciel d&apos;Édition / Export</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {metadata?.software || 'Aucun logiciel détecté'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg flex items-center gap-3">
            <Maximize2 className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-slate-400 font-medium block">Dimensions originales</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {metadata?.dimensions ? `${metadata.dimensions.width} x ${metadata.dimensions.height} px` : 'Non renseigné'}
              </span>
            </div>
          </div>

          {metadata?.gps && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg flex items-center gap-3 sm:col-span-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 font-medium block">Coordonnées GPS</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {typeof metadata.gps === 'string' ? metadata.gps : `${metadata.gps.latitude}, ${metadata.gps.longitude}`}
                </span>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
