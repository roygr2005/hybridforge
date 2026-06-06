# 🏋️ Train Smart — V1

Application de tracking fitness : musculation + endurance, avec architecture Coach IA prête à brancher.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (Auth + PostgreSQL)
- **Recharts** (graphiques)

## Structure

```
src/
├── app/
│   ├── page.tsx          # Landing page
│   ├── auth/             # Connexion / inscription
│   ├── dashboard/        # Vue d'ensemble
│   ├── strength/         # Tracker musculation
│   ├── endurance/        # Tracker endurance
│   ├── progress/         # Graphiques progression
│   ├── ai-coach/         # Coach IA (paywall)
│   └── profile/          # Profil utilisateur
├── components/           # Navbar, StatCard, ProtectedLayout
├── hooks/                # useAuth, useLang
├── i18n/                 # Traductions FR/EN
├── lib/                  # Client Supabase
└── types/                # Types TypeScript + Database
```

## Installation

### 1. Créer un projet Supabase

1. Va sur [supabase.com](https://supabase.com) → New project
2. Dans l'éditeur SQL, colle et exécute le contenu de `supabase-schema.sql`
3. Récupère l'URL et la clé `anon` dans **Settings → API**

### 2. Variables d'environnement

```bash
cp .env.local.example .env.local
```

Remplis `.env.local` :
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. Lancer en local

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000)

## Activer le Coach IA (v2)

Dans `src/app/ai-coach/page.tsx`, remplace la fonction `getMockResponse` par un vrai appel API :

```typescript
// Exemple avec Claude / Anthropic
const response = await fetch('/api/coach', {
  method: 'POST',
  body: JSON.stringify({ message: userMsg, profile, recentSessions })
})
```

Crée `src/app/api/coach/route.ts` avec ton handler API.

Pour activer le premium sur un compte en dev :
```sql
UPDATE public.profiles SET is_premium = true WHERE email = 'ton@email.com';
```

## Déploiement

```bash
npm run build
```

Compatible Vercel, Netlify, Railway — ajoute les variables d'env dans le dashboard du provider.
