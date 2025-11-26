# EPSIWordle

Le jeu Wordle exclusif pour les étudiants de l'EPSI.

## Fonctionnalités

- 🔒 **Authentification exclusive** : Connexion réservée aux emails `@ecoles-epsi.net`.
- 📅 **Wordle quotidien** : Un mot unique par jour pour tous les joueurs.
- 📊 **Statistiques avancées** : Suivi des victoires, streak, distribution des essais.
- 👤 **Profil personnalisable** : Avatar, campus, classe, préférences.
- 📱 **Responsive** : Interface optimisée pour mobile et desktop.

## Prérequis

- Node.js 18+
- Compte Supabase

## Installation locale

1. Cloner le repo
   ```bash
   git clone <url-du-repo>
   cd epsiwordle
   ```

2. Installer les dépendances
   ```bash
   npm install
   ```

3. Configurer les variables d'environnement
   Créer un fichier `.env.local` à la racine avec les clés Supabase :
   ```
   NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
   SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role
   ```

4. Configurer Supabase
   - Aller dans le tableau de bord Supabase > SQL Editor.
   - Copier et exécuter le contenu de `supabase/migrations/20240101000000_initial_schema.sql`.
   - Dans Authentication > Providers > Email, désactiver "Confirm email" pour le développement si souhaité (ou configurer le serveur SMTP).
   - Dans Authentication > URL Configuration, ajouter `http://localhost:3000/auth/callback` aux Redirect URLs.
   - Créer un bucket 'avatars' dans Storage et le rendre public.

5. Lancer le serveur de développement
   ```bash
   npm run dev
   ```

## Déploiement sur Vercel

1. Pousser le code sur GitHub.
2. Créer un nouveau projet sur Vercel et importer le repo.
3. Configurer les variables d'environnement dans Vercel (les mêmes que `.env.local` + `NEXT_PUBLIC_SITE_URL`).
   - `NEXT_PUBLIC_SITE_URL` : L'URL de votre site en production (ex: https://epsiwordle.vercel.app)
4. Déployer.
5. Dans Supabase > Authentication > URL Configuration, ajouter l'URL de production aux Redirect URLs.

## Structure du projet

- `app/` : Pages et layouts Next.js (App Router).
- `components/` : Composants React réutilisables.
- `lib/` : Logique métier et clients (Supabase, Wordle).
- `hooks/` : Custom hooks React.
- `supabase/` : Migrations SQL.

## Technologies

- Next.js 16
- Supabase (Auth, Database, Storage)
- Tailwind CSS 4
- Recharts
- React Hook Form + Zod
