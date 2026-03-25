import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageMotion } from '../components/PageMotion'
import { ScrollVelocity } from '../components/ScrollVelocity'
import type { EvaluationPayload, PitchSessionStored } from '../lib/pitchSession'
import { loadPitchSession } from '../lib/pitchSession'

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m ${s}s`
}

function scoreClass(score: number) {
  if (score >= 75) return 'ok'
  if (score >= 50) return 'warn'
  return ''
}

const CATEGORY_ORDER: { key: keyof NonNullable<EvaluationPayload['categories']>; label: string }[] = [
  { key: 'eyeContact', label: 'Eye contact' },
  { key: 'posture', label: 'Posture' },
  { key: 'gestures', label: 'Gestures' },
  { key: 'vocalDelivery', label: 'Vocal delivery' },
  { key: 'energy', label: 'Energy' },
  { key: 'fillerWords', label: 'Filler words' },
]

export function Debrief() {
  const navigate = useNavigate()
  const [session, setSession] = useState<PitchSessionStored | null>(null)

  useEffect(() => {
    const s = loadPitchSession()
    if (!s?.evaluation) {
      navigate('/app/session/setup', { replace: true })
      return
    }
    setSession(s)
  }, [navigate])

  if (!session?.evaluation) {
    return (
      <PageMotion className="page page--app" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p className="setup-sub">Loading debrief…</p>
      </PageMotion>
    )
  }

  const ev = session.evaluation
  const audio = session.audioAnalysis
  const cats = ev.categories

  return (
    <PageMotion className="page page--app">
      <div className="debrief-layout" style={{ flex: 1 }}>
        <div className="page-scroll-marquee" aria-hidden style={{ gridColumn: '1 / -1' }}>
          <ScrollVelocity
            texts={['Session Debrief']}
            velocity={50}
            numCopies={8}
            className="debrief__velocity-text"
            parallaxClassName="debrief__velocity"
            scrollerClassName="debrief__velocity-scroller"
          />
        </div>
        <div className="debrief-sidebar">
          <div className="big-score">
            {ev.overallScore}
            <span>/100</span>
          </div>
          <p className="big-score-lbl">Overall score</p>

          {session.duration != null && (
            <div className="meta-row">
              <span className="meta-key">Duration</span>
              <span className="meta-val">{formatDuration(session.duration)}</span>
            </div>
          )}
          {audio && (
            <>
              <div className="meta-row">
                <span className="meta-key">Words</span>
                <span className="meta-val">{audio.wordCount}</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Pace (speaking)</span>
                <span className={`meta-val${audio.wpm > 160 || audio.wpm < 90 ? ' warn' : ' ok'}`}>{audio.wpm} wpm</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Silence</span>
                <span className="meta-val">{audio.silencePercent}%</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Fillers</span>
                <span className="meta-val">{audio.fillerWordCount} ({audio.fillerWordsPerMinute}/min)</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Movement</span>
                <span className="meta-val">{audio.averageMovement}</span>
              </div>
            </>
          )}

          {cats &&
            CATEGORY_ORDER.map(({ key, label }) => {
              const c = cats[key]
              if (!c) return null
              return (
                <div key={key} className="meta-row">
                  <span className="meta-key">{label}</span>
                  <span className={`meta-val${scoreClass(c.score) ? ` ${scoreClass(c.score)}` : ''}`}>{c.score}</span>
                </div>
              )
            })}

          <div className="debrief-sidebar-actions">
            <Link to="/app/coach" className="btn-primary btn-sm" style={{ justifyContent: 'center' }}>
              Chat about this →
            </Link>
            <Link to="/app/session/setup" className="btn-outline btn-sm" style={{ justifyContent: 'center' }}>
              Practice again →
            </Link>
          </div>
        </div>

        <div className="debrief-main">
          <div className="debrief-section">
            <p className="debrief-section-title">Overall assessment</p>
            <p className="assess">{ev.summary}</p>
          </div>

          <div className="debrief-section">
            <p className="debrief-section-title">What you did well</p>
            <div className="strength-box">
              <span className="label">Top strength</span>
              <p>{ev.topStrength}</p>
            </div>
          </div>

          <div className="debrief-section">
            <p className="debrief-section-title">Biggest improvement</p>
            <div className="improvement">
              <span className="imp-rank">01</span>
              <div>
                <p className="imp-title">Priority focus</p>
                <p className="imp-desc">{ev.topImprovement}</p>
              </div>
              <span className="imp-badge high">Focus</span>
            </div>
          </div>

          {cats && (
            <div className="debrief-section">
              <p className="debrief-section-title">Category feedback</p>
              {CATEGORY_ORDER.map(({ key, label }) => {
                const c = cats[key]
                if (!c) return null
                return (
                  <div key={key} className="tl-event" style={{ marginBottom: 16 }}>
                    <span className="tl-t">{c.score}</span>
                    <div className="tl-d">
                      <strong>{label}</strong>
                      {c.weight ? ` · ${c.weight}` : ''}
                      <br />
                      {c.feedback}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {ev.details && (
            <div className="debrief-section">
              <p className="debrief-section-title">Detailed observations</p>
              <p className="assess">{ev.details}</p>
            </div>
          )}

          {audio?.transcript ? (
            <div className="debrief-section">
              <p className="debrief-section-title">Transcript</p>
              <p className="assess" style={{ fontSize: 11 }}>
                {audio.transcript}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </PageMotion>
  )
}
