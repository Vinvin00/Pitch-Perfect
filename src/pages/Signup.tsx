import { Link, useNavigate } from 'react-router-dom'
import { useCallback, useState } from 'react'
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { GoogleIcon } from '../components/GoogleIcon'
import { NavLogoLink } from '../components/NavLogoLink'
import { PageMotion } from '../components/PageMotion'
import { SIGNUP_EMAIL_STORAGE_KEY } from '../lib/signupContext'
import { setSignedIn, setUserName } from '../lib/authSession'

export function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreateAccount = useCallback(async () => {
    setError('')
    const trimmedEmail = email.trim()
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
    if (!emailOk) {
      document.getElementById('su-email')?.focus()
      setError('Please enter a valid email address.')
      return
    }
    if (password.length < 8) {
      document.getElementById('su-password')?.focus()
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password)
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() })
      }
      try {
        sessionStorage.setItem(SIGNUP_EMAIL_STORAGE_KEY, trimmedEmail)
      } catch {
        /* private mode */
      }
      setSignedIn()
      if (name.trim()) setUserName(name.trim())
      navigate('/onboarding/1', {
        state: {
          signupEmail: trimmedEmail,
          signupName: name.trim(),
        },
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Account creation failed.'
      setError(msg.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim() || 'Account creation failed.')
    } finally {
      setLoading(false)
    }
  }, [email, name, password, navigate])

  const handleGoogleSignUp = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const cred = await signInWithPopup(auth, provider)
      setSignedIn()
      if (cred.user.displayName) setUserName(cred.user.displayName)

      const profileSnap = await getDoc(doc(db, 'users', cred.user.uid))
      if (profileSnap.exists()) {
        navigate('/app/home', { replace: true })
      } else {
        navigate('/onboarding/1', {
          state: {
            signupEmail: cred.user.email ?? '',
            signupName: cred.user.displayName ?? '',
          },
        })
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Google sign-up failed.'
      setError(msg.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim() || 'Google sign-up failed.')
    } finally {
      setLoading(false)
    }
  }, [navigate])

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
              Start free today
            </p>
            <h2 className="auth-hl">
              Honest feedback.
              <br />
              <strong>Zero judgment.</strong>
            </h2>
          </div>
          <div className="auth-quote">
            <p className="auth-qt">
              &quot;Presentation coaches charge £200/hour. Friends are too kind. Pitch Perfect gives you the truth your friends won&apos;t.&quot;
            </p>
            <p className="auth-qa">IE Business School · MBA 2026</p>
          </div>
        </div>
        <div className="auth-r">
          <h2 className="auth-title">Create your account</h2>
          <p className="auth-sub">
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-gold)', fontWeight: 700, borderBottom: '1px solid var(--accent-gold)' }}>
              Sign in
            </Link>
          </p>
          {error && (
            <p style={{ color: 'var(--red, #e24a4a)', fontSize: 12, marginBottom: 12 }}>
              {error}
            </p>
          )}
          <button type="button" className="btn-google" onClick={() => void handleGoogleSignUp()} disabled={loading}>
            <GoogleIcon />
            Sign up with Google
          </button>
          <div className="auth-divider">
            <span>or</span>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="su-name">
              Full name
            </label>
            <input
              id="su-name"
              type="text"
              placeholder="Sofia García"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="su-email">
              Email
            </label>
            <input
              id="su-email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="su-password">
              Password
            </label>
            <input
              id="su-password"
              type="password"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="button" className="btn-primary" style={{ width: '100%' }} onClick={() => void handleCreateAccount()} disabled={loading}>
            {loading ? 'Creating account…' : 'Create account →'}
          </button>
        </div>
      </div>
    </PageMotion>
  )
}
