import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from 'react'
import './BorderGlow.css'

function parseHslTriplet(glowColor: string): { h: number; s: number; l: number } {
  const parts = glowColor.trim().split(/\s+/).map(Number)
  const h = Number.isFinite(parts[0]) ? parts[0] : 268
  const s = Number.isFinite(parts[1]) ? parts[1] : 80
  const l = Number.isFinite(parts[2]) ? parts[2] : 80
  return { h, s, l }
}

function glowCssVars(glowColor: string): CSSProperties {
  const { h, s, l } = parseHslTriplet(glowColor)
  const base = `${h} ${s}% ${l}%`
  return {
    ['--glow-color' as string]: `hsl(${base})`,
    ['--glow-color-60' as string]: `hsl(${base} / 60%)`,
    ['--glow-color-50' as string]: `hsl(${base} / 50%)`,
    ['--glow-color-40' as string]: `hsl(${base} / 40%)`,
    ['--glow-color-30' as string]: `hsl(${base} / 30%)`,
    ['--glow-color-20' as string]: `hsl(${base} / 20%)`,
    ['--glow-color-10' as string]: `hsl(${base} / 10%)`,
  } as CSSProperties
}

export type BorderGlowProps = {
  children: ReactNode
  className?: string
  contentClassName?: string
  edgeSensitivity?: number
  /** Space-separated H S L, e.g. `"40 80 80"` → modern hsl() */
  glowColor?: string
  backgroundColor?: string
  borderRadius?: number
  glowRadius?: number
  glowIntensity?: number
  coneSpread?: number
  animated?: boolean
  colors?: string[]
  style?: CSSProperties
  /** Softer shadows / border for light UI (PitchCoach) */
  variant?: 'default' | 'light'
}

export function BorderGlow({
  children,
  className = '',
  contentClassName = '',
  edgeSensitivity = 30,
  glowColor = '268 72% 78%',
  backgroundColor = 'rgba(255, 255, 255, 0.82)',
  borderRadius = 9,
  glowRadius = 40,
  glowIntensity = 1,
  coneSpread = 25,
  animated = false,
  colors = ['#c0a1f9', '#d4a574', '#7eb8da'],
  style,
  variant = 'light',
}: BorderGlowProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const sweepRef = useRef<number>(0)
  const rafRef = useRef<number>(0)

  const gradientBase = `linear-gradient(125deg, ${colors.join(', ')})`

  const setProximity = useCallback((el: HTMLDivElement, clientX: number, clientY: number) => {
    const rect = el.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    if (w < 1 || h < 1) return

    const x = clientX - rect.left
    const y = clientY - rect.top
    const dEdge = Math.min(x, y, w - x, h - y)
    const influence = Math.max(32, Math.min(w, h) * 0.38)
    let proximity = 100 - Math.min(100, (dEdge / influence) * 100)
    proximity = Math.max(0, Math.min(100, proximity))

    const cx = w / 2
    const cy = h / 2
    const angleDeg = (Math.atan2(y - cy, x - cx) * 180) / Math.PI

    el.style.setProperty('--edge-proximity', String(proximity))
    el.style.setProperty('--cursor-angle', `${angleDeg}deg`)
  }, [])

  const clearProximity = useCallback((el: HTMLDivElement) => {
    el.style.setProperty('--edge-proximity', '0')
  }, [])

  const onMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const el = rootRef.current
      if (!el) return
      setProximity(el, e.clientX, e.clientY)
    },
    [setProximity],
  )

  const onLeave = useCallback(() => {
    const el = rootRef.current
    if (!el) return
    clearProximity(el)
  }, [clearProximity])

  useEffect(() => {
    if (!animated || !rootRef.current) return
    const el = rootRef.current
    let t = 0
    const tick = () => {
      t += 0.018
      sweepRef.current = t
      el.classList.add('sweep-active')
      const deg = (t * 55) % 360
      el.style.setProperty('--cursor-angle', `${deg}deg`)
      const wave = (Math.sin(t * 1.4) * 0.5 + 0.5) * 55 + 25
      el.style.setProperty('--edge-proximity', String(wave))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafRef.current)
      el.classList.remove('sweep-active')
      clearProximity(el)
    }
  }, [animated, clearProximity])

  const cssVars = {
    ...glowCssVars(glowColor),
    ['--edge-sensitivity' as string]: String(edgeSensitivity),
    ['--border-radius' as string]: `${borderRadius}px`,
    ['--glow-padding' as string]: `${glowRadius}px`,
    ['--cone-spread' as string]: String(coneSpread),
    ['--card-bg' as string]: backgroundColor,
    ['--gradient-base' as string]: gradientBase,
    ['--fill-opacity' as string]: String(0.45 * glowIntensity),
  } as CSSProperties

  return (
    <div
      ref={rootRef}
      className={`border-glow-card${variant === 'light' ? ' border-glow-card--light' : ''}${className ? ` ${className}` : ''}`.trim()}
      style={{ ...style, ...cssVars }}
      onMouseMove={animated ? undefined : onMove}
      onMouseLeave={animated ? undefined : onLeave}
    >
      <div className="edge-light" aria-hidden />
      <div className={`border-glow-inner${contentClassName ? ` ${contentClassName}` : ''}`.trim()}>{children}</div>
    </div>
  )
}
