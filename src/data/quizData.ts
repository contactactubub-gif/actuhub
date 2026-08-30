import { QuizQuestion } from "../types";

export const QUIZ_QUESTIONS_POOL: QuizQuestion[] = [
  {
    id: 1,
    question: "Vous recevez un message WhatsApp affirmant que la présidence offre des tablettes gratuites via un lien 'presidence-benin-aide.xyz'. Que devez-vous faire ?",
    options: [
      "Je clique immédiatement et je partage aux membres de ma famille pour les aider.",
      "Je me méfie, car la présidence utilise l'extension officielle nationale '.gouv.bj' et non un domaine suspect '.xyz'.",
      "Je laisse mon numéro de passeport pour réserver ma tablette."
    ],
    correctAnswer: 1,
    explanation: "La présidence et les institutions étatiques béninoises communiquent via des canaux officiels et des noms de domaine sécurisés se terminant par '.gouv.bj'. L'utilisation de '.xyz' est caractéristique d'un site de piratage."
  },
  {
    id: 2,
    question: "Quelle est la principale différence entre la mésinformation et la désinformation ?",
    options: [
      "La mésinformation est vraie tandis que la désinformation est toujours fausse.",
      "La désinformation est un mensonge délibéré avec intention de nuire, alors que la mésinformation est diffusée par erreur involontaire.",
      "La désinformation ne se propage que sur papier alors que la mésinformation est numérique."
    ],
    correctAnswer: 1,
    explanation: "C'est l'intention de nuire ou de manipuler qui distingue la désinformation de l'erreur involontaire (mésinformation)."
  },
  {
    id: 3,
    question: "Vous lisez un article de presse en ligne décrivant un prétendu complot à Cotonou, mais l'article n'est signé d'aucun journaliste et utilise des superlatifs angoissants en majuscules. Quelle est votre réaction ?",
    options: [
      "Je partage le texte en l'état car l'auteur semble très concerné.",
      "C'est un contenu sensationnaliste hautement suspect. Je cherche d'abord si des médias officiels enregistrés à la HAAC confirment l'information.",
      "Je contacte le webmaster pour m'abonner."
    ],
    correctAnswer: 1,
    explanation: "L'absence de signature d'un journaliste ou d'un organe agréé, combinée à un ton sensationnaliste, est l'un des signaux d'alerte majeurs de fausse information."
  },
  {
    id: 4,
    question: "En auditant un lien d'article dans le vérificateur HAAC, celui-ci obtient un score de 35 et indique 'Domaine absent de la base HAAC'. Que concluez-vous ?",
    options: [
      "Que le site est totalement illégal et dangereux à propager d'urgence.",
      "La source n'a pas apporté de garanties déontologiques et n'est pas habilitée par la HAAC. Ses articles doivent être pris avec extrême réserve.",
      "Que le vérificateur s'est trompé."
    ],
    correctAnswer: 1,
    explanation: "Un site non inscrit par l'organe régulateur national (la HAAC) opère hors de la déontologie légale de la presse nationale. Prudence absolue requise."
  },
  {
    id: 5,
    question: "Pourquoi est-il risqué de partager une information sous le coup de l'émotion (ex: une peur intense) ?",
    options: [
      "Parce que l'émotion accélère internet.",
      "Parce que les créateurs de fake news misent sur l'urgence émotionnelle pour court-circuiter votre esprit critique.",
      "Parce que WhatsApp interdit le partage d'informations calmes."
    ],
    correctAnswer: 1,
    explanation: "L'urgence artificielle et la manipulation émotionnelle sont des tactiques classiques pour empêcher la réflexion avant le partage."
  },
  {
    id: 6,
    question: "Lequel de ces domaines est un exemple fiable pour une institution administrative du Bénin ?",
    options: [
      "conseil-des-ministres.com",
      "impots.gouv.bj",
      "mairie-cotonou.xyz"
    ],
    correctAnswer: 1,
    explanation: "L'extension '.gouv.bj' est la signature officielle des sites gouvernementaux béninois."
  },
  {
    id: 7,
    question: "Vous voyez une capture d'écran WhatsApp d'un document officiel flou. Quelle est la meilleure approche ?",
    options: [
      "Le partager car tout le monde le fait.",
      "Chercher si le document original est disponible sur le site officiel de l'institution concernée.",
      "Croire le contenu aveuglément car WhatsApp est sécurisé."
    ],
    correctAnswer: 1,
    explanation: "Les captures d'écran sont très faciles à manipuler. Il faut toujours vérifier à la source."
  },
  {
    id: 8,
    question: "C'est quoi le 'biais de confirmation' ?",
    options: [
      "Une technique pour vérifier des faits.",
      "La propension à croire une information juste parce qu'elle correspond à vos croyances préexistantes.",
      "Une méthode de journalisme d'investigation."
    ],
    correctAnswer: 1,
    explanation: "Le biais de confirmation nous fait accepter sans précaution ce qui nous arrange, au détriment de la vérité."
  },
  {
    id: 9,
    question: "Comment identifier un site contrefait de presse ?",
    options: [
      "En regardant seulement si le logo est présent.",
      "En vérifiant attentivement l'adresse URL dans la barre de navigation.",
      "En regardant la couleur du site."
    ],
    correctAnswer: 1,
    explanation: "Les usurpateurs copient les logos, mais ont du mal à copier l'adresse exacte (URL) sans laisser de traces (ex: ajout de mots ou extension suspecte)."
  },
  {
    id: 10,
    question: "Laquelle de ces pratiques est déontologiquement saine pour un média au Bénin ?",
    options: [
      "Publier des articles sans signature pour protéger l'anonymat.",
      "Publier des articles signés par des journalistes identifiables et responsables.",
      "Publier uniquement des rumeurs populaires."
    ],
    correctAnswer: 1,
    explanation: "La responsabilité éditoriale implique que les articles soient signés et vérifiables."
  },
  {
    id: 11,
    question: "Que signifie 'Désinformation' ?",
    options: [
      "Un synonyme d'erreur journalistique.",
      "La diffusion intentionnelle de fausses informations pour manipuler.",
      "Un type d'article de mode."
    ],
    correctAnswer: 1,
    explanation: "L'intentionnalité de tromper est la clé de la définition."
  },
  {
    id: 12,
    question: "Pourquoi les fake news utilisent souvent des titres en MAJUSCULES ?",
    options: [
      "Pour améliorer le référencement naturel.",
      "Pour captiver immédiatement l'attention et provoquer un choc émotionnel (sensationnalisme).",
      "Parce que les claviers sont bloqués ainsi."
    ],
    correctAnswer: 1,
    explanation: "Le sensationnalisme visuel cherche à forcer une réaction immédiate."
  },
  {
    id: 13,
    question: "Comment réagir face à un message WhatsApp douteux demandant de l'argent ?",
    options: [
      "Envoyer l'argent car le compte semble authentique.",
      "Contacter la personne par un autre moyen connu (appel vocal) pour confirmer.",
      "Ignorer le message."
    ],
    correctAnswer: 1,
    explanation: "L'usurpation de compte est fréquente. Une confirmation hors-canal est essentielle."
  },
  {
    id: 14,
    question: "Quel rôle joue la HAAC au Bénin ?",
    options: [
      "Réparer les ordinateurs des citoyens.",
      "Réguler la presse et la communication pour garantir la déontologie.",
      "Organiser les funérailles nationales."
    ],
    correctAnswer: 1,
    explanation: "La Haute Autorité de l'Audiovisuel et de la Communication veille au respect de la déontologie."
  },
  {
    id: 15,
    question: "Que faire si vous trouvez une information fausse sur Facebook ?",
    options: [
      "La signaler via les outils de signalement de la plateforme.",
      "La partager pour montrer à quel point elle est fausse.",
      "Rien faire."
    ],
    correctAnswer: 0, // Need to fix this based on options, signaling is correct
    // options are [signal, share, nothing]. signaling is 0.
    // wait my list was 0-indexed.
    // options: ["Signaler...", "Partager...", "Rien..."]
    // correct is 0.
    explanation: "Le signalement permet aux modérateurs de vérifier et supprimer les contenus nocifs."
  },
  {
    id: 17,
    question: "Vous recevez une photo d'un événement qui semble horrible. Comment vérifier son authenticité ?",
    options: [
      "Je la poste sur Facebook pour demander si c'est vrai.",
      "J'utilise la recherche inversée d'images (Google Lens) pour voir si cette image provient d'un autre contexte ou d'une ancienne date.",
      "Je la crois car elle est très impressionnante."
    ],
    correctAnswer: 1,
    explanation: "La recherche inversée d'image est l'outil principal pour découvrir si une photo est détournée, ancienne, ou truquée."
  },
  {
    id: 18,
    question: "Un email prétend que votre compte bancaire est bloqué et vous demande de cliquer sur un lien pour vous connecter. Quelle est la règle d'or ?",
    options: [
      "Cliquer sur le lien pour débloquer le compte immédiatement.",
      "Ne jamais cliquer sur le lien interne, mais aller manuellement sur le site officiel de ma banque par le navigateur.",
      "Répondre à l'email avec mon mot de passe pour prouver mon identité."
    ],
    correctAnswer: 1,
    explanation: "Les emails de phishing imitent les banques pour voler vos accès. Ne jamais cliquer sur les liens fournis dans ces messages."
  },
  {
    id: 19,
    question: "Qu'est-ce qui caractérise le 'Clickbait' (piège à clics) ?",
    options: [
      "Un titre informatif et neutre décrivant tout le contenu de l'article.",
      "Un titre exagéré, incomplet ou provocateur destiné uniquement à pousser l'internaute à cliquer.",
      "Une analyse approfondie du sujet."
    ],
    correctAnswer: 1,
    explanation: "Le clickbait joue sur la curiosité floue pour générer du trafic publicitaire, souvent au détriment de la qualité de l'information."
  },
  {
    id: 20,
    question: "Une note vocale WhatsApp circule avec la voix d'une personnalité publique tenant des propos douteux. Que devez-vous faire ?",
    options: [
      "La partager immédiatement, c'est la voix de la personne.",
      "Rester sceptique, car les technologies permettent aujourd'hui de cloner très facilement des voix (deepfakes).",
      "La diffuser pour nuire à la réputation de cette personne."
    ],
    correctAnswer: 1,
    explanation: "Les deepfakes audio sont de plus en plus courants et performants. Une grande méfiance est de mise face aux enregistrements vocaux non confirmés par des canaux officiels."
  }
];
