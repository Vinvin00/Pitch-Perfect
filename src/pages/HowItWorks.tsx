import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { NavLogoLink } from '../components/NavLogoLink'
import { PageMotion } from '../components/PageMotion'
import { ScrollVelocity } from '../components/ScrollVelocity'

const STEPS: { n: string; title: string; body: ReactNode }[] = [
  {
    n: '01',
    title: 'Create a project',
    body: (
      <>
        Group practice sessions by presentation — one project per pitch, defence, or interview. Track scores and trends across <strong>every run</strong>.
      </>
    ),
  },
  {
    n: '02',
    title: 'Describe your audience',
    body: (
      <>
        Tell the AI who you are presenting to. Pitch Perfect builds a coaching profile that adjusts thresholds, nudges, and debrief language to your context.
      </>
    ),
  },
  {
    n: '03',
    title: 'Practice with your webcam',
    body: (
      <>
        Body language, eye contact, pace, and gestures are analysed in <strong>real time</strong> in your browser. Subtle on-screen cues help you correct course
        mid-session.
      </>
    ),
  },
  {
    n: '04',
    title: 'Review your debrief',
    body: (
      <>
        After each session, get a structured report with timestamped moments, ranked improvements, and strengths — ready for your next practice.
      </>
    ),
  },
]

const ADVANTAGES: { title: string; body: ReactNode }[] = [
  {
    title: 'Privacy by design',
    body: (
      <>
        Computer vision runs locally via WebAssembly. Video stays on your device; only derived signals and transcript text are used for coaching.
      </>
    ),
  },
  {
    title: 'Audience-specific coaching',
    body: (
      <>
        A VC pitch, thesis defence, and team standup need different standards. Calibration keeps feedback relevant to stakes and expectations.
      </>
    ),
  },
  {
    title: 'No extra hardware',
    body: (
      <>Use the webcam you already have. Works in modern browsers — no installs or studio setup.</>
    ),
  },
  {
    title: 'Honest, structured feedback',
    body: (
      <>
        Combines quantitative signals with narrative debriefs so you know what to <strong>fix first</strong> and what is already working.
      </>
    ),
  },
]

export function HowItWorks() {
  return (
    <PageMotion className="page page--landing page--how">
      <nav className="app-nav app-nav--landing" aria-label="Primary">
        <NavLogoLink to="/" />
        <div className="nav-right">
          <Link to="/login" className="login-btn">
            Log in / Sign up
          </Link>
        </div>
      </nav>

      <main className="how-page">
        <header className="how-page__hero">
          <p className="how-page__eyebrow">How it works</p>
          <h1 className="how-page__title">
            <ScrollVelocity
              texts={['How PitchCoach works']}
              velocity={50}
              numCopies={8}
              className="how-page__velocity-text"
              parallaxClassName="how-page__velocity"
              scrollerClassName="how-page__velocity-scroller"
            />
          </h1>
          <p className="how-page__lead">
            Pitch Perfect combines on-device computer vision with <strong>audience-aware AI coaching</strong>. Below is how the platform works, why teams and students
            use it, and how to get started in minutes.
          </p>
        </header>

        <section className="how-section" id="how-it-works" aria-labelledby="how-it-works-heading">
          <h2 id="how-it-works-heading" className="how-section__title">
            How the platform works
          </h2>
          <p className="how-section__intro">
            Every feature is built around one loop: set context → practice → measure → improve.
          </p>
          <div className="how-steps">
            {STEPS.map((s) => (
              <article key={s.n} className="how-step-card">
                <span className="how-step-card__n">{s.n}</span>
                <h3 className="how-step-card__title">{s.title}</h3>
                <p className="how-step-card__body">{s.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="how-section" id="advantages" aria-labelledby="advantages-heading">
          <h2 id="advantages-heading" className="how-section__title">
            Advantages
          </h2>
          <p className="how-section__intro">What makes Pitch Perfect different from generic tips or one-off rehearsal.</p>
          <div className="how-advantages">
            {ADVANTAGES.map((a) => (
              <article key={a.title} className="how-advantage-card">
                <h3 className="how-advantage-card__title">{a.title}</h3>
                <p className="how-advantage-card__body">{a.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="how-section how-section--use" id="how-to-use" aria-labelledby="how-to-use-heading">
          <h2 id="how-to-use-heading" className="how-section__title">
            How to use it
          </h2>
          <ol className="how-use-list">
            <li>
              <strong>Create a free account</strong> and complete the short onboarding so we understand your role and presentation types.
            </li>
            <li>
              <strong>Add a project</strong> for the talk you are preparing — optional but ideal for tracking improvement over time.
            </li>
            <li>
              <strong>Start a session</strong>, pick the project (or go standalone), and describe your audience in plain language.
            </li>
            <li>
              <strong>Allow camera access</strong>, then present as you normally would. Watch the live panel for scores and nudges.
            </li>
            <li>
              <strong>End the session</strong> to generate your debrief. Read ranked improvements, then schedule your next run from the same project.
            </li>
          </ol>
          <div className="how-page__cta">
            <Link to="/signup" className="btn-primary">
              Get started free →
            </Link>
            <Link to="/" className="btn-outline">
              ← Back to home
            </Link>
          </div>
        </section>
      </main>

      <footer className="site-footer site-footer--landing">
        <span>© 2026 Pitch Perfect</span>
        <div>
          <Link to="/">Home</Link>
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="mailto:hello@pitchperfect.com">Contact</a>
        </div>
      </footer>
    </PageMotion>
  )
}
