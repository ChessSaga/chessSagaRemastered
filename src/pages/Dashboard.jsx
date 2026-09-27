import {lazy, Suspense, useEffect, useMemo, useRef, useState} from 'react'
import {Helmet} from 'react-helmet-async'
import {useLocation} from 'react-router-dom'
import {supabase} from '../lib/supabase'
import {resolveAttempt} from '../lib/checkpoint'

const ChessCheckpoint = lazy(() => import('../components/ChessCheckpoint'))

const EMAIL_STORAGE_KEY = 'chessSagaDashboardEmail'

// How long the video/board swap takes. Keep in sync with the duration classes below.
const STAGE_TRANSITION_MS = 450


function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const BRANCH_BADGE_STYLES = {
  correct: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  alternative: 'border-amber-300 bg-amber-50 text-amber-900',
  mistake: 'border-rose-300 bg-rose-50 text-rose-900',
}

const BRANCH_DOT_STYLES = {
  correct: 'bg-emerald-500',
  alternative: 'bg-amber-500',
  mistake: 'bg-rose-500',
}

function SkeletonList({count = 4, dark = false}) {
  return (
    <div className="space-y-2">
      {Array.from({length: count}).map((_, idx) => (
        <div
          key={`sk-${idx}`}
          className={`h-12 animate-pulse rounded-xl ${dark ? 'bg-white/10' : 'border border-slate-200 bg-slate-100'}`}
        />
      ))}
    </div>
  )
}

function PlayGlyph({className = ''}) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </svg>
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

  const videoRef = useRef(null)
  const resolvedRef = useRef(new Set())
  const programmaticSeekRef = useRef(false)
  const attemptsRef = useRef(0)
  const [activeCheckpoint, setActiveCheckpoint] = useState(null)
  const [playingBranch, setPlayingBranch] = useState(null)
  const [resolvedCount, setResolvedCount] = useState(0)

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
      } else if (list.length === 1) {
        // Only one course: skip the picker and go straight in.
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
    resetInteractiveState()

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
    resetInteractiveState()
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

  const checkpoints = useMemo(() => {
    const list = selectedLecture?.checkpoints
    if (!Array.isArray(list)) return []
    return list
      .filter(
        (cp) =>
          cp && typeof cp.atSec === 'number' && cp.fen && Array.isArray(cp.branches) && cp.branches.length > 0
      )
      .slice()
      .sort((a, b) => a.atSec - b.atSec)
  }, [selectedLecture])

  const lectureIndex = useMemo(
    () => lectures.findIndex((item) => item._id === selectedLecture?._id),
    [lectures, selectedLecture]
  )

  function resetInteractiveState() {
    resolvedRef.current = new Set()
    programmaticSeekRef.current = false
    attemptsRef.current = 0
    setActiveCheckpoint(null)
    setPlayingBranch(null)
    setResolvedCount(0)
  }

  function seekTo(video, seconds) {
    // A no-op seek fires no `seeking` event, which would leave the guard flag set and
    // swallow the learner's next manual seek.
    if (Math.abs(video.currentTime - seconds) < 0.01) return
    programmaticSeekRef.current = true
    video.currentTime = seconds
  }

  function handleTimeUpdate(event) {
    const video = event.currentTarget

    if (playingBranch) {
      if (video.currentTime >= playingBranch.endSec) {
        setPlayingBranch(null)
        seekTo(video, playingBranch.resumeSec)
      }
      return
    }

    if (activeCheckpoint) return

    const index = checkpoints.findIndex((cp, idx) => !resolvedRef.current.has(idx) && video.currentTime >= cp.atSec)
    if (index === -1) return

    video.pause()
    seekTo(video, checkpoints[index].atSec)
    attemptsRef.current = 0
    setActiveCheckpoint({index, checkpoint: checkpoints[index]})
  }

  function handleSeeking(event) {
    if (programmaticSeekRef.current) {
      programmaticSeekRef.current = false
      return
    }

    const video = event.currentTarget
    const blockingIndex = checkpoints.findIndex(
      (cp, idx) => !resolvedRef.current.has(idx) && video.currentTime > cp.atSec
    )
    if (blockingIndex === -1) return

    seekTo(video, checkpoints[blockingIndex].atSec)
  }

  function resolveMove(san) {
    const video = videoRef.current
    if (!activeCheckpoint || !video) return {ok: false}

    const {index, checkpoint} = activeCheckpoint
    const outcome = resolveAttempt(checkpoint.branches, san, attemptsRef.current)

    if (!outcome.ok) {
      if (outcome.retry) attemptsRef.current = outcome.attemptsUsed
      return outcome
    }

    const branch = outcome.branch
    resolvedRef.current.add(index)
    setResolvedCount(resolvedRef.current.size)
    setActiveCheckpoint(null)
    setPlayingBranch({
      category: branch.category || 'alternative',
      label: branch.label || '',
      endSec: branch.endSec,
      resumeSec: typeof checkpoint.resumeSec === 'number' ? checkpoint.resumeSec : branch.endSec,
    })

    // Let the board finish collapsing before the explanation starts playing.
    window.setTimeout(() => {
      seekTo(video, branch.startSec)
      video.play().catch(() => {})
    }, STAGE_TRANSITION_MS * 0.5)

    return {ok: true}
  }

  async function playLecture(lecture) {
    if (!selectedCourseId) return
    setError('')
    setLoadingVideo(true)
    resetInteractiveState()

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

  const inChallenge = Boolean(activeCheckpoint)

  // ---------------------------------------------------------------- login view

  if (!isAuthenticated) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
        <Helmet>
          <title>Dashboard - Chess Saga</title>
          <meta name="description" content="Log in to watch your Chess Saga lessons and practise interactively." />
        </Helmet>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-600">Log in to continue your training.</p>

          <div className="mt-6 space-y-3">
            <input
              type="email"
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
              placeholder="Email address"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
            />
            <input
              type="password"
              value={passwordInput}
              onChange={(event) => setPasswordInput(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleLogin()}
              placeholder="Password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
            />
            <button
              type="button"
              onClick={handleLogin}
              disabled={loadingLogin}
              className="w-full rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {loadingLogin ? 'Signing in...' : 'Log in'}
            </button>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loadingForgotPassword}
              className="w-full rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {loadingForgotPassword ? 'Sending...' : 'Forgot password'}
            </button>
          </div>

          {info ? (
            <p className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">{info}</p>
          ) : null}
          {error ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}
        </div>
      </main>
    )
  }

  // -------------------------------------------------------- course picker view

  if (!selectedCourseId) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <Helmet>
          <title>Your Courses - Chess Saga</title>
        </Helmet>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Your courses</h1>
            <p className="mt-1 text-sm text-slate-600">Signed in as {sessionEmail}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Log out
          </button>
        </div>

        {info ? (
          <p className="mt-5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">{info}</p>
        ) : null}
        {error ? (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        {loadingCourses ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <SkeletonList count={2} />
            <SkeletonList count={2} />
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {courses.map((course) => (
              <button
                key={course.courseId}
                type="button"
                onClick={() => setSelectedCourseId(course.courseId)}
                className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:shadow-md"
              >
                <p className="text-lg font-semibold text-slate-900">{course.title}</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent)]">
                  Start learning
                  <span className="transition group-hover:translate-x-0.5">&rarr;</span>
                </p>
              </button>
            ))}
          </div>
        )}
      </main>
    )
  }

  // ------------------------------------------------------------- learning view

  return (
    <main className="mx-auto w-full max-w-[1500px] px-3 py-6 sm:px-5">
      <Helmet>
        <title>{selectedCourse ? `${selectedCourse.title} - Chess Saga` : 'Dashboard - Chess Saga'}</title>
      </Helmet>

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* ------------------------------------------------------- sidebar */}
        <aside className="h-fit rounded-3xl bg-[var(--color-primary)] p-5 text-white shadow-sm lg:sticky lg:top-6">
          {courses.length > 1 ? (
            <button
              type="button"
              onClick={() => setSelectedCourseId('')}
              className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition hover:text-white"
            >
              &larr; Back to courses
            </button>
          ) : null}

          <h2 className="mt-3 text-xl font-bold leading-snug">{selectedCourse?.title || 'Course'}</h2>

          {lectures.length > 0 ? (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-white/70">
                <span>{lectureIndex >= 0 ? `Lesson ${lectureIndex + 1} of ${lectures.length}` : `${lectures.length} lessons`}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-[var(--color-accent-2)] transition-all duration-500"
                  style={{width: `${lectureIndex >= 0 ? ((lectureIndex + 1) / lectures.length) * 100 : 0}%`}}
                />
              </div>
            </div>
          ) : null}

          <div className="mt-5 space-y-1.5">
            {loadingLectures ? <SkeletonList count={5} dark /> : null}

            {!loadingLectures && lectures.length === 0 ? (
              <p className="rounded-xl bg-white/10 px-3 py-2 text-sm text-white/70">No lessons in this course yet.</p>
            ) : null}

            {lectures.map((lecture, idx) => {
              const active = lecture._id === selectedLecture?._id
              const challengeCount = Array.isArray(lecture.checkpoints) ? lecture.checkpoints.length : 0

              return (
                <button
                  key={lecture._id}
                  type="button"
                  onClick={() => playLecture(lecture)}
                  disabled={loadingVideo}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition disabled:opacity-60 ${
                    active ? 'bg-[var(--color-accent)] text-white shadow-sm' : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                      active ? 'bg-white/25' : 'bg-white/10'
                    }`}
                  >
                    {active ? <PlayGlyph className="h-3 w-3" /> : idx + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{lecture.title}</span>
                    <span className="mt-0.5 block text-[11px] text-white/60">
                      {lecture.duration || 'Lesson'}
                      {challengeCount > 0 ? ` · ${challengeCount} challenge${challengeCount > 1 ? 's' : ''}` : ''}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-6 border-t border-white/15 pt-4">
            <p className="truncate text-xs text-white/60">{sessionEmail}</p>
            <button
              type="button"
              onClick={logout}
              className="mt-2 w-full rounded-xl border border-white/25 px-3 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/10"
            >
              Log out
            </button>
          </div>
        </aside>

        {/* ---------------------------------------------------- main stage */}
        <section className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {selectedCourse?.title}
              </p>
              <h1
                className={`mt-1 truncate font-bold text-slate-900 transition-all duration-300 ${
                  inChallenge ? 'text-lg' : 'text-2xl sm:text-3xl'
                }`}
              >
                {selectedLecture ? selectedLecture.title : 'Select a lesson'}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {checkpoints.length > 0 && !inChallenge ? (
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="text-xs font-medium text-slate-600">
                    {resolvedCount} of {checkpoints.length} challenges
                  </span>
                  <span className="flex items-center gap-1">
                    {checkpoints.map((cp, idx) => (
                      <span
                        key={`dot-${idx}`}
                        className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                          idx < resolvedCount ? 'bg-[var(--color-accent)]' : 'bg-slate-300'
                        }`}
                      />
                    ))}
                  </span>
                </div>
              ) : null}

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => lectureIndex > 0 && playLecture(lectures[lectureIndex - 1])}
                  disabled={lectureIndex <= 0 || loadingVideo}
                  className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                  aria-label="Previous lesson"
                >
                  &larr;
                </button>
                <button
                  type="button"
                  onClick={() =>
                    lectureIndex >= 0 && lectureIndex < lectures.length - 1 && playLecture(lectures[lectureIndex + 1])
                  }
                  disabled={lectureIndex < 0 || lectureIndex >= lectures.length - 1 || loadingVideo}
                  className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                  aria-label="Next lesson"
                >
                  &rarr;
                </button>
              </div>
            </div>
          </div>

          {error ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          {!videoUrl ? (
            <div className="mt-5 flex h-80 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
              {loadingVideo ? 'Loading secure playback...' : 'Choose a lesson from the left to begin.'}
            </div>
          ) : (
            <>
              <div
                className={`overflow-hidden transition-all duration-[450ms] ease-in-out ${
                  inChallenge ? 'mt-4 max-h-24 opacity-100' : 'mt-0 max-h-0 opacity-0'
                }`}
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="rounded-full bg-[var(--color-accent)]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent)]">
                    Challenge {activeCheckpoint ? activeCheckpoint.index + 1 : 1} of {checkpoints.length}
                  </span>
                  <p className="text-base font-semibold text-slate-900 sm:text-lg">
                    {activeCheckpoint?.checkpoint?.prompt || 'Your move.'}
                  </p>
                </div>
              </div>

              <div className={`mt-3 flex flex-col lg:flex-row lg:items-start ${inChallenge ? 'gap-5' : 'gap-0'}`}>
                {/* Board: primary during a challenge, collapsed away otherwise. */}
                <div
                  className={`overflow-hidden transition-all duration-[450ms] ease-in-out ${
                    inChallenge
                      ? 'max-h-[1600px] opacity-100 lg:w-[62%]'
                      : 'max-h-0 opacity-0 lg:w-0 lg:max-h-[1600px]'
                  }`}
                >
                  <div className="flex flex-col">
                    {activeCheckpoint ? (
                      <Suspense
                        fallback={
                          <div className="mx-auto aspect-square w-full max-w-[650px] animate-pulse rounded-lg bg-slate-200" />
                        }
                      >
                        <ChessCheckpoint
                          key={`${selectedLecture?._id}-${activeCheckpoint.index}`}
                          fen={activeCheckpoint.checkpoint.fen}
                          hint={activeCheckpoint.checkpoint.hint}
                          onResolve={resolveMove}
                        />
                      </Suspense>
                    ) : null}
                  </div>
                </div>

                {/* Video: primary by default, compact reference panel during a challenge.
                    This element must never unmount or playback position is lost. */}
                <div
                  className={`w-full transition-all duration-[450ms] ease-in-out ${
                    inChallenge ? 'lg:w-[38%]' : 'lg:w-full'
                  }`}
                >
                  <div
                    className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${
                      inChallenge ? 'lg:mr-auto lg:max-w-[360px]' : ''
                    }`}
                  >
                    {inChallenge ? (
                      <p className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                        Need a clue? Rewatch this part of the lesson.
                      </p>
                    ) : null}

                    <video
                      key={videoUrl}
                      ref={videoRef}
                      controls
                      controlsList="nodownload"
                      className="w-full bg-black"
                      src={videoUrl}
                      onContextMenu={(event) => event.preventDefault()}
                      onTimeUpdate={handleTimeUpdate}
                      onSeeking={handleSeeking}
                      onError={() => setError('Session expired, reload video')}
                    />

                    {playingBranch ? (
                      <div
                        className={`flex items-center gap-2 border-t px-3 py-2.5 text-sm font-medium ${
                          BRANCH_BADGE_STYLES[playingBranch.category] || BRANCH_BADGE_STYLES.alternative
                        }`}
                      >
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            BRANCH_DOT_STYLES[playingBranch.category] || BRANCH_DOT_STYLES.alternative
                          }`}
                        />
                        {playingBranch.label || `That move is ${playingBranch.category}.`}
                      </div>
                    ) : null}

                    {!inChallenge && !playingBranch && expiresIn > 0 ? (
                      <p className="border-t border-slate-200 px-4 py-2.5 text-xs text-slate-500">
                        Secure streaming · link expires in {Math.round(expiresIn / 60)} minutes
                        {checkpoints.length > 0
                          ? ` · ${checkpoints.length} interactive challenge${checkpoints.length > 1 ? 's' : ''} in this lesson`
                          : ''}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
