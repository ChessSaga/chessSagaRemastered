import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { PortableText } from '@portabletext/react'
import { client, urlForImage } from '../sanity'

export default function About() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    client
      .fetch("*[_type=='about'][0]{heading, founder{name, role, image{asset, alt}}, description, publishedAt}")
      .then((res) => active && setData(res || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
    return () => { active = false }
  }, [])

  const descriptionText = useMemo(() => {
    const c = data?.description
    if (!c) return ''
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
  }, [data])

  return (
    <div className="">
      {/* Gradient header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#eff6ff] to-white" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 pt-12 pb-6 sm:pt-16 sm:pb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0f172a]">{data?.heading || 'About Us'}</h1>
          <p className="text-sm text-[#64748b] mt-2">
            {data?.publishedAt ? new Date(data.publishedAt).toLocaleDateString() : ''}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-6">
      <Helmet>
        <title>About — Chesssaga</title>
        <meta name="description" content={descriptionText?.slice(0, 160) || 'About Chesssaga'} />
      </Helmet>
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <article className="lg:col-span-8">
          {/* secondary header removed; gradient header above */}

          {/* Founder card */}
          {data?.founder && (
            <aside className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-6">
                {data.founder.image?.asset && (
                  <img
                    src={urlForImage(data.founder.image.asset)}
                    alt={data.founder.image?.alt || data.founder?.name || 'Founder'}
                    loading="lazy"
                    className="h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover border border-slate-200"
                  />
                )}
                <div>
                  <p className="text-sm text-slate-500">{data.founder?.role || 'Founder'}</p>
                  <p className="text-xl font-semibold text-[#0f172a]">{data.founder?.name || 'Unknown'}</p>
                </div>
              </div>
            </aside>
          )}

          {/* Rich description */}
          <div className="prose prose-slate max-w-none mt-6">
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-5 bg-slate-200 rounded w-5/6" />
                <div className="h-5 bg-slate-200 rounded w-2/3" />
                <div className="h-5 bg-slate-200 rounded w-4/5" />
              </div>
            ) : data?.description ? (
              <PortableText
                value={data.description}
                components={{
                  block: {
                    h2: ({ children }) => (
                      <h2 className="mt-8 scroll-mt-24 text-2xl font-semibold text-[#0f172a]">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mt-6 scroll-mt-24 text-xl font-semibold text-[#0f172a]">{children}</h3>
                    ),
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
                      const alt = value?.alt || data?.heading || 'About image'
                      if (!src) return null
                      return (
                        <figure className="my-6">
                          <img src={src} alt={alt} loading="lazy" className="w-full rounded-xl border border-slate-200 object-cover" />
                          {alt && <figcaption className="mt-2 text-xs text-slate-500">{alt}</figcaption>}
                        </figure>
                      )
                    },
                  },
                  marks: {
                    link: ({ children, value }) => {
                      const href = value?.href || '#'
                      const isExternal = /^https?:\/\//.test(href)
                      return (
                        <a href={href} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noopener noreferrer' : undefined} className="text-[#2563eb] hover:underline">{children}</a>
                      )
                    },
                  },
                }}
              />
            ) : (
              <p className="text-[#64748b]">No content available.</p>
            )}
          </div>
        </article>

        {/* Decorative/CTA sidecard */}
        <aside className="lg:col-span-4">
          <div className="rounded-xl border border-slate-200 bg-[#eff6ff] p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0f172a]">Our Mission</h2>
            <p className="text-[#64748b] mt-2">We’re building a clean, premium chess learning platform with modern design and accessible content.</p>
            <a href="/contact" className="mt-4 inline-block rounded-lg bg-[#2563eb] px-5 py-2.5 text-white shadow-sm hover:shadow-md hover:bg-blue-600">Contact Us</a>
          </div>
        </aside>
      </section>
      </div>
    </div>
  )
}
