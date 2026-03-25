import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'

const ease = [0.25, 0.1, 0.25, 1] as const

/**
 * Wraps routed content with cross-fade on navigation. Paired with `.route-motion` in CSS.
 */
export function RouteFade() {
  const location = useLocation()
  const reduce = useReducedMotion()
  const duration = reduce ? 0 : 0.42

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        className="route-motion"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration, ease }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  )
}
