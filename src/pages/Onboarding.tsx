import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { setSignedIn, setUserName, setUserPhoto } from '../lib/authSession'
import { useCallback, useEffect, useRef, useState } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { NavLogoLink } from '../components/NavLogoLink'
import { PageMotion } from '../components/PageMotion'
import { ScrollReveal } from '../components/ScrollReveal'
import Stepper, { Step } from '../components/stepper/Stepper'
import { SIGNUP_EMAIL_STORAGE_KEY, type SignupNavigationState } from '../lib/signupContext'

const HOW_IT_WORKS_CARDS = [
  {
    n: '01',
    h: 'Create a project',
    p: 'Group your practice sessions by presentation. Track improvement across multiple runs.',
  },
  {
    n: '02',
    h: 'Practice live',
    p: 'Your webcam tracks eye contact, posture, gestures, and pace with subtle real-time nudges.',
  },
  {
    n: '03',
    h: 'Get AI feedback',
    p: 'Claude delivers a specific, honest debrief with timestamped observations and ranked fixes.',
  },
] as const

function OnboardingNav({ step }: { step: number }) {
  return (
    <nav className="app-nav app-nav--onboarding-light">
      <NavLogoLink to="/" />
      <div className="nav-onboard-center">
        <p>Step {step} of 3</p>
      </div>
      <div />
    </nav>
  )
}

function toggleInSet(set: Set<string>, key: string) {
  const next = new Set(set)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  return next
}

export function Onboarding() {
  const { step: stepParam } = useParams()
  const raw = Number(stepParam)
  const step = Number.isFinite(raw) ? Math.min(3, Math.max(1, raw)) : 1
  const navigate = useNavigate()
  const location = useLocation()

  const [accountEmail, setAccountEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const seededNameFromSignup = useRef(false)

  useEffect(() => {
    const st = location.state as SignupNavigationState | null
    let email = st?.signupEmail?.trim() ?? ''
    if (email) {
      try {
        sessionStorage.setItem(SIGNUP_EMAIL_STORAGE_KEY, email)
      } catch {
        /* ignore */
      }
    } else {
      try {
        email = sessionStorage.getItem(SIGNUP_EMAIL_STORAGE_KEY) ?? ''
      } catch {
        /* ignore */
      }
    }
    setAccountEmail(email)

    const rawName = st?.signupName?.trim()
    if (rawName && !seededNameFromSignup.current) {
      seededNameFromSignup.current = true
      const parts = rawName.split(/\s+/).filter(Boolean)
      setFirstName(parts[0] ?? '')
      setLastName(parts.slice(1).join(' ') ?? '')
    }
  }, [location.state])

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  const openPhotoPicker = useCallback(() => {
    photoInputRef.current?.click()
  }, [])

  const onPhotoSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      window.alert('Please choose a JPG, PNG, or WebP image.')
      return
    }
    const max = 5 * 1024 * 1024
    if (file.size > max) {
      window.alert('Please choose an image under 5MB.')
      return
    }
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
    e.target.value = ''
  }, [])

  const [roles, setRoles] = useState<Set<string>>(() => new Set(['University student']))
  const [topics, setTopics] = useState<Set<string>>(
    () => new Set(['Academic presentations', 'Investor pitches']),
  )

  const toggleRole = useCallback((key: string) => {
    setRoles((s) => toggleInSet(s, key))
  }, [])
  const toggleTopic = useCallback((key: string) => {
    setTopics((s) => toggleInSet(s, key))
  }, [])

  const roleOptions = [
    'University student',
    'MBA / Postgrad',
    'Early career',
    'Manager / Lead',
    'Founder / Entrepreneur',
    'Sales',
    'Academic / Researcher',
    'Other',
  ]
  const topicOptions = [
    'Academic presentations',
    'Job interviews',
    'Investor pitches',
    'Client presentations',
    'Team updates',
    'Conference talks',
    'Speeches / Events',
  ]

  return (
    <PageMotion className="page page--onboarding-light">
      <OnboardingNav step={step} />
      <div className="ob-wrap ob-wrap--stepper" style={{ flex: 1 }}>
        <Stepper
          key={step}
          initialStep={step}
          onStepChange={(s) => navigate(`/onboarding/${s}`)}
          onFinalStepCompleted={() => {
            const fullName = [firstName, lastName].filter(Boolean).join(' ')
            if (fullName) setUserName(fullName)
            setSignedIn()

            const user = auth.currentUser
            if (user) {
              const profileData = {
                displayName: fullName || user.displayName || '',
                email: accountEmail || user.email || '',
                roles: [...roles],
                topics: [...topics],
                createdAt: serverTimestamp(),
              }
              void setDoc(doc(db, 'users', user.uid), profileData)

              if (photoPreview) {
                setUserPhoto(photoPreview)
              }
            }

            navigate('/app/home', { replace: true })
          }}
          completeButtonText="Get started →"
          stepCircleContainerClassName="ob-stepper-card"
          contentClassName="ob-stepper-content"
          nextButtonText="Continue →"
          backButtonText="Back"
          stepLabels={['Profile', 'Context', 'Start']}
        >
          <Step>
            <div className="ob-main ob-stepper-panel">
              <ScrollReveal>
                <div>
                  <p className="eyebrow" style={{ marginBottom: 16 }}>
                    Step 1 — Profile
                  </p>
                  <h2>
                    Let&apos;s get you <strong>set up.</strong>
                  </h2>
                  <p className="ob-sub">A photo helps personalise your experience. All other fields can be changed at any time.</p>
                </div>
              </ScrollReveal>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32, position: 'relative' }}>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="ob-photo-input-visually-hidden"
                  tabIndex={-1}
                  aria-hidden
                  onChange={onPhotoSelected}
                />
                <button
                  type="button"
                  className={`ob-photo-upload${photoPreview ? ' ob-photo-upload--has-photo' : ''}`}
                  onClick={openPhotoPicker}
                  aria-label={photoPreview ? 'Change profile photo' : 'Add profile photo'}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="" className="ob-photo-preview" />
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span>Add photo</span>
                    </>
                  )}
                </button>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, color: 'rgba(0,0,0,0.7)' }}>Profile photo</p>
                  <p style={{ fontSize: 11, fontWeight: 300, color: 'rgba(0,0,0,0.4)', lineHeight: 1.5 }}>
                    JPG, PNG, or WebP, max 5MB. Used on your profile and reports. Click the circle to upload.
                  </p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="field">
                  <label className="field-label" htmlFor="ob-fn">
                    First name
                  </label>
                  <input id="ob-fn" type="text" placeholder="Sofia" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="ob-ln">
                    Last name
                  </label>
                  <input id="ob-ln" type="text" placeholder="García" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
                </div>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="ob-em">
                  Email
                </label>
                <input
                  id="ob-em"
                  type="email"
                  placeholder="you@example.com"
                  value={accountEmail}
                  readOnly={!!accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                  autoComplete="email"
                  style={{
                    background: accountEmail ? 'rgba(0,0,0,0.03)' : undefined,
                    color: accountEmail ? 'rgba(0,0,0,0.45)' : undefined,
                  }}
                />
                {!accountEmail ? (
                  <p style={{ fontSize: 10, color: 'rgba(0,0,0,0.4)', marginTop: 6 }}>
                    No signup email found — enter the address you used to register, or go back to{' '}
                    <Link to="/signup" style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>
                      sign up
                    </Link>
                    .
                  </p>
                ) : null}
              </div>
            </div>
          </Step>

          <Step>
            <div className="ob-main ob-stepper-panel">
              <ScrollReveal>
                <div>
                  <p className="eyebrow" style={{ marginBottom: 16 }}>
                    Step 2 — Context
                  </p>
                  <h2>
                    Who are you <strong>presenting to?</strong>
                  </h2>
                  <p className="ob-sub">This helps calibrate your coaching baseline. You can update these anytime in Settings.</p>
                </div>
              </ScrollReveal>
              <div style={{ marginBottom: 24 }}>
                <p className="field-label" style={{ marginBottom: 10 }}>
                  What best describes you?
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {roleOptions.map((label) => (
                    <button
                      key={label}
                      type="button"
                      className={`chip${roles.has(label) ? ' on' : ''}`}
                      onClick={() => toggleRole(label)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <p className="field-label" style={{ marginBottom: 10 }}>
                  What do you present most?
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {topicOptions.map((label) => (
                    <button
                      key={label}
                      type="button"
                      className={`chip${topics.has(label) ? ' on' : ''}`}
                      onClick={() => toggleTopic(label)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="ob-org">
                  University / Company (optional)
                </label>
                <input id="ob-org" type="text" placeholder="IE Business School" />
              </div>
            </div>
          </Step>

          <Step>
            <div className="ob-main ob-main--story ob-stepper-panel">
              <ScrollReveal>
                <header className="ob-story-head">
                  <p className="eyebrow" style={{ marginBottom: 16 }}>
                    Step 3 — Start
                  </p>
                  <h2>
                    What you&apos;ll <strong>get</strong>
                  </h2>
                  <p className="ob-sub ob-sub--tight">A quick walkthrough so you know exactly what to expect.</p>
                </header>
              </ScrollReveal>
              <div className="how-cards how-cards--story">
                {HOW_IT_WORKS_CARDS.map((card, i) => (
                  <ScrollReveal key={card.n} delayMs={i * 95}>
                    <div className="how-card how-card--light">
                      <p className="how-card-n">{card.n}</p>
                      <h4>{card.h}</h4>
                      <p>{card.p}</p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </Step>
        </Stepper>
      </div>
    </PageMotion>
  )
}
