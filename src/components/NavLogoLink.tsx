import type { ComponentProps } from 'react'
import { Link } from 'react-router-dom'
import { CircularRotatingLogo } from './CircularRotatingLogo'

export type NavLogoLinkProps = Omit<ComponentProps<typeof Link>, 'children'> & {
  /** Pixel size of the circular SVG (default 52). */
  logoSize?: number
}

/**
 * Primary nav mark: circular rotating wordmark, used across marketing and app shells.
 */
export function NavLogoLink({
  className = '',
  logoSize,
  'aria-label': ariaLabel = 'Pitch Perfect home',
  ...rest
}: NavLogoLinkProps) {
  return (
    <Link
      className={`nav-logo nav-logo--circular ${className}`.trim()}
      aria-label={ariaLabel}
      {...rest}
    >
      <CircularRotatingLogo size={logoSize} />
    </Link>
  )
}
