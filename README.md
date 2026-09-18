# CaveAVin

Application de gestion de cave a vin personnelle (PWA).

## Developpement local

1. Copier `.env.example` vers `.env` et renseigner votre URL et cle Supabase.
2. `npm install`
3. `npm run dev`

## Deploiement (gratuit)

1. Creer un projet sur https://vercel.com (ou https://netlify.com), relie a ce depot git.
2. Renseigner les variables d'environnement `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans les parametres du projet Vercel/Netlify.
3. Commande de build : `npm run build`. Dossier de sortie : `dist`.
4. `vercel.json` (Vercel) et `public/_redirects` (Netlify) sont fournis pour rediriger toutes les routes vers `index.html` : les liens profonds et les rafraichissements sur des routes comme `/cellar` ou `/bottles/:id` fonctionnent donc correctement.
5. Une fois deploye, ouvrir l'URL sur mobile et utiliser "Ajouter a l'ecran d'accueil" pour installer l'app.
