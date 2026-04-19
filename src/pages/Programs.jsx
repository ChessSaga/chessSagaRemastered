import {useEffect, useState} from 'react'
import {Helmet} from 'react-helmet-async'
import ProgramCard from '../components/ProgramCard'
import {client} from '../sanity'
import {ACTIVE_COURSES_QUERY} from '../lib/courseQueries'

const PROGRAM_ICONS = ['♙', '♘', '♗', '♖', '♕', '♔']

export default function Programs() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    client
      .fetch(ACTIVE_COURSES_QUERY)
      .then((result) => {
        if (!active) return
        setCourses(result || [])
      })
      .catch(() => {
        if (active) setError('Unable to load programs right now.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      <Helmet>
        <title>Programs - Chess Saga</title>
        <meta
          name="description"
          content="Beginner to advanced online chess programs designed for kids and competitive players."
        />
      </Helmet>

      <header className="mb-8 max-w-3xl animate-fade-slide-up">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-accent)]">Programs</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--color-primary)] sm:text-4xl">
          Explore our active courses and choose the right one to enroll.
        </h1>
      </header>

      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {loading ? <div className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white" /> : null}

        {!loading && error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</div>
        ) : null}

        {!loading && !error && courses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            No active courses are available right now.
          </div>
        ) : null}

        {!loading && !error
          ? courses.map((course, index) => (
              <ProgramCard
                key={course._id}
                title={course.title}
                audience={course.duration || (course.sessions ? `${course.sessions} sessions` : '')}
                bullets={(course.benefits && course.benefits.length > 0
                  ? course.benefits
                  : ['Coach guidance', 'Practice assignments', 'Progress tracking'])}
                cta={{
                  text: 'Proceed to Enroll',
                  href: course.slug?.current
                    ? `/enroll?course=${encodeURIComponent(course.slug.current)}&utm_source=programs`
                    : '/enroll?utm_source=programs',
                }}
                icon={PROGRAM_ICONS[index % PROGRAM_ICONS.length]}
              />
            ))
          : null}
      </section>
    </main>
  )
}
