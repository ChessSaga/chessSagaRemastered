import {NavLink, Outlet, useNavigate} from 'react-router-dom'
import {clearAdminSession, getAdminEmail} from '../authStore'

const navItems = [
  {to: '/admin', label: 'Dashboard', end: true},
  {to: '/admin/upload', label: 'Upload'},
  {to: '/admin/videos', label: 'Videos'},
  {to: '/admin/lectures', label: 'Lecture Mapping'},
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const adminEmail = getAdminEmail()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Lecture Video Admin</p>
            <h1 className="text-xl font-semibold text-white">Chess Saga Control Center</h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-300">{adminEmail}</p>
            <button
              type="button"
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500"
              onClick={() => {
                clearAdminSession()
                navigate('/login', {replace: true})
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                end={item.end}
                to={item.to}
                className={({isActive}) =>
                  `block rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/40'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
