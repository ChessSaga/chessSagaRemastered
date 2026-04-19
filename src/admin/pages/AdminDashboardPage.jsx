import {useEffect, useState} from 'react'
import adminApi from '../adminApi'

function StatCard({label, value}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </article>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({videos: '...', lectures: '...', courses: '...'})

  useEffect(() => {
    let active = true

    async function loadStats() {
      try {
        const [videosResp, lecturesResp] = await Promise.all([
          adminApi.get('/videos', {params: {prefix: 'lectures/'}}),
          adminApi.get('/lectures/map'),
        ])

        if (!active) return

        setStats({
          videos: videosResp.data?.objects?.length ?? 0,
          lectures: lecturesResp.data?.lectures?.length ?? 0,
          courses: lecturesResp.data?.courses?.length ?? 0,
        })
      } catch {
        if (!active) return
        setStats({videos: '-', lectures: '-', courses: '-'})
      }
    }

    loadStats()

    return () => {
      active = false
    }
  }, [])

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-white">Dashboard</h2>
        <p className="text-sm text-slate-400">Overview of lecture storage and mappings.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Videos in R2" value={stats.videos} />
        <StatCard label="Lectures in Sanity" value={stats.lectures} />
        <StatCard label="Active Courses" value={stats.courses} />
      </div>
    </section>
  )
}
