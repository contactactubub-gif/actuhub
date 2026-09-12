import { Lesson } from "../types";

export const LESSONS: Lesson[] = [
  {
    id: "cours-1",
    title: "Cours 1 — Les fondamentaux de la cybersécurité",
    duration: "15 min",
    difficulty: "Débutant",
    category: "Cybersécurité Générale",
    summary: "Découvrez les piliers indispensables de la sécurité numérique, la triade Confidentialité-Intégrité-Disponibilité et les réflexes essentiels.",
    icon: "shield",
    publisher: "ActuHub Bénin • Académie",
    publishedAt: "2026-01-15",
    pages: [
      {
        title: "Introduction et Piliers Fondamentaux",
        sections: [
          {
            title: "Introduction à la Cybersécurité",
            body: [
              "La cybersécurité regroupe l'ensemble des méthodes, outils et bonnes pratiques permettant de protéger les ordinateurs, téléphones, réseaux, applications et données contre les accès non autorisés, les vols, les destructions et les utilisations malveillantes.",
              "Elle s'applique aussi bien aux citoyens dans leur vie quotidienne qu'aux administrations, entreprises et organes de presse."
            ]
          },
          {
            title: "1. Les principaux objectifs de la cybersécurité",
            body: [
              "La sécurité informatique repose notamment sur trois principes fondamentaux (la triade CID) :",
              "• Confidentialité : Les informations doivent uniquement être accessibles aux personnes autorisées.",
              "• Intégrité : Les données ne doivent pas être modifiées ou détruites sans autorisation préalable.",
              "• Disponibilité : Les systèmes et informations doivent rester accessibles lorsque les utilisateurs légitimes en ont besoin."
            ]
          }
        ]
      },
      {
        title: "Menaces & Bonnes Pratiques",
        sections: [
          {
            title: "2. Les principales menaces",
            body: [
              "Dans l'espace numérique actuel, les cybermenaces les plus fréquentes comprennent :",
              "• Virus et logiciels malveillants (malwares)",
              "• Vol de mots de passe et d'identifiants",
              "• Hameçonnage ou phishing par email, SMS ou WhatsApp",
              "• Fraude en ligne et arnaques financières",
              "• Vol et piratage de comptes personnels et professionnels",
              "• Espionnage informatique et captation de données",
              "• Ransomware (logiciels d'extorsion et de rançonnage)",
              "• Faux sites Internet imitant des services officiels",
              "• Ingénierie sociale (manipulation psychologique des victimes)",
              "• Fuite et divulgation de données confidentielles."
            ]
          },
          {
            title: "3. Les bons réflexes au quotidien",
            body: [
              "• Utiliser des mots de passe uniques, longs et difficiles à deviner.",
              "• Activer systématiquement l'authentification à deux facteurs (2FA).",
              "• Maintenir ses appareils, navigateurs et applications à jour.",
              "• Éviter d'installer des logiciels ou fichiers provenant de sources inconnues.",
              "• Ne jamais communiquer ses codes confidentiels ni ses numéros secrets.",
              "• Vérifier rigoureusement les liens avant de cliquer.",
              "• Effectuer régulièrement des sauvegardes de ses données importantes."
            ]
          },
          {
            title: "Exemple concret & Résumé",
            body: [
              "Exemple : Une personne reçoit un message indiquant que son compte bancaire sera bloqué si elle ne confirme pas immédiatement ses informations. Le message contient un lien. Il ne faut pas cliquer directement. Il faut accéder au service bancaire depuis son application officielle ou son adresse connue.",
              "Résumé : La cybersécurité n'est pas uniquement une affaire d'experts. Chaque utilisateur constitue une partie importante de la sécurité d'un système."
            ]
          }
        ]
      }
    ],
    exercise: {
      title: "Exercice Pratique — Cours 1",
      instructions: "Répondez de manière structurée aux trois questions suivantes pour valider vos acquis fondamentaux.",
      questions: [
        "1. Citez trois menaces informatiques majeures rencontrées dans l'espace numérique.",
        "2. Expliquez clairement la différence entre confidentialité et intégrité des données.",
        "3. Donnez cinq bonnes pratiques de cybersécurité à appliquer au quotidien."
      ],
      solutionGuide: [
        "1. Exemples de menaces : Le phishing (hameçonnage), les ransomwares (rançongiciels) et l'ingénierie sociale.",
        "2. La confidentialité garantit que seules les personnes autorisées ont accès à la donnée. L'intégrité garantit que la donnée n'a pas été altérée, falsifiée ou détruite sans droit.",
        "3. Bonnes pratiques : Mots de passe uniques et robustes, activation du 2FA, mises à jour continues, vérification des URLs avant clic, sauvegardes régulières (règle 3-2-1)."
      ]
    }
  },
  {
    id: "cours-2",
    title: "Cours 2 — Créer et protéger ses mots de passe",
    duration: "15 min",
    difficulty: "Débutant",
    category: "Protection des Accès",
    summary: "Apprenez à concevoir des phrases secrètes inviolables, à utiliser un gestionnaire de mots de passe et à déployer la double authentification.",
    icon: "shield",
    publisher: "ActuHub Bénin • Académie",
    publishedAt: "2026-01-16",
    pages: [
      {
        title: "Méthodes de Robustesse & Erreurs Courantes",
        sections: [
          {
            title: "Introduction",
            body: [
              "Le mot de passe constitue souvent la première barrière protégeant un compte numérique. Un mot de passe faible peut être découvert par différentes techniques, notamment les attaques automatisées (brute-force, dictionnaires) ou l'utilisation d'informations personnelles facilement accessibles sur les réseaux."
            ]
          },
          {
            title: "1. Caractéristiques d'un bon mot de passe",
            body: [
              "Un bon mot de passe doit être :",
              "• Long (au moins 12 à 16 caractères)",
              "• Unique pour chaque service ou plateforme",
              "• Difficile à deviner par un tiers",
              "• Différent pour chaque compte et ne pas contenir uniquement des informations personnelles.",
              "Astuce : Une phrase secrète longue (ex: 'LeMatinJeBois2CafesAuPorto!') peut être plus facile à retenir qu'une combinaison courte et complexe tout en étant bien plus sécurisée."
            ]
          },
          {
            title: "2. Les erreurs majeures à éviter",
            body: [
              "Évitez formellement :",
              "• 123456, azerty, password, admin, 000000",
              "• Prénom + année de naissance (ex: 'Marc1992')",
              "• Votre propre numéro de téléphone ou plaque d'immatriculation",
              "• Le même mot de passe réutilisé sur plusieurs sites",
              "• Ne partagez jamais vos mots de passe par SMS, messagerie ou note papier visible."
            ]
          }
        ]
      },
      {
        title: "Gestionnaires & Double Authentification (2FA)",
        sections: [
          {
            title: "3. Utiliser un gestionnaire de mots de passe",
            body: [
              "Un gestionnaire de mots de passe permet de stocker de manière chiffrée et de générer des mots de passe uniques et aléatoires pour chaque plateforme.",
              "Il faut toutefois protéger très fortement le mot de passe maître (Master Password) du gestionnaire avec une longue phrase secrète et activer le 2FA."
            ]
          },
          {
            title: "4. Authentification à deux facteurs (2FA)",
            body: [
              "La double authentification ajoute une seconde couche de protection indispensable après le mot de passe.",
              "Même si un pirate découvre votre mot de passe, il ne peut pas se connecter sans la seconde validation :",
              "• Application d'authentification (Google Authenticator, Microsoft Authenticator, Aegis)",
              "• Clé physique de sécurité (FIDO2 / YubiKey)",
              "• Code temporaire reçu par SMS ou notification push."
            ]
          }
        ]
      }
    ],
    exercise: {
      title: "Exercice Pratique — Cours 2",
      instructions: "Mise en situation de création de mots de passe sécurisés sans réutilisation.",
      questions: [
        "Prenez trois comptes fictifs (une boîte email principale, un compte bancaire/mobile money, et un réseau social) et expliquez comment vous créeriez trois mots de passe différents, robustes et mémorisables sans réutiliser le même mot de passe."
      ],
      solutionGuide: [
        "Méthode recommandée : Utiliser des phrases secrètes distinctes contenant chiffres, majuscules et symboles.",
        "Compte Email : 'MonCourrierEst100%SecretALomeEtCotonou!'",
        "Compte Bancaire : 'BanqueProtegeeAvec987Securite@2026'",
        "Réseau Social : 'PartagerDesIdeesAvecPrudence#77'",
        "Point clé : Aucun mot de passe partagé + stockage dans un gestionnaire sécurisé avec 2FA."
      ]
    }
  },
  {
    id: "cours-3",
    title: "Cours 3 — Reconnaître le phishing et les faux messages",
    duration: "15 min",
    difficulty: "Débutant",
    category: "Désinformation & Phishing",
    summary: "Détectez les pièges d'ingénierie sociale, faux messages WhatsApp, SMS d'urgence et usurpations bancaires.",
    icon: "newspaper",
    publisher: "ActuHub Bénin • Académie",
    publishedAt: "2026-01-17",
    pages: [
      {
        title: "Mécanismes et Signes d'Alerte du Phishing",
        sections: [
          {
            title: "Introduction au Phishing",
            body: [
              "Le phishing, ou hameçonnage, consiste à tromper une personne afin de l'amener à communiquer des informations sensibles (mots de passe, numéros de carte, identifiants) ou à effectuer une action dangereuse (cliquer sur un malware, virer de l'argent).",
              "Les fraudeurs imitent régulièrement une banque, une entreprise de télécom, une administration publique béninoise (DGI, CNSS, ministères), un opérateur téléphonique ou même un proche."
            ]
          },
          {
            title: "1. Les signes d'un message suspect",
            body: [
              "Soyez particulièrement attentif lorsque le message :",
              "• Crée un sentiment d'urgence artificiel ('Votre compte sera clôturé dans 2 heures !')",
              "• Demande un mot de passe, un code PIN ou un code de validation SMS (OTP)",
              "• Demande des informations bancaires ou de mobile money",
              "• Contient un lien raccourci ou inhabituel",
              "• Présente des fautes d'orthographe ou une formulation étrange",
              "• Promet un gain exceptionnel, un tirage au sort inattendu ou un cadeau",
              "• Menace de poursuites judiciaires immédiates."
            ]
          }
        ]
      },
      {
        title: "Vérification des Liens & Conduite à Tenir",
        sections: [
          {
            title: "2. Vérifier un lien",
            body: [
              "Avant de cliquer, vérifiez l'adresse réelle (URL) du site. Survolez le lien ou inspectez le nom de domaine exact.",
              "Un nom de domaine ressemblant à celui d'une entreprise officielle (ex: 'banque-bj-securite.com' au lieu du site officiel officiel) ne signifie pas qu'il s'agit du véritable site.",
              "Au Bénin, vérifiez la terminaison légale officielle '.bj' ou '.gouv.bj' pour les services d'État."
            ]
          },
          {
            title: "3. Les faux messages WhatsApp",
            body: [
              "Les escrocs envoient souvent : 'Bonjour, j'ai changé de numéro suite à une panne. Peux-tu m'envoyer 25 000 FCFA d'urgence ?'",
              "Règle d'or : Avant toute opération financière, contactez impérativement la personne par un autre canal (appel vocal direct sur son numéro habituel) pour confirmer."
            ]
          },
          {
            title: "4. Que faire face à un phishing ?",
            body: [
              "• Ne pas cliquer sur les liens.",
              "• Ne pas répondre au message.",
              "• Ne jamais communiquer de données personnelles ou codes secrets.",
              "• Signaler le message sur les plateformes officielles ou au régulateur.",
              "• Supprimer le message suspect.",
              "• Si des informations ont déjà été communiquées : changez immédiatement vos mots de passe et contactez votre institution financière."
            ]
          }
        ]
      }
    ],
    exercise: {
      title: "Exercice Pratique — Cours 3",
      instructions: "Audit critique d'un SMS suspect de gain frauduleux.",
      questions: [
        "Imaginez que vous recevez un SMS indiquant que vous avez gagné un prix de 5 000 000 FCFA et vous demandant de payer des frais de dossier de 15 000 FCFA par Mobile Money pour récupérer votre gain. Identifiez au moins cinq éléments suspects dans cette situation."
      ],
      solutionGuide: [
        "1. Vous n'avez jamais participé à une loterie ou concours justifiant ce gain (gain spontané non sollicité).",
        "2. Exigence de payer des 'frais préalables' pour débloquer un gain (principe classique de l'arnaque aux frais avancés).",
        "3. Utilisation d'un numéro mobile inconnu au lieu d'un émetteur institutionnel certifié.",
        "4. Promesse d'une somme disproportionnée pour susciter l'euphorie et inhiber la méfiance.",
        "5. Sentiment d'urgence ou pression pour payer sans délai."
      ]
    }
  },
  {
    id: "cours-4",
    title: "Cours 4 — Comprendre les arnaques en ligne",
    duration: "15 min",
    difficulty: "Débutant",
    category: "Fraudes & Arnaques",
    summary: "Décryptez les mécanismes des fausses opportunités financières, faux recrutements et la règle des 3 vérifications.",
    icon: "newspaper",
    publisher: "ActuHub Bénin • Académie",
    publishedAt: "2026-01-18",
    pages: [
      {
        title: "Typologie des Fraudes Numériques",
        sections: [
          {
            title: "Introduction",
            body: [
              "Les arnaques en ligne exploitent principalement des leviers psychologiques universels : la confiance, la peur, la cupidité, l'urgence ou la curiosité des victimes.",
              "Les escrocs adaptent constamment leurs scénarios pour paraître crédibles et professionnels."
            ]
          },
          {
            title: "1. Les principales formes d'arnaques",
            body: [
              "• Faux investissements et plateformes de trading miraculeuses",
              "• Faux recrutements et fausses offres d'emploi",
              "• Faux concours et loteries fictives",
              "• Faux héritages et dons providentiels",
              "• Faux prêts à taux zéro ou crédits sans garantie",
              "• Faux vendeurs et faux acheteurs sur les réseaux sociaux",
              "• Faux services administratifs et demandes de timbres fictifs",
              "• Faux profils amoureux (arnaques aux sentiments)",
              "• Fraudes aux paiements et faux reçus Mobile Money."
            ]
          }
        ]
      },
      {
        title: "Investissements, Emploi & La Règle des 3 Vérifications",
        sections: [
          {
            title: "2. Les fausses opportunités d'investissement",
            body: [
              "Un fraudeur peut promettre des rendements extrêmement élevés avec peu ou pas de risque (ex: 'Gagnez 50% en 48 heures').",
              "Règle financière absolue : Tout rendement exceptionnellement élevé et garanti est une escroquerie (schéma de Ponzi ou vol direct)."
            ]
          },
          {
            title: "3. Les fausses offres d'emploi",
            body: [
              "Certains fraudeurs utilisent de faux recrutements pour demander des frais de dossier, des frais de formation préalable, des informations bancaires ou des copies de documents personnels.",
              "Une entreprise sérieuse ne demande jamais d'argent à un candidat pour postuler ou passer un entretien."
            ]
          },
          {
            title: "4. La règle des trois vérifications indispensables",
            body: [
              "Avant d'effectuer tout paiement ou envoi de documents :",
              "1. Vérifier l'identité réelle de la personne ou organisation (registre RCCM, siège physique, contact officiel).",
              "2. Vérifier l'existence réelle de l'offre auprès de canaux tiers indépendants.",
              "3. Vérifier le moyen de paiement et les conditions de transaction."
            ]
          }
        ]
      }
    ],
    exercise: {
      title: "Exercice Pratique — Cours 4",
      instructions: "Analyse critique d'une annonce d'emploi frauduleuse.",
      questions: [
        "Analysez une annonce fictive proposant un emploi de 'Superviseur de projets' avec un salaire très élevé de 800 000 FCFA/mois mais demandant des frais de badge de 10 000 FCFA avant l'entretien. Quels sont les signaux d'alerte ?"
      ],
      solutionGuide: [
        "1. Demande de frais avant même l'entretien : violation des pratiques normales de recrutement.",
        "2. Rémunération disproportionnée par rapport aux exigences du poste pour appâter les candidats.",
        "3. Absence de coordonnées vérifiables de l'entreprise (adresse physique, site officiel, immatriculation légale).",
        "4. Communication par des canaux informels (numéro WhatsApp non professionnel, adresse email générique gmail/yahoo)."
      ]
    }
  },
  {
    id: "cours-5",
    title: "Cours 5 — La désinformation et les fausses informations",
    duration: "20 min",
    difficulty: "Intermédiaire",
    category: "Désinformation & Fact-Checking",
    summary: "Comprenez la mécanique de la désinformation, le rôle des algorithmes et maîtrisez la méthode de vérification STOP.",
    icon: "search",
    publisher: "ActuHub Bénin • Académie",
    publishedAt: "2026-01-19",
    pages: [
      {
        title: "Mécanique de la Fausses Information",
        sections: [
          {
            title: "Introduction",
            body: [
              "La désinformation désigne la diffusion intentionnelle d'informations fausses ou trompeuses dans le but d'induire le public en erreur, de déstabiliser ou de manipuler l'opinion.",
              "Les réseaux sociaux et messageries instantanées permettent à une fausse information de se diffuser de manière virale et exponentielle en quelques minutes."
            ]
          },
          {
            title: "1. Différence entre information, mésinformation et désinformation",
            body: [
              "• Mésinformation : Information inexacte partagée sans intention délibérée de nuire (erreur de bonne foi).",
              "• Désinformation : Contenu délibérément forgé ou détourné pour tromper le public.",
              "L'intentionnalité est le critère discriminant capital."
            ]
          },
          {
            title: "2. Pourquoi les fausses informations fonctionnent-elles ?",
            body: [
              "Elles exploitent les biais cognitifs humains :",
              "• La peur et la colère face à des situations d'urgence",
              "• Les émotions fortes et les croyances préexistantes (biais de confirmation)",
              "• Les événements d'actualité sensibles et les titres sensationnels (putaclics)."
            ]
          }
        ]
      },
      {
        title: "Méthode STOP & Vérification Multimédia",
        sections: [
          {
            title: "3. La Méthode de vérification STOP",
            body: [
              "• S (Suspendre) : Suspendre immédiatement le partage. Ne relayez rien sous le coup de l'émotion.",
              "• T (Trouver) : Trouver la source originelle de l'information.",
              "• O (Observer) : Observer les preuves factuelles, les dates et le contexte.",
              "• P (Procéder) : Procéder à une vérification croisée auprès de médias homologués HAAC ou institutions."
            ]
          },
          {
            title: "4. Vérifier une image",
            body: [
              "Une image peut être authentique mais ancienne, sortie de son contexte initial ou provenir d'un pays étranger.",
              "Utilisez la recherche inversée d'images (Google Lens, TinEye, Yandex) pour retrouver la publication originale."
            ]
          },
          {
            title: "5. Vérifier une vidéo",
            body: [
              "Une vidéo peut avoir été coupée, ralentie, manipulée par IA (deepfake) ou enregistrée lors d'un événement antérieur.",
              "Vérifiez la météo, les plaques d'immatriculation, les voix et confrontez avec des reportages certifiés."
            ]
          }
        ]
      }
    ],
    exercise: {
      title: "Exercice Pratique — Cours 5",
      instructions: "Audit d'une rumeur institutionnelle virale.",
      questions: [
        "Une publication virale sur Facebook et WhatsApp affirme : « Une nouvelle décision gouvernementale entre en vigueur demain matin interdisant telle activité ». Avant de partager, donnez cinq vérifications rigoureuses à effectuer."
      ],
      solutionGuide: [
        "1. Consulter le site officiel du Secrétariat Général du Gouvernement ou de la présidence (sgg.gouv.bj).",
        "2. Vérifier les communiqués officiels des ministères compétents ou de régulation.",
        "3. Consulter les médias accrédités béninois (presse nationale, radio/TV nationale).",
        "4. Vérifier l'existence d'un décret ou arrêté signé avec sceaux officiels et date valide.",
        "5. Ne pas relayer tant qu'aucune source officielle ne confirme l'information (application du principe STOP)."
      ]
    }
  },
  {
    id: "cours-6",
    title: "Cours 6 — La loi du numérique au Bénin",
    duration: "20 min",
    difficulty: "Intermédiaire",
    category: "Législation & Droit Numérique",
    summary: "Comprenez le Code du numérique béninois, les sanctions légales contre la cybercriminalité et la protection des données personnelles.",
    icon: "shield",
    publisher: "ActuHub Bénin • Académie",
    publishedAt: "2026-01-20",
    pages: [
      {
        title: "Cadre Légal & Données Personnelles",
        sections: [
          {
            title: "Introduction",
            body: [
              "L'utilisation du numérique au Bénin s'inscrit dans un cadre juridique strict destiné notamment à encadrer les communications électroniques, les services numériques, la protection des données à caractère personnel et la répression des infractions cybercriminelles.",
              "Les cybercitoyens doivent connaître leurs droits fondamentaux mais également leurs obligations et responsabilités légales."
            ]
          },
          {
            title: "1. Pourquoi connaître le droit numérique ?",
            body: [
              "Internet n'est pas un espace de non-droit. Les actes, messages, publications et partages réalisés en ligne ont une valeur légale et peuvent engager la responsabilité pénale et civile de leurs auteurs."
            ]
          },
          {
            title: "2. Données personnelles et vie privée",
            body: [
              "Les données personnelles comprennent le nom, prénom, numéro de téléphone, adresse postale, photographies, données biométriques et toute information permettant d'identifier une personne directement ou indirectement.",
              "Il est strictement interdit de collecter, publier ou diffuser sans autorisation légale les données personnelles d'autrui (doxxing)."
            ]
          }
        ]
      },
      {
        title: "Cybercriminalité & Responsabilité Civique",
        sections: [
          {
            title: "3. Respect de la vie privée et droit à l'image",
            body: [
              "Publier la photographie, les enregistrements vocaux ou les conversations privées d'une personne sans son consentement exprès constitue une violation sanctionnée par la loi."
            ]
          },
          {
            title: "4. Infractions cybercriminelles réprimées au Bénin",
            body: [
              "Le Code du numérique punit sévèrement :",
              "• L'accès et le maintien frauduleux dans un système informatique",
              "• L'atteinte à l'intégrité et à la disponibilité des données",
              "• L'escroquerie et la fraude informatique en ligne",
              "• L'usurpation d'identité numérique",
              "• La diffusion de fausses nouvelles de nature à troubler l'ordre public ou à porter atteinte à l'honneur d'autrui."
            ]
          },
          {
            title: "5. Grille de responsabilité de l'utilisateur",
            body: [
              "Avant de publier un contenu, posez-vous 5 questions clés :",
              "1. Est-ce vrai et vérifié ?",
              "2. Ai-je le droit légal de publier cette information ?",
              "3. Est-ce que cela porte atteinte à la dignité ou à la sécurité de quelqu'un ?",
              "4. Puis-je justifier formellement mes affirmations devant une juridiction ?",
              "5. Est-ce que je respecte la réglementation en vigueur ?",
              "Important : Ce cours constitue un module de sensibilisation et ne remplace pas une consultation juridique auprès d'un professionnel du droit."
            ]
          }
        ]
      }
    ],
    exercise: {
      title: "Exercice Pratique — Cours 6",
      instructions: "Identification des comportements illicites sur le web béninois.",
      questions: [
        "Donnez trois exemples précis de comportements en ligne pouvant entraîner des poursuites pénales et des sanctions juridiques au Bénin au regard du Code du numérique."
      ],
      solutionGuide: [
        "1. Diffuser délibérément une fausse information portant atteinte à l'honneur d'une personne ou semant la panique publique.",
        "2. Publier des photos intimes ou privées d'une personne sans son consentement (atteinte à la vie privée / revenge porn).",
        "3. Usurper l'identité d'une autorité, d'une entreprise ou d'un tiers sur les réseaux sociaux pour extorquer de l'argent ou tromper des internautes."
      ]
    }
  },
  {
    id: "cours-7",
    title: "Cours 7 — Sécurité informatique en entreprise",
    duration: "20 min",
    difficulty: "Intermédiaire",
    category: "Sécurité Professionnelle",
    summary: "Sécurisez les postes de travail, gérez les habilitations, protégez les données confidentielles et appliquez le télétravail serein.",
    icon: "shield",
    publisher: "ActuHub Bénin • Académie",
    publishedAt: "2026-01-21",
    pages: [
      {
        title: "Comptes, Postes & Documents d'Entreprise",
        sections: [
          {
            title: "Introduction",
            body: [
              "Une entreprise peut disposer d'infrastructures informatiques perfectionnées et rester extrêmement vulnérable si ses collaborateurs adoptent des pratiques négligentes.",
              "La cybersécurité en entreprise est une responsabilité partagée par tous les départements."
            ]
          },
          {
            title: "1. Gestion des comptes et habilitations",
            body: [
              "• Chaque collaborateur doit utiliser son propre compte nominatif avec des droits adaptés à ses missions (principe du moindre privilège).",
              "• Interdiction absolue de partager des identifiants entre collègues.",
              "• Révocation immédiate des comptes et accès des employés ayant quitté l'organisation."
            ]
          },
          {
            title: "2. Gestion des postes et appareils",
            body: [
              "Les ordinateurs professionnels doivent comporter :",
              "• Un mot de passe fort et un verrouillage automatique d'écran (max 3 minutes d'inactivité)",
              "• Des mises à jour automatiques du système et des logiciels",
              "• Un antivirus professionnel géré centralement",
              "• Le chiffrement complet du disque dur (BitLocker / FileVault)."
            ]
          }
        ]
      },
      {
        title: "Télétravail & Procédure de Départ de Collaborateur",
        sections: [
          {
            title: "3. Gestion des documents confidentiels",
            body: [
              "• Ne jamais transférer de documents professionnels sur des boîtes email personnelles non sécurisées.",
              "• Stocker les fichiers sensibles exclusivement sur les serveurs ou espaces cloud d'entreprise agréés."
            ]
          },
          {
            title: "4. Bonnes pratiques en télétravail",
            body: [
              "• Bannir les connexions Wi-Fi publiques ouvertes pour accéder au réseau interne (utiliser un VPN d'entreprise).",
              "• Utiliser exclusivement les logiciels autorisés par la direction informatique.",
              "• Verrouiller l'écran systématiquement dès que l'on quitte son poste de travail.",
              "• Veiller à ce qu'aucun document sensible ne soit visible par des tiers dans un espace partagé."
            ]
          },
          {
            title: "5. Départ d'un employé (Offboarding)",
            body: [
              "Un protocole rigoureux doit être appliqué : désactivation des comptes, révocation des accès distants, restitution des équipements informatiques, modification des mots de passe des comptes d'administration partagés."
            ]
          }
        ]
      }
    ],
    exercise: {
      title: "Exercice Pratique — Cours 7",
      instructions: "Élaboration d'une checklist de sécurité RH & IT pour le départ d'un collaborateur.",
      questions: [
        "Construisez une procédure complète de départ d'un employé comprenant au moins 10 actions de sécurité clés."
      ],
      solutionGuide: [
        "1. Désactiver le compte utilisateur principal (Active Directory / Google Workspace).",
        "2. Révoquer les accès VPN et connexions à distance.",
        "3. Supprimer les accès aux bases de données et logiciels métiers.",
        "4. Récupérer l'ordinateur portable et le smartphone professionnel.",
        "5. Récupérer les clés de sécurité physiques (YubiKey) et badges d'accès.",
        "6. Changer les mots de passe partagés auxquels l'employé avait accès.",
        "7. Rediriger ses emails vers son manager ou un remplaçant.",
        "8. Sauvegarder les données de son poste avant réinitialisation.",
        "9. Effectuer un effacement sécurisé du disque avant réattribution.",
        "10. Documenter et signer la clôture formelle des accès avec le service RH."
      ]
    }
  },
  {
    id: "cours-8",
    title: "Cours 8 — Sécurité des téléphones Android",
    duration: "15 min",
    difficulty: "Débutant",
    category: "Sécurité Mobile",
    summary: "Protégez votre smartphone contre les applications espionnes, le vol de données et configurez les actions d'urgence.",
    icon: "shield",
    publisher: "ActuHub Bénin • Académie",
    publishedAt: "2026-01-22",
    pages: [
      {
        title: "Protection de l'Écran & Hygiène des Applications",
        sections: [
          {
            title: "Introduction",
            body: [
              "Le smartphone Android concentre aujourd'hui l'intégralité de notre vie numérique : conversations privées, photos, comptes bancaires, Mobile Money, codes d'accès et documents professionnels.",
              "Sa compromission peut avoir des répercussions immédiates sur vos finances et votre réputation."
            ]
          },
          {
            title: "1. Protéger l'écran et le verrouillage",
            body: [
              "• Configurer un code PIN d'au moins 6 chiffres (évitez 0000 ou 1234), un mot de passe alphanumérique ou la biométrie (empreinte digitale fiable).",
              "• Éviter les schémas de déverrouillage faciles à observer par-dessus l'épaule.",
              "• Régler le délai de verrouillage automatique à 30 secondes ou 1 minute maximum."
            ]
          },
          {
            title: "2. Installer uniquement des applications fiables",
            body: [
              "• Téléchargez exclusivement depuis le Google Play Store officiel ou des magasins vérifiés.",
              "• Refusez d'activer l'installation depuis des 'sources inconnues' (fichiers APK douteux reçus sur WhatsApp ou Telegram).",
              "• Auditez attentivement les permissions demandées : une application de calculatrice ou de lampe de poche n'a aucun besoin légitime d'accéder à vos contacts, SMS ou micro."
            ]
          }
        ]
      },
      {
        title: "Mises à Jour & Réflexes en Cas de Vol",
        sections: [
          {
            title: "3. Mettre le système Android et les applications à jour",
            body: [
              "Les mises à jour mensuelles de sécurité fournies par Google et les constructeurs corrigent des failles critiques exploitées par les logiciels malveillants."
            ]
          },
          {
            title: "4. Procédure d'urgence en cas de perte ou de vol",
            body: [
              "• Verrouiller et localiser l'appareil à distance via 'Localiser mon appareil' (Find My Device).",
              "• Effacer à distance les données si l'appareil est irrécupérable.",
              "• Modifier immédiatement les mots de passe de tous les comptes synchronisés (Google, emails, banques, réseaux sociaux).",
              "• Révoquer les sessions actives depuis un ordinateur.",
              "• Contacter immédiatement votre opérateur télécom pour suspendre la carte SIM et bloquer le code IMEI de l'appareil."
            ]
          }
        ]
      }
    ],
    exercise: {
      title: "Exercice Pratique — Cours 8",
      instructions: "Plan de blindage pour smartphone Android.",
      questions: [
        "Citez dix mesures concrètes permettant de protéger un smartphone Android contre le piratage et le vol de données."
      ],
      solutionGuide: [
        "1. Définir un code PIN robuste (6+ chiffres) ou biométrie.",
        "2. Verrouiller la carte SIM avec un code PIN personnalisé (différent de 0000).",
        "3. Activer 'Localiser mon appareil' de Google.",
        "4. Activer le chiffrement complet du téléphone.",
        "5. Ne télécharger que sur le Google Play Store.",
        "6. Réviser et limiter les permissions des applications installées.",
        "7. Désactiver le Bluetooth et la localisation lorsqu'ils ne sont pas utilisés.",
        "8. Appliquer régulièrement les mises à jour du système Android.",
        "9. Sauvegarder automatiquement ses photos et documents sur un cloud sécurisé.",
        "10. Ne jamais cliquer sur des liens suspects reçus par SMS ou messageries."
      ]
    }
  },
  {
    id: "cours-9",
    title: "Cours 9 — Fraude financière et paiements numériques",
    duration: "15 min",
    difficulty: "Débutant",
    category: "Fraudes Financières & Mobile Money",
    summary: "Déjouez les escroqueries Mobile Money, faux agents bancaires, faux reçus de transfert et conservez l'intégrité de vos avoirs.",
    icon: "shield",
    publisher: "ActuHub Bénin • Académie",
    publishedAt: "2026-01-23",
    pages: [
      {
        title: "Règles d'Or des Services Financiers Mobiles",
        sections: [
          {
            title: "Introduction",
            body: [
              "Les services financiers numériques (Mobile Money, portefeuilles électroniques, applications bancaires) ont transformé l'économie au Bénin mais constituent la cible prioritaire des cybercriminels.",
              "La majorité des vols financiers reposent sur la tromperie directe de l'utilisateur plutôt que sur le piratage des serveurs bancaires."
            ]
          },
          {
            title: "1. Ne jamais communiquer son code secret ou code OTP",
            body: [
              "Un code PIN, un code de validation SMS ou un mot de passe bancaire est strictement personnel et confidentiel.",
              "Règle absolue : Aucun agent bancaire, aucun employé d'opérateur mobile (MTN, Moov, Celtiis) n'est autorisé à vous demander votre code secret, sous aucun prétexte."
            ]
          }
        ]
      },
      {
        title: "Faux Agents, Faux Remboursements & Reçus Falsifiés",
        sections: [
          {
            title: "2. Les faux agents du service client",
            body: [
              "Un fraudeur peut vous contacter en se faisant passer pour un agent technique prétendant devoir 'mettre à jour votre compte Mobile Money' ou 'débloquer une prime'.",
              "Refusez tout échange et raccrochez immédiatement. Contactez le numéro officiel du service client de l'opérateur."
            ]
          },
          {
            title: "3. L'arnaque à la fausse erreur de transfert",
            body: [
              "Un escroc vous envoie un faux SMS ressemblant à une notification de transfert, puis vous appelle en panique en affirmant : 'J'ai envoyé de l'argent par erreur sur votre numéro, veuillez me le renvoyer s'il vous plaît !'",
              "Règle : Avant tout remboursement, consultez toujours votre solde réel via l'application officielle ou le menu USSD officiel pour vérifier que l'argent est réellement présent."
            ]
          },
          {
            title: "4. Captures d'écran et reçus falsifiés",
            body: [
              "Une capture d'écran de transaction ou un reçu PDF envoyé sur WhatsApp est facilement falsifiable à l'aide d'applications gratuites.",
              "Seule la réception effective des fonds sur votre propre compte fait foi de paiement."
            ]
          }
        ]
      }
    ],
    exercise: {
      title: "Exercice Pratique — Cours 9",
      instructions: "Analyse d'un litige de paiement numérique commercial.",
      questions: [
        "Un client vous montre une capture d'écran sur son téléphone attestant qu'il a bien envoyé 50 000 FCFA sur votre compte marchand, mais vous n'avez reçu aucun SMS officiel et votre solde n'a pas augmenté. Expliquez pourquoi cette capture d'écran ne constitue pas une preuve suffisante et comment vous devez réagir."
      ],
      solutionGuide: [
        "1. Une capture d'écran peut être créée en quelques secondes via un faux générateur de reçus ou retouchée par logiciel.",
        "2. Les faux SMS de confirmation peuvent être envoyés depuis un numéro quelconque simulant le nom de l'opérateur.",
        "3. Conduite à tenir : Vérifier son solde directement via son code USSD secret (*880#, *155#, *123#) ou l'application bancaire officielle.",
        "4. Ne jamais livrer la marchandise ni valider la vente tant que les fonds ne sont pas physiquement crédités sur son propre compte."
      ]
    }
  },
  {
    id: "cours-10",
    title: "Cours 10 — Ingénierie sociale : manipuler l'utilisateur",
    duration: "20 min",
    difficulty: "Intermédiaire",
    category: "Ingénierie Sociale & Psychologie",
    summary: "Comprenez comment les pirates exploitent les émotions humaines pour franchir les barrières de sécurité et comment résister à la manipulation.",
    icon: "shield",
    publisher: "ActuHub Bénin • Académie",
    publishedAt: "2026-01-24",
    pages: [
      {
        title: "Leviers Psychologiques de Manipulation",
        sections: [
          {
            title: "Introduction",
            body: [
              "L'ingénierie sociale (Social Engineering) consiste à exploiter les comportements humains, la bienveillance ou la crédulité pour obtenir une information confidentielle, un accès ou une action préjudiciable.",
              "Le cyberattaquant n'attaque pas la machine : il convainc la personne de lui ouvrir la porte."
            ]
          },
          {
            title: "1. Les techniques psychologiques exploitées",
            body: [
              "Les fraudeurs exploitent méthodiquement :",
              "• L'Urgence : Pousser la victime à agir sans réfléchir.",
              "• L'Autorité : Se faire passer pour un directeur, un policier ou un régulateur.",
              "• La Peur : Menacer de sanctions, de poursuites ou de fermeture de compte.",
              "• La Curiosité : Diffuser des liens racoleurs ou des documents prétendument confidentiels.",
              "• L'Appât du gain : Promettre des récompenses financières mirobolantes.",
              "• La Confiance : Exploiter la courtoisie et le désir d'aider un collègue ou un proche."
            ]
          }
        ]
      },
      {
        title: "Cas Pratique & Principe Fondamental de Sécurité",
        sections: [
          {
            title: "2. Exemple concret en entreprise",
            body: [
              "Une personne appelle un employé : 'Bonjour, je suis le responsable de la sécurité informatique du siège. Nous subissons une cyberattaque critique. Donnez-moi immédiatement votre mot de passe et le code SMS que vous venez de recevoir pour que je puisse sécuriser votre poste !'",
              "L'employé doit refuser catégoriquement, raccrocher et contacter son responsable par les voies internes officielles."
            ]
          },
          {
            title: "3. Le principe essentiel",
            body: [
              "Une situation d'urgence ne doit JAMAIS justifier la violation des procédures de sécurité établies.",
              "Plus l'interlocuteur insiste et met la pression, plus la probabilité d'une tentative de manipulation est élevée."
            ]
          }
        ]
      }
    ],
    exercise: {
      title: "Exercice Pratique — Cours 10",
      instructions: "Scénarios d'ingénierie sociale et réactions appropriées.",
      questions: [
        "Imaginez cinq scénarios d'ingénierie sociale différents (autorité, urgence, sentiment, appât du gain, aide technique) et expliquez précisément comment l'utilisateur ciblé doit réagir dans chaque situation."
      ],
      solutionGuide: [
        "1. Scénario d'Autorité (faux directeur demandant un virement secret) : Refuser et appliquer la double validation hiérarchique en face à face ou via numéro vérifié.",
        "2. Scénario d'Urgence (menace de blocage bancaire dans 15 min) : Raccrocher et ouvrir l'application bancaire officielle sans cliquer sur les liens.",
        "3. Scénario Affectif/Familial (proche prétendant avoir eu un accident et demandant de l'argent) : Appeler le proche directement sur son numéro habituel ou joindre sa famille.",
        "4. Scénario de Gain (faux tirage au sort demandant des frais) : Ignorer et bloquer le numéro.",
        "5. Scénario d'Aide Technique (faux support Microsoft appelant pour nettoyer un virus) : Raccrocher immédiatement, ne jamais accorder de prise de contrôle à distance."
      ]
    }
  },
  {
    id: "cours-11",
    title: "Cours 11 — Sauvegarde et récupération des données",
    duration: "20 min",
    difficulty: "Intermédiaire",
    category: "Gestion des Données & Résilience",
    summary: "Maîtrisez la règle 3-2-1, sécurisez vos copies contre les ransomwares et organisez des tests de restauration réguliers.",
    icon: "shield",
    publisher: "ActuHub Bénin • Académie",
    publishedAt: "2026-01-25",
    pages: [
      {
        title: "Périmètre de Sauvegarde & La Règle 3-2-1",
        sections: [
          {
            title: "Introduction",
            body: [
              "Une panne matérielle, un vol, une fausse manipulation humaine ou une attaque par ransomware peut anéantir des années de travail.",
              "La sauvegarde constitue l'ultime rempart garantissant la continuité d'activité et la préservation de son patrimoine numérique."
            ]
          },
          {
            title: "1. Quelles données sauvegarder prioritairement ?",
            body: [
              "• Documents de travail, contrats, factures et comptabilité",
              "• Bases de données clients et systèmes d'information",
              "• Fichiers professionnels et médias (photos, vidéos d'archives)",
              "• Fichiers de configuration et certificats d'accès",
              "• Données personnelles irremplaçables."
            ]
          },
          {
            title: "2. La règle universelle 3-2-1",
            body: [
              "Une stratégie de sauvegarde efficace repose sur trois piliers :",
              "• 3 copies de vos données (1 copie originale de production + 2 sauvegardes)",
              "• 2 supports technologiques différents (ex: disque dur externe local + stockage cloud chiffré)",
              "• 1 copie conservée hors-site (dans un lieu géographique distinct ou cloud isolé) pour parer aux incendies, vols ou inondations."
            ]
          }
        ]
      },
      {
        title: "Test de Restauration & Bonnes Pratiques",
        sections: [
          {
            title: "3. Tester impérativement ses sauvegardes",
            body: [
              "Une sauvegarde qui n'a jamais fait l'objet d'un test de restauration est une sauvegarde fictive qui peut échouer le jour d'un incident majeur.",
              "Planifiez des tests périodiques (trimestriels ou semestriels) de restauration complète de vos fichiers et bases de données."
            ]
          }
        ]
      }
    ],
    exercise: {
      title: "Exercice Pratique — Cours 11",
      instructions: "Conception d'une stratégie de sauvegarde pour entreprise.",
      questions: [
        "Construisez une stratégie de sauvegarde complète appliquant la règle 3-2-1 pour une petite entreprise béninoise possédant 10 ordinateurs et un serveur contenant la base de données clients et la comptabilité."
      ],
      solutionGuide: [
        "1. Copie 1 (Production) : Données actives sur les ordinateurs et le serveur local.",
        "2. Copie 2 (Locale) : Sauvegarde quotidienne automatisée sur un NAS / disque dur réseau local avec versioning.",
        "3. Copie 3 (Hors-site) : Synchronisation chiffrée quotidienne vers un service Cloud sécurisé (ex: Google Drive Workspace / AWS S3 chiffré).",
        "4. Fréquence : Sauvegarde incrémentielle chaque soir à 20h, sauvegarde complète chaque vendredi soir.",
        "5. Test : Simulation semestrielle de restauration de la base comptable sur un poste témoin."
      ]
    }
  },
  {
    id: "cours-12",
    title: "Cours 12 — Sécurité des réseaux Wi-Fi",
    duration: "15 min",
    difficulty: "Débutant",
    category: "Sécurité Réseaux",
    summary: "Sécurisez votre box Internet, configurez le chiffrement WPA3, évitez les pièges des Wi-Fi publics et segmentez vos réseaux.",
    icon: "shield",
    publisher: "ActuHub Bénin • Académie",
    publishedAt: "2026-01-26",
    pages: [
      {
        title: "Sécurisation du Routeur & Chiffrement",
        sections: [
          {
            title: "Introduction",
            body: [
              "Le Wi-Fi offre une grande flexibilité mais transmet les données par ondes radioélectriques accessibles à quiconque se trouve à proximité.",
              "Un réseau sans fil mal sécurisé permet à un pirate d'intercepter les communications ou de s'infiltrer dans vos appareils."
            ]
          },
          {
            title: "1. Protéger le routeur et la box Internet",
            body: [
              "• Modifier immédiatement l'identifiant et le mot de passe d'administration par défaut du routeur (souvent 'admin / admin').",
              "• Utiliser un protocole de chiffrement moderne : WPA2-AES ou WPA3 (bannir l'ancien protocole vulnérable WEP).",
              "• Choisir un mot de passe Wi-Fi long et complexe comportant au moins 16 caractères."
            ]
          },
          {
            title: "2. Mettre à jour le micrologiciel (Firmware)",
            body: [
              "Les équipements réseaux comportent des logiciels internes qui peuvent présenter des vulnérabilités. Installez régulièrement les mises à jour proposées par le fabricant."
            ]
          }
        ]
      },
      {
        title: "Wi-Fi Publics & Segmentation Professionnelle",
        sections: [
          {
            title: "3. Dangers des réseaux Wi-Fi publics ouverts",
            body: [
              "Dans les cafés, hôtels, gares ou aéroports, un cyberattaquant peut créer un faux point d'accès Wi-Fi (Evil Twin) ou intercepter le trafic non chiffré.",
              "Sur un Wi-Fi public : évitez toute opération financière, ne saisissez pas vos mots de passe critiques sans utiliser un VPN réputé."
            ]
          },
          {
            title: "4. Segmentation réseau en entreprise",
            body: [
              "Une organisation doit créer des réseaux Wi-Fi séparés (VLANs) :",
              "• Réseau Professionnel sécurisé pour les ordinateurs et serveurs internes",
              "• Réseau Invités isolé pour les visiteurs externes",
              "• Réseau Objets Connectés (IoT) pour les caméras et imprimantes."
            ]
          }
        ]
      }
    ],
    exercise: {
      title: "Exercice Pratique — Cours 12",
      instructions: "Architecture Wi-Fi sécurisée pour locaux professionnels.",
      questions: [
        "Proposez une architecture réseau Wi-Fi sécurisée pour une entreprise de 20 employés accueillant régulièrement des clients et disposant de caméras de surveillance IP."
      ],
      solutionGuide: [
        "1. Créer 3 SSID séparés sur des VLANs étanches : 'ENT-CORP' (WPA3-Enterprise), 'ENT-GUESTS' (accès internet filtré uniquement), 'ENT-IOT' (caméras isolées sans accès extérieur direct).",
        "2. Désactiver le WPS (Wi-Fi Protected Setup) sur les bornes d'accès.",
        "3. Modifier le mot de passe admin de tous les commutateurs et routeurs.",
        "4. Déployer un pare-feu avec inspection des flux et filtrage DNS."
      ]
    }
  },
  {
    id: "cours-13",
    title: "Cours 13 — Sécurité des réseaux sociaux",
    duration: "15 min",
    difficulty: "Débutant",
    category: "Réseaux Sociaux & Vie Privée",
    summary: "Verrouillez vos comptes Facebook, TikTok, WhatsApp et X, limitez vos traces publiques et auditez vos applications connectées.",
    icon: "newspaper",
    publisher: "ActuHub Bénin • Académie",
    publishedAt: "2026-01-27",
    pages: [
      {
        title: "Protection du Compte & Hygiène des Données",
        sections: [
          {
            title: "Introduction",
            body: [
              "Les plateformes de réseaux sociaux sont devenues les principaux canaux d'échange et d'information mais exposent les utilisateurs au harcèlement, au piratage de compte et au profilage abusif."
            ]
          },
          {
            title: "1. Protéger et verrouiller ses comptes",
            body: [
              "• Activer l'authentification à deux facteurs (2FA) sur WhatsApp, Facebook, TikTok, Instagram et X.",
              "• Activer les notifications de connexion suspecte.",
              "• Vérifier régulièrement la liste des 'sessions et appareils connectés' pour déconnecter les accès suspects."
            ]
          },
          {
            title: "2. Limiter la divulgation d'informations personnelles",
            body: [
              "Évitez de publier publiquement :",
              "• Votre adresse personnelle et votre localisation en temps réel",
              "• Des photos de vos pièces d'identité, cartes bancaires ou billets de voyage",
              "• Des détails sur votre vie privée pouvant servir de réponses à des questions secrètes de récupération de compte."
            ]
          }
        ]
      },
      {
        title: "Faux Profils & Nettoyage des Applications",
        sections: [
          {
            title: "3. Attention aux faux profils et usurpations",
            body: [
              "Une photo séduisante ou un nom familier ne garantit pas l'identité réelle d'un compte. Méfiez-vous des demandes d'amis venant de profils récemment créés ou doublons de vos contacts."
            ]
          },
          {
            title: "4. Révoquer les applications tierces connectées",
            body: [
              "De nombreux jeux en ligne ou questionnaires demandent d'accéder à votre compte social. Supprimez régulièrement les accès accordés aux applications que vous n'utilisez plus."
            ]
          }
        ]
      }
    ],
    exercise: {
      title: "Exercice Pratique — Cours 13",
      instructions: "Audit de sécurité pour profil de réseau social.",
      questions: [
        "Créez une liste de dix paramètres de sécurité et de confidentialité essentiels à vérifier et verrouiller sur son compte de réseau social (Facebook, WhatsApp ou Instagram)."
      ],
      solutionGuide: [
        "1. Vérifier que la double authentification (2FA) est bien active.",
        "2. Auditer l'historique des appareils et sessions actuellement connectés.",
        "3. Restreindre la visibilité des futures publications aux 'Amis uniquement'.",
        "4. Masquer son numéro de téléphone et son adresse email de la recherche publique.",
        "5. Bloquer l'indexation de son profil par les moteurs de recherche externes.",
        "6. Désactiver la géolocalisation automatique sur les publications.",
        "7. Activer l'approbation préalable des identifications (tags) par des tiers.",
        "8. Masquer sa liste d'amis pour éviter le clonage de profil ciblant ses proches.",
        "9. Révoquer toutes les applications tierces et jeux associés obsolètes.",
        "10. Définir un mot de passe unique n'ayant jamais servi sur un autre service."
      ]
    }
  },
  {
    id: "cours-14",
    title: "Cours 14 — Protection contre les ransomwares",
    duration: "20 min",
    difficulty: "Avancé",
    category: "Cybercriminalité Avancée & Rançongiciels",
    summary: "Comprenez les vecteurs d'attaque par ransomware, mettez en œuvre des défenses préventives et maîtrisez le plan d'urgence en cas d'infection.",
    icon: "shield",
    publisher: "ActuHub Bénin • Académie",
    publishedAt: "2026-01-28",
    pages: [
      {
        title: "Fonctionnement & Prévention des Ransomwares",
        sections: [
          {
            title: "Introduction",
            body: [
              "Un ransomware (ou rançongiciel) est un programme malveillant qui chiffre les données d'un ordinateur ou d'un réseau entier pour en bloquer l'accès, puis exige le paiement d'une rançon (généralement en cryptomonnaies) pour fournir la clé de déchiffrement."
            ]
          },
          {
            title: "1. Comment une infection commence-t-elle ?",
            body: [
              "Les vecteurs d'infection les plus fréquents sont :",
              "• Une pièce jointe malveillante reçue par email (faux CV, fausse facture PDF ou ZIP avec macro)",
              "• L'exploitation d'une vulnérabilité système non corrigée",
              "• Un accès distant mal sécurisé (bureau à distance RDP exposé avec mot de passe faible)",
              "• Le téléchargement de logiciels piratés (cracks)."
            ]
          },
          {
            title: "2. Mesures de prévention clés",
            body: [
              "• Maintenir les systèmes d'exploitation et logiciels rigoureusement à jour.",
              "• Sauvegarder quotidiennement les données sur des supports isolés et non connectés en permanence (sauvegarde 'Air-Gap').",
              "• Sensibiliser les équipes à ne jamais ouvrir de pièces jointes inattendues.",
              "• Limiter les privilèges administrateur sur les postes de travail."
            ]
          }
        ]
      },
      {
        title: "Plan d'Urgence & Réaction Immédiate",
        sections: [
          {
            title: "3. Que faire en cas d'attaque par ransomware ?",
            body: [
              "• Isoler immédiatement la machine infectée du réseau (débrancher le câble Ethernet, désactiver le Wi-Fi) pour empêcher la propagation aux serveurs voisins.",
              "• Ne jamais éteindre brutalement l'appareil si une analyse de mémoire vive (RAM) par des experts est possible.",
              "• Prévenir immédiatement les responsables de sécurité informatique et déposer plainte auprès des autorités.",
              "• Ne jamais payer la rançon : le paiement finance le crime organisé et ne garantit en aucun cas la récupération des fichiers."
            ]
          }
        ]
      }
    ],
    exercise: {
      title: "Exercice Pratique — Cours 14",
      instructions: "Élaboration d'un plan de réponse à incident ransomware.",
      questions: [
        "Élaborez un plan d'action opérationnel pour les deux premières heures suivant la découverte d'une attaque par ransomware sur le réseau d'une organisation."
      ],
      solutionGuide: [
        "1. Minute 0-15 : Isoler physiquement toutes les machines suspectes du réseau (débrancher câbles réseau, couper le Wi-Fi, isoler les switchs).",
        "2. Minute 15-30 : Convoquer la cellule de crise cyber et alerter la direction générale et les services juridiques.",
        "3. Minute 30-60 : Identifier le point d'entrée initial de l'attaque et préserver les journaux d'événements (logs) pour l'enquête médico-légale.",
        "4. Minute 60-90 : Vérifier l'intégrité et la disponibilité des sauvegardes hors-ligne (Air-Gap).",
        "5. Minute 90-120 : Contacter l'autorité nationale de cybersécurité (l'ANSSI / BJ-CSIRT) et préparer la communication institutionnelle sans payer la rançon."
      ]
    }
  },
  {
    id: "cours-15",
    title: "Cours 15 — Culture générale de cybersécurité pour les citoyens",
    duration: "25 min",
    difficulty: "Débutant",
    category: "Citoyenneté Numérique & Culture Générale",
    summary: "Le récapitulatif complet des 20 règles d'or indispensables pour naviguer en toute sécurité dans l'écosystème numérique béninois.",
    icon: "award",
    publisher: "ActuHub Bénin • Académie",
    publishedAt: "2026-01-29",
    pages: [
      {
        title: "Les 20 Règles d'Or Essentielles (1 à 10)",
        sections: [
          {
            title: "Introduction",
            body: [
              "La sécurité numérique concerne l'ensemble des composantes de la société béninoise : élèves, étudiants, commerçants, fonctionnaires, entrepreneurs, journalistes, enseignants, parents et enfants.",
              "Adopter de bons réflexes numériques est un acte de citoyenneté responsable."
            ]
          },
          {
            title: "Les 10 Premières Règles Fondamentales",
            body: [
              "1. Utiliser des mots de passe uniques et robustes pour chaque service.",
              "2. Activer systématiquement la double authentification (2FA).",
              "3. Ne jamais communiquer ses codes secrets, codes PIN ou OTP.",
              "4. Vérifier rigoureusement les liens (URLs) avant de cliquer.",
              "5. Se méfier des urgences inhabituelles et des pressions temporelles.",
              "6. Vérifier les offres trop alléchantes pour être vraies.",
              "7. Maintenir ses appareils, systèmes et applications toujours à jour.",
              "8. Installer les applications uniquement depuis les magasins officiels certifiés.",
              "9. Sauvegarder régulièrement ses données importantes sur plusieurs supports.",
              "10. Verrouiller systématiquement ses appareils dès qu'on s'en éloigne."
            ]
          }
        ]
      },
      {
        title: "Les 20 Règles d'Or Essentielles (11 à 20) & Conclusion",
        sections: [
          {
            title: "Les 10 Règles Complémentaires",
            body: [
              "11. Éviter de publier trop d'informations personnelles sur les réseaux sociaux.",
              "12. Vérifier les informations auprès de sources fiables avant de les partager.",
              "13. Se méfier des faux profils et des demandes d'amis inconnues.",
              "14. Vérifier les paiements directement dans son compte réel (jamais sur simple capture d'écran).",
              "15. Ne jamais réutiliser le même mot de passe sur des sites différents.",
              "16. Signaler les contenus illicites, haineux ou comportements suspects aux autorités compétentes.",
              "17. Protéger et éduquer les enfants et les jeunes sur les risques d'Internet.",
              "18. Utiliser des réseaux fiables et sécurisés pour les opérations bancaires et sensibles.",
              "19. Réagir rapidement et changer ses mots de passe en cas de compromission d'un compte.",
              "20. Se former régulièrement aux nouvelles menaces et aux évolutions technologiques."
            ]
          },
          {
            title: "Conclusion & Engagement Citoyen",
            body: [
              "La meilleure protection commence par les comportements quotidiens de chaque individu. La technologie peut contribuer à la sécurité, mais aucun outil ne remplace complètement la vigilance, le bon sens et la formation continue des utilisateurs."
            ]
          }
        ]
      }
    ],
    exercise: {
      title: "Exercice Pratique — Cours 15",
      instructions: "Auto-évaluation complète de votre hygiène numérique.",
      questions: [
        "Sur la base des 20 règles essentielles présentées dans ce cours, évaluez vos pratiques numériques personnelles actuelles et définissez trois actions concrètes et immédiates que vous allez mettre en œuvre dès aujourd'hui pour renforcer votre sécurité en ligne."
      ],
      solutionGuide: [
        "1. Exemple d'action 1 : Installer un gestionnaire de mots de passe et remplacer les mots de passe faibles/dupliqués par des phrases secrètes uniques.",
        "2. Exemple d'action 2 : Activer l'authentification à deux facteurs (2FA) sur son compte email principal, WhatsApp et ses comptes de réseaux sociaux.",
        "3. Exemple d'action 3 : Configurer une sauvegarde automatique hebdomadaire de ses photos et documents importants sur un stockage cloud sécurisé ou disque externe."
      ]
    }
  }
];
