import { motion, useReducedMotion } from 'framer-motion'
import type { CSSProperties, ReactNode } from 'react'

type PageMotionProps = {
  children: ReactNode
  /** Merged onto the animated root (usually `page` or `page page--landing`) */
  className?: string
  style?: CSSProperties
}

/**
 * Page shell with a slight rise after navigation. Opacity is handled by `RouteFade` to avoid double fades.
 */
export function PageMotion({ children, className = 'page', style }: PageMotionProps) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className={className}
      style={style}
      initial={reduce ? { y: 0 } : { y: 16 }}
      animate={{ y: 0 }}
      transition={{
        duration: reduce ? 0 : 0.52,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  )
}
