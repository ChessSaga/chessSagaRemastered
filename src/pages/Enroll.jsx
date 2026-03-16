import {useEffect, useState} from 'react'
import {Helmet} from 'react-helmet-async'
import {useNavigate} from 'react-router-dom'
import {client} from '../sanity'

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
  const [courses, setCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [buyerWhatsApp, setBuyerWhatsApp] = useState('')
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    client
      .fetch(
        "*[_type == 'course' && isActive == true] | order(sortOrder asc, _createdAt desc){_id, title, description, price, currency, ctaLabel}"
      )
      .then((result) => {
        if (!active) return
        setCourses(result || [])
        setSelectedCourseId(result?.[0]?._id || '')
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
  }, [])

  async function startPayment() {
    setError('')

    if (!selectedCourseId) {
      setError('Please select a course.')
      return
    }

    if (!buyerName.trim() || !buyerWhatsApp.trim()) {
      setError('Please provide your name and WhatsApp number.')
      return
    }

    setPaying(true)

    try {
      const loaded = await ensureRazorpayLoaded()
      if (!loaded) throw new Error('Unable to load payment gateway. Try again.')

      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          courseId: selectedCourseId,
          buyerName,
          buyerWhatsApp,
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
        name: 'Chesssaga',
        description: orderData.course.title,
        order_id: orderData.order.id,
        prefill: {
          name: buyerName,
          contact: buyerWhatsApp,
        },
        notes: {
          courseId: selectedCourseId,
        },
        handler: async (response) => {
          try {
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                ...response,
                courseId: selectedCourseId,
                buyerName,
                buyerWhatsApp,
              }),
            })

            const verifyData = await verifyResponse.json()
            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Payment verification failed')
            }

            navigate('/payment-success', {
              state: {
                purchaseEvent: {
                  value: Number(orderData.order.amount) / 100,
                  currency: orderData.order.currency,
                  content_name: orderData.course.title,
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
          ondismiss: () => {
            setPaying(false)
          },
        },
        theme: {
          color: '#2563eb',
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
    <main className="bg-white min-h-[70vh]">
      <Helmet>
        <title>Enroll In Course - Chesssaga</title>
        <meta
          name="description"
          content="Choose a chess program and enroll securely online using Razorpay checkout."
        />
      </Helmet>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#eff6ff] to-white" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4 pt-12 pb-8 sm:pt-16 sm:pb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0f172a]">Enroll In A Program</h1>
          <p className="mt-3 text-[#64748b] max-w-2xl">
            Select your preferred course, complete secure payment, and we will share onboarding details.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-12 grid gap-6 lg:grid-cols-3">
        <article className="lg:col-span-2 grid gap-4">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse h-44" />
          ) : courses.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[#64748b]">No active courses are available right now.</p>
            </div>
          ) : (
            courses.map((course) => {
              const selected = selectedCourseId === course._id
              return (
                <button
                  key={course._id}
                  type="button"
                  onClick={() => setSelectedCourseId(course._id)}
                  className={`text-left rounded-xl border p-5 shadow-sm transition ${
                    selected
                      ? 'border-[#2563eb] bg-[#eff6ff]'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <h2 className="text-xl font-semibold text-[#0f172a]">{course.title}</h2>
                  <p className="text-[#64748b] mt-2">{course.description}</p>
                  <p className="mt-3 text-lg font-semibold text-[#0f172a]">
                    {(course.currency || 'INR')} {course.price}
                  </p>
                </button>
              )
            })
          )}
        </article>

        <aside className="lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#0f172a]">Your Details</h3>
            <div className="grid gap-3 mt-4">
              <label htmlFor="buyerName" className="sr-only">Name</label>
              <input
                id="buyerName"
                value={buyerName}
                onChange={(event) => setBuyerName(event.target.value)}
                className="border border-slate-300 rounded-lg px-4 py-3 text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                placeholder="Your full name"
              />

              <label htmlFor="buyerWhatsApp" className="sr-only">WhatsApp Number</label>
              <input
                id="buyerWhatsApp"
                value={buyerWhatsApp}
                onChange={(event) => setBuyerWhatsApp(event.target.value)}
                className="border border-slate-300 rounded-lg px-4 py-3 text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                placeholder="WhatsApp number"
              />

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <button
                type="button"
                onClick={startPayment}
                disabled={paying || loading || courses.length === 0}
                className="rounded-lg bg-[#2563eb] px-6 py-3 text-white shadow-sm hover:shadow-md hover:bg-blue-600 disabled:opacity-70"
              >
                {paying ? 'Processing...' : 'Enroll Now'}
              </button>
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}
