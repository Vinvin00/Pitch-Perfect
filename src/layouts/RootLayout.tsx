import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { CardNav } from '../components/CardNav'
import { RouteFade } from '../components/RouteFade'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export function RootLayout() {
  return (
    <>
      <ScrollToTop />
      <div
        className="pitchcoach-bento-outer"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <div className="pitchcoach-bento-shell">
          <RouteFade />
        </div>
      </div>
      <CardNav
        items={[
          {
            label: 'About',
            bgColor: '#0D0716',
            textColor: '#fff',
            links: [
              { label: 'Home', to: '/app/home', ariaLabel: 'About Home' },
              { label: 'Profile', to: '/app/profile', ariaLabel: 'About Profile' },
            ],
          },
          {
            label: 'Projects',
            bgColor: '#170D27',
            textColor: '#fff',
            links: [
              { label: 'Projects', to: '/app/projects', ariaLabel: 'Projects' },
              { label: 'New session', to: '/app/session/setup', ariaLabel: 'New session' },
            ],
          },
          {
            label: 'Contact',
            bgColor: '#271E37',
            textColor: '#fff',
            links: [
              { label: 'Profile', to: '/app/profile', ariaLabel: 'Contact Profile' },
              { label: 'Projects', to: '/app/projects', ariaLabel: 'Contact Projects' },
            ],
          },
        ]}
        routePrefix="/app"
        ctaTo="/app/session/setup"
        ctaLabel="New Session"
        baseColor="#fff"
        menuColor="#000"
        buttonBgColor="#111"
        buttonTextColor="#fff"
        ease="power3.out"
      />
    </>
  )
}
