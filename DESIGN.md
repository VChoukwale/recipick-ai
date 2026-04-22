# recipick.ai — Technical Design Document

> Last updated: April 2026  
> Author: Vaishnavi Choukwale  
> Live: [recipickai.vercel.app](https://recipickai.vercel.app)

---

## 1. Project Overview

recipick.ai is a mobile-first, AI-powered recipe recommendation app that works backwards from your pantry. It supports four dietary profiles (vegan, vegetarian, eggitarian, non-vegetarian), understands regional cuisines globally, and uses a multi-layer variety engine to ensure suggestions feel fresh each day.

The core thesis: **most recipe apps show you what to cook in an ideal world. recipick.ai shows you what you can cook right now, with what you have.**

---

## 2. Problem Statement

- People stare at a full pantry and don't know what to cook.
- Existing apps show aspirational recipes requiring 10+ missing ingredients.
- Vegetarian/vegan apps exist, but few handle eggitarians, non-vegetarians, or diet-switching cleanly.
- Recipe variety degrades fast — the AI tends to suggest the same 5 dishes if not explicitly steered.
- Pantry management is tedious — voice + NLP makes it conversational instead.

---

## 3. Architecture

### High-Level

```
Browser (React PWA)
    ↓
Supabase JS Client
    ↓
Supabase Postgres (RLS)   ←→   Supabase Edge Functions (Deno)
                                        ↓
                               Anthropic Claude Haiku API
                                        ↓
                               (send-feedback only) Resend API
```

### Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript 5, Vite 5, Tailwind CSS v3 |
| Auth | Supabase Google OAuth + session management |
| Database | Supabase Postgres + Row Level Security |
| AI | Anthropic Claude Haiku (claude-haiku-4-5-20251001) |
| Edge Functions | Supabase Edge Functions (Deno runtime) |
| Email | Resend API (feedback notifications only) |
| PWA | vite-plugin-pwa, Service Worker, standalone mode |
| Deployment | Vercel (auto-deploy on push to main) |

---

## 4. Database Schema

### `profiles`
User profile created on first sign-in. Linked to `auth.users` via `id`.

| Column | Type | Notes |
|---|---|---|
| id | uuid | FK → auth.users |
| display_name | text | |
| dietary_preference | text | vegan / vegetarian / vegetarian_with_eggs / non_vegetarian |
| cooking_skill | text | beginner / intermediate / advanced |
| onboarding_completed | boolean | |

### `pantry_items`
Every ingredient the user tracks.

| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| user_id | uuid | FK → profiles |
| name | text | |
| category | text | 16 categories |
| is_available | boolean | false = "out of stock" |
| is_favorite | boolean | Show in Favorites section |
| is_star_ingredient | boolean | Always builds recipes around this |
| ai_tags | text[] | Searchable tags assigned by ai-categorize |

### `saved_recipes`
Recipes saved from AI Chef or extracted from URLs.

| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| user_id | uuid | |
| title | text | |
| description | text | |
| cuisine_type | text | |
| region_detail | text | Sub-region (e.g. "Maharashtra") |
| ingredients | jsonb | Array of {name, quantity, in_pantry} |
| instructions | text[] | |
| difficulty | text | easy / medium / hard |
| time_minutes | int | |
| match_percentage | int | |
| is_favorite | boolean | |
| tried_status | text | not_tried / liked / disliked |
| source | text | ai_generated / url_extracted / manual |
| source_url | text | Original URL if extracted |
| why_this | text | 2–3 bullet lines joined by \n |
| substitutions | jsonb | |

### `grocery_items`
Items to buy, derived from missing recipe ingredients.

| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| user_id | uuid | |
| name | text | |
| category | text | Store section (produce, dairy, etc.) |
| is_checked | boolean | |
| source_recipe | text | Recipe the item came from |

### `feedback`
In-app feedback submissions.

| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| user_id | uuid | FK → profiles |
| user_name | text | |
| user_email | text | |
| reaction | text | 💡 👍 🐛 🤔 |
| message | text | |
| created_at | timestamptz | |

All tables use **Row Level Security** — users can only access their own rows.

---

## 5. Pages & Features

### Home (`/`)
The AI Chef — the core value proposition.

**User flow:**
1. User selects optional filters: energy level (icons), cuisine, mood, meal type, equipment.
2. Taps "Cook for me" (no filters) or "Suggest recipes" (with filters active) or "Cook with [item]" (star ingredient selected).
3. App calls `ai-chef` edge function with full pantry, filters, user profile, variety data.
4. 3 recipe cards returned — sorted by match percentage.
5. Tap a card → RecipeDetailSheet (full recipe, pantry match breakdown, instructions, save/grocery options).

**Variety engine (localStorage):**
- `recently_used_ingredients` — tracks hero ingredients from last 3 batches (max 12 items). Passed to ai-chef as exclusion list.
- `variety_seed` — random 1–100 per call, steers ai-chef toward a different pantry section each call.
- `excluded_recipes` — titles from current session used for "Get more ideas" button.

**Day status:**
- Idle / Cooking now / Busy until [time] / Late night — affects recipe suggestions (e.g. late night → under 20 min).

### Pantry (`/pantry`)
Full ingredient management.

- 16 categories with collapsible sections.
- Star ingredient toggle (always cook around this).
- Availability toggle (in stock / out of stock).
- PantryChat — conversational NLP pantry updates via voice or text. "I just bought potatoes and onions" → AI parses intent, adds to pantry, auto-categorizes async.
- Search with voice input.

### Grocery (`/shop`)
Shopping list.

- Add items manually or from missing ingredients on any recipe.
- Mic inside the search field (voice input).
- ai-grocery-categorize assigns store sections.
- Check off as you shop.

### Recipe Vault (`/recipes`)
All saved recipes.

- 3 collapsible sections: Not tried yet / Tried & liked / Didn't enjoy.
- Filter by cuisine, difficulty, favorites.
- Thumb up/down rating updates tried_status and feeds back into ai-chef preferences.

### Inbox (`/inbox`)
Paste any recipe URL or YouTube link.

- `ai-extract-recipe` extracts structured recipe + scores against pantry.
- One-tap save to vault.
- Shows source URL with link for reference.

### Chef Sage (global overlay)
AI cooking knowledge chatbot — present on every page via bottom nav center button.

- **Role boundary**: handles cooking techniques, substitutions, storage, food science, nutrition, equipment. If asked "what should I cook?" or "suggest me recipes", it redirects: *"For personalised recipes matched to your pantry, tap the 🏠 Home tab — the AI Chef there knows exactly what you have!"* It never generates recipe lists.
- Multi-turn conversation with history passed on each request.
- Voice input (Web Speech API).
- Styled as a raised orange circle in bottom nav — visually distinct from navigation items.

### Settings (sheet)
- Edit display name, dietary preference, cooking skill.
- Dark/light theme toggle (persists to localStorage, defaults to light for new users).
- In-app feedback form: pick reaction (💡 👍 🐛 🤔), write message, submit. Saves to `feedback` table and emails developer via Resend.

### Auth (`/auth`)
Google OAuth sign-in only. Value props displayed: "Any diet — vegan, veggie, or anything", "Regional cuisines from everywhere", "AI that knows your pantry".

### Onboarding (`/onboarding`)
3-step flow: diet profile → cooking skill → add first pantry items. Sets `onboarding_completed = true` on profile.

---

## 6. AI Edge Functions

### `ai-chef` — Recipe Engine

**Input:**
```json
{
  "pantry_items": ["tomatoes", "paneer", "..."],
  "dietary_preference": "vegetarian",
  "cooking_skill": "intermediate",
  "day_status": "idle",
  "cuisine_filter": "Indian",
  "mood_filter": "Comfort Food",
  "meal_type_filter": "dinner",
  "equipment_filter": ["oven"],
  "focus_ingredients": ["matki"],
  "region_filter": "Maharashtra",
  "dish_query": "dal",
  "recently_used_ingredients": ["paneer", "chickpeas"],
  "variety_seed": 42,
  "excluded_recipes": ["Palak Paneer"],
  "liked_recipes": ["Misal Pav"],
  "disliked_recipes": ["Dal Makhani"]
}
```

**Output:** 3 structured recipes with match %, missing ingredients + substitutions, step-by-step instructions, and `why_this` (2–3 bullet lines as a `\n`-joined string).

**Key prompt rules:**
- Dietary safety as absolute rules at top of prompt (hard constraints).
- Plant-based products and masala spice packets always safe regardless of diet.
- `recently_used_ingredients` → hard exclusion from hero role.
- `variety_seed` 1–25 → grains/legumes, 26–50 → vegetables, 51–75 → dairy, 76–100 → specialty/international.
- Flavor profile variety: across 3 recipes, must span ≥2 of: comforting/mild, bold/spicy, fresh/light, umami/sweet-savory.
- `why_this` must be exactly 2–3 short practical bullet lines joined by `\n`. No paragraph prose.
- Missing ingredients cannot be empty when match_percentage < 100.
- Water never listed as a missing ingredient.

### `ai-cooking-assistant` — Chef Sage

Multi-turn cooking knowledge Q&A. System prompt establishes clear role separation from the AI Chef. Handles techniques, substitutions, storage, food science, equipment, cultural context, nutrition. Multi-turn history passed on each call. Explicitly redirects recipe requests to Home tab.

### `ai-extract-recipe` — Recipe Extraction

Reads any URL (or YouTube transcript) and returns structured recipe JSON. Scores each ingredient against user's pantry.

### `ai-categorize` — Pantry Auto-Categorization

Called async after any pantry item is added. Assigns one of 16 categories and up to 5 searchable AI tags. Runs in background; pantry item is created first (as "other"), then updated when classification returns.

### `ai-pantry-chat` — NLP Pantry Management

Accepts natural language like "I just bought tomatoes and garlic, and I used up the spinach." Returns structured `{ add: [], mark_unavailable: [], remove: [] }` actions. Executed against DB by the client.

### `ai-grocery-categorize` — Grocery Store Sections

Assigns store-section categories (produce, dairy, grains, etc.) to grocery list items for logical shopping order.

### `send-feedback` — Feedback Delivery

Saves feedback to `feedback` table via service role key (bypasses RLS). Sends branded HTML email to developer via Resend API. Does not use Claude.

---

## 7. Key Technical Decisions

### Why server-side AI only?
The Anthropic API key never reaches the browser. All AI calls go through Supabase Edge Functions. Users cannot inspect network requests to find or abuse the key.

### Why Claude Haiku specifically?
Fast enough for mobile (sub-3s most calls), cheap enough for a solo project, and instruction-following quality is sufficient for structured JSON output. The structured prompt + schema approach compensates for the smaller model.

### Why `registerType: 'autoUpdate'` for PWA?
Silent updates with no user friction. A `controllerchange` event listener shows a non-blocking toast ("App updated — tap Refresh") when a new service worker activates, so users aren't stuck on an old version without knowing.

### Why localStorage for variety data (not DB)?
`recently_used_ingredients` and `variety_seed` are session/device-level signals. They don't need to sync across devices and don't need persistence across months. localStorage is instant, zero latency, zero DB cost. If cleared, variety resets gracefully.

### Why inline SVG for mic buttons everywhere?
Earlier versions used emoji (🎙) which renders inconsistently across Android/iOS/desktop. SVG ensures pixel-perfect, theme-aware rendering. Same icon pattern used in PantryChat, ShopPage, and CookingAssistant for visual consistency.

### Dietary conflict detection approach
Rather than a blocklist (easily defeated by new product names), the prompt uses a **three-rule system**:
1. Dietary mode as absolute constraints at the prompt top.
2. Explicit exceptions for plant-based branded products and masala spice packets (common false positives).
3. "If focus_ingredients violates diet, ignore those ingredients entirely — never refuse."

This handles edge cases like "Vegan Chicken" in a vegan pantry (safe) and "Fish Curry Masala" (spice blend, always safe), and prevents refusals when a user accidentally requests a focus ingredient that violates their mode.

### Auth value proposition updated
The auth page previously said "Vegetarian & vegan, always" — misleading since the app supports eggitarians and non-vegetarians. Updated to "Any diet — vegan, veggie, or anything."

---

## 8. Design System

CSS custom properties (set on `:root` and `.dark`) for all semantic colors:

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--s1` | white | charcoal-900 | Surface 1 (cards, sheets) |
| `--s2` | cream-50 | charcoal-800 | Surface 2 (backgrounds) |
| `--t1` | stone-900 | stone-50 | Primary text |
| `--t2` | stone-600 | stone-300 | Secondary text |
| `--t3` | stone-400 | stone-500 | Muted text |
| `--bdr-s` | cream-200 | charcoal-700 | Subtle border |
| `--bdr-m` | cream-300 | charcoal-600 | Medium border |

Brand orange: `#E8713A` (dark variant `#D85F22`).

Typography: `font-display` (Nunito, 700/800 weights for headings), `font-body` (Inter, regular for body text).

---

## 9. Security & Guardrails

- **API key isolation**: `ANTHROPIC_API_KEY` and `RESEND_API_KEY` live only in Supabase Edge Function secrets. Never in client code or `.env` committed to git.
- **RLS on all tables**: Every SELECT/INSERT/UPDATE/DELETE scoped to `auth.uid() = user_id`. No cross-user data access possible.
- **No user-controlled SQL**: All DB operations use Supabase typed client. No raw query construction from user input.
- **Prompt injection**: AI endpoints receive only structured JSON — pantry item names, filter strings. No freeform user text goes directly into system prompts (only `ai-cooking-assistant` and `ai-pantry-chat` take user messages, and those are kept as `user`-role messages, not injected into the system prompt).
- **Diet safety**: Hard-coded constraints in prompt; if dietary_preference conflicts with request, AI ignores conflicting ingredients rather than refusing — always returns valid, safe recipes.
- **Feedback spam**: Feedback is saved per authenticated user only (service role used for RLS bypass, but user_id is captured from the JWT server-side).

---

## 10. Known Constraints

| Constraint | Detail |
|---|---|
| Recipe count | 3 per request (5 causes timeouts on Supabase free tier) |
| AI response time | 2–5s for recipe generation; Chef Sage typically 1–2s |
| Variety engine | Client-side localStorage; resets if cleared or on new device |
| Voice input | Web Speech API — Chrome on Android/desktop only. No iOS Safari support. |
| Pantry size | No hard limit, but large pantries (100+ items) may affect response quality |
| Offline | PWA caches shell + static assets. AI features require network. |

---

## 11. Where recipick.ai Works

| Platform | Method | Notes |
|---|---|---|
| Android Chrome | Install PWA from browser | Full voice, standalone, push-ready |
| Desktop Chrome/Edge | Install PWA from browser | Full feature parity |
| iOS Safari | Add to Home Screen | Works, but no Web Speech API |
| Any browser | Web app | Full features minus voice and install prompt |

---

## 12. Minimizes Waste — The Core Narrative

A secondary but important framing: recipick.ai is also a food waste reduction tool. By surfacing recipes built around what you already have (especially near-expiry or star ingredients), it nudges users toward using up existing stock before buying more. The grocery list integration closes the loop — items that are genuinely missing get added to the list, while items already in the pantry are never re-bought accidentally.

This narrative is intentionally secondary in the UI (the primary hook is convenience and personalisation), but it's accurate and worth highlighting in social/sustainability contexts.
