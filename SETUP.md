# Portail 3M — Phase 1 setup

Phase 1 ajoute Auth + rôles + workflow d'approbation. Le site marketing public continue de fonctionner même sans Supabase configuré.

## Ce qui est livré

- **Auth Supabase** (email + mot de passe, sessions cookie SSR-safe)
- **Rôles** : `student`, `coach`, `admin` (enforcés par RLS Postgres)
- **Workflow d'approbation** : nouveau compte = `pending`, admin l'approuve ou le refuse
- **Pages portail** par rôle :
  - `/portail/admin` — dashboard + approbations + utilisateurs + assignations coach↔étudiant + audit log
  - `/portail/coach` — liste des étudiants assignés (placeholder pour Phase 3 du coaching log)
  - `/portail/etudiant` — cartes Cours/Devoirs/Ressources (placeholder pour Phase 2/4)
- **Bouton « Connexion » bilingue** dans le header marketing
- **Audit log** automatique sur approbation, refus, changement de rôle, assignation

## Setup (≈5 min)

### 1. Créer un projet Supabase

1. Va sur https://supabase.com → New project
2. Région : `Canada Central (ca-central-1)` ou la plus proche
3. Mot de passe DB : choisis-en un fort (sauvegarde-le)
4. Plan : Free (suffisant pour Phase 1)

### 2. Récupérer les clés

Dans le projet Supabase :
- **Settings → API → Project URL** → copie dans `NEXT_PUBLIC_SUPABASE_URL`
- **Settings → API → `anon` public** → copie dans `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Settings → API → `service_role`** ⚠️ secret → copie dans `SUPABASE_SERVICE_ROLE_KEY`

Crée `.env.local` à partir de `.env.example` et colle les 3 valeurs.

### 3. Pousser le schéma

```bash
# Login (ouvre le navigateur)
supabase login

# Link au projet (récupère le project-ref depuis l'URL Supabase, ex: abcdef12345)
npx supabase link --project-ref <project-ref>

# Pousse les migrations
npm run db:push
```

### 4. Seeder l'admin

```bash
npm run seed:admin
```

Crée le compte :
- Email : `r.popescu@egliselacite.ca`
- Mot de passe : `Kekcngek23y!`
- Rôle : `admin`, statut : `approved`

Idempotent — peut être ré-exécuté sans danger.

### 5. Lancer

```bash
npm run dev
```

Va sur http://localhost:3000/fr/login et connecte-toi avec l'admin.

## Vercel

Le repo est connecté à un Vercel project orphelin (ancien remote 404). Après ce setup :
1. Va dans Vercel → Projet → Settings → Git → reconnecte à `erafalcondev/3m-ministry`
2. Ajoute les 3 env vars Supabase dans **Vercel → Settings → Environment Variables**
3. Re-déploie

## Architecture

```
src/
├── app/[locale]/
│   ├── (marketing)/    — site public (Navbar + Footer)
│   ├── (auth)/         — /login + /register (full-screen, layout minimaliste)
│   └── (portail)/portail/
│       ├── admin/      — admin only (layout gate)
│       ├── coach/      — coach + admin
│       └── etudiant/   — student + admin
├── lib/supabase/
│   ├── client.ts       — browser client
│   ├── server.ts       — server client (cookies SSR-safe)
│   └── proxy.ts        — session refresh helper
├── proxy.ts            — locale routing + auth gate /portail/*
└── components/
    ├── auth/           — login/register UI components
    └── portail/        — sidebar + page header
supabase/
├── config.toml
└── migrations/
    └── 20260529000001_phase1_auth_roles.sql
scripts/
└── seed-admin.mjs
```

## Sécurité

Toutes les opérations sensibles passent par des RPC Postgres `security definer` qui vérifient `is_admin()` avant d'agir :
- `approve_user(uuid)`
- `refuse_user(uuid, text)`
- `set_user_role(uuid, user_role)`
- `assign_coach(uuid, uuid)`
- `unassign_coach(uuid, uuid)`

Chaque RPC insère une ligne dans `audit_log`. Les policies RLS empêchent toute modification directe de la table `profiles` par les non-admins (sauf `full_name` pour soi).

## Phases suivantes

- **Phase 2** : DAM (Digital Asset Management) avec filtres par type de fichier (PDF / vidéo / audio / slides / lien), upload admin-only, accès par rôle. Storage Supabase + bucket policies.
- **Phase 3** : Coaching log structuré (sessions avec date, objectifs, notes privées markdown, action items, prochain suivi) en timeline par étudiant.
- **Phase 4** : Cours / Devoirs / Ressources côté étudiant (publication par admin, échéances, complétion).
