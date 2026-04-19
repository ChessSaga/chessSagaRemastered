import {Helmet} from 'react-helmet-async'
import {useMemo} from 'react'
import TrialForm from '../components/TrialForm'

export default function Trial() {
  const enableExtendedFields = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('extended') === 'true'
  }, [])

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <Helmet>
        <title>Book a Free Chess Trial - Chess Saga</title>
        <meta name="description" content="Book a free trial class for your child. No payment required." />
      </Helmet>

      <section className="animate-fade-slide-up rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-950/5 sm:p-8">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">Free Trial</p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--color-primary)] sm:text-4xl">Book Your Child's Trial Class</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            Fill in the form and our trainer will contact you shortly on WhatsApp. Minimal fields are shown by default for faster booking.
          </p>
        </header>

        <TrialForm extended={enableExtendedFields} showExtendedToggle />
      </section>
    </main>
  )
}
