import {useState} from 'react'
import {Link, NavLink, useLocation} from 'react-router-dom'

const NAV_LINKS = [
  {to: '/', label: 'Home'},
  {to: '/programs', label: 'Programs'},
  {to: '/trial', label: 'Free Trial'},
  {to: '/enroll', label: 'Enroll'},
  {to: '/dashboard', label: 'Dashboard'},
  {to: '/contact', label: 'Contact'},
  {to: '/blogs', label: 'Blogs'},
  { to: '/news', label: 'News' },
  { to: '/about', label: 'About' }
]

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2" aria-label="Chess Saga Home">
            <img
              src="/icons/Chess Saga Logo.png"
              alt="Chess Saga logo"
              className="h-9 w-9 rounded-lg border border-slate-200 object-cover"
              loading="lazy"
            />
            <span className="text-lg font-semibold text-[var(--color-primary)]">Chess Saga</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({isActive}) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-50 text-[var(--color-primary)]'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/trial"
              className="hidden rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#082f58] md:inline-flex"
            >
              Book Free Trial
            </Link>
            <button
              type="button"
              className="inline-flex rounded-lg border border-slate-300 p-2 text-slate-700 md:hidden"
              aria-expanded={isOpen}
              aria-controls="mobile-nav"
              aria-label="Toggle menu"
              onClick={() => setIsOpen((prev) => !prev)}
            >
              <span className="sr-only">Menu</span>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </div>

        {isOpen ? (
          <nav id="mobile-nav" className="border-t border-slate-200 bg-white px-4 py-3 md:hidden" aria-label="Mobile">
            <div className="grid gap-2">
              {NAV_LINKS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setIsOpen(false)}
                  className={({isActive}) =>
                    `rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive ? 'bg-blue-50 text-[var(--color-primary)]' : 'text-slate-700'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>
        ) : null}
      </header>

      {location.pathname !== '/trial' ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur md:hidden">
          <Link
            to="/trial"
            className="block rounded-lg bg-[var(--color-primary)] px-4 py-3 text-center text-sm font-semibold text-white"
          >
            Book Free Trial Class
          </Link>
        </div>
      ) : null}
    </>
  )
}
