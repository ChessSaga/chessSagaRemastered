import {useEffect} from 'react'
import {Helmet} from 'react-helmet-async'
import {Link, useLocation} from 'react-router-dom'
import {trackPurchase} from '../lib/metaPixel'

export default function PaymentSuccess() {
  const location = useLocation()
  const purchaseData = location.state?.purchaseEvent || null
  const purchaseId = location.state?.purchaseId || ''

  useEffect(() => {
    if (purchaseData) {
      trackPurchase(purchaseData)
    }
  }, [purchaseData])

  return (
    <main className="bg-white min-h-[70vh]">
      <Helmet>
        <title>Payment Success - Chesssaga</title>
        <meta
          name="description"
          content="Payment completed successfully. Our team will contact you with next steps."
        />
      </Helmet>

      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 shadow-sm text-center">
          <h1 className="text-3xl font-bold text-emerald-800">Payment Successful</h1>
          <p className="mt-3 text-emerald-900">
            Payment successful. Our team will contact you with next steps.
          </p>
          {purchaseId ? (
            <p className="mt-3 text-sm text-emerald-700">Reference ID: {purchaseId}</p>
          ) : null}

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              to="/"
              className="rounded-lg bg-emerald-700 px-5 py-3 text-white hover:bg-emerald-800"
            >
              Back To Home
            </Link>
            <Link
              to="/contact"
              className="rounded-lg border border-emerald-700 px-5 py-3 text-emerald-800 hover:bg-emerald-100"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
