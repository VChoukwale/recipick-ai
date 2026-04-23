import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, profileError } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EDE7DC] dark:bg-charcoal-950">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl animate-simmer">🥘</span>
          <p className="font-display text-brand-500 font-600 text-sm">Getting your kitchen ready…</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />

  // Profile fetch failed — do not redirect to onboarding; let user retry.
  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EDE7DC] dark:bg-charcoal-950">
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <p className="font-body text-sm text-stone-500 dark:text-stone-400">
            Couldn't load your profile. Check your connection and try again.
          </p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-1">
            Refresh
          </button>
        </div>
      </div>
    )
  }

  // No profile yet or onboarding incomplete — send to onboarding.
  if (!profile || !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
