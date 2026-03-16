import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { PortableText } from '@portabletext/react'
import { client, urlForImage } from '../sanity'

export default function BlogDetail() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const headingsRef = useRef([])

  useEffect(() => {
    let active = true
    async function run() {
      setLoading(true)
      setError('')
      try {
        const result = await client.fetch(
          "*[_type=='blog' && slug.current==$slug][0]{title, slug, publishedAt, image{asset, alt}, content, author->{name, image}, 'related': *[_type=='blog' && references(^._id)][0..2]{title, slug, image{asset}, publishedAt}}",
          { slug }
        )
        if (!active) return
        if (!result) {
          setPost(null)
          setRelated([])
        } else {
          setPost(result)
          setRelated(result.related || [])
        }
      } catch (e) {
        setError('Failed to load post. Please try again later.')
      } finally {
        if (active) setLoading(false)
      }
    }
    run()
    return () => { active = false }
  }, [slug])

  const firstPlainText = useMemo(() => {
    if (!post?.content) return ''
    const c = post.content
    if (Array.isArray(c)) {
      for (const block of c) {
        if (block?._type === 'block' && Array.isArray(block.children)) {
          const text = block.children.map((x) => x.text || '').join(' ').trim()
          if (text) return text
        }
      }
      return c.map((b) => (Array.isArray(b?.children) ? b.children.map((x) => x.text || '').join(' ') : '')).join(' ').trim()
    }
    return typeof c === 'string' ? c : ''
  }, [post])

  const wordCount = useMemo(() => (firstPlainText ? firstPlainText.split(/\s+/).filter(Boolean).length : 0), [firstPlainText])
  const readingTime = useMemo(() => Math.ceil(wordCount / 200) || 1, [wordCount])

  const slugify = (str) => (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')

  // Reset headings before rendering content to avoid stale TOC
  headingsRef.current = []

  const portableComponents = {
    block: {
      h2: ({ children, value }) => {
        const raw = Array.isArray(value?.children)
          ? value.children.map((x) => x?.text || '').join(' ')
          : Array.isArray(children)
          ? children.join(' ')
          : String(children)
        const text = (raw || '').trim()
        const id = slugify(text)
        const el = (
          <h2 id={id} className="mt-8 scroll-mt-24 text-2xl font-semibold text-[#0f172a]">
            {children}
          </h2>
        )
        if (text) headingsRef.current.push({ id, text, level: 2 })
        return el
      },
      h3: ({ children, value }) => {
        const raw = Array.isArray(value?.children)
          ? value.children.map((x) => x?.text || '').join(' ')
          : Array.isArray(children)
          ? children.join(' ')
          : String(children)
        const text = (raw || '').trim()
        const id = slugify(text)
        const el = (
          <h3 id={id} className="mt-6 scroll-mt-24 text-xl font-semibold text-[#0f172a]">
            {children}
          </h3>
        )
        if (text) headingsRef.current.push({ id, text, level: 3 })
        return el
      },
      normal: ({ children }) => (
        <p className="text-slate-700 leading-relaxed">{children}</p>
      ),
      blockquote: ({ children }) => (
        <blockquote className="border-l-4 border-[#2563eb] pl-4 italic text-slate-700">{children}</blockquote>
      ),
    },
    types: {
      image: ({ value }) => {
        const src = value?.asset ? urlForImage(value.asset) : ''
        const alt = value?.alt || post?.title || 'Article image'
        if (!src) return null
        return (
          <figure className="my-6">
            <img src={src} alt={alt} loading="lazy" className="w-full rounded-md border border-slate-200 object-cover" />
            {alt && <figcaption className="mt-2 text-xs text-slate-500">{alt}</figcaption>}
          </figure>
        )
      },
      code: ({ value }) => (
        <pre className="my-4 overflow-auto rounded-md bg-slate-900 text-slate-100 p-4">
          <code>{value?.code || ''}</code>
        </pre>
      ),
    },
    marks: {
      link: ({ children, value }) => {
        const href = value?.href || '#'
        const isExternal = /^https?:\/\//.test(href)
        return (
          <a
            href={href}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            className="text-[#2563eb] hover:underline"
          >
            {children}
          </a>
        )
      },
    },
  }

  const tocItems = useMemo(() => {
    // Deduplicate while preserving order
    const seen = new Set()
    const items = []
    for (const h of headingsRef.current) {
      if (!seen.has(h.id)) {
        seen.add(h.id)
        items.push(h)
      }
    }
    return items
  }, [post])

  const ogImage = post?.image?.asset ? urlForImage(post.image.asset) : undefined
  const ogDescription = (firstPlainText || '').slice(0, 160) || 'Chesssaga article'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard')
    } catch {}
  }

  const handleTweet = () => {
    const text = encodeURIComponent(`${post?.title || 'Chesssaga'} — ${window.location.href}`)
    const url = `https://twitter.com/intent/tweet?text=${text}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-64 bg-slate-200 rounded" />
          <div className="h-4 bg-slate-200 rounded" />
          <div className="h-4 bg-slate-200 rounded w-5/6" />
          <div className="h-4 bg-slate-200 rounded w-2/3" />
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
      </main>
    )
  }

  if (!post) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="rounded-lg border border-slate-200 bg-[#eff6ff] p-6 text-slate-600">
          Post not found. <Link to="/blogs" className="text-[#2563eb] hover:underline">Go back to Blogs</Link>
        </div>
      </main>
    )
  }

  const AuthorBox = () => (
    <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        {post.author?.image?.asset && (
          <img
            src={urlForImage(post.author.image.asset)}
            alt={post.author?.name || 'Author'}
            loading="lazy"
            className="h-12 w-12 rounded-full object-cover border border-slate-200"
          />
        )}
        <div>
          <p className="text-sm text-slate-500">Written by</p>
          <p className="font-semibold text-[#0f172a]">{post.author?.name || 'Unknown'}</p>
        </div>
      </div>
    </aside>
  )

  const RelatedPosts = () => (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-[#0f172a]">Related Posts</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {related?.slice(0, 3).map((r) => (
          <article key={r.slug?.current} className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
            {r.image?.asset && (
              <img src={urlForImage(r.image.asset)} alt={r.title} loading="lazy" className="w-full h-32 object-cover" />
            )}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-[#0f172a]">{r.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{r.publishedAt ? new Date(r.publishedAt).toLocaleDateString() : ''}</p>
              <Link to={`/blogs/${r.slug?.current}`} className="inline-block mt-2 text-[#2563eb] hover:underline">Read →</Link>
            </div>
          </article>
        ))}
        {(!related || related.length === 0) && (
          <p className="text-sm text-slate-600">No related posts.
          </p>
        )}
      </div>
    </section>
  )

  const TOC = () => (
    <nav aria-label="Table of contents" className="sticky top-24 hidden lg:block">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-[#0f172a]">On this page</p>
        <ul className="mt-3 space-y-2">
          {tocItems.map((h) => (
            <li key={h.id}>
              <a href={`#${h.id}`} className={`block text-sm hover:text-[#2563eb] ${h.level === 2 ? 'text-slate-700' : 'text-slate-500 ml-3'}`}>
                {h.text}
              </a>
            </li>
          ))}
          {tocItems.length === 0 && <li className="text-sm text-slate-500">No headings</li>}
        </ul>
      </div>
    </nav>
  )

  return (
    <main className="">
      <Helmet>
        <title>{post.title} — Chesssaga</title>
        <meta name="description" content={ogDescription} />
        {post.title && <meta property="og:title" content={`${post.title} — Chesssaga`} />}
        {ogDescription && <meta property="og:description" content={ogDescription} />}
        {ogImage && <meta property="og:image" content={ogImage} />}
      </Helmet>

      {/* Gradient header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#eff6ff] to-white" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 pt-12 pb-6 sm:pt-16 sm:pb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0f172a]">{post.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}</span>
            <span>•</span>
            <span>{readingTime} min read</span>
            {post.author?.name && (
              <span>• By {post.author.name}</span>
            )}
            <div className="ml-auto flex gap-2">
              <button aria-label="Copy link" onClick={handleCopy} className="rounded-md border border-slate-200 px-3 py-1.5 text-[#0f172a] hover:bg-[#eff6ff]">Copy Link</button>
              <button aria-label="Share on Twitter" onClick={handleTweet} className="rounded-md bg-[#2563eb] px-3 py-1.5 text-white hover:bg-blue-600">Share</button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <article className="lg:col-span-8 pl-6 pr-6 pb-6 lg:pl-8 lg:pr-8 lg:pb-8 border border-slate-200 rounded-xl bg-white shadow-sm">
          {post.image?.asset && (
            <img
              src={urlForImage(post.image.asset)}
              alt={post.image?.alt || post.title}
              className="w-full h-64 sm:h-80 object-cover rounded-lg border border-slate-200 mt-6"
              loading="lazy"
            />
          )}
          <div className="prose prose-slate max-w-none mt-6">
            <PortableText value={post.content} components={portableComponents} />
          </div>
          <footer className="mt-10">
            <AuthorBox />
            <RelatedPosts />
          </footer>
        </article>
        <aside className="lg:col-span-4">
          <TOC />
        </aside>
      </div>
    </main>
  )
}
