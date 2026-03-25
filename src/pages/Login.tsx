import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { NavLogoLink } from '../components/NavLogoLink'
import { PageMotion } from '../components/PageMotion'
import { GoogleIcon } from '../components/GoogleIcon'
import { setSignedIn, setUserName } from '../lib/authSession'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const finishLogin = useCallback(
    async (uid: string, displayName?: string | null) => {
      setSignedIn()
      if (displayName) setUserName(displayName)

      const profileSnap = await getDoc(doc(db, 'users', uid))
      if (profileSnap.exists()) {
        const data = profileSnap.data()
        if (data?.displayName) setUserName(data.displayName)
        navigate('/app/home', { replace: true })
      } else {
        navigate('/onboarding/1', { replace: true })
      }
    },
    [navigate],
  )

  const handleEmailSignIn = useCallback(async () => {
    setError('')
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, trimmedEmail, password)
      await finishLogin(cred.user.uid, cred.user.displayName)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sign-in failed.'
      setError(msg.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim() || 'Sign-in failed.')
    } finally {
      setLoading(false)
    }
  }, [email, password, finishLogin])

  const handleGoogleSignIn = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const cred = await signInWithPopup(auth, provider)
      await finishLogin(cred.user.uid, cred.user.displayName)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Google sign-in failed.'
      setError(msg.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim() || 'Google sign-in failed.')
    } finally {
      setLoading(false)
    }
  }, [finishLogin])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') void handleEmailSignIn()
    },
    [handleEmailSignIn],
  )

  return (
    <PageMotion>
      <nav className="app-nav">
        <NavLogoLink to="/" />
        <div className="nav-right">
          <Link to="/" className="nav-right-item">
            ← Back
          </Link>
        </div>
      </nav>
      <div className="auth-wrap" style={{ flex: 1 }}>
        <div className="auth-l">
          <div>
            <p className="eyebrow" style={{ marginBottom: 20 }}>
              Welcome back
            </p>
            <h2 className="auth-hl">
              The feedback you need.
              <br />
              <strong>When you need it.</strong>
            </h2>
          </div>
          <div className="auth-quote">
            <p className="auth-qt">
              &quot;I used to practice presentations alone in my room with no idea what I actually looked like. Pitch Perfect changed that completely.&quot;
            </p>
            <p className="auth-qa">IE University · MBA Student</p>
          </div>
        </div>
        <div className="auth-r">
          <h2 className="auth-title">Sign in</h2>
          <p className="auth-sub">
            Don&apos;t have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--accent-gold)', fontWeight: 700, borderBottom: '1px solid var(--accent-gold)' }}>
              Create one free
            </Link>
          </p>
          {error && (
            <p style={{ color: 'var(--red, #e24a4a)', fontSize: 12, marginBottom: 12 }}>
              {error}
            </p>
          )}
          <button type="button" className="btn-google" onClick={handleGoogleSignIn} disabled={loading}>
            <GoogleIcon />
            Continue with Google
          </button>
          <div className="auth-divider">
            <span>or</span>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={onKeyDown}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={onKeyDown}
            />
          </div>
          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%', textAlign: 'center' }}
            onClick={() => void handleEmailSignIn()}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'right', marginTop: 12 }}>
            <a href="#forgot" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Forgot password?
            </a>
          </p>
        </div>
      </div>
    </PageMotion>
  )
}
