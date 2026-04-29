import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AppShell from './components/layout/AppShell'
import AuthPage from './pages/AuthPage'
import OnboardingPage from './pages/OnboardingPage'
import HomePage from './pages/HomePage'
import PantryPage from './pages/PantryPage'
import ShopPage from './pages/ShopPage'
import RecipesPage from './pages/RecipesPage'
import InboxPage from './pages/InboxPage'
import PWAUpdateToast from './components/ui/PWAUpdateToast'
import { Analytics } from '@vercel/analytics/react'

// Guards /onboarding — must be signed in; redirects away if already onboarded
function OnboardingRoute() {
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
  if (profile?.onboarding_completed) return <Navigate to="/" replace />

  return <OnboardingPage />
}

export default function App() {
  return (
    <AuthProvider>
      <PWAUpdateToast />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Onboarding */}
          <Route path="/onboarding" element={<OnboardingRoute />} />

          {/* Protected — requires sign-in + onboarding completed */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="pantry"  element={<PantryPage />} />
            <Route path="shop"    element={<ShopPage />} />
            <Route path="recipes" element={<RecipesPage />} />
            <Route path="inbox"   element={<InboxPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Analytics />
    </AuthProvider>
  )
}
