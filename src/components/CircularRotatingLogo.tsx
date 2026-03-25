import { useId, useMemo } from 'react'

type CircularRotatingLogoProps = {
  className?: string
  /** Viewport size in px (square) */
  size?: number
}

/**
 * Montserrat semibold text on a circular path, stretched to close the loop; rotates slowly (nav mark).
 */
export function CircularRotatingLogo({ className, size = 52 }: CircularRotatingLogoProps) {
  const rawId = useId().replace(/:/g, '')
  const pathId = `pc-ring-${rawId}`
  const r = 30.5
  const pathLen = 2 * Math.PI * r
  const pathD = useMemo(
    () => `M 50 ${50 - r} A ${r} ${r} 0 1 1 50 ${50 + r} A ${r} ${r} 0 1 1 50 ${50 - r} Z`,
    [r]
  )

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden
    >
      <defs>
        <path id={pathId} fill="none" pathLength={pathLen} d={pathD} />
      </defs>
      <g className="circular-logo__spin">
        <text
          fill="currentColor"
          fontFamily="'Inter', system-ui, sans-serif"
          fontWeight={600}
          fontSize={12}
          dominantBaseline="central"
          textLength={pathLen}
          lengthAdjust="spacing"
          letterSpacing={0}
        >
          <textPath href={`#${pathId}`} startOffset="0%">
            PITCH · PERFECT · PITCH · PERFECT ·
          </textPath>
        </text>
      </g>
    </svg>
  )
}
