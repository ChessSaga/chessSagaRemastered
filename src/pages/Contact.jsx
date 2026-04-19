import {useState} from 'react'
import {Helmet} from 'react-helmet-async'

const INITIAL_FORM_STATE = {
  name: '',
  email: '',
  phone: '',
  childAge: '',
  message: '',
}

export default function Contact() {
  const [formState, setFormState] = useState(INITIAL_FORM_STATE)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function onInputChange(event) {
    const {name, value} = event.target
    setFormState((prev) => ({
      ...prev,
      [name]: name === 'phone' ? value.replace(/[^\d+\s-]/g, '').slice(0, 24) : value,
    }))
  }

  function validateForm() {
    if (!formState.name.trim() || !formState.email.trim() || !formState.phone.trim() || !formState.message.trim()) {
      return 'Please fill all required fields.'
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) {
      return 'Please provide a valid email address.'
    }

    if (!/^[+\d][\d\s-]{7,23}$/.test(formState.phone.trim())) {
      return 'Please provide a valid phone number.'
    }

    if (formState.childAge) {
      const age = Number(formState.childAge)
      if (!Number.isFinite(age)) {
        return 'Please enter a valid age.'
      }
    }

    return ''
  }

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contact-lead', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: formState.name.trim(),
          email: formState.email.trim(),
          phone: formState.phone.trim(),
          childAge: formState.childAge ? Number(formState.childAge) : null,
          message: formState.message.trim(),
        }),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Submission failed. Please try again.')
      }

      setSuccess('Thank you! We received your message and will contact you shortly.')
      setFormState(INITIAL_FORM_STATE)
    } catch (submitError) {
      setError(submitError.message || 'Submission failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <Helmet>
        <title>Contact - Chess Saga</title>
        <meta name="description" content="Let's get your child started. Contact Chess Saga via WhatsApp or form." />
      </Helmet>

      <header className="max-w-3xl animate-fade-slide-up">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-accent)]">Contact</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--color-primary)] sm:text-4xl">Let's Get Your Child Started</h1>
      </header>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Talk to us directly</h2>
          <p className="mt-2 text-sm text-slate-600">
            Share your age and current level. We will recommend the right trial and batch.
          </p>

          <div className="mt-5 space-y-3">
            <a
              href="https://wa.me/917303746548"
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white"
            >
              Chat on WhatsApp: +91 73037 46548
            </a>
            <a href="mailto:chesssaga64@gmail.com" className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700">
              Email us at chesssaga64@gmail.com
            </a>
          </div>

          <p className="mt-5 text-xs text-slate-500">Office hours: Mon-Sat, 9 AM - 7 PM IST</p>
        </aside>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Send a message</h2>
          <form onSubmit={onSubmit} className="mt-4 space-y-3" noValidate>

            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-semibold text-slate-800">Name</label>
              <input
                id="name"
                name="name"
                value={formState.name}
                onChange={onInputChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-semibold text-slate-800">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formState.email}
                onChange={onInputChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-semibold text-slate-800">Phone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formState.phone}
                onChange={onInputChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
              />
            </div>

            <div>
              <label htmlFor="childAge" className="mb-1 block text-sm font-semibold text-slate-800">Age</label>
              <input
                id="childAge"
                name="childAge"
                type="number"
                value={formState.childAge}
                onChange={onInputChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
              />
            </div>

            <div>
              <label htmlFor="message" className="mb-1 block text-sm font-semibold text-slate-800">Message</label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={formState.message}
                onChange={onInputChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
              />
            </div>

            <div aria-live="polite" className="min-h-5">
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {success ? <p className="text-sm text-green-700">{success}</p> : null}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </article>
      </section>
    </main>
  )
}
