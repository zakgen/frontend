# Rasil Frontend Dashboard

Frontend V0 demo pour Rasil, la surface operations pour boutiques e-commerce marocaines.

## Ce qui est implemente

- Interface App Router Next.js 15
- Authentification Supabase pour proteger le dashboard
- UI French-first, light-mode-first
- Tableau de bord
- Conversations type inbox
- Profil de la boutique
- Produits avec ajout, edition, suppression et import en masse
- Connaissance IA
- Integrations avec WhatsApp hero card et plateformes e-commerce
- Couche d'API typée avec adaptateur mock pour la demo

## Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- composants shadcn-style
- TanStack Query
- React Hook Form
- Zod

## Etat actuel

Cette phase est volontairement **UI-first**.

- Les ecrans tournent sur des donnees mock/demo
- L'acces au dashboard est prive via Supabase Auth
- L'architecture d'adaptation API reste en place pour brancher le backend plus tard
- Aucune dependance backend n'est requise pour la demo UX

## Lancer le projet

```bash
cd frontend
npm install
npm run dev
```

Ouvrez ensuite [http://localhost:3000/dashboard](http://localhost:3000/dashboard).

## Variables d'environnement

Copiez `.env.example` vers `.env.local` :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_DEMO_BUSINESS_ID=1
```

Note:
- `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont requis pour la connexion
- `NEXT_PUBLIC_API_BASE_URL` est documentee pour la phase d'integration backend
- la V0 actuelle utilise le mock adapter comme source principale

## Authentification

- routes publiques: `/login`, `/signup`, `/forgot-password`, `/reset-password`
- routes privees: `/dashboard/*`
- la protection est assuree par Supabase SSR via `middleware.ts` et une verification serveur dans `app/dashboard/layout.tsx`
- la page `/auth/callback` finalise les liens de confirmation email et de reinitialisation

## Structure

```text
frontend/
  app/dashboard/
  components/
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

Quand vous serez pret a brancher le backend:

- conservez les composants UI tels quels
- etendez l'adapter dans `frontend/lib/api/`
- remplacez progressivement les donnees mock par les endpoints reels
