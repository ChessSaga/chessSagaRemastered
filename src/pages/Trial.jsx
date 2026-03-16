import {useMemo, useState} from 'react'
import {Helmet} from 'react-helmet-async'
import {trackLead} from '../lib/metaPixel'

const INITIAL_FORM = {
  name: '',
  childAge: '',
  whatsappNumber: '',
  message: '',
}

export default function Trial() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const utm = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return {
      utmCampaign: params.get('utm_campaign') || '',
      utmSource: params.get('utm_source') || '',
      utmMedium: params.get('utm_medium') || '',
    }
  }, [])

  function onInputChange(event) {
    const {name, value} = event.target
    setForm((prev) => ({...prev, [name]: value}))
  }

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!form.name.trim() || !String(form.childAge).trim() || !form.whatsappNumber.trim()) {
      setError('Please fill in all required fields.')
      return
    }

    const childAge = Number(form.childAge)
    if (!Number.isFinite(childAge) || childAge < 1) {
      setError('Please enter a valid age.')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/trial-lead', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: form.name,
          childAge,
          whatsappNumber: form.whatsappNumber,
          message: form.message,
          source: 'whatsapp',
          ...utm,
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to submit trial request')
      }

      trackLead({
        content_name: 'Trial Request',
        status: 'submitted',
      })

      setSuccess('Trial request submitted successfully. Our trainer will contact you shortly.')
      setForm(INITIAL_FORM)
    } catch (submitError) {
      setError(submitError.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="bg-white min-h-[70vh]">
      <Helmet>
        <title>Schedule Trial - Chesssaga</title>
        <meta
          name="description"
          content="Request a free chess trial session. Share child details and we will contact you on WhatsApp."
        />
      </Helmet>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#eff6ff] to-white" aria-hidden="true" />
        <div className="relative max-w-4xl mx-auto px-4 pt-12 pb-8 sm:pt-16 sm:pb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0f172a]">Schedule A Free Trial</h1>
          <p className="mt-3 text-[#64748b] max-w-2xl">
            Fill out this quick form and our trainer will reach out on WhatsApp to schedule a trial class.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-12">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-1">
              <label htmlFor="name" className="text-sm font-medium text-[#0f172a]">Parent / Student Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={onInputChange}
                className="border border-slate-300 rounded-lg px-4 py-3 text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="grid gap-1">
              <label htmlFor="childAge" className="text-sm font-medium text-[#0f172a]">Child Age *</label>
              <input
                id="childAge"
                name="childAge"
                type="number"
                min="1"
                value={form.childAge}
                onChange={onInputChange}
                className="border border-slate-300 rounded-lg px-4 py-3 text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                placeholder="Enter age"
                required
              />
            </div>

            <div className="grid gap-1">
              <label htmlFor="whatsappNumber" className="text-sm font-medium text-[#0f172a]">WhatsApp Number *</label>
              <input
                id="whatsappNumber"
                name="whatsappNumber"
                type="text"
                value={form.whatsappNumber}
                onChange={onInputChange}
                className="border border-slate-300 rounded-lg px-4 py-3 text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                placeholder="Enter WhatsApp number"
                required
              />
            </div>

            <div className="grid gap-1">
              <label htmlFor="message" className="text-sm font-medium text-[#0f172a]">Message (optional)</label>
              <textarea
                id="message"
                name="message"
                rows="4"
                value={form.message}
                onChange={onInputChange}
                className="border border-slate-300 rounded-lg px-4 py-3 text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                placeholder="Share goals or preferred class time"
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {success ? <p className="text-sm text-green-700">{success}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#2563eb] px-6 py-3 text-white shadow-sm hover:shadow-md hover:bg-blue-600 disabled:opacity-70"
            >
              {submitting ? 'Submitting...' : 'Request Trial'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
