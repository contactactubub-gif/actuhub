import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, Cpu, CheckCircle2, Clock, Trash2, Eye, RefreshCw } from 'lucide-react';
import { ImageScanReport } from '../../types';
import { imageCheckService } from '../../utils/supabase';

export const AdminImageCheckDashboard: React.FC = () => {
  const [scans, setScans] = useState<ImageScanReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScan, setSelectedScan] = useState<ImageScanReport | null>(null);

  const fetchScans = () => {
    imageCheckService.listScans().then(res => setScans(res)).catch(() => {});
  };

  useEffect(() => {
    fetchScans();
    const sub = imageCheckService.subscribe(res => setScans(res));
    return () => { if (typeof sub === 'function') sub(); };
  }, []);

  const total = scans.length;
  let aiSuspected = 0;
  let authentic = 0;
  let inconclusive = 0;

  scans.forEach(s => {
    if (s.classification === 'FORTEMENT_SUSPECTE' || s.classification === 'PROBABLEMENT_GENEREE_OU_MODIFIEE') {
      aiSuspected++;
    } else if (s.classification === 'PROBABLEMENT_AUTHENTIQUE' || s.classification === 'FAIBLE_SUSPICION') {
      authentic++;
    } else {
      inconclusive++;
    }
  });

  const handleDelete = async (id: string) => {
    await imageCheckService.deleteScan(id);
    fetch(`/api/image-check/${id}`, { method: 'DELETE' }).catch(() => {});
    fetchScans();
  };

  const filteredScans = scans.filter(s => 
    s.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.user_email && s.user_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    s.classification.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            🔎 Administration - ACTUHUB IMAGE CHECK
          </h2>
          <p className="text-xs text-slate-500">
            Statistiques globales d&apos;analyse, surveillance des modèles locaux et audit des scans.
          </p>
        </div>
        <button
          onClick={fetchScans}
          className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 text-xs font-semibold flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Total Analyses</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">{total}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Suspectes / Générées IA</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">{aiSuspected}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Probablement Authentiques</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">{authentic}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Temps Moyen d&apos;Analyse</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">~380 ms</span>
            </div>
          </div>
        </div>

      </div>

      {/* Scans Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Liste des Scans et Moteur d&apos;Analyse
          </h3>
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher fichier, email, statut..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3 rounded-l-xl">Fichier</th>
                <th className="p-3">Utilisateur</th>
                <th className="p-3">Date</th>
                <th className="p-3">Score</th>
                <th className="p-3">Classification</th>
                <th className="p-3 text-right rounded-r-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredScans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-400">
                    Aucun scan trouvé.
                  </td>
                </tr>
              ) : (
                filteredScans.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white truncate max-w-[160px]">
                      {s.filename}
                    </td>
                    <td className="p-3 text-slate-500 truncate max-w-[140px]">
                      {s.user_email || 'Anonyme'}
                    </td>
                    <td className="p-3 text-slate-400">
                      {new Date(s.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">
                      {s.score}/100
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {s.classification}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-all"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
