import {useState} from 'react'
import {Helmet} from 'react-helmet-async'
import {useLocation, useNavigate} from 'react-router-dom'
import adminApi from '../adminApi'
import {setAdminSession} from '../authStore'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const {data} = await adminApi.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      })

      if (!data?.success || !data?.token) {
        throw new Error(data?.error || 'Invalid credentials')
      }

      setAdminSession(data.token, data.admin?.email || email)
      const target = location.state?.from || '/admin'
      navigate(target, {replace: true})
    } catch (submitError) {
      setError(submitError?.response?.data?.error || submitError.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <Helmet>
        <title>Admin Login - Chess Saga</title>
      </Helmet>

      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Secure Area</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Lecture Video Admin Login</h1>
        <p className="mt-2 text-sm text-slate-400">Use your admin credentials to manage uploads and lecture mappings.</p>

        <div className="mt-5 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@domain.com"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-70"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </div>

        {error ? <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}
      </form>
    </main>
  )
}
