import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { client, urlForImage } from '../sanity'
import BlogCard from '../components/BlogCard'
import NewsCard from '../components/NewsCard'

export default function Home() {
  const [featured, setFeatured] = useState(null)
  const [blogs, setBlogs] = useState([])
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let isMounted = true
    async function fetchData() {
      try {
        const [featuredRes, blogsRes, newsRes] = await Promise.all([
          client.fetch("*[_type=='blog' && featured==true]|order(publishedAt desc)[0]{title, slug, image{asset}, content, publishedAt}"),
          client.fetch("*[_type=='blog']|order(publishedAt desc)[0..5]{title, slug, image{asset}, content, publishedAt}"),
          client.fetch("*[_type=='news']|order(publishedAt desc)[0..5]{title, slug, image{asset}, publishedAt}")
        ])
        if (!isMounted) return
        setFeatured(featuredRes || null)
        setBlogs(blogsRes || [])
        setNews(newsRes || [])
      } catch (e) {
        setError('Failed to load content. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    // Microinteraction: reveal content after a tiny delay for smoothness
    const t = setTimeout(() => setIsReady(true), 80)
    return () => { isMounted = false; clearTimeout(t) }
  }, [])

  // Extract plain text from Portable Text arrays for safe excerpts
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

  return (
    <div className="bg-white">
      <Helmet>
        <title>Chesssaga — Learn Chess with Blogs and News</title>
        <meta name="description" content="Chesssaga is a modern, blue & white, light-themed chess platform featuring blogs, news, and learning content. Stay updated and improve your chess." />
      </Helmet>

      {/* HERO SECTION */}
      <section className={`relative overflow-hidden transition-opacity duration-500 ${isReady ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#eff6ff] to-white" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#0f172a]">
                Learn chess with <span className="text-[#2563eb]">Chesssaga</span>
              </h1>
              <p className="mt-4 text-lg sm:text-xl text-[#64748b] max-w-prose">
                Clean, modern articles and timely news for players who want a premium, distraction-free learning experience.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="https://g0j57ln408w.typeform.com/to/ystIIaXU?typeform-source=admin.typeform.com" className="inline-flex items-center rounded-lg bg-[#2563eb] px-6 py-3 text-white shadow-sm hover:shadow-md hover:bg-blue-600 transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563eb]">
                  Book a Demo
                </Link>
                <Link to="/blogs" className="inline-flex items-center rounded-lg bg-[#eff6ff] px-6 py-3 text-[#0f172a] shadow-sm hover:shadow-md hover:bg-blue-100 transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563eb]]">
                  Explore Blogs
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <img src="/icons/Chess Saga Logo.png" alt="Chesssaga logo knight icon" className="w-full max-w-md ml-auto rounded-xl shadow-sm border border-slate-200 transform transition duration-500 ease-out ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED BLOG */}
      <section className={`bg-[#eff6ff] transition-transform duration-500 ${isReady ? 'translate-y-0' : 'translate-y-1'}`}>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#0f172a] mb-6">Featured Blog</h2>
          {loading ? (
            <div className="rounded-lg border border-slate-200 bg-white p-6 text-[#64748b]">Loading featured blog...</div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
          ) : featured ? (
            <Link to={`/blogs/${featured.slug?.current}`} className="block">
              <article className="grid grid-cols-1 md:grid-cols-3 gap-6 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden will-change-transform transition duration-300 hover:shadow-md">
                {featured.image?.asset && (
                  <img
                    src={urlForImage(featured.image.asset)}
                    alt={featured.title}
                    className="w-full h-64 md:h-full object-cover"
                    loading="lazy"
                  />
                )}
                <div className="p-6 md:col-span-2">
                  <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#0f172a]">{featured.title}</h3>
                  <p className="text-xs text-[#64748b] mt-1">
                    {featured.publishedAt ? new Date(featured.publishedAt).toLocaleDateString() : ''}
                  </p>
                  <p className="mt-4 text-[#64748b] leading-7 line-clamp-4">
                    {(() => {
                      const txt = extractPlainText(featured.content)
                      return txt ? `${txt.slice(0, 240)}${txt.length > 240 ? '…' : ''}` : ''
                    })()}
                  </p>
                  <div className="mt-5 inline-flex items-center rounded-lg bg-[#2563eb] px-5 py-2.5 text-white shadow-sm hover:shadow-md hover:bg-blue-600 transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563eb]">
                    Read Article
                  </div>
                </div>
              </article>
            </Link>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-6 text-[#64748b]">No featured blog yet.</div>
          )}
        </div>
      </section>

      {/* LATEST BLOGS GRID */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#0f172a]">Latest Blogs</h2>
          <Link to="/blogs" className="text-[#2563eb] hover:underline">View all</Link>
        </div>
        {loading ? (
          <p className="text-[#64748b]">Loading blogs...</p>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
        ) : blogs?.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blogs.map((post) => (
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
        ) : (
          <div className="rounded-lg border border-slate-200 bg-[#eff6ff] p-6 text-[#64748b]">No blogs available.</div>
        )}
      </section>

      {/* LATEST NEWS SECTION */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#0f172a]">Latest News</h2>
          <Link to="/news" className="text-[#2563eb] hover:underline">View all</Link>
        </div>
        {loading ? (
          <p className="text-[#64748b]">Loading news...</p>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
        ) : news?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((item) => (
              <Link
                key={item.slug?.current}
                to={`/news/${item.slug?.current}`}
                className="transition-transform duration-200 will-change-transform hover:-translate-y-0.5 block focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                aria-label={item.title}
              >
                <NewsCard item={item} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-[#eff6ff] p-6 text-[#64748b]">No news available.</div>
        )}
      </section>


      {/* ABOUT PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <h3 className="text-xl font-semibold text-[#0f172a]">About Chesssaga</h3>
          <p className="text-[#64748b] mt-2 leading-7 max-w-prose">
            Chesssaga exists to provide a premium, clean reading experience for players who want to learn efficiently. We curate practical advice, strategy breakdowns, and timely news—all in a modern blue & white design built for focus.
          </p>
        </div>
      </section>

      {/* NEWSLETTER SIGNUP */}
      <section className="bg-[#eff6ff]">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <form action="https://formsubmit.co/your@email.com" method="POST" className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row gap-3">
            <input type="hidden" name="_subject" value="Chesssaga Newsletter Signup" />
            <input type="hidden" name="_captcha" value="false" />
            <label htmlFor="email" className="sr-only">Email</label>
            <input id="email" name="email" type="email" required placeholder="Enter your email" className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#2563eb]" />
            <button type="submit" className="rounded-lg bg-[#2563eb] px-6 py-3 text-white shadow-sm hover:shadow-md hover:bg-blue-600">Subscribe</button>
          </form>
        </div>
      </section>
    </div>
  )
}
