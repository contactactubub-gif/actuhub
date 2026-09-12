import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, Send, X, Sparkles, Trash2, Bot, User, HelpCircle, AlertCircle, Mic, MicOff, Volume2, Square, VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Article, AppNotification } from '../types';
import { ConfirmationModal } from './ConfirmationModal';
import aiInstructorAvatar from '../assets/images/ai_instructor_avatar_1782314801885.jpg';

interface AIAssistantPopupProps {
  articles: Article[];
  rumors: any[];
  currentTab: string;
  userProfile: any;
  darkTheme: boolean;
  onNavigateToTab?: (tab: 'news' | 'shorts' | 'haac' | 'signaler' | 'academy' | 'about' | 'contact' | 'media-dashboard' | 'admin-dashboard') => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIAssistantPopup({
  articles,
  rumors,
  currentTab,
  userProfile,
  darkTheme,
  onNavigateToTab
}: AIAssistantPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewResponse, setHasNewResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isListening, setIsListening] = useState(false);
  const [voiceSearchError, setVoiceSearchError] = useState<string | null>(null);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (voiceSearchError) {
      const timer = setTimeout(() => {
        setVoiceSearchError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [voiceSearchError]);

  // Stop speech synthesis when chat is closed or component unmounts
  useEffect(() => {
    const stopSpeech = () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setCurrentlySpeakingId(null);
      }
    };

    if (!isOpen) {
      stopSpeech();
    }

    return () => stopSpeech();
  }, [isOpen]);

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSearchError("Reconnaissance vocale indisponible");
      return;
    }

    try {
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'fr-FR';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceSearchError(null);
      };

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          setInputMessage(text);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          setVoiceSearchError("Microphone bloqué");
        } else {
          setVoiceSearchError("Échec vocal");
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      console.warn("Speech recognition start failed:", err);
      setVoiceSearchError("Erreur d'activation");
      setIsListening(false);
    }
  };

  const speak = (text: string, id: string) => {
    if ('speechSynthesis' in window) {
      if (currentlySpeakingId === id) {
        window.speechSynthesis.cancel();
        setCurrentlySpeakingId(null);
        return;
      }
      
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[\*#]/g, ''));
      utterance.lang = 'fr-FR';
      
      utterance.onstart = () => setCurrentlySpeakingId(id);
      utterance.onend = () => setCurrentlySpeakingId(null);
      utterance.onerror = () => {
        setCurrentlySpeakingId(null);
        console.warn("Synthèse vocale interrompue ou non autorisée par le navigateur.");
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("Text-to-speech non pris en charge.");
    }
  };

  const getActionLinks = (content: string) => {
    const links: { label: string; tab: 'news' | 'shorts' | 'haac' | 'signaler' | 'academy' | 'about' | 'contact' | 'media-dashboard' | 'admin-dashboard'; icon: string }[] = [];
    const lower = content.toLowerCase();
    
    if (lower.includes('académie') || lower.includes('academie') || lower.includes('cours') || lower.includes('quiz') || lower.includes('🎓')) {
      links.push({ label: 'Aller à la Désinformation Academy', tab: 'academy', icon: '🎓' });
    }
    if (lower.includes('signaler') || lower.includes('soumettre') || lower.includes('dénoncer') || lower.includes('✍️')) {
      links.push({ label: 'Aller au Portail de Signalement', tab: 'signaler', icon: '✍️' });
    }
    if (lower.includes('rumeur') || lower.includes('fake') || lower.includes('vérif') || lower.includes('haac') || lower.includes('🚨')) {
      links.push({ label: 'Vérification d\'Infos', tab: 'haac', icon: '🔍' });
    }
    if (lower.includes('actualité') || lower.includes('article') || lower.includes('presse') || lower.includes('📰')) {
      links.push({ label: 'Voir les actualités', tab: 'news', icon: '📰' });
    }
    if (lower.includes('shorts') || lower.includes('vidéo') || lower.includes('play') || lower.includes('📱')) {
      links.push({ label: 'Regarder Shorts TV', tab: 'shorts', icon: '📱' });
    }
    return links;
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isTyping]);

  // Alert/breathe effect when unopened and no messages
  const [shouldPulse, setShouldPulse] = useState(true);

  const generateLocalResponse = (msg: string) => {
    const query = msg.toLowerCase().trim();
    const rawArticles = articles || [];
    const rawRumors = rumors || [];

    // 1. Welcome / Help / Info Queries
    if (
      query.includes("bonjour") || 
      query.includes("salut") || 
      query.includes("hello") || 
      query.includes("aide") || 
      query.includes("help") || 
      query.includes("qui es-tu") || 
      query.includes("qui es tu") || 
      query.includes("comment ça marche") ||
      query.includes("comment ca marche") ||
      query.includes("fonctionne") ||
      query === "hi"
    ) {
      return `👋 Bonjour ! Je suis l'assistante intelligente d'ActuHub Bénin.

Je fonctionne en totale autonomie directement sur votre navigateur pour vous aider à :
• 📰 Chercher des articles (tapez un mot-clé comme "santé", "cotonou", "politique")
• 🚨 Vérifier les rumeurs et Fake News récentes (tapez "rumeur" ou un mot-clé)
• 🎓 Vous guider dans l'onglet "Académie" (cours et quiz sur les infox)
• ✍️ Découvrir comment signaler une fausse information (tapez "signaler")

Tapez simplement votre recherche ci-dessous pour trouver des informations instantanément !`;
    }

    // 2. Disinformation and Fake News definition / education
    if (
      query.includes("désinformation") || 
      query.includes("desinformation") || 
      query.includes("infox") || 
      query.includes("fake news") || 
      query.includes("fausse") || 
      query.includes("mensonge") ||
      query.includes("intox")
    ) {
      return `🚨 **Comprendre la Désinformation au Bénin**

La désinformation est la propagation délibérée de fausses informations pour tromper, nuire ou manipuler l'opinion publique. 

**Types d'infox fréquentes au Bénin :**
1. 📱 **Rumeurs WhatsApp** : Messages transférés de nombreuses fois (ex: "Partagez à 10 groupes pour gagner 50 000F de la part de MTN/Moov"). Ce sont à 99% des tentatives d'arnaque (phishing).
2. 💼 **Faux recrutements** : Offres d'emploi fictives imitant des organismes d'État (la police républicaine, la douane, la CNSS) pour extorquer de l'argent ou des données personnelles.
3. 📸 **Médias manipulés (Deepfakes/Cheapfakes)** : Photos de personnalités béninoises détournées de leur contexte original ou vidéos trafiquées.

**Comment s'en protéger ?**
• **Vérifiez la source** : L'information vient-elle d'un média agréé ou d'un blog anonyme ?
• **Cherchez sur ActuHub** : Utilisez notre vérificateur de rumeurs pour voir le verdict d'analyse.
• **Ne partagez pas à la hâte** : Si une nouvelle suscite en vous une forte colère ou de l'excitation, elle a probablement été rédigée pour vous manipuler.`;
    }

    // 3. Fact-checking / Verification methods
    if (
      query.includes("fact checking") || 
      query.includes("fact-checking") || 
      query.includes("factchecking") || 
      query.includes("vérifier") || 
      query.includes("verification") || 
      query.includes("vérif") || 
      query.includes("debusquer") || 
      query.includes("croiser") ||
      query.includes("analys")
    ) {
      return `🔍 **L'art du Fact-Checking (Vérification des faits)**

Le **Fact-checking** consiste à vérifier de manière rigoureuse la véracité d'une affirmation, d'une image ou d'un document avant d'y croire ou de le propager.

**Les 4 règles d'or du Fact-checker sur ActuHub Bénin :**
1. 🌐 **Le croisement des sources** : Une information n'est jamais valide sur la base d'une seule publication. Cherchez si au moins 3 médias officiels béninois de confiance confirment le fait.
2. 🕵️ **La recherche inversée d'images** : Utilisez des outils gratuits (comme Google Lens ou TinEye) pour vérifier si une image censée illustrer un événement béninois récent n'est pas en réalité une vieille photo d'un autre pays.
3. 📜 **La confrontation avec les communiqués officiels** : Pour toute annonce gouvernementale, vérifiez le site du Secrétariat Général du Gouvernement (gouv.bj) ou les canaux officiels des ministères.
4. 🚨 **L'évaluation des rumeurs** : Sur ActuHub, l'onglet "Vérification" vous présente des rumeurs auditées. Le statut est classé en **Vrai**, **Faux** ou **Trompeur**.`;
    }

    // 4. Media Landscape & Aggregation Process
    if (
      query.includes("média") || 
      query.includes("media") || 
      query.includes("médias") || 
      query.includes("presse") || 
      query.includes("journal") || 
      query.includes("journaliste") || 
      query.includes("rss") || 
      query.includes("indexation") ||
      query.includes("agréé") ||
      query.includes("agree")
    ) {
      return `📰 **Le Paysage Médiatique et l'Indexation ActuHub**

ActuHub Bénin agrège et référence les médias autorisés et reconnus au Bénin.

**Comment fonctionne l'indexation des médias sur la plateforme ?**
1. ✍️ **Demande de candidature** : Les éditeurs de presse et les directeurs de publication de médias en ligne soumettent une demande d'indexation via notre portail dédié en fournissant leur numéro d'enregistrement ou récépissé et le lien RSS de leur flux.
2. 🛡️ **Audit de conformité** : L'équipe de modération d'ActuHub vérifie le respect du code d'éthique des journalistes, la légitimité du nom de domaine et la régularité des publications.
3. 🔌 **Agrégation RSS** : Une fois approuvé, le flux RSS du média est synchronisé automatiquement toutes les heures, garantissant aux citoyens béninois un accès à de l'actualité certifiée sans rumeurs ni sensationnalisme.

**Quelques médias certifiés au Bénin :**
• *La Nation* (Quotidien national d'information)
• *ORTB* (Office de Radiodiffusion et Télévision du Bénin)
• *Matin Libre, Fraternité, Banouto, L'Événement Précis, etc.*`;
    }

    // 5. Academy / Quiz / Courses
    if (
      query.includes("academy") || 
      query.includes("académie") || 
      query.includes("academie") || 
      query.includes("cours") || 
      query.includes("quizz") || 
      query.includes("quiz") || 
      query.includes("apprendre") || 
      query.includes("formation") || 
      query.includes("education") ||
      query.includes("sensibilis")
    ) {
      return `🎓 Bienvenue dans la "Désinformation Academy" d'ActuHub Bénin !

Cette section éducative interactive vous aide à repérer et démonter les infox :
• 📖 Cours : Apprenez à débusquer les rumeurs sur WhatsApp, les faux profils et le phishing.
• 🏆 Quiz : Testez vos connaissances en direct et remportez des badges de citoyen averti.

💡 Comment y accéder ?
Cliquez simplement sur l'onglet "Académie" dans le menu de navigation principal de la plateforme.`;
    }

    // 6. How to report / Signaler une rumeur
    if (
      query.includes("signaler") || 
      query.includes("signal") || 
      query.includes("ajouter") || 
      query.includes("soumettre") || 
      query.includes("dénoncer") || 
      query.includes("denoncer") || 
      query.includes("formulaire") || 
      query.includes("contribuer")
    ) {
      return `✍️ Comment signaler une rumeur suspecte ?

Si vous recevez un message suspect sur WhatsApp, Facebook ou ailleurs au Bénin :
1. Allez sur l'onglet "Vérification" ou restez sur l'accueil.
2. Cliquez sur le bouton "Signaler une rumeur".
3. Renseignez le titre, la description, et si possible ajoutez une image ou capture d'écran.
4. L'équipe d'ActuHub analysera votre alerte pour lui attribuer un verdict de confiance (Vrai, Faux, Trompeur).`;
    }

    // Sort raw articles strictly by publication date descending (newest first)
    const sortedArticles = [...rawArticles].sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    // Extract search tokens for smart local relevance matching, excluding generic news stop words
    const genericStopWords = new Set(['que', 'qui', 'quoi', 'comment', 'pourquoi', 'avec', 'dans', 'pour', 'sur', 'les', 'des', 'une', 'un', 'est', 'sont', 'donne', 'moi', 'nous', 'vous', 'dernière', 'dernières', 'derniers', 'récente', 'récentes', 'actualité', 'actualités', 'nouvelles', 'nouvelle', 'infos', 'info', 'bénin', 'benin']);
    const queryTokens = query
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
      .split(/\s+/)
      .filter((token: string) => token.length > 2 && !genericStopWords.has(token));

    const isRumorQuery = query.includes("rumeur") || query.includes("fake") || query.includes("intox") || query.includes("mensonge") || query.includes("tromp") || query.includes("verif");

    // Score and select relevant rumors
    let matchedRumors: any[] = [];
    if (queryTokens.length > 0) {
      const scoredRumors = rawRumors.map((r: any) => {
        let score = 0;
        const searchArea = `${r.title || ''} ${r.description || ''} ${r.explanation || ''} ${r.status || ''}`.toLowerCase();
        queryTokens.forEach((token: string) => {
          if (searchArea.includes(token)) {
            score += 1;
            if ((r.title || '').toLowerCase().includes(token)) {
              score += 2;
            }
          }
        });
        return { rumor: r, score };
      });

      matchedRumors = scoredRumors
        .filter((item: any) => item.score > 0)
        .sort((a: any, b: any) => b.score - a.score)
        .map((item: any) => item.rumor);
    }

    // Score and select relevant articles
    let matchedArticles: any[] = [];
    if (queryTokens.length > 0) {
      const scoredArticles = sortedArticles.map((a: any) => {
        let score = 0;
        const searchArea = `${a.title || ''} ${a.source || ''} ${a.description || ''} ${a.category || ''}`.toLowerCase();
        queryTokens.forEach((token: string) => {
          if (searchArea.includes(token)) {
            score += 1;
            if ((a.title || '').toLowerCase().includes(token)) {
              score += 2;
            }
          }
        });
        return { article: a, score };
      });

      matchedArticles = scoredArticles
        .filter((item: any) => item.score > 0)
        .sort((a: any, b: any) => {
          if (b.score !== a.score) return b.score - a.score;
          return new Date(b.article.pubDate).getTime() - new Date(a.article.pubDate).getTime();
        })
        .map((item: any) => item.article);
    }

    // If explicitly asking for rumors or verified alerts
    if (isRumorQuery) {
      const listToUse = matchedRumors.length > 0 ? matchedRumors : rawRumors;
      if (listToUse.length === 0) {
        return `🚨 Section de vérification des rumeurs :

Aucun signalement de rumeur n'est disponible sur la plateforme pour le moment. Vous pouvez être le premier à en signaler un !`;
      }

      const titlePrefix = matchedRumors.length > 0 
        ? `🚨 Voici les rumeurs correspondantes trouvées pour votre recherche :` 
        : `🚨 Voici les rumeurs récentes signalées et analysées sur ActuHub :`;

      const items = listToUse.slice(0, 3).map((r: any) => {
        let statusLabel = '🔍 En attente';
        if (r.status === 'fake') statusLabel = '❌ FAUX / FAKE NEWS';
        if (r.status === 'misleading') statusLabel = '⚠️ TROMPEUR';
        if (r.status === 'verified') statusLabel = '✅ VRAI / VÉRIFIÉ';

        return `• **[${statusLabel}]** ${r.title}
  *Verdict & Explication* : ${r.explanation || 'Analyse de conformité en cours.'}`;
      }).join('\n\n');

      return `${titlePrefix}\n\n${items}`;
    }

    // If specific keyword matched either articles or rumors
    if (matchedRumors.length > 0 || matchedArticles.length > 0) {
      let result = `🔍 J'ai trouvé des informations sur le site pour "${msg}" :\n\n`;

      if (matchedRumors.length > 0) {
        result += `🚨 **Vérification de Rumeurs (${matchedRumors.length})** :\n`;
        result += matchedRumors.slice(0, 2).map((r: any) => {
          let statusLabel = '🔍 En attente';
          if (r.status === 'fake') statusLabel = '❌ Faux';
          if (r.status === 'misleading') statusLabel = '⚠️ Trompeur';
          if (r.status === 'verified') statusLabel = '✅ Vrai';
          return `• [${statusLabel}] **${r.title}**\n  *Verdict* : ${r.explanation || 'En cours d\'analyse.'}`;
        }).join('\n') + '\n\n';
      }

      if (matchedArticles.length > 0) {
        result += `📰 **Articles de Presse récents (${matchedArticles.length})** :\n`;
        result += matchedArticles.slice(0, 3).map((a: any) => {
          const dateStr = a.pubDate ? ` (${new Date(a.pubDate).toLocaleDateString('fr-FR')})` : '';
          return `• **${a.title}**${dateStr} - *Source: ${a.source}*\n  ${a.description ? `${a.description.substring(0, 100)}...` : ''}`;
        }).join('\n') + '\n\n';
      }

      result += `💡 Conseil : Tapez d'autres mots-clés (ex: "santé", "cotonou", "désinformation") pour filtrer nos bases de données !`;
      return result;
    }

    // 5. Default fallback (top freshest news and rumors)
    const recentArticles = sortedArticles.slice(0, 3);
    const recentRumors = rawRumors.slice(0, 2);

    let fallbackResponse = `🔍 Je n'ai pas trouvé de correspondance exacte pour votre recherche "${msg}".

Voici néanmoins les dernières activités en direct de la plateforme d'actualités :`;

    if (recentRumors.length > 0) {
      fallbackResponse += `\n\n🚨 **Rumeur récente signalée** :
• **${recentRumors[0].title}**
  Verdict : ${recentRumors[0].status === 'fake' ? '❌ Faux' : recentRumors[0].status === 'verified' ? '✅ Vrai' : '⚠️ Trompeur'} - ${recentRumors[0].explanation || 'Analyse en cours.'}`;
    }

    if (recentArticles.length > 0) {
      fallbackResponse += `\n\n📰 **Actualité récente** :
• **${recentArticles[0].title}** (Source: ${recentArticles[0].source})`;
    }

    fallbackResponse += `\n\n💡 *Astuces* :
- Demandez les "dernières rumeurs" ou "dernières actualités"
- Tapez "désinformation", "fact checking" ou "médias" pour obtenir des guides d'éducation civique complets.
- Écrivez "aide" pour réinitialiser les options de discussion.`;

    return fallbackResponse;
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading || isTyping) return;

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build history for the backend API
      const historyPayload = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        content: m.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: textToSend.trim(),
          history: historyPayload,
          context: {
            articles,
            rumors,
            currentTab,
            userProfile
          }
        })
      });

      if (!response.ok) {
        throw new Error('API server returned error status');
      }

      const data = await response.json();
      const replyText = data.reply || "Désolée, je n'ai pas pu obtenir de réponse.";

      setIsLoading(false);
      setIsTyping(true);

      const aiMsgId = `msg-ai-${Date.now()}`;
      const initialAiMsg: ChatMessage = {
        id: aiMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, initialAiMsg]);

      // Progressive typing animation
      const words = replyText.split(/(\s+)/);
      let currentWordIdx = 0;
      let currentContent = '';

      const intervalId = setInterval(() => {
        if (currentWordIdx < words.length) {
          currentContent += words[currentWordIdx];
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.id === aiMsgId) {
              const updated = [...prev];
              updated[updated.length - 1] = { ...lastMsg, content: currentContent };
              return updated;
            }
            return prev;
          });
          currentWordIdx++;
        } else {
          clearInterval(intervalId);
          setIsTyping(false);
          if (!isOpen) {
            setHasNewResponse(true);
          }
        }
      }, 16);

    } catch (err) {
      console.warn("Erreur lors de la requête API, bascule sur le moteur de recherche local :", err);
      
      setIsLoading(false);
      setIsTyping(true);

      const replyText = generateLocalResponse(textToSend.trim());
      const aiMsgId = `msg-ai-${Date.now()}`;

      // Initialize empty assistant message
      const initialAiMsg: ChatMessage = {
        id: aiMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, initialAiMsg]);

      // Progressive typing animation (word-by-word with tags preserved)
      const words = replyText.split(/(\s+)/);
      let currentWordIdx = 0;
      let currentContent = '';

      const intervalId = setInterval(() => {
        if (currentWordIdx < words.length) {
          currentContent += words[currentWordIdx];
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.id === aiMsgId) {
              const updated = [...prev];
              updated[updated.length - 1] = { ...lastMsg, content: currentContent };
              return updated;
            }
            return prev;
          });
          currentWordIdx++;
        } else {
          clearInterval(intervalId);
          setIsTyping(false);
          if (!isOpen) {
            setHasNewResponse(true);
          }
        }
      }, 16);
    }
  };

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const clearChat = () => {
    setShowClearConfirm(true);
  };

  const handleConfirmClear = () => {
    setMessages([]);
    setHasNewResponse(false);
    setShowClearConfirm(false);
  };

  const quickSuggestions = [
    { text: "Quelles sont les dernières actualités béninoises ?", label: "📰 Actualités" },
    { text: "Y a-t-il de fausses rumeurs récentes vérifiées ?", label: "🚨 Rumeurs récentes" },
    { text: "Comment puis-je signaler une fausse information ?", label: "✍️ Signaler" },
    { text: "C'est quoi la Désinformation Academy ?", label: "🎓 Academy" }
  ];

  return (
    <div className="fixed xl:bottom-6 xl:right-6 bottom-24 right-4 z-50 flex flex-col items-end">
      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            id="ai-assistant-chat-popup"
            className={`fixed md:absolute inset-0 md:inset-auto md:bottom-full md:right-0 z-[60] w-full md:w-[600px] h-full md:h-[850px] md:max-h-[calc(100vh-140px)] md:rounded-[32px] rounded-none shadow-2xl border-2 flex flex-col overflow-hidden md:mb-6 ${
              darkTheme 
                ? 'bg-slate-900 border-slate-800 text-slate-100' 
                : 'bg-white border-blue-200 text-slate-800'
            }`}
          >
            {/* Header */}
            <div className={`p-4 sm:p-6 md:p-8 flex items-center justify-between border-b-2 gap-3 shrink-0 ${
              darkTheme ? 'bg-slate-950/80 border-slate-800' : 'bg-blue-600 text-white border-blue-700'
            }`}>
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="relative group shrink-0">
                  <img 
                    src={aiInstructorAvatar} 
                    alt="IA Instructeur" 
                    className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl object-cover border-2 border-white/40 shadow-xl bg-slate-800 shrink-0 transition-transform group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base md:text-sm font-black uppercase tracking-wider font-mono flex items-center gap-1.5 truncate">
                    Assistant ActuHub
                  </h3>
                  <p className={`text-[10px] sm:text-[11px] md:text-[10px] font-bold truncate ${
                    darkTheme ? 'text-gray-400' : 'text-blue-100'
                  }`}>
                    Expert Fact-Checking & Infos
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl transition-all cursor-pointer ${
                      darkTheme ? 'hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800' : 'hover:bg-white/10 text-white/80 hover:text-white border border-white/20'
                    }`}
                    title="Réinitialiser la discussion"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className={`px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-[20px] transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2.5 border-2 font-black shadow-xl scale-100 hover:scale-105 active:scale-95 ${
                    darkTheme 
                      ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 hover:border-rose-400' 
                      : 'bg-white hover:bg-blue-50 text-blue-600 border-white hover:border-blue-100'
                  }`}
                >
                  <span className="hidden sm:inline text-[13px] md:text-[12px] uppercase tracking-widest font-mono">Fermer l'IA</span>
                  <span className="sm:hidden text-[11px] uppercase tracking-wider font-mono">Fermer</span>
                  <X className="w-4 h-4 sm:w-6 sm:h-6 md:w-5 md:h-5" />
                </button>
              </div>
            </div>

            {/* Live Synchronized Status Bar */}
            <div className={`px-4 py-2 border-b flex items-center justify-between text-[11px] font-bold shrink-0 ${
              darkTheme ? 'bg-emerald-950/40 border-slate-800 text-emerald-400' : 'bg-emerald-50 border-blue-100 text-emerald-800'
            }`}>
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span className="truncate">IA synchronisée en temps réel : {articles?.length || 0} actualités & {rumors?.length || 0} rumeurs</span>
              </div>
              <span className="text-[10px] font-mono opacity-80 shrink-0 hidden sm:inline">Mise à jour automatique</span>
            </div>

            {/* Conversation Flow Area */}
            <div className={`flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 ${
              darkTheme ? 'bg-slate-950/20' : 'bg-gray-50/50'
            }`}>
              {/* Static Welcome Message */}
              <div className="flex gap-2 sm:gap-3 items-start">
                <img 
                  src={aiInstructorAvatar} 
                  alt="IA Instructeur" 
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 border border-blue-500/30 shadow-sm bg-slate-800"
                  referrerPolicy="no-referrer"
                />
                <div className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-[24px] max-w-[90%] sm:max-w-[85%] text-xs sm:text-sm md:text-xs leading-relaxed border ${
                  darkTheme 
                    ? 'bg-slate-800/50 border-slate-750 text-slate-200' 
                    : 'bg-white border-gray-150 text-slate-700'
                }`}>
                  <p className="font-extrabold mb-1.5 flex items-center gap-1.5 text-xs sm:text-base md:text-sm">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                    Salut ! Je suis l'IA de ActuHub Bénin.
                  </p>
                  <p className="mb-3 text-xs sm:text-sm md:text-xs">Je suis connecté aux flux d'actualités et au service de vérification d'informations d'ActuHub Bénin. (Note : ActuHub est une initiative indépendante de lutte contre la désinformation). Comment puis-je vous aider aujourd'hui ?</p>
                  
                  {messages.length === 0 && (
                    <div className="mt-3.5 pt-3.5 border-t border-dashed border-gray-200 dark:border-slate-700">
                      <p className="text-[10px] sm:text-[11px] md:text-[10px] font-black uppercase tracking-widest font-mono text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mb-2">
                        <HelpCircle className="w-3.5 h-3.5" /> Suggestions de questions :
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                        {quickSuggestions.map((sug, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleQuickQuestion(sug.text)}
                            className={`text-[11px] sm:text-xs md:text-[11px] font-bold px-3 py-2 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl border-2 transition-all text-left cursor-pointer hover:scale-[1.01] active:scale-[0.98] shadow-xs leading-tight ${
                              darkTheme
                                ? 'bg-slate-900/40 border-slate-750/60 text-slate-200 hover:border-blue-500/80 hover:bg-slate-900/80'
                                : 'bg-blue-50/40 border-blue-100/50 text-blue-900 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            {sug.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat messages */}
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={msg.id} className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : ''}`}>
                    {isUser ? (
                      <div className={`shrink-0 p-1.5 rounded-lg ${
                        darkTheme ? 'bg-blue-950/60 text-blue-400' : 'bg-blue-50 text-blue-600'
                      }`}>
                        <User className="w-4 h-4" />
                      </div>
                    ) : (
                      <img 
                        src={aiInstructorAvatar} 
                        alt="IA Instructeur" 
                        className="w-8 h-8 rounded-full object-cover shrink-0 border border-blue-500/30 shadow-sm bg-slate-800"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    
                    <div className={`relative p-4 md:p-3.5 rounded-2xl md:rounded-[20px] max-w-[90%] md:max-w-[85%] text-sm md:text-xs leading-relaxed border shadow-sm ${
                      isUser
                        ? darkTheme
                          ? 'bg-blue-900/30 border-blue-900/40 text-blue-100'
                          : 'bg-blue-50 border-blue-100 text-blue-900'
                        : darkTheme
                          ? 'bg-slate-800/80 border-slate-750 text-slate-200'
                          : 'bg-white border-gray-150 text-slate-700'
                    }`}>
                      {/* Preserving text formatting / whitespace */}
                      <p className="whitespace-pre-line">{msg.content}</p>
                      
                      {!isUser && onNavigateToTab && (
                        (() => {
                          const actionLinks = getActionLinks(msg.content);
                          if (actionLinks.length > 0) {
                            return (
                              <div className="mt-2.5 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700 flex flex-col gap-1.5">
                                <p className="text-[9px] font-extrabold text-blue-500 dark:text-blue-400 uppercase tracking-wider font-mono">
                                  🧭 Redirections disponibles :
                                </p>
                                <div className="flex flex-col gap-1">
                                  {actionLinks.map((link, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => {
                                        onNavigateToTab(link.tab);
                                        setIsOpen(false);
                                      }}
                                      className={`w-full text-left px-2.5 py-1.5 rounded-xl border text-[10px] font-extrabold transition-all flex items-center justify-between group cursor-pointer ${
                                        darkTheme
                                          ? 'bg-slate-900 border-slate-700 hover:border-blue-500 hover:bg-slate-800 text-slate-200 hover:text-white shadow-sm'
                                          : 'bg-blue-50 border-blue-100 hover:border-blue-300 hover:bg-blue-100 text-blue-700 hover:text-blue-800 shadow-xs'
                                      }`}
                                    >
                                      <span className="flex items-center gap-1.5">
                                        <span>{link.icon}</span>
                                        <span>{link.label}</span>
                                      </span>
                                      <span className="text-[9px] font-mono opacity-50 group-hover:opacity-100 transition-opacity">🚀 Ouvrir</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()
                      )}

                      <span className="block text-[8px] font-mono text-gray-400 dark:text-gray-500 mt-1.5 text-right">
                        {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {!isUser && (
                        <div className="absolute -bottom-3 left-0 md:-left-4 flex flex-col items-start gap-1 z-10">
                          <button
                            onClick={() => speak(msg.content, msg.id)}
                            className={`px-2.5 py-1 md:px-3 md:py-1.5 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-1.5 ${
                              currentlySpeakingId === msg.id 
                                ? 'bg-blue-600 text-white animate-pulse ring-4 ring-blue-400/20' 
                                : darkTheme 
                                  ? 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700' 
                                  : 'bg-white text-gray-600 hover:text-blue-600 border border-gray-100'
                            }`}
                            title={currentlySpeakingId === msg.id ? "Arrêter l'écoute" : "Écouter la réponse"}
                          >
                            {currentlySpeakingId === msg.id ? (
                              <Square className="w-2 h-2 md:w-2.5 md:h-2.5 fill-white" />
                            ) : (
                              <Volume2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                            )}
                            <span className="text-[9px] md:text-[10px] font-bold whitespace-nowrap">
                              {currentlySpeakingId === msg.id ? "Arrêter" : "Écouter"}
                            </span>
                          </button>
                          
                          {currentlySpeakingId === msg.id && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex gap-0.5 px-1 py-0.5 bg-blue-600/10 rounded-full border border-blue-600/20 items-center justify-center"
                            >
                              {[0.1, 0.3, 0.2, 0.4].map((delay, i) => (
                                <motion.div
                                  key={i}
                                  animate={{ height: [4, 10, 4] }}
                                  transition={{ repeat: Infinity, duration: 0.6, delay }}
                                  className="w-0.5 bg-blue-600 rounded-full"
                                />
                              ))}
                            </motion.div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Bouncing dots loading animation */}
              {isLoading && (
                <div className="flex gap-3 items-start">
                  <img 
                    src={aiInstructorAvatar} 
                    alt="IA Instructeur" 
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-blue-500/30 shadow-sm bg-slate-800 animate-pulse"
                    referrerPolicy="no-referrer"
                  />
                  <div className={`p-3.5 rounded-2xl border flex items-center gap-1.5 ${
                    darkTheme ? 'bg-slate-800/50 border-slate-750' : 'bg-white border-gray-150'
                  }`}>
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    <span className="text-[10px] font-bold font-mono text-gray-400 dark:text-gray-500 ml-1">L'IA réfléchit...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form Footer */}
            <div className="relative">
              {voiceSearchError && (
                <div className="absolute bottom-full left-0 right-0 mb-1 mx-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-[9px] px-2.5 py-1.5 rounded-lg border border-red-100 dark:border-red-900/20 shadow-sm z-30 flex items-center justify-between">
                  <span className="truncate">{voiceSearchError}</span>
                  <button 
                    type="button"
                    onClick={() => setVoiceSearchError(null)} 
                    className="ml-1 text-red-400 hover:text-red-600 font-bold text-xs"
                  >
                    ×
                  </button>
                </div>
              )}
              
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputMessage);
                }}
                className={`p-5 md:p-6 border-t flex gap-3 items-center ${
                  darkTheme ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-gray-150'
                }`}
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={isTyping ? "L'IA est en train de répondre..." : "Posez votre question à l'IA..."}
                    className={`w-full pl-4 pr-12 py-3.5 md:py-3 rounded-2xl text-sm md:text-xs font-bold outline-none border transition-all ${
                      darkTheme 
                        ? 'bg-slate-900 border-slate-750 text-slate-100 placeholder-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-900/40' 
                        : 'bg-gray-50 border-gray-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    }`}
                    disabled={isLoading || isTyping}
                  />
                  <button
                    type="button"
                    onClick={startVoiceSearch}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center ${
                      isListening
                        ? 'text-red-500 bg-red-500/10 animate-pulse'
                        : darkTheme 
                          ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' 
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Poser votre question vocalement"
                  >
                    {isListening ? <MicOff className="w-4 h-4 md:w-3.5 md:h-3.5" /> : <Mic className="w-4 h-4 md:w-3.5 md:h-3.5" />}
                  </button>
                </div>
                
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading || isTyping}
                  className={`p-3.5 md:p-3 rounded-2xl font-bold flex items-center justify-center transition-all cursor-pointer ${
                    !inputMessage.trim() || isLoading || isTyping
                      ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:scale-105 active:scale-95'
                  }`}
                >
                  <Send className="w-5 h-5 md:w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger & Indicator Area */}
      <div className="flex flex-col items-center gap-1.5">
        {/* Help label bubble pointing to the trigger button */}
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ 
              opacity: 0.95, 
              y: [2, -2, 2],
              scale: 1 
            }}
            whileHover={{ scale: 1.03, opacity: 1 }}
            transition={{
              y: {
                repeat: Infinity,
                repeatType: "reverse",
                duration: 3,
                ease: "easeInOut"
              },
              opacity: { duration: 0.4 },
              scale: { duration: 0.4 }
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border shadow-sm relative whitespace-nowrap flex items-center gap-1 cursor-pointer select-none transition-all ${
              darkTheme 
                ? 'bg-slate-900 border-slate-850 text-slate-200 hover:text-white hover:border-slate-750' 
                : 'bg-white border-gray-200 text-slate-700 hover:text-slate-900 hover:border-gray-300'
            }`}
            onClick={() => {
              setIsOpen(true);
              setHasNewResponse(false);
            }}
          >
            <Sparkles className="w-2.5 h-2.5 text-amber-500 animate-pulse" />
            <span>Je suis ton assistante</span>
          </motion.div>
        )}

        {/* Floating Trigger Button */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setHasNewResponse(false);
          }}
          className={`rounded-full transition-all duration-300 relative group cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center p-0 overflow-hidden ${
            isOpen
              ? 'w-10 h-10 bg-rose-500 text-white rotate-90 hover:bg-rose-600'
              : 'w-10 h-10 bg-blue-600 hover:bg-blue-700 border border-blue-500/20'
          } ${shouldPulse && !isOpen ? 'ring-4 ring-blue-500/20 shadow-lg shadow-blue-500/20' : 'shadow-lg shadow-black/15'}`}
          title="Discuter avec l'IA ActuHub"
          id="trigger-ai-assistant-popup"
        >
          {isOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src={aiInstructorAvatar} 
                alt="IA Instructeur" 
                className="w-full h-full object-cover rounded-full opacity-95 group-hover:opacity-100 transition-all duration-300"
                referrerPolicy="no-referrer"
              />
              {/* Elegant glowing gradient overlay */}
              <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-transparent rounded-full transition-opacity duration-300" />
              <Sparkles className="w-3 h-3 absolute top-1 right-1 text-yellow-400 fill-yellow-400 animate-pulse drop-shadow-sm" />
            </div>
          )}

          {/* Message Indicator bubble */}
          {hasNewResponse && !isOpen && (
            <span className="absolute -top-1 -right-1 bg-rose-500 w-3.5 h-3.5 rounded-full border border-white flex items-center justify-center text-[7px] font-black text-white">
              1
            </span>
          )}
        </button>
      </div>

      <ConfirmationModal
        isOpen={showClearConfirm}
        type="reset"
        title="Réinitialiser la discussion ?"
        message="Voulez-vous vraiment effacer l'historique des échanges avec l'assistant ActuHub IA pour cette session ?"
        confirmText="Réinitialiser"
        onConfirm={handleConfirmClear}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}
