<div align="center">

# recipick.ai

**AI-powered recipes built around what's actually in your pantry**

[![Live App](https://img.shields.io/badge/Live%20App-recipickai.vercel.app-E8713A?style=for-the-badge&logo=vercel&logoColor=white)](https://recipickai.vercel.app)
[![PWA](https://img.shields.io/badge/PWA-Installable-5A8F5A?style=for-the-badge&logo=pwa&logoColor=white)](https://recipickai.vercel.app)
[![Built with Claude](https://img.shields.io/badge/AI-Claude%20API-6B4FBB?style=for-the-badge&logo=anthropic&logoColor=white)](https://anthropic.com)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)

</div>

---

## Why I built this

I kept staring into a full fridge with no idea what to cook. Generic recipe apps show you dishes that need 10 ingredients you don't have. I wanted something that actually looked at *my* pantry and worked backwards from there.

So I built recipick.ai. It knows what you have, what you're in the mood for, how much time you've got, and suggests recipes with real match percentages. When something is missing, it finds a substitution. When you want to cook around a specific ingredient before it goes bad, it builds the whole recipe around that.

It installs from the browser like a native app. No App Store, no sign-up friction.

---

## What it does

<table>
  <thead>
    <tr>
      <th width="280">Feature</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>🤖 <b>AI Chef</b></td><td>Pick your energy level, cuisine, and mood. Get recipes ranked by pantry match percentage, with substitutions for anything missing.</td></tr>
    <tr><td>🧺 <b>Smart Pantry</b></td><td>Add ingredients once across 16 categories. Star the ones you want to cook around.</td></tr>
    <tr><td>⭐ <b>Star Ingredient Mode</b></td><td>Select one or more ingredients and every recipe suggestion is built around them as the hero.</td></tr>
    <tr><td>🌍 <b>Regional Cuisine Explorer</b></td><td>Go beyond "Indian" or "Chinese". Ask for Maharashtrian, Sichuan, Oaxacan. The AI knows the difference.</td></tr>
    <tr><td>📥 <b>Recipe Inbox</b></td><td>Paste any recipe from anywhere. The AI extracts all ingredients and scores it against your pantry before you save it.</td></tr>
    <tr><td>📖 <b>Recipe Vault</b></td><td>All saved recipes in one place, filterable by cuisine, difficulty, and favorites.</td></tr>
    <tr><td>🛒 <b>Grocery Run</b></td><td>Missing ingredients go to your grocery list in one tap. Check them off as you shop.</td></tr>
    <tr><td>⚙️ <b>Settings</b></td><td>Vegetarian, eggitarian, vegan, or non-vegetarian. Cooking skill level. All adjustable anytime.</td></tr>
  </tbody>
</table>

---

## AI integration

Every AI feature in recipick.ai runs server-side via Supabase Edge Functions. The Anthropic API key never reaches the browser — the client only talks to Supabase, which holds the key as a secret.

There are four distinct AI touchpoints, each using the right model for the job:

<table>
  <thead>
    <tr>
      <th width="220">Edge Function</th>
      <th width="120">Model</th>
      <th>What it does & why</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>ai-chef</code></td>
      <td>Claude Haiku</td>
      <td>Core recipe engine. Receives the full pantry, dietary preference, day status, cuisine/region/mood filters, and focus ingredients. Returns 3 structured recipes with match percentages, substitutions, and step-by-step instructions. Haiku is fast enough for real-time UX and the prompt does the heavy reasoning work.</td>
    </tr>
    <tr>
      <td><code>ai-extract-recipe</code></td>
      <td>Claude Haiku</td>
      <td>Extracts a structured recipe from any pasted text or URL. For YouTube links it scrapes the page HTML to pull caption tracks and runs the transcript through Claude. Respects the user's dietary preference — a non-vegetarian user can import a chicken recipe; a vegan user gets a rejection with a clear message. Pantry synonym matching (curd = yogurt, rava = semolina) is handled entirely in the prompt.</td>
    </tr>
    <tr>
      <td><code>ai-categorize</code></td>
      <td>Claude Haiku</td>
      <td>When a pantry item is added, Claude assigns it to one of 16 categories (fresh produce, dairy, spices, etc.) and generates searchable AI tags. Runs silently in the background — the user sees instant feedback while categorization happens async. Haiku is intentional here: this is a 10-token output task and Sonnet would be wasteful.</td>
    </tr>
    <tr>
      <td><code>ai-grocery-categorize</code></td>
      <td>Claude Haiku</td>
      <td>Same pattern as pantry categorization, applied to grocery list items. Assigns store-section categories (Produce, Dairy, Frozen, etc.) to help with physical shopping order.</td>
    </tr>
  </tbody>
</table>

### Prompt engineering decisions

**Structured JSON output** — every prompt ends with an explicit schema and the instruction "Return ONLY this JSON, no markdown." Claude Haiku occasionally wraps output in code fences, so all responses are stripped of ` ```json ` wrappers before parsing.

**Dietary safety as a hard rule** — the `ai-chef` system prompt states dietary rules at the top and marks them as non-negotiable. `ai-extract-recipe` dynamically injects the user's preference into the prompt so the rejection logic is diet-aware, not hardcoded.

**Variety enforcement** — the chef prompt explicitly instructs Claude to use a different hero ingredient per recipe, spread across at least 2 cuisines when generating 3+ results, and avoid any titles listed in `excluded_recipes`. This prevents the AI from defaulting to the same 2-3 dishes every session.

**Regional depth** — the region filter prompt distinguishes between parent cuisine and sub-region. `region_filter="Maharashtra"` triggers suggestions like misal pav, thalipeeth, and kothimbir vadi — not generic curry. This works because the instruction tells Claude to go deep on dishes iconic to that specific place, not the broader cuisine.

**Pantry synonym resolution** — the extract function lists common synonym pairs in the prompt (capsicum = bell pepper, aubergine = eggplant, groundnut oil = peanut oil) so `in_pantry` flags are accurate even when recipe ingredient names differ from how the user typed them.

**Missing ingredient accuracy** — a specific rule enforces that `missing_ingredients` can never be empty when `match_percentage < 100`. Without this, Claude sometimes returns an optimistic match score without listing what's actually missing.

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite 5 |
| Styling | Tailwind CSS v3 with a custom design token system |
| Auth + DB | Supabase (Postgres with Row Level Security, Google OAuth) |
| AI | Claude API via Supabase Edge Functions (key stays server-side) |
| PWA | vite-plugin-pwa, service worker, offline support |
| Deploy | Vercel (auto-deploys on push to main) |

The design uses CSS custom properties for the full token system: burnt orange `#E8713A` as the brand color, warm ivory and parchment surfaces in light mode, and a layered dark charcoal system in dark mode.

---

## Running locally

<details>
<summary><strong>Prerequisites</strong></summary>

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- An [Anthropic](https://console.anthropic.com) API key

</details>

### 1. Clone and install

```bash
git clone https://github.com/VChoukwale/recipick-ai.git
cd recipick-ai
npm install
```

### 2. Environment variables

Create `.env.local` in the project root:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Find both in Supabase Dashboard → Project Settings → Data API.

### 3. Database

Run the migrations in order in your Supabase SQL Editor:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_supplements_category.sql
supabase/migrations/003_recipe_inbox.sql
supabase/migrations/004_grocery_list.sql
```

### 4. Google OAuth

Supabase Dashboard → Authentication → Providers → Google. Enable it, add your OAuth credentials, and add `http://localhost:5173` to the allowed redirect URLs.

### 5. Edge functions

Add your Anthropic key in Supabase Dashboard → Edge Functions → Secrets as `ANTHROPIC_API_KEY`.

Then deploy:

```bash
SUPABASE_ACCESS_TOKEN=your-token npx supabase functions deploy ai-chef --project-ref your-project-ref --no-verify-jwt
SUPABASE_ACCESS_TOKEN=your-token npx supabase functions deploy ai-categorize --project-ref your-project-ref --no-verify-jwt
SUPABASE_ACCESS_TOKEN=your-token npx supabase functions deploy ai-extract-recipe --project-ref your-project-ref --no-verify-jwt
```

Get your personal access token from [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens). Never commit it.

### 6. Start

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deploying to Vercel

1. Connect the repo at [vercel.com](https://vercel.com). Vite is auto-detected.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables.
3. After the first deploy, add your Vercel URL to Supabase → Authentication → URL Configuration → Redirect URLs.

Every push to `main` triggers an automatic redeploy.

---

## Project structure

```
src/
├── components/
│   ├── home/          # AI chef: DayStatusPicker, RecipeCard, RecipeDetailSheet
│   ├── layout/        # AppShell, BottomNav
│   ├── pantry/        # PantrySection, add/edit sheets, item rows
│   └── ui/            # CookingSpinner, SettingsSheet, shared UI
├── contexts/          # AuthContext
├── hooks/             # useTheme
├── lib/               # Supabase client
├── pages/             # HomePage, PantryPage, ShopPage, RecipesPage, InboxPage, AuthPage, OnboardingPage
└── types/             # TypeScript types

supabase/
├── functions/
│   ├── ai-chef/               # Recipe recommendation engine
│   ├── ai-categorize/         # Auto-categorizes pantry items on add
│   ├── ai-extract-recipe/     # Extracts recipe from pasted text
│   └── ai-grocery-categorize/
└── migrations/
    ├── 001_initial_schema.sql
    ├── 002_supplements_category.sql
    ├── 003_recipe_inbox.sql
    └── 004_grocery_list.sql
```

---

## License

MIT
