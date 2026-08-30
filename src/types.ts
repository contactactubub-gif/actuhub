export interface Article {
  id: string;
  title: string;
  link: string;
  description: string;
  pubDate: Date;
  source: string;
  sourceColor: string;
  sourceIcon: string;
  image: string | null;
  category: string;
  read?: boolean;
}

export interface RSSSource {
  name: string;
  url: string;
  color: string;
  icon: string;
}

export interface ShortVideo {
  id: string;
  title: string;
  channel: string;
  handle: string;
}

export interface FakeNewsReport {
  id: string;
  title: string;
  url?: string;
  category: string; // 'santé' | 'politique' | 'société' | 'finance' | 'autre'
  description: string;
  status: 'pending' | 'fake' | 'misleading' | 'verified'; 
  // 'En cours d'analyse' | 'Vérifié Faux ❌' | 'Misogyne/Trompeur ⚠️' | 'Vrai et Vérifié ✅'
  reason?: string;
  explanation: string;
  date: string;
  reporterName: string;
  upvotes: number;
  level: 'bas' | 'moyen' | 'critique';
}

export interface LessonSection {
  title: string;
  body: string[];
}

export interface LessonPage {
  title: string;
  sections: LessonSection[];
}

export interface LessonExercise {
  title: string;
  instructions: string;
  questions: string[];
  solutionGuide?: string[];
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  difficulty: 'Débutant' | 'Intermédiaire' | 'Avancé';
  summary: string;
  pages: LessonPage[];
  icon: string;
  category?: string;
  publisher?: string; // Name of the media or admin that published it
  publishedAt?: string;
  exercise?: LessonExercise;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface ModeratorPermissions {
  canManageRumors?: boolean;       // Verdict & Modération des Rumeurs
  canManageSubmissions?: boolean;  // Candidatures Média
  canManageCourses?: boolean;      // Formations & Cours Officiels
  canManageCommuniques?: boolean;  // Communiqués Officiels
  canManageAds?: boolean;          // Régie Publicitaire
  canManageUnes?: boolean;         // La UNE des Journaux
  canManageNewsletters?: boolean;  // Abonnements Newsletters
  canManageLegal?: boolean;        // Pages Légales (CGU)
  canManageUsers?: boolean;        // Consulter/Gérer les Comptes Utilisateurs
}

export interface UserProfile {
  id: string;
  email: string;
  lastName?: string;
  firstName?: string;
  phone?: string;
  city?: string;
  fullName: string;
  role: 'simple' | 'media' | 'admin' | 'moderator';
  moderatorPermissions?: ModeratorPermissions;
  mediaName?: string;
  canPublishCourses?: boolean;
  canPublishRumors?: boolean;
  status: 'active' | 'suspended';
  registrationDate: string;
  favorites?: string[];
  lastLoginAt?: string;
}

export interface MediaSubmission {
  id: string;
  mediaName: string;
  email: string;
  websiteUrl: string;
  haacRegNumber: string;
  category: 'presse-ecrite' | 'presse-en-ligne' | 'audiovisuel' | 'autre';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  rejectionReason?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'fake_news' | 'new_article';
  timestamp: string; // ISO string for local persistence
  read: boolean;
  linkId?: string; // ID of rumor or article
  level?: 'bas' | 'moyen' | 'critique'; // level of importance for fake news
}

export interface Communique {
  id: string;
  content: string;
  active: boolean;
  createdAt: string;
}

export interface Advertisement {
  id: string;
  title: string;
  type: 'image' | 'video';
  mediaUrl: string;
  targetUrl: string;
  placement: 'header' | 'sidebar' | 'footer' | 'in_feed' | 'popup' | 'above_rumors' | 'rumors_top' | 'inline';
  placements?: ('header' | 'sidebar' | 'footer' | 'in_feed' | 'popup' | 'above_rumors' | 'rumors_top' | 'inline')[];
  label?: 'publicite' | 'annonce' | 'none';
  active: boolean;
  createdAt: string;
  advertiserName?: string;
  startDate?: string;
  endDate?: string;
  viewsCount?: number;
  clicksCount?: number;
}

export interface JournalFrontPage {
  id: string;
  mediaName: string;       // Name of the media publishing this frontpage
  imageUrl: string;        // Web URL of the newspaper's front page image
  date: string;            // Date of the frontpage (e.g. "2026-06-29")
  title?: string;          // Optional caption or title for this edition
  publishedBy: string;     // Creator profile name or email
  createdAt: string;       // Timestamp ISO string
}

export interface NewsletterSubscription {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  mediaChoice?: string; // name of the source or joined string
  mediaChoices?: string[]; // array of selected media sources
  status: 'pending' | 'active' | 'rejected';
  createdAt: string;
  updatedAt?: string;
  rejectionReason?: string;
  lastDigestSentAt?: string;
}

export interface LegalSection {
  id: string;
  title: string;
  icon?: string; // 'Shield' | 'Lock' | 'Eye' | 'CheckCircle' | 'Scale' | 'Building2' | 'AlertTriangle' | 'HelpCircle' | 'FileText'
  content: string; // Supports asterisk formatting (* for bullets/line breaks, **bold**, *italic*, links)
}

export interface LegalPageData {
  id: 'privacy' | 'terms';
  title: string;
  badge: string;
  subtitle: string;
  lastUpdated: string;
  version: string;
  sections: LegalSection[];
  updatedAt?: string;
  updatedBy?: string;
}


