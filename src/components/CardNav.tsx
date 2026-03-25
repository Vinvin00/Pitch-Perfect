import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { isSignedIn, getUserName, getUserPhoto } from '../lib/authSession'
import { CircularRotatingLogo } from './CircularRotatingLogo'
import './CardNav.css'

type CardNavLink = {
  label: string
  to: string
  ariaLabel?: string
}

export type CardNavItem = {
  label: string
  bgColor: string
  textColor: string
  links?: CardNavLink[]
}

export type CardNavProps = {
  items: CardNavItem[]
  className?: string
  /** Show only on routes that start with this prefix (e.g. "/app") */
  routePrefix?: string
  baseColor?: string
  menuColor?: string
  buttonBgColor?: string
  buttonTextColor?: string
  ease?: string
  ctaLabel?: string
  ctaTo?: string
}

function ArrowUpRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

export function CardNav({
  items,
  className = '',
  routePrefix = '/app',
  baseColor = '#fff',
  menuColor = '#000',
  buttonBgColor = '#111',
  buttonTextColor = '#fff',
  ease = 'power3.out',
  ctaLabel = 'New Session',
  ctaTo = '/app/session/setup',
}: CardNavProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const navRef = useRef<HTMLElement | null>(null)
  const cardsRef = useRef<Array<HTMLDivElement | null>>([])
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const signedIn = isSignedIn()

  const isEnabled = useMemo(() => {
    if (!routePrefix) return true
    return location.pathname.startsWith(routePrefix)
  }, [location.pathname, routePrefix])

  const calculateHeight = () => {
    const navEl = navRef.current
    if (!navEl) return 260

    const isMobile = window.matchMedia('(max-width: 768px)').matches
    if (isMobile) {
      const contentEl = navEl.querySelector<HTMLElement>('.card-nav-content')
      if (contentEl) {
        // Temporarily "un-hide" content to measure its natural height.
        const wasVisible = contentEl.style.visibility
        const wasPointerEvents = contentEl.style.pointerEvents
        const wasPosition = contentEl.style.position
        const wasHeight = contentEl.style.height

        contentEl.style.visibility = 'visible'
        contentEl.style.pointerEvents = 'auto'
        contentEl.style.position = 'static'
        contentEl.style.height = 'auto'

        contentEl.offsetHeight

        const topBar = 60
        const padding = 16
        const contentHeight = contentEl.scrollHeight

        contentEl.style.visibility = wasVisible
        contentEl.style.pointerEvents = wasPointerEvents
        contentEl.style.position = wasPosition
        contentEl.style.height = wasHeight

        return topBar + contentHeight + padding
      }
    }

    return 260
  }

  const createTimeline = () => {
    const navEl = navRef.current
    if (!navEl) return null

    gsap.set(navEl, { height: 60, overflow: 'hidden' })

    const cardEls = cardsRef.current.filter(Boolean) as HTMLDivElement[]
    gsap.set(cardEls, { y: 50, opacity: 0 })

    const tl = gsap.timeline({ paused: true })

    tl.to(navEl, {
      height: calculateHeight(),
      duration: 0.4,
      ease,
    })

    tl.to(cardEls, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 }, '-=0.1')

    return tl
  }

  useLayoutEffect(() => {
    if (!isEnabled) return
    const tl = createTimeline()
    tlRef.current = tl

    return () => {
      tl?.kill()
      tlRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ease, items])

  useLayoutEffect(() => {
    if (!isEnabled) return

    const handleResize = () => {
      const tl = tlRef.current
      if (!tl) return

      if (isExpanded) {
        const newHeight = calculateHeight()
        gsap.set(navRef.current, { height: newHeight })

        tlRef.current?.kill()
        const newTl = createTimeline()
        if (newTl) {
          newTl.progress(1)
          tlRef.current = newTl
        }
      } else {
        tlRef.current?.kill()
        const newTl = createTimeline()
        if (newTl) tlRef.current = newTl
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded, isEnabled])

  const closeMenu = () => {
    const tl = tlRef.current
    if (!tl) {
      setIsHamburgerOpen(false)
      setIsExpanded(false)
      return
    }

    setIsHamburgerOpen(false)
    tl.eventCallback('onReverseComplete', () => setIsExpanded(false))
    tl.reverse()
  }

  const toggleMenu = () => {
    const tl = tlRef.current
    if (!tl) return
    if (!isExpanded) {
      setIsHamburgerOpen(true)
      setIsExpanded(true)
      tl.play(0)
    } else {
      closeMenu()
    }
  }

  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    cardsRef.current[i] = el
  }

  if (!isEnabled) return null

  return (
    <div className={`card-nav-container${className ? ` ${className}` : ''}`.trim()}>
      <nav ref={navRef} className={`card-nav${isExpanded ? ' open' : ''}`} style={{ backgroundColor: baseColor }}>
        <div className="card-nav-top">
          <div
            className={`hamburger-menu${isHamburgerOpen ? ' open' : ''}`}
            role="button"
            aria-label={isExpanded ? 'Close menu' : 'Open menu'}
            tabIndex={0}
            onClick={toggleMenu}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') toggleMenu()
            }}
            style={{ color: menuColor }}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>

          <div className="logo-container" aria-hidden>
            <CircularRotatingLogo size={28} className="card-nav__logo" />
          </div>

          {signedIn ? (
            <Link to="/app/profile" className="card-nav-profile-link" aria-label="Profile" title="Profile">
              <div className="avatar-sm">
                {getUserPhoto() ? (
                  <img src={getUserPhoto()} alt="Profile" className="avatar-img" />
                ) : (
                  getUserName()
                    .split(/\s+/)
                    .filter(Boolean)
                    .map((w) => w[0].toUpperCase())
                    .slice(0, 2)
                    .join('') || 'Me'
                )}
              </div>
            </Link>
          ) : (
            <button type="button" className="card-nav-cta-button" style={{ backgroundColor: buttonBgColor, color: buttonTextColor }} onClick={() => navigate(ctaTo)}>
              {ctaLabel}
            </button>
          )}
        </div>

        <div className="card-nav-content" aria-hidden={!isExpanded}>
          {items.slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card"
              ref={setCardRef(idx)}
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="nav-card-label">{item.label}</div>

              <div className="nav-card-links">
                {(item.links || []).map((lnk, i) => (
                  <Link
                    key={`${lnk.label}-${i}`}
                    to={lnk.to}
                    className="nav-card-link"
                    aria-label={lnk.ariaLabel || lnk.label}
                    onClick={(e) => {
                      // Let navigation happen, but also close the menu for the next view.
                      e.currentTarget.blur()
                      closeMenu()
                    }}
                  >
                    <ArrowUpRightIcon className="nav-card-link-icon" />
                    {lnk.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  )
}

