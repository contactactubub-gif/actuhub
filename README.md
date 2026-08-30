# ActuHub Bénin - Plateforme d'Information & Fact-Checking

Application web moderne développée avec **React 19**, **Vite**, **Tailwind CSS**, **Supabase** et **Firebase**.

## 🚀 Hébergement & Déploiement

Cette application est configurée par défaut avec une architecture standardisée compatible avec tous les fournisseurs d'hébergement :

### 1. Cloudflare Pages
- **Framework preset** : `Vite` (ou `None`)
- **Build command** : `npm run build`
- **Build output directory** : `dist`
- *Notes* : Les fichiers de routage `_redirects` et d'en-têtes `_headers` sont automatiquement inclus dans `/dist`.

### 2. Vercel
- Importez le dépôt directement sur Vercel. Le fichier `vercel.json` gère automatiquement le routage SPA.

### 3. Netlify
- Importez le dépôt. Le fichier `netlify.toml` configure automatiquement la commande de build et la redirection `/*` vers `/index.html`.

### 4. Serveur Apache / cPanel / Hébergement partagé
- Déposez le contenu du dossier `dist/` à la racine `public_html`.
- Le fichier `.htaccess` inclus gère automatiquement la réécriture d'URL.

### 5. Serveur NGINX
Ajoutez dans votre configuration de serveur :
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### 6. Serveur Node.js (VPS / Docker / Render / Railway)
```bash
npm install
npm run build:server
npm run start
```

---

## 🛠️ Développement Local

```bash
# Installation des dépendances
npm install

# Lancement en local
npm run dev

# Construction pour la production
npm run build
```
