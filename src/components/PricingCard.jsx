import {Link} from 'react-router-dom'

export default function PricingCard({title, price, bullets = [], featured = false, ctaText, courseSlug}) {
  return (
    <article
      className={`rounded-2xl border p-6 shadow-sm ${
        featured
          ? 'border-[var(--color-accent)] bg-blue-50/50 shadow-lg shadow-blue-900/10'
          : 'border-slate-200 bg-white'
      }`}
    >
      {featured ? (
        <span className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-white">Most Popular</span>
      ) : null}
      <h3 className="mt-3 text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-3xl font-bold text-[var(--color-primary)]">{price}</p>
      <ul className="mt-4 space-y-2 text-sm text-slate-600">
        {bullets.map((point) => (
          <li key={point} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-accent-2)]" aria-hidden="true" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <Link
        to={courseSlug ? `/enroll?course=${courseSlug}` : '/enroll'}
        className="mt-6 inline-flex rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#082f58]"
      >
        {ctaText}
      </Link>
    </article>
  )
}
