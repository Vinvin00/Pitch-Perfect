import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageMotion } from '../components/PageMotion'
import { ScrollVelocity } from '../components/ScrollVelocity'
import {
  EVALUATION_MODES,
  type EvaluationModeId,
  savePitchSession,
} from '../lib/pitchSession'

const FOLDERS = [
  { id: 'vc', icon: '📊', name: 'Series A VC Pitch', count: '4 sessions' },
  { id: 'mba', icon: '🎓', name: 'MBA Thesis Defence', count: '2 sessions' },
  { id: 'mck', icon: '💼', name: 'McKinsey Interview', count: '1 session' },
  { id: 'none', icon: '+', name: 'No project (standalone)', count: '', plain: true },
]

const EXAMPLES: { label: string; text: string }[] = [
  { label: 'VC pitch', text: 'Pitching to 3 VCs who are sceptical of our market size' },
  { label: 'Thesis defence', text: 'Thesis defence in front of my supervisor and 2 external examiners' },
  { label: 'McKinsey interview', text: 'Final round McKinsey case interview, 2 partners, 20-min presentation' },
  { label: 'Team standup', text: 'Team standup — announcing a major technical decision to 8 engineers' },
  { label: 'Client pitch', text: 'Client pitch to a CMO who has exactly 15 minutes and high expectations' },
]

export function SessionSetup() {
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [folderId, setFolderId] = useState('vc')
  const [audience, setAudience] = useState('')
  const [modeId, setModeId] = useState<EvaluationModeId>('professional-pitch')
  const [phase, setPhase] = useState<'empty' | 'loading' | 'result'>('empty')

  const charCount = audience.length
  const maxChars = 300

  const genProfile = useCallback(() => {
    setPhase('loading')
    window.setTimeout(() => setPhase('result'), 1700)
  }, [])

  const resetProfile = useCallback(() => {
    setPhase('empty')
  }, [])

  function showNewProjectModal() {
    const name = window.prompt('Project name (e.g. "McKinsey Interview 2026"):')
    if (name) {
      window.alert(`Project "${name}" would be created here.`)
    }
  }

  const saveAndGoLive = useCallback(() => {
    const mode = EVALUATION_MODES.find((m) => m.id === modeId)!
    const folder = FOLDERS.find((f) => f.id === folderId)
    savePitchSession({
      evaluationType: mode.id,
      evaluationLabel: mode.label,
      energy: mode.energy,
      formality: mode.formality,
      goal: mode.goal,
      audienceNote: audience.trim() || undefined,
      folderLabel: folder?.name,
    })
    navigate('/app/session/live')
  }, [audience, folderId, modeId, navigate])

  return (
    <PageMotion className="page page--app">
      <div ref={scrollRef} className="setup-page">
        <header className="setup-page__header">
          <div className="setup-scroll-marquee" aria-hidden>
            <ScrollVelocity
              scrollContainerRef={scrollRef}
              texts={['Session setup · ', 'Session setup · ']}
              velocity={72}
              numCopies={8}
              className="setup-scroll-name"
              parallaxClassName="setup-scroll-parallax"
              scrollerClassName="setup-scroll-scroller"
            />
          </div>
          <p className="setup-page__sub">Configure your audience and project, then start recording.</p>
        </header>

        <div className="setup-page__grid">
          <div className="setup-panel setup-panel--left">
            <div className="setup-section">
              <div className="setup-section__head">
                <p className="setup-section__label">Project</p>
                <button type="button" className="setup-section__action" onClick={showNewProjectModal}>
                  + New project
                </button>
              </div>
              <div className="setup-folder-list">
                {FOLDERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`setup-folder${folderId === f.id ? ' setup-folder--active' : ''}${f.plain ? ' setup-folder--plain' : ''}`}
                    onClick={() => setFolderId(f.id)}
                  >
                    <span className="setup-folder__icon">{f.icon}</span>
                    <span className="setup-folder__name">{f.name}</span>
                    {f.count && <span className="setup-folder__count">{f.count}</span>}
                    <span className="setup-folder__dot" />
                  </button>
                ))}
              </div>
            </div>

            <div className="setup-section">
              <p className="setup-section__label">Audience</p>
              <textarea
                id="aud-txt"
                className="setup-textarea"
                rows={4}
                placeholder="e.g. Pitching to 3 VCs who are sceptical of our market size. Series A round, €2M target."
                maxLength={maxChars}
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
              <div className="setup-textarea__meta">
                <div className="setup-chip-row">
                  {EXAMPLES.map((ex) => (
                    <button key={ex.label} type="button" className="setup-chip" onClick={() => setAudience(ex.text)}>
                      {ex.label}
                    </button>
                  ))}
                </div>
                <span className="setup-textarea__count">{charCount}/{maxChars}</span>
              </div>
            </div>

            <div className="setup-section">
              <p className="setup-section__label">Presentation type</p>
              <div className="setup-mode-list">
                {EVALUATION_MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`setup-mode${modeId === m.id ? ' setup-mode--active' : ''}`}
                    onClick={() => setModeId(m.id)}
                  >
                    <span className="setup-mode__title">{m.label}</span>
                    <span className="setup-mode__desc">{m.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="setup-actions">
              <button type="button" className="btn-primary setup-actions__btn" onClick={genProfile}>
                Generate coaching profile →
              </button>
              <button type="button" className="setup-actions__skip" onClick={saveAndGoLive}>
                Skip & start recording →
              </button>
            </div>
          </div>

          <div className="setup-panel setup-panel--right">
            <p className="setup-section__label">Coaching profile</p>

            {phase === 'empty' && (
              <div className="setup-empty">
                <div className="setup-empty__ring">◯</div>
                <p className="setup-empty__title">Profile will appear here</p>
                <p className="setup-empty__desc">
                  Describe your audience and click Generate. Claude will calibrate all coaching thresholds to your specific situation.
                </p>
              </div>
            )}

            {phase === 'loading' && (
              <div className="setup-empty">
                <div className="loader-ring" />
                <p className="setup-empty__title">Generating profile</p>
                <p className="setup-empty__desc">Analysing context...</p>
              </div>
            )}

            {phase === 'result' && (
              <div className="setup-result">
                <div className="setup-result__header">
                  <h3 className="setup-result__title">VC Pitch — High Stakes</h3>
                  <p className="setup-result__sub">Calibrated for a sceptical investor audience</p>
                  <div className="setup-result__badges">
                    <span className="badge">Formality 4/5</span>
                    <span className="badge orange">Critical stakes</span>
                    <span className="badge">Persuasive</span>
                  </div>
                </div>
                <div className="setup-result__section">
                  <p className="setup-result__section-title">What this audience cares about</p>
                  <div className="profile-item">Commanding, unhurried delivery that signals conviction</div>
                  <div className="profile-item">Zero hesitation — fillers erode credibility</div>
                  <div className="profile-item">Direct eye contact when making key claims</div>
                </div>
                <div className="setup-result__section">
                  <p className="setup-result__section-title">What to avoid</p>
                  <div className="profile-item red">Rushing through financial figures</div>
                  <div className="profile-item red">Looking away when challenged on assumptions</div>
                </div>
                <div className="setup-result__section">
                  <p className="setup-result__section-title">What wins them over</p>
                  <div className="profile-item green">Strategic pauses after bold claims</div>
                  <div className="profile-item green">Open palm gestures when discussing vision</div>
                </div>
                <div className="setup-result__footer">
                  <button type="button" className="btn-primary setup-actions__btn" onClick={saveAndGoLive}>
                    Start session →
                  </button>
                  <button type="button" className="setup-actions__skip" onClick={resetProfile}>
                    Regenerate
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageMotion>
  )
}
