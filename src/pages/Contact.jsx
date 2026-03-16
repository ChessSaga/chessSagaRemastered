import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { client } from '../sanity'

export default function Contact() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    client
      .fetch("*[_type=='contact'][0]{email, phone, address}")
      .then((res) => active && setData(res || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
    return () => { active = false }
  }, [])

  return (
    <main className="bg-white">
      <Helmet>
        <title>Contact — Chesssaga</title>
        <meta name="description" content="Contact Chesssaga team" />
      </Helmet>
      {/* Gradient header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#eff6ff] to-white" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 pt-12 pb-6 sm:pt-16 sm:pb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0f172a]">Contact Us</h1>
          <p className="mt-2 text-[#64748b]">We’d love to hear from you. Reach out anytime.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact details */}
        <aside className="lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0f172a]">Details</h2>
            {loading ? (
              <div className="animate-pulse mt-3 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
              </div>
            ) : (
              <ul className="mt-3 text-slate-700">
                <li className="mt-2"><span className="font-medium">Email:</span> {data?.email || '—'}</li>
                <li className="mt-2"><span className="font-medium">Phone:</span> {data?.phone || '—'}</li>
                <li className="mt-2"><span className="font-medium">Address:</span> {data?.address || '—'}</li>
              </ul>
            )}
          </div>
          <div className="mt-6 rounded-xl border border-slate-200 bg-[#eff6ff] p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#0f172a]">Support</h3>
            <p className="text-[#64748b] mt-1">For issues or questions, we typically respond within 24–48 hours.</p>
          </div>
        </aside>

        {/* Contact form */}
        <article className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0f172a]">Send us a message</h2>
            <form action="https://formsubmit.co/your@email.com" method="POST" className="mt-3 grid gap-4">
              <input type="hidden" name="_subject" value="Chesssaga Contact Message" />
              <input type="hidden" name="_captcha" value="false" />
              <label htmlFor="name" className="sr-only">Name</label>
              <input id="name" name="name" type="text" className="border border-slate-300 rounded-lg px-4 py-3 text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#2563eb]" placeholder="Your name" required />
              <label htmlFor="email" className="sr-only">Email</label>
              <input id="email" name="email" type="email" className="border border-slate-300 rounded-lg px-4 py-3 text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#2563eb]" placeholder="Your email" required />
              <label htmlFor="message" className="sr-only">Message</label>
              <textarea id="message" name="message" rows="5" className="border border-slate-300 rounded-lg px-4 py-3 text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#2563eb]" placeholder="Message" required />
              <button type="submit" className="rounded-lg bg-[#2563eb] px-6 py-3 text-white shadow-sm hover:shadow-md hover:bg-blue-600">Send</button>
              <p className="text-xs text-[#64748b]">Form sends via FormSubmit.</p>
            </form>
          </div>
        </article>
      </section>
    </main>
  )
}
