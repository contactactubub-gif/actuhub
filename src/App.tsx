import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { 
  Newspaper, Play, ShieldAlert, Award, Grid, Menu, X, Sun, Moon, 
  Clock, Heart, Share2, Clipboard, ExternalLink, Trash2, CheckCircle2, ChevronDown, CheckCheck,
  Info, Mail, AlertCircle, CheckCircle, Sliders, User, Search, Loader2, LogOut, Globe
} from 'lucide-react';
import { Article, UserProfile, AppNotification, Communique, Advertisement, ShortVideo } from './types';
import { SEEDED_ARTICLES } from './data/newsData';

// Static imports for performance and instantaneous display
import NewsSection from './components/NewsSection';
import ShortTvSection from './components/ShortTvSection';
import VerificateurHaac from './components/VerificateurHaac';
import FakeNewsSignaler from './components/FakeNewsSignaler';
import DisinformationAcademy from './components/DisinformationAcademy';
import AboutSection from './components/AboutSection';
import ContactSection from './components/ContactSection';
import { LegalPagesWrapper } from './components/LegalPages';
import { AdCarousel } from './components/AdCarousel';
import NotificationsDropdown from './components/NotificationsDropdown';
import AIAssistantPopup from './components/AIAssistantPopup';
import MobileBottomNavbar from './components/MobileBottomNavbar';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { ConfirmationModal, ConfirmationType } from './components/ConfirmationModal';
import { SHORTS_VIDEO_SEEDS } from './data/shortsData';
import { LESSONS } from './data/lessonData';
import actuhubLogo from './assets/images/actuhub-logo.png';
import { ToastEventDetail, triggerToast } from './utils/toast';
import { purgeAllAppCache } from './utils/cacheManager';
import { 
  AuthLockPane, 
  MediaDashboard, 
  AdminDashboard, 
  CitizenDashboard, 
  UserProfileHeaderDropdown, 
  INITIAL_USERS 
} from './components/AuthAndDashboards';
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  signOut,
  doc, 
  getDoc,
  setDoc,
  collection,
  onSnapshot,
  handleDatabaseError,
  handleFirestoreError,
  OperationType,
  supabase,
  supabaseAuth,
  supabaseDb
} from './utils/supabase';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error' | 'heart';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'news' | 'shorts' | 'haac' | 'signaler' | 'academy' | 'about' | 'contact' | 'media-dashboard' | 'admin-dashboard' | 'profile' | 'privacy' | 'terms'>('news');

  // Scroll to top on tab change for better user experience
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);
  const [darkTheme, setDarkTheme] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('actuhub_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (darkTheme) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('actuhub_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('actuhub_theme', 'light');
      }
    } catch (e) {}
  }, [darkTheme]);
  const [menuMobileOpen, setMenuMobileOpen] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false);
  
  // Auth and Session state (Enforced live server interaction)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Shared Favorites, History, Share states
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [shareTarget, setShareTarget] = useState<any | null>(null);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // Live Articles and Rumors for chatbot and verification context
  const [allArticles, setAllArticles] = useState<Article[]>(() => SEEDED_ARTICLES);
  const [allRumors, setAllRumors] = useState<any[]>([]);
  const [allShorts, setAllShorts] = useState<(ShortVideo & { videoId: string })[]>([]);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);

  // Real-time Firestore subscription for video shorts
  useEffect(() => {
    const qShorts = collection(db, "shorts");
    const unsubShorts = onSnapshot(qShorts, (snapshot) => {
      const fetched: (ShortVideo & { videoId: string })[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as any);
      });
      if (fetched.length > 0) {
        setAllShorts(fetched);
      } else {
        // Seed initial shorts to Firestore
        SHORTS_VIDEO_SEEDS.forEach((v) => {
          setDoc(doc(db, "shorts", v.id), v).catch(err => {
            console.warn("Could not seed video to Firestore:", err);
          });
        });
        setAllShorts(SHORTS_VIDEO_SEEDS);
      }
    }, (err) => {
      console.warn("Firestore shorts subscription failed:", err);
      setAllShorts(SHORTS_VIDEO_SEEDS);
    });

    return () => unsubShorts();
  }, []);

  // Global Keyboard Shortcut for Search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [shareSuccess, setShareSuccess] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Confirmation modal dialog state
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
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const triggerConfirm = React.useCallback((options: {
    type?: ConfirmationType;
    title: string;
    message: string;
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
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        await options.onConfirm();
      }
    });
  }, []);

  // Local Notifications system state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const [notifiedRumorIds, setNotifiedRumorIds] = useState<string[]>([]);

  const [selectedReportId, setSelectedReportId] = useState<string | undefined>(undefined);

  // Communiques and advertisements states
  const [communiques, setCommuniques] = useState<Communique[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const trackedViews = useRef<Record<string, boolean>>({});

  const notificationsRef = useRef<AppNotification[]>(notifications);
  const notifiedRumorIdsRef = useRef<string[]>(notifiedRumorIds);

  // Sync notifications to Ref
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  // Sync notified rumor ids to Ref
  useEffect(() => {
    notifiedRumorIdsRef.current = notifiedRumorIds;
  }, [notifiedRumorIds]);

  // Real-time Firestore subscription for notifications on newly verified reports
  useEffect(() => {
    const q = collection(db, "rumeurs");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRumors: any[] = [];
      snapshot.forEach((docSnap) => {
        fetchedRumors.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Update the rumors state for chatbot and verification
      setAllRumors(fetchedRumors);

      if (fetchedRumors.length === 0) return;

      const currentNotified = notifiedRumorIdsRef.current;

      if (currentNotified.length === 0) {
        // First load: seed list of verified rumors without spamming notifications
        const historicallyVerified = fetchedRumors
          .filter(r => r.status !== 'pending')
          .map(r => r.id);
        if (historicallyVerified.length > 0) {
          setNotifiedRumorIds(historicallyVerified);
        }
        return;
      }

      // Find newly verified, important rumors
      const newlyVerified = fetchedRumors.filter(r => {
        const isVerified = r.status !== 'pending';
        const isImportant = r.level === 'critique' || r.level === 'moyen';
        const isAlreadyNotified = currentNotified.includes(r.id);
        return isVerified && isImportant && !isAlreadyNotified;
      });

      if (newlyVerified.length > 0) {
        const currentNotifs = notificationsRef.current;
        let updatedNotifs = [...currentNotifs];
        let hasNew = false;

        newlyVerified.forEach(rumor => {
          if (updatedNotifs.some(n => n.linkId === rumor.id && n.type === 'fake_news')) return;

          const verdictLabel = 
            rumor.status === 'fake' ? 'Vérifié Faux ❌' : 
            rumor.status === 'misleading' ? 'Trompeur ⚠️' : 'Vrai et Vérifié ✅';

          const newNotif: AppNotification = {
            id: `notif-rumor-${rumor.id}-${Date.now()}`,
            title: `🚨 Fact-Checking: ${rumor.title}`,
            message: `La rumeur "${rumor.title}" a été analysée par l'équipe de modération. Verdict : ${verdictLabel}. Cliquez pour voir l'explication complète.`,
            type: 'fake_news',
            timestamp: new Date().toISOString(),
            read: false,
            linkId: rumor.id,
            level: rumor.level
          };

          updatedNotifs = [newNotif, ...updatedNotifs];
          hasNew = true;
          triggerToast(newNotif.title, rumor.status === 'fake' ? 'error' : 'info');
        });

        if (hasNew) {
          setNotifications(updatedNotifs.slice(0, 50));
          setNotifiedRumorIds([...currentNotified, ...newlyVerified.map(r => r.id)]);
        }
      }
    }, (error) => {
      console.warn("Firestore rumeurs real-time snapshot failed in App.tsx:", error);
      try {
        handleFirestoreError(error, OperationType.GET, "rumeurs");
      } catch (e) {}
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore subscription for active communiques and advertisements
  useEffect(() => {
    const qCommuniques = collection(db, "communiques");
    const unsubCommuniques = onSnapshot(qCommuniques, (snapshot) => {
      const fetched: Communique[] = [];
      snapshot.forEach((docSnap) => {
        const item = { id: docSnap.id, ...docSnap.data() } as Communique;
        if (item.active) fetched.push(item);
      });
      fetched.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCommuniques(fetched);
    }, (err) => {
      console.warn("Firestore communiques snapshots failed:", err);
    });

    const qAds = collection(db, "advertisements");
    const unsubAds = onSnapshot(qAds, (snapshot) => {
      const fetched: Advertisement[] = [];
      snapshot.forEach((docSnap) => {
        const item = { id: docSnap.id, ...docSnap.data() } as Advertisement;
        if (item.active) fetched.push(item);
      });
      fetched.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAdvertisements(fetched);
    }, (err) => {
      console.warn("Firestore advertisements snapshots failed:", err);
    });

    return () => {
      unsubCommuniques();
      unsubAds();
    };
  }, []);

  const handleNewArticles = React.useCallback((newArticles: Article[]) => {
    // Merge new articles into state for chatbot context
    setAllArticles((prevArts) => {
      const uniqueMap = new Map<string, Article>();
      // 1. Add previous articles
      prevArts.forEach(item => {
        const key = item.id || item.link || item.title;
        if (key) uniqueMap.set(key, item);
      });
      // 2. Add new articles (overwriting older cached versions)
      newArticles.forEach(item => {
        const key = item.id || item.link || item.title;
        if (key) uniqueMap.set(key, item);
      });
      const merged = Array.from(uniqueMap.values());
      // 3. Sort strictly by publication date descending (newest first)
      merged.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
      return merged;
    });

    setNotifications((prevNotifs) => {
      let updatedNotifs = [...prevNotifs];
      let addedCount = 0;

      newArticles.forEach(article => {
        const notifId = `notif-art-${article.id}`;
        if (updatedNotifs.some(n => n.id === notifId || (n.linkId === article.id && n.type === 'new_article'))) return;

        const newNotif: AppNotification = {
          id: notifId,
          title: `📰 ${article.source}`,
          message: article.title,
          type: 'new_article',
          timestamp: new Date().toISOString(),
          read: false,
          linkId: article.id
        };

        updatedNotifs = [newNotif, ...updatedNotifs];
        addedCount++;
      });

      if (addedCount > 0) {
        if (addedCount === 1) {
          triggerToast(`Nouveau flux d'actualité : "${newArticles[0].title.substring(0, 45)}..."`, 'success');
        } else {
          triggerToast(`📰 ${addedCount} nouvelles actualités béninoises sont disponibles en direct !`, 'success');
        }
      }

      return updatedNotifs.slice(0, 50);
    });
  }, []);

  const handleMarkAllNotificationsAsRead = React.useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    triggerToast("Toutes les notifications ont été marquées comme lues.", "info");
  }, []);

  const handleClearAllNotifications = React.useCallback(() => {
    setNotifications([]);
    triggerToast("Toutes les notifications ont été supprimées.", "info");
  }, []);

  const handleMarkNotificationAsRead = React.useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const handleNotificationClick = React.useCallback((notif: AppNotification) => {
    // Mark as read
    handleMarkNotificationAsRead(notif.id);

    // Route to appropriate tab and active item
    if (notif.type === 'fake_news') {
      if (notif.linkId) {
        setSelectedReportId(notif.linkId);
      }
      setActiveTab('signaler');
    } else if (notif.type === 'new_article') {
      // Just switch to news tab
      setActiveTab('news');
    }
  }, [handleMarkNotificationAsRead]);

  // Toast listener effect
  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastEventDetail>;
      if (customEvent.detail) {
        const id = Math.random().toString(36).substring(2, 9);
        const { message, type } = customEvent.detail;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
        }, 3500);
      }
    };
    window.addEventListener('app-toast', handleToastEvent);
    return () => window.removeEventListener('app-toast', handleToastEvent);
  }, []);

  // Initialize and Sync periodic tasks
  useEffect(() => {
    // Sync current time ticker
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Real-time Firebase Auth session sync with strict server validation
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          let profile: UserProfile | null = null;
          
          try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              profile = docSnap.data() as UserProfile;
            }
          } catch (getDocErr) {
            console.warn("Server getDoc failed on auth state change:", getDocErr);
          }

          const isTargetAdmin = (firebaseUser.email || '').trim().toLowerCase() === 'contactactubub@gmail.com' ||
                                (profile && profile.email && profile.email.trim().toLowerCase() === 'contactactubub@gmail.com');

          // Strict server validation: If user document does not exist on server, revoke session
          if (!profile && !isTargetAdmin) {
            console.warn("User has no active profile in server database. Session revoked.");
            try { await signOut(auth); } catch (_) {}
            setCurrentUser(null);
            setFavorites([]);
            return;
          }

          if (profile && profile.status === 'suspended') {
            console.warn("User profile is suspended. Session revoked.");
            try { await signOut(auth); } catch (_) {}
            setCurrentUser(null);
            setFavorites([]);
            return;
          }

          if (isTargetAdmin) {
            if (profile) {
              profile.role = 'admin';
            } else {
              profile = {
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
                await setDoc(docRef, profile);
              } catch (seedErr) {
                console.error("Could not seed admin profile on server:", seedErr);
              }
            }
          }

          if (profile) {
            // Load favorites from server for signed-in users
            let loadedFavs = profile.favorites || [];
            setFavorites(loadedFavs);

            setCurrentUser(prev => {
              if (!prev || !profile || prev.id !== profile.id || prev.role !== profile.role || prev.status !== profile.status) {
                return profile;
              }
              return prev;
            });
          }
        } catch (err) {
          console.error("Erreur de validation du profil sur le serveur:", err);
          setCurrentUser(null);
          setFavorites([]);
        }
      } else {
        setCurrentUser(null);
        setFavorites([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const toggleTheme = () => {
    setDarkTheme(prev => !prev);
  };

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.favorites) {
      setFavorites(user.favorites);
    }
    // Redirection automatique vers son tableau de bord spécifique
    if (user.role === 'admin' || user.role === 'moderator') {
      setActiveTab('admin-dashboard');
    } else if (user.role === 'media') {
      setActiveTab('media-dashboard');
    } else {
      setActiveTab('profile'); // Espace tableau de bord citoyen
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Erreur lors de la déconnexion Firebase:", err);
    }
    setCurrentUser(null);
    setFavorites([]);
    setActiveTab('news');
    triggerToast('Déconnexion effectuée avec succès. Au plaisir ! 👋', 'info');
  };

  const handleToggleFavorite = React.useCallback(async (id: string) => {
    const isRemoving = favorites.includes(id);

    triggerConfirm({
      type: isRemoving ? 'delete' : 'add',
      title: isRemoving ? "Retirer des favoris ?" : "Ajouter aux favoris ?",
      message: isRemoving 
        ? "Voulez-vous vraiment retirer cet article de votre liste de favoris ?" 
        : "Voulez-vous enregistrer cet article dans votre liste de favoris pour le lire plus tard ?",
      confirmText: isRemoving ? "Retirer des favoris" : "Ajouter aux favoris",
      onConfirm: async () => {
        let updated: string[];
        if (isRemoving) {
          updated = favorites.filter(f => f !== id);
          triggerToast('Article retiré de vos favoris !', 'info');
        } else {
          updated = [...favorites, id];
          triggerToast('Article ajouté à vos favoris avec succès !', 'heart');
        }
        setFavorites(updated);

        if (currentUser) {
          try {
            const docRef = doc(db, 'users', currentUser.id);
            await setDoc(docRef, { favorites: updated }, { merge: true });
            
            // Also update local currentUser state
            const updatedProfile = { ...currentUser, favorites: updated };
            setCurrentUser(updatedProfile);
          } catch (err) {
            console.error("Error saving favorites to Firestore/Supabase:", err);
            handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.id}`);
          }
        }
      }
    });
  }, [favorites, currentUser, triggerConfirm]);

  const handleAddToHistory = React.useCallback((id: string) => {
    if (!history.includes(id)) {
      const updated = [id, ...history];
      setHistory(updated);
    }
  }, [history]);

  const handleClearHistory = () => {
    triggerConfirm({
      type: 'delete',
      title: "Effacer l'historique de lecture ?",
      message: "Voulez-vous vraiment effacer l'intégralité de votre historique de consultation d'articles ?",
      confirmText: "Effacer l'historique",
      onConfirm: () => {
        setHistory([]);
        setHistoryOpen(false);
        triggerToast("L'historique de lecture a été effacé.", "info");
      }
    });
  };

  const openShareModal = React.useCallback((target: any) => {
    setShareTarget(target);
  }, []);

  const closeShareModal = () => {
    setShareTarget(null);
    setShareSuccess(false);
  };

  const handleCopyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      triggerToast('Lien de partage copié dans le presse-papiers !', 'success');
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    });
  };

  const handleTrackAdView = React.useCallback(async (adId: string) => {
    if (trackedViews.current[adId]) return;
    trackedViews.current[adId] = true;
    try {
      const docRef = doc(db, 'advertisements', adId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const currentViews = data.viewsCount || 0;
        await setDoc(docRef, { viewsCount: currentViews + 1 }, { merge: true });
      }
    } catch (err) {
      console.warn("Failed to track ad view:", err);
    }
  }, []);

  const handleTrackAdClick = React.useCallback(async (adId: string) => {
    try {
      const docRef = doc(db, 'advertisements', adId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const currentClicks = data.clicksCount || 0;
        await setDoc(docRef, { clicksCount: currentClicks + 1 }, { merge: true });
      }
    } catch (err) {
      console.warn("Failed to track ad click:", err);
    }
  }, []);

  const renderAdBanner = (placement: 'header' | 'footer' | 'in_feed' | 'popup') => {
    if (activeTab === 'shorts') return null; // Exclude Short TV section

    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-2 animate-fade-in text-left">
        <AdCarousel 
          advertisements={advertisements} 
          placementFilter={placement} 
          autoPlayInterval={3000} 
          onTrackView={handleTrackAdView} 
          onTrackClick={handleTrackAdClick} 
        />
      </div>
    );
  };

  const handleNavigateToAcademy = React.useCallback(() => setActiveTab('academy'), []);
  const handleNavigateToSignaler = React.useCallback(() => setActiveTab('signaler'), []);
  const handleLoginClick = React.useCallback(() => setActiveTab('profile'), []);
  const handleSearchQueryChange = React.useCallback((q: string) => setGlobalSearchQuery(q), []);

  return (
    <div className={`min-h-screen bg-[#f1f3f4] transition-colors duration-300 font-sans xl:pb-0 pb-28 ${darkTheme ? 'bg-[#0f172a] dark text-gray-100' : 'text-slate-900'}`}>
      
      {/* Communiqués Défilants */}
      {activeTab !== 'shorts' && communiques.length > 0 && (
        <div className="bg-rose-600 text-white text-xs py-2 px-4 flex items-center gap-3 border-b border-rose-700 select-none z-50 relative text-left">
          <div className="bg-rose-800 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 animate-pulse flex items-center gap-1 font-mono">
            <span>📢</span> COMMUNIQUÉ
          </div>
          <marquee scrollamount="4.5" className="font-semibold text-[11px] flex-1">
            {communiques.map((c, idx) => (
              <span key={c.id || idx} className="mx-8 font-mono">
                {c.content}
              </span>
            ))}
          </marquee>
        </div>
      )}

      {/* Upper Navigation bar header */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${darkTheme ? 'bg-[#1e293b]/95 border-slate-800 shadow-lg shadow-slate-950/20' : 'bg-white/95 border-slate-200 shadow-sm shadow-slate-200/50'}`}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 h-14 sm:h-16 flex items-center justify-between gap-4">
          
          {/* Logo Group */}
          <div className="flex items-center gap-3 select-none group cursor-pointer" onClick={() => setActiveTab('news')}>
            <div className="flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
              <img 
                src={actuhubLogo} 
                alt="ActuHub Logo" 
                className="w-10 h-10 select-none object-contain rounded-full border border-gray-200 dark:border-slate-700 bg-white shadow-sm"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-0.5 hidden min-[440px]:block">
              <h1 className="text-lg font-black tracking-tighter leading-none text-slate-900 dark:text-slate-100 uppercase">ACTUHUB</h1>
            </div>
          </div>


          {/* Desktop tabs Router buttons */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 h-full font-bold text-xs xl:text-[13px] self-stretch shrink-0">
            <button
              id="tab-news-trigger"
              onClick={() => setActiveTab('news')}
              className={`h-full px-4 border-b-2 font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'news' 
                  ? 'border-blue-600 text-blue-600 bg-blue-50/30 dark:bg-blue-500/5' 
                  : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50/50 dark:hover:bg-slate-800/30'
              }`}
            >
              <Newspaper className="w-4 h-4" />
              <span>Actualités</span>
            </button>
            <button
              id="tab-shorts-trigger"
              onClick={() => setActiveTab('shorts')}
              className={`h-full px-4 border-b-2 font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'shorts' 
                  ? 'border-blue-600 text-blue-600 bg-blue-50/30 dark:bg-blue-500/5' 
                  : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50/50 dark:hover:bg-slate-800/30'
              }`}
            >
              <Play className="w-4 h-4" />
              <span>Shorts TV</span>
            </button>
            <button
              id="tab-haac-trigger"
              onClick={() => setActiveTab('haac')}
              title="Vérificateur d'informations & Registre Média"
              className={`h-full px-4 border-b-2 font-bold transition-all cursor-pointer flex items-center gap-2 relative group ${
                activeTab === 'haac' 
                  ? 'border-blue-600 text-blue-600 bg-blue-50/30 dark:bg-blue-500/5' 
                  : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50/50 dark:hover:bg-slate-800/30'
              }`}
            >
              <CheckCheck className="w-4 h-4" />
              <span>VÉRIFIER</span>
            </button>
            <button
              id="tab-signaler-trigger"
              onClick={() => setActiveTab('signaler')}
              className={`h-full px-4 border-b-2 font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'signaler' 
                  ? 'border-blue-600 text-blue-600 bg-blue-50/30 dark:bg-blue-500/5' 
                  : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50/50 dark:hover:bg-slate-800/30'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Signaler</span>
            </button>
            {currentUser?.role === 'media' && (
              <button
                id="tab-media-trigger"
                onClick={() => setActiveTab('media-dashboard')}
                className={`h-full px-4 border-b-2 font-bold transition-all cursor-pointer flex items-center gap-2 font-mono ${
                  activeTab === 'media-dashboard' 
                    ? 'border-emerald-600 text-emerald-600 bg-emerald-50/30 dark:bg-emerald-500/5' 
                    : 'border-transparent text-emerald-500/80 hover:text-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Média</span>
              </button>
            )}
            {currentUser?.role === 'admin' && (
              <button
                id="tab-admin-trigger"
                onClick={() => setActiveTab('admin-dashboard')}
                className={`h-full px-4 border-b-2 font-bold transition-all cursor-pointer flex items-center gap-2 font-mono ${
                  activeTab === 'admin-dashboard' 
                    ? 'border-rose-600 text-rose-600 bg-rose-50/30 dark:bg-rose-500/5' 
                    : 'border-transparent text-rose-500/80 hover:text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/10'
                }`}
              >
                <Sliders className="w-4 h-4 rotate-90" />
                <span>Admin</span>
              </button>
            )}
          </nav>

          {/* Quick toolbar items */}
          <div className="flex items-center gap-2">
            
            {/* Global Search Trigger Button */}
            <button
              id="trigger-global-search"
              onClick={() => setIsGlobalSearchOpen(true)}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200/80 dark:border-slate-700/60 transition-all cursor-pointer group shadow-2xs"
              title="Moteur de recherche intelligent (⌘K / Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline font-sans font-medium text-[11px]">Rechercher...</span>
              <kbd className="hidden xl:inline-flex items-center gap-0.5 text-[9px] font-mono font-bold bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-400">
                ⌘K
              </kbd>
            </button>

            {/* Clock ticker */}
            <span className="hidden xl:inline-flex items-center gap-1 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>{currentTime || 'Initialisation...'}</span>
            </span>

            {/* Notifications launcher */}
            <NotificationsDropdown 
              notifications={notifications}
              onMarkAllAsRead={handleMarkAllNotificationsAsRead}
              onClearAll={handleClearAllNotifications}
              onMarkAsRead={handleMarkNotificationAsRead}
              onNotificationClick={handleNotificationClick}
              darkTheme={darkTheme}
            />

            {/* Favorites checklist launcher */}
            <button
              id="trigger-favorites-drawer"
              onClick={() => setFavoritesOpen(true)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all relative cursor-pointer"
              title="Favoris"
            >
              <Heart className={`w-4.5 h-4.5 ${favorites.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
              {favorites.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white dark:border-slate-900 animate-fade-in">
                  {favorites.length}
                </span>
              )}
            </button>

            {/* Theme switcher */}
            <button
              id="trigger-theme-toggle"
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer hidden md:flex"
              title={darkTheme ? "Activer le mode clair" : "Activer le mode sombre"}
            >
              {darkTheme ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Account Profile and Logout widgets */}
            <div className="flex items-center gap-2">
              {!currentUser ? (
                <button
                  onClick={() => {
                    setActiveTab('profile');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] sm:text-xs uppercase tracking-widest px-3 sm:px-4 py-2 rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Se connecter</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <UserProfileHeaderDropdown 
                    currentUser={currentUser} 
                    onLogout={handleLogout} 
                    onSwitchTab={setActiveTab} 
                    onOpenFavorites={() => setFavoritesOpen(true)}
                  />
                </div>
              )}
            </div>

            {/* Mobile menu trigger */}
            <button
              id="trigger-menu-mobile"
              onClick={() => setMenuMobileOpen(!menuMobileOpen)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all xl:hidden cursor-pointer"
            >
              {menuMobileOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
            </button>
          </div>

        </div>
      </header>

      {/* Header Advertisement banner */}
      {renderAdBanner('header')}

      {/* Mobile responsive sidebar drawer list */}
      {menuMobileOpen && (
        <div className="fixed inset-0 z-55 xl:hidden flex justify-end">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/45 dark:bg-slate-950/65 backdrop-blur-xs animate-fade-in-backdrop cursor-pointer"
            onClick={() => setMenuMobileOpen(false)}
          />

          {/* Drawer Sheet */}
          <div 
            className={`relative w-full max-w-[320px] sm:max-w-sm h-full shadow-2xl flex flex-col justify-between animate-slide-over overflow-hidden select-none border-l ${
              darkTheme 
                ? 'bg-slate-900 border-slate-800 text-slate-100' 
                : 'bg-white border-gray-150 text-slate-800'
            }`}
          >
            {/* Drawer Header */}
            <div className={`p-4 border-b flex items-center justify-between sticky top-0 z-10 backdrop-blur-md ${
              darkTheme ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-gray-150'
            }`}>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center shrink-0">
                  <img 
                    src={actuhubLogo} 
                    alt="ActuHub Logo" 
                    className="w-8 h-8 select-none object-contain rounded-full border border-gray-200 dark:border-slate-700 bg-white"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h1 className="text-sm font-extrabold tracking-wider leading-none text-slate-850 dark:text-slate-100 uppercase">ACTUHUB</h1>
              </div>

              <button
                onClick={() => setMenuMobileOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Options List */}
            <div className="p-4 flex-1 space-y-1.5 overflow-y-auto">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 block mb-2 font-mono">Navigation principale</span>
              
              <button
                id="mobile-tab-news"
                onClick={() => { setActiveTab('news'); setMenuMobileOpen(false); }}
                className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === 'news' 
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' 
                    : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-slate-800/50'
                }`}
              >
                <Newspaper className="w-4 h-4 shrink-0" />
                <span>Actualités</span>
              </button>

              <button
                id="mobile-tab-shorts"
                onClick={() => { setActiveTab('shorts'); setMenuMobileOpen(false); }}
                className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === 'shorts' 
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' 
                    : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-slate-800/50'
                }`}
              >
                <Play className="w-4 h-4 shrink-0" />
                <span>Shorts TV</span>
              </button>

              <button
                id="mobile-tab-haac"
                onClick={() => { setActiveTab('haac'); setMenuMobileOpen(false); }}
                title="Vérificateur d'informations & Registre Média"
                className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer relative group ${
                  activeTab === 'haac' 
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' 
                    : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-slate-800/50'
                }`}
              >
                <CheckCheck className="w-4 h-4 shrink-0" />
                <span>VÉRIFIER</span>

                {/* Elegant Custom Tooltip */}
                <div className="absolute left-[80px] top-1/2 -translate-y-1/2 ml-2 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none z-50 flex items-center">
                  <div className="w-2.5 h-2.5 bg-slate-950 dark:bg-slate-800 rotate-45 -mr-1.5 border-b border-l border-slate-850 dark:border-slate-700"></div>
                  <div className="bg-slate-950 dark:bg-slate-800 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg whitespace-nowrap shadow-xl border border-slate-850 dark:border-slate-700 tracking-wide">
                    ⚖️ Vérificateur d'informations & Registre Média
                  </div>
                </div>
              </button>

              <button
                id="mobile-tab-signaler"
                onClick={() => { setActiveTab('signaler'); setMenuMobileOpen(false); }}
                className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === 'signaler' 
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' 
                    : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-slate-800/50'
                }`}
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Signalement de Fake News</span>
              </button>

              <button
                id="mobile-tab-academy"
                onClick={() => { setActiveTab('academy'); setMenuMobileOpen(false); }}
                className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === 'academy' 
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' 
                    : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-slate-800/50'
                }`}
              >
                <Award className="w-4 h-4 shrink-0" />
                <span>Académie</span>
              </button>

              <button
                id="mobile-tab-about"
                onClick={() => { setActiveTab('about'); setMenuMobileOpen(false); }}
                className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === 'about' 
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' 
                    : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-slate-800/50'
                }`}
              >
                <Info className="w-4 h-4 shrink-0" />
                <span>À-propos</span>
              </button>

              <button
                id="mobile-tab-contact"
                onClick={() => { setActiveTab('contact'); setMenuMobileOpen(false); }}
                className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === 'contact' 
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' 
                    : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-slate-800/50'
                }`}
              >
                <Mail className="w-4 h-4 shrink-0" />
                <span>Contact</span>
              </button>

              {currentUser?.role === 'media' && (
                <>
                  <div className="h-[1px] bg-gray-100 dark:bg-slate-800/60 my-2.5"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block mb-1 font-mono">Espace Média</span>
                  <button
                    id="mobile-tab-media"
                    onClick={() => { setActiveTab('media-dashboard'); setMenuMobileOpen(false); }}
                    className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      activeTab === 'media-dashboard' 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'text-emerald-550/85 hover:bg-emerald-50 dark:text-emerald-400/90 dark:hover:bg-emerald-950/20'
                    }`}
                  >
                    <Sliders className="w-4 h-4 shrink-0" />
                    <span>Tableau Média</span>
                  </button>
                </>
              )}

              {currentUser?.role === 'admin' && (
                <>
                  <div className="h-[1px] bg-gray-100 dark:bg-slate-800/60 my-2.5"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 block mb-1 font-mono">Administration</span>
                  <button
                    id="mobile-tab-admin"
                    onClick={() => { setActiveTab('admin-dashboard'); setMenuMobileOpen(false); }}
                    className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      activeTab === 'admin-dashboard' 
                        ? 'bg-rose-600 text-white shadow-sm' 
                        : 'text-rose-500/85 hover:bg-rose-50 dark:text-rose-400/90 dark:hover:bg-rose-950/20'
                    }`}
                  >
                    <Sliders className="w-4 h-4 rotate-90 shrink-0" />
                    <span>Administration</span>
                  </button>
                </>
              )}
            </div>

            {/* Bottom Actions Panel */}
            <div className={`p-4 border-t space-y-3 sticky bottom-0 z-10 ${
              darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-150'
            }`}>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 block font-mono">Préférences & Compte</span>
              
              {/* Theme Switcher widget */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/70 dark:bg-slate-950/40 border border-gray-150 dark:border-slate-800">
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 font-mono flex items-center gap-2">
                  {darkTheme ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  <span>Affichage</span>
                </span>
                <button
                  id="trigger-theme-toggle-mobile"
                  onClick={toggleTheme}
                  className="px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-colors"
                >
                  {darkTheme ? 'Clair' : 'Sombre'}
                </button>
              </div>

              {/* Profile/Account details */}
              {!currentUser ? (
                <button
                  id="mobile-login-trigger"
                  onClick={() => {
                    setActiveTab('profile');
                    setMenuMobileOpen(false);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase tracking-widest py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <User className="w-4 h-4" />
                  <span>Se connecter</span>
                </button>
              ) : (
                <div className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-slate-950/40 border border-gray-150 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                      {currentUser.fullName.slice(0, 2)}
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{currentUser.fullName}</p>
                      <span className="inline-block bg-blue-50 dark:bg-slate-900/60 text-blue-600 dark:text-blue-400 text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider font-mono">
                        Rôle: {currentUser.role === 'admin' ? 'Admin 🛡️' : currentUser.role === 'moderator' ? 'Modérateur 🛡️' : currentUser.role === 'media' ? 'Média 🎙️' : 'Citoyen 🧑'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-wider font-mono">
                    <button
                      onClick={() => {
                        setFavoritesOpen(true);
                        setMenuMobileOpen(false);
                      }}
                      className="flex items-center justify-center gap-1.5 p-2 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-gray-150 dark:border-slate-800 text-slate-700 dark:text-slate-350 rounded-xl cursor-pointer"
                    >
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                      <span>Favoris</span>
                    </button>
                    <button
                      onClick={() => {
                        setHistoryOpen(true);
                        setMenuMobileOpen(false);
                      }}
                      className="flex items-center justify-center gap-1.5 p-2 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/20 border border-gray-150 dark:border-slate-800 text-slate-700 dark:text-slate-350 rounded-xl cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Historique</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      handleLogout();
                      setMenuMobileOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-colors border border-rose-200/60 dark:border-rose-900/50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Se déconnecter</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main router view window */}
      <main className={activeTab === 'shorts' ? "w-full px-0 py-0 h-[calc(100vh-80px)] min-h-[500px] flex flex-col overflow-hidden" : "w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-6 md:py-10 min-h-[500px] transition-all duration-300"}>
        {activeTab === 'news' && (
          <NewsSection 
            favorites={favorites} 
            toggleFavorite={handleToggleFavorite}
            openShareModal={openShareModal}
            history={history}
            addToHistory={handleAddToHistory}
            onNavigateToAcademy={handleNavigateToAcademy}
            onNavigateToSignaler={handleNavigateToSignaler}
            onNavigateToVerify={() => setActiveTab('haac')}
            onNewArticles={handleNewArticles}
            searchQuery={globalSearchQuery}
            onSearchQueryChange={handleSearchQueryChange}
            advertisements={advertisements}
            onTrackView={handleTrackAdView}
            onTrackClick={handleTrackAdClick}
            currentUser={currentUser}
            onLoginClick={handleLoginClick}
            allShorts={allShorts}
          />
        )}

        {/* Publicly accessible sections without mandatory login */}
        {activeTab === 'shorts' && (
          <ShortTvSection 
            favorites={favorites} 
            toggleFavorite={handleToggleFavorite}
            openShareModal={openShareModal}
            searchQuery={globalSearchQuery}
            allShorts={allShorts}
          />
        )}

        {activeTab === 'haac' && (
          <VerificateurHaac 
            onNavigateToSignaler={handleNavigateToSignaler} 
            currentUser={currentUser}
            onLoginClick={() => setActiveTab('profile')}
            advertisements={advertisements}
            onTrackView={handleTrackAdView}
            onTrackClick={handleTrackAdClick}
          />
        )}

        {activeTab === 'signaler' && (
          <FakeNewsSignaler 
            initialActiveReportId={selectedReportId} 
            searchQuery={globalSearchQuery}
            onSearchQueryChange={setGlobalSearchQuery}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'academy' && (
          <DisinformationAcademy 
            currentUser={currentUser} 
            onLoginClick={() => setActiveTab('profile')}
            advertisements={advertisements}
            onTrackView={handleTrackAdView}
            onTrackClick={handleTrackAdClick}
          />
        )}

        {activeTab === 'about' && (
          <AboutSection />
        )}

        {activeTab === 'contact' && (
          <ContactSection />
        )}

        {(activeTab === 'privacy' || activeTab === 'terms') && (
          <LegalPagesWrapper 
            activeTab={activeTab} 
            onSwitchTab={setActiveTab} 
            currentUser={currentUser}
            isAdmin={currentUser?.role === 'admin' || (currentUser?.email || '').toLowerCase() === 'contactactubub@gmail.com' || (currentUser?.email || '').toLowerCase().includes('admin')}
          />
        )}

        {/* Unified Role dashboards - Accessible securely */}
        {activeTab === 'media-dashboard' && (
          currentUser?.role === 'media' ? (
            <MediaDashboard currentUser={currentUser} onLogout={handleLogout} />
          ) : (
            <div className="bg-rose-50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs font-mono rounded-2xl p-8 text-center">
              Accès réservé exclusivement aux comptes de type Média Certifié.
            </div>
          )
        )}

        {activeTab === 'admin-dashboard' && (
          currentUser?.role === 'admin' ? (
            <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />
          ) : (
            <div className="bg-rose-50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs font-mono rounded-2xl p-8 text-center">
              Accès réservé exclusivement aux Administrateurs système.
            </div>
          )
        )}

        {activeTab === 'profile' && (
          !currentUser ? (
            <AuthLockPane onLogin={handleLogin} requestedTabName="Mon Compte ActuHub" />
          ) : (
            currentUser.role === 'admin' ? (
              <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />
            ) : currentUser.role === 'media' ? (
              <MediaDashboard currentUser={currentUser} onLogout={handleLogout} />
            ) : (
              <CitizenDashboard 
                currentUser={currentUser} 
                onLogout={handleLogout} 
                onSwitchTab={setActiveTab} 
                favoritesCount={favorites.length}
              />
            )
          )
        )}
      </main>

      {/* Footer Advertisement banner */}
      {renderAdBanner('footer')}

      {/* Official Platform Footer */}
      <footer id="official-platform-footer" className="mt-12 border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 dark:text-slate-400 font-sans">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1.5">
              <span>© 2026 <strong>ActuHub Bénin</strong>. Tous droits réservés.</span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
              <button
                type="button"
                onClick={() => setActiveTab('privacy')}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer font-medium underline decoration-slate-300 dark:decoration-slate-700 underline-offset-2"
              >
                Politique de Confidentialité
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <button
                type="button"
                onClick={() => setActiveTab('terms')}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer font-medium underline decoration-slate-300 dark:decoration-slate-700 underline-offset-2"
              >
                Conditions Générales d'Utilisation
              </button>
            </div>

          </div>
        </div>
      </footer>



      {/* Share popup modal */}
      {shareTarget && (
        <div id="modal-share" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeShareModal}></div>
          <div className={`relative w-full max-w-sm rounded-[24px] border shadow-2xl p-6 z-10 transition-colors animate-fade-in ${darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-150'}`}>
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                <Share2 className="w-4 h-4" /> Partager l'actualité
              </h3>
              <button onClick={closeShareModal} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 p-1 rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target card preview */}
            <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 flex gap-3 text-xs leading-normal">
              {shareTarget.image && (
                <img src={shareTarget.image} alt="" className="w-14 h-14 rounded-lg object-cover" />
              )}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-blue-600 block uppercase tracking-wider">{shareTarget.source}</span>
                <span className="font-extrabold text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug">{shareTarget.title}</span>
              </div>
            </div>

            {/* Sharing Social channels button grid */}
            <div className="grid grid-cols-4 gap-3 mt-5">
              {navigator.share && (
                <button
                  onClick={() => {
                    navigator.share({
                      title: shareTarget.title,
                      text: shareTarget.title,
                      url: shareTarget.link,
                    }).catch(console.error);
                    closeShareModal();
                  }}
                  className="flex flex-col items-center gap-1.5 group select-none text-[9px] font-extrabold tracking-tight uppercase"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white cursor-pointer transition-transform group-hover:scale-105">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <span className="text-gray-500 dark:text-gray-400">Partager</span>
                </button>
              )}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareTarget.title + ' ' + shareTarget.link)}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-1.5 group select-none text-[9px] font-extrabold tracking-tight uppercase"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white text-lg cursor-pointer transition-transform group-hover:scale-105">
                  <Play className="w-4 h-4 fill-white" />
                </div>
                <span className="text-gray-500 dark:text-gray-400">WhatsApp</span>
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareTarget.link)}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-1.5 group select-none text-[9px] font-extrabold tracking-tight uppercase"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white text-lg cursor-pointer transition-transform group-hover:scale-105">
                  f
                </div>
                <span className="text-gray-500 dark:text-gray-400">Facebook</span>
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTarget.title)}&url=${encodeURIComponent(shareTarget.link)}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-1.5 group select-none text-[9px] font-extrabold tracking-tight uppercase"
              >
                <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 hover:bg-black/90 flex items-center justify-center text-white text-lg cursor-pointer transition-transform group-hover:scale-105">
                  X
                </div>
                <span className="text-gray-500 dark:text-gray-400">Twitter</span>
              </a>
              <button
                onClick={() => handleCopyToClipboard(shareTarget.link)}
                className="flex flex-col items-center gap-1.5 group select-none text-[9px] font-extrabold tracking-tight uppercase cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-gray-500 hover:bg-gray-600 flex items-center justify-center text-white text-lg transition-transform group-hover:scale-105">
                  <Clipboard className="w-4 h-4" />
                </div>
                <span className="text-gray-500 dark:text-gray-400">Copier</span>
              </button>
            </div>

            {shareSuccess && (
              <div id="share-copied-feedback" className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 text-center text-emerald-800 text-[10px] font-semibold flex items-center justify-center gap-1 animate-fade-in shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Lien copié dans le presse-papiers avec succès !</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Reading History list drawer */}
      {historyOpen && (
        <div id="drawer-history" className="fixed inset-0 z-50 flex justify-end">
          <div 
            id="history-overlay" 
            onClick={() => setHistoryOpen(false)} 
            className="absolute inset-0 bg-black/45 backdrop-blur-xs"
          />
          <div className={`relative w-full max-w-sm h-full shadow-2xl p-6 flex flex-col justify-between z-10 transition-colors ${darkTheme ? 'bg-slate-900' : 'bg-white'}`}>
            <div className="space-y-4 overflow-y-auto pr-1">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 font-mono">
                  <Clock className="w-4.5 h-4.5" /> Historique de Lecture
                </h3>
                <button onClick={() => setHistoryOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 p-1 rounded-lg cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-12 text-gray-400 space-y-2">
                  <Clock className="w-10 h-10 mx-auto opacity-30" />
                  <p className="text-[11px] font-medium leading-normal">Vous n'avez ouvert aucun article récemment.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Articles consultés ({history.length})</p>
                  <div className="space-y-2.5">
                    {/* Render matching history items */}
                    {history.map(id => {
                      // Attempt to retrieve title details (just mockup list since we only have IDs)
                      return (
                        <div id={`hist-row-${id}`} key={id} className="p-2.5 rounded-xl bg-gray-50/50 dark:bg-slate-950/40 border border-gray-100 dark:border-slate-800 text-[11px] font-semibold text-gray-800 dark:text-gray-200 line-clamp-2">
                          ID: {id} - Consulté en temps réel.
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {history.length > 0 && (
              <button
                id="clear-all-history"
                onClick={handleClearHistory}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-2xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Effacer l'Historique</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Global Favorites checklist drawer */}
      {favoritesOpen && (
        <div id="drawer-favorites" className="fixed inset-0 z-50 flex justify-end">
          <div 
            id="fav-overlay" 
            onClick={() => setFavoritesOpen(false)} 
            className="absolute inset-0 bg-black/45 backdrop-blur-xs"
          />
          <div className={`relative w-full max-w-sm h-full shadow-2xl p-6 flex flex-col justify-between z-10 transition-colors ${darkTheme ? 'bg-slate-900' : 'bg-white'}`}>
            <div className="space-y-4 overflow-y-auto pr-1">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5 font-mono">
                  <Heart className="w-4.5 h-4.5 fill-rose-500 text-rose-500" /> Mes Favoris
                </h3>
                <button onClick={() => setFavoritesOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 p-1 rounded-lg cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {favorites.length === 0 ? (
                <div className="text-center py-12 text-gray-400 space-y-2">
                  <Heart className="w-10 h-10 mx-auto opacity-30 text-rose-500" />
                  <p className="text-[11px] font-medium leading-normal">Aucun article enregistré pour plus tard.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Favoris sauvegardés ({favorites.length})</p>
                  <div className="space-y-2.5">
                    {favorites.map(id => {
                      return (
                        <div id={`fav-row-${id}`} key={id} className="p-3 rounded-xl bg-gray-50/50 dark:bg-slate-950/40 border border-gray-100 dark:border-slate-800 text-[11px] font-semibold text-gray-800 dark:text-gray-200 flex items-center justify-between gap-3">
                          <span className="line-clamp-2">ID Article: {id}</span>
                          <button 
                            id={`fav-del-${id}`}
                            onClick={() => handleToggleFavorite(id)}
                            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                            title="Supprimer des favoris"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              id="close-favorites-drawer"
              onClick={() => setFavoritesOpen(false)}
              className="w-full bg-gray-900 dark:bg-slate-850 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-2xl transition-colors cursor-pointer"
            >
              Fermer favoris
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Toast Notifications Layer */}
      <div id="toast-overlay-container" className="fixed bottom-5 right-5 z-50 max-w-sm w-full space-y-3 pointer-events-none px-4 sm:px-0">
        {toasts.map(toast => {
          let icon = <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />;
          let bgColor = 'bg-white dark:bg-zinc-900 border-emerald-100 dark:border-emerald-950/80';
          let textColor = 'text-slate-800 dark:text-gray-100';

          if (toast.type === 'info') {
            icon = <Info className="w-4 h-4 text-blue-500 shrink-0" />;
            bgColor = 'bg-white dark:bg-zinc-900 border-blue-100 dark:border-blue-950/80';
          } else if (toast.type === 'error') {
            icon = <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />;
            bgColor = 'bg-white dark:bg-zinc-900 border-red-150 dark:border-red-950/80';
          } else if (toast.type === 'heart') {
            icon = <Heart className="w-4 h-4 text-rose-500 fill-rose-500 shrink-0 animate-pulse" />;
            bgColor = 'bg-white dark:bg-zinc-900 border-rose-150 dark:border-rose-950/80';
          }

          return (
            <div 
              key={toast.id}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border shadow-xl ${bgColor} ${textColor} text-xs font-bold leading-normal animate-fade-in pointer-events-auto transform transition-all hover:scale-[1.02]`}
            >
              {icon}
              <span className="flex-1">{toast.message}</span>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer p-0.5 rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Publicité Popup d'entrée */}
      {!popupDismissed && advertisements.some(ad => (ad.placement === 'popup' || ad.placements?.includes('popup')) && ad.active) && (
        (() => {
          const popupAd = advertisements.find(ad => (ad.placement === 'popup' || ad.placements?.includes('popup')) && ad.active)!;
          return (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-55 flex items-center justify-center p-4 animate-fade-in text-left">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full relative overflow-hidden shadow-2xl space-y-4">
                <button 
                  onClick={() => setPopupDismissed(true)}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-pointer transition-colors z-10"
                  title="Fermer la publicité"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="space-y-1 pr-6">
                  <span className="bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full font-mono">
                    🔥 RECOMMANDÉ
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100">
                    {popupAd.title}
                  </h3>
                  {popupAd.advertiserName && (
                    <p className="text-[10px] text-gray-400 font-mono">
                      Annonceur: {popupAd.advertiserName}
                    </p>
                  )}
                </div>

                {/* Ad media */}
                <div className="aspect-video w-full rounded-2xl bg-slate-950 overflow-hidden border border-slate-150 dark:border-slate-800 relative flex items-center justify-center">
                  {popupAd.type === 'image' ? (
                    <img 
                      src={popupAd.mediaUrl} 
                      alt={popupAd.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full relative flex items-center justify-center bg-slate-900 text-white">
                      {popupAd.mediaUrl.includes('youtube.com') || popupAd.mediaUrl.includes('youtu.be') || popupAd.mediaUrl.includes('/embed/') ? (
                        <iframe 
                          src={`${popupAd.mediaUrl}?autoplay=1&mute=1&loop=1`} 
                          title={popupAd.title}
                          className="w-full h-full absolute inset-0 border-0 pointer-events-none" 
                        />
                      ) : (
                        <video src={popupAd.mediaUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    onClick={() => setPopupDismissed(true)}
                    className="flex-1 py-2 px-3 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[11px] cursor-pointer transition-all text-center"
                  >
                    Fermer
                  </button>
                  <a
                    href={popupAd.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      handleTrackAdClick(popupAd.id);
                      setPopupDismissed(true);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] py-2 px-3 rounded-xl transition-all cursor-pointer shadow-sm text-center flex items-center justify-center gap-1"
                  >
                    <span>Visiter</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                
                {/* Track view within popup rendering */}
                <PopupTracker adId={popupAd.id} onTrackView={handleTrackAdView} />
              </div>
            </div>
          );
        })()
      )}

      {/* Floating Chatbot Assistant */}
      <AIAssistantPopup 
        articles={allArticles}
        rumors={allRumors}
        currentTab={activeTab}
        userProfile={currentUser}
        darkTheme={darkTheme}
        onNavigateToTab={setActiveTab}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        favoritesCount={favorites.length}
        setFavoritesOpen={setFavoritesOpen}
        favoritesOpen={favoritesOpen}
        darkTheme={darkTheme}
        currentUser={currentUser}
      />

      {/* Global Advanced Unified Search Modal */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        articles={allArticles}
        videos={SHORTS_VIDEO_SEEDS}
        rumors={allRumors}
        courses={LESSONS}
        frontpages={[]}
        onSelectResult={(item) => {
          if (item.type === 'article' || item.type === 'frontpage') {
            setActiveTab('news');
            setGlobalSearchQuery(item.title);
          } else if (item.type === 'video') {
            setActiveTab('shorts');
          } else if (item.type === 'rumor') {
            setActiveTab('haac');
          } else if (item.type === 'course') {
            setActiveTab('academy');
          }
        }}
      />

      {/* Global Confirmation Modal Dialog for User Actions */}
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

interface AdBannerInnerProps {
  ad: Advertisement;
  onTrackView: (id: string) => void;
  onTrackClick: (id: string) => void;
}

export function AdBannerInner({ ad, onTrackView, onTrackClick }: AdBannerInnerProps) {
  useEffect(() => {
    onTrackView(ad.id);
  }, [ad.id, onTrackView]);

  const getLabelText = () => {
    if (ad.label === 'publicite') return 'Publicité';
    if (ad.label === 'annonce') return 'Annonce';
    if (ad.label === 'none') return '';
    return 'Publicité'; // Default fallback
  };

  const labelText = getLabelText();

  return (
    <a 
      href={ad.targetUrl} 
      target="_blank" 
      rel="noopener noreferrer" 
      onClick={() => onTrackClick(ad.id)}
      className="group block overflow-hidden rounded-3xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all relative"
    >
      {ad.type === 'image' ? (
        <div className="relative min-h-[160px] sm:min-h-[200px] md:min-h-[240px] max-h-[380px] w-full bg-slate-950 flex items-center justify-center overflow-hidden">
          {/* Ambient Blurred Background to fill letterboxing without cropping main ad */}
          <img 
            src={ad.mediaUrl} 
            alt="" 
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-xl opacity-35 scale-110 pointer-events-none"
            referrerPolicy="no-referrer"
          />
          {/* Real Size Original Aspect-Ratio Image */}
          <img 
            src={ad.mediaUrl} 
            alt={ad.title} 
            className="relative z-10 max-h-[360px] w-auto max-w-full object-contain mx-auto transition-transform duration-500 group-hover:scale-[1.01]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3 sm:p-5 z-20">
            <div className="space-y-0.5">
              <span className="text-[10px] sm:text-xs font-black text-white drop-shadow-sm uppercase font-mono tracking-wider block">
                {labelText ? `📢 ${labelText}: ` : '📢 '}{ad.title}
              </span>
              {ad.advertiserName && (
                <span className="text-[8px] sm:text-[9px] text-gray-300 font-mono tracking-wide block">
                  Annonceur: {ad.advertiserName}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative min-h-[160px] sm:min-h-[200px] md:min-h-[240px] max-h-[380px] w-full bg-black flex items-center justify-center overflow-hidden">
          {ad.mediaUrl.includes('youtube.com') || ad.mediaUrl.includes('youtu.be') || ad.mediaUrl.includes('/embed/') ? (
            <iframe 
              src={`${ad.mediaUrl}?autoplay=1&mute=1&loop=1`} 
              title={ad.title}
              className="w-full h-[220px] sm:h-[280px] border-0 pointer-events-none scale-[1.1]" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <video src={ad.mediaUrl} className="w-full h-full max-h-[360px] object-contain" autoPlay muted loop playsInline />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3 sm:p-5 z-20">
            <div className="space-y-0.5">
              <span className="text-[10px] sm:text-xs font-black text-white drop-shadow-sm uppercase font-mono tracking-wider block">
                {labelText ? `🎥 ${labelText}: ` : '🎥 '}{ad.title}
              </span>
              {ad.advertiserName && (
                <span className="text-[8px] sm:text-[9px] text-gray-300 font-mono tracking-wide block">
                  Annonceur: {ad.advertiserName}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      {labelText && (
        <span className="absolute top-2.5 right-3 bg-slate-900/80 backdrop-blur-sm text-[8px] font-black text-white uppercase tracking-widest px-2 py-0.5 rounded-full font-mono">
          {labelText}
        </span>
      )}
    </a>
  );
}

interface PopupTrackerProps {
  adId: string;
  onTrackView: (id: string) => void;
}

export function PopupTracker({ adId, onTrackView }: PopupTrackerProps) {
  useEffect(() => {
    onTrackView(adId);
  }, [adId, onTrackView]);
  return null;
}
