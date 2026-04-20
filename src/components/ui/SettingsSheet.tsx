import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { DietaryPreference, SkillLevel } from '../../types/database'

const DIETARY_OPTIONS: { value: DietaryPreference; label: string; desc: string }[] = [
  { value: 'vegetarian',            label: '🥛 Vegetarian',        desc: 'No meat or fish, dairy & eggs OK' },
  { value: 'vegetarian_with_eggs',  label: '🥚 Eggitarian',        desc: 'Vegetarian + eggs' },
  { value: 'vegan',                 label: '🌱 Vegan',             desc: 'No animal products at all' },
  { value: 'non_vegetarian',        label: '🍗 Non-vegetarian',    desc: 'All foods including meat & fish' },
]

const SKILL_OPTIONS: { value: SkillLevel; label: string; desc: string }[] = [
  { value: 'beginner',      label: '🌱 Beginner',      desc: 'Simple recipes, short steps' },
  { value: 'intermediate',  label: '🍳 Intermediate',  desc: 'Comfortable with most techniques' },
  { value: 'advanced',      label: '👨‍🍳 Advanced',      desc: 'Bring on the complexity' },
]

interface Props {
  onClose: () => void
}

export default function SettingsSheet({ onClose }: Props) {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [dietary, setDietary] = useState<DietaryPreference>(profile?.dietary_preference ?? 'vegetarian')
  const [skill, setSkill] = useState<SkillLevel>(profile?.skill_level ?? 'intermediate')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '')
      setDietary(profile.dietary_preference)
      setSkill(profile.skill_level)
    }
  }, [profile])

  async function handleSave() {
    if (!user) return
    setSaving(true)
    await supabase.from('profiles').update({
      display_name: displayName.trim() || null,
      dietary_preference: dietary,
      skill_level: skill,
    }).eq('id', user.id)
    await refreshProfile()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleSignOut() {
    await signOut()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-charcoal-800 rounded-t-3xl max-h-[88vh] flex flex-col shadow-2xl animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-stone-200 dark:bg-charcoal-600 rounded-full" />
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-4">
          {/* Header */}
          <div className="flex items-center justify-between pt-2 mb-5">
            <h2 className="font-display font-800 text-xl text-stone-800 dark:text-stone-100">Settings</h2>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xl">✕</button>
          </div>

          {/* Account info */}
          <div className="flex items-center gap-3 mb-5 p-3 rounded-2xl bg-cream-50 dark:bg-charcoal-700 border border-cream-200 dark:border-charcoal-600">
            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-lg">
              {profile?.display_name?.[0]?.toUpperCase() ?? '👤'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-700 text-sm text-stone-800 dark:text-stone-100 truncate">
                {profile?.display_name || user?.email?.split('@')[0] || 'Chef'}
              </p>
              <p className="text-xs font-body text-stone-400 dark:text-stone-500 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Display name */}
          <div className="mb-5">
            <label className="block text-xs font-display font-700 text-stone-500 dark:text-stone-400 mb-2">Display name</label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="input-field"
            />
          </div>

          {/* Dietary preference */}
          <div className="mb-5">
            <label className="block text-xs font-display font-700 text-stone-500 dark:text-stone-400 mb-2">Dietary preference</label>
            <div className="space-y-2">
              {DIETARY_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setDietary(opt.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all ${
                    dietary === opt.value
                      ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-300 dark:border-brand-700'
                      : 'bg-white dark:bg-charcoal-700 border-cream-200 dark:border-charcoal-600 hover:border-brand-200'
                  }`}>
                  <span className="flex-shrink-0 text-lg">{opt.label.split(' ')[0]}</span>
                  <div>
                    <p className="font-display font-700 text-sm text-stone-700 dark:text-stone-200">{opt.label.split(' ').slice(1).join(' ')}</p>
                    <p className="text-xs font-body text-stone-400 dark:text-stone-500">{opt.desc}</p>
                  </div>
                  {dietary === opt.value && <span className="ml-auto text-brand-500 text-sm">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Skill level */}
          <div className="mb-6">
            <label className="block text-xs font-display font-700 text-stone-500 dark:text-stone-400 mb-2">Cooking skill</label>
            <div className="flex gap-2">
              {SKILL_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setSkill(opt.value)}
                  className={`flex-1 py-2.5 px-2 rounded-2xl border text-center transition-all ${
                    skill === opt.value
                      ? 'bg-brand-500 border-brand-500 text-white'
                      : 'bg-white dark:bg-charcoal-700 border-cream-200 dark:border-charcoal-600 text-stone-600 dark:text-stone-400'
                  }`}>
                  <div className="text-lg mb-0.5">{opt.label.split(' ')[0]}</div>
                  <div className="text-[10px] font-display font-700 leading-tight">{opt.label.split(' ').slice(1).join(' ')}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <button onClick={handleSave} disabled={saving}
            className={`w-full py-3 rounded-2xl font-display font-700 text-sm transition-all mb-3 ${
              saved
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                : 'btn-primary'
            }`}>
            {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save changes'}
          </button>

          {/* Sign out */}
          <button onClick={handleSignOut}
            className="w-full py-3 rounded-2xl font-display font-700 text-sm border border-red-100 dark:border-red-900/30 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
