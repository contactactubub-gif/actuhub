# 🔎 ACTUHUB IMAGE CHECK - GUIDE D'INSTALLATION ET D'UTILISATION

Actuhub Image Check est un module indépendant d'analyse forensique et de détection d'images générées ou modifiées par Intelligence Artificielle.

**AVERTISSEMENT FONDAMENTAL :**
Ce système ne dépend d'aucune API payante externe (Google Vision payant, Sightengine, Hive, OpenAI). Il fonctionne 100% sur des bibliothèques et modèles open source exécutables localement. L'analyse fournit une estimation technique et ne constitue jamais une preuve absolue.

---

## 🛠️ PRÉREQUIS & DÉPENDANCES

1. **Node.js** v20.0.0 ou supérieur
2. **Python** 3.10 ou supérieur (avec venv)
3. **Supabase** (ou stockage local de secours)

---

## 🚀 INSTALLATION RAPIDE (SANS DOCKER)

### 1. Installation du Backend Node.js / Frontend React
```bash
# Installation des packages npm
npm install

# Copier le fichier d'environnement
cp .env.example .env
```

### 2. Configuration de l'environnement Python
```bash
# Création de l'environnement virtuel Python
python3 -m venv .venv

# Activation (Linux / macOS)
source .venv/bin/activate

# Activation (Windows PowerShell)
# .venv\Scripts\Activate.ps1

# Installation des dépendances Python
pip install -r python/image_forensics/requirements.txt
```

### 3. Exécution de la Base de Données
Exécutez le fichier SQL `schema_image_check.sql` ou la migration `supabase/migrations/20260912_image_check.sql` dans votre console Supabase.

### 4. Lancement de l'application
```bash
# Lancement du serveur de développement fullstack
npm run dev
```

---

## 🐳 DÉPLOIEMENT DOCKER (VPS LINUX)

```bash
# Lancer les conteneurs Frontend, Backend et Python Forensics
docker-compose up --build -d
```

---

## 🔍 FONCTIONNALITÉS CLÉS
- **Analyse ELA (Error Level Analysis)** : Évaluation des écarts de compression JPEG.
- **Métadonnées EXIF / IPTC / XMP** : Détection d'appareil photo, objectif, logiciel et prompts IA.
- **Certificats C2PA / Content Credentials** : Inspection des blocs JUMBF et signatures de provenance.
- **Empreinte Hash** : Empreinte SHA-256 et Perceptual Hash (pHash, dHash) pour dédoublonnage.
- **Score Composé Actuhub** : Algorithme pondéré de fusion des signaux (0-100).
- **Export PDF & Partage** : Génération de rapports détaillés et liens publics sécurisés.
