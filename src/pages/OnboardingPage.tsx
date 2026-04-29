import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { DietaryPreference, SkillLevel, PantryCategory } from '../types/database'
import { ALLERGENS } from '../utils/allergens'

// ─── Step 2 data ────────────────────────────────────────────
const CUISINES = [
  { id: 'Indian',         flag: '🇮🇳' },
  { id: 'Korean',         flag: '🇰🇷' },
  { id: 'Chinese',        flag: '🇨🇳' },
  { id: 'Italian',        flag: '🇮🇹' },
  { id: 'Mexican',        flag: '🇲🇽' },
  { id: 'Thai',           flag: '🇹🇭' },
  { id: 'Japanese',       flag: '🇯🇵' },
  { id: 'Mediterranean',  flag: '🫒' },
  { id: 'American',       flag: '🇺🇸' },
  { id: 'Middle Eastern', flag: '🌙' },
  { id: 'Greek',          flag: '🇬🇷' },
  { id: 'Ethiopian',      flag: '🇪🇹' },
]

// ─── Step 3 data ────────────────────────────────────────────
interface StarterItem { name: string; category: PantryCategory }
interface StarterSection { label: string; emoji: string; items: StarterItem[] }

const STARTER_PANTRY: StarterSection[] = [
  {
    label: 'Fresh Produce', emoji: '🥬',
    items: [
      { name: 'Onion',       category: 'fresh_produce' },
      { name: 'Tomato',      category: 'fresh_produce' },
      { name: 'Potato',      category: 'fresh_produce' },
      { name: 'Garlic',      category: 'fresh_produce' },
      { name: 'Ginger',      category: 'fresh_produce' },
      { name: 'Spinach',     category: 'fresh_produce' },
      { name: 'Bell Pepper', category: 'fresh_produce' },
      { name: 'Cilantro',    category: 'fresh_produce' },
    ],
  },
  {
    label: 'Dairy & Eggs', emoji: '🥛',
    items: [
      { name: 'Milk',   category: 'dairy_eggs' },
      { name: 'Yogurt', category: 'dairy_eggs' },
      { name: 'Butter', category: 'dairy_eggs' },
      { name: 'Paneer', category: 'dairy_eggs' },
      { name: 'Cheese', category: 'dairy_eggs' },
      { name: 'Eggs',   category: 'dairy_eggs' },
    ],
  },
  {
    label: 'Grains & Legumes', emoji: '🌾',
    items: [
      { name: 'Rice',      category: 'grains_legumes' },
      { name: 'Pasta',     category: 'grains_legumes' },
      { name: 'Lentils (Dal)', category: 'grains_legumes' },
      { name: 'Chickpeas', category: 'grains_legumes' },
      { name: 'Bread',     category: 'grains_legumes' },
      { name: 'Flour',     category: 'grains_legumes' },
      { name: 'Oats',      category: 'grains_legumes' },
    ],
  },
  {
    label: 'Spices & Herbs', emoji: '🌶️',
    items: [
      { name: 'Salt',        category: 'spices_herbs' },
      { name: 'Black Pepper', category: 'spices_herbs' },
      { name: 'Turmeric',    category: 'spices_herbs' },
      { name: 'Cumin',       category: 'spices_herbs' },
      { name: 'Chili Powder', category: 'spices_herbs' },
      { name: 'Garam Masala', category: 'spices_herbs' },
      { name: 'Oregano',     category: 'spices_herbs' },
    ],
  },
  {
    label: 'Condiments', emoji: '🫙',
    items: [
      { name: 'Olive Oil',  category: 'oils_fats' },
      { name: 'Soy Sauce',  category: 'condiments_sauces' },
      { name: 'Ketchup',    category: 'condiments_sauces' },
      { name: 'Mustard',    category: 'condiments_sauces' },
      { name: 'Vinegar',    category: 'condiments_sauces' },
    ],
  },
  {
    label: 'Frozen', emoji: '🧊',
    items: [
      { name: 'Frozen Peas',       category: 'frozen' },
      { name: 'Frozen Corn',       category: 'frozen' },
      { name: 'Frozen Broccoli',   category: 'frozen' },
      { name: 'Mixed Vegetables',  category: 'frozen' },
    ],
  },
]

// ─── Component ───────────────────────────────────────────────
export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Step 2 state
  const [dietary, setDietary] = useState<DietaryPreference>('vegetarian')
  const [skill, setSkill] = useState<SkillLevel>('beginner')
  const [cuisines, setCuisines] = useState<string[]>([])

  // Step 2 allergies
  const [allergies, setAllergies] = useState<string[]>([])

  // Step 3 state — set of selected item names
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  function toggleCuisine(id: string) {
    setCuisines(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  function toggleAllergen(id: string) {
    setAllergies(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])
  }

  function toggleItem(name: string) {
    setCheckedItems(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  async function handleFinish() {
    if (!user) return
    setSaving(true)
    setSaveError('')

    try {
      // upsert so a profile row is created if it doesn't exist yet
      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          dietary_preference: dietary,
          skill_level: skill,
          preferred_cuisines: cuisines,
          allergies,
          onboarding_completed: true,
        })

      if (profileErr) throw profileErr

      if (checkedItems.size > 0) {
        const allItems = STARTER_PANTRY.flatMap(s => s.items)
        const toInsert = allItems
          .filter(item => checkedItems.has(item.name))
          .map(item => ({
            user_id: user.id,
            name: item.name,
            category: item.category,
            is_available: true,
          }))
        const { error: pantryErr } = await supabase.from('pantry_items').insert(toInsert)
        if (pantryErr) throw pantryErr
      }

      await refreshProfile()
      navigate('/', { replace: true })
    } catch (e) {
      console.error('onboarding finish error:', e)
      setSaveError('Something went wrong. Please check your connection and try again.')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#EDE7DC] dark:bg-charcoal-950 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        {/* Progress dots */}
        {step < 4 && (
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3].map(n => (
              <div
                key={n}
                className={`h-2 rounded-full transition-all duration-300 ${
                  n === step ? 'w-8 bg-brand-500' : n < step ? 'w-2 bg-brand-300' : 'w-2 bg-stone-300 dark:bg-stone-600'
                }`}
              />
            ))}
          </div>
        )}

        {/* ── Step 1: Welcome ── */}
        {step === 1 && (
          <div className="text-center animate-fade-in">
            <div className="text-7xl mb-6">🥘</div>
            <h1 className="font-display text-3xl font-800 text-stone-800 dark:text-stone-100 mb-3">
              Welcome to recipick.ai!
            </h1>
            <p className="text-stone-500 dark:text-stone-400 font-body mb-2 text-base leading-relaxed">
              Your kitchen is about to get smarter.
            </p>
            <p className="text-stone-400 dark:text-stone-500 font-body mb-10 text-sm leading-relaxed">
              Let's take 2 minutes to set up your kitchen so we can suggest recipes you'll actually want to cook.
            </p>

            <div className="space-y-3 mb-10 text-left">
              {[
                { icon: '🌍', title: 'Regional cuisines', desc: 'From Maharashtrian to Korean to Oaxacan' },
                { icon: '🧺', title: 'Your pantry', desc: 'Tell us what you have, we handle the rest' },
                { icon: '✨', title: 'AI that gets you', desc: 'Recipes for your skill level and schedule' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex items-center gap-4 bg-white dark:bg-charcoal-800 rounded-2xl p-4 shadow-sm">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="font-display font-700 text-stone-800 dark:text-stone-100 text-sm">{title}</p>
                    <p className="font-body text-stone-400 dark:text-stone-500 text-xs">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setStep(2)} className="w-full btn-primary text-base py-4">
              Let's set up your kitchen →
            </button>
          </div>
        )}

        {/* ── Step 2: Preferences ── */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="font-display text-2xl font-800 text-stone-800 dark:text-stone-100 mb-1">Your food identity</h2>
            <p className="text-stone-400 dark:text-stone-500 font-body text-sm mb-6">This helps us suggest the right recipes for you.</p>

            {/* Dietary */}
            <p className="font-display font-700 text-stone-700 dark:text-stone-300 text-sm mb-2">I eat…</p>
            <div className="grid grid-cols-1 gap-2 mb-6">
              {([
                { value: 'vegetarian',           label: 'Vegetarian', desc: 'No meat, fish or eggs · dairy OK', icon: '🥛' },
                { value: 'vegetarian_with_eggs',  label: 'Eggitarian', desc: 'No meat or fish · eggs & dairy OK', icon: '🥚' },
                { value: 'vegan',                 label: 'Vegan', desc: 'No animal products at all', icon: '🌱' },
              ] as { value: DietaryPreference; label: string; desc: string; icon: string }[]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDietary(opt.value)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
                    dietary === opt.value
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-cream-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800'
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <div>
                    <p className="font-display font-700 text-stone-800 dark:text-stone-100 text-sm">{opt.label}</p>
                    <p className="font-body text-stone-400 dark:text-stone-500 text-xs">{opt.desc}</p>
                  </div>
                  {dietary === opt.value && <span className="ml-auto text-brand-500 text-lg">✓</span>}
                </button>
              ))}
            </div>

            {/* Skill */}
            <p className="font-display font-700 text-stone-700 dark:text-stone-300 text-sm mb-2">My cooking skill…</p>
            <div className="flex gap-2 mb-6">
              {([
                { value: 'beginner',     label: 'Beginner',     icon: '🌱' },
                { value: 'intermediate', label: 'Intermediate', icon: '🍳' },
                { value: 'advanced',     label: 'Advanced',     icon: '👨‍🍳' },
              ] as { value: SkillLevel; label: string; icon: string }[]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSkill(opt.value)}
                  className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl border-2 text-center transition-all duration-150 ${
                    skill === opt.value
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-cream-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800'
                  }`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span className="font-display font-600 text-xs text-stone-700 dark:text-stone-300">{opt.label}</span>
                </button>
              ))}
            </div>

            {/* Cuisines */}
            <p className="font-display font-700 text-stone-700 dark:text-stone-300 text-sm mb-2">
              Cuisines I love <span className="text-stone-400 font-400">(pick 2–3)</span>
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {CUISINES.map(c => (
                <button
                  key={c.id}
                  onClick={() => toggleCuisine(c.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full border-2 text-sm font-display font-600 transition-all duration-150 ${
                    cuisines.includes(c.id)
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-cream-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <span>{c.flag}</span> {c.id}
                </button>
              ))}
            </div>

            {/* Allergies */}
            <p className="font-display font-700 text-stone-700 dark:text-stone-300 text-sm mb-1">
              Food allergies <span className="text-stone-400 font-400">(optional — skip if none)</span>
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {ALLERGENS.map(a => (
                <button
                  key={a.id}
                  onClick={() => toggleAllergen(a.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full border-2 text-sm font-display font-600 transition-all duration-150 ${
                    allergies.includes(a.id)
                      ? 'border-red-400 bg-red-400 text-white'
                      : 'border-cream-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <span>{a.emoji}</span> {a.label}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary px-4 py-3">← Back</button>
              <button onClick={() => setStep(3)} className="flex-1 btn-primary py-3">Next →</button>
            </div>
          </div>
        )}

        {/* ── Step 3: Pantry checklist ── */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="font-display text-2xl font-800 text-stone-800 dark:text-stone-100 mb-1">Stock your pantry</h2>
            <p className="text-stone-400 dark:text-stone-500 font-body text-sm mb-6">
              Tap everything you currently have at home. You can always add more later.
            </p>

            <div className="space-y-4 mb-8 max-h-[55vh] overflow-y-auto pr-1">
              {STARTER_PANTRY.map(section => (
                <div key={section.label}>
                  <p className="font-display font-700 text-stone-600 dark:text-stone-400 text-xs uppercase tracking-wide mb-2">
                    {section.emoji} {section.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {section.items.map(item => {
                      const checked = checkedItems.has(item.name)
                      return (
                        <button
                          key={item.name}
                          onClick={() => toggleItem(item.name)}
                          className={`px-3 py-2 rounded-full border-2 text-sm font-body transition-all duration-150 ${
                            checked
                              ? 'border-sage-400 bg-sage-400 text-white'
                              : 'border-cream-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-stone-600 dark:text-stone-300'
                          }`}
                        >
                          {checked ? '✓ ' : ''}{item.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-stone-400 mb-4">
              {checkedItems.size} item{checkedItems.size !== 1 ? 's' : ''} selected
            </p>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-secondary px-4 py-3">← Back</button>
              <button onClick={() => setStep(4)} className="flex-1 btn-primary py-3">Next →</button>
            </div>

            <button
              onClick={() => setStep(4)}
              className="w-full mt-2 text-xs text-stone-400 dark:text-stone-500 underline py-2"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* ── Step 4: All done ── */}
        {step === 4 && (
          <div className="text-center animate-fade-in">
            <div className="text-7xl mb-6 animate-simmer">🍳</div>
            <h2 className="font-display text-3xl font-800 text-stone-800 dark:text-stone-100 mb-3">
              Your kitchen is ready!
            </h2>
            <p className="text-stone-500 dark:text-stone-400 font-body mb-2 text-base">
              We've set up your profile with your preferences.
            </p>
            <p className="text-stone-400 dark:text-stone-500 font-body mb-10 text-sm">
              {checkedItems.size > 0
                ? `Added ${checkedItems.size} pantry items to get you started.`
                : 'You can add pantry items anytime from the Pantry tab.'}
            </p>

            {saveError && (
              <p className="text-sm text-red-500 text-center font-body mb-2">{saveError}</p>
            )}
            <button
              onClick={handleFinish}
              disabled={saving}
              className="w-full btn-primary text-base py-4 disabled:opacity-70"
            >
              {saving ? 'Setting up…' : "Let's cook! 🍳"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
