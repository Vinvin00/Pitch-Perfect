import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageMotion } from '../components/PageMotion'
import { usePitchRecording } from '../hooks/usePitchRecording'
import { analyzePitch } from '../lib/pitchApi'
import { loadPitchSession, savePitchSession, type PitchSessionStored } from '../lib/pitchSession'

function formatTimer(totalSecs: number) {
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function statusColor(status: 'low' | 'good' | 'high') {
  if (status === 'good') return 'var(--green)'
  if (status === 'high') return 'var(--orange)'
  return 'var(--red)'
}

function LiveSessionInner({ session }: { session: PitchSessionStored }) {
  const navigate = useNavigate()
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState('')

  const { videoRef, feedback, isRecording, seconds, startRecording, stopRecording, stopCamera } =
    usePitchRecording(session.evaluationType)

  const ringPct = useMemo(() => {
    if (!isRecording) return 0
    const v = Math.min(100, feedback.volume)
    const m = Math.min(100, feedback.movementLevel * 4)
    return Math.round((v + m) / 2)
  }, [feedback.movementLevel, feedback.volume, isRecording])

  async function handleStopAndAnalyze() {
    setAnalyzeError('')
    setAnalyzing(true)
    try {
      const { durationSecs, frameUrls, audioAnalysis } = await stopRecording()

      if (durationSecs < 3) {
        setAnalyzeError('Record at least a few seconds so the coach can analyse you.')
        setAnalyzing(false)
        return
      }
      if (frameUrls.length === 0) {
        setAnalyzeError('No video frames were captured. Check camera permissions and try again.')
        setAnalyzing(false)
        return
      }

      const evaluation = await analyzePitch({
        frameUrls,
        evaluationType: session.evaluationType,
        duration: durationSecs,
        audioAnalysis,
      })

      const next: PitchSessionStored = {
        ...session,
        duration: durationSecs,
        audioAnalysis,
        evaluation,
      }
      savePitchSession(next)
      stopCamera()
      navigate('/app/debrief')
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : 'Analysis failed. Is the API server running on port 3001?')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleEndWithoutSaving() {
    if (isRecording) {
      await stopRecording()
    }
    stopCamera()
    navigate('/app/session/setup')
  }

  return (
    <>
      <div className="live-session-toolbar" role="region" aria-label="Session">
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, minWidth: 0 }}>
          {isRecording && <div className="rec-dot" style={{ position: 'static' }} />}
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--grey-600)',
            }}
          >
            {isRecording ? 'Recording' : 'Live practice'} · {session.evaluationLabel}
          </span>
        </div>
        <button
          type="button"
          className="nav-right-item"
          style={{ color: 'var(--red)', fontSize: 10, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
          onClick={() => void handleEndWithoutSaving()}
        >
          End without saving
        </button>
      </div>

      {analyzeError && (
        <div style={{ padding: '12px 22px', background: 'rgba(226,74,74,0.06)', fontSize: 11, color: 'var(--red)', margin: '0 18px', borderRadius: 'var(--r)' }}>
          {analyzeError}
        </div>
      )}

      <div className="session-layout" style={{ flex: 1 }}>
        <div className="session-cam">
          <div className="cam-grid" />
          <video ref={videoRef} className="session-video-full" autoPlay playsInline muted />

          <div className="session-cam-overlay-stack">
            {isRecording && (
              <>
                <div className="session-volume-bar">
                  <div
                    className="session-volume-fill"
                    style={{
                      height: `${Math.min(100, feedback.volume)}%`,
                      background: statusColor(feedback.volumeStatus),
                    }}
                  />
                </div>
                {feedback.showSilenceWarn && (
                  <div className="session-silence-banner">
                    Silent for {feedback.silentSeconds}s — keep talking
                  </div>
                )}
                <div className="session-live-pills">
                  {feedback.movementLabel ? (
                    <span
                      className="session-live-pill"
                      style={{
                        color: statusColor(feedback.movementStatus),
                        borderColor: 'rgba(0,0,0,0.12)',
                        background: 'rgba(255,255,255,0.85)',
                      }}
                    >
                      {feedback.movementLabel}
                    </span>
                  ) : null}
                  {feedback.wpm > 0 ? (
                    <span
                      className="session-live-pill"
                      style={{
                        color: statusColor(feedback.wpmStatus),
                        borderColor: 'rgba(0,0,0,0.12)',
                        background: 'rgba(255,255,255,0.85)',
                      }}
                    >
                      {feedback.wpm} WPM
                      {feedback.wpmStatus === 'high' ? ' — slow down' : feedback.wpmStatus === 'low' ? ' — speed up' : ''}
                    </span>
                  ) : null}
                </div>
              </>
            )}
          </div>

          {isRecording && (
            <div className="rec-pill" style={{ zIndex: 3 }}>
              <div className="rec-dot" />
              REC
            </div>
          )}
          <div className="session-timer" style={{ zIndex: 3 }}>
            {formatTimer(isRecording ? seconds : 0)}
          </div>
          <div className="session-profile-tag" style={{ zIndex: 3 }}>
            {session.evaluationType.replace('-', ' ')} · {session.goal}
          </div>
        </div>

        <div className="session-panel">
          <div className="panel-score">
            <div className="ring">
              <div className="ring-bg" />
              <div
                className="ring-prog"
                style={{
                  background: `conic-gradient(var(--orange) 0% ${ringPct}%, transparent ${ringPct}%)`,
                }}
              />
              <div className="ring-inner">
                <span className="ring-n">{isRecording ? ringPct : '—'}</span>
                <span className="ring-l">Live signal</span>
              </div>
            </div>
            <span className="score-lbl">Volume + movement</span>
          </div>

          <div className="panel-metrics">
            <div className="metric">
              <div className="metric-head">
                <span className="metric-name">Volume</span>
                <span className={`metric-val${feedback.volumeStatus === 'good' ? ' ok' : ' warn'}`}>
                  {isRecording ? `${feedback.volume}%` : '—'}
                </span>
              </div>
              <div className="metric-track">
                <div
                  className="metric-fill"
                  style={{
                    width: isRecording ? `${Math.min(100, feedback.volume)}%` : '0%',
                    background: statusColor(feedback.volumeStatus),
                  }}
                />
              </div>
            </div>
            <div className="metric">
              <div className="metric-head">
                <span className="metric-name">Movement</span>
                <span className={`metric-val${feedback.movementStatus === 'good' ? ' ok' : ' warn'}`}>
                  {isRecording ? feedback.movementLevel.toFixed(1) : '—'}
                </span>
              </div>
              <div className="metric-track">
                <div
                  className="metric-fill"
                  style={{
                    width: isRecording ? `${Math.min(100, feedback.movementLevel * 3)}%` : '0%',
                    background: statusColor(feedback.movementStatus),
                  }}
                />
              </div>
            </div>
            <div className="metric">
              <div className="metric-head">
                <span className="metric-name">Pace (rolling)</span>
                <span className={`metric-val${feedback.wpmStatus === 'good' ? ' ok' : ' warn'}`}>
                  {isRecording && feedback.wpm > 0 ? `${feedback.wpm} wpm` : '—'}
                </span>
              </div>
              <div className="metric-track">
                <div
                  className="metric-fill"
                  style={{
                    width: isRecording && feedback.wpm > 0 ? `${Math.min(100, (feedback.wpm / 200) * 100)}%` : '0%',
                    background: statusColor(feedback.wpmStatus),
                  }}
                />
              </div>
            </div>
            <div className="metric">
              <div className="metric-head">
                <span className="metric-name">Silence</span>
                <span className={`metric-val${!feedback.showSilenceWarn ? ' ok' : ' warn'}`}>
                  {isRecording ? `${feedback.silentSeconds}s` : '—'}
                </span>
              </div>
              <div className="metric-track">
                <div
                  className="metric-fill"
                  style={{
                    width: isRecording ? `${Math.min(100, feedback.silentSeconds * 5)}%` : '0%',
                    background: feedback.showSilenceWarn ? 'var(--red)' : 'var(--green)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="nudge-strip">
          <span className="nudge-arrow">→</span>
          <span className="nudge-txt">
            {isRecording
              ? feedback.showSilenceWarn
                ? 'Break the silence — keep narrating your pitch.'
                : feedback.volumeStatus === 'low'
                  ? 'Project your voice so the coach can score delivery.'
                  : feedback.movementStatus === 'low'
                    ? 'Add purposeful movement for this presentation type.'
                    : 'Stay in the zone — finish strong, then stop to analyse.'
              : !analyzing && 'Allow camera and mic, then start. Aim for at least 30 seconds before stopping.'}
            {analyzing && 'Sending frames and audio metrics to the coach API…'}
          </span>
        </div>

        {!isRecording && !analyzing ? (
          <button type="button" className="stop-btn" onClick={startRecording}>
            <div className="stop-sq" style={{ borderRadius: '50%' }} />
            Start recording
          </button>
        ) : isRecording ? (
          <button type="button" className="stop-btn" onClick={() => void handleStopAndAnalyze()} disabled={analyzing}>
            <div className="stop-sq" />
            Stop &amp; analyse
          </button>
        ) : (
          <button type="button" className="stop-btn" disabled>
            <div className="stop-sq" />
            Analysing…
          </button>
        )}
      </div>
    </>
  )
}

export function LiveSession() {
  const navigate = useNavigate()
  const [session, setSession] = useState<PitchSessionStored | null>(null)

  useEffect(() => {
    const s = loadPitchSession()
    if (!s?.evaluationType) {
      navigate('/app/session/setup', { replace: true })
      return
    }
    setSession(s)
  }, [navigate])

  if (!session) {
    return (
      <PageMotion className="page page--app" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p className="setup-sub">Loading session…</p>
      </PageMotion>
    )
  }

  return (
    <PageMotion className="page page--app">
      <LiveSessionInner session={session} />
    </PageMotion>
  )
}
