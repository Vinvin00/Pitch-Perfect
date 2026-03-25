import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

type BubbleMenuItem = {
  key: string
  label: string
  to: string
}

const items: BubbleMenuItem[] = [
  { key: 'home', label: 'Home', to: '/app/home' },
  { key: 'projects', label: 'Projects', to: '/app/projects' },
  { key: 'new', label: 'New session', to: '/app/session/setup' },
  { key: 'profile', label: 'Profile', to: '/app/profile' },
]

export function BubbleMenu() {
  const reduce = useReducedMotion()
  const location = useLocation()
  const isApp = location.pathname.startsWith('/app')
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const el = rootRef.current
      if (!el) return
      if (e.target instanceof Node && el.contains(e.target)) return
      setOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown, { capture: true })
    return () => window.removeEventListener('pointerdown', onPointerDown, { capture: true } as any)
  }, [open])

  const activeKey = useMemo(() => {
    const match = items.find((it) => location.pathname === it.to)
    return match?.key ?? null
  }, [location.pathname])

  if (!isApp) return null

  return (
    <div ref={rootRef} className="bubble-menu" data-open={open ? 'true' : 'false'}>
      <button
        type="button"
        className="bubble-menu__fab"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="bubble-menu__fab-icon" aria-hidden>
          {open ? '×' : '≡'}
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="panel"
            id={menuId}
            className="bubble-menu__panel"
            initial={reduce ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: reduce ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
            role="menu"
          >
            {items.map((it, idx) => (
              <motion.div
                key={it.key}
                initial={reduce ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: reduce ? 0 : 0.22, delay: reduce ? 0 : 0.03 + idx * 0.04 }}
              >
                <Link
                  to={it.to}
                  className={`bubble-menu__item${activeKey === it.key ? ' bubble-menu__item--active' : ''}`}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  <span className="bubble-menu__item-label">{it.label}</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

