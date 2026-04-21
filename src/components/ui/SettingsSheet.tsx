import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { DietaryPreference, SkillLevel } from '../../types/database'

const DIETARY_OPTIONS: { value: DietaryPreference; emoji: string; label: string; desc: string }[] = [
  { value: 'vegetarian',           emoji: '🥛', label: 'Vegetarian',       desc: 'No meat or fish · dairy & eggs OK' },
  { value: 'vegetarian_with_eggs', emoji: '🥚', label: 'Eggitarian',       desc: 'Vegetarian + eggs' },
  { value: 'vegan',                emoji: '🌱', label: 'Vegan',            desc: 'No animal products at all' },
  { value: 'non_vegetarian',       emoji: '🍗', label: 'Non-vegetarian',   desc: 'All foods including meat & fish' },
]

const SKILL_OPTIONS: { value: SkillLevel; emoji: string; label: string; desc: string }[] = [
  { value: 'beginner',     emoji: '🌱', label: 'Beginner',     desc: 'Simple recipes' },
  { value: 'intermediate', emoji: '🍳', label: 'Intermediate', desc: 'Most techniques' },
  { value: 'advanced',     emoji: '👨‍🍳', label: 'Advanced',    desc: 'Full complexity' },
]

const ALL_CUISINES = [
  'Indian', 'Italian', 'Mexican', 'Chinese', 'Japanese', 'Thai', 'Korean',
  'Mediterranean', 'Middle Eastern', 'American', 'Greek', 'French',
  'Vietnamese', 'Ethiopian', 'Spanish', 'Turkish', 'Moroccan', 'Lebanese', 'Peruvian',
]

function SectionHeader({ emoji, label, color }: { emoji: string; label: string; color: 'orange' | 'green' }) {
  return (
    <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${color === 'orange' ? 'border-orange-100 dark:border-orange-900/30' : 'border-emerald-100 dark:border-emerald-900/30'}`}>
      <span className={`text-sm w-6 h-6 rounded-lg flex items-center justify-center ${color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>{emoji}</span>
      <span className={`font-display font-700 text-sm ${color === 'orange' ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{label}</span>
    </div>
  )
}

interface Props {
  onClose: () => void
}

export default function SettingsSheet({ onClose }: Props) {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [dietary, setDietary] = useState<DietaryPreference>(profile?.dietary_preference ?? 'vegetarian')
  const [skill, setSkill] = useState<SkillLevel>(profile?.skill_level ?? 'intermediate')
  const [cuisines, setCuisines] = useState<string[]>(profile?.preferred_cuisines ?? [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '')
      setDietary(profile.dietary_preference)
      setSkill(profile.skill_level)
      setCuisines(profile.preferred_cuisines ?? [])
    }
  }, [profile])

  function toggleCuisine(c: string) {
    setCuisines(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    await supabase.from('profiles').update({
      display_name: displayName.trim() || null,
      dietary_preference: dietary,
      skill_level: skill,
      preferred_cuisines: cuisines,
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

  const initials = (profile?.display_name ?? user?.email ?? '?').slice(0, 2).toUpperCase()

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl animate-slide-up" style={{ background: 'var(--s0)' }}>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-0 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--bdr-m)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--bdr-s)' }}>
          <h2 className="font-display font-800 text-xl" style={{ color: 'var(--t1)' }}>Your Preferences</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors hover:opacity-70"
            style={{ background: 'var(--s2)', color: 'var(--t3)' }}>✕</button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Account card */}
          <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'var(--s2)', border: '1px solid var(--bdr-m)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-display font-800 text-base flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #E8713A, #D85F22)' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-700 text-base leading-tight truncate" style={{ color: 'var(--t1)' }}>
                {profile?.display_name || user?.email?.split('@')[0] || 'Chef'}
              </p>
              <p className="text-xs font-body truncate mt-0.5" style={{ color: 'var(--t3)' }}>{user?.email}</p>
            </div>
          </div>

          {/* Profile section */}
          <div className="rounded-2xl p-4" style={{ background: 'var(--s2)', border: '1px solid var(--bdr-s)' }}>
            <SectionHeader emoji="✏️" label="Profile" color="orange" />
            <label className="block text-xs font-display font-600 mb-1.5" style={{ color: 'var(--t3)' }}>Display name</label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="input-field"
            />
          </div>

          {/* Food preferences section */}
          <div className="rounded-2xl p-4" style={{ background: 'var(--s2)', border: '1px solid var(--bdr-s)' }}>
            <SectionHeader emoji="🥗" label="Food Preferences" color="green" />

            {/* Dietary */}
            <p className="text-xs font-display font-600 mb-2" style={{ color: 'var(--t3)' }}>Dietary preference</p>
            <div className="space-y-2 mb-4">
              {DIETARY_OPTIONS.map(opt => {
                const active = dietary === opt.value
                return (
                  <button key={opt.value} onClick={() => setDietary(opt.value)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all"
                    style={active
                      ? { background: '#16a34a10', borderColor: '#16a34a40', color: 'var(--t1)' }
                      : { background: 'var(--s1)', borderColor: 'var(--bdr-m)', color: 'var(--t1)' }
                    }>
                    <span className={`text-xl w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-transparent'}`}>
                      {opt.emoji}
                    </span>
                    <div className="flex-1">
                      <p className="font-display font-700 text-sm" style={{ color: active ? '#16a34a' : 'var(--t1)' }}>{opt.label}</p>
                      <p className="text-xs font-body" style={{ color: 'var(--t3)' }}>{opt.desc}</p>
                    </div>
                    {active && (
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-700">✓</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Skill level */}
            <p className="text-xs font-display font-600 mb-2" style={{ color: 'var(--t3)' }}>Cooking skill</p>
            <div className="grid grid-cols-3 gap-2">
              {SKILL_OPTIONS.map(opt => {
                const active = skill === opt.value
                return (
                  <button key={opt.value} onClick={() => setSkill(opt.value)}
                    className="py-3 px-2 rounded-xl border text-center transition-all"
                    style={active
                      ? { background: 'linear-gradient(135deg, #E8713A, #D85F22)', borderColor: '#E8713A', color: '#fff', boxShadow: '0 2px 10px rgba(232,113,58,0.3)' }
                      : { background: 'var(--s1)', borderColor: 'var(--bdr-m)', color: 'var(--t2)' }
                    }>
                    <div className="text-xl mb-1">{opt.emoji}</div>
                    <div className="text-xs font-display font-700 leading-tight">{opt.label}</div>
                    <div className="text-[10px] font-body mt-0.5 opacity-70">{opt.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Cuisine preferences section */}
          <div className="rounded-2xl p-4" style={{ background: 'var(--s2)', border: '1px solid var(--bdr-s)' }}>
            <SectionHeader emoji="🌍" label="Cuisine Preferences" color="green" />
            <p className="text-xs font-body mb-3" style={{ color: 'var(--t3)' }}>
              Select your favourites — only these show on your Home screen. Leave empty to see all cuisines.
            </p>
            <div className="flex flex-wrap gap-2">
              {ALL_CUISINES.map(c => {
                const active = cuisines.includes(c)
                return (
                  <button key={c} onClick={() => toggleCuisine(c)}
                    className="px-3 py-1.5 rounded-full text-xs font-display font-600 border transition-all"
                    style={active
                      ? { background: '#16a34a', borderColor: '#16a34a', color: '#fff', boxShadow: '0 2px 8px rgba(22,163,74,0.25)' }
                      : { background: 'var(--s1)', borderColor: 'var(--bdr-m)', color: 'var(--t2)' }
                    }>
                    {c}
                  </button>
                )
              })}
            </div>
            {cuisines.length > 0 && (
              <div className="flex items-center justify-between mt-3 pt-2.5" style={{ borderTop: '1px solid var(--bdr-s)' }}>
                <span className="text-xs font-body text-emerald-600 dark:text-emerald-400 font-600">
                  {cuisines.length} selected
                </span>
                <button onClick={() => setCuisines([])}
                  className="text-xs font-display font-600 text-stone-400 dark:text-stone-500 hover:text-red-400 transition-colors">
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Save */}
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3.5 rounded-2xl font-display font-700 text-sm transition-all"
            style={saved
              ? { background: '#16a34a18', color: '#16a34a', border: '1px solid #16a34a30' }
              : { background: 'linear-gradient(135deg, #E8713A, #D85F22)', color: '#fff', boxShadow: '0 3px 12px rgba(232,113,58,0.35)' }
            }>
            {saving ? 'Saving…' : saved ? '✓ Preferences saved!' : 'Save preferences'}
          </button>

          {/* Sign out */}
          <button onClick={handleSignOut}
            className="w-full py-3 rounded-2xl font-display font-600 text-sm border transition-colors mb-2"
            style={{ borderColor: 'var(--bdr-m)', color: 'var(--t3)' }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color = '#ef4444'; (e.target as HTMLElement).style.borderColor = '#fecaca' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color = 'var(--t3)'; (e.target as HTMLElement).style.borderColor = 'var(--bdr-m)' }}>
            Sign out
          </button>

        </div>
      </div>
    </div>
  )
}
