import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100 dark:bg-charcoal-900">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl animate-simmer">🥘</span>
          <p className="font-display text-brand-500 font-600 text-sm">Getting your kitchen ready…</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />

  // New user — send to onboarding
  if (profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
