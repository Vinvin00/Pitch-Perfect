import React from 'react'
import { Link } from 'react-router-dom'
import MagicBento from '../components/MagicBento'

import { CircularRotatingLogo } from '../components/CircularRotatingLogo'
import { NavLogoLink } from '../components/NavLogoLink'
import { PageMotion } from '../components/PageMotion'
import { ScrollReveal } from '../components/ScrollReveal'
import { ScrollVelocity } from '../components/ScrollVelocity'

void React

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

export function HomePre() {
  return (
    <PageMotion className="page page--landing">
      <nav className="app-nav app-nav--landing" aria-label="Primary">
        <NavLogoLink to="/" />
        <div className="nav-right">
          <Link to="/login" className="login-btn">
            Log in / Sign up
          </Link>
        </div>
      </nav>

      <main className="home-landing">
        <div className="home-landing__shell-wrap">
          <div className="home-landing__shell">
          <div className="home-landing__shell-inner">
            <section
              className="home-landing__hero home-landing__shell-section"
              aria-label="Pitch Perfect landing hero"
            >
              <div className="home-landing__hero-inner home-landing__hero-inner--split">
                <div className="home-landing__hero-copy">
                  <div className="home-card--intro__top">
                    <p className="home-card__eyebrow">AI-powered presentation coaching</p>
                    <h1 className="home-intro__hl home-intro__hl--light">
                      Practice.
                      <br />
                      <em>
                        Get honest
                        <br />
                        feedback.
                      </em>
                      <br />
                      <span className="home-intro__accent">Improve.</span>
                    </h1>
                  </div>
                  <div className="home-card--intro__bottom">
                    <p className="home-intro__body home-intro__body--light">
                      Pitch Perfect uses your webcam to analyse body language, eye contact, speaking pace, and gestures in real time — then delivers coaching
                      calibrated to your audience.
                    </p>
                    <div className="home-intro__ctas">
                      <Link to="/signup" className="btn-primary">
                        Get started free →
                      </Link>
                      <Link to="/login" className="btn-outline home-intro__btn-outline home-intro__btn-outline--light">
                        Log in to get started
                      </Link>
                    </div>
                    <p className="home-intro__note home-intro__note--light">
                      No extra hardware · Runs in your browser · Your video never leaves your device
                    </p>
                  </div>
                </div>
                <div className="home-landing__hero-logo" aria-hidden>
                  <CircularRotatingLogo size={420} className="home-landing__hero-logo-svg" />
                </div>
              </div>
            </section>

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
                      <Link to="/signup" className="home-card__action-link">
                        Get started →
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

            <section aria-labelledby="home-proof-heading" className="home-proof home-landing__shell-section home-proof--in-shell">
              <div className="home-proof__inner">
                <ScrollReveal className="home-proof__copy-wrap" delayMs={0}>
                  <div className="home-proof__copy">
                    <h2 id="home-proof-heading" className="home-proof__headline">
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

            <section className="home-magic-bento home-landing__shell-section" aria-labelledby="home-magic-bento-heading">
              <ScrollReveal className="home-magic-bento__head-wrap" delayMs={0}>
                <div className="home-magic-bento__head">
                  <h2 id="home-magic-bento-heading" className="home-magic-bento__title home-magic-bento__title--stats">
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

            <section className="home-trusted home-trusted--in-shell home-landing__shell-section" aria-labelledby="home-trusted-heading">
              <div className="home-trusted__panel-inner">
                <div className="home-trusted__bento">
                  <ScrollReveal className="home-trusted__bento-cell home-trusted__bento-cell--head" delayMs={0}>
                    <h2 id="home-trusted-heading" className="home-trusted__headline home-trusted__headline--static">
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

            <section className="home-features home-landing__shell-section" aria-labelledby="home-features-heading">
              <ScrollReveal className="home-features__head-wrap" delayMs={0}>
                <h2 id="home-features-heading" className="home-features__headline">
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
          </div>
          </div>
        </div>
      </main>

      <ScrollReveal className="home-footer-reveal" delayMs={0}>
        <footer className="site-footer site-footer--landing">
          <span>© 2026 Pitch Perfect</span>
          <div>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="mailto:hello@pitchperfect.com">Contact</a>
          </div>
        </footer>
      </ScrollReveal>
    </PageMotion>
  )
}
