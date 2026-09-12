import React from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  PlusCircle, 
  Save, 
  RotateCcw, 
  Info, 
  CheckCircle2, 
  X,
  ShieldAlert
} from 'lucide-react';

export type ConfirmationType = 'delete' | 'add' | 'edit' | 'reset' | 'warning' | 'info';

export interface ConfirmationModalProps {
  isOpen: boolean;
  type?: ConfirmationType;
  title: string;
  message: string;
  details?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmationModal({
  isOpen,
  type = 'warning',
  title,
  message,
  details,
  confirmText,
  cancelText = 'Annuler',
  isLoading = false,
  onConfirm,
  onCancel
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  // Icon, color themes and default button labels according to action type
  let icon = <AlertTriangle className="w-6 h-6 text-amber-500" />;
  let iconBg = 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50';
  let defaultConfirmText = 'Confirmer';
  let confirmBtnClass = 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20';

  if (type === 'delete') {
    icon = <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />;
    iconBg = 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50';
    defaultConfirmText = 'Supprimer définitivement';
    confirmBtnClass = 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20';
  } else if (type === 'add') {
    icon = <PlusCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />;
    iconBg = 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50';
    defaultConfirmText = 'Ajouter';
    confirmBtnClass = 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20';
  } else if (type === 'edit') {
    icon = <Save className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
    iconBg = 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50';
    defaultConfirmText = 'Enregistrer les modifications';
    confirmBtnClass = 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20';
  } else if (type === 'reset') {
    icon = <RotateCcw className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />;
    iconBg = 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50';
    defaultConfirmText = 'Rétablir par défaut';
    confirmBtnClass = 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20';
  } else if (type === 'info') {
    icon = <Info className="w-6 h-6 text-sky-600 dark:text-sky-400" />;
    iconBg = 'bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-900/50';
    defaultConfirmText = 'Continuer';
    confirmBtnClass = 'bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-500/20';
  }

  const finalConfirmText = confirmText || defaultConfirmText;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-dialog-title"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-scale-up text-left">
        
        {/* Top Close Button */}
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 space-y-4">
          
          {/* Header with Icon & Title */}
          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-2xl shrink-0 ${iconBg}`}>
              {icon}
            </div>
            <div className="space-y-1 pr-4">
              <h3 
                id="confirmation-dialog-title" 
                className="text-base font-extrabold text-slate-900 dark:text-slate-100 leading-snug font-sans"
              >
                {title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* Optional Details Box */}
          {details && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed max-h-40 overflow-y-auto">
              {typeof details === 'string' ? (
                <div className="whitespace-pre-wrap">{details}</div>
              ) : (
                details
              )}
            </div>
          )}

          {/* Security Notice for Destructive Actions */}
          {type === 'delete' && (
            <div className="flex items-center gap-2 text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/40">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>Cette action est irréversible et sera immédiatement appliquée.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              disabled={isLoading}
              onClick={onCancel}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={onConfirm}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 ${confirmBtnClass}`}
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Traitement...</span>
                </>
              ) : (
                <span>{finalConfirmText}</span>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
