import {Link} from 'react-router-dom'

export default function ProgramCard({title, audience, bullets = [], cta, icon = '♟'}) {
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-xl text-[var(--color-primary)]" aria-hidden="true">
        {icon}
      </div>
      <h3 className="mt-4 text-xl font-semibold text-slate-900">{title}</h3>
      {audience ? <p className="mt-1 text-sm text-slate-500">{audience}</p> : null}
      <ul className="mt-4 space-y-2 text-sm text-slate-600">
        {bullets.map((point) => (
          <li key={point} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" aria-hidden="true" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      {cta ? (
        <Link
          to={cta.href}
          className="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-[var(--color-primary)]"
        >
          {cta.text}
        </Link>
      ) : null}
    </article>
  )
}
