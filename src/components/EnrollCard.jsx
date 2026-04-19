import {trackInitiateCheckout} from '../utils/metaPixel'

export default function EnrollCard({
  course,
  buyerName,
  buyerEmail,
  buyerWhatsApp,
  setBuyerName,
  setBuyerEmail,
  setBuyerWhatsApp,
  onEnroll,
  loading,
  error,
}) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-20" aria-live="polite">
      <h3 className="text-lg font-semibold text-slate-900">Secure Checkout</h3>
      <p className="mt-1 text-sm text-slate-500">Pay via Razorpay. Refund policy applies as per enrollment terms.</p>

      {course ? (
        <div className="mt-4 rounded-xl bg-blue-50 p-4">
          <p className="text-sm font-medium text-slate-700">Selected Course</p>
          <p className="mt-1 text-base font-semibold text-slate-900">{course.title}</p>
          <p className="mt-1 text-xl font-bold text-[var(--color-primary)]">INR {course.price}</p>
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="buyerName" className="mb-1 block text-sm font-semibold text-slate-800">
            Name *
          </label>
          <input
            id="buyerName"
            value={buyerName}
            onChange={(event) => setBuyerName(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
            placeholder="Enter your full name"
            required
          />
        </div>
        <div>
          <label htmlFor="buyerEmail" className="mb-1 block text-sm font-semibold text-slate-800">
            Email *
          </label>
          <input
            id="buyerEmail"
            type="email"
            value={buyerEmail}
            onChange={(event) => setBuyerEmail(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label htmlFor="buyerWhatsApp" className="mb-1 block text-sm font-semibold text-slate-800">
            WhatsApp Number *
          </label>
          <input
            id="buyerWhatsApp"
            value={buyerWhatsApp}
            onChange={(event) => setBuyerWhatsApp(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
            placeholder="+91 98765 43210"
            required
          />
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <button
        type="button"
        disabled={loading || !course}
        onClick={() => {
          trackInitiateCheckout({
            content_name: course?.title || 'Course Enrollment',
            value: Number(course?.price || 0),
            currency: course?.currency || 'INR',
          })
          onEnroll()
        }}
        className="mt-4 inline-flex w-full justify-center rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#082f58] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? 'Processing...' : 'Enroll Now'}
      </button>

      <p className="mt-3 text-xs text-slate-500">Your payment is encrypted and verified before enrollment is confirmed.</p>
    </aside>
  )
}
