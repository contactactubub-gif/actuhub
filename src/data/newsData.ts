import { RSSSource, Article } from '../types';

export const BENIN_RSS_SOURCES: RSSSource[] = [
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

export const CATEGORIES_LABELS: { [key: string]: string } = {
  all: "Toutes",
  politique: "Politique",
  economie: "Économie",
  sport: "Sport",
  culture: "Culture",
  societe: "Société",
  international: "International"
};

export const SEEDED_ARTICLES: Article[] = [
  {
    id: "seed-1",
    title: "Développement Touristique au Bénin : La Galerie des Arts de Cotonou s'agrandit pour accueillir les œuvres Royales contemporaines",
    link: "https://matinlibre.com/2026/06/galerie-cotonou",
    description: "Le gouvernement béninois a annoncé une subvention spéciale pour étendre l'enceinte de la galerie nationale. Un projet ambitieux visant à célébrer le patrimoine séculaire du pays.",
    pubDate: new Date("2026-08-01T10:00:00Z"),
    source: "Matin Libre",
    sourceColor: "#34495e",
    sourceIcon: "☀️",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=600&auto=format&fit=crop",
    category: "culture"
  },
  {
    id: "seed-2",
    title: "Économie Béninoise : Le port autonome de Cotonou connait une hausse record de 12% de son trafic au premier trimestre",
    link: "https://lepotentiel.bj/2026/port-cotonou-trafic-hausse",
    description: "Grâce aux réformes de numérisation et à la simplification des procédures douanières, le port de Cotonou enregistre une croissance d'activité exceptionnelle, stimulant l'import-export de la sous-région.",
    pubDate: new Date("2026-07-28T09:00:00Z"),
    source: "Le Potentiel",
    sourceColor: "#3498db",
    sourceIcon: "💪",
    image: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=600&auto=format&fit=crop",
    category: "economie"
  },
  {
    id: "seed-3",
    title: "Législatives de 2026 au Bénin : La CENA installe les nouveaux comités de supervision électorale locaux",
    link: "https://lebeninoislibere.bj/2026/cena-install-comites",
    description: "La Commission Électorale Nationale Autonome (CENA) a entamé le déploiement de ses équipes régionales pour garantir un scrutin transparent, inclusif et pacifique dans tous les départements.",
    pubDate: new Date("2026-07-25T14:30:00Z"),
    source: "Le Béninois Libéré",
    sourceColor: "#8e44ad",
    sourceIcon: "🗞️",
    image: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?q=80&w=600&auto=format&fit=crop",
    category: "politique"
  },
  {
    id: "seed-4",
    title: "Guépards du Bénin : Séance d'entraînement intensive à Cotonou avant le grand choc contre le Nigeria",
    link: "https://daabaaru.bj/sports/guepards-entrainement-nigeria",
    description: "Le sélectionneur national a exprimé sa confiance quant à la préparation tactique de son effectif. L'équipe béninoise vise une qualification historique pour la prochaine coupe continentale.",
    pubDate: new Date("2026-07-20T16:00:00Z"),
    source: "Daabaaru",
    sourceColor: "#f39c12",
    sourceIcon: "📰",
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop",
    category: "sport"
  },
  {
    id: "seed-5",
    title: "Transition Énergétique : Le plus grand parc solaire du Nord Bénin entame sa phase de raccordement réseau à Parakou",
    link: "https://nord-benin.bj/energie-solre-parakou-parc",
    description: "Ce projet d'envergure d'une capacité de 50 MW permettra d'alimenter plus de 100 000 foyers ruraux d'ici la fin de l'année, réduisant le coût de l'électricité et l'empreinte carbone.",
    pubDate: new Date("2026-07-18T11:20:00Z"),
    source: "Nord Bénin",
    sourceColor: "#27ae60",
    sourceIcon: "🌍",
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=600&auto=format&fit=crop",
    category: "economie"
  },
  {
    id: "seed-6",
    title: "Éducation Numérique: Plus de 50 lycées techniques béninois dotés de laboratoires informatiques modernes",
    link: "https://africaho.bj/education/dotation-lycees-informatique",
    description: "Le ministère du Numérique et de la Digitalisation, en collaboration avec les partenaires au développement, déploie le programme 'Classe Innovante' pour familiariser la jeunesse avec le codage et les sciences d'avenir.",
    pubDate: new Date("2026-07-15T08:00:00Z"),
    source: "Africa Ho",
    sourceColor: "#2c3e50",
    sourceIcon: "🌍",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop",
    category: "societe"
  },
  {
    id: "seed-7",
    title: "Sécurité Alimentaire de la CEDEAO : Réunion extraordinaire des ministres de l'agriculture à Cotonou",
    link: "https://boulevard-des-infos.bj/cedeao-agriculture-cotonou-agro",
    description: "Les délégations ouest-africaines évaluent les stratégies communes de stockage des céréales et d'autonomie agricole face aux instabilités géopolitiques mondiales et climatiques.",
    pubDate: new Date("2026-07-10T15:45:00Z"),
    source: "Boulevard Infos",
    sourceColor: "#9b59b6",
    sourceIcon: "🛣️",
    image: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?q=80&w=600&auto=format&fit=crop",
    category: "international"
  },
  {
    id: "seed-8",
    title: "Cinéma Mobile au Bénin: Le festival ambulant du court-métrage sillonne 12 communes du pays",
    link: "https://kultutv.bj/festival-cinema-ambulant",
    description: "Soutenu par Kultu TV, ce festival diffuse gratuitement des œuvres de jeunes cinéastes locaux sur des écrans gonflables géants installés sur les places publiques de Bohicon, Lokossa et Nikki.",
    pubDate: new Date("2026-07-05T18:00:00Z"),
    source: "Kultu TV",
    sourceColor: "#9b59b6",
    sourceIcon: "🎭",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop",
    category: "culture"
  }
];
