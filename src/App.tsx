import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AppShell from './components/layout/AppShell'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import PantryPage from './pages/PantryPage'
import ShopPage from './pages/ShopPage'
import RecipesPage from './pages/RecipesPage'
import InboxPage from './pages/InboxPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected — requires sign-in */}
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
    </AuthProvider>
  )
}
