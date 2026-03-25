import { useState, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from './lib/firebase'
import { useAuth } from './lib/useAuth'
import { RootLayout } from './layouts/RootLayout'
import { Debrief } from './pages/Debrief'
import { HomePost } from './pages/HomePost'
import { HomePre } from './pages/HomePre'
import { HowItWorks } from './pages/HowItWorks'
import { LiveSession } from './pages/LiveSession'
import { Login } from './pages/Login'
import { Onboarding } from './pages/Onboarding'
import { Profile } from './pages/Profile'
import { ProjectDetail } from './pages/ProjectDetail'
import { Projects } from './pages/Projects'
import { CoachChat } from './pages/CoachChat'
import { SessionSetup } from './pages/SessionSetup'
import { Signup } from './pages/Signup'

const loadingScreen = (
  <div
    style={{
      color: '#fff',
      background: '#0a0a0f',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    Loading…
  </div>
)

/**
 * Firebase auth guard ported from Project B.
 * Requires signed-in user AND a Firestore `users/{uid}` profile document.
 * If no user → redirect to login. If no profile → redirect to onboarding.
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const [checkingProfile, setCheckingProfile] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) {
      setCheckingProfile(false)
      return
    }

    setCheckingProfile(true)
    let cancelled = false
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      if (cancelled) return
      setHasProfile(snap.exists())
      setCheckingProfile(false)
    })
    return () => {
      cancelled = true
    }
  }, [user, loading])

  if (loading || checkingProfile) return loadingScreen
  if (!user) return <Navigate to="/login" />
  if (!hasProfile) return <Navigate to="/onboarding/1" />
  return <>{children}</>
}

/**
 * Onboarding guard: requires signed-in user WITHOUT a profile yet.
 * If profile already exists → redirect to app home.
 */
function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const [checkingProfile, setCheckingProfile] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) {
      setCheckingProfile(false)
      return
    }

    setCheckingProfile(true)
    let cancelled = false
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      if (cancelled) return
      setHasProfile(snap.exists())
      setCheckingProfile(false)
    })
    return () => {
      cancelled = true
    }
  }, [user, loading])

  if (loading || checkingProfile) return loadingScreen
  if (!user) return <Navigate to="/login" />
  if (hasProfile) return <Navigate to="/app/home" />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        {/* Public routes */}
        <Route path="/" element={<HomePre />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Onboarding (auth required, no profile yet) */}
        <Route
          path="/onboarding/:step"
          element={
            <OnboardingRoute>
              <Onboarding />
            </OnboardingRoute>
          }
        />

        {/* Authenticated app routes */}
        <Route path="/app" element={<Navigate to="/app/home" replace />} />
        <Route
          path="/app/home"
          element={
            <ProtectedRoute>
              <HomePost />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/projects"
          element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/projects/detail"
          element={
            <ProtectedRoute>
              <ProjectDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/session/setup"
          element={
            <ProtectedRoute>
              <SessionSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/session/live"
          element={
            <ProtectedRoute>
              <LiveSession />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/debrief"
          element={
            <ProtectedRoute>
              <Debrief />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/coach"
          element={
            <ProtectedRoute>
              <CoachChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
