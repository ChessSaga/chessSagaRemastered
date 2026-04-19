import {useMemo, useState} from 'react'
import {trackLead} from '../utils/metaPixel'

const BASE_FIELDS = [
  {name: 'name', type: 'text', label: 'Name', required: true, placeholder: 'Enter full name'},
  {name: 'childAge', type: 'number', label: 'Age', required: true, placeholder: 'Enter age'},
  {
    name: 'whatsappNumber',
    type: 'tel',
    label: 'WhatsApp Number',
    required: true,
    placeholder: '+91 98765 43210',
  },
  {name: 'message', type: 'textarea', label: 'Message (optional)', required: false, placeholder: 'Goals or preferred timing'},
]

const EXT_FIELDS = [
  {name: 'parentName', type: 'text', label: 'Parent Name', required: false, placeholder: 'Parent name'},
  {name: 'childName', type: 'text', label: 'Child Name', required: false, placeholder: 'Child name'},
  {
    name: 'currentLevel',
    type: 'select',
    label: 'Current Level',
    required: false,
    options: ['Beginner', 'Intermediate', 'Advanced'],
  },
  {name: 'country', type: 'text', label: 'Country', required: false, placeholder: 'Country'},
  {name: 'email', type: 'email', label: 'Email', required: false, placeholder: 'you@example.com'},
]

const INITIAL_STATE = {
  name: '',
  childAge: '',
  whatsappNumber: '',
  message: '',
  parentName: '',
  childName: '',
  currentLevel: '',
  country: '',
  email: '',
}

function normalizeWhatsApp(value) {
  return value.replace(/[^\d+\s-]/g, '').slice(0, 20)
}

export default function TrialForm({extended = false, showExtendedToggle = false}) {
  const [formState, setFormState] = useState(INITIAL_STATE)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [extendedMode, setExtendedMode] = useState(Boolean(extended))

  const fields = useMemo(() => (extendedMode ? [...BASE_FIELDS, ...EXT_FIELDS] : BASE_FIELDS), [extendedMode])

  const utmValues = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return {
      utmSource: params.get('utm_source') || '',
      utmCampaign: params.get('utm_campaign') || '',
      utmMedium: params.get('utm_medium') || params.get('utm_ad') || '',
    }
  }, [])

  function onInputChange(event) {
    const {name, value} = event.target
    setFormState((prev) => ({
      ...prev,
      [name]: name === 'whatsappNumber' ? normalizeWhatsApp(value) : value,
    }))
  }

  function validateForm() {
    if (!formState.name.trim() || !formState.whatsappNumber.trim() || !String(formState.childAge).trim()) {
      return 'Please fill all required fields.'
    }

    const age = Number(formState.childAge)
    if (!Number.isFinite(age)) {
      return 'Please enter a valid age.'
    }

    if (!/^[+\d][\d\s-]{7,19}$/.test(formState.whatsappNumber.trim())) {
      return 'Please enter a valid WhatsApp number.'
    }

    if (formState.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      return 'Please enter a valid email.'
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
      const payload = {
        name: formState.name.trim(),
        childAge: Number(formState.childAge),
        whatsappNumber: formState.whatsappNumber.trim(),
        message: formState.message.trim(),
        source: 'whatsapp',
        ...utmValues,
      }

      if (extendedMode) {
        payload.parentName = formState.parentName.trim()
        payload.childName = formState.childName.trim()
        payload.currentLevel = formState.currentLevel
        payload.country = formState.country.trim()
        payload.email = formState.email.trim()
      }

      const response = await fetch('/api/trial-lead', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Submission failed. Please try again.')
      }

      trackLead({
        content_name: 'Trial Form',
        status: 'submitted',
      })

      setSuccess('Thank you! Our trainer will contact you shortly.')
      setFormState(INITIAL_STATE)
    } catch (submitError) {
      setError(submitError.message || 'Submission failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" aria-describedby="trial-consent">
      {showExtendedToggle ? (
        <label className="inline-flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={extendedMode}
            onChange={(event) => setExtendedMode(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Show additional details fields
        </label>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.name} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
            <label htmlFor={field.name} className="mb-1 block text-sm font-semibold text-slate-800">
              {field.label}
              {field.required ? ' *' : ''}
            </label>

            {field.type === 'textarea' ? (
              <textarea
                id={field.name}
                name={field.name}
                value={formState[field.name]}
                onChange={onInputChange}
                placeholder={field.placeholder}
                rows={4}
                required={field.required}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-blue-200"
              />
            ) : null}

            {field.type === 'select' ? (
              <select
                id={field.name}
                name={field.name}
                value={formState[field.name]}
                onChange={onInputChange}
                required={field.required}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Select level</option>
                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : null}

            {field.type !== 'textarea' && field.type !== 'select' ? (
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                inputMode={field.type === 'tel' ? 'tel' : undefined}
                value={formState[field.name]}
                onChange={onInputChange}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-blue-200"
              />
            ) : null}
          </div>
        ))}
      </div>

      <p id="trial-consent" className="text-xs text-slate-500">
        By submitting you agree to receive messages on WhatsApp.
      </p>

      <div aria-live="polite" className="min-h-5">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {success ? <p className="text-sm text-green-700">{success}</p> : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#082f58] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? 'Submitting...' : 'Book Free Trial Class'}
      </button>
    </form>
  )
}
