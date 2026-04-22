<div align="center">

# recipick.ai

**Your pantry-first AI kitchen companion — recipes personalised to what you have, who you are, and how you eat**

[![Live App](https://img.shields.io/badge/Live%20App-recipickai.vercel.app-E8713A?style=for-the-badge&logo=vercel&logoColor=white)](https://recipickai.vercel.app)
[![PWA](https://img.shields.io/badge/PWA-Installable-5A8F5A?style=for-the-badge&logo=pwa&logoColor=white)](https://recipickai.vercel.app)
[![Built with Claude](https://img.shields.io/badge/AI-Claude%20Haiku-6B4FBB?style=for-the-badge&logo=anthropic&logoColor=white)](https://anthropic.com)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

</div>

---

## What is recipick.ai?

recipick.ai is a mobile-first, AI-powered recipe recommendation app that works backwards from your pantry. Instead of showing you aspirational recipes that need 10 things you don't have, it looks at what's already in your kitchen and suggests meals you can cook right now — matched to your dietary profile, energy level, cuisine preferences, and taste history.

It supports four dietary profiles — **vegan**, **vegetarian**, **eggitarian (lacto-ovo)**, and **non-vegetarian** — each with precise conflict detection and AI rules that go beyond simple keyword filtering. Plant-based mock meats, spice packets named after meat dishes, and other edge cases are all handled correctly.

Built as a **Progressive Web App (PWA)**, it installs directly from the browser like a native app — no App Store, no waiting, no friction.

**Core technology:**

| Layer | Tech |
|---|---|
| Frontend | React 18 · TypeScript 5 · Vite 5 · Tailwind CSS v3 |
| Auth & Database | Supabase (Postgres + RLS + Google OAuth) |
| AI | Anthropic Claude Haiku via Supabase Edge Functions (Deno) |
| PWA | vite-plugin-pwa · Service Worker · Standalone mode |
| Deployment | Vercel — auto-deploy on push to `main` |

---

## Why I built this

I kept staring into a full pantry with no idea what to cook. Generic recipe apps show dishes that need 10 ingredients you don't have. I wanted something that actually looked at *my* pantry and worked backwards — respecting my diet, using what I already have, and genuinely varying what it suggests each day.

So I built recipick.ai. It knows what you have, respects your dietary profile, understands your energy level and time, and suggests recipes with real pantry match percentages. It tracks what you've made, what you liked, and what flavour profiles you haven't tried recently — so every recommendation feels fresh.

---

## Feature Overview

| Feature | Description |
|---|---|
| 🤖 **AI Chef** | Pick energy level, cuisine, mood, meal type, and equipment. Get 3 recipes ranked by pantry match %, with substitutions for anything missing. |
| 🧺 **Smart Pantry** | Add ingredients across 16 categories. AI auto-categorises on add. Star items to always cook around them. |
| 🌍 **Regional Cuisine Explorer** | Go beyond "Indian" or "Chinese" — ask for Maharashtrian, Sichuan, Oaxacan. The AI knows authentic regional dishes. |
| 🎯 **Focus Ingredient Mode** | Select one or more pantry items and every recipe is built around them as the hero. |
| 🔀 **Variety Engine** | Tracks recently used hero ingredients across sessions. A random variety seed steers the AI toward a fresh pantry section every call. |
| 🧑‍🍳 **Chef Sage** | AI cooking assistant chatbot on every page. Ask anything — techniques, substitutions, storage, food science. Voice + text. Multi-turn. |
| 📥 **Recipe Inbox** | Paste any recipe URL or YouTube link. AI extracts ingredients, scores them against your pantry, and lets you save in one tap. |
| 📖 **Recipe Vault** | Saved recipes in collapsible sections: Not tried yet / Tried & liked / Didn't enjoy. Filter by cuisine, difficulty, favorites. |
| ⭐ **Favorites + Ratings** | Star to bookmark. Mark as tried, then rate 👍/👎. Ratings feed back into AI to improve future suggestions. |
| 🛒 **Grocery Run** | Missing ingredients go to your grocery list in one tap. Voice input. Check off as you shop. |
| ⚙️ **Diet & Profile** | Vegan, vegetarian, eggitarian, or non-vegetarian. Cooking skill level. Instant conflict detection across your pantry on change. |
| 🌙 **Dark Mode + PWA** | Full dark mode. Installs on any device from the browser as a standalone app. |

---

## AI Architecture

Every AI feature runs server-side via Supabase Edge Functions. The Anthropic API key never reaches the browser.

### Edge Functions

| Function | Model | Purpose |
|---|---|---|
| `ai-chef` | Claude Haiku | Core recipe engine. Receives full pantry, dietary rules, filters, focus ingredients, recently used heroes, and a variety seed. Returns 3 structured recipes with match %, missing ingredients, substitutions, and steps. |
| `ai-cooking-assistant` | Claude Haiku | Chef Sage chatbot. Multi-turn cooking Q&A — techniques, substitutions, storage, food science. Accepts conversation history for context. |
| `ai-extract-recipe` | Claude Haiku | Extracts a structured recipe from any pasted URL or YouTube video (reads transcript). Scores ingredients against the user's pantry. |
| `ai-categorize` | Claude Haiku | Auto-assigns pantry items to one of 16 categories with searchable AI tags. Runs silently after an item is added. |
| `ai-pantry-chat` | Claude Haiku | Natural language pantry management ("I just bought tomatoes", "used up the milk"). Parses intent and updates the pantry. |
| `ai-grocery-categorize` | Claude Haiku | Assigns grocery list items to store-section categories to help with physical shopping order. |

### Key Prompt Engineering Decisions

**Dietary safety as a hard rule** — rules sit at the top of the `ai-chef` prompt as non-negotiable. Plant-based products ("Vegan Chicken", "Beyond Meat", "Tofu") and spice packets ("Fish Curry Masala") are always safe regardless of dietary mode — spice names reference dish origins, not actual meat content.

**Variety engine** — the chef prompt enforces: (1) different hero ingredient per recipe, (2) spread across 2+ cuisines, (3) `recently_used_ingredients` are excluded from starring in new recipes, (4) a `variety_seed` (1–100, randomised each call) steers the AI toward a different pantry section each call: grains/legumes → vegetables → dairy → specialty items.

**Flavor profile mix** — even across 3 recipes, the prompt asks for at least 2 distinct flavor zones (bold/spicy, comforting/mild, fresh/light, umami/sweet-savory).

**Regional depth** — `region_filter="Maharashtra"` produces misal pav, thalipeeth, kothimbir vadi — not generic curry. The prompt explicitly asks for dishes iconic to that specific sub-region.

**Structured JSON output** — every prompt ends with an explicit schema and "Return ONLY this JSON, no markdown." Responses are stripped of code fences before parsing.

**Missing ingredient accuracy** — `missing_ingredients` cannot be empty when `match_percentage < 100`. Without this, Claude returns optimistic scores without listing what's actually missing.

---

## Local Development

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- An [Anthropic API key](https://console.anthropic.com)

### 1. Clone and install

```bash
git clone https://github.com/VChoukwale/recipick-ai.git
cd recipick-ai
npm install
```

### 2. Environment variables

Create `.env.local` in the root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Both values are in **Supabase Dashboard → Project Settings → Data API**.

### 3. Database migrations

Run in order in your **Supabase SQL Editor**:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_supplements_category.sql
supabase/migrations/003_recipe_inbox.sql
supabase/migrations/004_grocery_list.sql
```

### 4. Google OAuth

Supabase Dashboard → Authentication → Providers → Google. Enable it, add OAuth credentials, and add `http://localhost:5173` to allowed redirect URLs.

### 5. Edge Functions

Add your Anthropic key in **Supabase Dashboard → Edge Functions → Secrets** as `ANTHROPIC_API_KEY`.

Then deploy all functions:

```bash
export SUPABASE_ACCESS_TOKEN=your-access-token
export PROJECT_REF=your-project-ref

npx supabase functions deploy ai-chef --project-ref $PROJECT_REF --no-verify-jwt
npx supabase functions deploy ai-cooking-assistant --project-ref $PROJECT_REF --no-verify-jwt
npx supabase functions deploy ai-categorize --project-ref $PROJECT_REF --no-verify-jwt
npx supabase functions deploy ai-extract-recipe --project-ref $PROJECT_REF --no-verify-jwt
npx supabase functions deploy ai-pantry-chat --project-ref $PROJECT_REF --no-verify-jwt
npx supabase functions deploy ai-grocery-categorize --project-ref $PROJECT_REF --no-verify-jwt
```

Get your personal access token from [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens). Never commit it.

### 6. Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deploying to Vercel

1. Connect the repo at [vercel.com](https://vercel.com). Vite is auto-detected.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables.
3. After first deploy, add your Vercel URL to **Supabase → Authentication → URL Configuration → Redirect URLs**.

Every push to `main` triggers an automatic redeploy.

---

## Project Structure

```
src/
├── components/
│   ├── home/          # RecipeCard, RecipeDetailSheet, DayStatusPicker
│   ├── layout/        # AppShell, BottomNav
│   ├── pantry/        # PantrySection, PantryItemRow, AddItemSheet, PantryChat
│   └── ui/            # CookingAssistant (Chef Sage), CookingSpinner, SettingsSheet
├── contexts/          # AuthContext, CookingAssistantContext
├── hooks/             # useTheme
├── lib/               # Supabase client
├── pages/             # HomePage, PantryPage, ShopPage, RecipesPage, InboxPage, AuthPage, OnboardingPage
└── types/             # TypeScript database types

supabase/
├── functions/
│   ├── ai-chef/                # Recipe recommendation engine
│   ├── ai-cooking-assistant/   # Chef Sage chatbot
│   ├── ai-categorize/          # Auto-categorizes pantry items
│   ├── ai-extract-recipe/      # Extracts recipe from URL / YouTube
│   ├── ai-pantry-chat/         # Natural language pantry updates
│   └── ai-grocery-categorize/  # Grocery list categorization
└── migrations/
    ├── 001_initial_schema.sql
    ├── 002_supplements_category.sql
    ├── 003_recipe_inbox.sql
    └── 004_grocery_list.sql
```

---

## License

MIT
