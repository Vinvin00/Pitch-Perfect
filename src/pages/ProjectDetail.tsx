import { Link } from 'react-router-dom'
import { PageMotion } from '../components/PageMotion'

export function ProjectDetail() {
  return (
    <PageMotion className="page page--app">
      <div className="proj-detail-layout" style={{ flex: 1 }}>
        <div className="proj-detail-sidebar">
          <Link to="/app/projects" className="nav-right-item" style={{ fontSize: 10, color: 'var(--grey-400)', display: 'inline-block', marginBottom: 12 }}>
            ← All projects
          </Link>
          <p className="eyebrow" style={{ marginBottom: 12 }}>
            Project
          </p>
          <div style={{ fontSize: 24, marginBottom: 10 }}>📊</div>
          <h2>Series A VC Pitch</h2>
          <p className="proj-context">
            Pitching to a panel of 3 sceptical investors. €2M target. 15-minute slot with Q&A. Multiple runs before the real pitch on Apr 3.
          </p>
          <div className="proj-stats-mini">
            <div className="proj-stat">
              <div className="proj-stat-n">4</div>
              <div className="proj-stat-l">Sessions</div>
            </div>
            <div className="proj-stat">
              <div className="proj-stat-n o">74</div>
              <div className="proj-stat-l">Best score</div>
            </div>
            <div className="proj-stat">
              <div className="proj-stat-n">+33</div>
              <div className="proj-stat-l">Points gained</div>
            </div>
            <div className="proj-stat">
              <div className="proj-stat-n">18m</div>
              <div className="proj-stat-l">Practised</div>
            </div>
          </div>
          <Link to="/app/session/setup" className="btn-primary btn-sm" style={{ width: '100%', marginBottom: 8, justifyContent: 'center' }}>
            + Add session
          </Link>
          <button type="button" className="btn-outline btn-sm" style={{ width: '100%' }}>
            Edit project
          </button>

          <div style={{ marginTop: 'auto', paddingTop: 24, borderTop: 'var(--border)' }}>
            <p className="label" style={{ marginBottom: 8 }}>
              Audience profile
            </p>
            <p style={{ fontSize: 11, fontWeight: 300, color: 'var(--grey-400)', lineHeight: 1.6 }}>Critical stakes · Persuasive tone · Formality 4/5</p>
          </div>
        </div>

        <div className="proj-detail-main">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
            <div>
              <p className="eyebrow" style={{ marginBottom: 8 }}>
                Progress
              </p>
              <div style={{ height: 80, position: 'relative' }}>
                <svg width="100%" height="80" viewBox="0 0 480 80" preserveAspectRatio="none">
                  <line x1="0" y1="20" x2="480" y2="20" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
                  <line x1="0" y1="40" x2="480" y2="40" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
                  <line x1="0" y1="60" x2="480" y2="60" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
                  <line x1="0" y1="34" x2="480" y2="34" stroke="var(--accent-gold)" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
                  <polyline fill="rgba(201,162,39,0.08)" stroke="none" points="40,64 160,52 280,42 400,28 400,80 40,80" />
                  <polyline fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" strokeLinejoin="round" points="40,64 160,52 280,42 400,28" />
                  <circle cx="40" cy="64" r="3" fill="rgba(0,0,0,0.2)" />
                  <circle cx="160" cy="52" r="3" fill="rgba(0,0,0,0.2)" />
                  <circle cx="280" cy="42" r="3" fill="rgba(0,0,0,0.2)" />
                  <circle cx="400" cy="28" r="4" fill="var(--accent-gold)" stroke="var(--white)" strokeWidth="2" />
                </svg>
              </div>
            </div>
            <Link to="/app/session/setup" className="btn-outline btn-sm" style={{ display: 'inline-flex' }}>
              + Add session
            </Link>
          </div>

          <p className="eyebrow" style={{ marginBottom: 0 }}>
            Sessions
          </p>
          <div className="session-list">
            <div className="session-row header-row">
              <span className="sr-n">#</span>
              <span className="sr-n">Date</span>
              <span className="sr-n">Audience note</span>
              <span className="sr-n">Score</span>
              <span className="sr-n">Duration</span>
              <span className="sr-n" />
            </div>
            <Link to="/app/debrief" className="session-row">
              <span className="sr-n" style={{ color: 'var(--accent-gold)' }}>
                04
              </span>
              <div className="sr-date">
                22 Mar 2026<span>2 days ago</span>
              </div>
              <span className="sr-audience">Same deck, focus on pace</span>
              <span className="sr-score mid">67</span>
              <span className="sr-dur">3m 47s</span>
              <span className="sr-action">View debrief</span>
            </Link>
            <Link to="/app/debrief" className="session-row">
              <span className="sr-n" style={{ color: 'var(--accent-gold)' }}>
                03
              </span>
              <div className="sr-date">
                20 Mar 2026<span>4 days ago</span>
              </div>
              <span className="sr-audience">Added Q&A section</span>
              <span className="sr-score mid">74</span>
              <span className="sr-dur">4m 12s</span>
              <span className="sr-action">View debrief</span>
            </Link>
            <Link to="/app/debrief" className="session-row">
              <span className="sr-n">02</span>
              <div className="sr-date">
                15 Mar 2026<span>9 days ago</span>
              </div>
              <span className="sr-audience">Market sizing run</span>
              <span className="sr-score mid">53</span>
              <span className="sr-dur">3m 20s</span>
              <span className="sr-action">View debrief</span>
            </Link>
            <Link to="/app/debrief" className="session-row">
              <span className="sr-n">01</span>
              <div className="sr-date">
                10 Mar 2026<span>14 days ago</span>
              </div>
              <span className="sr-audience">First run through</span>
              <span className="sr-score lo">41</span>
              <span className="sr-dur">2m 51s</span>
              <span className="sr-action">View debrief</span>
            </Link>
          </div>
        </div>
      </div>
    </PageMotion>
  )
}
