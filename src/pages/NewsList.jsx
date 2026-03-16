import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { client } from '../sanity'
import NewsCard from '../components/NewsCard'

export default function NewsList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [visible, setVisible] = useState(6)

  useEffect(() => {
    let active = true
    client
      .fetch("*[_type=='news']|order(publishedAt desc){title, slug, image{asset}, content, publishedAt}")
      .then((res) => { if (active) setItems(res || []) })
      .catch(() => { setError('Failed to load news. Please try again later.'); setItems([]) })
      .finally(() => setLoading(false))
    return () => { active = false }
  }, [])

  const extractPlainText = (ptValue) => {
    if (!ptValue) return ''
    if (Array.isArray(ptValue)) {
      for (const block of ptValue) {
        if (block?._type === 'block' && Array.isArray(block.children)) {
          const text = block.children.map((x) => x.text || '').join(' ').trim()
          if (text) return text
        }
      }
      return ptValue
        .map((b) => (Array.isArray(b?.children) ? b.children.map((x) => x.text || '').join(' ') : ''))
        .join(' ')
        .trim()
    }
    return typeof ptValue === 'string' ? ptValue : ''
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((it) => {
      const title = (it.title || '').toLowerCase()
      const summary = extractPlainText(it.content).toLowerCase()
      return title.includes(q) || summary.includes(q)
    })
  }, [items, query])

  const visibleItems = filtered.slice(0, visible)

  return (
    <main className="bg-white">
      <Helmet>
        <title>News — Chesssaga</title>
        <meta name="description" content="Latest chess news on Chesssaga." />
      </Helmet>
      {/* Gradient header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#eff6ff] to-white" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 pt-12 pb-6 sm:pt-16 sm:pb-10">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#0f172a]">News</h1>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search news..."
              className="w-56 rounded-lg border border-slate-300 px-3 py-2 text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            />
          </div>
          <p className="mt-2 text-[#64748b]">Timely chess updates and tournament highlights.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-6">

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-4">
              <div className="h-40 bg-slate-200 rounded" />
              <div className="mt-4 h-5 bg-slate-200 rounded w-2/3" />
              <div className="mt-2 h-4 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
      ) : filtered.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((item) => (
            <div key={item.slug?.current} className="transition-transform duration-200 will-change-transform hover:-translate-y-0.5">
              <NewsCard item={item} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-[#eff6ff] p-6 text-[#64748b]">No news found for your search.</div>
      )}

      {!loading && filtered.length > visible && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setVisible((v) => v + 6)}
            className="rounded-lg bg-[#2563eb] px-6 py-3 text-white shadow-sm hover:shadow-md hover:bg-blue-600"
          >
            Load More
          </button>
        </div>
      )}
      </section>
    </main>
  )
}
