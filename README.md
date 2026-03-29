# ZakBot Frontend Dashboard

Frontend V0 demo pour ZakBot, l'assistant WhatsApp de vente pour boutiques e-commerce marocaines.

## Ce qui est implemente

- Interface App Router Next.js 15
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
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_DEMO_BUSINESS_ID=1
```

Note:
- `NEXT_PUBLIC_API_BASE_URL` est documentee pour la phase d'integration backend
- la V0 actuelle utilise le mock adapter comme source principale

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
