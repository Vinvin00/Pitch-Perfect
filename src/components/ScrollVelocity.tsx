import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react'
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useVelocity,
  useAnimationFrame,
} from 'motion/react'
import './ScrollVelocity.css'

type VelocityMapping = { input: number[]; output: number[] }

function useElementWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    function updateWidth() {
      if (ref.current) setWidth(ref.current.offsetWidth)
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [ref])

  return width
}

function wrap(min: number, max: number, v: number) {
  const range = max - min
  const mod = (((v - min) % range) + range) % range
  return mod + min
}

type VelocityTextProps = {
  children: ReactNode
  baseVelocity: number
  scrollContainerRef?: RefObject<HTMLElement | null>
  className?: string
  damping?: number
  stiffness?: number
  numCopies: number
  velocityMapping?: VelocityMapping
  parallaxClassName: string
  scrollerClassName: string
  parallaxStyle?: CSSProperties
  scrollerStyle?: CSSProperties
}

function VelocityText({
  children,
  baseVelocity,
  scrollContainerRef,
  className = '',
  damping,
  stiffness,
  numCopies,
  velocityMapping,
  parallaxClassName,
  scrollerClassName,
  parallaxStyle,
  scrollerStyle,
}: VelocityTextProps) {
  const baseX = useMotionValue(0)
  const scrollOptions = scrollContainerRef ? { container: scrollContainerRef } : {}
  const { scrollY } = useScroll(scrollOptions)
  const scrollVelocity = useVelocity(scrollY)
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: damping ?? 50,
    stiffness: stiffness ?? 400,
  })
  const velocityFactor = useTransform(
    smoothVelocity,
    velocityMapping?.input ?? [0, 1000],
    velocityMapping?.output ?? [0, 5],
    { clamp: false },
  )

  const copyRef = useRef<HTMLSpanElement | null>(null)
  const copyWidth = useElementWidth(copyRef)

  const x = useTransform(baseX, (v) => {
    if (copyWidth === 0) return '0px'
    return `${wrap(-copyWidth, 0, v)}px`
  })

  const directionFactor = useRef(1)
  useAnimationFrame((_t, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000)

    if (velocityFactor.get() < 0) directionFactor.current = -1
    else if (velocityFactor.get() > 0) directionFactor.current = 1

    moveBy += directionFactor.current * moveBy * velocityFactor.get()
    baseX.set(baseX.get() + moveBy)
  })

  const spans = Array.from({ length: numCopies }, (_, i) => (
    <span className={className} key={i} ref={i === 0 ? copyRef : undefined}>
      {children}&nbsp;
    </span>
  ))

  return (
    <span className={parallaxClassName} style={parallaxStyle}>
      <motion.span className={scrollerClassName} style={{ x, ...scrollerStyle }}>
        {spans}
      </motion.span>
    </span>
  )
}

export type ScrollVelocityProps = {
  scrollContainerRef?: RefObject<HTMLElement | null>
  texts?: ReactNode[]
  velocity?: number
  className?: string
  damping?: number
  stiffness?: number
  numCopies?: number
  velocityMapping?: VelocityMapping
  parallaxClassName?: string
  scrollerClassName?: string
  parallaxStyle?: CSSProperties
  scrollerStyle?: CSSProperties
}

export function ScrollVelocity({
  scrollContainerRef,
  texts = [],
  velocity = 100,
  className = '',
  damping = 50,
  stiffness = 400,
  numCopies = 6,
  velocityMapping = { input: [0, 1000], output: [0, 5] },
  parallaxClassName = 'parallax',
  scrollerClassName = 'scroller',
  parallaxStyle,
  scrollerStyle,
}: ScrollVelocityProps) {
  return (
    <span>
      {texts.map((text, index) => (
        <VelocityText
          key={`${index}-${text}`}
          className={className}
          baseVelocity={index % 2 !== 0 ? -velocity : velocity}
          scrollContainerRef={scrollContainerRef}
          damping={damping}
          stiffness={stiffness}
          numCopies={numCopies}
          velocityMapping={velocityMapping}
          parallaxClassName={parallaxClassName}
          scrollerClassName={scrollerClassName}
          parallaxStyle={parallaxStyle}
          scrollerStyle={scrollerStyle}
        >
          {text}
        </VelocityText>
      ))}
    </span>
  )
}

export default ScrollVelocity
