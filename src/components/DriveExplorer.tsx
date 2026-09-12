import React, { useState, useEffect } from 'react';
import { Folder, File, RefreshCw, AlertCircle, Shield } from 'lucide-react';
import { triggerToast } from '../utils/toast';
import { auth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from '../utils/supabase';

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let cachedAccessToken: string | null = null;

export const DriveExplorer: React.FC = () => {
  const [needsAuth, setNeedsAuth] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        setNeedsAuth(false);
        fetchFiles();
      } else {
        setUser(null);
        setNeedsAuth(true);
        setFiles([]);
      }
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      cachedAccessToken = credential?.accessToken || null;
      setUser(result.user);
      setNeedsAuth(false);
      fetchFiles();
    } catch (err: any) {
      console.error('Login failed:', err);
      let friendlyMsg = 'Échec de la connexion Google Drive.';
      if (err.code === 'auth/user-cancelled' || err.message?.includes('user-cancelled') || err.message?.includes('denied') || err.message?.includes('IdP denied access')) {
        friendlyMsg = 'La connexion a été annulée ou les permissions d\'accès à Google Drive ont été refusées.';
      } else if (err.code === 'auth/popup-closed-by-user' || err.message?.includes('popup-closed-by-user')) {
        friendlyMsg = 'La fenêtre de connexion Google a été fermée avant la fin de l\'authentification.';
      }
      setError(friendlyMsg);
    }
  };

  const fetchFiles = async () => {
    if (!cachedAccessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=10&fields=files(id, name, mimeType)', {
        headers: { Authorization: `Bearer ${cachedAccessToken}` },
      });
      if (!res.ok) throw new Error('Failed to fetch files');
      const data = await res.json();
      setFiles(data.files || []);
    } catch (err: any) {
      console.error('Fetch failed:', err);
      setError('Échec du chargement des fichiers Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  if (needsAuth) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-sm space-y-4">
        <Shield className="w-12 h-12 text-blue-500" />
        <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Accès Google Drive Requis</h3>
        <p className="text-xs text-gray-500 text-center max-w-sm">Connectez-vous pour consulter vos fichiers Google Drive directement depuis cette plateforme.</p>
        <button
          onClick={handleLogin}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest py-3 px-6 rounded-xl transition-all"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono">Mes Fichiers Google Drive</h3>
        <button onClick={fetchFiles} className="p-2 text-gray-400 hover:text-blue-600 rounded-full transition-colors">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {error && <p className="text-xs text-rose-500 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</p>}
      
      {isLoading ? (
        <p className="text-xs text-gray-400">Chargement...</p>
      ) : (
        <ul className="space-y-2">
          {files.map(file => (
            <li key={file.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              {file.mimeType === 'application/vnd.google-apps.folder' ? <Folder className="w-4 h-4 text-blue-500" /> : <File className="w-4 h-4 text-gray-400" />}
              <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{file.name}</span>
            </li>
          ))}
          {files.length === 0 && <p className="text-xs text-gray-400 italic">Aucun fichier trouvé.</p>}
        </ul>
      )}
    </div>
  );
};
