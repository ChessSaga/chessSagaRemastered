import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { client } from '../sanity'
import BlogCard from '../components/BlogCard'
import { Link } from 'react-router-dom'

function plainText(content) {
  if (!content) return ''
  if (Array.isArray(content)) {
    for (const block of content) {
      if (block?._type === 'block' && Array.isArray(block.children)) {
        const text = block.children.map((c) => c.text || '').join(' ')
        if (text.trim()) return text.trim()
      }
    }
    return content
      .map((b) => (Array.isArray(b?.children) ? b.children.map((c) => c.text || '').join(' ') : ''))
      .join(' ')
      .trim()
  }
  if (typeof content === 'string') return content
  return ''
}

export default function BlogList() {
  const [allBlogs, setAllBlogs] = useState([])
  const [visibleCount, setVisibleCount] = useState(6)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true
    client
      .fetch("*[_type=='blog']|order(publishedAt desc){title, slug, image{asset}, content, publishedAt}")
      .then((res) => {
        if (!active) return
        setAllBlogs(res || [])
      })
      .catch(() => setError('Failed to load blogs. Please try again later.'))
      .finally(() => setLoading(false))
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allBlogs
    return allBlogs.filter((b) => {
      const t = (b.title || '').toLowerCase()
      const p = plainText(b.content).toLowerCase()
      return t.includes(q) || p.includes(q)
    })
  }, [allBlogs, query])

  const visibleBlogs = filtered.slice(0, visibleCount)
  const canLoadMore = visibleCount < filtered.length

  return (
    <main className="bg-white">
      <Helmet>
        <title>Blogs — Chesssaga</title>
        <meta name="description" content="Chess lessons, tactics, and strategy articles. Explore premium, modern chess blogs on Chesssaga." />
      </Helmet>

      {/* Gradient header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#eff6ff] to-white" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 pt-12 pb-6 sm:pt-16 sm:pb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0f172a]">Blogs</h1>
          <p className="mt-2 text-[#64748b]">Learn openings, tactics, and endgames through clean, modern articles.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-6">

        {/* Search Bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Search blogs</label>
            <input
              id="search"
              aria-label="Search blogs"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or content"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            />
          </div>
          <div className="text-sm text-[#64748b]">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</div>
        </div>

        {/* Loading / Error / Empty */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="h-40 bg-slate-200" />
                <div className="p-5">
                  <div className="h-4 w-2/3 bg-slate-200 rounded" />
                  <div className="h-3 w-1/3 bg-slate-200 rounded mt-2" />
                  <div className="h-3 w-full bg-slate-200 rounded mt-3" />
                  <div className="h-3 w-3/4 bg-slate-200 rounded mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-[#eff6ff] p-6 text-[#64748b]">No results found. Try a different search.</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleBlogs.map((post) => (
              <Link
                key={post.slug?.current}
                to={`/blogs/${post.slug?.current}`}
                className="transition-transform duration-200 will-change-transform hover:-translate-y-0.5 block focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                aria-label={post.title}
              >
                <BlogCard post={post} />
              </Link>
            ))}
          </div>
        )}

        {/* Load More */}
        {!loading && !error && filtered.length > 0 && (
          <div className="mt-8 flex justify-center">
            <button
              aria-label="Load more blogs"
              disabled={!canLoadMore}
              onClick={() => setVisibleCount((c) => c + 6)}
              className={`rounded-lg px-6 py-3 text-white shadow-sm ${canLoadMore ? 'bg-[#2563eb] hover:shadow-md hover:bg-blue-600' : 'bg-slate-400 cursor-not-allowed'}`}
            >
              {canLoadMore ? 'Load More' : 'No More Results'}
            </button>
          </div>
        )}
      </section>

      {/* Sidebar (Desktop Only) */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2" />
          <aside className="hidden lg:block space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#0f172a]">Recent Posts</h2>
              <ul className="mt-3 space-y-2">
                {allBlogs.slice(0, 5).map((b) => (
                  <li key={b.slug?.current} className="text-sm">
                    <a href={`/blogs/${b.slug?.current}`} className="text-[#2563eb] hover:underline">{b.title}</a>
                    <span className="ml-2 text-[#64748b]">{b.publishedAt ? new Date(b.publishedAt).toLocaleDateString() : ''}</span>
                  </li>
                ))}
              </ul>
            </div>

            <form action="https://formsubmit.co/your@email.com" method="POST" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#0f172a]">Subscribe</h2>
              <p className="text-[#64748b] text-sm mt-1">Get the latest chess articles in your inbox.</p>
              <input type="hidden" name="_subject" value="Chesssaga Blog Newsletter" />
              <input type="hidden" name="_captcha" value="false" />
              <label htmlFor="subscribe-email" className="sr-only">Email</label>
              <input id="subscribe-email" name="email" type="email" required placeholder="Enter your email" className="mt-3 w-full rounded-lg border border-slate-300 px-4 py-3 text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#2563eb]" />
              <button type="submit" className="mt-3 w-full rounded-lg bg-[#2563eb] px-4 py-2.5 text-white shadow-sm hover:shadow-md hover:bg-blue-600">Subscribe</button>
            </form>
          </aside>
        </div>
      </section>
    </main>
  )
}
