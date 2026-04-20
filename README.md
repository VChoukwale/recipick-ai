# recipick.ai

recipick.ai started as a personal frustration project. I'm vegetarian, I have a full pantry, and I still end up staring into the fridge every evening thinking "what do I even cook tonight?"

So I built an app that actually looks at what's in my pantry — not generic pantry lists, but *my* pantry — and suggests real recipes with real match percentages. It knows what I have, what I like, how much time I have, and handles substitutions when something is missing. The AI understands cuisines down to the regional level and builds recipes around specific ingredients I want to use up.

It's a Progressive Web App, so it works on desktop and installs straight from the browser on mobile — no app store needed.

---

## What it does

**AI Chef** — Pick your energy level (home all day, quick only, late night), a cuisine, a mood, and optionally a specific dish or ingredient. The AI suggests recipes built around what's actually in your pantry, ranked by match percentage, with substitution ideas for anything missing.

**Smart Pantry** — Add your ingredients once, organized across 16 categories. Star the ones you want to cook around. The app tracks quantities and store info.

**Star Ingredient Mode** — Select any ingredient (or a few) and the AI builds every suggestion around it as the hero. Great for using up things before they go bad.

**Regional Cuisine Explorer** — Select a cuisine, then drill into a specific region. Ask for Maharashtrian specifically, not just "Indian." Or Sichuan, not just "Chinese." The AI goes deep and suggests dishes actually iconic to that place.

**Recipe Inbox** — Paste text from any recipe you found online and the AI extracts all the ingredients, checks them against your pantry, and gives you a match score before you save it.

**Recipe Vault** — All your saved recipes in one place, filterable by cuisine, difficulty, and favorites.

**Grocery Run** — Missing ingredients from any recipe get added to your grocery list in one tap. Check them off as you shop.

**Settings** — Change dietary preference (vegetarian, eggitarian, vegan, or non-vegetarian), cooking skill level, and display name at any time.

---

## Tech stack

- **React 18 + TypeScript + Vite 5** — frontend
- **Tailwind CSS v3** — custom design system (burnt orange `#E8713A`, sage green, warm cream, dark charcoal)
- **Supabase** — Postgres with Row Level Security, Google OAuth, and Deno Edge Functions
- **Claude API** (`claude-haiku-4-5-20251001`) — all AI features run through Supabase Edge Functions; the API key never reaches the client
- **vite-plugin-pwa** — service worker, offline support, installable on mobile

---

## Running locally

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- An [Anthropic](https://console.anthropic.com) API key

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

Add your Anthropic API key in Supabase Dashboard → Edge Functions → Secrets (key name: `ANTHROPIC_API_KEY`).

Then deploy:

```bash
SUPABASE_ACCESS_TOKEN=your-token npx supabase functions deploy ai-chef --project-ref your-project-ref --no-verify-jwt
SUPABASE_ACCESS_TOKEN=your-token npx supabase functions deploy ai-categorize --project-ref your-project-ref --no-verify-jwt
SUPABASE_ACCESS_TOKEN=your-token npx supabase functions deploy ai-extract-recipe --project-ref your-project-ref --no-verify-jwt
```

Get a personal access token from [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens). Don't commit it anywhere.

### 6. Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deploying to Vercel

Connect the repo on [vercel.com](https://vercel.com). It auto-detects Vite — no build settings to change. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in the project settings.

After the first deploy, add your Vercel URL to Supabase → Authentication → URL Configuration → Redirect URLs.

Every push to `main` auto-deploys.

---

## Project structure

```
src/
├── components/
│   ├── home/          # AI chef — DayStatusPicker, RecipeCard, RecipeDetailSheet
│   ├── layout/        # AppShell, BottomNav
│   ├── pantry/        # PantrySection, add/edit sheets, item rows
│   └── ui/            # CookingSpinner, SettingsSheet, shared components
├── contexts/          # AuthContext
├── hooks/             # useTheme
├── lib/               # Supabase client
├── pages/             # HomePage, PantryPage, ShopPage, RecipesPage, InboxPage, AuthPage, OnboardingPage
└── types/             # TypeScript types

supabase/
├── functions/
│   ├── ai-chef/              # Recipe recommendation engine
│   ├── ai-categorize/        # Auto-categorize pantry items on add
│   ├── ai-extract-recipe/    # Extract recipe from pasted text
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
