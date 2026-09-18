# CaveAVin MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working v1 of CaveAVin — a personal wine cellar inventory PWA with acquisition tracking, drinking-window alerts, tasting records, and web-search-assisted (non-automated) wine info entry.

**Architecture:** A single-page React app (Vite, TypeScript, Tailwind CSS) deployed as an installable PWA, talking directly to a Supabase project (Postgres + Auth + Storage) from the browser. No custom backend server — Supabase's client SDK and row-level security handle persistence and access control.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, react-router-dom v6, @supabase/supabase-js v2, vite-plugin-pwa, Vitest + @testing-library/react.

**Spec:** [docs/superpowers/specs/2026-09-17-caveavin-design.md](../specs/2026-09-17-caveavin-design.md)

## Global Constraints

- 100% free to run: Supabase free tier, static hosting free tier (Vercel or Netlify). No paid API calls anywhere in this plan.
- No offline mode in v1 — the app assumes an active internet connection.
- No native mobile app — installable PWA only, no App Store / Play Store publishing.
- No automated wine-info extraction — enrichment is a web-search link the user copies information from manually.
- TDD: for every unit of business logic or data-access code, write the failing test before the implementation.
- Single user per account in v1 (no household/sharing features), but the schema must not block adding that later.

---

## Task 1: Project scaffolding and tooling

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/index.css`
- Create: `src/App.test.tsx`
- Create: `.gitignore`

**Interfaces:**
- Produces: an `App` component (default export from `src/App.tsx`) rendered into `#root`, and a working Vitest setup any later task can add `*.test.ts(x)` files to.

- [ ] **Step 1: Initialize the npm project and install dependencies**

Run:
```bash
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom jsdom
npm install react-router-dom @supabase/supabase-js
npm install -D vite-plugin-pwa
npx tailwindcss init -p
```

- [ ] **Step 2: Configure Tailwind**

`tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
```

`src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 3: Configure Vitest in `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
  },
});
```

Create `src/setupTests.ts`:
```ts
import '@testing-library/jest-dom';
```

Add to `package.json` scripts:
```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 4: Write the failing test for the App shell**

`src/App.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the CaveAVin title', () => {
  render(<App />);
  expect(screen.getByText(/CaveAVin/i)).toBeInTheDocument();
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm test`
Expected: FAIL (either `App` doesn't exist yet with this content, or the title text isn't rendered).

- [ ] **Step 6: Write minimal `App.tsx`**

```tsx
function App() {
  return (
    <div className="min-h-screen bg-white p-4">
      <h1 className="text-2xl font-bold">CaveAVin</h1>
    </div>
  );
}

export default App;
```

`src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm test`
Expected: PASS

- [ ] **Step 8: Verify the dev server runs**

Run: `npm run dev`
Expected: server starts, browser shows "CaveAVin" heading at the printed local URL.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite/React/TS project with Tailwind and Vitest"
```

---

## Task 2: Supabase project, schema, and client wrapper

**Files:**
- Create: `supabase/migrations/0001_init.sql`
- Create: `src/types.ts`
- Create: `src/supabaseClient.ts`
- Create: `.env.example`
- Modify: `.gitignore` (ignore `.env`)

**Interfaces:**
- Produces: `supabase` (a configured `SupabaseClient`, default export from `src/supabaseClient.ts`) and the domain types `Wine`, `BottleInstance`, `TastingRecord`, `NewTastingRecord`, `AcquisitionMode`, `BottleStatus`, `InfoSource` (all exported from `src/types.ts`) that every later task imports.

- [ ] **Step 1: Create a free Supabase project (manual, one-time)**

This step needs your own Supabase account — go to https://supabase.com, create a free project named `caveavin`, and note the **Project URL** and **anon public key** from Project Settings → API. This plan cannot create the account for you.

- [ ] **Step 2: Write the schema migration**

`supabase/migrations/0001_init.sql`:
```sql
create table wines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  producer text,
  vintage integer,
  appellation text,
  grape_variety text,
  region text,
  drinking_window_start_year integer,
  drinking_window_end_year integer,
  food_pairing text,
  info_source text not null default 'manuelle' check (info_source in ('manuelle', 'recherche_assistee')),
  photo_url text,
  created_at timestamptz not null default now()
);

create table bottle_instances (
  id uuid primary key default gen_random_uuid(),
  wine_id uuid not null references wines(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  acquisition_mode text not null check (acquisition_mode in ('achat','cadeau','heritage','gagnee','autre')),
  acquisition_source text,
  price_paid numeric(10,2),
  acquisition_date date not null,
  status text not null default 'en_cave' check (status in ('en_cave','consommee')),
  created_at timestamptz not null default now()
);

create table tasting_records (
  id uuid primary key default gen_random_uuid(),
  bottle_instance_id uuid not null references bottle_instances(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  rating integer check (rating between 0 and 100),
  notes text,
  tasted_at date not null,
  companions text,
  occasion text,
  photo_url text,
  created_at timestamptz not null default now()
);

alter table wines enable row level security;
alter table bottle_instances enable row level security;
alter table tasting_records enable row level security;

create policy "Users manage their own wines" on wines
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own bottles" on bottle_instances
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own tastings" on tasting_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
  on conflict (id) do nothing;
```

- [ ] **Step 3: Run the migration (manual)**

In the Supabase dashboard, open the SQL Editor, paste the contents of `0001_init.sql`, and run it.
Expected: three tables and one storage bucket (`photos`) exist under Table Editor / Storage.

- [ ] **Step 4: Add environment variable files**

`.env.example`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Create your own `.env` (not committed) with your real project URL and anon key.

Add to `.gitignore`:
```
.env
```

- [ ] **Step 5: Write the domain types**

`src/types.ts`:
```ts
export type AcquisitionMode = 'achat' | 'cadeau' | 'heritage' | 'gagnee' | 'autre';
export type BottleStatus = 'en_cave' | 'consommee';
export type InfoSource = 'manuelle' | 'recherche_assistee';

export interface Wine {
  id: string;
  userId: string;
  name: string;
  producer: string | null;
  vintage: number | null;
  appellation: string | null;
  grapeVariety: string | null;
  region: string | null;
  drinkingWindowStartYear: number | null;
  drinkingWindowEndYear: number | null;
  foodPairing: string | null;
  infoSource: InfoSource;
  photoUrl: string | null;
}

export interface BottleInstance {
  id: string;
  wineId: string;
  userId: string;
  acquisitionMode: AcquisitionMode;
  acquisitionSource: string | null;
  pricePaid: number | null;
  acquisitionDate: string;
  status: BottleStatus;
}

export interface TastingRecord {
  id: string;
  bottleInstanceId: string;
  userId: string;
  rating: number | null;
  notes: string | null;
  tastedAt: string;
  companions: string | null;
  occasion: string | null;
  photoUrl: string | null;
}

export interface NewTastingRecord {
  bottleInstanceId: string;
  rating: number | null;
  notes: string | null;
  tastedAt: string;
  companions: string | null;
  occasion: string | null;
  photoUrl: string | null;
}
```

- [ ] **Step 6: Write the Supabase client wrapper**

`src/supabaseClient.ts`:
```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 7: Verify the connection manually**

Temporarily add this to `src/App.tsx` inside a `useEffect`, run `npm run dev`, and check the browser console:
```ts
supabase.from('wines').select('id').limit(1).then(console.log);
```
Expected: `{ data: [], error: null }` (empty table, no error). Remove this temporary check once confirmed.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add Supabase schema migration, client, and domain types"
```

---

## Task 3: Authentication and protected routing

**Files:**
- Create: `src/hooks/useAuth.ts`
- Create: `src/hooks/useAuth.test.tsx`
- Create: `src/components/ProtectedRoute.tsx`
- Create: `src/pages/LoginPage.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `supabase` from `src/supabaseClient.ts` (Task 2).
- Produces: `useAuth()` hook returning `{ user: User | null, loading: boolean, signIn(email, password), signUp(email, password), signOut() }`, and `<ProtectedRoute>` that redirects to `/login` when `user` is null.

- [ ] **Step 1: Write the failing test for `useAuth`**

`src/hooks/useAuth.test.tsx`:
```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { vi, test, expect } from 'vitest';
import { useAuth } from './useAuth';
import { supabase } from '../supabaseClient';

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

test('starts with no user and loading false after session check', async () => {
  const { result } = renderHook(() => useAuth());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.user).toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module './useAuth'" or similar.

- [ ] **Step 3: Write minimal `useAuth.ts`**

```ts
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { user, loading, signIn, signUp, signOut };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Write `ProtectedRoute`**

`src/components/ProtectedRoute.tsx`:
```tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="p-4">Chargement...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

- [ ] **Step 6: Write `LoginPage`**

`src/pages/LoginPage.tsx`:
```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(mode: 'signin' | 'signup') {
    setError(null);
    try {
      if (mode === 'signin') await signIn(email, password);
      else await signUp(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-3">
        <h1 className="text-2xl font-bold">CaveAVin</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input
          className="border rounded w-full p-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border rounded w-full p-2"
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex gap-2">
          <button className="flex-1 bg-blue-600 text-white rounded p-2" onClick={() => handleSubmit('signin')}>
            Se connecter
          </button>
          <button className="flex-1 border rounded p-2" onClick={() => handleSubmit('signup')}>
            Créer un compte
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Wire routing in `App.tsx`**

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-white p-4">
                <h1 className="text-2xl font-bold">CaveAVin</h1>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 8: Update `App.test.tsx` for the new routing shell**

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, test, expect } from 'vitest';
import App from './App';

vi.mock('./supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: '1' } } } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

test('renders the CaveAVin title when authenticated', async () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  expect(await screen.findByText(/CaveAVin/i)).toBeInTheDocument();
});
```

Note: `App.tsx` already renders its own `<BrowserRouter>`, which conflicts with wrapping it in `<MemoryRouter>` in the test. Change `App.tsx` to accept routing from its caller: remove `BrowserRouter` from `App.tsx` and wrap it in `main.tsx` instead.

`src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

`src/App.tsx` (routes only, no `BrowserRouter`):
```tsx
import { Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-white p-4">
              <h1 className="text-2xl font-bold">CaveAVin</h1>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
```

- [ ] **Step 9: Run tests to verify everything passes**

Run: `npm test`
Expected: PASS (both `useAuth.test.tsx` and `App.test.tsx`)

- [ ] **Step 10: Verify manually**

Run: `npm run dev`, open the app, confirm you're redirected to `/login`, sign up with a real email/password, confirm you land on `/` and see "CaveAVin".

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: add authentication and protected routing"
```

---

## Task 4: Cellar status business logic ("à boire bientôt")

**Files:**
- Create: `src/lib/cellarStatus.ts`
- Create: `src/lib/cellarStatus.test.ts`

**Interfaces:**
- Produces: `isDrinkSoon(window: DrinkingWindow, today?: Date): boolean` and the `DrinkingWindow` type, both exported from `src/lib/cellarStatus.ts`. Used by Task 8 (dashboard) and Task 9 (cellar list filter).

- [ ] **Step 1: Write the failing tests**

`src/lib/cellarStatus.test.ts`:
```ts
import { test, expect } from 'vitest';
import { isDrinkSoon } from './cellarStatus';

test('is not drink-soon when the window end is years away', () => {
  const result = isDrinkSoon({ startYear: 2024, endYear: 2035 }, new Date(2026, 0, 1));
  expect(result).toBe(false);
});

test('is drink-soon when within one year of the window end', () => {
  const result = isDrinkSoon({ startYear: 2020, endYear: 2027 }, new Date(2026, 0, 1));
  expect(result).toBe(true);
});

test('is drink-soon when past the window end', () => {
  const result = isDrinkSoon({ startYear: 2018, endYear: 2024 }, new Date(2026, 0, 1));
  expect(result).toBe(true);
});

test('is not drink-soon when the window end is unknown', () => {
  const result = isDrinkSoon({ startYear: 2020, endYear: null }, new Date(2026, 0, 1));
  expect(result).toBe(false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL with "Cannot find module './cellarStatus'"

- [ ] **Step 3: Write minimal implementation**

`src/lib/cellarStatus.ts`:
```ts
export interface DrinkingWindow {
  startYear: number | null;
  endYear: number | null;
}

export function isDrinkSoon(window: DrinkingWindow, today: Date = new Date()): boolean {
  if (window.endYear == null) return false;
  return today.getFullYear() >= window.endYear - 1;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add drink-soon business logic"
```

---

## Task 5: Tasting service business logic (status flip on tasting)

**Files:**
- Create: `src/lib/tastingService.ts`
- Create: `src/lib/tastingService.test.ts`

**Interfaces:**
- Consumes: `NewTastingRecord`, `TastingRecord`, `BottleStatus` from `src/types.ts` (Task 2).
- Produces: the `TastingRepository` interface and `createTastingRecord(repo, input)` function, both exported from `src/lib/tastingService.ts`. Task 6 provides the Supabase-backed implementation of `TastingRepository`.

- [ ] **Step 1: Write the failing test with a fake repository**

`src/lib/tastingService.test.ts`:
```ts
import { test, expect, vi } from 'vitest';
import { createTastingRecord, type TastingRepository } from './tastingService';
import type { NewTastingRecord, TastingRecord } from '../types';

function makeFakeRepo(): TastingRepository & { calls: { updateBottleStatus: any[] } } {
  const calls = { updateBottleStatus: [] as any[] };
  return {
    calls,
    insertTastingRecord: vi.fn(async (input: NewTastingRecord): Promise<TastingRecord> => ({
      id: 'tasting-1',
      userId: 'user-1',
      ...input,
    })),
    updateBottleStatus: vi.fn(async (bottleInstanceId: string, status) => {
      calls.updateBottleStatus.push({ bottleInstanceId, status });
    }),
  };
}

test('creating a tasting record flips the bottle status to consommee', async () => {
  const repo = makeFakeRepo();
  const input: NewTastingRecord = {
    bottleInstanceId: 'bottle-1',
    rating: 88,
    notes: 'Belle robe, tanins souples',
    tastedAt: '2026-09-17',
    companions: 'Amis',
    occasion: 'Anniversaire',
    photoUrl: null,
  };

  const record = await createTastingRecord(repo, input);

  expect(record.id).toBe('tasting-1');
  expect(repo.insertTastingRecord).toHaveBeenCalledWith(input);
  expect(repo.calls.updateBottleStatus).toEqual([{ bottleInstanceId: 'bottle-1', status: 'consommee' }]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module './tastingService'"

- [ ] **Step 3: Write minimal implementation**

`src/lib/tastingService.ts`:
```ts
import type { NewTastingRecord, TastingRecord, BottleStatus } from '../types';

export interface TastingRepository {
  insertTastingRecord(input: NewTastingRecord): Promise<TastingRecord>;
  updateBottleStatus(bottleInstanceId: string, status: BottleStatus): Promise<void>;
}

export async function createTastingRecord(
  repo: TastingRepository,
  input: NewTastingRecord
): Promise<TastingRecord> {
  const record = await repo.insertTastingRecord(input);
  await repo.updateBottleStatus(input.bottleInstanceId, 'consommee');
  return record;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add tasting service business logic"
```

---

## Task 6: Data repositories backed by Supabase

**Files:**
- Create: `src/repositories/wineRepository.ts`
- Create: `src/repositories/wineRepository.test.ts`
- Create: `src/repositories/bottleRepository.ts`
- Create: `src/repositories/bottleRepository.test.ts`
- Create: `src/repositories/tastingRepository.ts`
- Create: `src/repositories/tastingRepository.test.ts`

**Interfaces:**
- Consumes: `Wine`, `BottleInstance`, `TastingRecord`, `NewTastingRecord`, `AcquisitionMode`, `BottleStatus`, `InfoSource` from `src/types.ts` (Task 2); `TastingRepository` from `src/lib/tastingService.ts` (Task 5).
- Produces:
  - `createSupabaseWineRepository(client)` → `{ createWine(input: NewWineInput): Promise<Wine> }`
  - `createSupabaseBottleRepository(client)` → `{ createBottleInstances(input: NewBottleInstanceInput, quantity: number): Promise<BottleInstance[]>, listBottles(filter?: BottleFilter): Promise<Array<BottleInstance & { wine: Wine }>>, getBottle(id: string): Promise<BottleInstance & { wine: Wine }> }`
  - `createSupabaseTastingRepository(client): TastingRepository & { listTastingRecords(): Promise<Array<TastingRecord & { bottle: BottleInstance & { wine: Wine } }>> }`
  All three factories are consumed by the UI tasks (7-11) via `supabase` from `src/supabaseClient.ts`.

- [ ] **Step 1: Write the failing test for `wineRepository`**

`src/repositories/wineRepository.test.ts`:
```ts
import { test, expect, vi } from 'vitest';
import { createSupabaseWineRepository, type NewWineInput } from './wineRepository';

function makeFakeClient(row: any) {
  return {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: row, error: null }),
        }),
      }),
    }),
  };
}

test('createWine maps input to a snake_case row and back to a Wine', async () => {
  const row = {
    id: 'wine-1',
    user_id: 'user-1',
    name: 'Chateau X',
    producer: 'Domaine Y',
    vintage: 2018,
    appellation: 'Margaux',
    grape_variety: 'Cabernet Sauvignon',
    region: 'Bordeaux',
    drinking_window_start_year: 2024,
    drinking_window_end_year: 2032,
    food_pairing: 'Viande rouge',
    info_source: 'manuelle',
    photo_url: null,
  };
  const client = makeFakeClient(row);
  const repo = createSupabaseWineRepository(client as any);

  const input: NewWineInput = {
    name: 'Chateau X',
    producer: 'Domaine Y',
    vintage: 2018,
    appellation: 'Margaux',
    grapeVariety: 'Cabernet Sauvignon',
    region: 'Bordeaux',
    drinkingWindowStartYear: 2024,
    drinkingWindowEndYear: 2032,
    foodPairing: 'Viande rouge',
    infoSource: 'manuelle',
    photoUrl: null,
  };

  const wine = await repo.createWine(input);

  expect(client.from).toHaveBeenCalledWith('wines');
  expect(wine).toEqual({
    id: 'wine-1',
    userId: 'user-1',
    name: 'Chateau X',
    producer: 'Domaine Y',
    vintage: 2018,
    appellation: 'Margaux',
    grapeVariety: 'Cabernet Sauvignon',
    region: 'Bordeaux',
    drinkingWindowStartYear: 2024,
    drinkingWindowEndYear: 2032,
    foodPairing: 'Viande rouge',
    infoSource: 'manuelle',
    photoUrl: null,
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module './wineRepository'"

- [ ] **Step 3: Write minimal implementation**

`src/repositories/wineRepository.ts`:
```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Wine, InfoSource } from '../types';

export interface NewWineInput {
  name: string;
  producer: string | null;
  vintage: number | null;
  appellation: string | null;
  grapeVariety: string | null;
  region: string | null;
  drinkingWindowStartYear: number | null;
  drinkingWindowEndYear: number | null;
  foodPairing: string | null;
  infoSource: InfoSource;
  photoUrl: string | null;
}

export interface WineRepository {
  createWine(input: NewWineInput): Promise<Wine>;
}

export function createSupabaseWineRepository(client: SupabaseClient): WineRepository {
  return {
    async createWine(input: NewWineInput): Promise<Wine> {
      const { data, error } = await client
        .from('wines')
        .insert({
          name: input.name,
          producer: input.producer,
          vintage: input.vintage,
          appellation: input.appellation,
          grape_variety: input.grapeVariety,
          region: input.region,
          drinking_window_start_year: input.drinkingWindowStartYear,
          drinking_window_end_year: input.drinkingWindowEndYear,
          food_pairing: input.foodPairing,
          info_source: input.infoSource,
          photo_url: input.photoUrl,
        })
        .select()
        .single();
      if (error) throw error;
      return mapWineRow(data);
    },
  };
}

export function mapWineRow(row: any): Wine {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    producer: row.producer,
    vintage: row.vintage,
    appellation: row.appellation,
    grapeVariety: row.grape_variety,
    region: row.region,
    drinkingWindowStartYear: row.drinking_window_start_year,
    drinkingWindowEndYear: row.drinking_window_end_year,
    foodPairing: row.food_pairing,
    infoSource: row.info_source,
    photoUrl: row.photo_url,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Write the failing test for `bottleRepository`**

`src/repositories/bottleRepository.test.ts`:
```ts
import { test, expect, vi } from 'vitest';
import { createSupabaseBottleRepository, type NewBottleInstanceInput } from './bottleRepository';

function makeFakeClientForInsert(rows: any[]) {
  return {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: rows, error: null }),
      }),
    }),
  };
}

test('createBottleInstances inserts one row per requested quantity', async () => {
  const rows = [
    { id: 'b1', wine_id: 'wine-1', user_id: 'user-1', acquisition_mode: 'achat', acquisition_source: 'Caviste', price_paid: 25, acquisition_date: '2026-09-17', status: 'en_cave' },
    { id: 'b2', wine_id: 'wine-1', user_id: 'user-1', acquisition_mode: 'achat', acquisition_source: 'Caviste', price_paid: 25, acquisition_date: '2026-09-17', status: 'en_cave' },
  ];
  const client = makeFakeClientForInsert(rows);
  const repo = createSupabaseBottleRepository(client as any);

  const input: NewBottleInstanceInput = {
    wineId: 'wine-1',
    acquisitionMode: 'achat',
    acquisitionSource: 'Caviste',
    pricePaid: 25,
    acquisitionDate: '2026-09-17',
  };

  const bottles = await repo.createBottleInstances(input, 2);

  expect(client.from).toHaveBeenCalledWith('bottle_instances');
  expect(bottles).toHaveLength(2);
  expect(bottles[0]).toEqual({
    id: 'b1',
    wineId: 'wine-1',
    userId: 'user-1',
    acquisitionMode: 'achat',
    acquisitionSource: 'Caviste',
    pricePaid: 25,
    acquisitionDate: '2026-09-17',
    status: 'en_cave',
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module './bottleRepository'"

- [ ] **Step 7: Write minimal implementation**

`src/repositories/bottleRepository.ts`:
```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BottleInstance, AcquisitionMode, BottleStatus, Wine } from '../types';
import { mapWineRow } from './wineRepository';

export interface NewBottleInstanceInput {
  wineId: string;
  acquisitionMode: AcquisitionMode;
  acquisitionSource: string | null;
  pricePaid: number | null;
  acquisitionDate: string;
}

export interface BottleFilter {
  status?: BottleStatus;
}

export interface BottleRepository {
  createBottleInstances(input: NewBottleInstanceInput, quantity: number): Promise<BottleInstance[]>;
  listBottles(filter?: BottleFilter): Promise<Array<BottleInstance & { wine: Wine }>>;
  getBottle(id: string): Promise<BottleInstance & { wine: Wine }>;
}

export function createSupabaseBottleRepository(client: SupabaseClient): BottleRepository {
  return {
    async createBottleInstances(input, quantity) {
      const rowsToInsert = Array.from({ length: quantity }, () => ({
        wine_id: input.wineId,
        acquisition_mode: input.acquisitionMode,
        acquisition_source: input.acquisitionSource,
        price_paid: input.pricePaid,
        acquisition_date: input.acquisitionDate,
      }));
      const { data, error } = await client.from('bottle_instances').insert(rowsToInsert).select();
      if (error) throw error;
      return data.map(mapBottleRow);
    },

    async listBottles(filter) {
      let query = client.from('bottle_instances').select('*, wines(*)');
      if (filter?.status) query = query.eq('status', filter.status);
      const { data, error } = await query;
      if (error) throw error;
      return data.map((row: any) => ({ ...mapBottleRow(row), wine: mapWineRow(row.wines) }));
    },

    async getBottle(id) {
      const { data, error } = await client.from('bottle_instances').select('*, wines(*)').eq('id', id).single();
      if (error) throw error;
      return { ...mapBottleRow(data), wine: mapWineRow(data.wines) };
    },
  };
}

function mapBottleRow(row: any): BottleInstance {
  return {
    id: row.id,
    wineId: row.wine_id,
    userId: row.user_id,
    acquisitionMode: row.acquisition_mode,
    acquisitionSource: row.acquisition_source,
    pricePaid: row.price_paid,
    acquisitionDate: row.acquisition_date,
    status: row.status,
  };
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test`
Expected: PASS

- [ ] **Step 9: Write the failing test for `tastingRepository`**

`src/repositories/tastingRepository.test.ts`:
```ts
import { test, expect, vi } from 'vitest';
import { createSupabaseTastingRepository } from './tastingRepository';
import type { NewTastingRecord } from '../types';

test('insertTastingRecord maps input to a snake_case row and back', async () => {
  const row = {
    id: 'tasting-1',
    bottle_instance_id: 'bottle-1',
    user_id: 'user-1',
    rating: 90,
    notes: 'Tres reussi',
    tasted_at: '2026-09-17',
    companions: 'Famille',
    occasion: 'Diner',
    photo_url: null,
  };
  const client = {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: row, error: null }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  };
  const repo = createSupabaseTastingRepository(client as any);

  const input: NewTastingRecord = {
    bottleInstanceId: 'bottle-1',
    rating: 90,
    notes: 'Tres reussi',
    tastedAt: '2026-09-17',
    companions: 'Famille',
    occasion: 'Diner',
    photoUrl: null,
  };

  const record = await repo.insertTastingRecord(input);

  expect(record.id).toBe('tasting-1');
  expect(record.bottleInstanceId).toBe('bottle-1');
});

test('updateBottleStatus updates the bottle_instances row', async () => {
  const eq = vi.fn().mockResolvedValue({ error: null });
  const client = { from: vi.fn().mockReturnValue({ update: vi.fn().mockReturnValue({ eq }) }) };
  const repo = createSupabaseTastingRepository(client as any);

  await repo.updateBottleStatus('bottle-1', 'consommee');

  expect(client.from).toHaveBeenCalledWith('bottle_instances');
  expect(eq).toHaveBeenCalledWith('id', 'bottle-1');
});
```

- [ ] **Step 10: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module './tastingRepository'"

- [ ] **Step 11: Write minimal implementation**

`src/repositories/tastingRepository.ts`:
```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { NewTastingRecord, TastingRecord, BottleStatus, BottleInstance, Wine } from '../types';
import type { TastingRepository } from '../lib/tastingService';
import { mapWineRow } from './wineRepository';

export interface TastingHistoryRepository extends TastingRepository {
  listTastingRecords(): Promise<Array<TastingRecord & { bottle: BottleInstance & { wine: Wine } }>>;
}

export function createSupabaseTastingRepository(client: SupabaseClient): TastingHistoryRepository {
  return {
    async insertTastingRecord(input: NewTastingRecord): Promise<TastingRecord> {
      const { data, error } = await client
        .from('tasting_records')
        .insert({
          bottle_instance_id: input.bottleInstanceId,
          rating: input.rating,
          notes: input.notes,
          tasted_at: input.tastedAt,
          companions: input.companions,
          occasion: input.occasion,
          photo_url: input.photoUrl,
        })
        .select()
        .single();
      if (error) throw error;
      return mapTastingRow(data);
    },

    async updateBottleStatus(bottleInstanceId: string, status: BottleStatus): Promise<void> {
      const { error } = await client.from('bottle_instances').update({ status }).eq('id', bottleInstanceId);
      if (error) throw error;
    },

    async listTastingRecords() {
      const { data, error } = await client
        .from('tasting_records')
        .select('*, bottle_instances(*, wines(*))');
      if (error) throw error;
      return data.map((row: any) => ({
        ...mapTastingRow(row),
        bottle: {
          id: row.bottle_instances.id,
          wineId: row.bottle_instances.wine_id,
          userId: row.bottle_instances.user_id,
          acquisitionMode: row.bottle_instances.acquisition_mode,
          acquisitionSource: row.bottle_instances.acquisition_source,
          pricePaid: row.bottle_instances.price_paid,
          acquisitionDate: row.bottle_instances.acquisition_date,
          status: row.bottle_instances.status,
          wine: mapWineRow(row.bottle_instances.wines),
        },
      }));
    },
  };
}

function mapTastingRow(row: any): TastingRecord {
  return {
    id: row.id,
    bottleInstanceId: row.bottle_instance_id,
    userId: row.user_id,
    rating: row.rating,
    notes: row.notes,
    tastedAt: row.tasted_at,
    companions: row.companions,
    occasion: row.occasion,
    photoUrl: row.photo_url,
  };
}
```

- [ ] **Step 12: Run test to verify it passes**

Run: `npm test`
Expected: PASS

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: add Supabase-backed wine, bottle, and tasting repositories"
```

---

## Task 7: Add bottle(s) flow

**Files:**
- Create: `src/pages/AddBottlePage.tsx`
- Create: `src/pages/AddBottlePage.test.tsx`
- Modify: `src/App.tsx` (add route)

**Interfaces:**
- Consumes: `createSupabaseWineRepository` (Task 6), `createSupabaseBottleRepository` (Task 6), `supabase` (Task 2), `AcquisitionMode` (Task 2).
- Produces: `/add-bottle` route rendering `AddBottlePage`, which on submit creates one `Wine` and `quantity` `BottleInstance` rows, then navigates to `/`.

- [ ] **Step 1: Write the failing test**

`src/pages/AddBottlePage.test.tsx`:
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { test, expect, vi } from 'vitest';
import { AddBottlePage } from './AddBottlePage';

const createWine = vi.fn().mockResolvedValue({ id: 'wine-1' });
const createBottleInstances = vi.fn().mockResolvedValue([{ id: 'b1' }]);

vi.mock('../repositories/wineRepository', () => ({
  createSupabaseWineRepository: () => ({ createWine }),
}));
vi.mock('../repositories/bottleRepository', () => ({
  createSupabaseBottleRepository: () => ({ createBottleInstances }),
}));
vi.mock('../supabaseClient', () => ({ supabase: {} }));

test('submitting the form creates a wine and the requested number of bottles', async () => {
  render(
    <MemoryRouter>
      <AddBottlePage />
    </MemoryRouter>
  );

  fireEvent.change(screen.getByLabelText(/nom du vin/i), { target: { value: 'Chateau X' } });
  fireEvent.change(screen.getByLabelText(/mode d'acquisition/i), { target: { value: 'achat' } });
  fireEvent.change(screen.getByLabelText(/date d'acquisition/i), { target: { value: '2026-09-17' } });
  fireEvent.change(screen.getByLabelText(/quantite/i), { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: /ajouter/i }));

  await waitFor(() => expect(createWine).toHaveBeenCalled());
  expect(createBottleInstances).toHaveBeenCalledWith(
    expect.objectContaining({ wineId: 'wine-1' }),
    2
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module './AddBottlePage'"

- [ ] **Step 3: Write minimal implementation**

`src/pages/AddBottlePage.tsx`:
```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { createSupabaseWineRepository } from '../repositories/wineRepository';
import { createSupabaseBottleRepository } from '../repositories/bottleRepository';
import type { AcquisitionMode } from '../types';

export function AddBottlePage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [producer, setProducer] = useState('');
  const [vintage, setVintage] = useState('');
  const [appellation, setAppellation] = useState('');
  const [grapeVariety, setGrapeVariety] = useState('');
  const [region, setRegion] = useState('');
  const [drinkingWindowStartYear, setDrinkingWindowStartYear] = useState('');
  const [drinkingWindowEndYear, setDrinkingWindowEndYear] = useState('');
  const [foodPairing, setFoodPairing] = useState('');
  const [acquisitionMode, setAcquisitionMode] = useState<AcquisitionMode>('achat');
  const [acquisitionSource, setAcquisitionSource] = useState('');
  const [pricePaid, setPricePaid] = useState('');
  const [acquisitionDate, setAcquisitionDate] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  function searchUrl() {
    const query = encodeURIComponent(`${name} ${producer} ${vintage} cepage accords mets-vin`);
    return `https://www.google.com/search?q=${query}`;
  }

  async function uploadPhotoIfAny(): Promise<string | null> {
    if (!photoFile) return null;
    const path = `${crypto.randomUUID()}-${photoFile.name}`;
    const { error: uploadError } = await supabase.storage.from('photos').upload(path, photoFile);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('photos').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const wineRepo = createSupabaseWineRepository(supabase);
      const bottleRepo = createSupabaseBottleRepository(supabase);
      const photoUrl = await uploadPhotoIfAny();

      const wine = await wineRepo.createWine({
        name,
        producer: producer || null,
        vintage: vintage ? Number(vintage) : null,
        appellation: appellation || null,
        grapeVariety: grapeVariety || null,
        region: region || null,
        drinkingWindowStartYear: drinkingWindowStartYear ? Number(drinkingWindowStartYear) : null,
        drinkingWindowEndYear: drinkingWindowEndYear ? Number(drinkingWindowEndYear) : null,
        foodPairing: foodPairing || null,
        infoSource: 'manuelle',
        photoUrl,
      });

      await bottleRepo.createBottleInstances(
        {
          wineId: wine.id,
          acquisitionMode,
          acquisitionSource: acquisitionSource || null,
          pricePaid: pricePaid ? Number(pricePaid) : null,
          acquisitionDate,
        },
        Number(quantity)
      );

      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout");
    }
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-3">
      <h1 className="text-xl font-bold">Ajouter une bouteille</h1>
      {name && (
        <a className="text-blue-600 underline text-sm" href={searchUrl()} target="_blank" rel="noreferrer">
          Rechercher sur internet
        </a>
      )}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          Nom du vin
          <input className="border rounded w-full p-2" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="block">
          Producteur
          <input className="border rounded w-full p-2" value={producer} onChange={(e) => setProducer(e.target.value)} />
        </label>
        <label className="block">
          Millesime
          <input className="border rounded w-full p-2" value={vintage} onChange={(e) => setVintage(e.target.value)} />
        </label>
        <label className="block">
          Appellation
          <input className="border rounded w-full p-2" value={appellation} onChange={(e) => setAppellation(e.target.value)} />
        </label>
        <label className="block">
          Cepage
          <input className="border rounded w-full p-2" value={grapeVariety} onChange={(e) => setGrapeVariety(e.target.value)} />
        </label>
        <label className="block">
          Region
          <input className="border rounded w-full p-2" value={region} onChange={(e) => setRegion(e.target.value)} />
        </label>
        <label className="block">
          Fenetre de degustation - debut (annee)
          <input className="border rounded w-full p-2" value={drinkingWindowStartYear} onChange={(e) => setDrinkingWindowStartYear(e.target.value)} />
        </label>
        <label className="block">
          Fenetre de degustation - fin (annee)
          <input className="border rounded w-full p-2" value={drinkingWindowEndYear} onChange={(e) => setDrinkingWindowEndYear(e.target.value)} />
        </label>
        <label className="block">
          Accords mets-vin suggeres
          <input className="border rounded w-full p-2" value={foodPairing} onChange={(e) => setFoodPairing(e.target.value)} />
        </label>
        <label className="block">
          Photo de la bouteille/etiquette (facultatif)
          <input
            className="border rounded w-full p-2"
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <label className="block">
          Mode d'acquisition
          <select
            className="border rounded w-full p-2"
            value={acquisitionMode}
            onChange={(e) => setAcquisitionMode(e.target.value as AcquisitionMode)}
          >
            <option value="achat">Achat</option>
            <option value="cadeau">Cadeau</option>
            <option value="heritage">Heritage</option>
            <option value="gagnee">Gagnee</option>
            <option value="autre">Autre</option>
          </select>
        </label>
        <label className="block">
          Lieu / source d'achat
          <input className="border rounded w-full p-2" value={acquisitionSource} onChange={(e) => setAcquisitionSource(e.target.value)} />
        </label>
        <label className="block">
          Prix paye
          <input className="border rounded w-full p-2" value={pricePaid} onChange={(e) => setPricePaid(e.target.value)} />
        </label>
        <label className="block">
          Date d'acquisition
          <input
            className="border rounded w-full p-2"
            type="date"
            value={acquisitionDate}
            onChange={(e) => setAcquisitionDate(e.target.value)}
            required
          />
        </label>
        <label className="block">
          Quantite
          <input
            className="border rounded w-full p-2"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </label>
        <button type="submit" className="bg-blue-600 text-white rounded p-2 w-full">
          Ajouter
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Add the route**

In `src/App.tsx`, add:
```tsx
import { AddBottlePage } from './pages/AddBottlePage';
```
and inside `<Routes>`:
```tsx
<Route
  path="/add-bottle"
  element={
    <ProtectedRoute>
      <AddBottlePage />
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 6: Verify manually**

Run: `npm run dev`, sign in, go to `/add-bottle`, fill the form with quantity 2, submit, then check the Supabase Table Editor: one row in `wines`, two rows in `bottle_instances` pointing to it.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add the add-bottle(s) page"
```

---

## Task 8: Dashboard page

**Files:**
- Create: `src/pages/DashboardPage.tsx`
- Create: `src/pages/DashboardPage.test.tsx`
- Modify: `src/App.tsx` (use `DashboardPage` as the `/` route element)

**Interfaces:**
- Consumes: `createSupabaseBottleRepository` (Task 6), `isDrinkSoon` (Task 4), `supabase` (Task 2).
- Produces: `DashboardPage` component showing bottle count, estimated total value, and a "à boire bientôt" list.

- [ ] **Step 1: Write the failing test**

`src/pages/DashboardPage.test.tsx`:
```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { test, expect, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';

const listBottles = vi.fn().mockResolvedValue([
  {
    id: 'b1',
    status: 'en_cave',
    pricePaid: 20,
    wine: { name: 'Chateau X', drinkingWindowStartYear: 2020, drinkingWindowEndYear: 2026 },
  },
  {
    id: 'b2',
    status: 'en_cave',
    pricePaid: 15,
    wine: { name: 'Chateau Y', drinkingWindowStartYear: 2024, drinkingWindowEndYear: 2040 },
  },
]);

vi.mock('../repositories/bottleRepository', () => ({
  createSupabaseBottleRepository: () => ({ listBottles }),
}));
vi.mock('../supabaseClient', () => ({ supabase: {} }));

test('shows bottle count, total value, and drink-soon bottles', async () => {
  render(
    <MemoryRouter>
      <DashboardPage today={new Date(2026, 0, 1)} />
    </MemoryRouter>
  );

  await waitFor(() => expect(screen.getByText(/2 bouteilles/i)).toBeInTheDocument());
  expect(screen.getByText(/35/)).toBeInTheDocument();
  expect(screen.getByText('Chateau X')).toBeInTheDocument();
  expect(screen.queryByText('Chateau Y')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module './DashboardPage'"

- [ ] **Step 3: Write minimal implementation**

`src/pages/DashboardPage.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { createSupabaseBottleRepository } from '../repositories/bottleRepository';
import { isDrinkSoon } from '../lib/cellarStatus';
import type { BottleInstance, Wine } from '../types';

type BottleWithWine = BottleInstance & { wine: Wine };

export function DashboardPage({ today = new Date() }: { today?: Date }) {
  const [bottles, setBottles] = useState<BottleWithWine[]>([]);

  useEffect(() => {
    const repo = createSupabaseBottleRepository(supabase);
    repo.listBottles({ status: 'en_cave' }).then(setBottles);
  }, []);

  const totalValue = bottles.reduce((sum, b) => sum + (b.pricePaid ?? 0), 0);
  const drinkSoon = bottles.filter((b) =>
    isDrinkSoon({ startYear: b.wine.drinkingWindowStartYear, endYear: b.wine.drinkingWindowEndYear }, today)
  );

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">CaveAVin</h1>
      <Link to="/add-bottle" className="inline-block bg-blue-600 text-white rounded p-2">
        Ajouter une bouteille
      </Link>
      <p>{bottles.length} bouteilles en cave, valeur estimee {totalValue} EUR</p>
      <div>
        <h2 className="font-semibold">A boire bientot</h2>
        {drinkSoon.length === 0 && <p className="text-sm text-gray-500">Aucune bouteille pour le moment</p>}
        <ul>
          {drinkSoon.map((b) => (
            <li key={b.id}>
              <Link to={`/bottles/${b.id}`}>{b.wine.name}</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Wire it as the home route**

In `src/App.tsx`, replace the inline `<div>` on `/` with `<DashboardPage />` and import it.

- [ ] **Step 6: Verify manually**

Run: `npm run dev`, sign in, confirm the dashboard shows the bottle count, total value, and any bottle within a year of its drinking window end.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add the dashboard page"
```

---

## Task 9: Cellar list with filters

**Files:**
- Create: `src/pages/CellarListPage.tsx`
- Create: `src/pages/CellarListPage.test.tsx`
- Modify: `src/App.tsx` (add `/cellar` route)

**Interfaces:**
- Consumes: `createSupabaseBottleRepository` (Task 6), `supabase` (Task 2).
- Produces: `/cellar` route listing all `en_cave` bottles, filterable by `grapeVariety`, `region`, and `vintage` (client-side filtering over the loaded list).

- [ ] **Step 1: Write the failing test**

`src/pages/CellarListPage.test.tsx`:
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { test, expect, vi } from 'vitest';
import { CellarListPage } from './CellarListPage';

const listBottles = vi.fn().mockResolvedValue([
  { id: 'b1', status: 'en_cave', wine: { name: 'Chateau X', region: 'Bordeaux', grapeVariety: 'Merlot', vintage: 2018 } },
  { id: 'b2', status: 'en_cave', wine: { name: 'Domaine Y', region: 'Bourgogne', grapeVariety: 'Pinot Noir', vintage: 2020 } },
]);

vi.mock('../repositories/bottleRepository', () => ({
  createSupabaseBottleRepository: () => ({ listBottles }),
}));
vi.mock('../supabaseClient', () => ({ supabase: {} }));

test('filters the cellar list by region', async () => {
  render(
    <MemoryRouter>
      <CellarListPage />
    </MemoryRouter>
  );

  await waitFor(() => expect(screen.getByText('Chateau X')).toBeInTheDocument());
  expect(screen.getByText('Domaine Y')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/region/i), { target: { value: 'Bordeaux' } });

  expect(screen.getByText('Chateau X')).toBeInTheDocument();
  expect(screen.queryByText('Domaine Y')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module './CellarListPage'"

- [ ] **Step 3: Write minimal implementation**

`src/pages/CellarListPage.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { createSupabaseBottleRepository } from '../repositories/bottleRepository';
import type { BottleInstance, Wine } from '../types';

type BottleWithWine = BottleInstance & { wine: Wine };

export function CellarListPage() {
  const [bottles, setBottles] = useState<BottleWithWine[]>([]);
  const [region, setRegion] = useState('');
  const [grapeVariety, setGrapeVariety] = useState('');
  const [vintage, setVintage] = useState('');

  useEffect(() => {
    const repo = createSupabaseBottleRepository(supabase);
    repo.listBottles({ status: 'en_cave' }).then(setBottles);
  }, []);

  const filtered = bottles.filter((b) => {
    if (region && b.wine.region !== region) return false;
    if (grapeVariety && b.wine.grapeVariety !== grapeVariety) return false;
    if (vintage && String(b.wine.vintage) !== vintage) return false;
    return true;
  });

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold">Ma cave</h1>
      <div className="flex gap-2">
        <label>
          Region
          <input className="border rounded p-1 ml-1" value={region} onChange={(e) => setRegion(e.target.value)} />
        </label>
        <label>
          Cepage
          <input className="border rounded p-1 ml-1" value={grapeVariety} onChange={(e) => setGrapeVariety(e.target.value)} />
        </label>
        <label>
          Millesime
          <input className="border rounded p-1 ml-1" value={vintage} onChange={(e) => setVintage(e.target.value)} />
        </label>
      </div>
      <ul className="space-y-1">
        {filtered.map((b) => (
          <li key={b.id}>
            <Link to={`/bottles/${b.id}`}>{b.wine.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Add the route**

In `src/App.tsx`:
```tsx
import { CellarListPage } from './pages/CellarListPage';
```
```tsx
<Route
  path="/cellar"
  element={
    <ProtectedRoute>
      <CellarListPage />
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add the cellar list page with filters"
```

---

## Task 10: Bottle detail page

**Files:**
- Create: `src/pages/BottleDetailPage.tsx`
- Create: `src/pages/BottleDetailPage.test.tsx`
- Modify: `src/App.tsx` (add `/bottles/:id` route)

**Interfaces:**
- Consumes: `createSupabaseBottleRepository` (Task 6), `supabase` (Task 2).
- Produces: `/bottles/:id` route showing wine and acquisition details, with a link to `/bottles/:id/taste` (built in Task 11) when the bottle is still `en_cave`.

- [ ] **Step 1: Write the failing test**

`src/pages/BottleDetailPage.test.tsx`:
```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { test, expect, vi } from 'vitest';
import { BottleDetailPage } from './BottleDetailPage';

const getBottle = vi.fn().mockResolvedValue({
  id: 'b1',
  status: 'en_cave',
  acquisitionMode: 'achat',
  acquisitionSource: 'Caviste',
  pricePaid: 25,
  acquisitionDate: '2026-01-01',
  wine: { name: 'Chateau X', producer: 'Domaine Y', appellation: 'Margaux', grapeVariety: 'Merlot', region: 'Bordeaux', foodPairing: 'Viande rouge' },
});

vi.mock('../repositories/bottleRepository', () => ({
  createSupabaseBottleRepository: () => ({ getBottle }),
}));
vi.mock('../supabaseClient', () => ({ supabase: {} }));

test('shows the wine and acquisition details, and a tasting action link', async () => {
  render(
    <MemoryRouter initialEntries={['/bottles/b1']}>
      <Routes>
        <Route path="/bottles/:id" element={<BottleDetailPage />} />
      </Routes>
    </MemoryRouter>
  );

  await waitFor(() => expect(screen.getByText('Chateau X')).toBeInTheDocument());
  expect(screen.getByText(/Caviste/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /j'ai bu cette bouteille/i })).toHaveAttribute('href', '/bottles/b1/taste');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module './BottleDetailPage'"

- [ ] **Step 3: Write minimal implementation**

`src/pages/BottleDetailPage.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { createSupabaseBottleRepository } from '../repositories/bottleRepository';
import type { BottleInstance, Wine } from '../types';

type BottleWithWine = BottleInstance & { wine: Wine };

export function BottleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [bottle, setBottle] = useState<BottleWithWine | null>(null);

  useEffect(() => {
    if (!id) return;
    const repo = createSupabaseBottleRepository(supabase);
    repo.getBottle(id).then(setBottle);
  }, [id]);

  if (!bottle) return <p className="p-4">Chargement...</p>;

  return (
    <div className="max-w-lg mx-auto p-4 space-y-2">
      <h1 className="text-xl font-bold">{bottle.wine.name}</h1>
      <p>Producteur: {bottle.wine.producer}</p>
      <p>Appellation: {bottle.wine.appellation}</p>
      <p>Cepage: {bottle.wine.grapeVariety}</p>
      <p>Region: {bottle.wine.region}</p>
      <p>Accords suggeres: {bottle.wine.foodPairing}</p>
      <p>Acquise via: {bottle.acquisitionMode} - {bottle.acquisitionSource}</p>
      <p>Prix paye: {bottle.pricePaid}</p>
      <p>Date d'acquisition: {bottle.acquisitionDate}</p>
      <p>Statut: {bottle.status}</p>
      {bottle.status === 'en_cave' && (
        <Link to={`/bottles/${bottle.id}/taste`} className="inline-block bg-blue-600 text-white rounded p-2">
          J'ai bu cette bouteille
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Add the route**

In `src/App.tsx`:
```tsx
import { BottleDetailPage } from './pages/BottleDetailPage';
```
```tsx
<Route
  path="/bottles/:id"
  element={
    <ProtectedRoute>
      <BottleDetailPage />
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add the bottle detail page"
```

---

## Task 11: Tasting form and tasting history

**Files:**
- Create: `src/pages/TastingFormPage.tsx`
- Create: `src/pages/TastingFormPage.test.tsx`
- Create: `src/pages/TastingHistoryPage.tsx`
- Create: `src/pages/TastingHistoryPage.test.tsx`
- Modify: `src/App.tsx` (add `/bottles/:id/taste` and `/history` routes)

**Interfaces:**
- Consumes: `createTastingRecord` and `TastingRepository` (Task 5), `createSupabaseTastingRepository` (Task 6), `supabase` (Task 2).
- Produces: `/bottles/:id/taste` route that records a tasting via `createTastingRecord`, and `/history` route listing past tastings sorted by rating descending.

- [ ] **Step 1: Write the failing test for the tasting form**

`src/pages/TastingFormPage.test.tsx`:
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { test, expect, vi } from 'vitest';
import { TastingFormPage } from './TastingFormPage';

const insertTastingRecord = vi.fn().mockResolvedValue({ id: 't1' });
const updateBottleStatus = vi.fn().mockResolvedValue(undefined);

vi.mock('../repositories/tastingRepository', () => ({
  createSupabaseTastingRepository: () => ({ insertTastingRecord, updateBottleStatus }),
}));
vi.mock('../supabaseClient', () => ({ supabase: {} }));

test('submitting the tasting form records the tasting and flips bottle status', async () => {
  render(
    <MemoryRouter initialEntries={['/bottles/b1/taste']}>
      <Routes>
        <Route path="/bottles/:id/taste" element={<TastingFormPage />} />
      </Routes>
    </MemoryRouter>
  );

  fireEvent.change(screen.getByLabelText(/note/i), { target: { value: '90' } });
  fireEvent.change(screen.getByLabelText(/date de degustation/i), { target: { value: '2026-09-17' } });
  fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }));

  await waitFor(() => expect(insertTastingRecord).toHaveBeenCalledWith(expect.objectContaining({ bottleInstanceId: 'b1', rating: 90 })));
  expect(updateBottleStatus).toHaveBeenCalledWith('b1', 'consommee');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module './TastingFormPage'"

- [ ] **Step 3: Write minimal implementation**

`src/pages/TastingFormPage.tsx`:
```tsx
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { createSupabaseTastingRepository } from '../repositories/tastingRepository';
import { createTastingRecord } from '../lib/tastingService';

export function TastingFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rating, setRating] = useState('');
  const [notes, setNotes] = useState('');
  const [tastedAt, setTastedAt] = useState('');
  const [companions, setCompanions] = useState('');
  const [occasion, setOccasion] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError(null);
    try {
      const repo = createSupabaseTastingRepository(supabase);
      await createTastingRecord(repo, {
        bottleInstanceId: id,
        rating: rating ? Number(rating) : null,
        notes: notes || null,
        tastedAt,
        companions: companions || null,
        occasion: occasion || null,
        photoUrl: null,
      });
      navigate(`/bottles/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    }
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-3">
      <h1 className="text-xl font-bold">Deguster cette bouteille</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          Note (sur 100)
          <input className="border rounded w-full p-2" value={rating} onChange={(e) => setRating(e.target.value)} />
        </label>
        <label className="block">
          Commentaire
          <textarea className="border rounded w-full p-2" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <label className="block">
          Date de degustation
          <input
            className="border rounded w-full p-2"
            type="date"
            value={tastedAt}
            onChange={(e) => setTastedAt(e.target.value)}
            required
          />
        </label>
        <label className="block">
          Compagnie
          <input className="border rounded w-full p-2" value={companions} onChange={(e) => setCompanions(e.target.value)} />
        </label>
        <label className="block">
          Occasion
          <input className="border rounded w-full p-2" value={occasion} onChange={(e) => setOccasion(e.target.value)} />
        </label>
        <button type="submit" className="bg-blue-600 text-white rounded p-2 w-full">
          Enregistrer
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Write the failing test for tasting history**

`src/pages/TastingHistoryPage.test.tsx`:
```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { test, expect, vi } from 'vitest';
import { TastingHistoryPage } from './TastingHistoryPage';

const listTastingRecords = vi.fn().mockResolvedValue([
  { id: 't1', rating: 80, bottle: { wine: { name: 'Chateau X' } } },
  { id: 't2', rating: 95, bottle: { wine: { name: 'Domaine Y' } } },
]);

vi.mock('../repositories/tastingRepository', () => ({
  createSupabaseTastingRepository: () => ({ listTastingRecords }),
}));
vi.mock('../supabaseClient', () => ({ supabase: {} }));

test('lists tastings sorted by rating descending', async () => {
  render(
    <MemoryRouter>
      <TastingHistoryPage />
    </MemoryRouter>
  );

  const items = await screen.findAllByRole('listitem');
  expect(items[0]).toHaveTextContent('Domaine Y');
  expect(items[1]).toHaveTextContent('Chateau X');
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module './TastingHistoryPage'"

- [ ] **Step 7: Write minimal implementation**

`src/pages/TastingHistoryPage.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { createSupabaseTastingRepository } from '../repositories/tastingRepository';
import type { TastingRecord, BottleInstance, Wine } from '../types';

type TastingWithBottle = TastingRecord & { bottle: BottleInstance & { wine: Wine } };

export function TastingHistoryPage() {
  const [records, setRecords] = useState<TastingWithBottle[]>([]);

  useEffect(() => {
    const repo = createSupabaseTastingRepository(supabase);
    repo.listTastingRecords().then(setRecords);
  }, []);

  const sorted = [...records].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-xl font-bold mb-3">Historique des degustations</h1>
      <ul className="space-y-1">
        {sorted.map((r) => (
          <li key={r.id}>
            {r.bottle.wine.name} - {r.rating ?? 'non note'}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test`
Expected: PASS

- [ ] **Step 9: Add both routes**

In `src/App.tsx`:
```tsx
import { TastingFormPage } from './pages/TastingFormPage';
import { TastingHistoryPage } from './pages/TastingHistoryPage';
```
```tsx
<Route
  path="/bottles/:id/taste"
  element={
    <ProtectedRoute>
      <TastingFormPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/history"
  element={
    <ProtectedRoute>
      <TastingHistoryPage />
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add tasting form and tasting history pages"
```

---

## Task 12: Navigation shell, PWA configuration, and deployment docs

**Files:**
- Create: `src/components/NavBar.tsx`
- Modify: `src/App.tsx` (render `NavBar` on authenticated routes)
- Modify: `vite.config.ts` (add `VitePWA` plugin)
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`
- Create: `README.md` (deployment instructions)

**Interfaces:**
- Consumes: `useAuth` (Task 3).
- Produces: a persistent `NavBar` linking to Dashboard/Cellar/Add bottle/History/Sign out, an installable PWA manifest, and documented deployment steps.

- [ ] **Step 1: Write the `NavBar` component**

`src/components/NavBar.tsx`:
```tsx
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function NavBar() {
  const { signOut } = useAuth();
  return (
    <nav className="flex gap-4 p-3 border-b bg-gray-50 text-sm">
      <Link to="/">Tableau de bord</Link>
      <Link to="/cellar">Ma cave</Link>
      <Link to="/add-bottle">Ajouter</Link>
      <Link to="/history">Historique</Link>
      <button onClick={() => signOut()} className="ml-auto text-red-600">
        Se deconnecter
      </button>
    </nav>
  );
}
```

- [ ] **Step 2: Wrap authenticated routes with `NavBar` in `App.tsx`**

Wrap the `<ProtectedRoute>` children in a layout that also renders `NavBar`:
```tsx
function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <NavBar />
      {children}
    </ProtectedRoute>
  );
}
```
Replace every `<ProtectedRoute>...</ProtectedRoute>` route element with `<AuthenticatedLayout>...</AuthenticatedLayout>`, and import `NavBar`.

- [ ] **Step 3: Run the full test suite to confirm nothing broke**

Run: `npm test`
Expected: PASS (all existing tests)

- [ ] **Step 4: Add PWA support**

`vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'CaveAVin',
        short_name: 'CaveAVin',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1d4ed8',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
  },
});
```

- [ ] **Step 5: Add placeholder icons (manual)**

Generate or export a 192x192 and a 512x512 PNG (any simple wine-themed icon) and save them at `public/icons/icon-192.png` and `public/icons/icon-512.png`.

- [ ] **Step 6: Build and verify the PWA manifest**

Run: `npm run build && npm run preview`
Open the printed URL in a browser, open DevTools → Application → Manifest, confirm "CaveAVin" is listed as installable.

- [ ] **Step 7: Write deployment instructions**

`README.md`:
```markdown
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
4. Une fois deploye, ouvrir l'URL sur mobile et utiliser "Ajouter a l'ecran d'accueil" pour installer l'app.
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add navigation shell, PWA config, and deployment docs"
```

---

## Self-Review Notes

- **Spec coverage:** Aperçu/périmètre (Tasks 1-3), enrichissement par recherche assistée (Task 7 search link), modèle de données Wine/BottleInstance/TastingRecord incl. photo optionnelle du vin (Tasks 2, 6, 7), tableau de bord + à boire bientôt (Tasks 4, 8), ajout multi-bouteilles (Task 7), consultation/filtrage (Task 9), fiche bouteille (Task 10), dégustation + bascule de statut (Tasks 5, 11), historique trié (Task 11), gestion des erreurs (inline in each form task), tests/TDD (every task), hébergement (Task 12). Every spec section maps to at least one task; no gaps found.
- **Type consistency check:** `photoUrl` flows as `string | null` from `AddBottlePage`'s upload helper through `NewWineInput` (Task 6) to the `wines.photo_url` column (Task 2) without renaming. `TastingRepository` (Task 5) and its Supabase implementation (Task 6) share identical method names and signatures (`insertTastingRecord`, `updateBottleStatus`). No mismatches found.
