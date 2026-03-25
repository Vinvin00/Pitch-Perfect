import { useEffect, useRef, useState, type ReactNode } from 'react'

type ScrollRevealProps = {
  children: ReactNode
  /** Extra delay after element enters view (ms), for staggered grids */
  delayMs?: number
  className?: string
}

export function ScrollReveal({ children, delayMs = 0, className = '' }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting)
      },
      { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`scroll-reveal${visible ? ' scroll-reveal--visible' : ''}${className ? ` ${className}` : ''}`.trim()}
      style={
        delayMs > 0
          ? { transitionDelay: visible ? `${delayMs}ms` : '0ms' }
          : undefined
      }
    >
      {children}
    </div>
  )
}
