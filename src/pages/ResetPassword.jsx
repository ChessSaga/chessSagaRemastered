import {useEffect, useState} from 'react'
import {Helmet} from 'react-helmet-async'
import {useNavigate} from 'react-router-dom'
import {supabase} from '../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('Set your password to secure your account')

  useEffect(() => {
    let active = true

    async function securePage() {
      const {data} = await supabase.auth.getSession()

      if (!active) return

      if (!data?.session) {
        navigate('/dashboard', {
          replace: true,
          state: {authMessage: 'Please login first to access password reset.'},
        })
        return
      }

      setHasSession(true)
      setCheckingSession(false)
    }

    securePage()

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return

      if (session) {
        setHasSession(true)
        setCheckingSession(false)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [navigate])

  async function handlePasswordUpdate(event) {
    event.preventDefault()
    setError('')
    setInfo('Set your password to secure your account')

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)

    try {
      const {error: updateError} = await supabase.auth.updateUser({password})
      if (updateError) {
        throw new Error(updateError.message || 'Unable to update password')
      }

      setInfo('Password updated successfully. Redirecting to dashboard...')
      setPassword('')
      setConfirmPassword('')

      setTimeout(() => {
        navigate('/dashboard', {replace: true})
      }, 800)
    } catch (updateErr) {
      setError(updateErr.message || 'Unable to update password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <Helmet>
        <title>Reset Password - Chess Saga</title>
        <meta
          name="description"
          content="Securely set your account password after purchase or recovery."
        />
      </Helmet>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold text-slate-900">Reset Password</h1>
        <p className="mt-2 text-slate-600">Set your password to secure your account</p>

        {checkingSession ? (
          <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Checking session...
          </p>
        ) : null}

        {!checkingSession && hasSession ? (
          <form className="mt-5 space-y-3" onSubmit={handlePasswordUpdate}>
            <div>
              <label htmlFor="new-password" className="mb-1 block text-sm font-semibold text-slate-800">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                placeholder="Enter new password"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-1 block text-sm font-semibold text-slate-800">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
            >
              {submitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        ) : null}

        {info ? <p className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">{info}</p> : null}
        {error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      </section>
    </main>
  )
}
