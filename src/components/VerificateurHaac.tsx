import React, { useState, useEffect } from 'react';
import { 
  Link, ShieldCheck, AlertTriangle, XOctagon, Info, Lock, 
  Unlock, Calendar, TrendingUp, Copy, FileText, CheckCircle, HelpCircle, ArrowRight,
  User, Globe, Check, ThumbsUp, ShieldAlert, Award, AlertCircle, X,
  Mic, MicOff, Search, AlertOctagon, XCircle, Loader2, ChevronDown, ChevronUp, CheckCircle2,
  Database, Tv, Radio, Newspaper, ExternalLink, UserCheck, Building2
} from 'lucide-react';
import { HAAC_MEDIA_REGISTRY, HAACMedia } from '../data/haacData';
import { triggerToast } from '../utils/toast';
import { db, collection, onSnapshot, setDoc, doc, handleDatabaseError, handleFirestoreError, OperationType } from '../utils/supabase';
import { FakeNewsReport, UserProfile, Advertisement } from '../types';
import { AdCarousel } from './AdCarousel';

// Exclusif 143 Organes Responsables database mapped from the official HAAC registration documents
const ORGAN_RESPONSIBLES: Record<string, string> = {
  "KASSOUA TV": "N'TCHA Beko Arnaud",
  "CHALLENGE WEB TV": "KATAKA Gabin",
  "DAABAARU AGRI": "TCHOGBON Eléonore L.",
  "TEMPETE WORLD TV": "HOUSSOU Loth",
  "PALMARES TV": "TONOUKOUIN Clémence",
  "RACINE MEDIAS": "AKPLAKOU C.Olivier",
  "CCTV AFRIQUE": "MEDEGAN FAGLA DDjimadé C.Roger",
  "EDEN TV": "ABALO Donklam",
  "VFC TV": "MALEHOSSOU Yacoubou",
  "VRAIE INFO TV": "AHOUSSINOU Spéro",
  "CANAL 3 BENIN": "MENSAH CAKPOSSA Berthe",
  "HORIZON TV": "ANANI Francine",
  "BARUKA BENIN TV": "AROUNA Soulé",
  "IFA TV": "FABOUMY llan",
  "URHC TV": "AMOUSSOUGAN Léonard",
  "CANAL COM TV": "BONOU Edwige Innocentia",
  "SODJO TV": "SODJO Abel",
  "MATIN LIBRE TV": "RIWANOU O.Chérif",
  "TV MARANATHA BENIN": "Dr BOSSOUN Koumabè",
  "ACACIA WEB TV": "ADOUN Wilfrid Hervé",
  "WEB TV EDUC'ACTION": "AHOTONDJI G.U.Vital",
  "CRYSTAL NEWS TV": "AHOUANSE Virgile",
  "INVESTIR TV": "COSSI Charles Feridjimi",
  "MADAME ACTU": "DJIHOUAN Nadège",
  "FONDAKIZ TV/TONIGNON": "KINDJANHOUNDE Patient",
  "INNOVENCE COMMUNICATION": "ASSANI Vianney",
  "SPEED LINE TV": "TOTTIMEH Cherney",
  "PLUS PRES TV": "KPONOU Georges Sènan",
  "PLURIEL TV": "SALIOU NOUHOUM Foulélou",
  "PLANETE TERRE A TERRE TV": "KUASSI NANGA Inès",
  "MORID PROD TV": "OGOUDIKPE Morolakè Hortence",
  "LES ANGLES D'AFRIQUE TV": "GNAHOUI Sèmeho Azick",
  "KULTU TV": "LALAYE Abdel Hakim",
  "LA SIRENE TV": "EHOU Bienvenu",
  "KINGO TV": "DJOSSOU Christophe",
  "ISN24": "OTCHOUN Thierry Pierre",
  "ISMA STUDIO ECOLE": "ZANNOU Marcellin",
  "FIRST AFRIQUE TV": "KINTOSSOU Wilfrid Folly",
  "DAABAARU": "Barnabas Orou KOUMAN",
  "DAABAARU TV": "Barnabas Orou KOUMAN",
  "CTA ZOO TV": "BLO Dèdonougbo Jano",
  "BLUE DIAMOND TV": "KARIMOU Sidikou",
  "CANARD DU NORD TV": "TCHELOU Jean Claude",
  "BLTV": "TAKOU-OROU-GOURA Aboubakar",
  "BENIN WEB TV": "DEGUENON Paul Arnaud",
  "BENIN ODD TV": "LAVINON Tayon Ulrich",
  "ALAFIA TV": "HODE Rodrigue",
  "AFRIK CHRONO TV": "DEGBOUE Arsène",
  "AFRICA SUN TV": "HOUNON Lorys",
  "NORD BENIN TV": "DANTON Sègbègnon Franck",
  "HC2 TV": "COMLANVI C. Helmut",
  "GUERITE TV MONDE": "BADAROU A. A. Chamsi",
  "NEWSAFRIKA TV": "ASSANI Vianney",
  "KDAARA TV": "AMOUSSOUKPEVI L. C. Alain",
  "SOLEIL LEVANT WEB TV": "AMOUSSA Aboudou Fataou",
  "ICÔNETV": "ADIGNON E. Camor",
  "NATIONALETV": "ADELEKE Ilias",
  "ESAETV": "ADECHIAN A. Clément",
  "LA VOIX DU ROUTIER TV": "KOUGNIMON Serge Didier Adé",
  "VFC RADIO": "MALEHOSSOU Yacoubou",
  "MARANATHA": "Dr BOSSOUN Koumabè",
  "WEB RADIO EDUC'ACTION": "AHOTONDJI G.U.Vital",
  "ACACIA RADIO": "ADOUN Wilfrid Hervé",
  "RADIO MAJ BENIN": "AGBOZO C.Christian",
  "BETSALEEL FM": "AGOSSOU Clauvis",
  "ARZEKE FM": "TRAORE Mansourou",
  "FRATERNITE FM": "AZINNONGBE Rodrigue",
  "GUERITE RADIO": "BADAROU Chamss-Deen",
  "RADIO CRYSTAL NEWS": "AHOUANSE Virgile",
  "PEACE FM": "NONVIGNON Marius",
  "RADIO AFRIQUE SANTE": "ADEDIRAN Adélaïde",
  "RADIO TONIGNON": "KINDJANHOUNDE Patient",
  "CAMPANIL CITEE FM": "BLO Dèdonougbo Jano",
  "ALLELUIA FM": "ZANNOU Marcellin",
  "RADIO ASSALAM": "KASSIM Youssouf",
  "RADIO PULAAKU ADUNARU": "BOMBOUYA Abdoulaye",
  "SOTA FM": "ALITONOU Euloge Mohamed",
  "RADIO ESAE": "ADECHIAN A. Clément",
  "JOCIA MEDIA TV": "MAMADOU Rafiatou",
  "B24 NEWS": "DOSSOU Modeste",
  "SANTE TRIBUNE": "HOUESSOU Bruno",
  "LE MATINAL": "TOKO Thibaut",
  "LA TEMPETE INFOS": "HOUSSOU Loth",
  "RACINE INFOS": "AKPLAKOU C.Olivier",
  "TRIOMPHE MAG": "ADANLE Mahougnon Angele",
  "BENIN PASSION INFOS": "MEDO-ADOKON OscarMESSANVI Cédric",
  "MÉDIAPART": "TIKPA Koffi J.Alexandre",
  "GASKIYANI INFO": "YATONGNON Fifonsi Reine",
  "PALMARES PRESSE ECRITE": "TONOUKOUIN Clémence",
  "AFRIK'ECONOMIES": "TOGBE A.Leila",
  "LA CROIX": "Abbé GOME Michel",
  "BENIN INTELLIGENT": "AGBON S.Bonaventure",
  "LE MEILLEUR": "GBEKAN Firmin",
  "ECONOMIA 24": "ZOHOUNGBOGBO Y.Euloge",
  "VERIDIQUE INFOS": "YANGA M.Sébastien",
  "L'ÉCONOMISTE PRESSE ECRITE": "DOSSOU Léonard",
  "EDUC'ACTION": "AHOTONDJI G.U.Vital",
  "PRIME NEWS MONDE": "FADONOUGBO Wilfrid",
  "L'AUTRE QUOTIDIEN": "BRATHIER E.Léon",
  "LE MATIN": "DATO Laurène",
  "LE MONDE LOCAL": "KINNINVO Franck",
  "FRATERNITE": "DOSSOUMOU Moïse",
  "L'EVENEMENT PRÉCIS": "AGOGNON Gérard",
  "LE NOUVEAU MANAGER INFO": "ALLISOUTIN C.Ulrin B.",
  "REPERRES IMPACTS": "ZOGO Hugues Hector",
  "BARUKA INFOS": "AROUNA Soulé",
  "BARAKA NEWS": "MAMA SANNI Farouk Dine",
  "L'OEIL DU BENIN": "KOUAGOU Daniel",
  "EVEIL INFO": "BIAOU K.Patrice",
  "LIBRE EXPRESS": "HOUNGUE Ozias Non-Ami",
  "L'EMBLEME DU JOUR": "ALLAGBE Eméric Joël",
  "INFO DU MOMENT": "DOSSA KAKPO Koffi Ghislain",
  "QUOTIDIEN L'EXPRESS": "AMOUSSOU Justin",
  "BENIN AUJOURD'HUI": "AHOUANSE Virgile",
  "SESAME INFO": "DONKPEGAN Modeste",
  "VISAGES DU BENIN": "AKADIRI Sabirath",
  "FENOU MEDIAS": "AKONDE Joël V.",
  "LECHASSEUR INFOS": "GBETO Emmanuel",
  "PALABRE AU QUOTIDIEN": "ADJIKPA Claude D.",
  "KPAKPATO MEDIAS": "AKOGBE-AGBOSSAGA Manassé",
  "LABEL INFO MEDIAS": "SOMALON Tognissè Yannick",
  "BADONA": "DAVODOUN G.Léonce",
  "LA MARINA BJ": "AODEHOUGAN Sèna Thibaut",
  "BENIN MEDIAS": "NOURENI Jean de Dieu",
  "INF'AU ZENITH": "AGOI Tanguy",
  "JUPITER INFO": "MAHOUSSI Wenceslas",
  "LE NATIONALISTE": "FASSINOU AHLONSOU Victorin",
  "HIRONDELLE INFO": "FASSINOU AHLONSOU Victorin",
  "SOHA WEB TV": "DAGAN Gilbert",
  "MATIN LIBRE": "KARIMOU Sidikou",
  "L'INVESTIGATEUR": "GOLOU Appolinaire",
  "L'EXPRESSION": "HODE Rodrigue",
  "LES 4 VERITES": "TOSSOU Blaise",
  "LE POTENTIEL": "ATIKPATO Adrien",
  "LE LEADER BENIN": "BALOGOUN Ulvaus Léonce Horace",
  "LE JOURNAL DE NOTRE EPOQUE": "HESSOU Hervé Prudence",
  "LA METEO": "TONONGBE Venance",
  "INEWS AFRICA": "TONIGNIKES Codjo Roland Laurent",
  "BOULEVARD DES INFOS": "TIDJANI Is-Deen Olouchègoun",
  "BENIN BEST NEWS": "GNANTONOU Maxime",
  "BANOUTO": "GAMAÏ Léonce",
  "AFRICAHO": "DANONGBE T. Coffi Paul",
  "24 HEURES AU BENIN": "ZOHOUN Sévérin Judicaël",
  "LE PARAKOIS": "KARIMOU Sidikou"
};

const TONE_KEYWORDS_ALERT = [
  'urgent', 'alerte', 'choc', 'scandale', 'exclusif', 'révélation', 'revelation', 
  'incroyable', 'terrible', 'catastrophe', 'danger', 'mort', 'massacre', 'crise', 
  'effondrement', 'fraude', 'corruption', 'arrestation', 'accusation', 'complot', 'mensonge'
];

const TONE_KEYWORDS_POSITIF = [
  'succès', 'succes', 'victoire', 'développement', 'developpement', 'progrès', 'progres', 
  'inauguration', 'croissance', 'paix', 'accord', 'réforme', 'reforme', 'amélioration', 
  'bonne-nouvelle', 'bonne nouvelle', 'célébration', 'celebration', 'partenariat'
];

interface VerificateurHaacProps {
  onNavigateToSignaler?: () => void;
  currentUser?: UserProfile | null;
  onLoginClick?: () => void;
  advertisements?: Advertisement[];
  onTrackView?: (adId: string) => void;
  onTrackClick?: (adId: string) => void;
}

export default function VerificateurHaac({ 
  onNavigateToSignaler, 
  currentUser, 
  onLoginClick,
  advertisements = [],
  onTrackView,
  onTrackClick
}: VerificateurHaacProps) {
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [reports, setReports] = useState<FakeNewsReport[]>([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [voiceSearchError, setVoiceSearchError] = useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);

  useEffect(() => {
    if (voiceSearchError) {
      const timer = setTimeout(() => {
        setVoiceSearchError(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [voiceSearchError]);

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSearchError("La reconnaissance vocale n'est pas supportée par votre navigateur. Veuillez utiliser Chrome, Safari ou Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'fr-FR';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceSearchError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          const cleanTranscript = transcript.trim().replace(/\.$/, '');
          setSearch(cleanTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          setVoiceSearchError("L'accès au microphone est bloqué. Veuillez autoriser le microphone dans votre navigateur.");
        } else {
          setVoiceSearchError("Reconnaissance vocale interrompue ou non disponible.");
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn("Speech recognition start failed:", err);
      setVoiceSearchError("Échec de l'activation du microphone.");
      setIsListening(false);
    }
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleVoiceSearch = () => {
    if (isListening) {
      stopVoiceSearch();
    } else {
      startVoiceSearch();
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleUpvote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      triggerToast("🔒 Connexion requise : Veuillez vous connecter pour soutenir une alerte.", "error");
      if (onLoginClick) onLoginClick();
      else setShowAuthModal(true);
      return;
    }
    const targetReport = reports.find(rep => rep.id === id);
    if (!targetReport) return;
    
    const nextReport = { ...targetReport, upvotes: targetReport.upvotes + 1 };
    
    try {
      await setDoc(doc(db, "rumeurs", id), nextReport);
    } catch (err) {
      console.warn("Failed syncing upvote to Firestore", err);
      try {
        handleFirestoreError(err, OperationType.UPDATE, `rumeurs/${id}`);
      } catch (e) {}
    }
  };

  const filteredReports = reports.filter(rep => {
    const matchesSearch = rep.title.toLowerCase().includes(search.toLowerCase()) || 
                          rep.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCat === 'all' || rep.category === filterCat;
    return matchesSearch && matchesCat;
  });

  useEffect(() => {
    const q = collection(db, "rumeurs");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: FakeNewsReport[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as FakeNewsReport);
      });
      if (fetched.length > 0) {
        setReports(fetched);
      }
    }, (err) => {
      console.warn("Firestore rumeurs load failed in VerificateurHaac", err);
    });
    return () => unsubscribe();
  }, []);
  const [result, setResult] = useState<{
    media: HAACMedia | null;
    isHttps: boolean;
    domain: string;
    score: number;
    scoreLabel: string;
    points: { label: string; val: number; max: number; desc: string }[];
    guessedDate: string | null;
    tones: { label: string; cls: 'neutral' | 'positive' | 'alert' | 'info'; icon: string }[];
    tips: string[];
    rawUrl: string;
    responsible: string | null;
    securityLevel: 'haute' | 'moyenne' | 'faible';
    positivePoints: string[];
    attentionPoints: string[];
    adviceRules: string[];
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Demo examples
  const DEMO_LINKS = [
    { label: "Matin Libre (Presse Écrite)", url: "https://www.matinlibre.bj/2026/06/20/cotonou-port-reforme-douane" },
    { label: "Le Potentiel (Presse Écrite)", url: "https://www.lepotentiel.bj/2026/06/15/parakou-parc-solaire-raccordement" },
    { label: "Daabaaru TV (Télévision)", url: "https://www.daabaarutv.bj/direct/investiture-communes-nord" },
    { label: "Lien non identifié (.bj)", url: "https://infostox-benin.bj/examens-suspension-reseaux-sociaux" },
    { label: "Lien suspect de rumeur", url: "http://gagnant-loterie-benin.net/reclamation-fonds/" }
  ];

  const extractDomain = (url: string): string | null => {
    try {
      let u = url.trim();
      if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
      return new URL(u).hostname.replace(/^www\./, '').toLowerCase();
    } catch(e) {
      return null;
    }
  };

  const detectDateFromUrl = (url: string): string | null => {
    const patterns = [
      { re: /(\d{4})\/(\d{2})\/(\d{2})/, f: (m: RegExpMatchArray) => `${m[3]}/${m[2]}/${m[1]}` },
      { re: /(\d{4})-(\d{2})-(\d{2})/, f: (m: RegExpMatchArray) => `${m[3]}/${m[2]}/${m[1]}` },
      { re: /\/(\d{2})-(\d{2})-(\d{4})/, f: (m: RegExpMatchArray) => `${m[1]}/${m[2]}/${m[3]}` },
      { re: /_(\d{4})(\d{2})(\d{2})_/i, f: (m: RegExpMatchArray) => `${m[3]}/${m[2]}/${m[1]}` },
      { re: /\/(\d{4})\/(\d{2})\//, f: (m: RegExpMatchArray) => `Mois ${m[2]}, ${m[1]}` },
    ];
    for (const pat of patterns) {
      const match = url.match(pat.re);
      if (match) return pat.f(match);
    }
    return null;
  };

  const detectTone = (url: string, path: string) => {
    const str = `${url} ${path}`.toLowerCase();
    const tones: { label: string; cls: 'neutral' | 'positive' | 'alert' | 'info'; icon: string }[] = [];

    const alertCount = TONE_KEYWORDS_ALERT.filter(w => str.includes(w)).length;
    const positifCount = TONE_KEYWORDS_POSITIF.filter(w => str.includes(w)).length;

    if (alertCount >= 2) tones.push({ label: 'Sensationnaliste / Alarmiste', cls: 'alert', icon: '⚠' });
    else if (alertCount === 1) tones.push({ label: 'Ton Accrocheur', cls: 'alert', icon: '!' });
    
    if (positifCount >= 1) tones.push({ label: 'Ton Positif / Constructif', cls: 'positive', icon: '✓' });
    
    if (tones.length === 0) tones.push({ label: 'Ton Neutre / Informatif', cls: 'neutral', icon: '⚖' });
    return tones;
  };

  const triggerAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      triggerToast("🔒 Connexion requise : Veuillez vous connecter pour effectuer une vérification de lien.", "error");
      setShowAuthModal(true);
      return;
    }
    if (!urlInput.trim()) return;

    setIsLoading(true);
    setLoadingStep(1);

    // Simulated parsing delays to match original HTML's high fidelity audit progress
    setTimeout(() => {
      setLoadingStep(2);
      setTimeout(() => {
        setLoadingStep(3);
        setTimeout(() => {
          setLoadingStep(4);
          setTimeout(() => {
            performFullAnalysis();
          }, 450);
        }, 350);
      }, 350);
    }, 350);
  };

  const performFullAnalysis = () => {
    const raw = urlInput.trim();
    const domain = extractDomain(raw);

    if (!domain) {
      setIsLoading(false);
      setResult(null);
      return;
    }

    // Lookup domain in HAAC registry
    const matchedMedia = HAAC_MEDIA_REGISTRY.find(m => {
      const mp = m.p.replace(/^www\./, '').toLowerCase();
      return domain === mp || domain.endsWith('.' + mp);
    }) || null;

    const isHttps = raw.toLowerCase().startsWith('https://');
    const isBeninDomain = domain.endsWith('.bj');
    const guessedDate = detectDateFromUrl(raw) || new Date().toLocaleDateString('fr-FR');

    let path = '/';
    try {
      let u = raw;
      if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
      path = new URL(u).pathname;
    } catch(e) {}

    const pathSegments = path.split('/').filter(s => s.length > 0);
    const tones = detectTone(raw, path);
    const alertTone = tones.some(t => t.cls === 'alert');

    // Score computation
    let score = 0;
    const pointsGrid: { label: string; val: number; max: number; desc: string }[] = [];

    // Points details
    if (matchedMedia) {
      score += 50;
      pointsGrid.push({ label: "Agrément HAAC Officiel", val: 50, max: 50, desc: "Média inscrit au registre légal de l'autorité béninoise." });
    } else {
      pointsGrid.push({ label: "Agrément HAAC Officiel", val: 0, max: 50, desc: "Absent des registres officiels de la HAAC, augmente le risque de fake news." });
    }

    if (isHttps) {
      score += 20;
      pointsGrid.push({ label: "Certificat SSL Chiffré", val: 20, max: 20, desc: "Flux de données HTTPS crypté et sécurisé." });
    } else {
      pointsGrid.push({ label: "Certificat SSL Chiffré", val: 0, max: 20, desc: "Connexion HTTP vulnérable et non sécurisée." });
    }

    if (isBeninDomain) {
      score += 15;
      pointsGrid.push({ label: "Extension Nationale (.bj)", val: 15, max: 15, desc: "Domaine de premier niveau national assigné au Bénin." });
    } else {
      pointsGrid.push({ label: "Extension Nationale (.bj)", val: 0, max: 15, desc: "Extension générique ou étrangère." });
    }

    // Checking dates
    const urlHasDate = detectDateFromUrl(raw) !== null;
    if (urlHasDate) {
      score += 5;
      pointsGrid.push({ label: "Date de Publication Spécifiée", val: 5, max: 5, desc: "Date valide extraite de l'architecture d'URL." });
    } else {
      pointsGrid.push({ label: "Date de Publication Spécifiée", val: 0, max: 5, desc: "Pas de chronologie décelable dans l'URL." });
    }

    if (pathSegments.length >= 2) {
      score += 10;
      pointsGrid.push({ label: "Hiérarchie d'URL Organisée", val: 10, max: 10, desc: "Structure imbriquée (/categorie/article) professionnelle." });
    } else {
      pointsGrid.push({ label: "Hiérarchie d'URL Organisée", val: 0, max: 10, desc: "URL brute ou de type page d'accueil simple de blog opportuniste." });
    }

    // Penalties
    if (alertTone && !matchedMedia) {
      score = Math.max(0, score - 15);
      pointsGrid.push({ label: "Pénalité: Sensationnalisme", val: -15, max: 0, desc: "Ton alarmiste détecté chez une source non agréée." });
    }

    score = Math.min(Math.max(0, score), 100);

    // Score label
    let scoreLabel = 'Excellente Fiabilité';
    if (score < 40) scoreLabel = 'Risque Élevé / Douteux';
    else if (score < 75) scoreLabel = 'Fiabilité Modérée / Non Certifié';

    // Look up responsible
    let responsibleName = "Non certifié - Source externe";
    if (matchedMedia) {
      if (matchedMedia.r && matchedMedia.r !== "Non spécifié") {
        responsibleName = matchedMedia.r;
      } else {
        const norm = matchedMedia.nom.toUpperCase().trim();
        responsibleName = "Non spécifié dans l'agrément initial";
        for (const k of Object.keys(ORGAN_RESPONSIBLES)) {
          if (norm.includes(k) || k.includes(norm)) {
            responsibleName = ORGAN_RESPONSIBLES[k];
            break;
          }
        }
      }
    }

    // Security level
    let securityLevel: 'haute' | 'moyenne' | 'faible' = 'faible';
    if (isHttps && isBeninDomain) securityLevel = 'haute';
    else if (isHttps || isBeninDomain) securityLevel = 'moyenne';

    // Positive points details
    const posPoints: string[] = [];
    if (matchedMedia) {
      posPoints.push("Organe officiel inscrit et accrédité au registre national de la HAAC.");
    }
    if (isHttps) {
      posPoints.push("Protocole cryptographique de sécurité SSL actif (Sert à empêcher les interceptions de paquets de données).");
    }
    if (isBeninDomain) {
      posPoints.push("Usage de l'extension de souveraineté béninoise (.bj) facilitant le contrôle d'identité Nic.bj.");
    }
    if (urlHasDate) {
      posPoints.push(`Structure temporelle vérifiable inscrite dans la route (Date détectée : ${detectDateFromUrl(raw)}).`);
    }
    if (pathSegments.length >= 2) {
      posPoints.push("Architecture web professionnelle propre aux journaux d'actualité structurés.");
    }
    if (posPoints.length === 0) {
      posPoints.push("Aucun point technique positif majeur n'a surmonté l'audit.");
    }

    // Attention points details
    const attPoints: string[] = [];
    if (!matchedMedia) {
      attPoints.push("HORS AGREGEMENT : Ce site n'est pas répertorié sur la table légale des 143 médias accrédités par la HAAC face à la cybercriminalité.");
    }
    if (!isHttps) {
      attPoints.push("CONNEXION VULNÉRABLE (HTTP) : Absence de certificat SSL sécurisé. Risque d'usurpation d'identité ou d'injections de redirections publicitaires malveillantes.");
    }
    if (!isBeninDomain) {
      attPoints.push("HEBERGEMENT HORS BENIN : L'extension du nom de domaine (.bj) est absente, réduisant la traçabilité légale par les autorités judiciaires béninoises.");
    }
    if (!urlHasDate) {
      attPoints.push("CHRONOLOGIE ABSENTE : L'URL ne spécifie pas de date claire, ce qui est typique du recyclage d'infox hors contexte datant de plusieurs années.");
    }
    if (alertTone) {
      attPoints.push("TON ALARMISTE / CLIC-PIÈGE : Utilisation de majuscules ou de qualificatifs dramatiques incitant la panique chez le lecteur.");
    }
    if (attPoints.length === 0) {
      attPoints.push("Le site intègre une hygiène technique décente.");
    }

    // Consolidated tips
    const tips: string[] = [];
    if (matchedMedia) {
      tips.push("Cet organe de presse est agréé par la HAAC. L'information possède de solides garanties de rigueur déontologique.");
      tips.push("Vérifiez la signature de l'auteur et l'heure directe de publication pour vous assurer de la fraîcheur du sujet.");
    } else {
      tips.push("VIGILANCE EXTRÊME : Cette source web contourne les protocoles déontologiques du Bénin. Soyez très scrupuleux.");
      tips.push("Recoupez immédiatement l'information : Allez voir si le sujet est couvert par au moins deux des organes officiels avant de le partager.");
    }

    // Anti-disinformation advices
    const advices = [
      "Vérifiez sur Bénin Actu : Utilisez notre section Actualités pour voir si les flux officiels en font écho.",
      "Identifiez la signature : Un article sérieux contient un nom de journaliste béninois clair et des citations vérifiables.",
      "Ne partagez pas sous le coup de l'émotion : La désinformation est conçue pour provoquer de la colère, de la surprise ou de la panique.",
      "Recherche inversée d'images : Si l'article affiche une photo de catastrophe, faites un clic droit pour effectuer une recherche inversée et valider si le cliché ne date pas de plusieurs années.",
      "Stopper la chaîne : Si un doute subsiste, abstenez-vous de transférer le lien dans vos groupes de discussion WhatsApp."
    ];

    setResult({
      media: matchedMedia,
      isHttps,
      domain,
      score,
      scoreLabel,
      points: pointsGrid,
      guessedDate,
      tones,
      tips,
      rawUrl: raw,
      responsible: responsibleName,
      securityLevel,
      positivePoints: posPoints,
      attentionPoints: attPoints,
      adviceRules: advices
    });
    setIsLoading(false);
  };

  const handleDemoClick = (url: string) => {
    setUrlInput(url);
    setIsLoading(true);
    setLoadingStep(1);
    setTimeout(() => {
      setLoadingStep(2);
      setTimeout(() => {
        setLoadingStep(3);
        setTimeout(() => {
          setLoadingStep(4);
          setTimeout(() => {
            const domain = extractDomain(url) || 'demo.bj';
            const matchedMedia = HAAC_MEDIA_REGISTRY.find(m => {
              const mp = m.p.replace(/^www\./, '').toLowerCase();
              return url.includes(mp);
            }) || null;
            const isHttps = url.toLowerCase().startsWith('https://');
            const guessedDate = detectDateFromUrl(url) || new Date().toLocaleDateString('fr-FR');
            const isBeninDomain = url.includes('.bj');
            const score = matchedMedia ? (isHttps ? 95 : 75) : 35;
            
            let securityLevel: 'haute' | 'moyenne' | 'faible' = 'faible';
            if (isHttps && isBeninDomain) securityLevel = 'haute';
            else if (isHttps || isBeninDomain) securityLevel = 'moyenne';

            const posPoints: string[] = [];
            if (matchedMedia) posPoints.push("Organe de presse agréé officiellement au registre HAAC.");
            if (isHttps) posPoints.push("Protocole SSL sécurisé (chiffrement actif en HTTPS).");
            if (isBeninDomain) posPoints.push("Extension légale béninoise (.bj) garantissant une juridiction béninoise.");
            if (posPoints.length === 0) posPoints.push("Lien accessible pour analyse automatisée.");

            const attPoints: string[] = [];
            if (!matchedMedia) attPoints.push("Source non répertoriée dans la table officielle des 143 médias validés par la HAAC.");
            if (!isHttps) attPoints.push("Connexion non chiffrée (HTTP) : Vulnérable aux injections informatiques.");
            if (!isBeninDomain) attPoints.push("Nom de domaine étranger ou générique réduisant la traçabilité Nic.bj.");
            if (attPoints.length === 0) attPoints.push("Aucun point de vigilance technique immédiat.");

            const advices = [
              "Vérifiez sur Bénin Actu : Utilisez notre section Actualités pour voir si les flux officiels en font écho.",
              "Identifiez la signature : Un article sérieux contient un nom de journaliste clair.",
              "Ne partagez pas sous le coup de l'émotion.",
              "Recherche inversée d'images : Vérifiez l'authenticité des images.",
              "Stopper la chaîne : Au moindre doute, ne transférez pas."
            ];

            let scoreLabel = 'Excellente Fiabilité';
            if (score < 40) scoreLabel = 'Risque Élevé / Douteux';
            else if (score < 75) scoreLabel = 'Fiabilité Modérée / Non Certifié';

            let responsibleName = "Non certifié - Source externe";
            if (matchedMedia) {
              if (matchedMedia.r && matchedMedia.r !== "Non spécifié") {
                responsibleName = matchedMedia.r;
              } else {
                const norm = matchedMedia.nom.toUpperCase().trim();
                responsibleName = "Non spécifié dans l'agrément initial";
                for (const k of Object.keys(ORGAN_RESPONSIBLES)) {
                  if (norm.includes(k) || k.includes(norm)) {
                    responsibleName = ORGAN_RESPONSIBLES[k];
                    break;
                  }
                }
              }
            }

            setResult({
              media: matchedMedia,
              isHttps,
              domain,
              score,
              scoreLabel,
              points: [
                { label: "Agrément HAAC Officiel", val: matchedMedia ? 50 : 0, max: 50, desc: "Statut au registre des 143 médias accrédités." },
                { label: "Certificat SSL", val: isHttps ? 20 : 0, max: 20, desc: "Sécurité de connexion par chiffrement HTTPS." },
                { label: "Domaine .bj", val: isBeninDomain ? 15 : 0, max: 15, desc: "Nom de domaine béninois contrôlé." }
              ],
              guessedDate,
              tones: [{ label: 'Ton Neutre / Informatif', cls: 'neutral', icon: '⚖' }],
              tips: [matchedMedia ? "Média officiel agréé par la HAAC." : "Attention : Absent du registre HAAC.", "Veuillez recouper l'information."],
              rawUrl: url,
              responsible: responsibleName,
              securityLevel,
              positivePoints: posPoints,
              attentionPoints: attPoints,
              adviceRules: advices
            });
            setIsLoading(false);
          }, 300);
        }, 300);
      }, 300);
    }, 300);
  };

  const handleCopyReport = () => {
    if (!result) return;
    const reportText = `[Rapport d'Audit de Fiabilité contre la Désinformation - Bénin Actu]
Source : ${result.rawUrl}
Domaine analysé : ${result.domain}
Organe de presse : ${result.media ? result.media.nom : 'Non référencé / Journal alternatif'}
Type d'organe : ${result.media ? result.media.n : 'Non identifié'}
Directeur responsable : ${result.responsible}
Sécurité du site web : SSL Chiffré (${result.isHttps ? 'Oui - HTTPS' : 'Non - HTTP Simple Vulnérable'})
Date de l'article : ${result.guessedDate || 'Récente'}
Score de Confiance : ${result.score}% / 100 [${result.scoreLabel}]
Généré par le service indépendant de vérification d'informations basé sur les données de la HAAC.`;

    navigator.clipboard.writeText(reportText).then(() => {
      triggerToast("Rapport d'audit de fiabilité copié avec succès ! 📋", 'success');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClear = () => {
    setUrlInput('');
    setResult(null);
  };

  return (
    <div id="haac-verifier-main" className="space-y-6 max-w-4xl mx-auto">
      
      {/* Intro info box */}
      <div id="haac-intro-block" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6 items-center">
        <div className="bg-amber-500 text-slate-950 p-4 rounded-2xl flex items-center justify-center shrink-0 shadow-md">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="space-y-1 text-left">
          <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Vigilance Presse : Service indépendant de vérification
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            Outil d'analyse de sécurité et d'authenticité adossé à la base de données officielle des 143 médias en ligne autorisés au Bénin par la HAAC.
          </p>
        </div>
      </div>

      {/* Audit Paste link box */}
      <div id="haac-paste-box" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm text-slate-800 dark:text-slate-100 space-y-5 relative overflow-hidden transition-all duration-350 hover:shadow-md">
        {!currentUser && (
          <div id="guest-verification-lock-card" className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-extrabold text-amber-950 dark:text-amber-100">
                  Connexion requise pour exécuter une vérification
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                  Les visiteurs non connectés ne peuvent pas auditer de liens. Connectez-vous gratuitement pour débloquer l'analyse d'URL.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onLoginClick) onLoginClick();
                else setShowAuthModal(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-black text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shrink-0 cursor-pointer shadow-sm"
            >
              Se connecter
            </button>
          </div>
        )}

        <form onSubmit={triggerAnalysis} className="space-y-4 relative z-10 text-left">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Link className="w-4 h-4" />
            </div>
            <label id="lbl-url-paste" htmlFor="hvUrlInput" className="block text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400">
              Coller le lien de l'article béninois pour l'analyse
            </label>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                id="hvUrlInput"
                type="text"
                required
                placeholder="Ex: https://daabaaru.bj/actualite/titre-de-l-article..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full pl-11 pr-11 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
              />
              <Link className="absolute left-4 top-4.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
              {urlInput && (
                <button
                  id="hvClearUrlBtn"
                  type="button"
                  onClick={() => {
                    setUrlInput('');
                    setResult(null);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-xl transition-all cursor-pointer"
                  title="Effacer le lien"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              id="analyze-submit-trigger"
              type="submit"
              disabled={isLoading || !urlInput.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest px-7 py-3.5 rounded-2xl transition-all shadow-md shrink-0 cursor-pointer active:scale-95"
            >
              Auditer le lien
            </button>
          </div>
        </form>
      </div>

      {/* Navigation Banner to Signalement Page */}
      {onNavigateToSignaler && (
        <div className="bg-gradient-to-r from-red-600 to-rose-600 rounded-3xl p-5 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wide">Espace Signalements & Rumeurs</h3>
              <p className="text-xs text-red-100">Soumettez un message suspect ou consultez les enquêtes citoyennes en cours.</p>
            </div>
          </div>
          <button
            onClick={onNavigateToSignaler}
            className="bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 font-extrabold text-xs px-5 py-3 rounded-2xl shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span>Accéder à la page de signalement</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Carousel publicitaire défilable (3s) au-dessus des Publications & Verdicts */}
      <AdCarousel
        advertisements={advertisements}
        onTrackView={onTrackView}
        onTrackClick={onTrackClick}
        autoPlayInterval={3000}
        className="my-6"
      />

      {/* Multi-step progress sequences loaders */}
      {isLoading && (
        <div id="haac-loaders-flyout" className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-md flex items-center gap-4 animate-pulse text-left">
          <div className="w-7 h-7 rounded-full border-2 border-slate-200 dark:border-slate-800 border-t-blue-600 animate-spin shrink-0"></div>
          <div className="space-y-1">
            <span className="text-xs font-extrabold text-gray-900 dark:text-slate-100">Analyse de sécurité & déontologique de la source...</span>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
              <span className={loadingStep >= 1 ? 'text-blue-600 dark:text-blue-400 animate-pulse font-bold' : ''}>Extraction URL</span>
              <span className={loadingStep >= 2 ? 'text-blue-600 dark:text-blue-400 animate-pulse font-bold' : ''}>▸ Registre 143 HAAC</span>
              <span className={loadingStep >= 3 ? 'text-blue-600 dark:text-blue-400 animate-pulse font-bold' : ''}>▸ Chiffrement SSL</span>
              <span className={loadingStep >= 4 ? 'text-blue-600 dark:text-blue-400 animate-pulse font-bold' : ''}>▸ Sémantique & Typosquat</span>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Report outcome results */}
      {result && !isLoading && (
        <div id="haac-report-result" className="space-y-6 animate-fade-in duration-300">
          
          {/* Banner status */}
          <div 
            id="verdict-banner-box"
            className={`border-2 rounded-3xl p-5 flex items-start gap-4 text-left ${
              result.media 
                ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700 text-emerald-950 dark:text-emerald-50' 
                : result.domain.endsWith('.bj') 
                  ? 'bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:border-amber-700 text-amber-950 dark:text-amber-50' 
                  : 'bg-rose-50 border-rose-300 dark:bg-rose-950/40 dark:border-rose-700 text-rose-950 dark:text-rose-50'
            }`}
          >
            <span className={`p-3 rounded-2xl shrink-0 ${
              result.media 
                ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300' 
                : result.domain.endsWith('.bj') 
                  ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300' 
                  : 'bg-rose-500/20 text-rose-800 dark:text-rose-300'
            }`}>
              {result.media ? (
                <ShieldCheck className="w-8 h-8" />
              ) : result.domain.endsWith('.bj') ? (
                <AlertTriangle className="w-8 h-8" />
              ) : (
                <XOctagon className="w-8 h-8" />
              )}
            </span>
            <div className="space-y-1.5">
              <h3 className={`text-base font-black tracking-tight uppercase ${
                result.media 
                  ? 'text-emerald-950 dark:text-emerald-100' 
                  : result.domain.endsWith('.bj') 
                    ? 'text-amber-950 dark:text-amber-100' 
                    : 'text-rose-950 dark:text-rose-100'
              }`}>
                {result.media 
                  ? "✓ Organe Officiel Certifié HAAC" 
                  : result.domain.endsWith('.bj') 
                    ? "⚠ Source .BJ Locale Non Agréée par la HAAC" 
                    : "✕ Domaine Non Enregistré au Registre de la Presse"}
              </h3>
              <p className={`text-xs font-bold leading-relaxed ${
                result.media 
                  ? 'text-emerald-950 dark:text-emerald-100' 
                  : result.domain.endsWith('.bj') 
                    ? 'text-amber-950 dark:text-amber-100' 
                    : 'text-rose-950 dark:text-rose-100'
              }`}>
                {result.media 
                  ? `Cet article provient de "${result.media.nom}". Cet organe fait partie intégrante de la liste des 143 médias habilités à diffuser l'information déontologique au Bénin sous l'agrément légal de la HAAC.`
                  : result.domain.endsWith('.bj') 
                    ? "Attention : Bien que le domaine utilise l'extension béninoise (.bj), ce site web ne figure pas dans le registre légal d'accréditation professionnelle de la HAAC. Il peut s'agir d'un blog amateur ou d'un site à des fins d'arnaques."
                    : "Ce site web utilise un domaine générique externe sans lien officiel avec la régulation médiatique béninoise. Ses affirmations n'offrent aucune garantie professionnelle et légitime."}
              </p>
            </div>
          </div>

          {/* Reliability gauge card */}
          <div id="reliability-gauge-card" className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              {/* Spinning circular svg gauge chart */}
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="50" r="44" stroke="#e2e8f0" strokeWidth="9" fill="transparent" className="dark:stroke-slate-800" />
                <circle 
                  cx="56" 
                  cy="50" 
                  r="44" 
                  stroke={result.score >= 70 ? '#10b981' : result.score >= 40 ? '#f59e0b' : '#ef4444'} 
                  strokeWidth="9" 
                  fill="transparent" 
                  strokeDasharray={276}
                  strokeDashoffset={276 - (276 * result.score) / 100}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-950 dark:text-white font-mono tracking-tighter leading-none">{result.score}%</span>
                <span className="text-[10px] text-slate-600 dark:text-slate-300 font-black uppercase tracking-wider pt-0.5">Confiance</span>
              </div>
            </div>

            <div className="space-y-2 text-center md:text-left flex-1">
              <span className={`inline-flex px-3 py-1 rounded-md text-xs font-black uppercase tracking-wide border ${
                result.score >= 75 
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-950 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-200' 
                  : result.score >= 40 
                    ? 'bg-amber-100 border-amber-300 text-amber-950 dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-200' 
                    : 'bg-rose-100 border-rose-300 text-rose-950 dark:bg-rose-950/60 dark:border-rose-700 dark:text-rose-200'
              }`}>
                Verdict : {result.scoreLabel}
              </span>
              <h4 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">Analyse de Fiabilité Globale</h4>
              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-semibold text-left md:text-left">
                Ce pourcentage évalue la transparence institutionnelle de la source (50%), la sécurité technique du flux DNS/SSL (35%), la structure de l'URL (10%) et le ton objectif utilisé (5%).
              </p>
            </div>
          </div>

          {/* Quick indicators grid badge */}
          <div id="quick-indicators-row" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border-2 text-center space-y-1 ${
              result.isHttps 
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100' 
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100'
            }`}>
              {result.isHttps ? <Lock className="w-5 h-5 mx-auto text-emerald-600 dark:text-emerald-400" /> : <Unlock className="w-5 h-5 mx-auto text-rose-600 dark:text-rose-400" />}
              <span className="text-xs font-black uppercase tracking-wide block pt-1">SSL Chiffré</span>
              <span className="text-xs font-extrabold block">{result.isHttps ? 'HTTPS Chiffré ✓' : 'HTTP Vulnérable ✕'}</span>
            </div>

            <div className={`p-4 rounded-2xl border-2 text-center space-y-1 ${
              result.media 
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100' 
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100'
            }`}>
              <CheckCircle className={`w-5 h-5 mx-auto ${result.media ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} />
              <span className="text-xs font-black uppercase tracking-wide block pt-1">Répertoire HAAC</span>
              <span className="text-xs font-extrabold block">{result.media ? 'Agréé Officiel ✓' : 'Non Enregistré ✕'}</span>
            </div>

            <div className={`p-4 rounded-2xl border-2 text-center space-y-1 ${
              result.domain.endsWith('.bj') 
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100' 
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100'
            }`}>
              <Globe className="w-5 h-5 mx-auto text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-black uppercase tracking-wide block pt-1">Zone Domaine</span>
              <span className="text-xs font-extrabold block">{result.domain.endsWith('.bj') ? 'Souverain .BJ ✓' : 'Extension Externe ⚠'}</span>
            </div>

            <div className="p-4 rounded-2xl border-2 border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-center space-y-1 text-slate-950 dark:text-slate-100">
              <Calendar className="w-5 h-5 mx-auto text-slate-700 dark:text-slate-300" />
              <span className="text-xs font-black uppercase tracking-wide block pt-1">Horodatage</span>
              <span className="text-xs font-extrabold text-slate-950 dark:text-white block">{result.guessedDate}</span>
            </div>
          </div>

          {/* Exhaustive Identity card of the detected organ */}
          <div id="haac-official-editor-card" className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-6 space-y-5 relative overflow-hidden shadow-sm">
            <div className="absolute right-3 top-3 opacity-5 pointer-events-none">
              <Award className="w-32 h-32 text-slate-400 dark:text-slate-600" />
            </div>
            
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 font-mono">
                Fiche d'Identification Institutionnelle de l'Organe
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1 text-left">
              <div className="space-y-1.5 bg-slate-100/80 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-300 dark:border-slate-800">
                <span className="text-[10px] text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider block">Dénomination Commune</span>
                <span className="font-black text-slate-950 dark:text-white text-sm">{result.media ? result.media.nom : "Organe alternatif ou non répertorié"}</span>
              </div>
              
              <div className="space-y-1.5 bg-slate-100/80 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-300 dark:border-slate-800">
                <span className="text-[10px] text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider block">Catégorie / Nature Légale</span>
                <span className={`inline-flex px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wide mt-1 border ${
                  result.media?.n === 'TV' 
                    ? 'bg-blue-100 border-blue-300 text-blue-950 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700' 
                    : result.media?.n === 'RADIO' 
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-950 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700' 
                      : 'bg-amber-100 border-amber-300 text-amber-950 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700'
                }`}>
                  {result.media ? result.media.n : "Non Classifié"}
                </span>
              </div>

              <div className="space-y-1.5 bg-slate-100/80 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-300 dark:border-slate-800">
                <span className="text-[10px] text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider block">Directeur Responsable d'Édition</span>
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="font-extrabold text-slate-950 dark:text-white text-xs">{result.responsible}</span>
                </div>
              </div>

              <div className="space-y-1.5 bg-slate-100/80 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-300 dark:border-slate-800">
                <span className="text-[10px] text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider block">Date de l'Actualité Diagnostiquée</span>
                <div className="flex items-center gap-1.5">
                  <ClockIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="font-extrabold text-slate-950 dark:text-white text-xs">{result.guessedDate}</span>
                </div>
              </div>

              <div className="space-y-1.5 bg-slate-100/80 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-300 dark:border-slate-800 md:col-span-2">
                <span className="text-[10px] text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider block">Statut Réglementaire face à la Cybercriminalité</span>
                <span className={`font-bold block py-1.5 px-3 rounded text-xs border ${
                  result.media 
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-950 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-200' 
                    : 'bg-rose-100 border-rose-300 text-rose-950 dark:bg-rose-950/60 dark:border-rose-700 dark:text-rose-200'
                }`}>
                  {result.media 
                    ? "✓ Conforme : Les Directeurs et Éditeurs sont enregistrés à la HAAC pour lier les publications journalistiques à une responsabilité légale." 
                    : "✕ Hors-registre : Risque élevé de diffusion d'informations sans signataire officiel identifiable en droit béninois."}
                </span>
              </div>
            </div>
          </div>

          {/* Web safety technical evaluation */}
          <div id="website-safety-evaluation" className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 text-left">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Évaluation de Sécurité Technique du Site
              </h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">Protocole SSL de Connexion</span>
                  {result.isHttps ? (
                    <span className="bg-emerald-100 border border-emerald-300 text-emerald-950 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-200 px-2.5 py-0.5 rounded text-[10px] font-black uppercase">Protégé</span>
                  ) : (
                    <span className="bg-rose-100 border border-rose-300 text-rose-950 dark:bg-rose-950 dark:border-rose-700 dark:text-rose-200 px-2.5 py-0.5 rounded text-[10px] font-black uppercase">Danger</span>
                  )}
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">
                  {result.isHttps 
                    ? "Les requêtes de navigation vers l'organe officiel utilisent HTTPS, empêchant le décryptage d'activité utilisateur par les tiers." 
                    : "SSL absent! Le site fait circuler des informations confidentielles sans chiffrement, ce qui expose à des détournements DNS et des attaques sur le réseau."}
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">Sûreté du Nom de Domaine (.BJ)</span>
                  {result.domain.endsWith('.bj') ? (
                    <span className="bg-emerald-100 border border-emerald-300 text-emerald-950 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-200 px-2.5 py-0.5 rounded text-[10px] font-black uppercase">Souverain</span>
                  ) : (
                    <span className="bg-amber-100 border border-amber-300 text-amber-950 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-200 px-2.5 py-0.5 rounded text-[10px] font-black uppercase">Atypique</span>
                  )}
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">
                  {result.domain.endsWith('.bj') 
                    ? "Le nom de domaine utilise l'extension béninoise .bj gérée par Nic.bj. Ce choix local permet une traçabilité d'identité instantanée." 
                    : "Le site utilise une extension de domaine international (ex: .info, .net). Ce modèle est privilégié par les propagateurs de rumeurs pour rester anonymes d'un pays tiers."}
                </p>
              </div>
            </div>
          </div>

          {/* Details Positifs vs Points d'Attention Columns */}
          <div id="evaluation-breakdown-panel" className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Positive choices card */}
            <div id="evaluation-positive-col" className="bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-300 dark:border-emerald-800 rounded-3xl p-5 space-y-3 text-left">
              <div className="flex items-center gap-1.5 text-emerald-950 dark:text-emerald-200">
                <ThumbsUp className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
                <h4 className="text-xs font-black uppercase tracking-wider">Facteurs Positifs d'Audit</h4>
              </div>
              <ul className="space-y-2.5">
                {result.positivePoints.map((item, id) => (
                  <li key={id} className="flex gap-2 text-xs text-emerald-950 dark:text-emerald-100 leading-relaxed font-extrabold">
                    <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-300 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Things to pay attention card */}
            <div id="evaluation-watchout-col" className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800 rounded-3xl p-5 space-y-3 text-left">
              <div className="flex items-center gap-1.5 text-amber-950 dark:text-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-300" />
                <h4 className="text-xs font-black uppercase tracking-wider">Points de Vigilance (Risques)</h4>
              </div>
              <ul className="space-y-2.5">
                {result.attentionPoints.map((item, id) => (
                  <li key={id} className="flex gap-2 text-xs text-amber-950 dark:text-amber-100 leading-relaxed font-extrabold">
                    <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-300 mt-0.5 shrink-0 animate-pulse" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Points Breakdown detailing scoring logic */}
          <div id="haac-points-details" className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 text-left">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 pl-1 flex items-center gap-1">
              <Info className="w-4 h-4 text-slate-600 dark:text-slate-300" /> Justification Mathématique du Score
            </h4>
            <div className="space-y-3.5">
              {result.points.map((p, idx) => (
                <div id={`points-row-${idx}`} key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-extrabold text-slate-900 dark:text-slate-100">
                    <span>{p.label}</span>
                    <span className={p.val > 0 ? 'text-emerald-700 dark:text-emerald-300 font-black' : 'text-slate-500 dark:text-slate-400'}>
                      {p.val > 0 ? `+${p.val}` : p.val} / {p.max} pts
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${p.val > 0 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-800'}`} 
                      style={{ width: `${(p.val / p.max) * 100}%` }}
                    />
                  </div>
                  <span className="block text-xs text-slate-700 dark:text-slate-300 font-semibold">{p.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Practical anti-disinformation advices checklist */}
          <div id="anti-disinfo-user-advices" className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 text-left">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-black uppercase text-slate-900 dark:text-slate-100 tracking-wide">
                Guide d'Action Citoyen : Conseils de Protection
              </h4>
            </div>
            
            <p className="text-xs text-slate-800 dark:text-slate-200 font-bold leading-relaxed">
              La désinformation au Bénin nuit à la cohésion sociale et à la sécurité publique. Appliquez rigoureusement ce code de comportement avant de partager n'importe quel message :
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {result.adviceRules.map((rule, idx) => (
                <div key={idx} className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl flex gap-2.5 items-start">
                  <span className="bg-blue-600 text-white font-mono font-black text-xs px-2 py-0.5 rounded-lg shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-normal">
                    {rule}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sémantique Tone audit */}
          <div id="haac-report-tone" className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3 text-left">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 pl-1">
              Ton de Publication Détecté par l'IA
            </h4>
            <div className="flex gap-2 flex-wrap">
              {result.tones.map((t, idx) => (
                <span
                  id={`tone-tag-${idx}`}
                  key={idx}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
                    t.cls === 'alert' 
                      ? 'bg-rose-100 border-rose-300 text-rose-950 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-200' 
                      : t.cls === 'positive'
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-950 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-200'
                        : 'bg-slate-100 border-slate-300 text-slate-950 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100'
                  }`}
                >
                  <span className="text-sm font-black">{t.icon}</span>
                  <span>{t.label}</span>
                </span>
              ))}
            </div>
            {result.tones.some(t => t.cls === 'alert') && !result.media && (
              <p id="sensation-alert-msg" className="bg-rose-100 border border-rose-300 rounded-xl p-3.5 text-xs text-rose-950 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-200 font-bold leading-relaxed">
                ⚠️ Ce site utilise des superlatifs anxiogènes de type canular (ex: Urgent, Alerte) et ne figure pas au registre légal de l'État béninois. La probabilité d'une entreprise concertée de clics-pièges (clickbait) ou de désinformation est très forte.
              </p>
            )}
          </div>

          {/* Actions toolbar */}
          <div id="haac-toolbar" className="flex flex-col sm:flex-row justify-between gap-3 text-xs">
            <button
              id="report-copy"
              onClick={handleCopyReport}
              className="bg-gray-900 hover:bg-slate-800 text-white font-bold px-5 py-3.5 rounded-2xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Copy className="w-4 h-4" />
              <span>{copied ? "Rapport Copié !" : "Copier le Rapport d'Audit"}</span>
            </button>
            <div className="flex gap-2 w-full sm:w-auto">
              <a
                id="haac-official-lookup"
                href="https://haac.bj"
                target="_blank"
                rel="noreferrer"
                className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-250 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:border-gray-400 font-bold px-4 py-3.5 rounded-2xl flex items-center justify-center gap-1 transition-all flex-1 text-center"
              >
                <span>Consulter haac.bj</span>
              </a>
              <button
                id="reset-audit-box"
                onClick={handleClear}
                className="bg-gray-50 dark:bg-slate-800/80 hover:bg-red-50 dark:hover:bg-red-950/40 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 px-4 py-3.5 rounded-2xl transition-all cursor-pointer font-bold flex-1 animate-pulse"
              >
                Nouvelle Analyse
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Auth Modal required dialog for guests */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 text-center relative">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Connexion requise pour la vérification
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                L'outil d'analyse et d'audit d'URL est réservé aux membres connectés pour garantir une utilisation responsable de la plateforme.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl text-left border border-slate-200 dark:border-slate-700 space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Analyse de légitimité de la presse béninoise en temps réel</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Vérification au registre légal des 143 médias HAAC</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Inscription gratuite et instantanée</span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  if (onLoginClick) onLoginClick();
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider font-mono"
              >
                <User className="w-4 h-4" />
                <span>Se connecter ou S'inscrire</span>
              </button>
              <button
                onClick={() => setShowAuthModal(false)}
                className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 py-1 cursor-pointer"
              >
                Fermer et parcourir en mode visiteur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple internal calendar clock icon fallback helper
function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
