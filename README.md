# Rasil Frontend Dashboard

Frontend V0 demo pour Rasil, la surface operations pour boutiques e-commerce marocaines.

## Ce qui est implemente

- Interface App Router Next.js 15
- Authentification Supabase pour proteger le dashboard
- Flux reel de creation et selection de boutiques via le backend
- UI French-first, light-mode-first
- Tableau de bord
- Chats type inbox
- Profil de la boutique
- Produits avec ajout, edition, suppression et import en masse
- Connaissance IA
- Integrations avec WhatsApp hero card et plateformes e-commerce
- Confirmations de commande
- Couche d'API typée avec propagation des headers d'identite utilisateur

## Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- composants shadcn-style
- TanStack Query
- React Hook Form
- Zod

## Etat actuel

Le frontend est maintenant branche sur le backend pour:

- l'authentification frontend via Supabase
- la resolution des boutiques du compte connecte avec `GET /me/businesses`
- la creation reelle d'une boutique avec `POST /me/businesses`
- toutes les requetes backend authentifiees avec `X-Auth-User-Id` et `X-Auth-User-Email`

Les ecrans business-scopes continuent d'utiliser les endpoints `/business/{businessId}/...`.

## Lancer le projet

```bash
cd frontend
npm install
npm run dev
```

Ouvrez ensuite [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

Copiez `.env.example` vers `.env.local` :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Note:
- `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont requis pour la connexion
- `NEXT_PUBLIC_API_BASE_URL` est requis pour les endpoints backend
- le frontend n'utilise plus de business demo en dur

## Authentification

- routes publiques: `/login`, `/signup`, `/forgot-password`, `/reset-password`
- routes privees: `/businesses`, `/b/[businessId]/*`, plus les redirects legacy `/dashboard/*`
- la protection est assuree par Supabase SSR via `middleware.ts`
- la page `/auth/callback` finalise les liens de confirmation email et de reinitialisation
- apres connexion:
  - 0 boutique => onboarding `/businesses`
  - 1 boutique => redirection directe vers `/b/{id}`
  - plusieurs boutiques => selection sur `/businesses`

## Structure

```text
frontend/
  app/b/[businessId]/
  app/businesses/
  components/
    businesses/
    chats/
    dashboard/
    forms/
    integrations/
    products/
    rag/
    ui/
  lib/
    api/
    types/
    validators/
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Phase suivante

Pour l'integration backend:

- assurez-vous que `/me/businesses`, `/me/business` et `POST /me/businesses` sont disponibles
- assurez-vous que le backend accepte `X-Auth-User-Id` et `X-Auth-User-Email`
- conservez les endpoints business-scopes existants `/business/{businessId}/...`
