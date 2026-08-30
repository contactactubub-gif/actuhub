import { LegalPageData } from '../types';

export const DEFAULT_PRIVACY_POLICY: LegalPageData = {
  id: 'privacy',
  title: 'Politique de Confidentialité',
  badge: 'Protection des Données Personnelles (APDP)',
  subtitle: "ACTUHUB s'engage à protéger la vie privée de ses utilisateurs conformément au Code du Numérique en République du Bénin (Loi N° 2017-20) et aux exigences de l'Autorité de Protection des Données Personnelles (APDP).",
  lastUpdated: '18 Août 2026',
  version: 'Version 2.5 (Conforme aux Standards & APDP)',
  sections: [
    {
      id: 'cadre-legal',
      title: '1. Cadre Légal et Identité du Responsable de Traitement',
      icon: 'Shield',
      content: `Le traitement des données à caractère personnel collectées sur la plateforme **ACTUHUB** (www.actuhub-benin.com) est placé sous la responsabilité d'ACTUHUB, en liaison fonctionnelle avec les organismes de régulation de l'information en République du Bénin.

Conformément au Livre V du Code du Numérique béninois relatif à la protection des données personnelles, toute personne physique dispose du droit de garder le contrôle absolu sur ses informations personnelles enregistrées sur la plateforme.`
    },
    {
      id: 'donnees-collectees',
      title: '2. Données Collectées et Modes de Collecte',
      icon: 'Eye',
      content: `ACTUHUB ne collecte que les données strictement nécessaires au bon fonctionnement de ses services d'intérêt public :

* **Données de Compte Citoyen / Média / Admin :** Nom complet, adresse e-mail professionnelle ou personnelle, mot de passe chiffré, type de profil.
* **Données d'Accréditation Média :** Nom de l'organe de presse, numéro d'agrément ou décision légale, lien officiel du média.
* **Données de Signalement de Rumeurs :** URL suspecte, captures d'écran transmises, description de l'infox soumise.
* **Parcours Académie :** Progression dans les cours de vérification de l'information, quiz et badges de certification décernés.
* **Données Techniques :** Logs d'accès sécurisés HTTPS, type de terminal et adresse IP anonymisée.`
    },
    {
      id: 'finalites-traitements',
      title: '3. Finalités des Traitements',
      icon: 'CheckCircle',
      content: `Vos données sont collectées pour exécuter les finalités légitimes suivantes :

* **Vérification de l'Information :** Vérifier la légitimité des sources au registre des médias et valider les flux d'actualités officiels.
* **Modération Citoyenne des Rumeurs :** Traiter et auditer les fausses nouvelles signalées par la communauté.
* **Certificats Citoyens :** Délivrer les attestations officielles de complétion des modules de l'Académie.
* **Cybersécurité et Traçabilité :** Prévenir les tentatives d'usurpation d'identité de médias certifiés et sécuriser les accès.`
    },
    {
      id: 'securite-stockage',
      title: '4. Sécurité et Stockage des Données',
      icon: 'Lock',
      content: `ACTUHUB met en œuvre des mesures techniques et organisationnelles de pointe :

* Chiffrement de toutes les transmissions par protocole sécurisé **TLS / HTTPS 256 bits**.
* Stockage sécurisé sur base de données chiffrée avec règles strictes d'isolation d'accès (Supabase & Firebase).
* Aucun mot de passe n'est jamais stocké en clair.
* Sauvegardes régulières et conformité aux standards internationaux ISO 27001.`
    },
    {
      id: 'droits-utilisateurs',
      title: '5. Vos Droits (Accès, Rectification, Suppression - APDP)',
      icon: 'Scale',
      content: `Conformément à la réglementation APDP en République du Bénin, vous disposez des droits suivants :

* **Droit d'accès :** Obtenir confirmation du traitement de vos données et en recevoir une copie intégrale.
* **Droit de rectification :** Modifier ou corriger directement toute information inexacte via votre espace profil.
* **Droit à l'effacement :** Demander la suppression totale et irréversible de votre compte et de vos données.
* **Droit d'opposition :** Vous opposer à tout traitement de vos données pour motif légitime.

⚠️ **Exercice de vos droits :** Pour toute demande relative à vos données personnelles, écrivez directement à notre Délégué à la Protection des Données : contactactubub@gmail.com.`
    },
    {
      id: 'non-cession',
      title: '6. Non-Cession à des Tiers et Engagement Déontologique',
      icon: 'Building2',
      content: `**ACTUHUB ne vend, ne loue et ne cède aucune donnée personnelle à des fins commerciales ou publicitaires.** Les informations sont strictement réservées aux services d'information citoyenne et aux audits de certification.`
    }
  ]
};

export const DEFAULT_TERMS_OF_SERVICE: LegalPageData = {
  id: 'terms',
  title: "Conditions Générales d'Utilisation (CGU)",
  badge: 'Réglementation & Conditions Générales',
  subtitle: "Règles d'utilisation, droits et obligations relatifs à la plateforme d'information citoyenne et de vérification des faits ACTUHUB.",
  lastUpdated: '18 Août 2026',
  version: 'En vigueur au Bénin • Version 2.5',
  sections: [
    {
      id: 'objet-acceptation',
      title: '1. Objet des CGU et Acceptation',
      icon: 'FileText',
      content: `Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») régissent l'accès et l'utilisation de l'ensemble des services de la plateforme **ACTUHUB** (www.actuhub-benin.com).

Tout utilisateur naviguant sur le site, créant un compte citoyen ou soumettant un signalement reconnaît avoir pris connaissance des présentes CGU et les accepter expressément et sans réserve.`
    },
    {
      id: 'missions-services',
      title: '2. Présentation du Service et Missions Républicaines',
      icon: 'Building2',
      content: `ACTUHUB est un portail républicain de lutte contre la désinformation au Bénin :

* **Agrégation d'actualités :** Centralisation des flux d'articles et journaux accrédités au Bénin.
* **Vérificateur HAAC :** Consultation du registre officiel des organes de presse reconnus.
* **Vigie Citoyenne :** Signalement participatif des rumeurs, fausses nouvelles et manipulations.
* **Académie de Désinformation :** Parcours pédagogiques interactifs et délivrance de certificats citoyens.`
    },
    {
      id: 'obligations-utilisateurs',
      title: '3. Obligations et Responsabilités des Utilisateurs',
      icon: 'AlertTriangle',
      content: `En utilisant ACTUHUB, tout utilisateur s'engage formellement à :

* Ne pas publier ou transmettre de contenus diffamatoires, haineux ou incitant à la violence.
* Ne pas effectuer de signalements abusifs, calomnieux ou frauduleux sur le module de Vigie.
* Respecter la Loi N° 2015-07 portant Code de l'Information et de la Communication ainsi que le Code du Numérique.
* Préserver la confidentialité de ses identifiants et ne pas usurper l'identité d'un journaliste ou d'un média certifié.

⚠️ **Avertissement Légal :** Tout abus intentionnel ou tentative d'atteinte à l'intégrité de la plateforme pourra faire l'objet de poursuites judiciaires devant les tribunaux béninois compétents.`
    },
    {
      id: 'comptes-medias',
      title: '4. Statut Spécifique des Comptes Médias Certifiés',
      icon: 'Shield',
      content: `Les organes de presse titulaires d'un compte de type **Média** bénéficient d'outils de publication avancés (Gestion de la UNE, publication de cours, modération de signalements).

L'attribution et le maintien de ce statut sont conditionnés à la validation par l'Administrateur et au respect de la déontologie journalistique.`
    },
    {
      id: 'propriete-intellectuelle',
      title: "5. Propriété Intellectuelle et Droits d'Auteur",
      icon: 'Scale',
      content: `Les marques, logos, graphismes et technologies développés pour ACTUHUB sont protégés par le droit de la propriété intellectuelle.

Les dépêches, articles et Unes de journaux agrégés demeurent la propriété exclusive de leurs organes de presse respectifs.`
    },
    {
      id: 'droit-applicable',
      title: '6. Modification des CGU et Droit Applicable',
      icon: 'HelpCircle',
      content: `ACTUHUB se réserve le droit de modifier les présentes CGU à tout moment pour les adapter aux évolutions légales et technologiques.

Les présentes CGU sont régies par le **droit béninois**. Tout différend relève de la compétence exclusive des juridictions de Cotonou.`
    }
  ]
};
