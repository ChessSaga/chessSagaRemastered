import { Link, NavLink } from 'react-router-dom'

export default function Navbar() {
  const links = [
    { to: '/', label: 'Home' },
    { to: '/blogs', label: 'Blogs' },
    { to: '/news', label: 'News' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2">
            <img
              src="/icons/Chess Saga Logo.png"
              alt="Chesssaga logo"
              className="h-8 w-8 rounded-md border border-slate-200 object-cover"
              loading="lazy"
            />
            <span className="font-bold text-xl tracking-tight text-[#0f172a]">Chesssaga</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-2 text-sm rounded-md transition-colors ${
                    isActive
                      ? 'text-[#0f172a] bg-[#eff6ff]'
                      : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#eff6ff]'
                  }`
                }
                end={item.to === '/'}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Simple mobile menu button (no dropdown logic to keep constraints) */}
          <div className="sm:hidden">
            <nav className="flex items-center gap-2">
              {links.slice(0,3).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-2 py-1 text-xs rounded-md ${
                      isActive ? 'text-[#0f172a] bg-[#eff6ff]' : 'text-[#64748b]'
                    }`
                  }
                  end={item.to === '/'}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}
