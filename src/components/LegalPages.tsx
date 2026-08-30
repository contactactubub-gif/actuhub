import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  FileText, 
  Lock, 
  CheckCircle, 
  AlertTriangle, 
  Eye, 
  HelpCircle, 
  ArrowLeft, 
  Scale, 
  Building2, 
  Edit3, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  RotateCcw, 
  Check, 
  ExternalLink, 
  Bold, 
  Italic, 
  List, 
  CornerDownLeft, 
  X,
  Sparkles,
  Info,
  Globe,
  Sliders
} from 'lucide-react';
import { LegalPageData, LegalSection, UserProfile } from '../types';
import { legalPagesService } from '../utils/supabase';
import { DEFAULT_PRIVACY_POLICY, DEFAULT_TERMS_OF_SERVICE } from '../data/legalData';
import { triggerToast } from '../utils/toast';
import { ConfirmationModal, ConfirmationType } from './ConfirmationModal';

// -------------------------------------------------------------
// HELPER: ICON RESOLVER
// -------------------------------------------------------------
export const ICON_OPTIONS: { id: string; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'Shield', label: 'Bouclier / Sécurité', icon: Shield },
  { id: 'Lock', label: 'Cadenas / Confidentialité', icon: Lock },
  { id: 'Eye', label: 'Œil / Données & Collecte', icon: Eye },
  { id: 'CheckCircle', label: 'Coche / Finalités & Validation', icon: CheckCircle },
  { id: 'Scale', label: 'Balance / Droit & Justice', icon: Scale },
  { id: 'Building2', label: 'Bâtiment / Organes & Médias', icon: Building2 },
  { id: 'AlertTriangle', label: 'Alerte / Obligations & Sanctions', icon: AlertTriangle },
  { id: 'FileText', label: 'Document / Objet & Cadre', icon: FileText },
  { id: 'HelpCircle', label: 'Aide / Litiges & Questions', icon: HelpCircle },
  { id: 'Globe', label: 'Globe / Réseau & Numérique', icon: Globe }
];

export function renderLegalIcon(iconName?: string, className = "w-4 h-4 text-blue-600 dark:text-blue-400") {
  switch (iconName) {
    case 'Lock':
      return <Lock className={className.replace('text-blue-600', 'text-rose-600').replace('text-blue-400', 'text-rose-400')} />;
    case 'Eye':
      return <Eye className={className.replace('text-blue-600', 'text-indigo-600').replace('text-blue-400', 'text-indigo-400')} />;
    case 'CheckCircle':
      return <CheckCircle className={className.replace('text-blue-600', 'text-emerald-600').replace('text-blue-400', 'text-emerald-400')} />;
    case 'Scale':
      return <Scale className={className.replace('text-blue-600', 'text-amber-600').replace('text-blue-400', 'text-amber-400')} />;
    case 'Building2':
      return <Building2 className={className.replace('text-blue-600', 'text-teal-600').replace('text-blue-400', 'text-teal-400')} />;
    case 'AlertTriangle':
      return <AlertTriangle className={className.replace('text-blue-600', 'text-rose-600').replace('text-blue-400', 'text-rose-400')} />;
    case 'HelpCircle':
      return <HelpCircle className={className} />;
    case 'Globe':
      return <Globe className={className} />;
    case 'FileText':
      return <FileText className={className} />;
    case 'Shield':
    default:
      return <Shield className={className} />;
  }
}

// -------------------------------------------------------------
// SMART FORMATTER: PARSES ASTERISKS FOR BULLET POINTS & LINE BREAKS
// -------------------------------------------------------------
export function LegalTextRenderer({ content }: { content: string }) {
  if (!content) return null;

  // Split into raw lines
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentBulletList: string[] = [];

  const flushBullets = (keyIdx: number) => {
    if (currentBulletList.length > 0) {
      const items = [...currentBulletList];
      currentBulletList = [];
      elements.push(
        <ul key={`ul-${keyIdx}`} className="list-disc pl-5 space-y-1.5 text-slate-700 dark:text-slate-300 my-2.5">
          {items.map((item, bIdx) => (
            <li key={`li-${bIdx}`} className="leading-relaxed">
              {renderInlineFormattedText(item)}
            </li>
          ))}
        </ul>
      );
    }
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    // Check if line is a bullet item starting with * or - or •
    if (line.startsWith('* ') || line.startsWith('- ') || line.startsWith('• ')) {
      const bulletContent = line.replace(/^[\*\-•]\s+/, '');
      currentBulletList.push(bulletContent);
      return;
    }

    // If we were accumulating bullets and now have regular text, flush the list
    flushBullets(idx);

    if (!line) {
      // Empty line -> spacing
      elements.push(<div key={`space-${idx}`} className="h-2" />);
      return;
    }

    // Check if line is an alert / callout box (starts with ⚠️ or > ⚠️)
    if (line.startsWith('⚠️') || line.startsWith('> ⚠️') || line.startsWith('[alert]')) {
      const alertText = line.replace(/^(>\s*)?⚠️\s*|\[\/?alert\]/g, '').trim();
      elements.push(
        <div key={`alert-${idx}`} className="my-3 p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-sans leading-relaxed flex items-start gap-2.5 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            {renderInlineFormattedText(alertText || line)}
          </div>
        </div>
      );
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${idx}`} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed my-1.5">
        {renderInlineFormattedText(line)}
      </p>
    );
  });

  // Flush remaining bullets at the end
  flushBullets(lines.length);

  return <div className="space-y-1 text-xs">{elements}</div>;
}

// -------------------------------------------------------------
// INLINE FORMATTER: **bold**, *italic*, [links](url), https://
// -------------------------------------------------------------
function renderInlineFormattedText(text: string): React.ReactNode {
  if (!text) return text;

  // Split by bold (**...**) first
  const boldParts = text.split(/(\*\*[^*]+?\*\*)/g);

  return boldParts.map((part, pIdx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      const innerBold = part.slice(2, -2);
      return (
        <strong key={`b-${pIdx}`} className="font-bold text-slate-900 dark:text-slate-100">
          {renderItalicAndLinks(innerBold)}
        </strong>
      );
    }
    return <React.Fragment key={`plain-${pIdx}`}>{renderItalicAndLinks(part)}</React.Fragment>;
  });
}

function renderItalicAndLinks(text: string): React.ReactNode {
  // Split by single asterisk (*...*) for italic (when not already bold)
  const italicParts = text.split(/(?<!\*)\*([^*]+?)\*(?!\*)/g);

  return italicParts.map((subPart, sIdx) => {
    if (sIdx % 2 === 1) {
      // Italic match
      return <em key={`it-${sIdx}`} className="italic">{renderLinks(subPart)}</em>;
    }
    return <React.Fragment key={`reg-${sIdx}`}>{renderLinks(subPart)}</React.Fragment>;
  });
}

function renderLinks(text: string): React.ReactNode {
  // Markdown links [label](url)
  const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mdLinkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(renderRawUrls(text.substring(lastIndex, match.index)));
    }
    const label = match[1];
    const url = match[2];
    parts.push(
      <a
        key={`link-${match.index}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-300 font-medium inline-flex items-center gap-0.5"
      >
        <span>{label}</span>
        <ExternalLink className="w-2.5 h-2.5 inline ml-0.5" />
      </a>
    );
    lastIndex = mdLinkRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(renderRawUrls(text.substring(lastIndex)));
  }

  return parts.length > 0 ? parts : text;
}

function renderRawUrls(text: string): React.ReactNode {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let m: RegExpExecArray | null;

  while ((m = urlRegex.exec(text)) !== null) {
    if (m.index > lastIdx) {
      parts.push(text.substring(lastIdx, m.index));
    }
    const rawUrl = m[0];
    const href = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    parts.push(
      <a
        key={`raw-${m.index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-300 font-medium"
      >
        {rawUrl}
      </a>
    );
    lastIdx = urlRegex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }

  return parts.length > 0 ? parts : text;
}

// -------------------------------------------------------------
// ADMIN LEGAL PAGE EDITOR MODAL / PANEL
// -------------------------------------------------------------
export function LegalPageEditorModal({
  pageData,
  isOpen,
  onClose,
  onSaveSuccess
}: {
  pageData: LegalPageData;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess?: (updated: LegalPageData) => void;
}) {
  const [formData, setFormData] = useState<LegalPageData>(pageData);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [activePreview, setActivePreview] = useState(false);

  // State for Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: ConfirmationType;
    title: string;
    message: string;
    details?: string | React.ReactNode;
    confirmText?: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    setFormData(JSON.parse(JSON.stringify(pageData)));
  }, [pageData, isOpen]);

  if (!isOpen) return null;

  const handleUpdateField = (field: keyof LegalPageData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateSection = (index: number, field: keyof LegalSection, value: any) => {
    setFormData(prev => {
      const updated = [...prev.sections];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, sections: updated };
    });
  };

  const handleInsertTextToSection = (index: number, snippet: string) => {
    setFormData(prev => {
      const updated = [...prev.sections];
      const current = updated[index].content || '';
      // If snippet is a bullet, add newline if not present
      const toAppend = (snippet.startsWith('* ') && current.length > 0 && !current.endsWith('\n'))
        ? `\n${snippet}`
        : snippet;
      updated[index] = { ...updated[index], content: current + toAppend };
      return { ...prev, sections: updated };
    });
  };

  const triggerAddSection = () => {
    setConfirmDialog({
      isOpen: true,
      type: 'add',
      title: 'Ajouter une nouvelle section ?',
      message: 'Une nouvelle section éditable sera ajoutée à la suite du document légal.',
      details: `Position : Section n°${formData.sections.length + 1}`,
      confirmText: 'Ajouter la section',
      onConfirm: () => {
        const newSection: LegalSection = {
          id: `section-${Date.now()}`,
          title: `${formData.sections.length + 1}. Nouvelle Section`,
          icon: 'Shield',
          content: `* **Premier point :** Description du point réglementaire.\n* **Deuxième point :** Précision additionnelle.`
        };
        setFormData(prev => ({
          ...prev,
          sections: [...prev.sections, newSection]
        }));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        triggerToast("Nouvelle section ajoutée avec succès.", "info");
      }
    });
  };

  const triggerDeleteSection = (index: number) => {
    if (formData.sections.length <= 1) {
      triggerToast("La page doit contenir au minimum une section.", "error");
      return;
    }
    const targetSection = formData.sections[index];
    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      title: 'Confirmer la suppression de la section ?',
      message: `Êtes-vous sûr de vouloir supprimer définitivement la section "${targetSection.title}" ?`,
      details: (
        <div className="space-y-1">
          <div className="font-bold text-rose-600 dark:text-rose-400">{targetSection.title}</div>
          <div className="text-[11px] line-clamp-2 text-slate-500">{targetSection.content}</div>
        </div>
      ),
      confirmText: 'Supprimer définitivement',
      onConfirm: () => {
        setFormData(prev => ({
          ...prev,
          sections: prev.sections.filter((_, i) => i !== index)
        }));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        triggerToast("Section supprimée de l'éditeur.", "info");
      }
    });
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formData.sections.length) return;

    setFormData(prev => {
      const updated = [...prev.sections];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return { ...prev, sections: updated };
    });
  };

  const triggerSave = () => {
    setConfirmDialog({
      isOpen: true,
      type: 'edit',
      title: 'Enregistrer les modifications ?',
      message: `Les modifications apportées à "${formData.title}" seront enregistrées dans Supabase et publiées immédiatement pour tous les utilisateurs.`,
      details: (
        <div className="space-y-1 text-[11px]">
          <div><strong>Titre :</strong> {formData.title}</div>
          <div><strong>Badge :</strong> {formData.badge}</div>
          <div><strong>Nombre de sections :</strong> {formData.sections.length}</div>
          <div><strong>Mise à jour :</strong> {formData.lastUpdated} ({formData.version})</div>
        </div>
      ),
      confirmText: 'Enregistrer et publier',
      onConfirm: async () => {
        setIsSaving(true);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await legalPagesService.saveLegalPage(formData);
          triggerToast(`Page "${formData.title}" enregistrée et synchronisée dans Supabase !`, 'success');
          if (onSaveSuccess) onSaveSuccess(formData);
          onClose();
        } catch (err) {
          console.error("Error saving legal page:", err);
          triggerToast("Erreur lors de la sauvegarde de la page légale.", 'error');
        } finally {
          setIsSaving(false);
        }
      }
    });
  };

  const triggerReset = () => {
    setConfirmDialog({
      isOpen: true,
      type: 'reset',
      title: 'Rétablir le modèle officiel d\'origine ?',
      message: `Cette opération remplacera toutes les sections personnalisées actuelles par les textes réglementaires certifiés par défaut.`,
      details: `Page concernée : ${formData.title}`,
      confirmText: 'Rétablir par défaut',
      onConfirm: async () => {
        setIsResetting(true);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const restored = await legalPagesService.resetToDefault(formData.id);
          setFormData(restored);
          triggerToast("Modèle officiel d'origine rétabli avec succès.", 'info');
        } catch (e) {
          triggerToast("Erreur lors de la réinitialisation.", 'error');
        } finally {
          setIsResetting(false);
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-blue-600 text-white shadow-xs">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold font-sans">
                Édition Administrateur : {formData.title}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Modifications instantanées synchronisées avec Supabase
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivePreview(!activePreview)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                activePreview 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{activePreview ? "Mode Éditeur" : "Aperçu en Direct"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Information & Asterisk Guideline Notice */}
          <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Règles de formatage rapide (Astérisques & Retours à la ligne)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px] pt-1">
              <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-blue-100 dark:border-blue-900/40">
                <span className="font-bold font-mono block text-blue-600 dark:text-blue-400">* Élément</span>
                <span className="text-slate-600 dark:text-slate-400">Puce avec retour à la ligne automatique</span>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-blue-100 dark:border-blue-900/40">
                <span className="font-bold font-mono block text-blue-600 dark:text-blue-400">**Texte en gras**</span>
                <span className="text-slate-600 dark:text-slate-400">Mise en gras du texte sélectionné</span>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-blue-100 dark:border-blue-900/40">
                <span className="font-bold font-mono block text-blue-600 dark:text-blue-400">*Texte italique*</span>
                <span className="text-slate-600 dark:text-slate-400">Mise en italique</span>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-blue-100 dark:border-blue-900/40">
                <span className="font-bold font-mono block text-amber-600 dark:text-amber-400">⚠️ Avertissement</span>
                <span className="text-slate-600 dark:text-slate-400">Encadré d'alerte / juridique</span>
              </div>
            </div>
          </div>

          {activePreview ? (
            /* LIVE PREVIEW VIEW */
            <div className="space-y-6 animate-fade-in border border-slate-200 dark:border-slate-800 rounded-3xl p-6 bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-xs uppercase tracking-wider">
                <Eye className="w-4 h-4" />
                <span>Rendu direct pour les utilisateurs</span>
              </div>
              
              <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 text-white p-6 shadow-md border border-slate-800 space-y-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase font-mono inline-block bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {formData.badge}
                </span>
                <h1 className="text-xl font-black">{formData.title}</h1>
                <p className="text-xs text-slate-300">{formData.subtitle}</p>
                <div className="text-[10px] text-slate-400 font-mono">
                  Dernière mise à jour : {formData.lastUpdated} • {formData.version}
                </div>
              </div>

              <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
                {formData.sections.map((sec) => (
                  <div key={sec.id} className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-100">
                      {renderLegalIcon(sec.icon)}
                      <h3>{sec.title}</h3>
                    </div>
                    <LegalTextRenderer content={sec.content} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* EDIT FORM VIEW */
            <div className="space-y-6">
              {/* Header Settings Card */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>En-tête et métadonnées de la page</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Titre Principal de la Page
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleUpdateField('title', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Badge Réglementaire
                    </label>
                    <input
                      type="text"
                      value={formData.badge}
                      onChange={(e) => handleUpdateField('badge', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Sous-titre / Description introductive
                    </label>
                    <textarea
                      rows={2}
                      value={formData.subtitle}
                      onChange={(e) => handleUpdateField('subtitle', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Date de dernière mise à jour
                    </label>
                    <input
                      type="text"
                      value={formData.lastUpdated}
                      onChange={(e) => handleUpdateField('lastUpdated', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Version / Référence Légale
                    </label>
                    <input
                      type="text"
                      value={formData.version}
                      onChange={(e) => handleUpdateField('version', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sections Editor List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Sections du document ({formData.sections.length})</span>
                  </h3>

                  <button
                    onClick={triggerAddSection}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter une section</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.sections.map((section, index) => (
                    <div
                      key={section.id || index}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                    >
                      {/* Section Controls Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                          <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <input
                            type="text"
                            value={section.title}
                            onChange={(e) => handleUpdateSection(index, 'title', e.target.value)}
                            placeholder="Titre de la section"
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Icon Selector */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Icône :</span>
                            <select
                              value={section.icon || 'Shield'}
                              onChange={(e) => handleUpdateSection(index, 'icon', e.target.value)}
                              className="px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono cursor-pointer focus:outline-hidden"
                            >
                              {ICON_OPTIONS.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                              ))}
                            </select>
                          </div>

                          {/* Reorder and Delete Buttons */}
                          <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-800">
                            <button
                              disabled={index === 0}
                              onClick={() => handleMoveSection(index, 'up')}
                              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                              title="Monter"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={index === formData.sections.length - 1}
                              onClick={() => handleMoveSection(index, 'down')}
                              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                              title="Descendre"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => triggerDeleteSection(index)}
                              className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 cursor-pointer ml-1"
                              title="Supprimer la section"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Quick Formatting Toolbar */}
                      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800/70">
                        <span className="text-[10px] font-bold text-slate-400 font-mono px-1">Insérer :</span>
                        <button
                          type="button"
                          onClick={() => handleInsertTextToSection(index, '* **Titre :** Explication')}
                          className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          title="Insérer une puce avec astérisque"
                        >
                          <List className="w-3 h-3" />
                          <span>* Puce</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleInsertTextToSection(index, '**texte en gras**')}
                          className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Bold className="w-3 h-3" />
                          <span>**Gras**</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleInsertTextToSection(index, '*texte en italique*')}
                          className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Italic className="w-3 h-3" />
                          <span>*Italique*</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleInsertTextToSection(index, '\n\n')}
                          className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                        >
                          <CornerDownLeft className="w-3 h-3" />
                          <span>↵ Saut de ligne</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleInsertTextToSection(index, '\n⚠️ **Avertissement Légal :** Préciser les sanctions et le cadre juridique.')}
                          className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>⚠️ Alerte</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleInsertTextToSection(index, ' [Site officiel](https://www.actuhub-benin.com)')}
                          className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Lien</span>
                        </button>
                      </div>

                      {/* Content Textarea */}
                      <div>
                        <textarea
                          rows={6}
                          value={section.content}
                          onChange={(e) => handleUpdateSection(index, 'content', e.target.value)}
                          placeholder="Écrivez le contenu de la section ici. Les astérisques (* ) au début d'une ligne créeront automatiquement des puces avec saut de ligne..."
                          className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <button
            type="button"
            disabled={isResetting || isSaving}
            onClick={triggerReset}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rétablir le modèle officiel d'origine</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={triggerSave}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Enregistrement dans Supabase...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Enregistrer et Actualiser la Page</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Confirmation Dialog Component */}
      <ConfirmationModal
        isOpen={confirmDialog.isOpen}
        type={confirmDialog.type}
        title={confirmDialog.title}
        message={confirmDialog.message}
        details={confirmDialog.details}
        confirmText={confirmDialog.confirmText}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

// -------------------------------------------------------------
// MAIN PRIVACY POLICY SECTION COMPONENT
// -------------------------------------------------------------
export function PrivacyPolicySection({ 
  onSwitchTab,
  currentUser,
  isAdmin = false 
}: { 
  onSwitchTab?: (tab: any) => void;
  currentUser?: UserProfile | null;
  isAdmin?: boolean;
}) {
  const [pageData, setPageData] = useState<LegalPageData>(DEFAULT_PRIVACY_POLICY);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time updates from Supabase
  useEffect(() => {
    const unsubscribe = legalPagesService.subscribe('privacy', (data) => {
      setPageData(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const effectiveIsAdmin = isAdmin || currentUser?.role === 'admin' || 
    (currentUser?.email || '').toLowerCase() === 'contactactubub@gmail.com' ||
    (currentUser?.email || '').toLowerCase().includes('admin');

  return (
    <div id="privacy-policy-container" className="space-y-8 animate-fade-in w-full max-w-4xl mx-auto py-4 text-left">
      
      {/* Top Navigation & Admin Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {onSwitchTab && (
          <button
            onClick={() => onSwitchTab('news')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </button>
        )}

        {effectiveIsAdmin && (
          <button
            onClick={() => setIsEditorOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold font-mono transition-all cursor-pointer shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Modifier la Politique (Admin)</span>
          </button>
        )}
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 text-white p-8 md:p-10 shadow-xl border border-slate-800">
        <div className="space-y-3">
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest font-mono inline-flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-400" /> {pageData.badge}
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-sans">
            {pageData.title}
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl font-sans">
            {pageData.subtitle}
          </p>
          <div className="pt-2 text-[10px] text-slate-400 font-mono flex items-center gap-2">
            <span>Dernière mise à jour : {pageData.lastUpdated} • {pageData.version}</span>
            {pageData.updatedAt && (
              <span className="text-emerald-400 font-semibold">• Synchronisé Supabase</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-sm space-y-8 text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
        {pageData.sections.map((section) => (
          <section key={section.id} className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm font-mono border-b border-slate-100 dark:border-slate-800/80 pb-2">
              {renderLegalIcon(section.icon)}
              <h2>{section.title}</h2>
            </div>
            <LegalTextRenderer content={section.content} />
          </section>
        ))}
      </div>

      {/* Admin Quick Editor Modal */}
      {effectiveIsAdmin && (
        <LegalPageEditorModal
          pageData={pageData}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSaveSuccess={(updated) => setPageData(updated)}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// MAIN TERMS OF SERVICE (CGU) SECTION COMPONENT
// -------------------------------------------------------------
export function TermsOfServiceSection({ 
  onSwitchTab,
  currentUser,
  isAdmin = false 
}: { 
  onSwitchTab?: (tab: any) => void;
  currentUser?: UserProfile | null;
  isAdmin?: boolean;
}) {
  const [pageData, setPageData] = useState<LegalPageData>(DEFAULT_TERMS_OF_SERVICE);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time updates from Supabase
  useEffect(() => {
    const unsubscribe = legalPagesService.subscribe('terms', (data) => {
      setPageData(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const effectiveIsAdmin = isAdmin || currentUser?.role === 'admin' || 
    (currentUser?.email || '').toLowerCase() === 'contactactubub@gmail.com' ||
    (currentUser?.email || '').toLowerCase().includes('admin');

  return (
    <div id="terms-of-service-container" className="space-y-8 animate-fade-in w-full max-w-4xl mx-auto py-4 text-left">
      
      {/* Top Navigation & Admin Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {onSwitchTab && (
          <button
            onClick={() => onSwitchTab('news')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </button>
        )}

        {effectiveIsAdmin && (
          <button
            onClick={() => setIsEditorOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold font-mono transition-all cursor-pointer shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Modifier les CGU (Admin)</span>
          </button>
        )}
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-8 md:p-10 shadow-xl border border-indigo-900/30">
        <div className="space-y-3">
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest font-mono inline-flex items-center gap-1.5">
            <Scale className="w-3 h-3 text-indigo-400" /> {pageData.badge}
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-sans">
            {pageData.title}
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl font-sans">
            {pageData.subtitle}
          </p>
          <div className="pt-2 text-[10px] text-slate-400 font-mono flex items-center gap-2">
            <span>En vigueur au : {pageData.lastUpdated} • {pageData.version}</span>
            {pageData.updatedAt && (
              <span className="text-emerald-400 font-semibold">• Synchronisé Supabase</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-sm space-y-8 text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
        {pageData.sections.map((section) => (
          <section key={section.id} className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm font-mono border-b border-slate-100 dark:border-slate-800/80 pb-2">
              {renderLegalIcon(section.icon)}
              <h2>{section.title}</h2>
            </div>
            <LegalTextRenderer content={section.content} />
          </section>
        ))}
      </div>

      {/* Admin Quick Editor Modal */}
      {effectiveIsAdmin && (
        <LegalPageEditorModal
          pageData={pageData}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSaveSuccess={(updated) => setPageData(updated)}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// WRAPPER WITH TABS
// -------------------------------------------------------------
export function LegalPagesWrapper({ 
  activeTab, 
  onSwitchTab,
  currentUser,
  isAdmin = false 
}: { 
  activeTab: 'privacy' | 'terms'; 
  onSwitchTab?: (tab: any) => void;
  currentUser?: UserProfile | null;
  isAdmin?: boolean;
}) {
  const [selectedLegalTab, setSelectedLegalTab] = useState<'privacy' | 'terms'>(activeTab);

  useEffect(() => {
    setSelectedLegalTab(activeTab);
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Tab Switcher Bar */}
      <div className="flex justify-center border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl flex items-center gap-1 text-xs font-mono font-bold">
          <button
            onClick={() => setSelectedLegalTab('privacy')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              selectedLegalTab === 'privacy'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Politique de Confidentialité</span>
          </button>
          <button
            onClick={() => setSelectedLegalTab('terms')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              selectedLegalTab === 'terms'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Conditions Générales d'Utilisation (CGU)</span>
          </button>
        </div>
      </div>

      {selectedLegalTab === 'privacy' ? (
        <PrivacyPolicySection 
          onSwitchTab={onSwitchTab} 
          currentUser={currentUser}
          isAdmin={isAdmin}
        />
      ) : (
        <TermsOfServiceSection 
          onSwitchTab={onSwitchTab} 
          currentUser={currentUser}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// DEDICATED ADMIN DASHBOARD MANAGEMENT TAB COMPONENT
// -------------------------------------------------------------
export function LegalPagesAdminManagementTab() {
  const [privacyData, setPrivacyData] = useState<LegalPageData>(DEFAULT_PRIVACY_POLICY);
  const [termsData, setTermsData] = useState<LegalPageData>(DEFAULT_TERMS_OF_SERVICE);
  const [editingTarget, setEditingTarget] = useState<LegalPageData | null>(null);

  useEffect(() => {
    const unsub1 = legalPagesService.subscribe('privacy', (data) => setPrivacyData(data));
    const unsub2 = legalPagesService.subscribe('terms', (data) => setTermsData(data));
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Scale className="w-5 h-5 text-rose-600" />
            <span>Gestion des Pages Légales & Réglementaires</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Modifiez en temps réel la Politique de Confidentialité et les Conditions Générales d'Utilisation. Stockage chiffré dans Supabase.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Privacy Policy */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                {privacyData.badge}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {privacyData.sections.length} sections
              </span>
            </div>

            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>{privacyData.title}</span>
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
              {privacyData.subtitle}
            </p>

            <div className="pt-2 text-[10px] text-slate-400 font-mono border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span>{privacyData.version}</span>
              <span>Dernière MàJ : {privacyData.lastUpdated}</span>
            </div>
          </div>

          <button
            onClick={() => setEditingTarget(privacyData)}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Edit3 className="w-4 h-4" />
            <span>Modifier la Politique de Confidentialité</span>
          </button>
        </div>

        {/* Card 2: Terms of Service (CGU) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                {termsData.badge}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {termsData.sections.length} sections
              </span>
            </div>

            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-600" />
              <span>{termsData.title}</span>
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
              {termsData.subtitle}
            </p>

            <div className="pt-2 text-[10px] text-slate-400 font-mono border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span>{termsData.version}</span>
              <span>Dernière MàJ : {termsData.lastUpdated}</span>
            </div>
          </div>

          <button
            onClick={() => setEditingTarget(termsData)}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Edit3 className="w-4 h-4" />
            <span>Modifier les CGU</span>
          </button>
        </div>
      </div>

      {editingTarget && (
        <LegalPageEditorModal
          pageData={editingTarget}
          isOpen={true}
          onClose={() => setEditingTarget(null)}
          onSaveSuccess={(updated) => {
            if (updated.id === 'privacy') setPrivacyData(updated);
            if (updated.id === 'terms') setTermsData(updated);
            setEditingTarget(null);
          }}
        />
      )}
    </div>
  );
}
