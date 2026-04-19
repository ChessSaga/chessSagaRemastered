import {useEffect, useMemo, useState} from 'react'
import {Helmet} from 'react-helmet-async'
import {useNavigate, useSearchParams} from 'react-router-dom'
import EnrollCard from '../components/EnrollCard'
import {client} from '../sanity'
import {ACTIVE_COURSES_QUERY} from '../lib/courseQueries'

async function ensureRazorpayLoaded() {
  if (window.Razorpay) return true

  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function Enroll() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [courses, setCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerWhatsApp, setBuyerWhatsApp] = useState('')
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  const utmValues = useMemo(() => ({
    utmSource: searchParams.get('utm_source') || '',
    utmCampaign: searchParams.get('utm_campaign') || '',
    utmMedium: searchParams.get('utm_medium') || '',
  }), [searchParams])

  useEffect(() => {
    let active = true

    client
      .fetch(ACTIVE_COURSES_QUERY)
      .then((result) => {
        if (!active) return
        const list = result || []
        setCourses(list)

        const wantedSlug = searchParams.get('course')
        const matchedBySlug = list.find((item) => item.slug?.current === wantedSlug)
        setSelectedCourseId(matchedBySlug?._id || list?.[0]?._id || '')
      })
      .catch(() => {
        if (active) setError('Unable to load courses right now.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [searchParams])

  const selectedCourse = courses.find((course) => course._id === selectedCourseId) || null
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  async function startPayment() {
    setError('')

    if (!selectedCourseId) {
      setError('Please select a course.')
      return
    }

    const normalizedEmail = buyerEmail.trim().toLowerCase()

    if (!buyerName.trim() || !normalizedEmail || !buyerWhatsApp.trim()) {
      setError('Please provide your name, email, and WhatsApp number.')
      return
    }

    if (!emailRegex.test(normalizedEmail)) {
      setError('Please provide a valid email address.')
      return
    }

    setPaying(true)

    try {
      const loaded = await ensureRazorpayLoaded()
      if (!loaded) throw new Error('Unable to load payment gateway. Please try again.')

      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          courseId: selectedCourseId,
          buyerName: buyerName.trim(),
          buyerEmail: normalizedEmail,
          buyerWhatsApp: buyerWhatsApp.trim(),
          ...utmValues,
        }),
      })

      const orderData = await orderResponse.json()
      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.error || 'Unable to start payment')
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'Chess Saga',
        description: orderData.course.title,
        order_id: orderData.order.id,
        prefill: {
          name: buyerName,
          email: normalizedEmail,
          contact: buyerWhatsApp,
        },
        notes: {
          courseId: selectedCourseId,
          ...utmValues,
        },
        handler: async (response) => {
          try {
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                ...response,
                courseId: selectedCourseId,
                buyerName: buyerName.trim(),
                buyerEmail: normalizedEmail,
                buyerWhatsApp: buyerWhatsApp.trim(),
                ...utmValues,
              }),
            })

            const verifyData = await verifyResponse.json()
            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Payment verification failed')
            }

            const recoveryLink = verifyData?.onboarding?.recoveryLink || ''
            if (recoveryLink) {
              window.location.assign(recoveryLink)
              return
            }

            navigate('/reset-password', {
              replace: true,
              state: {
                purchaseEvent: {
                  value: Number(orderData.order.amount) / 100,
                  currency: orderData.order.currency,
                  content_name: orderData.course.title,
                  order_id: orderData.order.id,
                },
                purchaseId: verifyData.purchaseId,
              },
            })
          } catch (verifyError) {
            setError(verifyError.message || 'Payment verification failed.')
            setPaying(false)
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
        theme: {
          color: '#0B3B6F',
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.on('payment.failed', () => {
        setError('Payment was not completed. Please try again.')
        setPaying(false)
      })
      razorpay.open()
    } catch (paymentError) {
      setError(paymentError.message || 'Unable to start checkout')
      setPaying(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      <Helmet>
        <title>Enroll - Chess Saga</title>
        <meta
          name="description"
          content="Purchase the Chess Saga course after trial. Secure payments via Razorpay."
        />
      </Helmet>

      <header className="mb-8 max-w-3xl animate-fade-slide-up">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-accent)]">Enroll</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--color-primary)] sm:text-4xl">Choose the right plan and enroll securely</h1>
        <p className="mt-3 text-slate-600">
          Complete payment to reserve your batch. Our team will contact you immediately with onboarding steps.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <article className="space-y-4">
          {loading ? (
            <div className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          ) : null}

          {!loading && courses.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
              No active courses are available right now.
            </div>
          ) : null}

          {courses.map((course) => {
            const selected = course._id === selectedCourseId
            return (
              <button
                key={course._id}
                type="button"
                onClick={() => setSelectedCourseId(course._id)}
                className={`w-full rounded-2xl border p-5 text-left shadow-sm transition ${
                  selected
                    ? 'border-[var(--color-accent)] bg-blue-50/60'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{course.title}</h2>
                    <p className="mt-1 text-sm text-slate-600">{course.description || 'Structured learning track for measurable progress.'}</p>
                  </div>
                  <p className="text-xl font-bold text-[var(--color-primary)]">INR {course.price}</p>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  {(course.benefits || ['Coach guidance', 'Practice assignments', 'Progress tracking']).map((item) => (
                    <span key={`${course._id}-${item}`} className="rounded-lg bg-white px-3 py-2">
                      {item}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </article>

        <EnrollCard
          course={selectedCourse}
          buyerName={buyerName}
          buyerEmail={buyerEmail}
          buyerWhatsApp={buyerWhatsApp}
          setBuyerName={setBuyerName}
          setBuyerEmail={setBuyerEmail}
          setBuyerWhatsApp={setBuyerWhatsApp}
          onEnroll={startPayment}
          loading={paying || loading}
          error={error}
        />
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={startPayment}
          disabled={paying || loading || !selectedCourse}
          className="w-full rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
        >
          {paying ? 'Processing...' : 'Enroll Now'}
        </button>
      </div>
    </main>
  )
}
