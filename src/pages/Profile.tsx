import { useCallback, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageMotion } from '../components/PageMotion'
import { ScrollVelocity } from '../components/ScrollVelocity'
import { getUserName, getUserPhoto, setUserPhoto, signOut } from '../lib/authSession'

function useDisplayName() {
  const stored = getUserName()
  return stored || 'Your Name'
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join('')
}

const MAX_PHOTO_SIZE = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function resizeImage(file: File, maxDim = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(maxDim / img.width, maxDim / img.height, 1)
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

export function Profile() {
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const displayName = useDisplayName()
  const [photo, setPhoto] = useState(getUserPhoto)

  const handleLogOut = useCallback(() => {
    void signOut().then(() => navigate('/login', { replace: true }))
  }, [navigate])

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) return
    if (file.size > MAX_PHOTO_SIZE) return
    try {
      const dataUrl = await resizeImage(file)
      setUserPhoto(dataUrl)
      setPhoto(dataUrl)
    } catch {
      /* failed to process image */
    }
    e.target.value = ''
  }

  return (
    <PageMotion className="page page--app">
      <div ref={scrollRef} className="profile-page-scroll">
        <section className="profile-scroll-hero" aria-label="Profile">
          <div className="profile-scroll-marquee">
            <ScrollVelocity
              scrollContainerRef={scrollRef}
              texts={[`${displayName} · `, `${displayName} · `]}
              velocity={72}
              numCopies={8}
              className="profile-scroll-name"
              parallaxClassName="profile-scroll-parallax"
              scrollerClassName="profile-scroll-scroller"
            />
          </div>

          <div className="profile-hero-row">
            <div className="profile-hero-identity">
              <div
                className="avatar-lg avatar-lg--editable"
                role="button"
                tabIndex={0}
                aria-label={photo ? 'Change profile photo' : 'Add profile photo'}
                onClick={handleAvatarClick}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleAvatarClick() }}
              >
                {photo ? (
                  <img src={photo} alt="Profile" className="avatar-img" />
                ) : (
                  initials(displayName)
                )}
                <div className="avatar-lg__overlay">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="visually-hidden"
                onChange={handleFileChange}
              />
              <div>
                <p className="profile-name">{displayName}</p>
                <p className="profile-role">MBA Student · IE Business School</p>
              </div>
            </div>
            <button type="button" className="profile-hero-logout" onClick={handleLogOut}>
              Log out
            </button>
          </div>

          <p className="profile-hero-privacy">
            Video never leaves your device. All analysis runs locally in your browser.
          </p>
        </section>

        <div className="profile-scroll-content">
          <h2 className="profile-scroll-h2">
            Your <strong>profile</strong>
          </h2>
          <p className="sub">7 sessions completed across 3 projects · Last session 2 days ago</p>

          <div className="stats-row">
            <div className="stat-box">
              <div className="stat-n">7</div>
              <div className="stat-l">Sessions</div>
              <div className="stat-trend">↑ 3 this week</div>
            </div>
            <div className="stat-box">
              <div className="stat-n">
                <span className="o">74</span>
              </div>
              <div className="stat-l">Best score</div>
              <div className="stat-trend">↑ from 41</div>
            </div>
            <div className="stat-box">
              <div className="stat-n">23m</div>
              <div className="stat-l">Practised</div>
              <div className="stat-trend">↑ improving</div>
            </div>
            <div className="stat-box">
              <div className="stat-n">1.8</div>
              <div className="stat-l">Avg fillers/min</div>
              <div className="stat-trend">↓ from 6.2</div>
            </div>
          </div>

          <div className="chart-box">
            <div className="chart-hd">
              <span className="chart-title">Confidence score over time</span>
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: 'rgba(0,0,0,0.25)' }} />
                  Score
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: 'var(--orange)' }} />
                  Target
                </div>
              </div>
            </div>
            <div className="chart-area">
              <svg width="100%" height="150" viewBox="0 0 600 150" preserveAspectRatio="none">
                <line x1="0" y1="30" x2="600" y2="30" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
                <line x1="0" y1="75" x2="600" y2="75" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
                <line x1="0" y1="120" x2="600" y2="120" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
                <line x1="0" y1="48" x2="600" y2="48" stroke="var(--accent-gold)" strokeWidth="1" strokeDasharray="4,4" opacity="0.35" />
                <polyline fill="rgba(201,162,39,0.08)" stroke="none" points="30,118 110,102 190,98 270,88 350,72 430,66 510,52 510,150 30,150" />
                <polyline
                  fill="none"
                  stroke="rgba(0,0,0,0.25)"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points="30,118 110,102 190,98 270,88 350,72 430,66 510,52"
                />
                <circle cx="30" cy="118" r="3" fill="rgba(0,0,0,0.2)" />
                <circle cx="110" cy="102" r="3" fill="rgba(0,0,0,0.2)" />
                <circle cx="190" cy="98" r="3" fill="rgba(0,0,0,0.2)" />
                <circle cx="270" cy="88" r="3" fill="rgba(0,0,0,0.2)" />
                <circle cx="350" cy="72" r="3" fill="rgba(0,0,0,0.2)" />
                <circle cx="430" cy="66" r="3" fill="rgba(0,0,0,0.2)" />
                <circle cx="510" cy="52" r="4" fill="var(--accent-gold)" stroke="var(--white)" strokeWidth="2" />
              </svg>
            </div>
          </div>

          <p className="eyebrow" style={{ marginBottom: 12 }}>
            Recent sessions
          </p>
          <div className="tbl">
            <div className="tbl-hd">
              <span>Date</span>
              <span>Audience</span>
              <span>Score</span>
              <span>Duration</span>
              <span />
            </div>
            <Link to="/app/debrief" className="tbl-row">
              <div className="td-date">
                22 Mar 2026<span>2 days ago</span>
              </div>
              <span className="td-audience">VC pitch — sceptical investors, Series A</span>
              <span className="td-score mid">67</span>
              <span className="td-dur">3m 47s</span>
              <span className="td-action">View debrief</span>
            </Link>
            <Link to="/app/debrief" className="tbl-row">
              <div className="td-date">
                20 Mar 2026<span>4 days ago</span>
              </div>
              <span className="td-audience">VC pitch — same audience, second run</span>
              <span className="td-score mid">74</span>
              <span className="td-dur">4m 12s</span>
              <span className="td-action">View debrief</span>
            </Link>
            <div className="tbl-row">
              <div className="td-date">
                18 Mar 2026<span>6 days ago</span>
              </div>
              <span className="td-audience">McKinsey case interview, final round</span>
              <span className="td-score mid">61</span>
              <span className="td-dur">6m 03s</span>
              <span className="td-action">View debrief</span>
            </div>
            <div className="tbl-row">
              <div className="td-date">15 Mar 2026</div>
              <span className="td-audience">Thesis defence, 3 examiners</span>
              <span className="td-score mid">58</span>
              <span className="td-dur">5m 31s</span>
              <span className="td-action">View debrief</span>
            </div>
            <div className="tbl-row">
              <div className="td-date">05 Mar 2026</div>
              <span className="td-audience">VC pitch — first session ever</span>
              <span className="td-score lo">41</span>
              <span className="td-dur">2m 09s</span>
              <span className="td-action">View debrief</span>
            </div>
          </div>
        </div>
      </div>
    </PageMotion>
  )
}
