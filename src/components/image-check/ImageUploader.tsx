import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileImage, ShieldCheck, Trash2, ArrowRight, AlertCircle, Lock, CheckCircle2, RefreshCw } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (base64: string, filename: string, deleteAfter: boolean) => void;
  disabled?: boolean;
  isGuest?: boolean;
  onRequireLogin?: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageSelected, 
  disabled,
  isGuest = false,
  onRequireLogin
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isReadingBase64, setIsReadingBase64] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteAfter, setDeleteAfter] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
  };

  const handleFiles = (files: FileList | null) => {
    if (isGuest) {
      if (onRequireLogin) onRequireLogin();
      return;
    }

    if (!files || files.length === 0) return;
    const file = files[0];

    setErrorMessage(null);

    // Validate MIME type or file extension flexibly
    const isImageMime = file.type && file.type.toLowerCase().startsWith('image/');
    const isImageExt = /\.(jpe?g|png|webp|jfif|bmp|gif|tif|tiff)$/i.test(file.name);
    
    if (!isImageMime && !isImageExt) {
      setErrorMessage('Format non supporté. Veuillez sélectionner une image au format JPG, PNG ou WEBP.');
      return;
    }

    // Validate File Size (15 MB limit)
    const MAX_SIZE_MB = 15;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`Le fichier est trop volumineux (${formatFileSize(file.size)}). Limite maximale : ${MAX_SIZE_MB} Mo.`);
      return;
    }

    // Clean up previous preview URL
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    // INSTANT PREVIEW (0ms latency via URL.createObjectURL)
    const instantUrl = URL.createObjectURL(file);
    objectUrlRef.current = instantUrl;
    setSelectedFile(file);
    setPreviewUrl(instantUrl);
    setImageDimensions(null);

    // Get image dimensions
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = instantUrl;

    // Concurrently generate base64 for API submission
    setIsReadingBase64(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      setBase64Data(e.target?.result as string);
      setIsReadingBase64(false);
    };
    reader.onerror = () => {
      setErrorMessage("Erreur lors de la lecture du fichier image.");
      setIsReadingBase64(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (isGuest) {
      if (onRequireLogin) onRequireLogin();
      return;
    }
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const getBase64 = (file: File): Promise<string> => {
    if (base64Data) return Promise.resolve(base64Data);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    if (isGuest) {
      if (onRequireLogin) onRequireLogin();
      return;
    }
    if (!selectedFile) return;

    try {
      setIsSubmitting(true);
      const b64 = await getBase64(selectedFile);
      onImageSelected(b64, selectedFile.name, deleteAfter);
    } catch (err) {
      console.error('Error preparing image base64:', err);
      setErrorMessage("Impossible de préparer l'image pour l'analyse.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setBase64Data(null);
    setImageDimensions(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm my-6">
      {errorMessage && (
        <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 rounded-2xl text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {!previewUrl ? (
        isGuest ? (
          /* Guest View: Clicking opens login modal */
          <div
            onClick={onRequireLogin}
            className="border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all border-amber-300 dark:border-amber-700/60 bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/70"
          >
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-sm bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Lock className="w-8 h-8" />
            </div>

            <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg mb-1">
              Connexion requise pour analyser une image
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4 leading-relaxed">
              L&apos;analyse d&apos;authenticité est réservée aux membres connectés pour garantir la sécurité et sauvegarder votre historique dans la base de données.
            </p>

            <button
              type="button"
              onClick={onRequireLogin}
              className="px-5 py-2.5 rounded-2xl text-xs font-extrabold shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Lock className="w-4 h-4" /> Se connecter pour analyser
            </button>
          </div>
        ) : (
          /* Authenticated User View: Native label wrapper guarantees instant file picker on 1st click */
          <label
            htmlFor="actuhub-image-check-input"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`block relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
              dragActive 
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[1.005]' 
                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/30'
            }`}
          >
            <input 
              id="actuhub-image-check-input"
              type="file" 
              ref={fileInputRef} 
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFiles(e.target.files);
                }
                e.target.value = '';
              }}
              onClick={(e) => {
                (e.target as HTMLInputElement).value = '';
              }}
              accept="image/*,.jpg,.jpeg,.png,.webp,.jfif,.bmp" 
              className="sr-only" 
            />

            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-sm bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
              <Upload className="w-8 h-8" />
            </div>

            <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg mb-1">
              Déposez une image pour analyser son authenticité
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4 leading-relaxed">
              Glissez-déposez ou cliquez n&apos;importe où pour sélectionner une photo. Formats acceptés : JPG, PNG, WEBP (jusqu&apos;à 15 Mo).
            </p>

            <span className="px-5 py-2.5 rounded-2xl text-xs font-bold shadow-sm transition-all inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer pointer-events-none">
              <FileImage className="w-4 h-4" /> Sélectionner un fichier
            </span>
          </label>
        )
      ) : (
        /* Instant Image Preview & Confirmation Card */
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 flex flex-col items-center justify-center p-3 sm:p-4 shadow-inner">
            <img 
              src={previewUrl} 
              alt="Prévisualisation de l'image" 
              className="max-h-80 w-auto object-contain rounded-2xl shadow-lg" 
            />
            
            <button
              onClick={handleClear}
              type="button"
              className="absolute top-4 right-4 p-2.5 bg-slate-900/80 hover:bg-red-600 text-white rounded-2xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Supprimer la sélection"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Changer</span>
            </button>
          </div>

          {/* File Meta Information */}
          {selectedFile && (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileImage className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate max-w-[220px] sm:max-w-md">
                  {selectedFile.name}
                </span>
                <span className="text-slate-400">
                  ({formatFileSize(selectedFile.size)})
                </span>
                {imageDimensions && (
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-mono">
                    {imageDimensions.width} × {imageDimensions.height} px
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isReadingBase64 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Préparation...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Image prête
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
            {/* Privacy Checkbox Option */}
            <label className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={deleteAfter}
                onChange={(e) => setDeleteAfter(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
              />
              <span>Supprimer l&apos;image du serveur immédiatement après l&apos;analyse</span>
            </label>

            {/* Launch Analysis Button */}
            <button
              type="button"
              disabled={disabled || isSubmitting}
              onClick={handleSubmit}
              className="w-full sm:w-auto px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs shadow-md hover:shadow-lg transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer uppercase tracking-wider"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Envoi en cours...
                </>
              ) : (
                <>
                  Lancer l&apos;Analyse Image Check <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Footer Info Banner */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />
        <span>Vos images sont traitées uniquement pour l&apos;analyse technique et ne sont pas vendues ni partagées à des tiers.</span>
      </div>
    </div>
  );
};

