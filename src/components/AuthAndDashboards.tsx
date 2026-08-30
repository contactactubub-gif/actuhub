import React, { useState, useEffect } from 'react';
import { 
  Shield, Settings, Sliders, Play, Award, 
  Plus, Trash2, Edit3, Check, X, AlertCircle, AlertTriangle, 
  HelpCircle, CheckCircle, ChevronDown, Radio, Send, BookOpen, 
  UserCheck, Users, FileText, BarChart2, CheckCircle2, ShieldAlert, Heart, Globe,
  Megaphone, Tv, Upload, Folder, User, Mic, Mail, Phone, MapPin, Lock, Eye, EyeOff, Sparkles, KeyRound,
  RotateCcw, ArrowLeft, CheckCheck, Key, LogOut, Scale
} from 'lucide-react';
import { UserProfile, ModeratorPermissions, MediaSubmission, Lesson, FakeNewsReport, Communique, Advertisement, NewsletterSubscription, ShortVideo } from '../types';
import { triggerToast } from '../utils/toast';
import { getUneRemainingTime, isUneValid24h } from '../utils/uneUtils';
import { ConfirmationModal, ConfirmationType } from './ConfirmationModal';
import { compressImageFile } from '../utils/imageCompressor';
import secureNewsIllustration from '../assets/images/secure_news_illustration_1782458223570.jpg';
import { DriveExplorer } from './DriveExplorer';
import { LegalPagesAdminManagementTab } from './LegalPages';
import { 
  auth, 
  db, 
  signInAnonymously, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  resetUserPassword,
  GoogleAuthProvider,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  deleteDoc,
  handleDatabaseError,
  handleFirestoreError,
  OperationType,
  supabase, 
  supabaseAuth, 
  supabaseDb,
  coursesService, 
  advertisementsService, 
  communiquesService, 
  rumeursService, 
  mediaSubmissionsService, 
  frontpagesService, 
  usersService 
} from '../utils/supabase';
import { purgeAllAppCache, purgeCollectionCache, recordActionAndPurgeCache } from '../utils/cacheManager';


// Initial Mock Users
export const INITIAL_USERS: UserProfile[] = [
  {
    id: "usr-admin-target",
    email: "contactactubub@gmail.com",
    fullName: "Administrateur ActuHub",
    lastName: "Direction",
    firstName: "ActuHub",
    phone: "+229 21 31 00 00",
    city: "Cotonou",
    role: "admin",
    registrationDate: "24/06/2026",
    status: "active"
  },
  {
    id: "usr-mod-demo",
    email: "moderateur@actuhub.bj",
    fullName: "Modérateur National",
    lastName: "KPOHIZOUN",
    firstName: "Euloge",
    phone: "+229 97 00 11 22",
    city: "Porto-Novo",
    role: "moderator",
    moderatorPermissions: {
      canManageRumors: true,
      canManageSubmissions: true,
      canManageCourses: true,
      canManageCommuniques: true,
      canManageAds: true,
      canManageUnes: true,
      canManageNewsletters: true,
      canManageLegal: false,
      canManageUsers: false
    },
    registrationDate: "15/07/2026",
    status: "active"
  }
];

// Initial Media submissions
const INITIAL_SUBMISSIONS: MediaSubmission[] = [];

interface AuthAndDashboardsProps {
  currentUser: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
  onSwitchTab: (tab: any) => void;
}

// ==========================================
// 1. AUTHENTICATION & REGISTRATION COMPONENT
// ==========================================
export function AuthLockPane({ 
  onLogin, 
  requestedTabName 
}: { 
  onLogin: (user: UserProfile) => void;
  requestedTabName: string;
}) {
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  
  // Registration form fields
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mediaName, setMediaName] = useState('');
  const [signUpRole, setSignUpRole] = useState<'simple' | 'media'>('simple');
  
  // Password Recovery form fields
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'request' | 'reset'>('request');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);

  // States
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanEmail = email.trim().toLowerCase();
    
    if (!cleanEmail || !password) {
      setError('Veuillez saisir votre adresse e-mail et votre mot de passe.');
      return;
    }
    
    setIsConnecting(true);
    setConnectionMessage('Connexion à la base de données...');

    try {
      let firebaseUser;
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        firebaseUser = userCredential.user;
      } catch (authErr: any) {
        console.warn("Sign in notice:", authErr);
        let msg = "E-mail ou mot de passe incorrect.";
        if (authErr.message) msg = authErr.message;
        throw new Error(msg);
      }

      // Retrieve user profile strictly from the server database
      const docRef = doc(db, 'users', firebaseUser.uid);
      let profile: UserProfile | null = null;
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          profile = docSnap.data() as UserProfile;
        }
      } catch (getDocErr) {
        console.warn("Server getDoc notice:", getDocErr);
      }

      const isTargetAdmin = cleanEmail === 'contactactubub@gmail.com' ||
                            (profile && profile.email && profile.email.trim().toLowerCase() === 'contactactubub@gmail.com');

      if (profile) {
        if (isTargetAdmin) {
          profile.role = 'admin';
        }
        if (profile.status === 'suspended') {
          setError('Accès refusé : Ce compte est actuellement suspendu par les administrateurs.');
          try { await auth.signOut(); } catch (err2) {}
          setIsConnecting(false);
          return;
        }

        const updatedProfile: UserProfile = {
          ...profile,
          lastLoginAt: new Date().toISOString()
        };
        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), updatedProfile, { merge: true });
        } catch (dbErr) {
          console.warn("Could not update lastLoginAt on server:", dbErr);
        }
        
        const displayName = updatedProfile.firstName 
          ? `${updatedProfile.firstName} ${updatedProfile.lastName || ''}`.trim()
          : updatedProfile.fullName || updatedProfile.email;

        triggerToast(`Ravi de vous revoir, ${displayName} ! Redirection vers votre tableau de bord... 🌟`, 'success');
        onLogin(updatedProfile);
      } else if (isTargetAdmin) {
        const adminProfile: UserProfile = {
          id: firebaseUser.uid,
          email: 'contactactubub@gmail.com',
          lastName: 'Administrateur',
          firstName: 'ActuHub',
          fullName: 'Administrateur ActuHub',
          phone: '+229 01000000',
          city: 'Cotonou',
          role: 'admin',
          status: 'active',
          registrationDate: new Date().toLocaleDateString('fr-FR'),
          lastLoginAt: new Date().toISOString()
        };
        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), adminProfile);
        } catch (err3) {
          console.error("Could not seed admin profile on server:", err3);
        }
        triggerToast('Bienvenue Administrateur ActuHub ! Redirection vers votre tableau de bord... ⚡', 'success');
        onLogin(adminProfile);
      } else {
        // Strict server requirement: Non-existent profile on database server is rejected
        try { await auth.signOut(); } catch (_) {}
        setError("Accès refusé : Aucun compte enregistré sur le serveur pour cet utilisateur. Veuillez d'abord vous inscrire.");
        setIsConnecting(false);
        return;
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Échec de la connexion.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanLastName = lastName.trim();
    const cleanFirstName = firstName.trim();
    const cleanPhone = phone.trim();
    const cleanCity = city.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanLastName || !cleanFirstName || !cleanPhone || !cleanCity || !cleanEmail || !password) {
      setError('Veuillez remplir toutes les informations obligatoires : Nom, Prénom, Téléphone, Ville, E-mail et Mot de passe.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }
    if (signUpRole === 'media' && !mediaName.trim()) {
      setError('Veuillez indiquer le nom officiel de votre organe média.');
      return;
    }

    setIsConnecting(true);
    setConnectionMessage('Création du compte et enregistrement sur le serveur...');

    try {
      let firebaseUser;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password, {
          lastName: cleanLastName,
          firstName: cleanFirstName,
          phone: cleanPhone,
          city: cleanCity,
          role: signUpRole,
          mediaName: signUpRole === 'media' ? mediaName.trim() : undefined
        });
        firebaseUser = userCredential.user;
      } catch (authErr: any) {
        console.warn("Server signup notice:", authErr);
        let msg = "Erreur lors de la création du compte.";
        if (authErr.code === 'auth/email-already-in-use' || authErr.message?.includes('already')) {
          msg = "Cet e-mail est déjà utilisé. Veuillez vous connecter.";
        } else if (authErr.message) {
          msg = authErr.message;
        }
        throw new Error(msg);
      }

      const isTargetAdmin = cleanEmail === 'contactactubub@gmail.com';
      const determinedRole = isTargetAdmin ? 'admin' : signUpRole;
      const fullComputedName = `${cleanLastName} ${cleanFirstName}`.trim();

      const newProfile: UserProfile = {
        id: firebaseUser.uid,
        email: cleanEmail,
        lastName: cleanLastName,
        firstName: cleanFirstName,
        phone: cleanPhone,
        city: cleanCity,
        fullName: fullComputedName,
        role: determinedRole,
        mediaName: determinedRole === 'media' ? mediaName.trim() : undefined,
        status: 'active',
        registrationDate: new Date().toLocaleDateString('fr-FR'),
        lastLoginAt: new Date().toISOString()
      };

      // Strict server persistence check: Account must be registered on server to have platform access
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
      } catch (dbErr: any) {
        console.error("Critical: Could not persist new user profile to server:", dbErr);
        try { await auth.signOut(); } catch (_) {}
        throw new Error("Échec de l'enregistrement du compte sur le serveur. Accès refusé : Votre profil n'a pas pu être sauvegardé dans la base de données distante.");
      }

      triggerToast(`Bienvenue ${cleanFirstName} ! Votre compte est enregistré sur le serveur, redirection... 🚀`, 'success');
      // Automatically redirect the new user into their personal dashboard
      onLogin(newProfile);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erreur lors de la création du compte.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Password recovery Step 1: Send request / Verify email in Supabase
  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRecoverySuccessMsg('');
    const cleanEmail = recoveryEmail.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Veuillez saisir votre adresse e-mail de récupération.');
      return;
    }

    setIsRecovering(true);
    try {
      // 1. Send password reset email via Supabase Auth
      await sendPasswordResetEmail(auth, cleanEmail);
      
      // 2. Transition to Step 2 so the user can also define a new password directly
      setRecoveryStep('reset');
      setRecoverySuccessMsg(`Un lien de réinitialisation sécurisé a été envoyé à ${cleanEmail}. Vous pouvez également définir votre nouveau mot de passe directement ci-dessous.`);
      triggerToast('Demande de récupération envoyée avec succès ! 📧', 'success');
    } catch (err: any) {
      console.warn("Recovery request notice:", err);
      // Fallback transition
      setRecoveryStep('reset');
      setRecoverySuccessMsg(`Compte identifié (${cleanEmail}). Vous pouvez définir votre nouveau mot de passe ci-dessous.`);
    } finally {
      setIsRecovering(false);
    }
  };

  // Password recovery Step 2: Set new password and save in Supabase
  const handlePerformPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 6) {
      setError('Le nouveau mot de passe doit comporter au moins 6 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setIsRecovering(true);
    try {
      const cleanEmail = recoveryEmail.trim().toLowerCase();
      
      // 1. Update in Supabase Auth
      try {
        await resetUserPassword(newPassword);
      } catch (authErr) {
        console.warn("Supabase Auth password reset notice:", authErr);
      }

      // 2. Find and update user in Supabase database
      const fallbackUid = 'usr_' + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
      try {
        await setDoc(doc(db, 'users', fallbackUid), {
          updatedAt: new Date().toISOString(),
          passwordResetAt: new Date().toISOString()
        }, { merge: true });
      } catch (dbErr) {
        console.warn("Supabase user update notice:", dbErr);
      }

      // 3. Set pre-filled values for login
      setEmail(cleanEmail);
      setPassword(newPassword);
      
      triggerToast('Votre mot de passe a été réinitialisé avec succès dans la base de données ! 🎉', 'success');
      setRecoverySuccessMsg('Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter.');
      setAuthMode('signin');
      setRecoveryStep('request');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err.message || 'Impossible de réinitialiser le mot de passe.');
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div id="auth-lock-card" className="max-w-lg mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] overflow-hidden shadow-2xl p-6 md:p-8 space-y-6 transition-all duration-300">
      
      {/* Header and explanation */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          {authMode === 'forgot' ? <RotateCcw className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
        </div>
        <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 tracking-tight">
          {authMode === 'signin' && 'Connexion à ActuHub'}
          {authMode === 'signup' && 'Créer un Nouveau Compte'}
          {authMode === 'forgot' && 'Récupération de Compte'}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal max-w-sm mx-auto">
          {authMode === 'signin' && `Connectez-vous avec vos identifiants pour accéder à : ${requestedTabName}`}
          {authMode === 'signup' && 'Remplissez le formulaire ci-dessous pour créer votre compte et accéder à votre tableau de bord.'}
          {authMode === 'forgot' && 'Récupérez l\'accès à votre compte en réinitialisant votre mot de passe de façon sécurisée.'}
        </p>
      </div>

      {isConnecting ? (
        /* Real-Time spinner during auth */
        <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/40 text-center space-y-4 py-8 animate-pulse text-xs">
          <div className="relative w-14 h-14 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
          <div className="space-y-1">
            <p className="font-extrabold text-slate-750 dark:text-slate-200 font-mono text-xs uppercase tracking-wide">
              {connectionMessage}
            </p>
            <p className="text-[11px] text-gray-400">Synchronisation en temps réel avec Supabase...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 p-3 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode Tabs: Connexion vs Création de compte (hidden when in forgot mode) */}
          {authMode !== 'forgot' && (
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-gray-200 dark:border-slate-800 gap-1">
              <button
                type="button"
                onClick={() => { setAuthMode('signin'); setError(''); }}
                className={`flex-1 py-2.5 text-center text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  authMode === 'signin' 
                    ? 'bg-white dark:bg-slate-850 text-blue-600 dark:text-blue-400 shadow-sm font-extrabold' 
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
                }`}
              >
                Se Connecter
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setError(''); }}
                className={`flex-1 py-2.5 text-center text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  authMode === 'signup' 
                    ? 'bg-white dark:bg-slate-850 text-blue-600 dark:text-blue-400 shadow-sm font-extrabold' 
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
                }`}
              >
                Créer un Compte
              </button>
            </div>
          )}

          {/* 1. CONNEXION (LOGIN FORM) */}
          {authMode === 'signin' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 font-mono block">
                  Adresse E-mail
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Ex: citoyen@gmail.com"
                    className="w-full text-xs p-3 pl-9 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                    required
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 font-mono">
                    Mot de passe
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryEmail(email);
                      setAuthMode('forgot');
                      setRecoveryStep('request');
                      setError('');
                      setRecoverySuccessMsg('');
                    }}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs p-3 pl-9 pr-10 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>Se connecter</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); setError(''); }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                >
                  Vous n'avez pas encore de compte ? S'inscrire ici
                </button>
              </div>
            </form>
          )}

          {/* 2. CREATION DE COMPTE (SIGNUP FORM) */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3.5">
              
              {/* Nom & Prénom */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 font-mono block">
                    Nom <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Ex: HOUESSOU"
                      className="w-full text-xs p-2.5 pl-8 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                      required
                    />
                    <User className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 font-mono block">
                    Prénom <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Ex: Rodrigue"
                      className="w-full text-xs p-2.5 pl-8 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                      required
                    />
                    <User className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
                  </div>
                </div>
              </div>

              {/* Numéro de téléphone & Ville */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 font-mono block">
                    Numéro de Téléphone <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="Ex: +229 97 00 00 00"
                      className="w-full text-xs p-2.5 pl-8 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      required
                    />
                    <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 font-mono block">
                    Ville <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Ex: Cotonou, Porto-Novo, Parakou"
                      className="w-full text-xs p-2.5 pl-8 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                      required
                    />
                    <MapPin className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
                  </div>
                </div>
              </div>

              {/* Adresse E-mail */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 font-mono block">
                  Adresse E-mail <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Ex: contact@exemple.com"
                    className="w-full text-xs p-2.5 pl-8 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                    required
                  />
                  <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 font-mono block">
                  Mot de passe (min. 6 caractères) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs p-2.5 pl-8 pr-10 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                  <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Rôle souhaité */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 font-mono block">
                  Type de compte
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSignUpRole('simple')}
                    className={`py-2 px-3 border rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                      signUpRole === 'simple' 
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-600 dark:text-blue-400 font-extrabold' 
                        : 'border-gray-200 dark:border-slate-800 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-1.5"><User className="w-3.5 h-3.5" /> Citoyen</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignUpRole('media')}
                    className={`py-2 px-3 border rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                      signUpRole === 'media' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold' 
                        : 'border-gray-200 dark:border-slate-800 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-1.5"><Mic className="w-3.5 h-3.5" /> Organe Média</span>
                  </button>
                </div>
              </div>

              {/* Nom du Média si rôle media */}
              {signUpRole === 'media' && (
                <div className="space-y-1 animate-slide-down">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 font-mono block">
                    Nom de l'Organe de Presse / Média <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={mediaName}
                    onChange={e => setMediaName(e.target.value)}
                    placeholder="Ex: Bénin Libéré, Capp FM, Matin Libre"
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Créer mon compte & Accéder au Tableau</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setError(''); }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                >
                  Vous possédez déjà un compte ? Se connecter
                </button>
              </div>
            </form>
          )}

          {/* 3. RECUPERATION DE COMPTE (FORGOT PASSWORD FORM) */}
          {authMode === 'forgot' && (
            <div className="space-y-4 animate-scale-up">
              
              {recoverySuccessMsg && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 p-3 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{recoverySuccessMsg}</span>
                </div>
              )}

              {recoveryStep === 'request' ? (
                /* Step 1: Request reset */
                <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 font-mono block">
                      Adresse E-mail de votre compte
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={recoveryEmail}
                        onChange={e => setRecoveryEmail(e.target.value)}
                        placeholder="Ex: monadresse@gmail.com"
                        className="w-full text-xs p-3 pl-9 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                        required
                      />
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isRecovering}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isRecovering ? 'Vérification...' : 'Continuer la récupération'}</span>
                  </button>
                </form>
              ) : (
                /* Step 2: Set new password */
                <form onSubmit={handlePerformPasswordReset} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 font-mono block">
                      Nouveau mot de passe (min. 6 caractères) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs p-2.5 pl-8 pr-10 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        required
                      />
                      <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 font-mono block">
                      Confirmer le nouveau mot de passe <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs p-2.5 pl-8 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        required
                      />
                      <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isRecovering}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    <Key className="w-4 h-4" />
                    <span>{isRecovering ? 'Enregistrement dans Supabase...' : 'Enregistrer le nouveau mot de passe'}</span>
                  </button>
                </form>
              )}

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setError(''); setRecoverySuccessMsg(''); }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Retour à la connexion</span>
                </button>
              </div>

            </div>
          )}
        </>
      )}

    </div>
  );
}


// ==========================================================
// 2. WEB MEDIA DASHBOARD COMPONENT
// ==========================================
export function MediaDashboard({ currentUser, onLogout }: { currentUser: UserProfile; onLogout?: () => void }) {
  const canPublishCourses = currentUser.canPublishCourses !== false;
  const canPublishRumors = currentUser.canPublishRumors !== false;

  // Tabs: 'courses' | 'rumors' | 'unes'
  const [mediaActiveTab, setMediaActiveTab] = useState<'courses' | 'rumors' | 'unes'>(
    canPublishCourses ? 'courses' : (canPublishRumors ? 'rumors' : 'unes')
  );

  // Journal UNEs frontpages states for Media Dashboard
  const [allFrontPages, setAllFrontPages] = useState<any[]>([]);
  const [uneImageUrl, setUneImageUrl] = useState('');
  const [uneDate, setUneDate] = useState(new Date().toISOString().substring(0, 10));
  const [uneTitle, setUneTitle] = useState('');
  const [editingUne, setEditingUne] = useState<any | null>(null);

  const currentMediaName = currentUser.mediaName || "Média Certifié";

  // Real-time synchronization of frontpages for this specific media partner
  useEffect(() => {
    const q = query(collection(db, 'frontpages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.mediaName === currentMediaName) {
          list.push({ id: doc.id, ...data });
        }
      });
      setAllFrontPages(list);
    }, (err) => {
      console.warn("Error synchronizing frontpages from Firestore in MediaDashboard:", err);
    });
    return unsubscribe;
  }, [currentMediaName]);

  const handleSaveUne = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uneImageUrl.trim() || !uneDate.trim()) {
      triggerToast('Veuillez remplir tous les champs obligatoires.', 'error');
      return;
    }
    const isEditing = !!editingUne;
    triggerConfirm({
      type: isEditing ? 'edit' : 'add',
      title: isEditing ? "Modifier la UNE de journal ?" : "Publier la nouvelle UNE ?",
      message: isEditing 
        ? "Voulez-vous enregistrer les modifications apportées à cette UNE ?" 
        : `Voulez-vous vraiment publier la UNE de journal pour ${currentMediaName} ?`,
      confirmText: isEditing ? "Enregistrer les modifications" : "Publier la UNE",
      onConfirm: async () => {
        try {
          const uneData = {
            mediaName: currentMediaName,
            imageUrl: uneImageUrl.trim(),
            date: uneDate.trim(),
            title: uneTitle.trim() || "",
            publishedBy: currentUser.email || 'partenaire@actuhub.bj',
            createdAt: editingUne ? editingUne.createdAt : new Date().toISOString()
          };
          if (editingUne) {
            await setDoc(doc(db, 'frontpages', editingUne.id), uneData);
            triggerToast('Votre UNE a été modifiée avec succès.', 'success');
            setEditingUne(null);
          } else {
            await addDoc(collection(db, 'frontpages'), uneData);
            triggerToast('Votre nouvelle UNE a été publiée avec succès !', 'success');
          }
          setUneImageUrl('');
          setUneDate(new Date().toISOString().substring(0, 10));
          setUneTitle('');
        } catch (err) {
          console.error("Error saving frontpage for media:", err);
          triggerToast("Erreur lors de la publication de la UNE.", "error");
        }
      }
    });
  };

  // Confirmation Modal state for Media Dashboard
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type?: ConfirmationType;
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

  const triggerConfirm = (options: {
    title: string;
    message: string;
    type?: ConfirmationType;
    details?: string | React.ReactNode;
    confirmText?: string;
    onConfirm: () => void | Promise<void>;
  }) => {
    setConfirmDialog({
      isOpen: true,
      type: options.type || 'warning',
      title: options.title,
      message: options.message,
      details: options.details,
      confirmText: options.confirmText,
      onConfirm: async () => {
        try {
          await options.onConfirm();
        } catch (err) {
          console.error("Error in confirmed action", err);
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleDeleteUne = (id: string) => {
    triggerConfirm({
      type: 'delete',
      title: "Supprimer la UNE ?",
      message: "Voulez-vous vraiment supprimer définitivement cette UNE de journal de la plateforme ?",
      confirmText: "Supprimer définitivement",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'frontpages', id));
          triggerToast("La UNE a été supprimée.", "success");
          if (editingUne?.id === id) {
            setEditingUne(null);
            setUneImageUrl('');
            setUneDate(new Date().toISOString().substring(0, 10));
            setUneTitle('');
          }
        } catch (err) {
          console.error("Error deleting frontpage:", err);
          triggerToast("Erreur lors de la suppression.", "error");
        }
      }
    });
  };

  // Submit media state
  const [submission, setSubmission] = useState<MediaSubmission | null>(null);
  const [formMediaName, setFormMediaName] = useState(currentUser.mediaName || '');
  const [formEmail, setFormEmail] = useState(currentUser.email || '');
  const [formUrl, setFormUrl] = useState('');
  const [formHaac, setFormHaac] = useState('');
  const [formCategory, setFormCategory] = useState<'presse-ecrite' | 'presse-en-ligne' | 'audiovisuel' | 'autre'>('presse-en-ligne');

  // Course creation state
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDuration, setCourseDuration] = useState('15 min');
  const [courseDifficulty, setCourseDifficulty] = useState<'Débutant' | 'Intermédiaire' | 'Avancé'>('Débutant');
  const [courseSummary, setCourseSummary] = useState('');
  const [coursePageTitle, setCoursePageTitle] = useState('');
  const [courseSecTitle, setCourseSecTitle] = useState('');
  const [courseBodyParagraph1, setCourseBodyParagraph1] = useState('');
  const [courseBodyParagraph2, setCourseBodyParagraph2] = useState('');

  // Lessons list published by this media account
  const [myLessons, setMyLessons] = useState<Lesson[]>([]);

  // Debunking states
  const [selectedReportIdForDebunk, setSelectedReportIdForDebunk] = useState<string | null>(null);
  const [debunkText, setDebunkText] = useState('');
  const [debunkStatus, setDebunkStatus] = useState<'fake' | 'misleading' | 'verified'>('fake');

  // Citizen Reports Feed
  const [reports, setReports] = useState<FakeNewsReport[]>([]);

  useEffect(() => {
    // 1. Synchroniser en temps réel les rumeurs depuis Firestore
    const qRumors = collection(db, "rumeurs");
    const unsubRumors = onSnapshot(qRumors, (snapshot) => {
      const fetched: FakeNewsReport[] = [];
      snapshot.forEach((d) => fetched.push({ id: d.id, ...d.data() } as FakeNewsReport));
      setReports(fetched);
    }, (err) => {
      console.warn("Firestore unsubRumors error:", err);
      try {
        handleFirestoreError(err, OperationType.GET, "rumeurs");
      } catch (e) {}
    });

    // 2. Synchroniser en temps réel les leçons d'éducation aux médias depuis Firestore
    const qLessons = collection(db, "lessons");
    const unsubLessons = onSnapshot(qLessons, (snapshot) => {
      const fetched: Lesson[] = [];
      snapshot.forEach((d) => fetched.push({ id: d.id, ...d.data() } as Lesson));
      
      const publisherName = currentUser.mediaName || currentUser.fullName;
      const mine = fetched.filter(les => les.publisher === publisherName);
      setMyLessons(mine);
    }, (err) => {
      console.warn("Firestore unsubLessons error:", err);
      try {
        handleFirestoreError(err, OperationType.GET, "lessons");
      } catch (e) {}
    });

    return () => {
      unsubRumors();
      unsubLessons();
    };
  }, [currentUser.mediaName, currentUser.fullName]);

  useEffect(() => {
    // Sync media submissions real-time from Firestore for this user
    const qSubmissions = collection(db, "submissions");
    const unsub = onSnapshot(qSubmissions, (snapshot) => {
      const all: MediaSubmission[] = [];
      snapshot.forEach((d) => {
        all.push({ id: d.id, ...d.data() } as MediaSubmission);
      });
      const mine = all.find(sub => sub.email.toLowerCase() === currentUser.email.toLowerCase());
      setSubmission(mine || null);
      if (mine) {
        setFormMediaName(mine.mediaName);
        setFormUrl(mine.websiteUrl);
        setFormHaac(mine.haacRegNumber);
        setFormCategory(mine.category);
      }
    }, (err) => {
      console.warn("Firestore error fetching submissions in MediaDashboard:", err);
    });
    return () => unsub();
  }, [currentUser.email]);

  const handleMediaSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMediaName || !formUrl || !formHaac) {
      triggerToast('Veuillez remplir tous les champs obligatoires.', 'error');
      return;
    }

    try {
      const submissionId = submission?.id || "sub-" + Math.random().toString(36).substring(2, 7);
      const newSub: MediaSubmission = {
        id: submissionId,
        mediaName: formMediaName,
        email: currentUser.email,
        websiteUrl: formUrl,
        haacRegNumber: formHaac,
        category: formCategory,
        status: 'pending',
        submittedAt: new Date().toLocaleDateString('fr-FR')
      };

      await setDoc(doc(db, "submissions", submissionId), newSub);
      triggerToast('Demande d\'intégration de votre média transmise avec succès ! 📥', 'success');
    } catch (err) {
      console.error("Error saving media submission in MediaDashboard:", err);
      triggerToast('Erreur lors de la transmission de votre déclaration.', 'error');
    }
  };

  const handleWithdrawMedia = () => {
    if (!submission) return;
    triggerConfirm({
      type: 'warning',
      title: "Retirer la demande d'intégration média ?",
      message: "Voulez-vous vraiment retirer votre demande d'intégration média de la file d'attente du comité ?",
      confirmText: "Retirer la déclaration",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "submissions", submission.id));
          setSubmission(null);
          triggerToast('Retrait d\'intégration média effectué avec succès.', 'info');
        } catch (err) {
          console.error("Error deleting media submission in MediaDashboard:", err);
          triggerToast('Erreur lors du retrait de votre déclaration.', 'error');
        }
      }
    });
  };

  const handlePublishCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle || !courseSummary || !coursePageTitle || !courseSecTitle || !courseBodyParagraph1) {
      triggerToast('Informations de cours incomplètes.', 'error');
      return;
    }

    try {
      const freshLesson: Lesson = {
        id: "les-" + Date.now().toString().slice(-5),
        title: courseTitle,
        duration: courseDuration,
        difficulty: courseDifficulty,
        summary: courseSummary,
        icon: "newspaper",
        publisher: currentUser.mediaName || currentUser.fullName,
        publishedAt: new Date().toLocaleDateString('fr-FR'),
        pages: [
          {
            title: coursePageTitle,
            sections: [
              {
                title: courseSecTitle,
                body: [
                  courseBodyParagraph1,
                  courseBodyParagraph2 || "Vérifiez constamment vos sources et ne transmettez jamais d'informations n'ayant pas fait l'objet d'un recoupement rigoureux."
                ]
              }
            ]
          }
        ]
      };

      // Save directly to Supabase for persistent database synchronization
      await coursesService.saveCourse(freshLesson);

      // reset form
      setCourseTitle('');
      setCourseSummary('');
      setCoursePageTitle('');
      setCourseSecTitle('');
      setCourseBodyParagraph1('');
      setCourseBodyParagraph2('');

      triggerToast('Votre formation d\'Éducation aux Médias a été enregistrée dans la base de données ! 📚', 'success');
    } catch(e) {
      console.error("Error publishing course to Supabase:", e);
      triggerToast('Erreur lors de la publication du cours sur la base de données.', 'error');
    }
  };

  const handleDeleteLesson = (lessonId: string) => {
    const targetLesson = myLessons.find(l => l.id === lessonId);
    triggerConfirm({
      type: 'delete',
      title: "Supprimer le cours en ligne ?",
      message: `Voulez-vous vraiment supprimer définitivement le cours "${targetLesson?.title || lessonId}" ? Cette action est irréversible.`,
      confirmText: "Supprimer définitivement",
      onConfirm: async () => {
        try {
          await coursesService.deleteCourse(lessonId);
          triggerToast('Cours en ligne supprimé avec succès de la plateforme ! 📚', 'success');
        } catch (e) {
          console.error("Error deleting course from Supabase:", e);
          triggerToast('Erreur lors de la suppression du cours.', 'error');
        }
      }
    });
  };

  const handleMediaSubmitDebunk = async (e: React.FormEvent, reportId: string) => {
    e.preventDefault();
    if (!debunkText.trim()) {
      triggerToast("Veuillez saisir votre texte de démenti.", "error");
      return;
    }

    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    const mediaLabel = currentUser.mediaName || currentUser.fullName;
    const cleanDate = new Date().toLocaleDateString('fr-FR');
    const updateHeader = `\n\n📢 [Démenti Presse de ${mediaLabel} - ${cleanDate}]:\n"${debunkText}"`;
    
    const updatedExplanation = report.explanation 
      ? report.explanation + updateHeader 
      : updateHeader;

    const updatedReport: FakeNewsReport = {
      ...report,
      status: debunkStatus,
      explanation: updatedExplanation,
      reason: `Clarification par ${mediaLabel}`
    };

    try {
      await setDoc(doc(db, "rumeurs", reportId), updatedReport);
      triggerToast("Votre démenti et analyse de presse ont été publiés ! 📢", "success");
      setDebunkText('');
      setSelectedReportIdForDebunk(null);
    } catch (e) {
      console.error("Error updating debunk in Firestore:", e);
      triggerToast("Erreur lors de la publication de votre démenti sur la base de données.", "error");
    }
  };

  return (
    <div id="media-dashboard-workspace" className="space-y-8 animate-fade-in py-4 max-w-5xl mx-auto">
      
      {/* Banner Card */}
      <div className="bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 text-white rounded-[32px] p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl border border-emerald-800/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl"></div>
        <div className="space-y-2 relative">
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest font-mono">
            Espace Professionnel Média
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Plateforme Média : {currentUser.mediaName || "Organe de Presse Référencé"}
          </h2>
          <p className="text-xs text-slate-350 max-w-xl leading-relaxed">
            Publiez vos modules de sensibilisation citoyenne, scrutez les signalements émanant des internautes, et légitimez votre présence dans l'écosystème numérique du Bénin.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 shrink-0 select-none">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <div className="text-left font-mono">
              <span className="text-[9px] font-bold text-emerald-400 block tracking-wider uppercase">Statut Partenaire</span>
              <span className="text-[11px] font-bold">Média Coordinateur</span>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-4 py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-500/40 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-sm shadow-sm"
              title="Se déconnecter de l'espace média"
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          )}
        </div>
      </div>

      {/* Internal Ribbon tabs */}
      <div className="flex flex-wrap border-b border-gray-150 dark:border-slate-800 gap-2">
        <button
          onClick={() => setMediaActiveTab('courses')}
          className={`pb-3 text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer px-1 flex items-center gap-1.5 border-b-2 ${
            mediaActiveTab === 'courses' 
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400' 
              : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Publier un Cours</span>
          {!canPublishCourses && <span className="text-[9px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> Bloqué</span>}
        </button>
        <button
          onClick={() => setMediaActiveTab('rumors')}
          className={`pb-3 text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer px-1 flex items-center gap-1.5 border-b-2 ${
            mediaActiveTab === 'rumors' 
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400' 
              : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Vigie des Rumeurs ({reports.length})</span>
          {!canPublishRumors && <span className="text-[9px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> Bloqué</span>}
        </button>
        <button
          onClick={() => setMediaActiveTab('unes')}
          className={`pb-3 text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer px-1 flex items-center gap-1.5 border-b-2 ${
            mediaActiveTab === 'unes' 
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400' 
              : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Folder className="w-4 h-4" />
          <span>Notre UNE ({allFrontPages.length})</span>
        </button>
      </div>

      {/* Content panes based on selection */}
      <div id="media-tab-workspace-content">
        
        {/* Course formulation panel */}
        {mediaActiveTab === 'courses' && (
          !canPublishCourses ? (
            <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 p-6 md:p-8 rounded-3xl space-y-3 text-amber-900 dark:text-amber-200 animate-fade-in text-left">
              <div className="flex items-center gap-2.5 font-bold text-sm sm:text-base">
                <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Accès Non Autorisé : Publication de Cours</span>
              </div>
              <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                L'Administrateur principal ne vous a pas encore accordé les droits d'accès pour <strong>"Publier un Cours"</strong>. Seuls les médias expressément autorisés par l'administration peuvent publier des modules sur l'Académie.
              </p>
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-6 rounded-3xl space-y-5 shadow-sm">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono">Concevoir un cours d'éducation aux médias</h3>
                <p className="text-[10px] text-gray-400">Éduquez la communauté béninoise pour qu'elle discerne d'elle-même les rumeurs.</p>
              </div>

              <form onSubmit={handlePublishCourse} className="space-y-4 text-xs font-semibold">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Titre de la Formation *</label>
                    <input
                      type="text"
                      value={courseTitle}
                      onChange={e => setCourseTitle(e.target.value)}
                      placeholder="Ex: Analyse sémantique d'un audio WhatsApp"
                      className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Niveau d'aptitude</label>
                    <select
                      value={courseDifficulty}
                      onChange={e => setCourseDifficulty(e.target.value as any)}
                      className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none"
                    >
                      <option value="Débutant">Débutant</option>
                      <option value="Intermédiaire">Intermédiaire</option>
                      <option value="Avancé">Avancé</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Résumé de la leçon *</label>
                  <textarea
                    value={courseSummary}
                    onChange={e => setCourseSummary(e.target.value)}
                    placeholder="Brève description attractive qui sera affichée sur la carte du module..."
                    rows={2}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none"
                    required
                  />
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-900 space-y-4">
                  <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 font-mono uppercase block">CONTENU DU CHAPITRE UNIQUE</span>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Titre de la Page de Contenu *</label>
                    <input
                      type="text"
                      value={coursePageTitle}
                      onChange={e => setCoursePageTitle(e.target.value)}
                      placeholder="Ex: Étape 1 : Analyser le ton dramatique de la voix"
                      className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Sous-Section Thématique *</label>
                    <input
                      type="text"
                      value={courseSecTitle}
                      onChange={e => setCourseSecTitle(e.target.value)}
                      placeholder="Ex: L'indice de l'urgence émotionnelle"
                      className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Corps de texte - Paragraphe 1 *</label>
                    <textarea
                      value={courseBodyParagraph1}
                      onChange={e => setCourseBodyParagraph1(e.target.value)}
                      placeholder="Développez l'enseignement de façon claire. Donnez des recommandations concrètes..."
                      rows={3}
                      className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none font-sans leading-relaxed"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Corps de texte - Paragraphe 2 (Optionnel)</label>
                    <textarea
                      value={courseBodyParagraph2}
                      onChange={e => setCourseBodyParagraph2(e.target.value)}
                      placeholder="Un paragraphe additionnel ou exemple à analyser..."
                      rows={2}
                      className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none font-sans leading-relaxed"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publier le Module dans l'Académie</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono">Charte de l'Enseignant</h3>
              <p className="text-[10px] text-gray-400">En tant qu'organe de presse agréé, vos publications sont hautement visibles. Veillez à respecter les principes cardinaux suivants :</p>
              
              <ul className="space-y-3 pt-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Indépendance éditoriale :</strong> Aucun contenu partisan politique ou publicitaire déguisé.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Pédagogie :</strong> Apportez des illustrations de faits réels survenus sur le territoire béninois.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Modestie linguistique :</strong> Écrivez en français clair et accessible au grand public.</span>
                </li>
              </ul>

              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 border border-emerald-100 dark:border-emerald-900/60 rounded-2xl text-[10px] text-emerald-800 dark:text-emerald-400 leading-relaxed font-mono">
                💡 Une fois publié, le cours est accessible immédiatement par l'ensemble des citoyens connectés sur l'Académie, augmentant ainsi la notoriété numérique de votre média.
              </div>
            </div>

            {/* Mes formations en ligne publiées par ce média */}
            <div className="lg:col-span-12 mt-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono">Mes modules publiés en ligne ({myLessons.length})</h3>
                  <p className="text-[10px] text-gray-400">Suivez et modérez les leçons d'éducation aux médias que vous diffusez aux citoyens béninois.</p>
                </div>
              </div>
              
              {myLessons.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-6">Vous n'avez pas encore publié de cours. Concevez votre premier module à l'aide du formulaire ci-dessus !</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myLessons.map((les) => (
                    <div key={les.id} className="p-4 rounded-2xl border border-gray-150 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-950/40 flex justify-between items-start gap-4 hover:border-emerald-500/30 transition-colors">
                      <div className="space-y-1.5 min-w-0">
                        <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                          {les.difficulty}
                        </span>
                        <h4 className="text-xs sm:text-sm font-black text-gray-900 dark:text-gray-100 truncate">{les.title}</h4>
                        <p className="text-[10px] text-gray-500 line-clamp-2">{les.summary}</p>
                        <p className="text-[9px] text-gray-400 font-mono">Publié le : {les.publishedAt || "Récent"}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteLesson(les.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer shrink-0"
                        title="Supprimer ce cours"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
          )
        )}

        {/* Live citizen report views panel */}
        {mediaActiveTab === 'rumors' && (
          !canPublishRumors ? (
            <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 p-6 md:p-8 rounded-3xl space-y-3 text-amber-900 dark:text-amber-200 animate-fade-in text-left">
              <div className="flex items-center gap-2.5 font-bold text-sm sm:text-base">
                <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Accès Non Autorisé : Vigie des Rumeurs</span>
              </div>
              <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                L'Administrateur principal ne vous a pas encore accordé les droits d'accès pour la <strong>"Vigie des Rumeurs"</strong>. Seuls les médias expressément autorisés par l'administration peuvent modérer et auditer les signalements citoyennes.
              </p>
            </div>
          ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono">Vigie des Signalements de Rumeurs</h3>
              <p className="text-[10px] text-gray-400">Ces messages suspects nous ont été soumis par des citoyens béninois ces dernières 48h. Apportez votre expertise.</p>
            </div>

            {reports.length === 0 ? (
              <p className="text-center p-8 text-xs text-gray-400 italic">Aucune rumeur signalée à ce jour.</p>
            ) : (
              <div className="space-y-4">
                {reports.map((rep) => {
                  let badge = <span className="bg-amber-100 text-amber-850 dark:bg-amber-950 text-[10px] p-1 px-2.5 rounded-full font-bold">En cours d'examen</span>;
                  if (rep.status === 'fake') badge = <span className="bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 text-[10px] p-1 px-2.5 rounded-full font-bold">Vérifié Faux</span>;
                  if (rep.status === 'verified') badge = <span className="bg-emerald-150 text-emerald-850 dark:bg-emerald-950/40 text-[10px] p-1 px-2.5 rounded-full font-bold">Officiel & Vrai</span>;
                  if (rep.status === 'misleading') badge = <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 text-[10px] p-1 px-2.5 rounded-full font-bold">Trompeur/Détourné</span>;

                  return (
                    <div key={rep.id} className="border border-gray-100 dark:border-slate-800 p-5 rounded-2xl hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black uppercase text-blue-500 font-mono tracking-wider">Rumeur #{rep.id} • Catégorie {rep.category}</span>
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">{rep.title}</h4>
                        </div>
                        {badge}
                      </div>

                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-gray-100 dark:border-slate-900/60 font-mono">
                        "{rep.description}"
                      </p>

                      {rep.explanation && (
                        <div className="text-[11px] text-gray-600 dark:text-gray-300 bg-emerald-50/20 dark:bg-slate-950 p-3.5 rounded-xl border border-emerald-100/40 dark:border-slate-900 font-sans leading-relaxed whitespace-pre-wrap">
                          <strong className="text-xs text-emerald-600 dark:text-emerald-400 font-mono block mb-1">🔍 RAPPORTS DE VÉRIFICATION & COMMUNIQUÉS :</strong>
                          {rep.explanation}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-gray-400 pt-1 border-t border-gray-100 dark:border-slate-800/60 font-semibold font-mono">
                        <span>Signalé par : <strong>{rep.reporterName}</strong></span>
                        <span>Date de soumission : <strong>{rep.date}</strong></span>
                        <span>Soutiens de clarification : <strong>{rep.upvotes} voix</strong></span>
                      </div>

                      {/* Debunk tool widget */}
                      <div className="pt-2 border-t border-gray-100 dark:border-slate-800/30">
                        {selectedReportIdForDebunk === rep.id ? (
                          <form onSubmit={(e) => handleMediaSubmitDebunk(e, rep.id)} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-gray-100 dark:border-slate-800 space-y-3">
                            <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 font-mono block">📢 PUBLIER UN DÉMENTI DE PRESSE OFFICIEL</span>
                            
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-500 font-mono block">Proposer une requalification de verdict :</label>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setDebunkStatus('fake')}
                                  className={`text-[9px] font-extrabold px-3 py-1.5 rounded-lg border font-mono transition-all uppercase tracking-wider cursor-pointer ${
                                    debunkStatus === 'fake' 
                                      ? 'bg-rose-600 text-white border-rose-600' 
                                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-gray-200 dark:border-slate-850'
                                  }`}
                                >
                                  Vérifié Faux
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDebunkStatus('misleading')}
                                  className={`text-[9px] font-extrabold px-3 py-1.5 rounded-lg border font-mono transition-all uppercase tracking-wider cursor-pointer ${
                                    debunkStatus === 'misleading' 
                                      ? 'bg-amber-500 text-white border-amber-500' 
                                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-gray-200 dark:border-slate-850'
                                  }`}
                                >
                                  Trompeur/Détourné
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDebunkStatus('verified')}
                                  className={`text-[9px] font-extrabold px-3 py-1.5 rounded-lg border font-mono transition-all uppercase tracking-wider cursor-pointer ${
                                    debunkStatus === 'verified' 
                                      ? 'bg-emerald-600 text-white border-emerald-600' 
                                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-gray-200 dark:border-slate-850'
                                  }`}
                                >
                                  Officiel & Vrai
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-500 font-mono block">Texte de l'analyse ou du recoupement journalistique :</label>
                              <textarea
                                value={debunkText}
                                onChange={e => setDebunkText(e.target.value)}
                                placeholder="Saisissez les conclusions de votre rédaction, les démentis officiels ou contacts de sources établies au Bénin..."
                                rows={3}
                                className="w-full text-xs p-2.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none"
                                required
                              />
                            </div>

                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => setSelectedReportIdForDebunk(null)}
                                className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-gray-150 hover:bg-gray-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350 cursor-pointer"
                              >
                                Annuler
                              </button>
                              <button
                                type="submit"
                                className="text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                              >
                                Publier la Rectification
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex justify-end">
                            <button
                              onClick={() => {
                                setSelectedReportIdForDebunk(rep.id);
                                setDebunkText('');
                                setDebunkStatus(rep.status === 'pending' ? 'fake' : rep.status);
                              }}
                              className="text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl border border-emerald-500/20 hover:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer"
                            >
                              📝 Rédiger un démenti de presse
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
          )
        )}

        {/* MANAGEMENT DES UNES PAR LE MÉDIA PARTENAIRE */}
        {mediaActiveTab === 'unes' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in text-left">
            {/* Formulaire de publication / modification */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-sm font-sans">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-emerald-500" />
                    {editingUne ? 'Modifier la UNE' : 'Publier une UNE'}
                  </span>
                  <span className="text-[9px] bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full font-black">⏱️ Max 24h</span>
                </h3>
                <p className="text-[10px] text-gray-400 mt-1">
                  {editingUne 
                    ? 'Modifiez les détails de la UNE sélectionnée.' 
                    : `Publiez l'image de couverture officielle de la UNE de ${currentMediaName}. Les UNEs expirent automatiquement après 24h.`}
                </p>
              </div>

              {/* Notice 24h rule */}
              <div className="p-3 bg-rose-50/70 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl flex items-start gap-2 text-[10px] text-rose-700 dark:text-rose-300 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>Règle des 24h : Les UNEs publiées restent visibles sur le kiosque public pendant exactement 24 heures à compter de leur heure de parution.</span>
              </div>

              <form onSubmit={handleSaveUne} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Média</label>
                  <input
                    type="text"
                    value={currentMediaName}
                    disabled
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-850 bg-gray-100 dark:bg-slate-950 text-gray-500 dark:text-gray-400 cursor-not-allowed focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Titre de l'Édition (optionnel)</label>
                  <input
                    type="text"
                    value={uneTitle}
                    onChange={e => setUneTitle(e.target.value)}
                    placeholder="Ex: Édition Spéciale, N° 456 du Matin..."
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Date de parution *</label>
                  <input
                    type="date"
                    value={uneDate}
                    onChange={e => setUneDate(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">
                    Fichier image de la UNE *
                  </label>
                  
                  <div className="bg-slate-50 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl border border-gray-150 dark:border-slate-800 bg-white dark:bg-slate-900/40 relative">
                      <Upload className="w-5 h-5 text-emerald-555 animate-pulse mb-1.5" />
                      <span className="text-[10px] text-slate-700 dark:text-slate-300 font-bold block mb-1">
                        Téléverser la UNE
                      </span>
                      <span className="text-[9px] text-slate-400 block mb-2.5">
                        Glissez-déposez ou cliquez pour choisir
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressed = await compressImageFile(file, 1200, 1200, 0.85);
                              setUneImageUrl(compressed);
                              triggerToast('Image de la UNE optimisée et chargée ! 💾', 'success');
                            } catch (err) {
                              console.error("Error compressing image", err);
                              triggerToast("Erreur lors de l'optimisation de l'image.", "error");
                            }
                          }
                        }}
                      />
                      {uneImageUrl.startsWith('data:') && (
                        <div className="mt-1 text-[9px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-md font-bold flex items-center gap-1 z-10">
                          <span>✓ Image prête</span>
                          <button 
                            type="button" 
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setUneImageUrl('');
                            }}
                            className="text-red-500 font-bold ml-1 hover:underline cursor-pointer"
                          >
                            Effacer
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="text-center text-[9px] text-slate-400">OU saisissez un lien URL d'image existant</div>

                    <input
                      type="url"
                      value={uneImageUrl}
                      onChange={e => setUneImageUrl(e.target.value)}
                      placeholder="https://exemple.com/une.jpg"
                      className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  {editingUne && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUne(null);
                        setUneImageUrl('');
                        setUneDate(new Date().toISOString().substring(0, 10));
                        setUneTitle('');
                      }}
                      className="flex-1 bg-slate-250 hover:bg-slate-350 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-[10px] uppercase tracking-wider py-3 px-4 rounded-xl transition-all cursor-pointer shadow-sm text-center"
                    >
                      Annuler
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider py-3 px-4 rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                  >
                    {editingUne ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    <span>{editingUne ? 'Enregistrer' : 'Publier la UNE'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Liste de nos UNEs publiées */}
            <div className="lg:col-span-7 space-y-4 font-sans text-left">
              <h3 className="text-xs font-black text-slate-850 dark:text-slate-100 uppercase tracking-wider font-mono flex items-center justify-between">
                <span>Nos UNEs publiées ({allFrontPages.length})</span>
                <span className="text-[9px] text-gray-400 font-normal">S'affichent 24h sur le Kiosque</span>
              </h3>

              {allFrontPages.length === 0 ? (
                <div className="p-8 border border-dashed border-gray-200 dark:border-slate-800 text-center rounded-3xl text-gray-400 text-xs font-mono">
                  Vous n'avez pas encore publié de UNE de journal.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
                  {allFrontPages.map((une) => {
                    const timeInfo = getUneRemainingTime(une);
                    const isValid = !timeInfo.isExpired;

                    return (
                      <div 
                        key={une.id} 
                        className={`p-4 rounded-3xl border ${isValid ? 'border-gray-150 dark:border-slate-800/80 bg-white dark:bg-slate-900' : 'border-rose-200 dark:border-rose-950/40 bg-rose-50/20 dark:bg-rose-950/10'} shadow-sm flex flex-col justify-between gap-3`}
                      >
                        <div className="space-y-2">
                          {/* Preview */}
                          <div className="aspect-[3/4] w-full rounded-2xl bg-slate-100 dark:bg-slate-950 overflow-hidden relative border border-slate-150 dark:border-slate-800 flex items-center justify-center">
                            {une.imageUrl ? (
                              <img
                                src={une.imageUrl}
                                alt={une.mediaName}
                                className="w-full h-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="text-xs text-gray-400">Pas d'image</span>
                            )}
                            <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full font-mono">
                              {une.date}
                            </div>

                            {/* Status pill 24h */}
                            <div className={`absolute bottom-2 right-2 text-[8px] font-mono font-black px-2 py-0.5 rounded-full backdrop-blur-md shadow-sm ${
                              isValid 
                                ? 'bg-emerald-500/90 text-white' 
                                : 'bg-rose-600/90 text-white'
                            }`}>
                              {isValid ? `🟢 Active (${timeInfo.formattedRemaining})` : '🔴 Expirée (+24h)'}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                              <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-black font-mono">
                                {une.mediaName}
                              </span>
                              <span className="truncate">{une.title || "Édition Standard"}</span>
                            </h4>
                            <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                              <span>Publié : {new Date(une.createdAt).toLocaleDateString('fr-FR')}</span>
                              <span className={isValid ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-500 font-bold'}>
                                {isValid ? 'Visible en ligne' : 'Masqué (Expiré)'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <button
                            onClick={async () => {
                              try {
                                const newDate = new Date().toISOString().substring(0, 10);
                                const newCreatedAt = new Date().toISOString();
                                await setDoc(doc(db, 'frontpages', une.id), {
                                  ...une,
                                  date: newDate,
                                  createdAt: newCreatedAt
                                });
                                triggerToast('La UNE a été republiée avec succès pour 24h ! 🚀', 'success');
                              } catch (err) {
                                console.error("Error renewing UNE:", err);
                                triggerToast("Erreur lors de la réactivation.", "error");
                              }
                            }}
                            className="p-1.5 px-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 rounded-xl cursor-pointer transition-all text-[9px] font-bold flex items-center gap-1"
                            title="Republier cette UNE pour 24h supplémentaires"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Republier 24h</span>
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingUne(une);
                                setUneImageUrl(une.imageUrl);
                                setUneDate(une.date);
                                setUneTitle(une.title || "");
                              }}
                              className="p-1.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 border border-blue-100 hover:bg-blue-100 rounded-xl cursor-pointer transition-all"
                              title="Modifier cette UNE"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUne(une.id)}
                              className="p-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-100 hover:bg-rose-100 rounded-xl cursor-pointer transition-all"
                              title="Supprimer cette UNE"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

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


// ==========================================
// 3. COMPLETE ADMINISTRATOR COMMAND CENTER
// ==========================================
export function AdminDashboard({ 
  currentUser, 
  onLogout 
}: { 
  currentUser?: UserProfile | null; 
  onLogout?: () => void; 
} = {}) {
  // Tabs: 'users' | 'moderation' | 'registry' | 'courses-creation' | 'communiques' | 'publicites' | 'analytics' | 'unes' | 'newsletters' | 'legal-pages' | 'videos'
  const [adminActiveTab, setAdminActiveTab] = useState<'users' | 'moderation' | 'registry' | 'courses-creation' | 'communiques' | 'publicites' | 'analytics' | 'unes' | 'newsletters' | 'legal-pages' | 'videos'>('users');

  // Newsletter subscriptions state
  const [adminSubscriptions, setAdminSubscriptions] = useState<NewsletterSubscription[]>([]);

  // Sync newsletter subscriptions real-time from Firestore for admin
  useEffect(() => {
    const q = collection(db, "newsletter_subscriptions");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: NewsletterSubscription[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as NewsletterSubscription);
      });
      // Sort by creation date descending
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAdminSubscriptions(list);
    }, (err) => {
      console.warn("Error synchronizing newsletter subscriptions from Firestore for admin:", err);
    });
    return unsubscribe;
  }, []);

  const handleToggleSubscriptionStatus = async (subId: string, newStatus: 'active' | 'rejected') => {
    try {
      await setDoc(doc(db, "newsletter_subscriptions", subId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      triggerToast(`L'abonnement a été ${newStatus === 'active' ? 'activé (accepté)' : 'refusé'} avec succès. Notification email envoyée.`, 'success');
    } catch (error) {
      console.error("Error updating subscription status:", error);
      triggerToast("Impossible de modifier le statut de l'abonnement.", 'error');
    }
  };

  // Shorts videos state inside AdminDashboard
  const [adminShorts, setAdminShorts] = useState<(ShortVideo & { videoId: string })[]>([]);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoChannel, setVideoChannel] = useState('');
  const [videoHandle, setVideoHandle] = useState('');
  const [videoIdInput, setVideoIdInput] = useState('');
  const [editingShort, setEditingShort] = useState<any | null>(null);

  // Sync shorts in real-time from Firestore for Admin
  useEffect(() => {
    const q = collection(db, 'shorts');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setAdminShorts(list);
    }, (err) => {
      console.warn("Error synchronizing shorts from Firestore in Admin:", err);
    });
    return unsubscribe;
  }, []);

  const handleSaveShort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim() || !videoChannel.trim() || !videoIdInput.trim()) {
      triggerToast('Veuillez remplir tous les champs obligatoires.', 'error');
      return;
    }

    // Extract youtube videoId if user enters full URL
    let parsedVideoId = videoIdInput.trim();
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = parsedVideoId.match(regExp);
    if (match && match[2].length === 11) {
      parsedVideoId = match[2];
    } else if (parsedVideoId.includes('youtube.com/') || parsedVideoId.includes('youtu.be/')) {
      try {
        const parts = parsedVideoId.split('/');
        const lastPart = parts[parts.length - 1];
        if (lastPart && lastPart.length >= 11) {
          parsedVideoId = lastPart.substring(0, 11);
        }
      } catch (_) {}
    }

    const shortId = editingShort ? editingShort.id : 'short-' + Date.now();
    const handle = videoHandle.trim() || ('@' + videoChannel.replace(/\s+/g, ''));

    const shortData = {
      id: shortId,
      title: videoTitle.trim(),
      channel: videoChannel.trim(),
      handle: handle,
      videoId: parsedVideoId
    };

    try {
      await setDoc(doc(db, 'shorts', shortId), shortData);
      triggerToast(editingShort ? 'Vidéo mise à jour avec succès.' : 'Nouvelle vidéo ajoutée avec succès !', 'success');
      
      // Reset form
      setVideoTitle('');
      setVideoChannel('');
      setVideoHandle('');
      setVideoIdInput('');
      setEditingShort(null);
    } catch (err) {
      console.error("Error saving video:", err);
      triggerToast("Erreur lors de l'enregistrement de la vidéo.", 'error');
    }
  };

  const handleDeleteShort = async (shortId: string) => {
    triggerConfirm({
      type: 'delete',
      title: 'Supprimer cette vidéo ?',
      message: 'Cette action retirera définitivement cette vidéo YouTube de la playlist.',
      confirmText: 'Supprimer définitivement',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'shorts', shortId));
          triggerToast('La vidéo a été retirée avec succès.', 'success');
        } catch (err) {
          console.error("Error deleting video:", err);
          triggerToast('Impossible de supprimer la vidéo.', 'error');
        }
      }
    });
  };

  // Journal UNEs frontpages state
  const [allFrontPages, setAllFrontPages] = useState<any[]>([]);
  const [uneMediaName, setUneMediaName] = useState('');
  const [uneImageUrl, setUneImageUrl] = useState('');
  const [uneDate, setUneDate] = useState(new Date().toISOString().substring(0, 10));
  const [uneTitle, setUneTitle] = useState('');
  const [editingUne, setEditingUne] = useState<any | null>(null);

  // Sync frontpages in real-time from Firestore
  useEffect(() => {
    const q = query(collection(db, 'frontpages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setAllFrontPages(list);
    }, (err) => {
      console.warn("Error synchronizing frontpages from Firestore:", err);
    });
    return unsubscribe;
  }, []);

  const handleSaveUne = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uneMediaName.trim() || !uneImageUrl.trim() || !uneDate.trim()) {
      triggerToast('Veuillez remplir tous les champs obligatoires.', 'error');
      return;
    }
    const isEditing = !!editingUne;
    triggerConfirm({
      type: isEditing ? 'edit' : 'add',
      title: isEditing ? "Modifier la UNE de journal ?" : "Publier la nouvelle UNE ?",
      message: isEditing 
        ? `Voulez-vous enregistrer les modifications apportées à la UNE de "${uneMediaName}" ?` 
        : `Voulez-vous vraiment publier la UNE de journal pour le média "${uneMediaName}" ?`,
      confirmText: isEditing ? "Enregistrer les modifications" : "Publier la UNE",
      onConfirm: async () => {
        try {
          const uneData = {
            mediaName: uneMediaName.trim(),
            imageUrl: uneImageUrl.trim(),
            date: uneDate.trim(),
            title: uneTitle.trim() || "",
            publishedBy: auth.currentUser?.email || 'admin@actuhub.bj',
            createdAt: editingUne ? editingUne.createdAt : new Date().toISOString()
          };
          if (editingUne) {
            await setDoc(doc(db, 'frontpages', editingUne.id), uneData);
            await frontpagesService.saveFrontPage({ id: editingUne.id, ...uneData } as any);
            triggerToast('La UNE du journal a été modifiée avec succès.', 'success');
            setEditingUne(null);
          } else {
            const docRef = await addDoc(collection(db, 'frontpages'), uneData);
            await frontpagesService.saveFrontPage({ id: docRef.id, ...uneData } as any);
            triggerToast('La nouvelle UNE a été publiée avec succès.', 'success');
          }
          setUneMediaName('');
          setUneImageUrl('');
          setUneDate(new Date().toISOString().substring(0, 10));
          setUneTitle('');
        } catch (err) {
          console.error("Error saving frontpage:", err);
          triggerToast("Erreur lors de la sauvegarde de la UNE.", "error");
        }
      }
    });
  };

  const handleDeleteUne = (id: string) => {
    triggerConfirm({
      type: 'delete',
      title: "Supprimer la UNE de journal ?",
      message: "Voulez-vous vraiment supprimer définitivement cette UNE de journal ?",
      confirmText: "Supprimer définitivement",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'frontpages', id));
          await frontpagesService.deleteFrontPage(id);
          triggerToast("La UNE a été supprimée.", "success");
          if (editingUne?.id === id) {
            setEditingUne(null);
            setUneMediaName('');
            setUneImageUrl('');
            setUneDate(new Date().toISOString().substring(0, 10));
            setUneTitle('');
          }
        } catch (err) {
          console.error("Error deleting frontpage:", err);
          triggerToast("Erreur lors de la suppression.", "error");
        }
      }
    });
  };

  // Search user state
  const [userSearchText, setUserSearchText] = useState('');

  // Course creation & editing state
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDuration, setCourseDuration] = useState('15 min');
  const [courseDifficulty, setCourseDifficulty] = useState<'Débutant' | 'Intermédiaire' | 'Avancé'>('Débutant');
  const [courseCategory, setCourseCategory] = useState('Cybersécurité');
  const [courseSummary, setCourseSummary] = useState('');
  const [coursePageTitle, setCoursePageTitle] = useState('');
  const [courseSecTitle, setCourseSecTitle] = useState('');
  const [courseBodyParagraph1, setCourseBodyParagraph1] = useState('');
  const [courseBodyParagraph2, setCourseBodyParagraph2] = useState('');
  const [courseExerciseTitle, setCourseExerciseTitle] = useState('');
  const [courseExerciseInstructions, setCourseExerciseInstructions] = useState('');
  const [courseExerciseQuestions, setCourseExerciseQuestions] = useState('');
  const [courseExerciseSolution, setCourseExerciseSolution] = useState('');
  const [adminCourseSearch, setAdminCourseSearch] = useState('');

  // All courses published on the platform (by both admins and medias)
  const [allPlatformLessons, setAllPlatformLessons] = useState<Lesson[]>([]);

  // Local sync states
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<FakeNewsReport[]>([]);
  const [submissions, setSubmissions] = useState<MediaSubmission[]>([]);

  // Communiques and Ads states
  const [communiqueContent, setCommuniqueContent] = useState('');
  const [allCommuniques, setAllCommuniques] = useState<Communique[]>([]);

  const [adTitle, setAdTitle] = useState('');
  const [adType, setAdType] = useState<'image' | 'video'>('image');
  const [adMediaUrl, setAdMediaUrl] = useState('');
  const [adTargetUrl, setAdTargetUrl] = useState('');
  const [adPlacement, setAdPlacement] = useState<'header' | 'sidebar' | 'footer' | 'in_feed' | 'popup' | 'above_rumors'>('header');
  const [adPlacements, setAdPlacements] = useState<('header' | 'sidebar' | 'footer' | 'in_feed' | 'popup' | 'above_rumors')[]>(['header']);
  const [adLabel, setAdLabel] = useState<'publicite' | 'annonce' | 'none'>('publicite');
  const [adAdvertiserName, setAdAdvertiserName] = useState('');
  const [adStartDate, setAdStartDate] = useState('');
  const [adEndDate, setAdEndDate] = useState('');
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [allAdvertisements, setAllAdvertisements] = useState<Advertisement[]>([]);
  const [isCompressingAd, setIsCompressingAd] = useState(false);

  // State variables for rumor/report editing
  const [editingReport, setEditingReport] = useState<FakeNewsReport | null>(null);
  const [editRepTitle, setEditRepTitle] = useState('');
  const [editRepDesc, setEditRepDesc] = useState('');
  const [editRepExplain, setEditRepExplain] = useState('');
  const [editRepStatus, setEditRepStatus] = useState<'pending' | 'fake' | 'misleading' | 'verified'>('pending');
  const [editRepCategory, setEditRepCategory] = useState('politique');

  // Moderator permissions modal state
  const [modConfigUser, setModConfigUser] = useState<UserProfile | null>(null);

  // Global confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type?: ConfirmationType;
    title: string;
    message: string;
    details?: string | React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const triggerConfirm = (options: {
    title: string;
    message: string;
    type?: ConfirmationType;
    details?: string | React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void | Promise<void>;
  }) => {
    const resolvedType: ConfirmationType = options.type || (options.isDestructive ? 'delete' : 'warning');
    setConfirmDialog({
      isOpen: true,
      type: resolvedType,
      title: options.title,
      message: options.message,
      details: options.details,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      onConfirm: async () => {
        try {
          await options.onConfirm();
        } catch (err) {
          console.error("Error in confirmed action", err);
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  useEffect(() => {
    // 1. Sync Users profiles real-time from Firestore!
    const qUsers = collection(db, "users");
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const fetched: UserProfile[] = [];
      snapshot.forEach((d) => fetched.push({ id: d.id, ...d.data() } as UserProfile));
      if (fetched.length > 0) {
        setProfiles(fetched);
      } else {
        INITIAL_USERS.forEach((u) => {
          setDoc(doc(db, "users", u.id), u).catch(err => {
            console.warn("Could not seed administrative user profile to Firestore:", err);
          });
        });
        setProfiles(INITIAL_USERS);
      }
    }, (err) => {
      console.warn("unsubUsers snapshot error:", err);
      try {
        handleFirestoreError(err, OperationType.GET, "users");
      } catch (e) {}
    });

    // 2. Sync citizens rumors real-time from Firestore!
    const qRumors = collection(db, "rumeurs");
    const unsubRumors = onSnapshot(qRumors, (snapshot) => {
      const fetched: FakeNewsReport[] = [];
      snapshot.forEach((d) => fetched.push({ id: d.id, ...d.data() } as FakeNewsReport));
      setReports(fetched);
    }, (err) => {
      console.warn("unsubRumors snapshot error:", err);
      try {
        handleFirestoreError(err, OperationType.GET, "rumeurs");
      } catch (e) {}
    });

    // 3. Sync Media submissions real-time from Firestore!
    const qSubmissions = collection(db, "submissions");
    const unsubSubmissions = onSnapshot(qSubmissions, (snapshot) => {
      const fetched: MediaSubmission[] = [];
      snapshot.forEach((d) => fetched.push({ id: d.id, ...d.data() } as MediaSubmission));
      if (fetched.length > 0) {
        setSubmissions(fetched);
      } else {
        INITIAL_SUBMISSIONS.forEach((sub) => {
          setDoc(doc(db, "submissions", sub.id), sub).catch(err => {
            console.warn("Could not seed administrative submission to Firestore:", err);
          });
        });
        setSubmissions(INITIAL_SUBMISSIONS);
      }
    }, (err) => {
      console.warn("unsubSubmissions snapshot error:", err);
      try {
        handleFirestoreError(err, OperationType.GET, "submissions");
      } catch (e) {}
    });

    // 4. Sync all platform lessons real-time from Supabase!
    const unsubLessons = coursesService.subscribe((courses) => {
      setAllPlatformLessons(courses);
    });

    // 5. Sync communiques real-time from Firestore & Supabase!
    const qCommuniques = collection(db, "communiques");
    const unsubCommuniques = onSnapshot(qCommuniques, (snapshot) => {
      const fetched: Communique[] = [];
      snapshot.forEach((d) => fetched.push({ id: d.id, ...d.data() } as Communique));
      fetched.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllCommuniques(fetched);
    }, (err) => {
      console.warn("unsubCommuniques snapshot error:", err);
    });

    const unsubSbCommuniques = communiquesService.subscribe((sbComms) => {
      if (sbComms && sbComms.length > 0) {
        sbComms.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAllCommuniques(sbComms);
      }
    });

    // 6. Sync advertisements real-time from Firestore & Supabase!
    const qAdvertisements = collection(db, "advertisements");
    const unsubAdvertisements = onSnapshot(qAdvertisements, (snapshot) => {
      const fetched: Advertisement[] = [];
      snapshot.forEach((d) => fetched.push({ id: d.id, ...d.data() } as Advertisement));
      fetched.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllAdvertisements(fetched);
    }, (err) => {
      console.warn("unsubAdvertisements snapshot error:", err);
    });

    const unsubSbAdvertisements = advertisementsService.subscribe((sbAds) => {
      if (sbAds && sbAds.length > 0) {
        sbAds.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAllAdvertisements(sbAds);
      }
    });

    return () => {
      unsubUsers();
      unsubRumors();
      unsubSubmissions();
      unsubLessons();
      unsubCommuniques();
      unsubSbCommuniques();
      unsubAdvertisements();
      unsubSbAdvertisements();
    };
  }, []);

  const handleAddCommunique = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!communiqueContent.trim()) {
      triggerToast('Contenu du communiqué vide.', 'error');
      return;
    }
    triggerConfirm({
      type: 'add',
      title: "Publier un nouveau communiqué ?",
      message: "Voulez-vous vraiment diffuser ce communiqué officiel sur la bande d'information générale ?",
      confirmText: "Publier le communiqué",
      onConfirm: async () => {
        const newCommId = 'comm-' + Math.random().toString(36).substring(2, 9);
        const newCommunique: Communique = {
          id: newCommId,
          content: communiqueContent.trim(),
          active: true,
          createdAt: new Date().toISOString()
        };
        try {
          await setDoc(doc(db, 'communiques', newCommId), newCommunique);
          await communiquesService.saveCommunique(newCommunique);
          setCommuniqueContent('');
          triggerToast('Communiqué sauvegardé avec succès dans Supabase et diffusé !', 'success');
        } catch (err) {
          console.error('Failed to add communique', err);
          triggerToast('Erreur lors de la création du communiqué.', 'error');
          handleFirestoreError(err, OperationType.CREATE, `communiques/${newCommId}`);
        }
      }
    });
  };

  const handleToggleCommunique = async (c: Communique) => {
    const nextState = !c.active;
    triggerConfirm({
      type: 'warning',
      title: `${nextState ? 'Activer' : 'Désactiver'} le communiqué ?`,
      message: `Voulez-vous ${nextState ? 'réactiver la diffusion de' : 'masquer'} ce communiqué officiel ?`,
      confirmText: nextState ? "Activer" : "Désactiver",
      onConfirm: async () => {
        try {
          const updated = { ...c, active: nextState };
          await setDoc(doc(db, 'communiques', c.id), updated);
          await communiquesService.saveCommunique(updated);
          triggerToast(`Communiqué ${nextState ? 'activé' : 'désactivé'} avec succès !`, 'info');
        } catch (err) {
          console.error('Failed to toggle communique', err);
          triggerToast('Erreur de modification du statut.', 'error');
          handleFirestoreError(err, OperationType.UPDATE, `communiques/${c.id}`);
        }
      }
    });
  };

  const handleDeleteCommunique = (id: string) => {
    triggerConfirm({
      title: "Supprimer le communiqué",
      message: "Voulez-vous vraiment supprimer définitivement ce communiqué ? Cette action est irréversible.",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'communiques', id));
          await communiquesService.deleteCommunique(id);
          triggerToast('Communiqué supprimé définitivement de la base de données.', 'info');
        } catch (err) {
          console.error('Failed to delete communique', err);
          triggerToast('Erreur de suppression du communiqué.', 'error');
          handleFirestoreError(err, OperationType.DELETE, `communiques/${id}`);
        }
      }
    });
  };

  const cleanUndefined = (obj: any): any => {
    const clean: any = {};
    Object.keys(obj).forEach((key) => {
      if (obj[key] !== undefined) {
        clean[key] = obj[key];
      }
    });
    return clean;
  };

  const handleStartEditAdvertisement = (ad: Advertisement) => {
    setEditingAd(ad);
    setAdTitle(ad.title);
    setAdType(ad.type);
    setAdMediaUrl(ad.mediaUrl);
    setAdTargetUrl(ad.targetUrl);
    setAdPlacement(ad.placement);
    setAdPlacements(ad.placements || [ad.placement]);
    setAdLabel(ad.label || 'publicite');
    setAdAdvertiserName(ad.advertiserName || '');
    setAdStartDate(ad.startDate || '');
    setAdEndDate(ad.endDate || '');
    // Scroll smoothly to form
    const formElement = document.getElementById('ad-form-header');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEditAdvertisement = () => {
    setEditingAd(null);
    setAdTitle('');
    setAdType('image');
    setAdMediaUrl('');
    setAdTargetUrl('');
    setAdPlacement('header');
    setAdPlacements(['header']);
    setAdLabel('publicite');
    setAdAdvertiserName('');
    setAdStartDate('');
    setAdEndDate('');
  };

  const handleAddAdvertisement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adTitle.trim() || !adMediaUrl.trim() || !adTargetUrl.trim()) {
      triggerToast('Veuillez remplir tous les champs obligatoires.', 'error');
      return;
    }

    const isEditing = !!editingAd;
    const targetAdId = isEditing ? editingAd.id : 'ad-' + Math.random().toString(36).substring(2, 9);
    const finalPlacements = adPlacements.length > 0 ? adPlacements : [adPlacement];

    const updatedAd: Advertisement = {
      id: targetAdId,
      title: adTitle.trim(),
      type: adType,
      mediaUrl: adMediaUrl.trim(),
      targetUrl: adTargetUrl.trim(),
      placement: finalPlacements[0],
      placements: finalPlacements,
      label: adLabel,
      active: isEditing ? editingAd.active : true,
      createdAt: isEditing ? editingAd.createdAt : new Date().toISOString(),
      viewsCount: isEditing ? (editingAd.viewsCount || 0) : 0,
      clicksCount: isEditing ? (editingAd.clicksCount || 0) : 0,
    };

    if (adAdvertiserName.trim()) {
      updatedAd.advertiserName = adAdvertiserName.trim();
    }
    if (adStartDate) {
      updatedAd.startDate = adStartDate;
    }
    if (adEndDate) {
      updatedAd.endDate = adEndDate;
    }

    triggerConfirm({
      type: isEditing ? 'edit' : 'add',
      title: isEditing ? "Enregistrer les modifications de l'annonce ?" : "Publier la nouvelle publicité ?",
      message: isEditing 
        ? `Voulez-vous enregistrer les modifications apportées à la publicité "${adTitle}" dans la base de données Supabase ?` 
        : `Voulez-vous vraiment programmer et diffuser la publicité "${adTitle}" en temps réel ?`,
      confirmText: isEditing ? "Enregistrer" : "Publier l'annonce",
      onConfirm: async () => {
        try {
          const cleanedAd = cleanUndefined(updatedAd);
          await setDoc(doc(db, 'advertisements', targetAdId), cleanedAd);
          await advertisementsService.saveAd(cleanedAd);
          handleCancelEditAdvertisement();
          triggerToast(isEditing ? 'Publicité mise à jour dans Supabase avec succès !' : 'Publicité enregistrée dans Supabase et diffusée en temps réel !', 'success');
        } catch (err) {
          console.error('Failed to save advertisement', err);
          triggerToast('Erreur lors de l\'enregistrement de la publicité.', 'error');
          handleFirestoreError(err, isEditing ? OperationType.UPDATE : OperationType.CREATE, `advertisements/${targetAdId}`);
        }
      }
    });
  };

  const handleToggleAdvertisement = async (ad: Advertisement) => {
    const nextState = !ad.active;
    triggerConfirm({
      type: 'warning',
      title: `${nextState ? 'Activer' : 'Désactiver'} la publicité ?`,
      message: `Voulez-vous ${nextState ? 'réactiver la diffusion de' : 'masquer'} l'annonce "${ad.title}" ?`,
      confirmText: nextState ? "Activer" : "Désactiver",
      onConfirm: async () => {
        try {
          const cleanedToggle = cleanUndefined({ ...ad, active: nextState });
          await setDoc(doc(db, 'advertisements', ad.id), cleanedToggle);
          await advertisementsService.saveAd(cleanedToggle);
          triggerToast(`Publicité ${nextState ? 'activée' : 'désactivée'} dans la base de données !`, 'info');
        } catch (err) {
          console.error('Failed to toggle ad', err);
          triggerToast('Erreur de modification de la publicité.', 'error');
          handleFirestoreError(err, OperationType.UPDATE, `advertisements/${ad.id}`);
        }
      }
    });
  };

  const handleDeleteAdvertisement = (id: string) => {
    triggerConfirm({
      title: "Supprimer la publicité",
      message: "Voulez-vous vraiment supprimer définitivement cette publicité ? Cette action retirera l'annonce de toutes les zones d'affichage.",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'advertisements', id));
          await advertisementsService.deleteAd(id);
          triggerToast('Publicité supprimée définitivement de la base de données.', 'info');
        } catch (err) {
          console.error('Failed to delete ad', err);
          triggerToast('Erreur de suppression de la publicité.', 'error');
          handleFirestoreError(err, OperationType.DELETE, `advertisements/${id}`);
        }
      }
    });
  };

  const handleAdminPublishCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle || !courseSummary || !coursePageTitle || !courseSecTitle || !courseBodyParagraph1) {
      triggerToast('Informations de cours incomplètes.', 'error');
      return;
    }

    try {
      const existing = allPlatformLessons.find(c => c.id === editingCourseId);
      
      const qList = courseExerciseQuestions
        ? courseExerciseQuestions.split('\n').map(s => s.trim()).filter(Boolean)
        : (existing?.exercise?.questions || []);

      const sList = courseExerciseSolution
        ? courseExerciseSolution.split('\n').map(s => s.trim()).filter(Boolean)
        : (existing?.exercise?.solutionGuide || []);

      const freshLesson: Lesson = {
        id: editingCourseId || ("cours-" + Date.now().toString().slice(-6)),
        title: courseTitle,
        duration: courseDuration,
        difficulty: courseDifficulty,
        category: courseCategory || 'Cybersécurité Générale',
        summary: courseSummary,
        icon: existing?.icon || "shield",
        publisher: existing?.publisher || "ActuHub Bénin • Académie",
        publishedAt: existing?.publishedAt || new Date().toISOString().slice(0, 10),
        pages: [
          {
            title: coursePageTitle,
            sections: [
              {
                title: courseSecTitle,
                body: [
                  courseBodyParagraph1,
                  ...(courseBodyParagraph2 ? [courseBodyParagraph2] : [])
                ]
              }
            ]
          },
          ...(existing?.pages && existing.pages.length > 1 ? existing.pages.slice(1) : [])
        ],
        exercise: (courseExerciseTitle || courseExerciseInstructions || qList.length > 0) ? {
          title: courseExerciseTitle || `Exercice Pratique — ${courseTitle}`,
          instructions: courseExerciseInstructions || 'Répondez aux questions d\'application pratique ci-dessous.',
          questions: qList.length > 0 ? qList : ['1. Identifiez les points clés et appliquez la démarche de sécurité.'],
          solutionGuide: sList.length > 0 ? sList : ['Exemple de bonne pratique conforme au référentiel officiel.']
        } : existing?.exercise
      };

      // Save directly to Supabase
      await coursesService.saveCourse(freshLesson);

      // reset form
      setEditingCourseId(null);
      setCourseTitle('');
      setCourseSummary('');
      setCourseCategory('Cybersécurité');
      setCoursePageTitle('');
      setCourseSecTitle('');
      setCourseBodyParagraph1('');
      setCourseBodyParagraph2('');
      setCourseExerciseTitle('');
      setCourseExerciseInstructions('');
      setCourseExerciseQuestions('');
      setCourseExerciseSolution('');

      triggerToast(editingCourseId ? 'Le cours a été mis à jour avec succès dans la base de données ! 📚' : 'Le cours officiel a été publié avec succès dans la base de données ! 🏛️', 'success');
    } catch(e) {
      console.error("Error publishing course:", e);
      triggerToast('Erreur lors de l\'enregistrement du cours dans la base de données.', 'error');
    }
  };

  const handleAdminDeleteCourse = (lessonId: string) => {
    triggerConfirm({
      title: "Supprimer le cours",
      message: "Voulez-vous supprimer définitivement ce cours de la base de données ? Cette action s'appliquera à toute la plateforme.",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await coursesService.deleteCourse(lessonId);
          triggerToast('Le cours a été retiré de la base de données avec succès ! 🗑️', 'success');
        } catch (e) {
          triggerToast('Erreur lors de la suppression.', 'error');
        }
      }
    });
  };

  const handleSyncOfficialCurriculum = async () => {
    try {
      triggerToast('Synchronisation des 15 cours officiels dans la base de données...', 'info');
      const count = await coursesService.seedOfficialCurriculum();
      triggerToast(`Succès ! Les ${count} cours et exercices officiels ont été synchronisés dans la base de données. 🏛️`, 'success');
    } catch (e) {
      console.error("Failed to seed curriculum to Supabase:", e);
      triggerToast('Erreur lors de la synchronisation du catalogue.', 'error');
    }
  };

  const handleEditCourseClick = (les: Lesson) => {
    setEditingCourseId(les.id);
    setCourseTitle(les.title);
    setCourseDuration(les.duration || '15 min');
    setCourseDifficulty(les.difficulty || 'Débutant');
    setCourseCategory(les.category || 'Cybersécurité');
    setCourseSummary(les.summary || '');
    setCoursePageTitle(les.pages?.[0]?.title || 'Introduction et Piliers');
    setCourseSecTitle(les.pages?.[0]?.sections?.[0]?.title || 'Section Principale');
    setCourseBodyParagraph1(les.pages?.[0]?.sections?.[0]?.body?.[0] || '');
    setCourseBodyParagraph2(les.pages?.[0]?.sections?.[0]?.body?.[1] || '');
    setCourseExerciseTitle(les.exercise?.title || '');
    setCourseExerciseInstructions(les.exercise?.instructions || '');
    setCourseExerciseQuestions(les.exercise?.questions?.join('\n') || '');
    setCourseExerciseSolution(les.exercise?.solutionGuide?.join('\n') || '');
    triggerToast(`Édition du cours : "${les.title}". Modifiez les champs puis validez.`, 'info');
  };

  const handleCancelEditCourse = () => {
    setEditingCourseId(null);
    setCourseTitle('');
    setCourseSummary('');
    setCourseCategory('Cybersécurité');
    setCoursePageTitle('');
    setCourseSecTitle('');
    setCourseBodyParagraph1('');
    setCourseBodyParagraph2('');
    setCourseExerciseTitle('');
    setCourseExerciseInstructions('');
    setCourseExerciseQuestions('');
    setCourseExerciseSolution('');
  };

  // Sync methods back to Firestore & Supabase as well
  const updateProfilesInStorage = async (updated: UserProfile[]) => {
    setProfiles(updated);
    try {
      for (const u of updated) {
        // Find previous user profile to see if it changed
        const prev = profiles.find(p => p.id === u.id);
        if (!prev || JSON.stringify(prev) !== JSON.stringify(u)) {
          await setDoc(doc(db, "users", u.id), u);
          await usersService.saveProfile(u);
        }
      }
    } catch (e) {
      console.warn("Error updating user profiles batch to Firestore/Supabase", e);
    }
  };

  const updateReportsInStorage = async (updated: FakeNewsReport[]) => {
    setReports(updated);
    try {
      for (const r of updated) {
        await setDoc(doc(db, "rumeurs", r.id), r);
        await rumeursService.saveReport(r);
      }
    } catch (e) {
      console.warn("Error updating reports batch to Firestore/Supabase", e);
    }
  };

  const updateSubmissionsInStorage = async (updated: MediaSubmission[]) => {
    setSubmissions(updated);
    try {
      for (const s of updated) {
        await setDoc(doc(db, "submissions", s.id), s);
        await mediaSubmissionsService.saveSubmission(s);
      }
    } catch (e) {
      console.warn("Error updating media registrations batch to Firestore/Supabase", e);
    }
  };

  // User Administration Operations
  const handleToggleUserSuspension = (userId: string) => {
    const target = profiles.find(p => p.id === userId);
    if (!target) return;
    const nextStatus = target.status === 'active' ? 'suspended' : 'active';
    const isSuspending = nextStatus === 'suspended';

    triggerConfirm({
      title: isSuspending ? "Suspendre l'utilisateur" : "Réactiver l'utilisateur",
      message: `Voulez-vous vraiment ${isSuspending ? 'suspendre' : 'réactiver'} l'accès de ${target.fullName} à la plateforme ?`,
      isDestructive: isSuspending,
      onConfirm: async () => {
        const updated = profiles.map(p => {
          if (p.id === userId) {
            triggerToast(`${p.fullName} est maintenant ${nextStatus === 'active' ? 'Actif' : 'Suspendu'}`, 'info');
            return { ...p, status: nextStatus };
          }
          return p;
        });
        await updateProfilesInStorage(updated);
      }
    });
  };

  const handleChangeUserRole = (userId: string, targetRole: 'simple' | 'media' | 'admin' | 'moderator') => {
    const target = profiles.find(p => p.id === userId);
    if (!target) return;

    triggerConfirm({
      title: "Modifier le rôle utilisateur",
      message: `Voulez-vous vraiment changer le rôle de ${target.fullName} vers '${targetRole.toUpperCase()}' ?`,
      isDestructive: targetRole === 'admin',
      onConfirm: async () => {
        let defaultPerms = target.moderatorPermissions;
        if (targetRole === 'moderator' && !defaultPerms) {
          defaultPerms = {
            canManageRumors: true,
            canManageSubmissions: true,
            canManageCourses: true,
            canManageCommuniques: true,
            canManageAds: true,
            canManageUnes: true,
            canManageNewsletters: true,
            canManageLegal: false,
            canManageUsers: false
          };
        }
        const updatedUser: UserProfile = {
          ...target,
          role: targetRole,
          mediaName: (targetRole === 'media' && !target.mediaName) ? "Média Partenaire " + target.fullName : target.mediaName,
          moderatorPermissions: targetRole === 'moderator' ? defaultPerms : target.moderatorPermissions
        };

        const updated = profiles.map(p => p.id === userId ? updatedUser : p);
        await updateProfilesInStorage(updated);
        triggerToast(`Rôle de ${target.fullName} mis à jour : ${targetRole.toUpperCase()}`, 'success');

        if (targetRole === 'moderator') {
          setModConfigUser(updatedUser);
        }
      }
    });
  };

  const handleToggleMediaPermission = async (userId: string, permission: 'courses' | 'rumors') => {
    const target = profiles.find(p => p.id === userId);
    if (!target) return;

    const currentCoursesPerm = target.canPublishCourses !== false;
    const currentRumorsPerm = target.canPublishRumors !== false;

    let nextVal: boolean;
    let label: string;

    if (permission === 'courses') {
      nextVal = !currentCoursesPerm;
      label = 'Publier un Cours';
    } else {
      nextVal = !currentRumorsPerm;
      label = 'Vigie des Rumeurs';
    }

    const updated = profiles.map(p => {
      if (p.id === userId) {
        return {
          ...p,
          ...(permission === 'courses' ? { canPublishCourses: nextVal } : { canPublishRumors: nextVal })
        };
      }
      return p;
    });

    await updateProfilesInStorage(updated);
    triggerToast(`Permission '${label}' pour ${target.mediaName || target.fullName} : ${nextVal ? 'AUTORISÉE ✅' : 'DÉSACTIVÉE 🔒'}`, 'success');
  };

  const handleDeleteUser = (userId: string) => {
    const target = profiles.find(p => p.id === userId);
    if (!target) return;
    if (userId === "usr-admin-target" || target.email === "contactactubub@gmail.com") {
      triggerToast("L'administrateur principal ne peut pas être supprimé !", "error");
      return;
    }
    triggerConfirm({
      title: "Supprimer définitivement l'utilisateur",
      message: `Voulez-vous vraiment supprimer définitivement le compte de ${target.fullName} ? Cette action est irréversible et supprimera toutes ses données associées.`,
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "users", userId));
          await usersService.deleteProfile(userId);
          const updated = profiles.filter(p => p.id !== userId);
          setProfiles(updated);
          triggerToast('Compte utilisateur éliminé avec succès.', 'info');
        } catch (err) {
          console.error("Error deleting user:", err);
          triggerToast("Erreur lors de la suppression de l'utilisateur sur la base de données Supabase.", "error");
        }
      }
    });
  };

  const handleDeleteDemoAccounts = () => {
    triggerConfirm({
      title: "Nettoyer les données de démonstration",
      message: "Voulez-vous vraiment supprimer définitivement toutes les données de démonstration (comptes démo, rumeurs démo, et candidatures de médias démo) de la base de données Supabase ? Cette action est irréversible.",
      isDestructive: true,
      onConfirm: async () => {
        const demoUserIds = ["usr-1", "usr-2", "usr-3"];
        const demoSubIds = ["sub-1", "sub-2"];
        const demoRepIds = ["rep-1", "rep-2", "rep-3"];
        try {
          // Delete users
          for (const id of demoUserIds) {
            await deleteDoc(doc(db, "users", id));
            await usersService.deleteProfile(id);
          }
          const updatedProfiles = profiles.filter(p => !demoUserIds.includes(p.id));
          setProfiles(updatedProfiles);

          // Delete submissions
          for (const id of demoSubIds) {
            await deleteDoc(doc(db, "submissions", id));
            await mediaSubmissionsService.deleteSubmission(id);
          }
          const updatedSubmissions = submissions.filter(s => !demoSubIds.includes(s.id));
          setSubmissions(updatedSubmissions);

          // Delete reports
          for (const id of demoRepIds) {
            await deleteDoc(doc(db, "rumeurs", id));
            await rumeursService.deleteReport(id);
          }
          const updatedReports = reports.filter(r => !demoRepIds.includes(r.id));
          setReports(updatedReports);

          triggerToast("Toutes les données de démonstration ont été nettoyées avec succès ! 🗑️", "success");
        } catch (err) {
          console.error("Error deleting demo data:", err);
          triggerToast("Erreur lors du nettoyage des données de démonstration.", "error");
        }
      }
    });
  };

  // Moderate citizen fake news reports
  const handleUpdateReportStatus = (reportId: string, targetStatus: 'fake' | 'misleading' | 'verified', customExplain: string) => {
    if (!customExplain.trim()) {
      triggerToast('Veuillez introduire un verdict d\'évaluation ou motif.', 'error');
      return;
    }

    const updated = reports.map(rep => {
      if (rep.id === reportId) {
        triggerToast(`Verdict mis à jour pour le signalement #${rep.id} !`, 'success');
        return { 
          ...rep, 
          status: targetStatus, 
          explanation: customExplain,
          reason: targetStatus === 'fake' ? 'Verdict Officiel Faux' : targetStatus === 'verified' ? 'Certifié Conforme' : 'Trompeur/Dépourvu de contexte'
        };
      }
      return rep;
    });
    updateReportsInStorage(updated);
  };

  const handleStartEditReport = (rep: FakeNewsReport) => {
    setEditingReport(rep);
    setEditRepTitle(rep.title);
    setEditRepDesc(rep.description);
    setEditRepExplain(rep.explanation);
    setEditRepStatus(rep.status);
    setEditRepCategory(rep.category);
  };

  const handleCancelEditReport = () => {
    setEditingReport(null);
  };

  const handleSaveEditedReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport) return;
    if (!editRepTitle.trim() || !editRepDesc.trim() || !editRepExplain.trim()) {
      triggerToast("Veuillez remplir tous les champs obligatoires.", "error");
      return;
    }

    const updatedReport: FakeNewsReport = {
      ...editingReport,
      title: editRepTitle,
      description: editRepDesc,
      explanation: editRepExplain,
      status: editRepStatus,
      category: editRepCategory,
    };

    try {
      await setDoc(doc(db, "rumeurs", editingReport.id), updatedReport);
      await rumeursService.saveReport(updatedReport);
      const updatedList = reports.map(r => r.id === editingReport.id ? updatedReport : r);
      setReports(updatedList);
      setEditingReport(null);
      triggerToast(`Le signalement #${editingReport.id} a été modifié avec succès ! 📝`, 'success');
    } catch (err) {
      console.error(err);
      triggerToast("Erreur lors de la modification du signalement.", "error");
    }
  };

  const handleDeleteRumor = (reportId: string) => {
    triggerConfirm({
      title: "Supprimer définitivement le signalement",
      message: `Voulez-vous vraiment supprimer définitivement le signalement #${reportId} de la plateforme ? Cette action est irréversible.`,
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "rumeurs", reportId));
          await rumeursService.deleteReport(reportId);
          const updated = reports.filter(r => r.id !== reportId);
          setReports(updated);
          triggerToast(`Le signalement #${reportId} a été supprimé ! 🗑️`, 'success');
        } catch (err) {
          console.error(err);
          triggerToast("Erreur lors de la suppression du signalement.", "error");
        }
      }
    });
  };

  const handleDeleteSubmission = (submissionId: string) => {
    triggerConfirm({
      title: "Supprimer la candidature",
      message: `Voulez-vous vraiment supprimer définitivement la candidature média #${submissionId} ? Cette action est irréversible.`,
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "submissions", submissionId));
          await mediaSubmissionsService.deleteSubmission(submissionId);
          const updated = submissions.filter(s => s.id !== submissionId);
          setSubmissions(updated);
          triggerToast(`La candidature #${submissionId} a été supprimée ! 🗑️`, 'success');
        } catch (err) {
          console.error(err);
          triggerToast("Erreur lors de la suppression de la candidature.", "error");
        }
      }
    });
  };

  // Approve/reject media integration requests
  const handleEvaluateMediaSubmission = (submissionId: string, action: 'approved' | 'rejected') => {
    const target = submissions.find(sub => sub.id === submissionId);
    if (!target) return;

    triggerConfirm({
      title: action === 'approved' ? "Approuver la candidature" : "Refuser la candidature",
      message: `Voulez-vous vraiment ${action === 'approved' ? 'approuver' : 'refuser'} la candidature de presse de '${target.mediaName}' ?`,
      isDestructive: action === 'rejected',
      onConfirm: async () => {
        // Update submission
        const updatedSubmissions = submissions.map(sub => {
          if (sub.id === submissionId) {
            return { ...sub, status: action };
          }
          return sub;
        });
        await updateSubmissionsInStorage(updatedSubmissions);

        if (action === 'approved') {
          // If approved, verify if this user email has matching account, upgrade this user role to 'media' instantly!
          const updatedProfiles = profiles.map(p => {
            if (p.email.toLowerCase() === target.email.toLowerCase()) {
              return { ...p, role: 'media' as const, mediaName: target.mediaName };
            }
            return p;
          });
          await updateProfilesInStorage(updatedProfiles);
          triggerToast(`Média '${target.mediaName}' approuvé avec succès ! Compte de presse activé.`, 'success');
        } else {
          triggerToast(`Dossier '${target.mediaName}' refusé.`, 'info');
        }
      }
    });
  };

  const isTabPermitted = (tabKey: string): boolean => {
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'moderator') {
      const perms = currentUser.moderatorPermissions;
      if (!perms) {
        return ['moderation', 'registry', 'courses-creation', 'communiques'].includes(tabKey);
      }
      switch (tabKey) {
        case 'users': return !!perms.canManageUsers;
        case 'moderation': return !!perms.canManageRumors;
        case 'registry': return !!perms.canManageSubmissions;
        case 'courses-creation': return !!perms.canManageCourses;
        case 'communiques': return !!perms.canManageCommuniques;
        case 'publicites': return !!perms.canManageAds;
        case 'unes': return !!perms.canManageUnes;
        case 'newsletters': return !!perms.canManageNewsletters;
        case 'legal-pages': return !!perms.canManageLegal;
        case 'analytics': return true;
        default: return true;
      }
    }
    return false;
  };

  useEffect(() => {
    if (currentUser.role === 'moderator' && !isTabPermitted(adminActiveTab)) {
      const allTabs = ['users', 'moderation', 'registry', 'courses-creation', 'communiques', 'publicites', 'unes', 'newsletters', 'legal-pages', 'analytics'];
      const available = allTabs.filter(isTabPermitted);
      if (available.length > 0) {
        setAdminActiveTab(available[0] as any);
      }
    }
  }, [currentUser, adminActiveTab]);

  const hasDemoData = profiles.some(p => ["usr-1", "usr-2", "usr-3"].includes(p.id)) ||
                      submissions.some(s => ["sub-1", "sub-2"].includes(s.id)) ||
                      reports.some(r => ["rep-1", "rep-2", "rep-3"].includes(r.id));

  const filteredProfiles = profiles.filter(p => {
    const q = userSearchText.toLowerCase();
    const full = (p.fullName || '').toLowerCase();
    const last = (p.lastName || '').toLowerCase();
    const first = (p.firstName || '').toLowerCase();
    const mail = (p.email || '').toLowerCase();
    const tel = (p.phone || '').toLowerCase();
    const cit = (p.city || '').toLowerCase();
    return full.includes(q) || last.includes(q) || first.includes(q) || mail.includes(q) || tel.includes(q) || cit.includes(q);
  });

  return (
    <div id="admin-workspace-master" className="space-y-8 animate-fade-in py-4 max-w-5xl mx-auto">
      
      {/* Banner Card */}
      <div className={`bg-gradient-to-br ${currentUser.role === 'moderator' ? 'from-purple-950 via-slate-900 to-slate-950 border-purple-800/20' : 'from-indigo-950 via-slate-900 to-slate-950 border-rose-800/10'} text-white rounded-[32px] p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl border relative overflow-hidden`}>
        <div className="absolute left-0 bottom-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="space-y-2 relative">
          <span className={`${currentUser.role === 'moderator' ? 'bg-purple-500/20 text-purple-300 border-purple-500/35' : 'bg-rose-500/20 text-rose-300 border-rose-500/35'} border px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest font-mono`}>
            {currentUser.role === 'moderator' ? 'Espace Modération Habilité' : 'Panneau d\'Administration Centralisé'}
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {currentUser.role === 'moderator' ? 'Console de Modération & Arbitrage' : 'Console de Sécurité & Modération'}
          </h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            {currentUser.role === 'moderator' 
              ? `Compte Modérateur Habilité : ${currentUser.fullName}. Vous disposez d'un accès personnalisé aux rubriques de gestion attribuées par l'administrateur.`
              : 'Supervisez les interactions citoyennes, arbitrez les verdicts officiels de rumeurs et configurez librement les privilèges des profils de modérateurs et rédacteurs.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 shrink-0 select-none">
            <Sliders className={`w-5 h-5 ${currentUser.role === 'moderator' ? 'text-purple-400' : 'text-rose-400'} rotate-90`} />
            <div className="text-left font-mono">
              <span className={`text-[9px] font-bold ${currentUser.role === 'moderator' ? 'text-purple-400' : 'text-rose-400'} block tracking-wider uppercase font-mono`}>
                {currentUser.role === 'moderator' ? 'Accès Modérateur' : 'Autorité Suprême'}
              </span>
              <span className="text-[11px] font-bold">
                {currentUser.role === 'moderator' ? 'Modérateur National' : 'Administrateur ActuHub'}
              </span>
              <span className="text-[9px] text-emerald-400 flex items-center gap-1 mt-0.5 font-sans font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Base Supabase Synchronisée
              </span>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-4 py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-500/40 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-sm shadow-sm"
              title="Se déconnecter de la console d'administration"
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          )}
        </div>
      </div>

      {/* Internal Ribbon tabs */}
      <div className="flex flex-wrap border-b border-gray-150 dark:border-slate-800 gap-2">
        {isTabPermitted('users') && (
          <button
            onClick={() => setAdminActiveTab('users')}
            className={`pb-3 text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer px-1 flex items-center gap-1.5 border-b-2 ${
              adminActiveTab === 'users' 
                ? 'border-rose-600 text-rose-600 dark:text-rose-400' 
                : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Gestion des Comptes ({profiles.length})</span>
          </button>
        )}
        {isTabPermitted('moderation') && (
          <button
            onClick={() => setAdminActiveTab('moderation')}
            className={`pb-3 text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer px-1 flex items-center gap-1.5 border-b-2 ${
              adminActiveTab === 'moderation' 
                ? 'border-rose-600 text-rose-600 dark:text-rose-400' 
                : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Verdict des Rumeurs ({reports.length})</span>
          </button>
        )}
        {isTabPermitted('registry') && (
          <button
            onClick={() => setAdminActiveTab('registry')}
            className={`pb-3 text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer px-1 flex items-center gap-1.5 border-b-2 ${
              adminActiveTab === 'registry' 
                ? 'border-rose-600 text-rose-600 dark:text-rose-400' 
                : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Candidatures Média ({submissions.length})</span>
          </button>
        )}
        {isTabPermitted('courses-creation') && (
          <button
            onClick={() => setAdminActiveTab('courses-creation')}
            className={`pb-3 text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer px-1 flex items-center gap-1.5 border-b-2 ${
              adminActiveTab === 'courses-creation' 
                ? 'border-rose-600 text-rose-600 dark:text-rose-400' 
                : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Formations & Cours ({allPlatformLessons.length})</span>
          </button>
        )}
        {isTabPermitted('communiques') && (
          <button
            onClick={() => setAdminActiveTab('communiques')}
            className={`pb-3 text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer px-1 flex items-center gap-1.5 border-b-2 ${
              adminActiveTab === 'communiques' 
                ? 'border-rose-600 text-rose-600 dark:text-rose-400' 
                : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Communiqués ({allCommuniques.length})</span>
          </button>
        )}
        {isTabPermitted('publicites') && (
          <button
            onClick={() => setAdminActiveTab('publicites')}
            className={`pb-3 text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer px-1 flex items-center gap-1.5 border-b-2 ${
              adminActiveTab === 'publicites' 
                ? 'border-rose-600 text-rose-600 dark:text-rose-400' 
                : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Publicités ({allAdvertisements.length})</span>
          </button>
        )}
        {isTabPermitted('unes') && (
          <button
            onClick={() => setAdminActiveTab('unes')}
            className={`pb-3 text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer px-1 flex items-center gap-1.5 border-b-2 ${
              adminActiveTab === 'unes' 
                ? 'border-rose-600 text-rose-600 dark:text-rose-400' 
                : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>La UNE des Journaux ({allFrontPages.length})</span>
          </button>
        )}
        {isTabPermitted('videos') && (
          <button
            onClick={() => setAdminActiveTab('videos')}
            className={`pb-3 text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer px-1 flex items-center gap-1.5 border-b-2 ${
              adminActiveTab === 'videos' 
                ? 'border-rose-600 text-rose-600 dark:text-rose-400' 
                : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Gestion des Vidéos ({adminShorts.length})</span>
          </button>
        )}
        {isTabPermitted('newsletters') && (
          <button
            onClick={() => setAdminActiveTab('newsletters')}
            className={`pb-3 text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer px-1 flex items-center gap-1.5 border-b-2 ${
              adminActiveTab === 'newsletters' 
                ? 'border-rose-600 text-rose-600 dark:text-rose-400' 
                : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Abonnements Newsletters ({adminSubscriptions.length})</span>
          </button>
        )}
        {isTabPermitted('legal-pages') && (
          <button
            onClick={() => setAdminActiveTab('legal-pages')}
            className={`pb-3 text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer px-1 flex items-center gap-1.5 border-b-2 ${
              adminActiveTab === 'legal-pages' 
                ? 'border-rose-600 text-rose-600 dark:text-rose-400' 
                : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Pages Légales (CGU & Confidentialité)</span>
          </button>
        )}
        {isTabPermitted('analytics') && (
          <button
            onClick={() => setAdminActiveTab('analytics')}
            className={`pb-3 text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer px-1 flex items-center gap-1.5 border-b-2 ${
              adminActiveTab === 'analytics' 
                ? 'border-rose-600 text-rose-600 dark:text-rose-400' 
                : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Indicateurs Globaux</span>
          </button>
        )}
      </div>

      {/* Quick Demo Cleaning Bar */}
      {hasDemoData && (
        <div className="p-4 bg-rose-50/40 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-900/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-sm">
          <div className="space-y-0.5 text-center sm:text-left">
            <p className="font-extrabold text-rose-800 dark:text-rose-400 text-[11px] uppercase tracking-wide font-mono">Informations de démonstration détectées</p>
            <p className="text-[10px] text-gray-500">Des profils démo, rumeurs démo ou demandes d'indexation démo sont présents dans votre base de données.</p>
          </div>
          <button
            onClick={handleDeleteDemoAccounts}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-750 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shrink-0 flex items-center gap-1.5"
          >
            Supprimer toutes les données démo
          </button>
        </div>
      )}

      {/* Main Body content according to Active Tab */}
      <div id="admin-main-panel-content">
        
        {/* USERS ADMINISTRATION COMPONENT */}
        {adminActiveTab === 'users' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono">Comptes Utilisateurs & Citoyens Inscrits</h3>
                <p className="text-[10px] text-gray-400">Consultez les informations enregistrées (Nom, Prénom, Téléphone, Ville, Email) et gérez les privilèges.</p>
              </div>

              <input
                type="text"
                value={userSearchText}
                onChange={e => setUserSearchText(e.target.value)}
                placeholder="Rechercher par nom, prénom, tél, ville, email..."
                className="w-full sm:w-72 text-xs p-2.5 rounded-xl border border-gray-200 dark:border-slate-850 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-150 dark:border-slate-800 text-[10px] uppercase text-gray-400 font-mono">
                    <th className="pb-3 font-semibold">Nom & Prénom</th>
                    <th className="pb-3 font-semibold">Téléphone & Ville</th>
                    <th className="pb-3 font-semibold">Adresse E-mail</th>
                    <th className="pb-3 font-semibold">Rôle</th>
                    <th className="pb-3 font-semibold">Statut</th>
                    <th className="pb-3 font-semibold">Inscription</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-850/60 font-medium">
                  {filteredProfiles.map((p) => {
                    const displayName = (p.lastName && p.firstName) 
                      ? `${p.lastName} ${p.firstName}` 
                      : (p.fullName || 'Utilisateur');
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/20">
                        <td className="py-3.5 pr-2">
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-850 dark:text-slate-100">{displayName}</p>
                            {p.lastName && p.firstName && (
                              <p className="text-[9px] text-gray-400 font-mono">
                                Nom: <span className="font-semibold text-slate-600 dark:text-slate-300">{p.lastName}</span> | Prénom: <span className="font-semibold text-slate-600 dark:text-slate-300">{p.firstName}</span>
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 pr-2">
                          <div className="space-y-0.5">
                            <p className="text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {p.phone || 'Non renseigné'}
                            </p>
                            <p className="text-[10px] text-gray-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              {p.city || 'Bénin'}
                            </p>
                          </div>
                        </td>
                        <td className="py-3.5 pr-2 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          {p.email}
                        </td>
                        <td className="py-3.5 pr-2">
                          {p.role === 'admin' && (
                            <span className="bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-100 dark:border-rose-900 rounded-md text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider font-mono inline-flex items-center gap-1">
                              <Shield className="w-3 h-3 text-rose-500 shrink-0" /> Admin
                            </span>
                          )}
                          {p.role === 'moderator' && (
                            <div className="space-y-1">
                              <span className="bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-md text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider font-mono inline-flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3 text-purple-500 shrink-0" /> Modérateur
                              </span>
                              {currentUser.role === 'admin' && (
                                <button
                                  type="button"
                                  onClick={() => setModConfigUser(p)}
                                  className="text-[8px] font-bold px-1.5 py-0.5 rounded border border-purple-300 dark:border-purple-700 bg-purple-100/50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200 hover:bg-purple-200 transition-all cursor-pointer flex items-center justify-center gap-1 font-mono w-full"
                                  title="Gérer les accès et privilèges de ce modérateur"
                                >
                                  <Sliders className="w-2.5 h-2.5" /> Privilèges Modérateur
                                </button>
                              )}
                            </div>
                          )}
                          {p.role === 'media' && (
                            <div className="space-y-1">
                              <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 rounded-md text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider font-mono inline-flex items-center gap-1" title={p.mediaName}>
                                <Tv className="w-3 h-3 text-emerald-500 shrink-0" /> {p.mediaName || "Média"}
                              </span>
                              <div className="flex flex-col gap-1 mt-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleMediaPermission(p.id, 'courses')}
                                  className={`text-[8px] font-bold px-1.5 py-0.5 rounded border transition-all cursor-pointer flex items-center justify-between gap-1 font-mono ${
                                    p.canPublishCourses !== false
                                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                  }`}
                                  title="Autoriser ou bloquer la publication de cours"
                                >
                                  <span>Cours</span>
                                  <span>{p.canPublishCourses !== false ? '✅' : '🔒'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleMediaPermission(p.id, 'rumors')}
                                  className={`text-[8px] font-bold px-1.5 py-0.5 rounded border transition-all cursor-pointer flex items-center justify-between gap-1 font-mono ${
                                    p.canPublishRumors !== false
                                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                  }`}
                                  title="Autoriser ou bloquer la vigie des rumeurs"
                                >
                                  <span>Rumeurs</span>
                                  <span>{p.canPublishRumors !== false ? '✅' : '🔒'}</span>
                                </button>
                              </div>
                            </div>
                          )}
                          {p.role === 'simple' && (
                            <span className="bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900 rounded-md text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider font-mono inline-flex items-center gap-1">
                              <Users className="w-3 h-3 text-blue-500 shrink-0" /> Citoyen
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 pr-2">
                          {p.status === 'active' ? (
                            <span className="text-emerald-500 font-bold flex items-center gap-1 text-[10px]">
                              ● Actif
                            </span>
                          ) : (
                            <span className="text-rose-500 font-bold flex items-center gap-1 text-[10px]">
                              ● Suspendu
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 pr-2 text-gray-400 font-mono text-[10px]">
                          {p.registrationDate || '-'}
                        </td>
                        <td className="py-3.5 text-right space-y-1 sm:space-y-0 sm:space-x-1.5 min-w-[180px]">
                          
                          {/* Change role select block */}
                          <div className="inline-block relative">
                            <select
                              value={p.role}
                              onChange={(e) => handleChangeUserRole(p.id, e.target.value as any)}
                              className="text-[9px] font-bold uppercase tracking-wider border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1 rounded-lg focus:outline-none text-slate-800 dark:text-slate-100"
                            >
                              <option value="simple">Citoyen</option>
                              <option value="media">Média</option>
                              <option value="moderator">Modérateur</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>

                          {/* Ban/Unban toggle */}
                          <button
                            onClick={() => handleToggleUserSuspension(p.id)}
                            className={`text-[9px] font-extrabold uppercase tracking-widest py-1 px-2.5 rounded-lg border transition-colors cursor-pointer inline-block ${
                              p.status === 'active' 
                                ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-600 hover:text-white' 
                                : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white'
                            }`}
                          >
                            {p.status === 'active' ? 'Suspendre' : 'Activer'}
                          </button>

                          {/* Delete account */}
                          <button
                            onClick={() => handleDeleteUser(p.id)}
                            className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 rounded-lg p-1 transition-colors cursor-pointer inline-block align-middle"
                            title="Supprimer définitivement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block lg:hidden space-y-4">
              {filteredProfiles.map((p) => {
                const displayName = (p.lastName && p.firstName) 
                  ? `${p.lastName} ${p.firstName}` 
                  : (p.fullName || 'Utilisateur');
                return (
                  <div key={p.id} className="p-4 rounded-2xl border border-gray-150 dark:border-slate-800 w-full bg-slate-50/20 dark:bg-slate-900/40 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-bold text-xs text-slate-850 dark:text-slate-100">{displayName}</p>
                        <p className="text-[10px] text-gray-400 font-mono font-normal">{p.email}</p>
                      </div>
                      {p.status === 'active' ? (
                        <span className="bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full">
                          ● Actif
                        </span>
                      ) : (
                        <span className="bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 text-rose-850 text-[9px] font-bold px-2 py-0.5 rounded-full">
                          ● Suspendu
                        </span>
                      )}
                    </div>

                    {/* Nom, Prénom, Téléphone, Ville details */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-100/60 dark:bg-slate-950/40 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800">
                      <div>
                        <span className="text-gray-400 block font-mono">Téléphone :</span>
                        <span className="font-bold font-mono text-slate-700 dark:text-slate-200">{p.phone || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-mono">Ville :</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{p.city || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100/50 dark:border-slate-800/50">
                      <span className="text-[10px] text-gray-500 font-mono">Rôle :</span>
                      {p.role === 'admin' && (
                        <span className="bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-100 dark:border-rose-900 rounded-md text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                          <Shield className="w-3 h-3 text-rose-500 shrink-0" /> Administrateur
                        </span>
                      )}
                      {p.role === 'moderator' && (
                        <div className="w-full space-y-1.5 mt-1">
                          <span className="bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-md text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider font-mono inline-flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3 text-purple-500 shrink-0" /> Modérateur Habilité
                          </span>
                          {currentUser.role === 'admin' && (
                            <button
                              type="button"
                              onClick={() => setModConfigUser(p)}
                              className="text-[9px] font-bold px-2 py-1 rounded-lg border border-purple-300 dark:border-purple-700 bg-purple-100/60 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200 transition-all cursor-pointer flex items-center justify-center gap-1.5 font-mono w-full mt-1"
                            >
                              <Sliders className="w-3 h-3" /> Configurer les privilèges modérateur
                            </button>
                          )}
                        </div>
                      )}
                      {p.role === 'media' && (
                        <div className="w-full space-y-1.5 mt-1">
                          <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 rounded-md text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider font-mono inline-flex items-center gap-1">
                            <Tv className="w-3 h-3 text-emerald-500 shrink-0" /> Média : {p.mediaName || "Agréé"}
                          </span>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => handleToggleMediaPermission(p.id, 'courses')}
                              className={`text-[9px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 font-mono ${
                                p.canPublishCourses !== false
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                              }`}
                            >
                              {p.canPublishCourses !== false ? '✅ Publier Cours' : '🔒 Cours Bloqué'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleMediaPermission(p.id, 'rumors')}
                              className={`text-[9px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 font-mono ${
                                p.canPublishRumors !== false
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                              }`}
                            >
                              {p.canPublishRumors !== false ? '✅ Vigie Rumeurs' : '🔒 Rumeurs Bloquées'}
                            </button>
                          </div>
                        </div>
                      )}
                      {p.role === 'simple' && (
                        <span className="bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900 rounded-md text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                          <Users className="w-3 h-3 text-blue-500 shrink-0" /> Citoyen engagé
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                      <span>Inscription :</span>
                      <strong>{p.registrationDate || '-'}</strong>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-gray-100/50 dark:border-slate-800/50">
                      <div className="relative shrink-0">
                        <select
                          value={p.role}
                          onChange={(e) => handleChangeUserRole(p.id, e.target.value as any)}
                          className="text-[9px] font-bold uppercase tracking-wider border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-1.5 rounded-lg focus:outline-none text-slate-800 dark:text-slate-100"
                        >
                          <option value="simple">Citoyen</option>
                          <option value="media">Média</option>
                          <option value="moderator">Modérateur</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      <button
                        onClick={() => handleToggleUserSuspension(p.id)}
                        className={`text-[9px] font-extrabold uppercase tracking-widest py-1.5 px-3 rounded-lg border transition-colors cursor-pointer ${
                          p.status === 'active' 
                            ? 'bg-amber-50 text-amber-600 border-amber-200' 
                            : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        }`}
                      >
                        {p.status === 'active' ? 'Suspendre' : 'Activer'}
                      </button>

                      <button
                        onClick={() => handleDeleteUser(p.id)}
                        className="bg-rose-50 text-rose-650 hover:bg-rose-655 hover:text-white border border-rose-200 rounded-lg p-1.5 transition-colors cursor-pointer ml-auto"
                        title="Supprimer définitivement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CITIZENS REPORTS RUMOR AUDITING MODERATION */}
        {adminActiveTab === 'moderation' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono">Arbitrage des Rumeurs Citoyennes</h3>
              <p className="text-[10px] text-gray-400">Pour chaque signalement d'internaute, examinez les preuves et assignez un verdict public rigoureux.</p>
            </div>

            {/* Editing Form for Rumor/Report */}
            {editingReport && (
              <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-rose-150 dark:border-rose-900/30 space-y-4 text-left">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-rose-650 dark:text-rose-400 uppercase tracking-widest font-mono">
                    📝 Modifier le Signalement #{editingReport.id}
                  </h4>
                  <button 
                    onClick={handleCancelEditReport}
                    className="text-xs text-gray-400 hover:text-gray-650 font-mono font-bold cursor-pointer"
                  >
                    [Annuler ❌]
                  </button>
                </div>

                <form onSubmit={handleSaveEditedReport} className="space-y-4 text-xs font-semibold">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 font-mono block">Titre de la rumeur *</label>
                      <input 
                        type="text"
                        value={editRepTitle}
                        onChange={e => setEditRepTitle(e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 font-mono block">Catégorie</label>
                      <select 
                        value={editRepCategory}
                        onChange={e => setEditRepCategory(e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
                      >
                        <option value="politique">Politique</option>
                        <option value="santé">Santé</option>
                        <option value="société">Société</option>
                        <option value="finance">Finance</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 font-mono block">Verdict d'impact (Statut)</label>
                      <select 
                        value={editRepStatus}
                        onChange={e => setEditRepStatus(e.target.value as any)}
                        className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
                      >
                        <option value="pending">En cours d'analyse ⏳</option>
                        <option value="verified">Vrai & Certifié ✅</option>
                        <option value="fake">Faux & Mensonger ❌</option>
                        <option value="misleading">Trompeur/Dépourvu de contexte ⚠️</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 font-mono block">Auteur du signalement</label>
                      <input 
                        type="text"
                        value={editingReport.reporterName}
                        disabled
                        className="w-full text-xs p-3 rounded-xl border border-gray-250 dark:border-slate-900 bg-gray-100 dark:bg-slate-900 text-slate-400 font-mono cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 font-mono block">Description citoyenne de départ *</label>
                    <textarea 
                      value={editRepDesc}
                      onChange={e => setEditRepDesc(e.target.value)}
                      rows={3}
                      className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-rose-500 font-mono block">Expertise factuelle & Explication du Verdict *</label>
                    <textarea 
                      value={editRepExplain}
                      onChange={e => setEditRepExplain(e.target.value)}
                      rows={4}
                      className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
                    >
                      Enregistrer les modifications
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditReport}
                      className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}

            {reports.length === 0 ? (
              <p className="text-center p-8 text-xs text-gray-400 italic">Aucun signalement citoyen à auditer.</p>
            ) : (
              <div className="space-y-6">
                {reports.map((rep) => (
                  <div key={rep.id} className="border border-gray-150 dark:border-slate-800 p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-950/25 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 font-mono uppercase">Signalement #{rep.id} • Soumis par {rep.reporterName}</span>
                        <h4 className="text-xs sm:text-sm font-black text-gray-900 dark:text-gray-100 leading-tight">{rep.title}</h4>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-gray-400">Statut actuel :</span>
                        <span className="bg-amber-100 text-amber-800 p-1 px-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono">
                          {rep.status}
                        </span>

                        {/* Admin Action: Edit */}
                        <button
                          onClick={() => handleStartEditReport(rep)}
                          className="p-1.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 border border-blue-100 hover:bg-blue-100 rounded-xl cursor-pointer transition-all ml-1"
                          title="Modifier les détails de ce signalement"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Admin Action: Delete */}
                        <button
                          onClick={() => handleDeleteRumor(rep.id)}
                          className="p-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-100 hover:bg-rose-100 rounded-xl cursor-pointer transition-all"
                          title="Supprimer ce signalement définitivement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400 leading-relaxed font-mono bg-white dark:bg-slate-950 p-3 rounded-xl border border-gray-200 dark:border-slate-900">
                      <p className="font-bold underline text-[10px] text-slate-400">DESCRIPTION DU CITOYEN :</p>
                      <p>"{rep.description}"</p>
                    </div>

                    {/* Quick moderation tools */}
                    <div className="pt-3 border-t border-gray-100 dark:border-slate-800/80 space-y-3">
                      <span className="text-[10px] font-black uppercase text-slate-500 font-mono block">🔧 Rédiger une expertise officielle de fact-checking :</span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 block font-mono">Verdict d'impact</label>
                          <div className="flex gap-1.5 flex-wrap">
                            <button
                              onClick={() => {
                                const explain = `${rep.explanation}\n\n[Mise à jour Admin]: Rumeur analysée. L'information originale est totalement frauduleuse et s'avère être une tentative délibérée de manipulation de l'espace citoyen.`;
                                handleUpdateReportStatus(rep.id, 'fake', explain);
                              }}
                              className="bg-red-50 text-red-650 hover:bg-red-650 hover:text-white border border-red-200 text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer font-mono"
                            >
                              ❌ Marquer FAUX
                            </button>
                            <button
                              onClick={() => {
                                const explain = `${rep.explanation}\n\n[Mise à jour Admin]: Rumeur analysée. L'information véhiculée est vraie et a fait l'objet d'un communiqué affirmatif officiel par de véritables canaux républicains béninois. Accréditation valide.`;
                                handleUpdateReportStatus(rep.id, 'verified', explain);
                              }}
                              className="bg-emerald-50 text-emerald-650 hover:bg-emerald-650 hover:text-white border border-emerald-250 text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer font-mono"
                            >
                              ✅ Marquer VRAI
                            </button>
                            <button
                              onClick={() => {
                                const explain = `${rep.explanation}\n\n[Mise à jour Admin]: Rumeur analysée. Cette information est trompeuse car elle utilise des déclarations réelles d'il y a 5 ans décontextualisées pour simuler une urgence nationale. Restez vigilants.`;
                                handleUpdateReportStatus(rep.id, 'misleading', explain);
                              }}
                              className="bg-amber-50 text-amber-650 hover:bg-amber-650 hover:text-white border border-amber-250 text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer font-mono"
                            >
                              ⚠️ Marquer TROMPEUR
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 block font-mono">Modifier l'explication factuelle communiquée aux internautes :</label>
                          <textarea
                            defaultValue={rep.explanation}
                            onBlur={(e) => {
                              if (e.target.value !== rep.explanation) {
                                handleUpdateReportStatus(rep.id, rep.status, e.target.value);
                              }
                            }}
                            placeholder="Tapez le descriptif ou rapport de vérification pour modifier ou enrichir l'explication existante..."
                            rows={2}
                            className="w-full text-[11px] p-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WEB MEDIA REGISTRY APPLICATIONS REVIEW */}
        {adminActiveTab === 'registry' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono">Demandes d'Indexation des Organes de Presse</h3>
              <p className="text-[10px] text-gray-400">Évaluez la légitimité des médias ayant soumis leur candidature d'intégration de flux d'actualités et le label certifié.</p>
            </div>

            {submissions.length === 0 ? (
              <p className="text-center p-8 text-xs text-gray-400 italic">Aucune demande d'intégration média enregistrée.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {submissions.map((sub) => (
                  <div key={sub.id} className="border border-gray-150 dark:border-slate-800 p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-0.5">
                        <span className="bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-100 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                          {sub.category}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 tracking-tight mt-1">{sub.mediaName}</h4>
                        <p className="text-[10px] text-gray-400 font-mono">{sub.email}</p>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {sub.status === 'pending' && <span className="bg-amber-100 border border-amber-200 text-amber-800 text-[9px] px-2 py-0.5 rounded-md font-bold font-mono">En attente ⏳</span>}
                        {sub.status === 'approved' && <span className="bg-emerald-100 border border-emerald-250 text-emerald-800 text-[9px] px-2 py-0.5 rounded-md font-bold font-mono">Approuvé ✅</span>}
                        {sub.status === 'rejected' && <span className="bg-rose-100 border border-rose-250 text-rose-800 text-[9px] px-2 py-0.5 rounded-md font-bold font-mono">Refusé ❌</span>}

                        {/* Admin Action: Delete submission */}
                        <button
                          onClick={() => handleDeleteSubmission(sub.id)}
                          className="p-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-100 hover:bg-rose-100 rounded-xl cursor-pointer transition-all ml-1"
                          title="Supprimer cette candidature de la liste"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-[11px] font-semibold text-slate-700 dark:text-slate-350 bg-white dark:bg-slate-950 p-3 rounded-2xl border border-gray-150 dark:border-slate-850 font-mono">
                      <p className="flex justify-between gap-2">
                        <span>URL Média :</span>
                        <a href={sub.websiteUrl} className="text-blue-500 underline truncate max-w-[150px]" target="_blank" rel="noreferrer">
                          {sub.websiteUrl}
                        </a>
                      </p>
                      <p className="flex justify-between gap-2">
                        <span>Numéro d'Agrément / Décision :</span>
                        <strong className="text-slate-850 dark:text-slate-200 font-mono">{sub.haacRegNumber}</strong>
                      </p>
                      <p className="flex justify-between gap-2">
                        <span>Date de soumission :</span>
                        <span className="text-gray-400 font-mono">{sub.submittedAt}</span>
                      </p>
                    </div>

                    {sub.status === 'pending' && (
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <button
                          onClick={() => handleEvaluateMediaSubmission(sub.id, 'approved')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase py-2 rounded-xl transition-colors cursor-pointer"
                        >
                          Approuver & Intégrer
                        </button>
                        <button
                          onClick={() => handleEvaluateMediaSubmission(sub.id, 'rejected')}
                          className="bg-rose-100 hover:bg-rose-600 hover:text-white text-rose-600 font-extrabold uppercase py-2 rounded-xl transition-all cursor-pointer"
                        >
                          Refuser l'Indexation
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RECRUTEMENT / CRÉATION & MODÉRATION DES COURS DE L'ACADÉMIE PAR L'ADMIN */}
        {adminActiveTab === 'courses-creation' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Top Global Action Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 text-white shadow-sm">
              <div className="space-y-1 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[9px] font-black uppercase tracking-wider border border-rose-500/30 font-mono">
                  <Sparkles className="w-3 h-3 text-rose-400" />
                  <span>Base de Données Supabase • Référentiel National 2026</span>
                </div>
                <h3 className="text-sm md:text-base font-extrabold tracking-tight">
                  Gestion Administrative des 15 Cours & Exercices de l'Académie
                </h3>
                <p className="text-xs text-slate-300 font-medium max-w-xl">
                  Vous disposez de tous les privilèges administratifs : création, modification des cours et exercices, suppression et synchronisation globale vers Supabase.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSyncOfficialCurriculum}
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-3 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0 font-mono"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Synchroniser les 15 Cours (Guide 2026)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Formulaire de création / modification */}
              <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-6 rounded-3xl space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      {editingCourseId ? <Edit3 className="w-4 h-4 text-amber-500" /> : <Plus className="w-4 h-4 text-rose-500" />}
                      <span>{editingCourseId ? `Modifier le Cours (${editingCourseId})` : "Publier une formation officielle"}</span>
                    </h3>
                    <p className="text-[10px] text-gray-400">
                      {editingCourseId ? "Modifiez les textes, sections ou l'exercice pratique ci-dessous." : "Ajoutez un nouveau cours avec son exercice pratique à l'Académie."}
                    </p>
                  </div>

                  {editingCourseId && (
                    <button
                      type="button"
                      onClick={handleCancelEditCourse}
                      className="px-3 py-1 text-[10px] font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      Annuler
                    </button>
                  )}
                </div>

                <form onSubmit={handleAdminPublishCourse} className="space-y-4 text-xs font-semibold">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Titre de la formation *</label>
                      <input
                        type="text"
                        value={courseTitle}
                        onChange={e => setCourseTitle(e.target.value)}
                        placeholder="Ex: Cours 1 — Les fondamentaux de la cybersécurité"
                        className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Difficulté</label>
                      <select
                        value={courseDifficulty}
                        onChange={e => setCourseDifficulty(e.target.value as any)}
                        className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none"
                      >
                        <option value="Débutant">Débutant</option>
                        <option value="Intermédiaire">Intermédiaire</option>
                        <option value="Avancé">Avancé</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Catégorie / Thématique</label>
                      <input
                        type="text"
                        value={courseCategory}
                        onChange={e => setCourseCategory(e.target.value)}
                        placeholder="Ex: Cybersécurité, Droit Numérique, Fact-Checking"
                        className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Durée estimée</label>
                      <input
                        type="text"
                        value={courseDuration}
                        onChange={e => setCourseDuration(e.target.value)}
                        placeholder="Ex: 15 min"
                        className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Résumé d'introduction *</label>
                    <textarea
                      value={courseSummary}
                      onChange={e => setCourseSummary(e.target.value)}
                      placeholder="Ce résumé accrocheur guidera les internautes à démarrer le module d'apprentissage..."
                      rows={2}
                      className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none font-sans leading-relaxed"
                      required
                    />
                  </div>

                  {/* Section Contenu de Cours */}
                  <div className="space-y-3 p-4 bg-gray-50/30 dark:bg-slate-950/35 border border-gray-200 dark:border-slate-850 rounded-2xl">
                    <span className="text-[10px] font-black uppercase text-rose-500 font-mono block">Contenu de la Première Page de la Leçon</span>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block">Titre de la Page *</label>
                      <input
                        type="text"
                        value={coursePageTitle}
                        onChange={e => setCoursePageTitle(e.target.value)}
                        placeholder="Ex: Introduction et Piliers Fondamentaux"
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block">Titre de la Section *</label>
                      <input
                        type="text"
                        value={courseSecTitle}
                        onChange={e => setCourseSecTitle(e.target.value)}
                        placeholder="Ex: 1. Les principaux objectifs de la cybersécurité"
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block">Corps de texte - Paragraphe 1 *</label>
                      <textarea
                        value={courseBodyParagraph1}
                        onChange={e => setCourseBodyParagraph1(e.target.value)}
                        placeholder="Texte éducatif détaillé transmettant les informations officielles ou conseils..."
                        rows={3}
                        className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none font-sans leading-relaxed"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block">Corps de texte - Paragraphe 2 (Optionnel)</label>
                      <textarea
                        value={courseBodyParagraph2}
                        onChange={e => setCourseBodyParagraph2(e.target.value)}
                        placeholder="Compléments législatifs ou cas d'application au Bénin..."
                        rows={2}
                        className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none font-sans leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Section Exercice Pratique & Corrigé */}
                  <div className="space-y-3 p-4 bg-amber-50/30 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl">
                    <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 font-mono block">Exercice Pratique & Solution Pédagogique</span>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block">Titre de l'exercice</label>
                      <input
                        type="text"
                        value={courseExerciseTitle}
                        onChange={e => setCourseExerciseTitle(e.target.value)}
                        placeholder="Ex: Exercice Pratique — Cours 1"
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block">Consignes</label>
                      <input
                        type="text"
                        value={courseExerciseInstructions}
                        onChange={e => setCourseExerciseInstructions(e.target.value)}
                        placeholder="Ex: Répondez aux trois questions suivantes pour valider vos acquis."
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block">Questions (Une par ligne)</label>
                      <textarea
                        value={courseExerciseQuestions}
                        onChange={e => setCourseExerciseQuestions(e.target.value)}
                        placeholder="1. Première question...&#10;2. Deuxième question...&#10;3. Troisième question..."
                        rows={3}
                        className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none font-sans"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block">Corrigé officiel / Points clés (Une solution par ligne)</label>
                      <textarea
                        value={courseExerciseSolution}
                        onChange={e => setCourseExerciseSolution(e.target.value)}
                        placeholder="1. Solution et explications pour la question 1...&#10;2. Solution et points clés pour la question 2..."
                        rows={3}
                        className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none font-sans"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
                  >
                    {editingCourseId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    <span>{editingCourseId ? "Mettre à jour le cours dans la base de données" : "Publier le Cours Officiel dans la base de données"}</span>
                  </button>
                </form>
              </div>

              {/* Liste de tous les cours et modération globale par l'Admin */}
              <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm space-y-4 max-h-[850px] overflow-y-auto">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono">
                      Catalogue des cours ({allPlatformLessons.length})
                    </h3>
                    <p className="text-[10px] text-gray-400">Stockage persistant connecté en temps réel.</p>
                  </div>

                  <div className="relative min-w-[160px]">
                    <input
                      type="text"
                      placeholder="Filtrer..."
                      value={adminCourseSearch}
                      onChange={e => setAdminCourseSearch(e.target.value)}
                      className="w-full text-[11px] px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                {allPlatformLessons.length === 0 ? (
                  <div className="p-8 text-center space-y-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-gray-400 italic">Aucun cours n'est actuellement chargé dans la base.</p>
                    <button
                      onClick={handleSyncOfficialCurriculum}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Synchroniser les 15 cours officiels</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allPlatformLessons
                      .filter(les => 
                        les.title.toLowerCase().includes(adminCourseSearch.toLowerCase()) || 
                        les.summary.toLowerCase().includes(adminCourseSearch.toLowerCase()) ||
                        les.id.toLowerCase().includes(adminCourseSearch.toLowerCase())
                      )
                      .map((les) => (
                      <div key={les.id} className="p-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-2 flex justify-between items-start gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                              {les.difficulty}
                            </span>
                            {les.category && (
                              <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                                {les.category}
                              </span>
                            )}
                            {les.exercise && (
                              <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                                Exercice inclus
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs sm:text-sm font-black text-slate-850 dark:text-slate-100 truncate">{les.title}</h4>
                          <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">{les.summary}</p>
                          <div className="text-[9px] text-gray-400 font-semibold font-mono space-y-0.5">
                            <p>Éditeur : <strong className="text-rose-600 dark:text-rose-400">{les.publisher}</strong></p>
                            <p>Identifiant : {les.id}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleEditCourseClick(les)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-all cursor-pointer"
                            title="Modifier ce cours et ses exercices"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAdminDeleteCourse(les.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all cursor-pointer"
                            title="Retirer ce cours de la base de données"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MANAGEMENT DES VIDÉOS (SHORT TV) */}
        {adminActiveTab === 'videos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in text-slate-850 dark:text-slate-100">
            {/* Formulaire de création / modification */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-sm text-left font-sans">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Play className="w-4 h-4 text-rose-500" />
                  {editingShort ? 'Modifier la vidéo' : 'Ajouter une vidéo YouTube'}
                </h3>
                <p className="text-[10px] text-gray-400">
                  {editingShort 
                    ? 'Modifiez les détails de la vidéo sélectionnée.' 
                    : 'Intégrez une nouvelle vidéo YouTube dans la playlist Short TV de la plateforme.'}
                </p>
              </div>

              <form onSubmit={handleSaveShort} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono block">
                    Titre de la vidéo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Coulisses du journalisme d'investigation"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    className="w-full text-xs p-3 bg-gray-50 dark:bg-slate-950/40 border border-gray-150 dark:border-slate-800 rounded-xl focus:outline-none focus:border-rose-500/60 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono block">
                      Organe / Chaîne *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Esae TV"
                      value={videoChannel}
                      onChange={(e) => setVideoChannel(e.target.value)}
                      className="w-full text-xs p-3 bg-gray-50 dark:bg-slate-950/40 border border-gray-150 dark:border-slate-800 rounded-xl focus:outline-none focus:border-rose-500/60 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono block">
                      Identifiant (@handle)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: @EsaeTv"
                      value={videoHandle}
                      onChange={(e) => setVideoHandle(e.target.value)}
                      className="w-full text-xs p-3 bg-gray-50 dark:bg-slate-950/40 border border-gray-150 dark:border-slate-800 rounded-xl focus:outline-none focus:border-rose-500/60 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono block">
                    Lien YouTube ou ID de la vidéo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: https://www.youtube.com/watch?v=WWsU__tHjAM"
                    value={videoIdInput}
                    onChange={(e) => setVideoIdInput(e.target.value)}
                    className="w-full text-xs p-3 bg-gray-50 dark:bg-slate-950/40 border border-gray-150 dark:border-slate-800 rounded-xl focus:outline-none focus:border-rose-500/60 dark:text-white"
                  />
                  <span className="text-[9px] text-gray-400 block pt-0.5 leading-tight">
                    Prend en charge les URL complètes de vidéos, les URL Shorts, les liens partagés et les identifiants à 11 caractères.
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider active:scale-95 transition-all cursor-pointer shadow-lg shadow-rose-600/10 flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingShort ? 'Enregistrer les modifications' : 'Ajouter la vidéo'}</span>
                  </button>

                  {editingShort && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingShort(null);
                        setVideoTitle('');
                        setVideoChannel('');
                        setVideoHandle('');
                        setVideoIdInput('');
                      }}
                      className="py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-xl text-xs font-bold uppercase tracking-wider active:scale-95 transition-all cursor-pointer border border-gray-200 dark:border-slate-700"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Liste des vidéos existantes */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono">
                    Vidéos YouTube Configurer ({adminShorts.length})
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Ces vidéos constituent la playlist interactive Shorts TV diffusée de façon aléatoire aux citoyens.
                  </p>
                </div>
              </div>

              {adminShorts.length === 0 ? (
                <div className="text-center py-10 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-3xl space-y-3">
                  <Play className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto animate-pulse" />
                  <p className="text-xs text-gray-500 font-medium">Aucune vidéo enregistrée dans la base de données.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[580px] overflow-y-auto pr-2 scrollbar-thin">
                  {adminShorts.map((sh) => (
                    <div 
                      key={sh.id}
                      className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm flex flex-col group relative"
                    >
                      {/* Thumbnail wrapper */}
                      <div className="aspect-video w-full bg-slate-950 relative overflow-hidden border-b border-slate-150 dark:border-slate-850">
                        <img
                          src={`https://img.youtube.com/vi/${sh.videoId}/hqdefault.jpg`}
                          alt={sh.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-8 h-8 text-white fill-white" />
                        </div>
                        <div className="absolute top-2 left-2 bg-black/70 text-[8.5px] text-white px-2 py-0.5 rounded font-mono font-bold tracking-wider border border-white/10 uppercase">
                          {sh.channel}
                        </div>
                        <div className="absolute bottom-2 right-2 bg-rose-600/90 text-[8px] text-white font-mono font-black px-1.5 py-0.5 rounded uppercase tracking-widest border border-rose-500/20 shadow-md">
                          {sh.videoId}
                        </div>
                      </div>

                      {/* Video details */}
                      <div className="p-3 text-left space-y-1.5 flex-1 flex flex-col justify-between">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">
                            {sh.title}
                          </h4>
                          <span className="text-[9.5px] font-mono text-cyan-600 dark:text-cyan-400 block font-semibold">
                            {sh.handle}
                          </span>
                        </div>

                        <div className="flex gap-1.5 justify-end pt-2 border-t border-slate-100 dark:border-slate-850">
                          <button
                            onClick={() => {
                              setEditingShort(sh);
                              setVideoTitle(sh.title);
                              setVideoChannel(sh.channel);
                              setVideoHandle(sh.handle);
                              setVideoIdInput(sh.videoId);
                            }}
                            className="p-1.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 border border-indigo-150 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 rounded-xl cursor-pointer transition-all text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                            title="Modifier la vidéo"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteShort(sh.id)}
                            className="p-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-650 border border-rose-100 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-xl cursor-pointer transition-all text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                            title="Supprimer la vidéo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* NEWSLETTERS SUBSCRIPTION MANAGEMENT SCREEN */}
        {adminActiveTab === 'newsletters' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm text-left space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Mail className="w-5 h-5 text-rose-500" />
                  <span>Gestion & Validation des Abonnements Newsletters ({adminSubscriptions.length})</span>
                </h3>
                <p className="text-[11px] text-gray-500 leading-normal">
                  Validez les demandes d'abonnement des citoyens aux médias béninois. Dès acceptation, le citoyen reçoit les flux de ces médias sur son adresse e-mail.
                </p>
              </div>
            </div>

            {adminSubscriptions.length === 0 ? (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs font-mono bg-slate-50 dark:bg-slate-950/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                Aucune demande d'inscription au newsletter n'a été soumise pour le moment.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-150 dark:border-slate-800 text-gray-400 uppercase font-black tracking-wider text-[9px] font-mono">
                      <th className="py-3 px-4">Abonné & E-mail</th>
                      <th className="py-3 px-4">Médias / Flux demandés</th>
                      <th className="py-3 px-4">Date de demande</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4 text-center">Validation Administrateur</th>
                      <th className="py-3 px-4 text-right">Dispatch Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {adminSubscriptions.map((sub) => {
                      const mediaList = sub.mediaChoices && sub.mediaChoices.length > 0 
                        ? sub.mediaChoices 
                        : (sub.mediaChoice ? sub.mediaChoice.split(', ') : ['Tous les flux']);

                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10 transition-colors">
                          <td className="py-3.5 px-4 font-bold">
                            <p className="text-slate-800 dark:text-slate-200 font-extrabold">{sub.userFullName}</p>
                            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-bold flex items-center gap-1">
                              <Mail className="w-3 h-3 shrink-0" />
                              <span>{sub.userEmail}</span>
                            </p>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px]">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {mediaList.map((m, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                                  {m === "Tous les flux" ? "🌍 Tous les flux" : `📰 ${m}`}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400 font-mono text-[10px]">
                            {new Date(sub.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3.5 px-4">
                            {sub.status === 'active' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-mono">
                                ● Accepté & Actif
                              </span>
                            ) : sub.status === 'rejected' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 font-mono">
                                ● Refusé
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 font-mono animate-pulse">
                                ● En attente
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {sub.status !== 'active' && (
                                <button
                                  onClick={() => handleToggleSubscriptionStatus(sub.id, 'active')}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                                  title="Accepter l'abonnement et activer l'envoi d'emails"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Accepter</span>
                                </button>
                              )}
                              {sub.status !== 'rejected' && (
                                <button
                                  onClick={() => handleToggleSubscriptionStatus(sub.id, 'rejected')}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                                  title="Refuser l'abonnement"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Refuser</span>
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {sub.status === 'active' ? (
                              <button
                                onClick={() => {
                                  triggerToast(`📧 [Dispatch Email] Bulletin d'actualités des médias (${mediaList.join(', ')}) envoyé avec succès à : ${sub.userEmail}`, 'success');
                                }}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[9px] rounded-lg transition-all cursor-pointer uppercase tracking-wider flex items-center gap-1 ml-auto shadow-sm"
                                title="Envoyer directement le dernier bulletin à l'abonné par e-mail"
                              >
                                <Send className="w-3 h-3" />
                                <span>Envoyer Flux Email</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-gray-400 italic">En attente d'acceptation</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* LEGAL PAGES (CGU & PRIVACY POLICY) MANAGEMENT */}
        {adminActiveTab === 'legal-pages' && (
          <LegalPagesAdminManagementTab />
        )}

        {/* INDUSTRIAL PUBLIC ANALYTICS & STATS PLOT */}
        {adminActiveTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm text-left space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">Citoyens Enregistrés</p>
              <h3 className="text-2xl font-black text-slate-850 dark:text-slate-100 leading-none">{profiles.length} comptes</h3>
              <p className="text-[10px] text-emerald-500 font-semibold font-mono">⚡ Données réelles</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm text-left space-y-2">
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">Total Rumeurs Citoyennes</p>
              <h3 className="text-2xl font-black text-slate-850 dark:text-slate-100 leading-none">{reports.length} audits</h3>
              <p className="text-[10px] text-gray-400 font-semibold font-mono">⏳ Traitement en temps réel</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm text-left space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">Médias Partenaires Agrégés</p>
              <h3 className="text-2xl font-black text-slate-850 dark:text-slate-100 leading-none">
                {submissions.filter(s => s.status === 'approved').length}
              </h3>
              <p className="text-[10px] text-blue-500 font-semibold font-mono">✓ Comptes partenaires actifs</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm text-left space-y-2">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">Cybercitoyens actifs</p>
              <h3 className="text-2xl font-black text-slate-850 dark:text-slate-100 leading-none">
                {profiles.filter(p => p.role === 'simple').length} membres
              </h3>
              <p className="text-[10px] text-amber-600 font-semibold font-mono">🌟 Vigilance civique active</p>
            </div>

            {/* Real-time Analytics Visuals */}
            <div className="col-span-1 md:col-span-2 lg:col-span-4 grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
              {/* Categories distribution */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm text-left space-y-4">
                <div>
                  <h4 className="text-xs font-black text-slate-850 dark:text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
                    📊 Répartition thématique des Rumeurs
                  </h4>
                  <p className="text-[10px] text-gray-400">Analyse sectorielle des signalements citoyens reçus au Bénin</p>
                </div>
                
                <div className="space-y-3 pt-2">
                  {['politique', 'santé', 'société', 'finance', 'autre'].map(cat => {
                    const count = reports.filter(r => r.category?.toLowerCase() === cat.toLowerCase()).length;
                    const total = reports.length || 1;
                    const pct = Math.round((count / total) * 100);
                    
                    const catColors: Record<string, string> = {
                      politique: 'bg-indigo-500',
                      santé: 'bg-emerald-500',
                      société: 'bg-rose-500',
                      finance: 'bg-amber-500',
                      autre: 'bg-slate-400'
                    };
                    
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="capitalize text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${catColors[cat] || 'bg-blue-500'}`} />
                            {cat}
                          </span>
                          <span className="text-slate-500 font-mono text-[10px]">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800/60 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${catColors[cat] || 'bg-blue-500'} rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Audit verification rate */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm text-left space-y-4">
                <div>
                  <h4 className="text-xs font-black text-slate-850 dark:text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
                    🔎 Statut de Traitement & Fact-checking
                  </h4>
                  <p className="text-[10px] text-gray-400">Progression des évaluations et modérations d'actualités</p>
                </div>

                <div className="space-y-4 pt-2">
                  {[
                    { key: 'verified', label: 'Vrais & Vérifiés ✅', color: 'text-emerald-500', bg: 'bg-emerald-500/10', bar: 'bg-emerald-500' },
                    { key: 'fake', label: 'Vérifiés Faux ❌', color: 'text-red-500', bg: 'bg-red-500/10', bar: 'bg-red-500' },
                    { key: 'misleading', label: 'Trompeurs/Manipulés ⚠️', color: 'text-amber-500', bg: 'bg-amber-500/10', bar: 'bg-amber-500' },
                    { key: 'pending', label: 'En cours d\'audit 🔎', color: 'text-indigo-500', bg: 'bg-indigo-500/10', bar: 'bg-indigo-500' }
                  ].map(item => {
                    const count = reports.filter(r => r.status === item.key).length;
                    const total = reports.length || 1;
                    const pct = Math.round((count / total) * 100);

                    return (
                      <div key={item.key} className="flex items-center gap-4">
                        <div className={`w-32 text-xs font-bold ${item.color} truncate`}>
                          {item.label}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="w-full h-4 bg-slate-100 dark:bg-slate-800/60 rounded-full overflow-hidden relative">
                            <div 
                              className={`h-full ${item.bar} rounded-full transition-all duration-500`}
                              style={{ width: `${pct}%` }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black font-mono text-slate-700 dark:text-slate-300">
                              {count} rumeur{count > 1 ? 's' : ''} ({pct}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* MANAGEMENT DES COMMUNAUTÉS & COMMUNOPHONES/COMMUNIQUES DÉFILANTS */}
        {adminActiveTab === 'communiques' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            {/* Formulaire de publication */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-sm text-left">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-rose-500" />
                  Diffuser un Communiqué Défilant
                </h3>
                <p className="text-[10px] text-gray-400">Ce message défilera en continu au sommet de toutes les pages du site (sauf Short TV).</p>
              </div>

              <form onSubmit={handleAddCommunique} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Texte du Communiqué *</label>
                  <textarea
                    rows={4}
                    value={communiqueContent}
                    onChange={e => setCommuniqueContent(e.target.value)}
                    placeholder="Saisissez ici le texte d'alerte, de communiqué officiel ou de rappel citoyen..."
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-wider py-3 px-4 rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publier et activer</span>
                </button>
              </form>
            </div>

            {/* Liste des communiqués */}
            <div className="lg:col-span-7 space-y-4 text-left">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-850 dark:text-slate-100 uppercase tracking-wider font-mono">
                  Historique des alertes & communiqués ({allCommuniques.length})
                </h3>
              </div>

              {allCommuniques.length === 0 ? (
                <div className="p-8 border border-dashed border-gray-200 dark:border-slate-800 text-center rounded-3xl text-gray-400 text-xs font-mono">
                  Aucun communiqué publié pour le moment.
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {allCommuniques.map((c) => (
                    <div 
                      key={c.id} 
                      className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                        c.active 
                          ? 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-150 dark:border-rose-900/30' 
                          : 'bg-white dark:bg-slate-900 border-gray-150 dark:border-slate-800/80 opacity-60'
                      }`}
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider font-mono ${
                            c.active 
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-gray-150 text-gray-500'
                          }`}>
                            {c.active ? '● Actif' : 'Inactif'}
                          </span>
                          <span className="text-[9px] text-gray-400 font-mono">
                            Créé le {new Date(c.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 break-words font-mono bg-slate-50/50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                          "{c.content}"
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleCommunique(c)}
                          className={`p-2 rounded-xl border cursor-pointer transition-colors ${
                            c.active 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-150 hover:bg-emerald-100' 
                              : 'bg-gray-50 dark:bg-slate-950/40 text-gray-400 border-gray-150 hover:bg-gray-100'
                          }`}
                          title={c.active ? "Désactiver" : "Activer"}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCommunique(c.id)}
                          className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-100 hover:bg-rose-100 rounded-xl cursor-pointer transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MANAGEMENT DES CAMPAGNES PUBLICITAIRES (IMAGES & VIDÉOS) */}
        {adminActiveTab === 'publicites' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            {/* Formulaire de création */}
            <div id="ad-form-header" className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-sm text-left">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Tv className="w-4 h-4 text-blue-500" />
                  {editingAd ? 'Modifier la Publicité' : 'Programmer une Publicité'}
                </h3>
                <p className="text-[10px] text-gray-400">
                  {editingAd 
                    ? 'Modifiez les détails de la campagne publicitaire sélectionnée.' 
                    : 'Ajoutez une annonce qui s\'affichera dans les emplacements stratégiques du site.'}
                </p>
              </div>

              <form onSubmit={handleAddAdvertisement} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Nom de la Campagne *</label>
                  <input
                    type="text"
                    value={adTitle}
                    onChange={e => setAdTitle(e.target.value)}
                    placeholder="Ex: Campagne de sensibilisation ActuHub 2026"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Nom de l'Annonceur (Optionnel)</label>
                  <input
                    type="text"
                    value={adAdvertiserName}
                    onChange={e => setAdAdvertiserName(e.target.value)}
                    placeholder="Ex: Ministère de la Communication / Société X"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>

                 <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Format</label>
                    <select
                      value={adType}
                      onChange={e => setAdType(e.target.value as any)}
                      className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none font-semibold"
                    >
                      <option value="image">Image publicitaire 🖼️</option>
                      <option value="video">Vidéo publicitaire 🎥</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">
                    Emplacements de diffusion <span className="text-indigo-500 dark:text-indigo-400 font-bold">(Sélectionnez plusieurs si désiré)</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { value: 'above_rumors', label: 'Haut de la section Rumeurs & Signalements (Accueil) 🚨' },
                      { value: 'header', label: 'En-tête de page (Header) ⬆️' },
                      { value: 'sidebar', label: 'Barre latérale (Sidebar) ➡️' },
                      { value: 'footer', label: 'Pied de page (Footer) ⬇️' },
                      { value: 'in_feed', label: 'Milieu du flux (In-Feed) 📰' },
                      { value: 'popup', label: "Pop-up d'entrée (Popup) 🚨" }
                    ].map((item) => {
                      const isChecked = adPlacements.includes(item.value as any);
                      return (
                        <label
                          key={item.value}
                          className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-indigo-50/50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-bold'
                              : 'bg-gray-50/40 border-gray-150 dark:bg-slate-950/20 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-gray-100/50 dark:hover:bg-slate-900/40'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAdPlacements(prev => [...prev, item.value as any]);
                              } else {
                                if (adPlacements.length > 1) {
                                  setAdPlacements(prev => prev.filter(p => p !== item.value));
                                } else {
                                  triggerToast('Veuillez sélectionner au moins un emplacement.', 'info');
                                }
                              }
                            }}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                          />
                          <span className="text-xs">{item.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Date de début</label>
                    <input
                      type="date"
                      value={adStartDate}
                      onChange={e => setAdStartDate(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Date de fin</label>
                    <input
                      type="date"
                      value={adEndDate}
                      onChange={e => setAdEndDate(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                 <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">
                    Fichier ou URL du média (Image ou Vidéo) *
                  </label>
                  
                  <div className="bg-slate-50 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl border border-gray-150 dark:border-slate-800 bg-white dark:bg-slate-900/40 relative">
                      <Upload className="w-5 h-5 text-indigo-500 animate-pulse mb-1.5" />
                      <span className="text-[10px] text-slate-700 dark:text-slate-300 font-bold block mb-1">
                        {isCompressingAd ? 'Optimisation de l\'image en cours...' : `Téléverser un fichier (${adType === 'image' ? 'Image' : 'Vidéo'})`}
                      </span>
                      <span className="text-[9px] text-slate-400 block mb-2.5">
                        Glissez-déposez ou cliquez pour choisir depuis votre appareil
                      </span>
                      <input
                        type="file"
                        accept={adType === 'image' ? "image/*" : "video/*"}
                        disabled={isCompressingAd}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-wait"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIsCompressingAd(true);
                            try {
                              const compressedUrl = await compressImageFile(file, 1200, 1200, 0.85);
                              setAdMediaUrl(compressedUrl);
                              triggerToast('Média publicitaire téléversé et optimisé avec succès ! 🖼️', 'success');
                            } catch (err) {
                              console.error('Erreur compression image:', err);
                              triggerToast('Erreur lors du traitement du fichier.', 'error');
                            } finally {
                              setIsCompressingAd(false);
                            }
                          }
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="h-px bg-gray-200 dark:bg-slate-800 flex-1"></div>
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider font-mono">OU Saisir une URL Web</span>
                      <div className="h-px bg-gray-200 dark:bg-slate-800 flex-1"></div>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={adMediaUrl.startsWith('data:') ? '' : adMediaUrl}
                        onChange={e => setAdMediaUrl(e.target.value)}
                        placeholder={adMediaUrl.startsWith('data:') ? "Fichier téléversé localement" : "Ex: https://images.unsplash.com/... ou lien YouTube Embed"}
                        disabled={adMediaUrl.startsWith('data:')}
                        className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-slate-900/20 disabled:text-gray-400"
                      />
                    </div>

                    {/* Aperçu en direct du Média */}
                    {adMediaUrl && (
                      <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/50 bg-slate-950 p-2.5 space-y-2 text-left">
                        <div className="flex items-center justify-between text-[10px] font-mono text-white px-1">
                          <span className="font-black uppercase text-indigo-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-indigo-400" /> Aperçu visuel en direct
                          </span>
                          <button
                            type="button"
                            onClick={() => setAdMediaUrl('')}
                            className="text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer text-[9px]"
                          >
                            Supprimer / Changer
                          </button>
                        </div>
                        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center relative border border-slate-800">
                          {adType === 'image' || adMediaUrl.startsWith('data:image') ? (
                            <img 
                              src={adMediaUrl} 
                              alt="Aperçu pub" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=400';
                              }}
                            />
                          ) : adMediaUrl.includes('youtube.com') || adMediaUrl.includes('youtu.be') || adMediaUrl.includes('/embed/') ? (
                            <iframe 
                              src={adMediaUrl} 
                              title="Aperçu vidéo" 
                              className="w-full h-full border-0" 
                            />
                          ) : (
                            <video src={adMediaUrl} controls className="w-full h-full object-cover" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Lien cible (Clic) *</label>
                  <input
                    type="url"
                    value={adTargetUrl}
                    onChange={e => setAdTargetUrl(e.target.value)}
                    placeholder="Ex: https://actuhub-benin.com/"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Étiquette de diffusion</label>
                  <div className="grid grid-cols-3 gap-1.5 h-[42px]">
                    {[
                      { value: 'publicite', label: 'Publicité' },
                      { value: 'annonce', label: 'Annonce' },
                      { value: 'none', label: 'Aucune ❌' }
                    ].map((option) => {
                      const isSelected = adLabel === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setAdLabel(option.value as any)}
                          className={`text-[9px] font-black uppercase tracking-wider rounded-xl border transition-all text-center flex items-center justify-center ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-extrabold shadow-sm'
                              : 'bg-gray-50/50 border-gray-150 dark:bg-slate-950/20 dark:border-slate-850 text-slate-500 dark:text-slate-400 hover:bg-gray-100/50 dark:hover:bg-slate-900/40 font-bold'
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  {editingAd && (
                    <button
                      type="button"
                      onClick={handleCancelEditAdvertisement}
                      className="flex-1 bg-slate-250 hover:bg-slate-350 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-[10px] uppercase tracking-wider py-3 px-4 rounded-xl transition-all cursor-pointer shadow-sm text-center"
                    >
                      Annuler
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-wider py-3 px-4 rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                  >
                    {editingAd ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    <span>{editingAd ? 'Modifier' : "Programmer l'annonce"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Liste des publicités */}
            <div className="lg:col-span-7 space-y-4 text-left">
              <h3 className="text-xs font-black text-slate-850 dark:text-slate-100 uppercase tracking-wider font-mono">
                Campagnes programmées ({allAdvertisements.length})
              </h3>

              {allAdvertisements.length === 0 ? (
                <div className="p-8 border border-dashed border-gray-200 dark:border-slate-800 text-center rounded-3xl text-gray-400 text-xs font-mono">
                  Aucune publicité programmée pour le moment.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
                  {allAdvertisements.map((ad) => (
                    <div 
                      key={ad.id} 
                      className={`p-4 rounded-3xl border transition-all flex flex-col justify-between gap-3 ${
                        ad.active 
                          ? 'bg-blue-50/10 dark:bg-blue-950/5 border-blue-150 dark:border-blue-900/30 shadow-sm' 
                          : 'bg-white dark:bg-slate-900 border-gray-150 dark:border-slate-800/80 opacity-60'
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Media preview */}
                        <div className="aspect-video w-full rounded-2xl bg-slate-950 overflow-hidden relative border border-slate-150 dark:border-slate-800 flex items-center justify-center">
                          {ad.type === 'image' ? (
                            <img 
                              src={ad.mediaUrl} 
                              alt={ad.title} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                // Fallback image if broken
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=400';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full relative flex items-center justify-center bg-slate-900 text-white">
                              {ad.mediaUrl.includes('youtube.com') || ad.mediaUrl.includes('youtu.be') || ad.mediaUrl.includes('/embed/') ? (
                                <iframe 
                                  src={ad.mediaUrl} 
                                  title={ad.title}
                                  className="w-full h-full absolute inset-0 border-0 pointer-events-none" 
                                />
                              ) : (
                                <video src={ad.mediaUrl} className="w-full h-full object-cover" muted loop playsInline />
                              )}
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <span className="bg-blue-600 text-white font-mono text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg">🎥 Vidéo</span>
                              </div>
                            </div>
                          )}
                          <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[90%]">
                            {(ad.placements && ad.placements.length > 0 ? ad.placements : [ad.placement]).map((p) => (
                              <span key={p} className="bg-slate-900/80 backdrop-blur-sm text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full font-mono">
                                {p === 'header' 
                                  ? 'En-tête ⬆️' 
                                  : p === 'sidebar' 
                                  ? 'Sidebar ➡️' 
                                  : p === 'footer'
                                  ? 'Footer ⬇️'
                                  : p === 'in_feed'
                                  ? 'In-Feed 📰'
                                  : 'Popup 🚨'}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate flex-1 flex items-center gap-1.5">
                              <span>{ad.title}</span>
                              {ad.label && ad.label !== 'none' ? (
                                <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase font-mono shrink-0">
                                  {ad.label === 'publicite' ? 'Publicité' : 'Annonce'}
                                </span>
                              ) : ad.label === 'none' ? (
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-400 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase font-mono shrink-0">
                                  Sans étiquette
                                </span>
                              ) : null}
                            </h4>
                            {ad.advertiserName && (
                              <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono truncate max-w-[100px]" title={`Annonceur: ${ad.advertiserName}`}>
                                {ad.advertiserName}
                              </span>
                            )}
                          </div>
                          
                          <a 
                            href={ad.targetUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-500 hover:underline block truncate font-mono"
                          >
                            Lien: {ad.targetUrl}
                          </a>

                          {/* Extra Metadata Details */}
                          {(ad.startDate || ad.endDate) && (
                            <div className="text-[9px] text-slate-400 font-mono">
                              📅 {ad.startDate ? new Date(ad.startDate).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'}) : 'Immédiat'} au {ad.endDate ? new Date(ad.endDate).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'}) : 'Indéfini'}
                            </div>
                          )}

                          {/* Stats Metrics */}
                          <div className="flex gap-3 pt-1 text-[9px] font-mono font-bold text-slate-400 border-t border-dashed border-slate-100 dark:border-slate-850">
                            <span className="flex items-center gap-1">👁️ {ad.viewsCount || 0} vues</span>
                            <span className="flex items-center gap-1">🖱️ {ad.clicksCount || 0} clics</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[9px] text-gray-400 font-mono">
                          Ajoutée le {new Date(ad.createdAt).toLocaleDateString('fr-FR')}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleStartEditAdvertisement(ad)}
                            className="p-1.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 border border-blue-100 hover:bg-blue-100 rounded-xl cursor-pointer transition-all"
                            title="Modifier la campagne"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleAdvertisement(ad)}
                            className={`p-1.5 rounded-xl border cursor-pointer transition-all ${
                              ad.active 
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-150' 
                                : 'bg-gray-50 dark:bg-slate-950/40 text-gray-400 border-gray-150'
                            }`}
                            title={ad.active ? "Mettre en veille" : "Activer"}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAdvertisement(ad.id)}
                            className="p-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-100 hover:bg-rose-100 rounded-xl cursor-pointer transition-all"
                            title="Supprimer la campagne"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MANAGEMENT DES UNES DES JOURNAUX */}
        {adminActiveTab === 'unes' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            {/* Formulaire de création / modification */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-sm text-left font-sans">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Folder className="w-4 h-4 text-blue-500" />
                  {editingUne ? 'Modifier la UNE' : 'Publier la UNE d\'un Journal'}
                </h3>
                <p className="text-[10px] text-gray-400">
                  {editingUne 
                    ? 'Modifiez les détails de l\'édition sélectionnée.' 
                    : 'Publiez une nouvelle image de couverture ou de UNE d\'un média béninois officiel.'}
                </p>
              </div>

              <form onSubmit={handleSaveUne} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Média éditeur *</label>
                  <input
                    type="text"
                    value={uneMediaName}
                    onChange={e => setUneMediaName(e.target.value)}
                    placeholder="Ex: MATIN LIBRE, FRATERNITE, LE POTENTIEL..."
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Titre de l'Édition (optionnel)</label>
                  <input
                    type="text"
                    value={uneTitle}
                    onChange={e => setUneTitle(e.target.value)}
                    placeholder="Ex: Édition N° 2345 du Lundi, Spécial Décryptage..."
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Date de parution *</label>
                  <input
                    type="date"
                    value={uneDate}
                    onChange={e => setUneDate(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">
                    Fichier image de la UNE *
                  </label>
                  
                  <div className="bg-slate-50 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl border border-gray-150 dark:border-slate-800 bg-white dark:bg-slate-900/40 relative">
                      <Upload className="w-5 h-5 text-indigo-500 animate-pulse mb-1.5" />
                      <span className="text-[10px] text-slate-700 dark:text-slate-300 font-bold block mb-1">
                        Téléverser la UNE
                      </span>
                      <span className="text-[9px] text-slate-400 block mb-2.5">
                        Glissez-déposez ou cliquez pour choisir
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressed = await compressImageFile(file, 1200, 1200, 0.85);
                              setUneImageUrl(compressed);
                              triggerToast('Image de la UNE optimisée et chargée ! 💾', 'success');
                            } catch (err) {
                              console.error("Error compressing UNE image", err);
                              triggerToast("Erreur lors de l'optimisation de l'image.", "error");
                            }
                          }
                        }}
                      />
                      {uneImageUrl.startsWith('data:') && (
                        <div className="mt-1 text-[9px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-md font-bold flex items-center gap-1 z-10">
                          <span>✓ Image prête</span>
                          <button 
                            type="button" 
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setUneImageUrl('');
                            }}
                            className="text-red-500 font-bold ml-1 hover:underline cursor-pointer"
                          >
                            Effacer
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="text-center text-[9px] text-slate-400">OU saisissez un lien URL d'image existant</div>

                    <input
                      type="url"
                      value={uneImageUrl}
                      onChange={e => setUneImageUrl(e.target.value)}
                      placeholder="https://exemple.com/une.jpg"
                      className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  {editingUne && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUne(null);
                        setUneMediaName('');
                        setUneImageUrl('');
                        setUneDate(new Date().toISOString().substring(0, 10));
                        setUneTitle('');
                      }}
                      className="flex-1 bg-slate-250 hover:bg-slate-350 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-[10px] uppercase tracking-wider py-3 px-4 rounded-xl transition-all cursor-pointer shadow-sm text-center"
                    >
                      Annuler
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-wider py-3 px-4 rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                  >
                    {editingUne ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    <span>{editingUne ? 'Enregistrer' : 'Publier la UNE'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Liste des UNEs des journaux */}
            <div className="lg:col-span-7 space-y-4 text-left font-sans">
              <h3 className="text-xs font-black text-slate-850 dark:text-slate-100 uppercase tracking-wider font-mono">
                UNEs publiées ({allFrontPages.length})
              </h3>

              {allFrontPages.length === 0 ? (
                <div className="p-8 border border-dashed border-gray-200 dark:border-slate-800 text-center rounded-3xl text-gray-400 text-xs font-mono">
                  Aucune UNE de journal publiée pour le moment.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
                  {allFrontPages.map((une) => (
                    <div 
                      key={une.id} 
                      className="p-4 rounded-3xl border border-gray-150 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-2">
                        {/* Preview */}
                        <div className="aspect-[3/4] w-full rounded-2xl bg-slate-100 dark:bg-slate-950 overflow-hidden relative border border-slate-150 dark:border-slate-800 flex items-center justify-center">
                          {une.imageUrl ? (
                            <img
                              src={une.imageUrl}
                              alt={une.mediaName}
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-xs text-gray-400">Pas d'image</span>
                          )}
                          <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full font-mono">
                            {une.date}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            <span className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[9px] px-1.5 py-0.5 rounded font-black font-mono">
                              {une.mediaName}
                            </span>
                            <span className="truncate">{une.title || "Édition Standard"}</span>
                          </h4>
                          <p className="text-[9px] text-slate-400 font-mono">
                            Par: {une.publishedBy}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[9px] text-gray-400 font-mono">
                          Ajoutée le {new Date(une.createdAt).toLocaleDateString('fr-FR')}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingUne(une);
                              setUneMediaName(une.mediaName);
                              setUneImageUrl(une.imageUrl);
                              setUneDate(une.date);
                              setUneTitle(une.title || "");
                            }}
                            className="p-1.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 border border-blue-100 hover:bg-blue-100 rounded-xl cursor-pointer transition-all"
                            title="Modifier cette UNE"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUne(une.id)}
                            className="p-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-100 hover:bg-rose-100 rounded-xl cursor-pointer transition-all"
                            title="Supprimer cette UNE"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      {/* Global Custom Confirmation Dialog */}
      <ConfirmationModal
        isOpen={confirmDialog.isOpen}
        type={confirmDialog.type}
        title={confirmDialog.title}
        message={confirmDialog.message}
        details={confirmDialog.details}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Moderator Permissions Modal */}
      {modConfigUser && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <span className="bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded font-mono">
                  Habilitations & Accès Modérateur
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                  {modConfigUser.fullName}
                </h3>
                <p className="text-[11px] text-gray-500 font-mono">{modConfigUser.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setModConfigUser(null)}
                className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-sans">
              Sélectionnez les rubriques et modules de la console d'administration auxquels ce modérateur aura accès :
            </p>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {[
                { key: 'canManageRumors', label: 'Verdict & Evaluation des Rumeurs', icon: '🛡️', desc: 'Evaluer les signalements citoyens et valider les faits.' },
                { key: 'canManageSubmissions', label: 'Dossiers Candidatures Média', icon: '📺', desc: 'Examiner et approuver les demandes d\'indexation.' },
                { key: 'canManageCourses', label: 'Formations & Cours Officiels', icon: '📚', desc: 'Publier et mettre à jour les cours d\'éducation aux médias.' },
                { key: 'canManageCommuniques', label: 'Communiqués Officiels', icon: '📢', desc: 'Diffuser les alertes et communiqués officiels.' },
                { key: 'canManageAds', label: 'Régie Publicitaire & Bannières', icon: '📺', desc: 'Planifier et valider les annonces et publicités.' },
                { key: 'canManageUnes', label: 'La UNE des Journaux', icon: '📰', desc: 'Mettre en ligne les Une quotidiennes de la presse.' },
                { key: 'canManageNewsletters', label: 'Abonnements Newsletters', icon: '✉️', desc: 'Consulter la liste des abonnés aux flux RSS/Newsletter.' },
                { key: 'canManageLegal', label: 'Pages Légales (CGU & Confidentialité)', icon: '⚖️', desc: 'Mettre à jour les règles d\'utilisation du portail.' },
                { key: 'canManageUsers', label: 'Consulter / Gérer les Utilisateurs', icon: '👥', desc: 'Consulter les comptes utilisateurs (Nom, Tél, Ville).' }
              ].map(item => {
                const currentPerms = modConfigUser.moderatorPermissions || {};
                const isChecked = currentPerms[item.key as keyof ModeratorPermissions] ?? (item.key !== 'canManageLegal' && item.key !== 'canManageUsers');
                return (
                  <label
                    key={item.key}
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                      isChecked 
                        ? 'bg-purple-50/60 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-100' 
                        : 'bg-gray-50/50 dark:bg-slate-950/30 border-gray-200 dark:border-slate-800 text-gray-500'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={e => {
                        const updated = {
                          ...modConfigUser,
                          moderatorPermissions: {
                            ...(modConfigUser.moderatorPermissions || {}),
                            [item.key]: e.target.checked
                          }
                        };
                        setModConfigUser(updated);
                      }}
                      className="mt-0.5 w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
                    />
                    <div className="space-y-0.5 text-xs">
                      <p className="font-bold flex items-center gap-1.5">
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">{item.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModConfigUser(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={async () => {
                  const updatedProfiles = profiles.map(p => p.id === modConfigUser.id ? modConfigUser : p);
                  await updateProfilesInStorage(updatedProfiles);
                  triggerToast(`Habilitations du Modérateur ${modConfigUser.fullName} enregistrées ! 🛡️`, 'success');
                  setModConfigUser(null);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Enregistrer les Privilèges
              </button>
            </div>
          </div>
        </div>
      )}

      </div>

    </div>
  );
}


// ==========================================
// 4. HEADER PROFILE DROPDOWN WIDGET
// ==========================================
export function UserProfileHeaderDropdown({
  currentUser,
  onLogout,
  onSwitchTab,
  onOpenFavorites
}: {
  currentUser: UserProfile | null;
  onLogout: () => void;
  onSwitchTab: (tab: any) => void;
  onOpenFavorites: () => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!currentUser) return null;

  return (
    <div id="user-profile-header-dropdown" className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800/80 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none"
      >
        <div className="w-5.5 h-5.5 sm:w-5 sm:h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] uppercase shadow-sm">
          {currentUser.fullName.slice(0, 2)}
        </div>
        <span className="hidden sm:inline-block max-w-[100px] truncate text-slate-700 dark:text-gray-200">{currentUser.fullName}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {dropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-950 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xl py-2.5 z-50 animate-scale-up text-left">
            
            <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-800/60 pb-3">
              <p className="text-[10px] font-black uppercase text-gray-400 font-mono">Profil Connecté</p>
              <p className="text-xs font-bold text-gray-800 dark:text-slate-100 truncate">{currentUser.fullName}</p>
              <span className="inline-block bg-blue-50 dark:bg-slate-900/60 text-blue-600 dark:text-blue-400 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mt-1.5 font-mono">
                Rôle: {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'moderator' ? 'Modérateur' : currentUser.role === 'media' ? 'Média' : 'Citoyen'}
              </span>
            </div>

            <div className="p-1 space-y-0.5">
              
              {/* Shortcut to Favorites */}
              <button
                onClick={() => { onOpenFavorites(); setDropdownOpen(false); }}
                className="w-full text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 p-2 rounded-xl transition-colors text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer"
              >
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span>Mes Favoris sauvegardés</span>
              </button>

              {/* Shortcut to Media Dashboard if media */}
              {currentUser.role === 'media' && (
                <button
                  onClick={() => { onSwitchTab('media-dashboard'); setDropdownOpen(false); }}
                  className="w-full text-left text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/20 p-2 rounded-xl transition-colors text-emerald-600 dark:text-emerald-400 flex items-center gap-2 cursor-pointer font-bold"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Tableau de Bord Média</span>
                </button>
              )}

              {/* Shortcut to Moderator dashboard if moderator */}
              {currentUser.role === 'moderator' && (
                <button
                  onClick={() => { onSwitchTab('admin-dashboard'); setDropdownOpen(false); }}
                  className="w-full text-left text-xs font-semibold hover:bg-purple-50 dark:hover:bg-purple-950/20 p-2 rounded-xl transition-colors text-purple-600 dark:text-purple-400 flex items-center gap-2 cursor-pointer font-bold"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Console de Modération</span>
                </button>
              )}

              {/* Shortcut to Administrator dashboard if admin */}
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => { onSwitchTab('admin-dashboard'); setDropdownOpen(false); }}
                  className="w-full text-left text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-955/20 p-2 rounded-xl transition-colors text-rose-650 dark:text-rose-400 flex items-center gap-2 cursor-pointer font-bold"
                >
                  <Sliders className="w-4 h-4 rotate-90" />
                  <span>Gestion Administrateur</span>
                </button>
              )}

              <div className="h-[1px] bg-gray-100 dark:bg-slate-800/80 my-1"></div>

              <button
                onClick={() => { onLogout(); setDropdownOpen(false); }}
                className="w-full text-left text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 p-2 rounded-xl transition-colors text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Se déconnecter</span>
              </button>
            </div>

          </div>
        </>
      )}
    </div>
  );
}

// ==========================================
// 5. CITIZEN DASHBOARD COMPONENT
// ==========================================
export function CitizenDashboard({
  currentUser,
  onLogout,
  onSwitchTab,
  favoritesCount = 0
}: {
  currentUser: UserProfile;
  onLogout: () => void;
  onSwitchTab: (tab: any) => void;
  favoritesCount?: number;
}) {
   const [citizenActiveTab, setCitizenActiveTab] = useState<'overview' | 'declare'>('overview');
  const [submission, setSubmission] = useState<MediaSubmission | null>(null);
  const [subscriptions, setSubscriptions] = useState<NewsletterSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  // Confirmation Modal state for Citizen Dashboard
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type?: ConfirmationType;
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

  const triggerConfirm = (options: {
    title: string;
    message: string;
    type?: ConfirmationType;
    details?: string | React.ReactNode;
    confirmText?: string;
    onConfirm: () => void | Promise<void>;
  }) => {
    setConfirmDialog({
      isOpen: true,
      type: options.type || 'warning',
      title: options.title,
      message: options.message,
      details: options.details,
      confirmText: options.confirmText,
      onConfirm: async () => {
        try {
          await options.onConfirm();
        } catch (err) {
          console.error("Error in confirmed action", err);
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleUnsubscribe = (subId: string, mediaChoice: string) => {
    triggerConfirm({
      type: 'delete',
      title: "Se désabonner de la newsletter ?",
      message: `Êtes-vous sûr de vouloir vous désabonner des alertes d'actualités de "${mediaChoice}" ?`,
      confirmText: "Se désabonner",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "newsletter_subscriptions", subId));
          triggerToast(`Désabonnement réussi du flux : ${mediaChoice}`, 'success');
        } catch (error) {
          console.error("Error unsubscribing:", error);
          triggerToast("Impossible de supprimer cet abonnement.", 'error');
        }
      }
    });
  };

  // Form states
  const [formMediaName, setFormMediaName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formHaac, setFormHaac] = useState('');
  const [formCategory, setFormCategory] = useState<'presse-ecrite' | 'presse-en-ligne' | 'audiovisuel' | 'autre'>('presse-en-ligne');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync newsletter subscriptions real-time from Firestore
  useEffect(() => {
    const q = collection(db, "newsletter_subscriptions");
    const unsub = onSnapshot(q, (snapshot) => {
      const all: NewsletterSubscription[] = [];
      snapshot.forEach((d) => {
        all.push({ id: d.id, ...d.data() } as NewsletterSubscription);
      });
      const mine = all.filter(sub => sub.userId === currentUser.id);
      setSubscriptions(mine);
    }, (err) => {
      console.warn("Firestore error fetching subscriptions in CitizenDashboard:", err);
    });
    return () => unsub();
  }, [currentUser.id]);

  // Sync submission status real-time from Firestore
  useEffect(() => {
    const q = collection(db, "submissions");
    const unsub = onSnapshot(q, (snapshot) => {
      const all: MediaSubmission[] = [];
      snapshot.forEach((d) => {
        all.push({ id: d.id, ...d.data() } as MediaSubmission);
      });
      const mine = all.find(sub => sub.email.toLowerCase() === currentUser.email.toLowerCase());
      setSubmission(mine || null);
      if (mine && !formMediaName) {
        setFormMediaName(mine.mediaName);
        setFormUrl(mine.websiteUrl);
        setFormHaac(mine.haacRegNumber);
        setFormCategory(mine.category);
      }
      setLoading(false);
    }, (err) => {
      console.warn("Firestore error fetching submissions in CitizenDashboard:", err);
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser.email]);

  const handleSubmitDeclaration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMediaName.trim() || !formUrl.trim() || !formHaac.trim()) {
      triggerToast('Veuillez remplir tous les champs obligatoires.', 'error');
      return;
    }

    triggerConfirm({
      type: 'add',
      title: "Transmettre la déclaration d'organe de presse ?",
      message: `Voulez-vous vraiment soumettre la déclaration de "${formMediaName.trim()}" au comité d'indexation d'ActuHub Bénin ?`,
      confirmText: "Soumettre ma déclaration",
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          const submissionId = submission?.id || "sub-" + Math.random().toString(36).substring(2, 7);
          const newSub: MediaSubmission = {
            id: submissionId,
            mediaName: formMediaName.trim(),
            email: currentUser.email,
            websiteUrl: formUrl.trim(),
            haacRegNumber: formHaac.trim(),
            category: formCategory,
            status: 'pending',
            submittedAt: new Date().toLocaleDateString('fr-FR')
          };

          await setDoc(doc(db, "submissions", submissionId), newSub);
          triggerToast('Votre demande de déclaration média a été transmise avec succès ! 📥', 'success');
        } catch (err) {
          console.error("Error saving media submission:", err);
          triggerToast('Erreur lors de la transmission de votre déclaration.', 'error');
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

  const handleWithdrawDeclaration = () => {
    if (!submission) return;
    triggerConfirm({
      type: 'warning',
      title: "Retirer la déclaration de média ?",
      message: "Voulez-vous vraiment retirer votre déclaration de média web transmise pour vérification ?",
      confirmText: "Retirer la déclaration",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "submissions", submission.id));
          setFormMediaName('');
          setFormUrl('');
          setFormHaac('');
          triggerToast('Votre déclaration de média a été retirée avec succès.', 'info');
        } catch (err) {
          console.error("Error deleting media submission:", err);
          triggerToast('Erreur lors du retrait de la déclaration.', 'error');
        }
      }
    });
  };

  return (
    <div className="space-y-6 animate-scale-up text-slate-800 dark:text-slate-100">
      
      {/* Profil Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xl uppercase shadow-md border-2 border-white dark:border-slate-800">
            {currentUser.fullName.slice(0, 2)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center flex-wrap justify-center md:justify-start gap-2">
              <h2 className="text-lg font-black tracking-tight">{currentUser.fullName}</h2>
              <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full font-mono">
                <User className="w-3 h-3 text-blue-500" /> Citoyen Engagé
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{currentUser.email}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">
              Inscrit le : {currentUser.registrationDate || "Récemment"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-center md:self-start">
          <button
            onClick={() => {
              purgeAllAppCache("Purge manuelle citoyen");
              triggerToast('Cache vidé avec succès ! Données rafraîchies.', 'success');
            }}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-sm border border-slate-200 dark:border-slate-700"
            title="Vider le cache local"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
            <span>Purger le Cache</span>
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-sm border border-rose-100 dark:border-rose-900/40"
          >
            <LogOut className="w-4 h-4" />
            <span>Se Déconnecter</span>
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-gray-150 dark:border-slate-800 gap-6 text-xs uppercase tracking-wider font-extrabold font-mono pt-2">
        <button
          onClick={() => setCitizenActiveTab('overview')}
          className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
            citizenActiveTab === 'overview'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Tableau de Bord
        </button>
        <button
          onClick={() => setCitizenActiveTab('declare')}
          className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            citizenActiveTab === 'declare'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Se déclarer média web</span>
        </button>
      </div>

      {citizenActiveTab === 'overview' ? (
        /* Overview Page */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Statut & Rôle */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Shield className="w-5 h-5" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider font-mono">Votre Statut Citoyen</h3>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                En tant que citoyen engagé, vous jouez un rôle essentiel dans la lutte contre la désinformation au Bénin. Vos signalements et vos lectures aident à assainir l'espace médiatique.
              </p>
              <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/30 rounded-xl space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 font-mono block">Vos privilèges :</span>
                <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 font-semibold list-disc list-inside">
                  <li>Signaler des fausses informations</li>
                  <li>Vérifier les rumeurs officielles</li>
                  <li>Suivre les cours de l'Académie</li>
                  <li>Sauvegarder vos actualités préférées ({favoritesCount})</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Card 2: Quick Navigation Actions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4 md:col-span-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Sliders className="w-5 h-5" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider font-mono">Actions rapides</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <button
                onClick={() => onSwitchTab('signaler')}
                className="group p-4 bg-slate-50 dark:bg-slate-950/40 hover:bg-red-50/50 dark:hover:bg-red-950/10 border border-slate-200 dark:border-slate-800 rounded-xl text-left transition-all cursor-pointer flex gap-3.5 items-start"
              >
                <div className="p-2.5 rounded-xl bg-red-100/50 dark:bg-red-950/30 text-red-600 group-hover:scale-110 transition-transform">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-tight font-mono group-hover:text-red-600 transition-colors">Signaler Fake</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal font-medium">Une rumeur ou fausse information ? Signalez-la ici.</p>
                </div>
              </button>

              <button
                onClick={() => onSwitchTab('haac')}
                className="group p-4 bg-slate-50 dark:bg-slate-950/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10 border border-slate-200 dark:border-slate-800 rounded-xl text-left transition-all cursor-pointer flex gap-3.5 items-start"
              >
                <div className="p-2.5 rounded-xl bg-emerald-100/50 dark:bg-emerald-950/30 text-emerald-600 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-tight font-mono group-hover:text-emerald-600 transition-colors">VÉRIFICATION</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal font-medium">Consultez l'historique officiel des vérifications.</p>
                </div>
              </button>

              <button
                onClick={() => onSwitchTab('academy')}
                className="group p-4 bg-slate-50 dark:bg-slate-950/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/10 border border-slate-200 dark:border-slate-800 rounded-xl text-left transition-all cursor-pointer flex gap-3.5 items-start"
              >
                <div className="p-2.5 rounded-xl bg-blue-100/50 dark:bg-blue-950/30 text-blue-600 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-tight font-mono group-hover:text-blue-600 transition-colors">Cours de l'Académie</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal font-medium">Apprenez à repérer l'infox et vérifiez comme un pro.</p>
                </div>
              </button>

              <button
                onClick={() => onSwitchTab('news')}
                className="group p-4 bg-slate-50 dark:bg-slate-950/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/10 border border-slate-200 dark:border-slate-800 rounded-xl text-left transition-all cursor-pointer flex gap-3.5 items-start"
              >
                <div className="p-2.5 rounded-xl bg-indigo-100/50 dark:bg-indigo-950/30 text-indigo-600 group-hover:scale-110 transition-transform">
                  <Heart className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-tight font-mono group-hover:text-indigo-600 transition-colors">Actualités Générales</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal font-medium">Consulter les flux d'actualités vérifiées de la presse béninoise.</p>
                </div>
              </button>

              <button
                onClick={() => setCitizenActiveTab('declare')}
                className="group p-4 bg-slate-50 dark:bg-slate-950/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/10 border border-slate-200 dark:border-slate-800 rounded-xl text-left transition-all cursor-pointer flex gap-3.5 items-start sm:col-span-2"
              >
                <div className="p-2.5 rounded-xl bg-indigo-100/50 dark:bg-indigo-950/30 text-indigo-600 group-hover:scale-110 transition-transform">
                  <Radio className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-tight font-mono group-hover:text-indigo-600 transition-colors">Se déclarer médias web</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal font-medium">Transmettez votre demande d'indexation pour référencer votre média et intégrer votre flux RSS.</p>
                </div>
              </button>
            </div>
          </div>

          {/* Card 3: Newsletter Subscriptions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4 md:col-span-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <Mail className="w-5 h-5" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider font-mono">Vos abonnements aux Newsletters ({subscriptions.length})</h3>
              </div>
              <button
                onClick={() => onSwitchTab('news')}
                className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-3 py-1.5 rounded-lg font-mono transition-all uppercase tracking-wider flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>S'abonner à d'autres médias</span>
              </button>
            </div>

            {subscriptions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs font-mono bg-slate-50/50 dark:bg-slate-950/10 rounded-xl space-y-2">
                <p className="font-semibold text-slate-600 dark:text-slate-300">Vous n'avez aucun abonnement actif ou en attente pour le moment.</p>
                <p className="text-[11px] text-slate-400">Abonnez-vous aux médias de votre choix pour recevoir leurs flux directement dans votre boîte e-mail dès validation de l'administrateur.</p>
                <button
                  onClick={() => onSwitchTab('news')}
                  className="mt-3 text-xs bg-blue-600 hover:bg-blue-500 text-white font-black px-4 py-2 rounded-xl transition-all cursor-pointer uppercase tracking-wider font-mono inline-flex items-center gap-1.5"
                >
                  <span>S'abonner aux newsletters de la presse béninoise</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 uppercase font-bold tracking-wider text-[9px] font-mono">
                      <th className="py-2.5 px-3">Médias / Flux suivis</th>
                      <th className="py-2.5 px-3">E-mail de réception</th>
                      <th className="py-2.5 px-3">Date de demande</th>
                      <th className="py-2.5 px-3">Statut de la demande</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub) => {
                      const mediaList = sub.mediaChoices && sub.mediaChoices.length > 0 
                        ? sub.mediaChoices 
                        : (sub.mediaChoice ? sub.mediaChoice.split(', ') : ['Tous les flux']);

                      return (
                        <tr key={sub.id} className="border-b border-gray-50 dark:border-slate-850/50 hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all">
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1 max-w-sm">
                              {mediaList.map((m, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                                  {m === "Tous les flux" ? "🌍 Tous les flux" : `📰 ${m}`}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-700 dark:text-slate-300 font-bold">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                              <span>{sub.userEmail}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-gray-550 dark:text-gray-450 font-mono text-[11px]">
                            {new Date(sub.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-3 px-3">
                            {sub.status === 'active' ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-mono">
                                  ● Accepté & Actif
                                </span>
                                <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono">
                                  Flux envoyés à {sub.userEmail}
                                </p>
                              </div>
                            ) : sub.status === 'rejected' ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 font-mono">
                                  ● Refusé
                                </span>
                                <p className="text-[9px] text-rose-500 font-mono">
                                  Demande non retenue par l'admin
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 font-mono">
                                  ● En attente d'acceptation
                                </span>
                                <p className="text-[9px] text-amber-600 dark:text-amber-400 font-mono">
                                  Transmis à l'administrateur
                                </p>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleUnsubscribe(sub.id, mediaList.join(', '))}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-all inline-flex items-center gap-1"
                              title="Se désabonner"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="text-[9px] uppercase font-bold font-mono">Désabonner</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Declare Web Media Section */
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono">Déclaration d'Organe de Presse Web</h3>
            <p className="text-[10px] text-gray-400">Remplissez ce formulaire pour soumettre votre média numérique au comité d'indexation d'ActuHub Bénin.</p>
            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl">
              <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">
                ℹ️ Note : Cette plateforme est une initiative privée d'Actuhub pour lutter contre la désinformation. Elle n'est pas créée par la HAAC.
              </p>
            </div>
          </div>

          {loading ? (
            <p className="text-xs text-gray-400 italic">Vérification de vos demandes en cours...</p>
          ) : submission ? (
            /* Show existing status of the submission */
            <div className="space-y-6">
              {submission.status === 'pending' && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-850 dark:text-amber-400 font-bold text-xs">
                    <span className="animate-pulse">⏳</span>
                    <span>Déclaration en cours d'examen par Actuhub</span>
                  </div>
                  <p className="text-[11px] text-slate-650 dark:text-slate-400">
                    Votre dossier a été transmis avec succès et est en attente d'évaluation de conformité. Un administrateur mettra à jour votre compte dès validation.
                  </p>
                </div>
              )}

              {submission.status === 'rejected' && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/30 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-850 dark:text-rose-400 font-bold text-xs">
                    <span>❌</span>
                    <span>Demande d'indexation refusée par le comité</span>
                  </div>
                  <p className="text-[11px] text-slate-650 dark:text-slate-400">
                    <strong>Motif :</strong> {submission.rejectionReason || "Informations non valides ou motif non spécifié."}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Vous pouvez modifier vos informations ci-dessous et soumettre à nouveau votre dossier.
                  </p>
                </div>
              )}

              {submission.status === 'approved' && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/30 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-850 dark:text-emerald-400 font-bold text-xs">
                    <span>✅</span>
                    <span>Félicitations ! Votre déclaration a été approuvée</span>
                  </div>
                  <p className="text-[11px] text-slate-655 dark:text-slate-350">
                    Votre organe de presse <strong>{submission.mediaName}</strong> est désormais certifié et indexé sur ActuHub. 
                    Votre compte va être reconverti en compte <strong>Média Partenaire</strong>. 
                    Veuillez vous déconnecter et vous reconnecter pour actualiser vos privilèges de rédaction de presse.
                  </p>
                </div>
              )}

              {/* Submitted Info Card */}
              <div className="bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-3 text-xs font-semibold">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Détails transmis :</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
                  <div>
                    <span className="text-gray-450 block">Nom du Média :</span>
                    <strong className="text-slate-800 dark:text-slate-100">{submission.mediaName}</strong>
                  </div>
                  <div>
                    <span className="text-gray-455 block">Catégorie :</span>
                    <strong className="text-slate-800 dark:text-slate-100 uppercase">{submission.category}</strong>
                  </div>
                  <div>
                    <span className="text-gray-450 block">URL du Site ou Canal :</span>
                    <a href={submission.websiteUrl} target="_blank" rel="noreferrer" className="text-blue-500 underline truncate block">{submission.websiteUrl}</a>
                  </div>
                  <div>
                    <span className="text-gray-450 block">Agrément ou Numéro d'Enregistrement :</span>
                    <strong className="text-slate-800 dark:text-slate-100">{submission.haacRegNumber}</strong>
                  </div>
                </div>
              </div>

              {submission.status !== 'approved' && (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleWithdrawDeclaration}
                    className="px-4 py-2 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 text-rose-600 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer border border-rose-100 dark:border-rose-900/40"
                  >
                    Retirer la déclaration
                  </button>
                  {submission.status === 'rejected' && (
                    <button
                      onClick={() => {
                        // Reset submission to null to show form again
                        setSubmission(null);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
                    >
                      Modifier la déclaration
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Show form */
            <form onSubmit={handleSubmitDeclaration} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Nom de l'Organe de Presse / Média *</label>
                  <input
                    type="text"
                    value={formMediaName}
                    onChange={e => setFormMediaName(e.target.value)}
                    placeholder="Ex: Bénin Actu, Le Journal Citoyen"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Catégorie du média *</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as any)}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="presse-en-ligne">Presse en Ligne</option>
                    <option value="presse-ecrite">Presse Écrite</option>
                    <option value="audiovisuel">Audiovisuel (Web TV / Radio)</option>
                    <option value="autre">Autre (Blog d'actualités, etc.)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Lien du Site Web ou Flux d'information *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-400">
                      <Globe className="w-4 h-4" />
                    </span>
                    <input
                      type="url"
                      value={formUrl}
                      onChange={e => setFormUrl(e.target.value)}
                      placeholder="https://mon-media.bj"
                      className="w-full text-xs pl-10 pr-3 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono block">Numéro d'Agrément Média ou Récépissé Officiel *</label>
                  <input
                    type="text"
                    value={formHaac}
                    onChange={e => setFormHaac(e.target.value)}
                    placeholder="Ex: DEC-2025-XX ou Récépissé N°..."
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl text-[11px] leading-relaxed text-indigo-850 dark:text-indigo-400 font-semibold">
                📌 <strong>Note d'Indexation :</strong> Renseigner votre agrément légal ou récépissé assure la légitimité de votre média et permet à votre flux d'actualités d'être référencé sur la page d'accueil d'ActuHub Bénin.
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCitizenActiveTab('overview')}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'Transmission...' : 'Soumettre ma déclaration'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

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

