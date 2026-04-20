# recipick.ai 🍳

> AI-powered vegetarian & vegan recipe companion — built as a mobile-first Progressive Web App.

recipick.ai helps vegetarians and vegans answer "what should I cook today?" by looking at what's actually in their pantry, their energy level, and their preferred cuisines — then generating personalized recipe suggestions using Claude AI.

---

## Features

| Feature | Status |
|---|---|
| F1 — Auth & Scaffold | ✅ Done |
| F2 — Onboarding (dietary prefs, skill, cuisines, pantry seed) | ✅ Done |
| F3 — Smart Pantry (categories, search, multi-category items, store/qty) | ✅ Done |
| F4 — AI Chef ("What should I cook?") | ✅ Done |
| F5 — Regional cuisine explorer | 🔜 Upcoming |
| F6 — Star ingredient mode | 🔜 Upcoming |
| F7 — Grocery run list | 🔜 Upcoming |
| F8 — Recipe vault + detail view | 🔜 Upcoming |
| F9 — Recipe inbox (save from web URL) | 🔜 Upcoming |
| F10 — PWA + responsive polish + deploy | 🔜 Upcoming |

---

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite 5
- **Styling**: Tailwind CSS v3 — custom brand palette (burnt orange, sage green, cream, charcoal)
- **Fonts**: Nunito (display) + DM Sans (body) via Google Fonts
- **Backend**: Supabase (PostgreSQL + Row Level Security + Auth + Edge Functions)
- **Auth**: Google OAuth via Supabase
- **AI**: Anthropic Claude API (`claude-haiku-4-5-20251001`) via Supabase Edge Functions
- **State**: React hooks + sessionStorage for recipe caching

---

## Pantry Categories (16 total)

Fresh Produce · Dairy & Eggs · Protein · Grains & Legumes · Spices & Herbs · Condiments & Sauces · Oils & Fats · Frozen · Canned Goods · Dry & Shelf · Baking · Snacks · Beverages · Dips & Spreads · **Supplements** (nutritional yeast, hemp seeds, spirulina, etc.) · Other

Items can belong to multiple categories (e.g. Paneer = Dairy + Protein).

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)
- An [Anthropic](https://console.anthropic.com) API key with active credits

### 1 — Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/recipick-ai.git
cd recipick-ai
npm install
```

> **⚠️ Replace** `YOUR_USERNAME` with your GitHub username.

### 2 — Environment variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

> **⚠️ Replace** both values with your actual Supabase project URL and anon key.  
> Find them at: Supabase Dashboard → Project Settings → Data API.

### 3 — Database setup

Run the migration in your Supabase SQL Editor:

```
supabase/migrations/001_initial_schema.sql
```

Then run the supplements category patch:

```sql
ALTER TABLE pantry_items
  DROP CONSTRAINT IF EXISTS pantry_items_category_check;

ALTER TABLE pantry_items
  ADD CONSTRAINT pantry_items_category_check
  CHECK (category IN (
    'fresh_produce', 'dairy_eggs', 'grains_legumes', 'spices_herbs',
    'condiments_sauces', 'frozen', 'snacks', 'beverages',
    'dry_shelf', 'oils_fats', 'baking', 'dips', 'canned',
    'protein', 'supplements', 'other'
  ));
```

### 4 — Google OAuth

In your Supabase Dashboard → Authentication → Providers → Google:
- Enable Google
- Add your Google OAuth Client ID and Secret
- Add `http://localhost:5173` to allowed redirect URLs (for local dev)

### 5 — Deploy Edge Functions

```bash
# Set your Supabase access token (from supabase.com/dashboard/account/tokens)
$env:SUPABASE_ACCESS_TOKEN="YOUR_SUPABASE_ACCESS_TOKEN"

npx supabase functions deploy ai-chef --project-ref YOUR_PROJECT_REF --no-verify-jwt
npx supabase functions deploy ai-categorize --project-ref YOUR_PROJECT_REF
```

Then add the Anthropic API key as a secret:  
Supabase Dashboard → Edge Functions → Secrets → Add `ANTHROPIC_API_KEY`

> **⚠️ Replace** `YOUR_SUPABASE_ACCESS_TOKEN` and `YOUR_PROJECT_REF` with your actual values.

### 6 — Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Project Structure

```
src/
├── components/
│   ├── home/          # AI chef dashboard (DayStatusPicker, RecipeCard, RecipeDetailSheet)
│   ├── layout/        # AppShell, BottomNav
│   └── pantry/        # PantrySection, PantryItemRow, AddItemSheet, EditItemSheet, etc.
├── contexts/          # AuthContext
├── hooks/             # useTheme
├── lib/               # Supabase client
├── pages/             # HomePage, PantryPage, AuthPage, OnboardingPage, ...
└── types/             # TypeScript types (database.ts)

supabase/
├── functions/
│   ├── ai-chef/           # Recipe recommendation engine
│   ├── ai-categorize/     # Auto-categorize pantry items
│   ├── ai-extract-recipe/ # Extract recipes from URLs
│   └── ai-grocery-categorize/
└── migrations/
    └── 001_initial_schema.sql
```

---

## Design System

- **Primary color**: Brand orange (`#E8713A`)
- **Dark mode**: Fully supported via Tailwind `darkMode: 'class'` + localStorage
- **Theme toggle**: Sun/moon button in the top-right of the app header
- Each pantry category has a unique color (background, border, hover state)

---

## License

MIT
