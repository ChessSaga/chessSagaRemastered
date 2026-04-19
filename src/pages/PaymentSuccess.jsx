import {useEffect} from 'react'
import {Helmet} from 'react-helmet-async'
import {Link, useLocation} from 'react-router-dom'
import {trackPurchase} from '../utils/metaPixel'

export default function PaymentSuccess() {
  const location = useLocation()
  const purchaseData = location.state?.purchaseEvent || null
  const details = location.state?.details || {}
  const purchaseId = location.state?.purchaseId || ''

  useEffect(() => {
    if (purchaseData) {
      trackPurchase(purchaseData)
    }
  }, [purchaseData])

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <Helmet>
        <title>Payment successful! - Chess Saga</title>
        <meta
          name="description"
          content="Thank you for enrolling. Our team will contact you with next steps."
        />
      </Helmet>

      <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-lg shadow-emerald-900/10 sm:p-8">
        <h1 className="text-3xl font-bold text-emerald-900">Payment successful!</h1>
        <p className="mt-2 text-emerald-900">
          Thank you for enrolling. Our team will contact you with next steps shortly.
        </p>

        <div className="mt-6 grid gap-3 rounded-2xl bg-white p-4 text-sm text-slate-700 sm:grid-cols-2">
          <p><span className="font-semibold">Order ID:</span> {details.orderId || '-'}</p>
          <p><span className="font-semibold">Payment ID:</span> {details.paymentId || '-'}</p>
          <p><span className="font-semibold">Course:</span> {details.course || '-'}</p>
          <p><span className="font-semibold">Amount:</span> {details.amount ? `${details.currency || 'INR'} ${details.amount}` : '-'}</p>
          <p><span className="font-semibold">Email:</span> {details.email || '-'}</p>
          <p className="sm:col-span-2"><span className="font-semibold">Contact WhatsApp:</span> {details.contact || '-'}</p>
          {purchaseId ? <p className="sm:col-span-2"><span className="font-semibold">Reference:</span> {purchaseId}</p> : null}
        </div>

        <div className="mt-6 rounded-xl border border-emerald-200 bg-white p-4 text-sm text-slate-700">
          Next step: Your trainer coordinator will reach out on WhatsApp with schedule and onboarding details.
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Print / Save Receipt
          </button>
          <a
            href="https://wa.me/917303746548"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-emerald-700 px-4 py-2.5 text-sm font-semibold text-emerald-800"
          >
            WhatsApp Support: +91 73037 46548
          </a>
          <Link to="/programs" className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800">
            Back to Programs
          </Link>
        </div>
      </section>
    </main>
  )
}
