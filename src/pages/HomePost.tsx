import { Link } from 'react-router-dom'
import { BorderGlow } from '../components/BorderGlow'
import { CircularRotatingLogo } from '../components/CircularRotatingLogo'
import MagicBento from '../components/MagicBento'
import { PageMotion } from '../components/PageMotion'
import { ScrollReveal } from '../components/ScrollReveal'
import { ScrollVelocity } from '../components/ScrollVelocity'
import { getUserName } from '../lib/authSession'

const R = 9

function IconArrowUpRight({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 17L17 7M7 7h10v10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ProofDiagram() {
  return (
    <div className="home-proof__viz" role="img" aria-label="Pitch Perfect circular wordmark">
      <div className="home-proof__viz-logo-wrap" aria-hidden>
        <CircularRotatingLogo size={320} className="home-proof__viz-logo" />
      </div>
      <div className="home-proof__viz-vignette" aria-hidden />
    </div>
  )
}

export function HomePost() {
  const firstName = (getUserName() || 'there').split(/\s+/)[0]

  return (
    <PageMotion className="page page--app">
      <div className="home-logged">
        {/* Combined hero: banner content + landing logo */}
        <BorderGlow
          className="home-banner home-banner--combined"
          backgroundColor="#ffffff"
          borderRadius={R}
          glowRadius={14}
          glowIntensity={0.85}
          coneSpread={9}
          glowColor="40 70 60"
        >
          <div className="home-banner__combined-inner">
            <div className="home-banner__combined-copy">
              <p className="home-card__eyebrow">Good afternoon, {firstName}</p>
              <h1>
                Welcome to <strong>Pitch Perfect</strong>
              </h1>
              <p className="home-post__lede">
                Your personal presentation coach. Practice with your webcam, get real-time feedback on body language, eye contact, and pace — calibrated to your audience.
              </p>
              <div className="home-banner__combined-ctas">
                <Link to="/app/session/setup" className="btn-primary">
                  + New session →
                </Link>
                <Link to="/app/projects" className="btn-outline home-intro__btn-outline home-intro__btn-outline--light">
                  View projects
                </Link>
              </div>
              <div className="home-banner__stats" aria-label="Your progress">
                <div className="home-banner__stat">
                  <span className="home-banner__stat-num">7</span>
                  <span className="home-banner__stat-label">Sessions</span>
                </div>
                <div className="home-banner__stat">
                  <span className="home-banner__stat-num">74</span>
                  <span className="home-banner__stat-label">Best score</span>
                </div>
                <div className="home-banner__stat">
                  <span className="home-banner__stat-num">3</span>
                  <span className="home-banner__stat-label">Projects</span>
                </div>
                <div className="home-banner__stat">
                  <span className="home-banner__stat-num">23m</span>
                  <span className="home-banner__stat-label">Practised</span>
                </div>
              </div>
            </div>
            <div className="home-banner__combined-logo" aria-hidden>
              <CircularRotatingLogo size={360} className="home-landing__hero-logo-svg" />
            </div>
          </div>
        </BorderGlow>

        <div className="home-info-grid">
          <BorderGlow
            className="info-block info-block--bento-lavender"
            backgroundColor="#ffffff"
            borderRadius={R}
            glowRadius={14}
            glowIntensity={0.75}
            coneSpread={9}
            glowColor="40 70 60"
          >
            <div className="info-block__inner">
              <p className="eyebrow home-post__eyebrow">How it works</p>
              <h3>01 — Create a project</h3>
              <p>Group your sessions into projects — one per pitch, interview, or talk. Each project shows your improvement curve across runs.</p>
              <Link to="/app/projects" className="btn-outline btn-sm home-post__inline-btn">
                View projects
              </Link>
            </div>
          </BorderGlow>

          <BorderGlow
            className="info-block info-block--bento-lime"
            backgroundColor="#ffffff"
            borderRadius={R}
            glowRadius={14}
            glowIntensity={0.75}
            coneSpread={9}
            glowColor="40 70 60"
          >
            <div className="info-block__inner">
              <p className="eyebrow home-post__eyebrow">Each session</p>
              <h3>02 — Describe your audience</h3>
              <p>Tell the AI exactly who you&apos;re presenting to. Claude generates a coaching profile calibrated to your specific context and stakes.</p>
              <Link to="/app/session/setup" className="btn-primary btn-sm home-post__inline-btn">
                Start session →
              </Link>
            </div>
          </BorderGlow>

          <BorderGlow
            className="info-block"
            backgroundColor="#ffffff"
            borderRadius={R}
            glowRadius={14}
            glowIntensity={0.7}
            coneSpread={9}
            glowColor="40 70 60"
          >
            <div className="info-block__inner">
              <p className="eyebrow home-post__eyebrow">Privacy</p>
              <h3>Your video stays on-device</h3>
              <p>All computer vision runs locally via WebAssembly. Only landmark coordinates and speech text ever leave your device — never video.</p>
              <p className="home-post__badge">Privacy guaranteed</p>
            </div>
          </BorderGlow>
        </div>
      </div>

      {/* Landing page content sections */}
      <div className="page--landing home-post__landing-sections">
        <div className="home-landing__pair home-landing__shell-section">
          <ScrollReveal className="home-landing__pair-cell" delayMs={0}>
            <div className="home-card home-card--accent home-card--accent-cta home-card--side-panel home-landing__pair-surface">
              <div className="home-card--side-panel-inner">
                <div className="home-card--pair__head">
                  <p className="home-card__eyebrow">About Pitch Perfect</p>
                  <IconArrowUpRight className="home-card__corner-icon" aria-hidden />
                </div>
                <h2 className="home-card__title home-card__title--lg">About us</h2>
                <p className="home-card__text home-card__text--compact">
                  For students and professionals who want direct, practical feedback — no coach booking or raw video uploads. Everything stays in your browser, privately.
                </p>
                <div className="home-card__side-actions">
                  <Link to="/app/session/setup" className="home-card__action-link">
                    Start a session →
                  </Link>
                  <span className="home-card__action-sep" aria-hidden>
                    ·
                  </span>
                  <a href="mailto:hello@pitchperfect.com" className="home-card__action-link">
                    Email us
                  </a>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        <section aria-labelledby="home-proof-heading-post" className="home-proof home-landing__shell-section home-proof--in-shell">
          <div className="home-proof__inner">
            <ScrollReveal className="home-proof__copy-wrap" delayMs={0}>
              <div className="home-proof__copy">
                <h2 id="home-proof-heading-post" className="home-proof__headline">
                  Just as great products need great UX, great ideas need a great presentation — and small improvements compound fast.
                </h2>
                <div className="home-proof__kpi-grid">
                  <ScrollReveal className="home-proof__kpi-reveal" delayMs={0}>
                    <div className="home-proof__kpi">
                      <span className="home-proof__kpi-val">76%</span>
                      <p className="home-proof__kpi-label">
                        of executives say presentation skills are essential for career advancement
                      </p>
                      <span className="home-proof__kpi-line" />
                    </div>
                  </ScrollReveal>
                  <ScrollReveal className="home-proof__kpi-reveal" delayMs={45}>
                    <div className="home-proof__kpi">
                      <span className="home-proof__kpi-val">95%</span>
                      <p className="home-proof__kpi-label">
                        recall for visual or video vs. roughly 10% for text alone
                      </p>
                      <span className="home-proof__kpi-line" />
                    </div>
                  </ScrollReveal>
                  <ScrollReveal className="home-proof__kpi-reveal" delayMs={90}>
                    <div className="home-proof__kpi">
                      <span className="home-proof__kpi-val">67%</span>
                      <p className="home-proof__kpi-label">higher odds of securing funding with professionally designed decks</p>
                      <span className="home-proof__kpi-line" />
                    </div>
                  </ScrollReveal>
                  <ScrollReveal className="home-proof__kpi-reveal" delayMs={135}>
                    <div className="home-proof__kpi">
                      <span className="home-proof__kpi-val home-proof__kpi-val--time" aria-label="27 seconds">
                        <span className="home-proof__kpi-num">27</span>
                        <span className="home-proof__kpi-unit">seconds</span>
                      </span>
                      <p className="home-proof__kpi-label">to form a first impression of a speaker</p>
                      <span className="home-proof__kpi-line" />
                    </div>
                  </ScrollReveal>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal className="home-proof__viz-wrap" delayMs={100}>
              <ProofDiagram />
            </ScrollReveal>
          </div>
        </section>

        <section className="home-magic-bento home-landing__shell-section" aria-labelledby="home-magic-bento-heading-post">
          <ScrollReveal className="home-magic-bento__head-wrap" delayMs={0}>
            <div className="home-magic-bento__head">
              <h2 id="home-magic-bento-heading-post" className="home-magic-bento__title home-magic-bento__title--stats">
                <span className="home-magic-bento__title-line1">Big numbers.</span>
                <span className="home-magic-bento__title-line2">Bigger outcomes.</span>
              </h2>
              <p className="home-magic-bento__sub">
                Why delivery, presence, and clarity matter for interviews, pitches, and high-stakes talks — from first impressions to career and business outcomes.
              </p>
            </div>
          </ScrollReveal>
          <div className="home-magic-bento__frame">
            <MagicBento textAutoHide={false} />
          </div>
        </section>

        <section className="home-trusted home-trusted--in-shell home-landing__shell-section" aria-labelledby="home-trusted-heading-post">
          <div className="home-trusted__panel-inner">
            <div className="home-trusted__bento">
              <ScrollReveal className="home-trusted__bento-cell home-trusted__bento-cell--head" delayMs={0}>
                <h2 id="home-trusted-heading-post" className="home-trusted__headline home-trusted__headline--static">
                  Trusted by people who present{' '}
                  <span className="home-trusted__keyword">under pressure</span>
                </h2>
              </ScrollReveal>
              <ScrollReveal className="home-trusted__bento-cell" delayMs={55}>
                <div className="home-trusted__card home-trusted__card--flat">
                  <article className="home-trusted__card-inner">
                    <h3 className="home-trusted__card-title">Founders</h3>
                    <p className="home-trusted__card-desc">Investor pitches, board updates, and high-stakes storytelling.</p>
                  </article>
                </div>
              </ScrollReveal>
              <ScrollReveal className="home-trusted__bento-cell" delayMs={110}>
                <div className="home-trusted__card home-trusted__card--flat">
                  <article className="home-trusted__card-inner">
                    <h3 className="home-trusted__card-title">Students</h3>
                    <p className="home-trusted__card-desc">Defences, interviews, and graded presentations.</p>
                  </article>
                </div>
              </ScrollReveal>
              <ScrollReveal className="home-trusted__bento-cell" delayMs={165}>
                <div className="home-trusted__card home-trusted__card--flat">
                  <article className="home-trusted__card-inner">
                    <h3 className="home-trusted__card-title">Sales teams</h3>
                    <p className="home-trusted__card-desc">Demos and deal rooms where delivery closes the loop.</p>
                  </article>
                </div>
              </ScrollReveal>
              <ScrollReveal className="home-trusted__bento-cell" delayMs={220}>
                <div className="home-trusted__card home-trusted__card--flat">
                  <article className="home-trusted__card-inner">
                    <h3 className="home-trusted__card-title">Leaders</h3>
                    <p className="home-trusted__card-desc">Town halls, exec updates, and briefings where clarity and presence carry the message.</p>
                  </article>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        <section className="home-features home-landing__shell-section" aria-labelledby="home-features-heading-post">
          <ScrollReveal className="home-features__head-wrap" delayMs={0}>
            <h2 id="home-features-heading-post" className="home-features__headline">
              <ScrollVelocity
                texts={[<>What makes us{' '}<strong className="home-features__accent">different</strong></>]}
                velocity={34}
                numCopies={12}
                className="home-features__velocity-text"
                parallaxClassName="home-features__velocity"
                scrollerClassName="home-features__velocity-scroller"
              />
            </h2>
            <div className="home-section-head">
              <p className="home-section-head__sub">The things that separate Pitch Perfect from generic feedback tools.</p>
            </div>
          </ScrollReveal>
          <div className="home-feature-grid">
            <ScrollReveal className="home-feature-grid__cell" delayMs={55}>
              <div className="home-feature-card home-feature-card--flat">
                <article className="home-feature-card__inner">
                  <div className="home-feature-card__top">
                    <span className="home-feature-card__pill">Live analysis</span>
                    <IconArrowUpRight className="home-feature-card__arrow" />
                  </div>
                  <span className="home-feature-card__num" aria-hidden>
                    01
                  </span>
                  <h3 className="home-feature-card__title">Real-time coaching</h3>
                  <p className="home-feature-card__body">Presence, pace, and gestures analysed as you speak — not after you upload a file.</p>
                </article>
              </div>
            </ScrollReveal>
            <ScrollReveal className="home-feature-grid__cell" delayMs={110}>
              <div className="home-feature-card home-feature-card--flat">
                <article className="home-feature-card__inner">
                  <div className="home-feature-card__top">
                    <span className="home-feature-card__pill">Privacy-first</span>
                    <IconArrowUpRight className="home-feature-card__arrow" />
                  </div>
                  <span className="home-feature-card__num" aria-hidden>
                    02
                  </span>
                  <h3 className="home-feature-card__title">On-device processing</h3>
                  <p className="home-feature-card__body">Your practice stays in the browser. No cloud video storage required to get useful feedback.</p>
                </article>
              </div>
            </ScrollReveal>
            <ScrollReveal className="home-feature-grid__cell" delayMs={165}>
              <div className="home-feature-card home-feature-card--flat">
                <article className="home-feature-card__inner">
                  <div className="home-feature-card__top">
                    <span className="home-feature-card__pill">Audience-aware</span>
                    <IconArrowUpRight className="home-feature-card__arrow" />
                  </div>
                  <span className="home-feature-card__num" aria-hidden>
                    03
                  </span>
                  <h3 className="home-feature-card__title">Calibrated debriefs</h3>
                  <p className="home-feature-card__body">Tailored nudges for investors, examiners, or your team — so you rehearse for the room you&apos;re walking into.</p>
                </article>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <ScrollReveal className="home-footer-reveal" delayMs={0}>
          <footer className="site-footer site-footer--landing">
            <span>&copy; 2026 Pitch Perfect</span>
            <div>
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
              <a href="mailto:hello@pitchperfect.com">Contact</a>
            </div>
          </footer>
        </ScrollReveal>
      </div>
    </PageMotion>
  )
}
