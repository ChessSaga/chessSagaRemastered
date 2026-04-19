import {useEffect, useMemo, useState} from 'react'
import {Helmet} from 'react-helmet-async'
import {useLocation} from 'react-router-dom'
import {supabase} from '../lib/supabase'

const EMAIL_STORAGE_KEY = 'chessSagaDashboardEmail'

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function SkeletonList({count = 4}) {
  return (
    <div className="space-y-2">
      {Array.from({length: count}).map((_, idx) => (
        <div key={`sk-${idx}`} className="h-11 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
      ))}
    </div>
  )
}

export default function Dashboard() {
  const location = useLocation()
  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')

  const [sessionEmail, setSessionEmail] = useState('')
  const [accessToken, setAccessToken] = useState('')

  const [courses, setCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [lectures, setLectures] = useState([])
  const [selectedLecture, setSelectedLecture] = useState(null)

  const [videoUrl, setVideoUrl] = useState('')
  const [expiresIn, setExpiresIn] = useState(0)

  const [loadingLogin, setLoadingLogin] = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [loadingLectures, setLoadingLectures] = useState(false)
  const [loadingVideo, setLoadingVideo] = useState(false)

  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loadingForgotPassword, setLoadingForgotPassword] = useState(false)

  const isAuthenticated = Boolean(sessionEmail && accessToken)

  const selectedCourse = useMemo(
    () => courses.find((course) => course.courseId === selectedCourseId) || null,
    [courses, selectedCourseId]
  )

  useEffect(() => {
    const message = location.state?.authMessage
    if (message) {
      setInfo(String(message))
      setError('')
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  useEffect(() => {
    let active = true

    async function restoreSession() {
      const {data} = await supabase.auth.getSession()
      const restoredEmail = data.session?.user?.email || localStorage.getItem(EMAIL_STORAGE_KEY) || ''
      const restoredToken = data.session?.access_token || ''

      if (!active) return
      if (restoredEmail && restoredToken) {
        const normalized = restoredEmail.toLowerCase()
        localStorage.setItem(EMAIL_STORAGE_KEY, normalized)
        setSessionEmail(normalized)
        setEmailInput(normalized)
        setAccessToken(restoredToken)
      }
    }

    restoreSession()

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const userEmail = session?.user?.email?.toLowerCase() || ''
      const token = session?.access_token || ''

      if (userEmail && token) {
        localStorage.setItem(EMAIL_STORAGE_KEY, userEmail)
        setSessionEmail(userEmail)
        setEmailInput(userEmail)
        setAccessToken(token)
      } else {
        localStorage.removeItem(EMAIL_STORAGE_KEY)
        setSessionEmail('')
        setAccessToken('')
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    fetchCourses(accessToken)
  }, [isAuthenticated, accessToken])

  async function fetchCourses(token) {
    setError('')
    setInfo('')
    setLoadingCourses(true)
    setCourses([])
    setSelectedCourseId('')
    setLectures([])
    setSelectedLecture(null)
    setVideoUrl('')
    setExpiresIn(0)

    try {
      const response = await fetch('/api/get-user-courses', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          accessToken: token,
        }),
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.')
        }
        throw new Error(data.error || 'Unable to fetch courses')
      }

      const list = data.courses || []
      setCourses(list)
      if (list.length === 0) {
        setInfo('No courses found for this email')
      } else {
        setSelectedCourseId(list[0].courseId)
      }
    } catch (fetchError) {
      setError(fetchError.message || 'Unable to fetch courses')
      if (/Session expired/i.test(fetchError.message || '')) {
        await logout()
      }
    } finally {
      setLoadingCourses(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !selectedCourseId) return
    fetchLectures(selectedCourseId)
  }, [isAuthenticated, selectedCourseId])

  async function fetchLectures(courseId) {
    setError('')
    setLoadingLectures(true)
    setLectures([])
    setSelectedLecture(null)
    setVideoUrl('')
    setExpiresIn(0)

    try {
      const response = await fetch('/api/get-lectures', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          accessToken,
          courseId,
        }),
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.')
        }
        throw new Error(data.error || 'Unable to fetch lectures')
      }

      setLectures(data.lectures || [])
    } catch (fetchError) {
      setError(fetchError.message || 'Unable to fetch lectures')
      if (/Session expired/i.test(fetchError.message || '')) {
        await logout()
      }
    } finally {
      setLoadingLectures(false)
    }
  }

  async function handleLogin() {
    setError('')
    setInfo('')

    const normalizedEmail = emailInput.trim().toLowerCase()
    if (!validateEmail(normalizedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    if (!passwordInput.trim()) {
      setError('Please enter your password.')
      return
    }

    setLoadingLogin(true)
    try {
      const {data, error: loginError} = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: passwordInput,
      })

      if (loginError) {
        throw new Error(loginError.message || 'Invalid email or password')
      }

      const token = data.session?.access_token || ''
      if (!token) throw new Error('Unable to establish auth session')

      localStorage.setItem(EMAIL_STORAGE_KEY, normalizedEmail)
      setSessionEmail(normalizedEmail)
      setAccessToken(token)
      setInfo('Logged in successfully. Loading your courses...')
    } catch (loginErr) {
      setError(loginErr.message || 'Unable to login')
    } finally {
      setLoadingLogin(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    localStorage.removeItem(EMAIL_STORAGE_KEY)

    setSessionEmail('')
    setAccessToken('')
    setPasswordInput('')
    setCourses([])
    setSelectedCourseId('')
    setLectures([])
    setSelectedLecture(null)
    setVideoUrl('')
    setExpiresIn(0)
    setInfo('')
  }

  async function handleForgotPassword() {
    setError('')
    setInfo('')

    const normalizedEmail = emailInput.trim().toLowerCase()
    if (!validateEmail(normalizedEmail)) {
      setError('Enter your email, then click Forgot Password.')
      return
    }

    setLoadingForgotPassword(true)

    try {
      const {error: resetError} = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        throw new Error(resetError.message || 'Unable to send reset email')
      }

      setInfo('Password reset email sent. Check your inbox and open the link to continue.')
    } catch (resetErr) {
      setError(resetErr.message || 'Unable to send reset email')
    } finally {
      setLoadingForgotPassword(false)
    }
  }

  async function playLecture(lecture) {
    if (!selectedCourseId) return
    setError('')
    setLoadingVideo(true)

    try {
      const response = await fetch('/api/get-video', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          accessToken,
          courseId: selectedCourseId,
          videoKey: lecture.videoKey,
        }),
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.')
        }
        throw new Error(data.error || 'Session expired, reload video')
      }

      setSelectedLecture(lecture)
      setVideoUrl(data.signedUrl)
      setExpiresIn(data.expiresIn || 0)
    } catch (playError) {
      setError(playError.message || 'Session expired, reload video')
      if (/Session expired/i.test(playError.message || '')) {
        await logout()
      }
    } finally {
      setLoadingVideo(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      <Helmet>
        <title>Dashboard - Chess Saga</title>
        <meta name="description" content="Login with email and password, view your purchased courses, and stream lectures securely." />
      </Helmet>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold text-slate-900">Your Course Content</h1>
        <p className="mt-2 text-slate-600">Secure LMS access.</p>

        {!isAuthenticated ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input
              type="email"
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
              placeholder="Enter your login email"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
            <input
              type="password"
              value={passwordInput}
              onChange={(event) => setPasswordInput(event.target.value)}
              placeholder="Enter password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm sm:col-span-1"
            />
            <button
              type="button"
              onClick={handleLogin}
              disabled={loadingLogin}
              className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
            >
              {loadingLogin ? 'Signing in...' : 'Login'}
            </button>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loadingForgotPassword}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-70"
            >
              {loadingForgotPassword ? 'Sending...' : 'Forgot Password'}
            </button>
          </div>
        ) : (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Logged in as <span className="font-semibold">{sessionEmail}</span>
            </p>
            <button
              type="button"
              onClick={() => {
                logout()
              }}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Logout
            </button>
          </div>
        )}

        {info ? <p className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">{info}</p> : null}
        {error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[260px_320px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Courses</h2>

          {loadingCourses ? <div className="mt-3"><SkeletonList count={4} /></div> : null}

          {!loadingCourses && courses.length === 0 ? (
            <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              {isAuthenticated ? 'No courses found for this email' : 'Login to load your courses.'}
            </p>
          ) : null}

          <div className="mt-3 space-y-2">
            {courses.map((course) => {
              const active = course.courseId === selectedCourseId
              return (
                <button
                  key={course.courseId}
                  type="button"
                  onClick={() => setSelectedCourseId(course.courseId)}
                  disabled={!isAuthenticated}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                    active
                      ? 'border-[var(--color-primary)] bg-blue-50 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {course.title}
                </button>
              )
            })}
          </div>
        </aside>

        <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Lectures</h2>
          {selectedCourse ? <p className="mt-1 text-xs text-slate-500">{selectedCourse.title}</p> : null}

          {loadingLectures ? <div className="mt-3"><SkeletonList count={6} /></div> : null}

          {!loadingLectures && lectures.length === 0 ? (
            <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              {selectedCourseId ? 'No lectures found for selected course.' : 'Select a course to load lectures.'}
            </p>
          ) : null}

          <div className="mt-3 space-y-2">
            {lectures.map((lecture) => {
              const active = lecture._id === selectedLecture?._id
              return (
                <button
                  key={lecture._id}
                  type="button"
                  onClick={() => playLecture(lecture)}
                  disabled={!isAuthenticated || loadingVideo}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                    active
                      ? 'border-[var(--color-primary)] bg-blue-50 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <p className="font-semibold">{lecture.order}. {lecture.title}</p>
                  {lecture.duration ? <p className="text-xs text-slate-500">{lecture.duration}</p> : null}
                </button>
              )
            })}
          </div>
        </aside>

        <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold text-slate-900">
            {selectedLecture ? selectedLecture.title : 'Select a lecture'}
          </h2>

          {expiresIn > 0 ? (
            <p className="mt-2 text-xs text-slate-500">Secure streaming - link expires in 5 minutes.</p>
          ) : null}

          {videoUrl ? (
            <video
              key={videoUrl}
              controls
              controlsList="nodownload"
              className="mt-4 w-full rounded-2xl border border-slate-200 bg-black"
              src={videoUrl}
              onContextMenu={(event) => event.preventDefault()}
              onError={() => setError('Session expired, reload video')}
            />
          ) : (
            <div className="mt-4 flex h-72 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
              {isAuthenticated ? 'Select a lecture to start secure playback.' : 'Login to unlock your dashboard.'}
            </div>
          )}
        </article>
      </section>
    </main>
  )
}
