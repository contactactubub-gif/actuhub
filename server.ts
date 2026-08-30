import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '1mb' }));

  // Security Headers Middleware
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // In-memory store for messages sent via platform
  const receivedContactMessages: any[] = [];

  // GET API endpoint to view received contact messages
  app.get("/api/contact/messages", (req, res) => {
    res.json({
      count: receivedContactMessages.length,
      messages: receivedContactMessages
    });
  });

  // Contact API endpoint - Transmit messages directly to contactactubub@gmail.com
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message, type } = req.body;
      
      if (!name || !email || !message) {
        return res.status(400).json({ error: "Tous les champs (nom, email, message) sont obligatoires." });
      }

      const targetEmail = "contactactubub@gmail.com";
      const subjectTitle = subject || type || "Formulaire de Contact ActuHub";
      const timestamp = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Porto-Novo' });

      const newMsgEntry = {
        id: "msg-" + Date.now(),
        name,
        email,
        subject: subjectTitle,
        message,
        timestamp,
        recipient: targetEmail
      };

      receivedContactMessages.unshift(newMsgEntry);
      console.log(`[ActuHub Contact] Nouveau message enregistré (#${newMsgEntry.id}) pour ${targetEmail} de ${name} (${email}) - ${subjectTitle}`);

      // 1. Send via FormSubmit AJAX endpoint
      try {
        const formSubmitRes = await fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            _subject: `[ActuHub Bénin] ${subjectTitle} - de ${name}`,
            _replyto: email,
            Nom: name,
            Email: email,
            Sujet: subjectTitle,
            Message: message,
            Date: timestamp,
            Plateforme: "ActuHub Bénin (www.actuhub-benin.com)"
          })
        });
        const formResult = await formSubmitRes.json();
        console.log("[ActuHub Contact] Statut d'envoi FormSubmit:", formResult);
      } catch (mailErr) {
        console.error("[ActuHub Contact] Erreur relais FormSubmit:", mailErr);
      }

      return res.json({
        success: true,
        recipient: targetEmail,
        id: newMsgEntry.id,
        message: `Votre message a bien été transmis à l'équipe ActuHub (${targetEmail}).`
      });
    } catch (err: any) {
      console.error("[ActuHub Contact] Erreur serveur lors de la réception:", err);
      return res.status(500).json({ error: "Erreur serveur lors de la transmission du message." });
    }
  });

  // Helper function to handle local search-based replies instantly with no API key required
  const generateLocalResponse = (msg: string, ctx: any) => {
    const query = msg.toLowerCase().trim();
    const rawArticles = ctx?.articles || [];
    const rawRumors = ctx?.rumors || [];

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
      return `👋 Bonjour ! Je suis l'assistante intelligente locale d'ActuHub Bénin.

Je fonctionne de manière autonome en direct sur le site pour vous aider à :
• 📰 Chercher des articles (ex: tapez un mot-clé comme "santé", "cotonou", "haac")
• 🚨 Vérifier les rumeurs et Fake News récentes (ex: tapez "rumeur" ou un mot-clé)
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
4. 🚨 **L'évaluation par verdict Fact-Checking** : Sur ActuHub, l'onglet "Vérification" vous présente des rumeurs auditées. Le statut est classé en **Vrai**, **Faux** ou **Trompeur**.`;
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

ActuHub Bénin agrège et référence les médias autorisés et reconnus en République du Bénin.

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
1. Allez sur l'onglet d'accueil d'ActuHub ou sur l'onglet "Vérification".
2. Cliquez sur le bouton "Signaler une rumeur" (dans la section de vérification).
3. Renseignez le titre, la description, et si possible ajoutez une image ou capture d'écran.
4. L'équipe de modération d'ActuHub analysera votre alerte pour lui attribuer un statut (Vrai, Faux, Trompeur).`;
    }

    // 7. User Profile / Reports
    if (
      query.includes("mon profil") ||
      query.includes("mes infos") ||
      query.includes("mes signalements") ||
      query.includes("mes alertes")
    ) {
      if (!ctx.userProfile) {
        return "Vous n'êtes pas connecté. Veuillez vous connecter pour voir vos informations et signalements.";
      }
      return `👤 **Mon Profil ActuHub**
      
Nom : ${ctx.userProfile.fullName || 'Utilisateur'}
Rôle : ${ctx.userProfile.role || 'Citoyen'}

Vous avez contribué à la lutte contre la désinformation !`;
    }

    // Extract search tokens for smart local relevance matching
    const queryTokens = query
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
      .split(/\s+/)
      .filter((token: string) => token.length > 2); // only consider keywords > 2 chars

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
              score += 2; // heavier weight for title match
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
      const scoredArticles = rawArticles.map((a: any) => {
        let score = 0;
        const searchArea = `${a.title || ''} ${a.source || ''} ${a.description || ''} ${a.category || ''}`.toLowerCase();
        queryTokens.forEach((token: string) => {
          if (searchArea.includes(token)) {
            score += 1;
            if ((a.title || '').toLowerCase().includes(token)) {
              score += 2; // heavier weight for title match
            }
          }
        });
        return { article: a, score };
      });

      matchedArticles = scoredArticles
        .filter((item: any) => item.score > 0)
        .sort((a: any, b: any) => b.score - a.score)
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
  *Explication & Verdict* : ${r.explanation || 'Analyse en cours par l\'équipe de modération.'}`;
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

    // 5. Default fallback
    const recentArticles = rawArticles.slice(0, 2);
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

  // AI Chatbot endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      let { message, history, context } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Le message est obligatoire." });
      }

      // Sanitize & truncate message input
      message = message.trim().substring(0, 2000);
      if (message.length === 0) {
        return res.status(400).json({ error: "Le message ne peut pas être vide." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Run completely free, instant, local interactive search guide as requested!
        console.log("[ActuHub Assistant] No GEMINI_API_KEY found. Running in Smart Local Mode.");
        const reply = generateLocalResponse(message, context);
        return res.json({ reply });
      }

      // Lazy initialize GoogleGenAI client with proper build headers
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Prioritize live autonomous server RSS articles first, then merge with client context
      const clientArticles = context?.articles || [];
      const combinedMap = new Map<string, any>();
      
      // 1. Add server's fresh autonomous RSS articles first
      cachedAutonomousArticles.forEach((a: any) => {
        const key = (a.link || a.id || a.title || '').trim();
        if (key) combinedMap.set(key, a);
      });
      
      // 2. Add client articles only if they don't overwrite fresh server articles or if they are newer
      clientArticles.forEach((a: any) => {
        const key = (a.link || a.id || a.title || '').trim();
        if (!key) return;
        if (!combinedMap.has(key)) {
          combinedMap.set(key, a);
        } else {
          // Compare dates and keep the newer version
          const existing = combinedMap.get(key);
          const existingTime = new Date(existing.pubDate || 0).getTime();
          const clientTime = new Date(a.pubDate || 0).getTime();
          if (!isNaN(clientTime) && clientTime > existingTime) {
            combinedMap.set(key, a);
          }
        }
      });

      // Filter out stale items older than 72 hours and sort descending (newest first)
      const nowMs = Date.now();
      const maxAgeMs = 72 * 60 * 60 * 1000;
      const rawArticles = Array.from(combinedMap.values())
        .filter((a: any) => {
          if (!a || !a.title) return false;
          const t = new Date(a.pubDate || 0).getTime();
          return !isNaN(t) && t > 0 && (nowMs - t) <= maxAgeMs;
        })
        .sort((a, b) => {
          const timeA = new Date(a.pubDate || 0).getTime();
          const timeB = new Date(b.pubDate || 0).getTime();
          return timeB - timeA;
        });

      // Detect generic "recent news" intent vs specific topic query
      const lowerMsg = message.toLowerCase();
      const isGeneralNewsQuery = /dieu|derni[eè]re|r[eé]cente|actu|actualit[eé]|nouvelle|info|aujourd|ce matin|quoi de neuf|fil info|d[eé]p[eê]che|quoi de beau|pass[eé]/i.test(lowerMsg);

      // Extract search tokens from user message, excluding common generic filler words
      const genericStopWords = new Set(['que', 'qui', 'quoi', 'comment', 'pourquoi', 'avec', 'dans', 'pour', 'sur', 'les', 'des', 'une', 'un', 'est', 'sont', 'donne', 'moi', 'nous', 'vous', 'dernière', 'dernières', 'derniers', 'récente', 'récentes', 'actualité', 'actualités', 'nouvelles', 'nouvelle', 'infos', 'info', 'bénin', 'benin']);
      const queryTokens = lowerMsg
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
        .split(/\s+/)
        .filter((token: string) => token.length > 2 && !genericStopWords.has(token));

      let articlesList: any[] = [];
      if (isGeneralNewsQuery && queryTokens.length === 0) {
        // If user asks for general recent news, take top 6 freshest news directly
        articlesList = rawArticles.slice(0, 6);
      } else if (queryTokens.length > 0) {
        const scoredArticles = rawArticles.map((a: any) => {
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

        const matched = scoredArticles
          .filter((item: any) => item.score > 0)
          .sort((a: any, b: any) => {
            if (b.score !== a.score) return b.score - a.score;
            // Tie-breaker: most recent date
            return new Date(b.article.pubDate || 0).getTime() - new Date(a.article.pubDate || 0).getTime();
          })
          .map((item: any) => item.article);

        if (matched.length > 0) {
          articlesList = matched.slice(0, 6);
        } else {
          articlesList = rawArticles.slice(0, 6);
        }
      } else {
        articlesList = rawArticles.slice(0, 6);
      }

      // Score and select relevant rumors
      const rawRumors = context?.rumors || [];
      let rumorsList = [];
      if (queryTokens.length > 0) {
        const scoredRumors = rawRumors.map((r: any) => {
          let score = 0;
          const searchArea = `${r.title || ''} ${r.description || ''} ${r.explanation || ''} ${r.status || ''}`.toLowerCase();
          queryTokens.forEach((token: string) => {
            if (searchArea.includes(token)) {
              score += 1;
              if ((r.title || '').toLowerCase().includes(token)) {
                score += 2; // heavier weight for title match
              }
            }
          });
          return { rumor: r, score };
        });

        const matched = scoredRumors
          .filter((item: any) => item.score > 0)
          .sort((a: any, b: any) => b.score - a.score)
          .map((item: any) => item.rumor);

        if (matched.length > 0) {
          rumorsList = matched.slice(0, 5);
        } else {
          rumorsList = rawRumors.slice(0, 4);
        }
      } else {
        rumorsList = rawRumors.slice(0, 4);
      }

      // Format articles and rumors context for the AI prompt
      const articlesCtx = articlesList.map((a: any) => {
        let dateLabel = 'Inconnue';
        if (a.pubDate) {
          const d = new Date(a.pubDate);
          const diffMs = Date.now() - d.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMs / 3600000);
          
          if (diffMins < 60) {
            dateLabel = `Publié il y a ${Math.max(1, diffMins)} min (${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})`;
          } else if (diffHours < 24) {
            dateLabel = `Publié il y a ${diffHours} h (${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})`;
          } else {
            dateLabel = `Publié le ${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
          }
        }
        return `- [ARTICLE TRÈS RÉCENT] Titre: "${a.title}" | Source: ${a.source || 'Presse Béninoise'} | Horodatage: ${dateLabel} | Catégorie: ${a.category || 'Général'} | Résumé: ${a.description || ''}`;
      }).join('\n');

      const rumorsCtx = rumorsList.map((r: any) => {
        let statusLabel = 'En attente de vérification 🔍';
        if (r.status === 'fake') statusLabel = 'FAUX ❌ (Fake News confirmée)';
        if (r.status === 'misleading') statusLabel = 'TROMPEUR ⚠️';
        if (r.status === 'verified') statusLabel = 'VRAI/VÉRIFIÉ ✅';
        
        return `- [SIGNALEMENT DE RUMEUR] ID: ${r.id} | Titre: ${r.title} | Statut: ${statusLabel} | Niveau de danger/importance: ${r.level || 'bas'} | Description: ${r.description || ''} | Explications Fact-checking: ${r.explanation || ''}`;
      }).join('\n');

      const systemInstruction = `Tu es "l'Assistant IA ActuHub Bénin", un chatbot intelligent, courtois, objectif et ultra-compétent. Ton rôle est d'aider les citoyens béninois à vérifier des rumeurs, s'informer sur les actualités et lutter contre la désinformation.

Tu as un accès total aux informations de la plateforme ActuHub Bénin en temps réel, y compris les flux de presse (RSS) et les rumeurs vérifiées.

Tu peux aussi aider l'utilisateur à consulter ses propres informations, comme son profil ou ses signalements en cours (s'il est connecté).

=== REPERTOIRE DE CONNAISSANCES LOCALES STRATEGIQUES ===

1. LA DESINFORMATION AU BENIN :
   - Définition : Propagation délibérée d'infox/fake news pour induire en erreur ou nuire.
   - Types courants au Bénin :
     * Arnaques/Phishing WhatsApp : Fausses promesses de gains MTN/Moov ("Partagez à 10 groupes pour toucher 50 000F").
     * Faux recrutements : Imitations d'offres d'emploi d'organismes de l'État (CNSS, Douanes, Police Républicaine) pour escroquer les candidats.
     * Deepfakes & Cheapfakes : Photos/vidéos de personnalités publiques béninoises sorties de leur contexte ou manipulées.

2. METHODOLOGIE DE FACT-CHECKING (VERIFICATION) SUR ACTUHUB :
   - Règle 1 (Croisement) : Chercher si au moins 3 médias officiels béninois indépendants confirment l'information.
   - Règle 2 (Recherche inversée) : Utiliser Google Lens ou TinEye pour vérifier si l'image date d'un autre événement ou pays.
   - Règle 3 (Sources gouvernementales) : Consulter le portail officiel du Secrétariat du Gouvernement (gouv.bj) ou les communiqués des ministères.
   - Règle 4 (Verdict Fact-Checking) : Consulter l'onglet "Vérification" d'ActuHub où les rumeurs auditées reçoivent un verdict (Vrai, Faux, Trompeur).

3. PAYSAGE MEDIATIQUE ET AGGREGATION DE FLUX RSS :
   - Registre HAAC : Registre légal des organes de presse au Bénin, qu'ActuHub consulte pour la vérification des accréditations.
   - Indexation ActuHub : Les éditeurs de presse soumettent leur numéro d'enregistrement/récépissé et leur flux RSS. Après un audit strict d'éthique et de régularité par la modération ActuHub, le flux RSS est agrégé automatiquement toutes les heures, évitant ainsi le sensationnalisme et les fake news.
   - Exemples de médias certifiés : La Nation, ORTB, Matin Libre, Fraternité, Banouto, L'Événement Précis.

Voici les données courantes de l'application chargées en temps réel (filtrées intelligemment pour correspondre à la recherche actuelle) :

=== FLUX DE PRESSE ET ARTICLES RSS RÉCENTS ===
${articlesCtx || "Aucun article d'actualité n'est chargé pour le moment."}

=== SIGNALEMENTS DE RUMEURS ET VÉRIFICATIONS (ACTUHUB / CITOYENS) ===
${rumorsCtx || "Aucun signalement de rumeur n'est encore enregistré."}

=== CONTEXTE UTILISATEUR ===
- Onglet actuel sur ActuHub : ${context?.currentTab || 'Inconnu'}
- Profil utilisateur connecté : ${context?.userProfile ? `${context.userProfile.fullName || 'Citoyen'} (Rôle: ${context.userProfile.role || 'Citoyen'})` : 'Visiteur anonyme'}
- Heure locale du système : ${new Date().toLocaleString('fr-FR')}

=== DIRECTIVES STRICTES POUR TES RÉPONSES ===
1. Sois extrêmement précis et factuel. Si on te pose une question sur une actualité ou une rumeur présente dans les listes ci-dessus, sers-toi de ces données. Cite la source de presse ou l'explication de vérification ! (Exemple: "D'après le quotidien Matin Libre...", ou "L'analyse montre que ce signalement est FAUX car...").
2. Si une rumeur est signalée comme FAUX (Fake News), sois très ferme et constructif dans tes explications pour contrer la rumeur.
3. Si une information n'est PAS présente dans les données ci-dessus, utilise ton savoir mais reste prudent en précisant que cela ne figure pas parmi nos flux locaux synchronisés en direct.
4. Rédige tes réponses en excellent français, avec un ton professionnel, encourageant et dynamique. Reste neutre sur les sujets politiques.
5. Encourage les utilisateurs à suivre les cours et quiz interactifs de la "Désinformation Academy" (accessible via l'onglet Académie) pour devenir des citoyens numériques responsables.
6. Utilise le format Markdown de manière fluide (listes à puces, mots importants en gras, titres légers) pour structurer tes réponses. Évite les réponses excessivement longues ou redondantes.`;

      // Construct contents array with conversion of history to GoogleGenAI chat parts format
      const contents = [];
      if (history && Array.isArray(history)) {
        history.forEach((h: any) => {
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }]
          });
        });
      }

      // Add the final user query
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      // Support multiple model fallbacks to handle high-demand spikes (503) and ensure highest availability
      const candidateModels = [
        "gemini-3.5-flash",
        "gemini-flash-latest",
        "gemini-3.1-flash-lite"
      ];

      let responseText = "";
      let lastError: any = null;

      for (const modelName of candidateModels) {
        try {
          console.log(`[ActuHub Assistant] Attempting response generation using model: ${modelName}...`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.6,
            }
          });
          if (response && response.text) {
            responseText = response.text;
            console.log(`[ActuHub Assistant] Successfully generated response using model: ${modelName}`);
            break;
          }
        } catch (err: any) {
          console.warn(`[ActuHub Assistant] Model ${modelName} returned error or was unavailable. Retrying with next model. Details:`, err.message || err);
          lastError = err;
        }
      }

      if (!responseText) {
        console.warn("[ActuHub Assistant] Gemini APIs returned errors or were rate limited. Falling back to high-quality smart local response engine.");
        const reply = generateLocalResponse(message, context);
        return res.json({ reply });
      }

      return res.json({ reply: responseText });
    } catch (error: any) {
      console.error("Gemini API server endpoint error (general catch):", error);
      try {
        // Ultimate fallback to ensure the chatbot never crashes and works instantly
        const reply = req.body?.message ? `Je n'ai pas pu joindre les serveurs d'intelligence artificielle pour le moment.\n\nVoici une recherche interne automatique pour votre message :\n\n${generateLocalResponse(req.body.message, req.body.context)}` : "Une erreur s'est produite. Veuillez réessayer.";
        return res.json({ reply });
      } catch (innerErr) {
        return res.status(500).json({ 
          error: "Désolé, impossible de répondre pour le moment. Veuillez vérifier la connexion." 
        });
      }
    }
  });

  // RSS Proxy Endpoint to fetch live XML feeds directly from news servers
  app.get("/api/rss-proxy", async (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
      const feedUrl = req.query.url as string;
      if (!feedUrl) {
        return res.status(400).json({ error: "Paramètre URL manquant" });
      }

      // Validate URL format and prevent SSRF (Server-Side Request Forgery)
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(feedUrl);
      } catch {
        return res.status(400).json({ error: "URL invalide" });
      }

      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return res.status(400).json({ error: "Protocole non autorisé" });
      }

      const hostname = parsedUrl.hostname.toLowerCase();
      // Block requests to localhost, loopback, metadata endpoints, and internal IPs
      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "0.0.0.0" ||
        hostname === "::1" ||
        hostname.endsWith(".local") ||
        hostname.endsWith(".internal") ||
        hostname === "169.254.169.254" || // Cloud metadata endpoint
        hostname.startsWith("10.") ||
        hostname.startsWith("192.168.") ||
        (hostname.startsWith("172.") && parseInt(hostname.split(".")[1], 10) >= 16 && parseInt(hostname.split(".")[1], 10) <= 31)
      ) {
        return res.status(403).json({ error: "Accès à cette destination interdit" });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(feedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ActuHub/1.0',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return res.status(response.status).json({ error: `Erreur serveur distant: ${response.status}` });
      }

      const xmlText = await response.text();
      res.setHeader('Content-Type', 'text/xml; charset=utf-8');
      return res.send(xmlText);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Impossible de charger le flux RSS" });
    }
  });

  // --- Autonomous Server-Side RSS Aggregator Engine ---
  interface ServerArticle {
    id: string;
    title: string;
    link: string;
    description: string;
    pubDate: string;
    source: string;
    sourceColor?: string;
    sourceIcon?: string;
    image?: string | null;
    category: string;
  }

  let cachedAutonomousArticles: ServerArticle[] = [];
  let lastAutonomousFetchTime: number = 0;
  let isFetchingAutonomous = false;

  const SERVER_BENIN_SOURCES = [
    { name: "Benin Web TV", url: "https://beninwebtv.bj/feed/", color: "#3498db", icon: "📺" },
    { name: "Matin Libre", url: "https://matinlibre.com/feed/", color: "#34495e", icon: "☀️" },
    { name: "Le Potentiel", url: "https://lepotentiel.bj/?feed=rss2", color: "#2980b9", icon: "💪" },
    { name: "Le Béninois Libéré", url: "https://www.lebeninoislibere.bj/feed/", color: "#8e44ad", icon: "🗞️" },
    { name: "Le Matinal", url: "https://lematinal.bj/feed/", color: "#e67e22", icon: "📰" },
    { name: "Boulevard des Infos", url: "https://www.boulevard-des-infos.bj/feed/", color: "#9b59b6", icon: "🛣️" },
    { name: "Africa Ho", url: "https://www.africaho.bj/feed/", color: "#2c3e50", icon: "🌍" },
    { name: "L'Investigateur", url: "https://linvestigateur.info/feed/", color: "#16a085", icon: "🔍" },
    { name: "La Nouvelle Tribune", url: "https://lanouvelletribune.info/feed/", color: "#c0392b", icon: "🗞️" },
    { name: "Bénin Intelligent", url: "https://beninintelligent.bj/feed/", color: "#1abc9c", icon: "💡" }
  ];

  function decodeHtmlEntities(text: string): string {
    if (!text) return '';
    return text
      .replace(/&#8211;/g, '–')
      .replace(/&#8212;/g, '—')
      .replace(/&#8217;/g, "'")
      .replace(/&#8216;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&#8230;/g, '…')
      .replace(/&#038;/g, '&')
      .replace(/&#39;/g, "'")
      .replace(/&#039;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&rdquo;/g, '"')
      .replace(/&ldquo;/g, '"')
      .replace(/&hellip;/g, '…')
      .replace(/&eacute;/g, 'é')
      .replace(/&egrave;/g, 'è')
      .replace(/&ecirc;/g, 'ê')
      .replace(/&agrave;/g, 'à')
      .replace(/&ocirc;/g, 'ô')
      .replace(/&ugrave;/g, 'ù')
      .replace(/&ccedil;/g, 'ç')
      .replace(/&#(\d+);/g, (_, code) => {
        try { return String.fromCharCode(parseInt(code, 10)); } catch { return ''; }
      });
  }

  function parseXmlItems(xmlText: string, sourceName: string, sourceColor?: string, sourceIcon?: string): ServerArticle[] {
    const items: ServerArticle[] = [];
    
    // Check if XML text is actually an HTML error page or 404
    if (!xmlText || xmlText.includes('<html') || xmlText.includes('404 Not Found') || xmlText.includes('Erreur 404')) {
      return items;
    }

    const itemMatches = xmlText.match(/<item[\s\S]*?<\/item>|<entry[\s\S]*?<\/entry>/gi) || [];

    for (const itemXml of itemMatches.slice(0, 10)) {
      const titleMatch = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/title>/i);
      const rawTitle = titleMatch ? (titleMatch[1] || titleMatch[2] || '') : '';
      const title = decodeHtmlEntities(rawTitle.replace(/<[^>]+>/g, '').trim());

      const linkMatch = itemXml.match(/<link[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/link>|<link[^>]+href=["']([^"']+)["']/i);
      const link = linkMatch ? (linkMatch[1] || linkMatch[2] || linkMatch[3] || '').trim() : '';

      const descMatch = itemXml.match(/<description[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/description>|<summary[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/summary>|<content:encoded[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/content:encoded>/i);
      const rawDesc = descMatch ? (descMatch[1] || descMatch[2] || descMatch[3] || descMatch[4] || descMatch[5] || descMatch[6] || '') : '';
      const cleanDesc = decodeHtmlEntities(rawDesc.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()).substring(0, 190) + '...';

      const dateMatch = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>|<updated[^>]*>([\s\S]*?)<\/updated>|<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i);
      const rawDate = dateMatch ? (dateMatch[1] || dateMatch[2] || dateMatch[3] || '') : '';
      const parsedDate = new Date(rawDate);
      const pubDateStr = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString();

      const imgMatch = itemXml.match(/url=["']([^"']+(?:\.jpg|\.jpeg|\.png|\.webp|\.gif)[^"']*)["']/i) || 
                       itemXml.match(/href=["']([^"']+(?:\.jpg|\.jpeg|\.png|\.webp|\.gif)[^"']*)["']/i) || 
                       itemXml.match(/<img[^>]+src=["']([^"']+)["']/i) ||
                       itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i) ||
                       itemXml.match(/<media:content[^>]+url=["']([^"']+)["']/i);
      const image = imgMatch ? (imgMatch[1] || imgMatch[2] || imgMatch[3] || null) : null;

      // Strict validation: reject empty, short, or corrupted titles/links
      const lowerTitle = title.toLowerCase();
      const isCorrupted = !title || title.length < 5 || 
        lowerTitle.includes('404') || 
        lowerTitle.includes('not found') || 
        lowerTitle.includes('erreur') || 
        lowerTitle.includes('maintenance') || 
        lowerTitle.includes('access denied') ||
        !link || (!link.startsWith('http://') && !link.startsWith('https://'));

      if (!isCorrupted) {
        let linkHash = 0;
        for (let i = 0; i < link.length; i++) {
          linkHash = ((linkHash << 5) - linkHash) + link.charCodeAt(i);
          linkHash |= 0;
        }
        const id = `art-${sourceName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Math.abs(linkHash)}`;

        items.push({
          id,
          title,
          link,
          description: cleanDesc,
          pubDate: pubDateStr,
          source: sourceName,
          sourceColor: sourceColor || "#3498db",
          sourceIcon: sourceIcon || "📰",
          image,
          category: "societe"
        });
      }
    }
    return items;
  }

  async function refreshAutonomousServerRssFeed() {
    if (isFetchingAutonomous) return;
    isFetchingAutonomous = true;
    console.log("[ActuHub AutoEngine] Starting background RSS synchronization (1-min cycle)...");

    const fetchedBatch: ServerArticle[] = [];
    const seenUrls = new Set<string>();

    await Promise.all(
      SERVER_BENIN_SOURCES.map(async (source) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const response = await fetch(source.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ActuHub/1.0',
              'Accept': 'application/rss+xml, application/xml, text/xml, */*'
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const xmlText = await response.text();
            const parsed = parseXmlItems(xmlText, source.name, source.color, source.icon);
            parsed.forEach(art => {
              if (art.link && !seenUrls.has(art.link)) {
                seenUrls.add(art.link);
                fetchedBatch.push(art);
              }
            });
          }
        } catch (e) {
          // Continue quietly to next feed
        }
      })
    );

    // Prioritize fetchedBatch over old cached articles, and purge items older than 72 hours
    const nowMs = Date.now();
    const maxAgeMs = 72 * 60 * 60 * 1000;
    const mergedList = [...fetchedBatch, ...cachedAutonomousArticles];
    const uniqueMap = new Map<string, ServerArticle>();
    
    mergedList.forEach(art => {
      if (!art || !art.title) return;
      const t = new Date(art.pubDate).getTime();
      if (isNaN(t) || (nowMs - t) > maxAgeMs) return; // Discard articles older than 72 hours
      
      const slug = art.title.toLowerCase().trim().replace(/[^a-z0-9]/g, '').substring(0, 45);
      if (slug.length < 5) return;
      
      if (!uniqueMap.has(slug)) {
        uniqueMap.set(slug, art);
      } else {
        const existing = uniqueMap.get(slug)!;
        const existingT = new Date(existing.pubDate).getTime();
        if (t > existingT || (!existing.image && art.image)) {
          uniqueMap.set(slug, art);
        }
      }
    });

    const finalArticles = Array.from(uniqueMap.values());
    if (finalArticles.length > 0) {
      // Sort descending by date (most recent first)
      finalArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
      cachedAutonomousArticles = finalArticles.slice(0, 200);
      lastAutonomousFetchTime = Date.now();
      console.log(`[ActuHub AutoEngine] Sync completed. Cached ${cachedAutonomousArticles.length} recent articles.`);
    }

    isFetchingAutonomous = false;
  }

  // Trigger initial autonomous sync on boot and every 1 minute (60,000 ms)
  refreshAutonomousServerRssFeed();
  setInterval(refreshAutonomousServerRssFeed, 1 * 60 * 1000);

  // Endpoint to get the autonomous feed (Non-blocking response for instant speed)
  app.get("/api/rss-feed", async (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
      const isStale = Date.now() - lastAutonomousFetchTime > 1 * 60 * 1000;
      
      // If we have cached articles, return immediately and trigger background sync if force or stale
      if (cachedAutonomousArticles.length > 0) {
        if (req.query.force === "true" || isStale) {
          refreshAutonomousServerRssFeed().catch(() => {});
        }
        return res.json({
          status: "ok",
          lastUpdated: lastAutonomousFetchTime ? new Date(lastAutonomousFetchTime).toISOString() : new Date().toISOString(),
          count: cachedAutonomousArticles.length,
          autoIntervalSeconds: 60,
          articles: cachedAutonomousArticles
        });
      }

      // If initial boot and cache is empty, wait for the first fetch to complete
      await refreshAutonomousServerRssFeed();
      return res.json({
        status: "ok",
        lastUpdated: lastAutonomousFetchTime ? new Date(lastAutonomousFetchTime).toISOString() : new Date().toISOString(),
        count: cachedAutonomousArticles.length,
        autoIntervalSeconds: 60,
        articles: cachedAutonomousArticles
      });
    } catch (err: any) {
      return res.json({
        status: "ok",
        lastUpdated: new Date().toISOString(),
        count: cachedAutonomousArticles.length,
        articles: cachedAutonomousArticles
      });
    }
  });

  // Serve React frontend (Vite dev server in development, static files in production)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Determine dist directory path reliably
    let distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(path.join(__dirname, 'index.html'))) {
      distPath = __dirname;
    } else if (!fs.existsSync(path.join(distPath, 'index.html')) && fs.existsSync(path.join(process.cwd(), 'index.html'))) {
      distPath = process.cwd();
    }
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ActuHub] Server running on host 0.0.0.0 port ${PORT}`);
  });
}

startServer();
