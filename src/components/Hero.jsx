import {Link} from 'react-router-dom'

export default function Hero({headline, subtext, primaryCta, secondaryCta, imageSrc, imageAlt}) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/80 via-sky-50 to-transparent" aria-hidden="true" />
      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div className="animate-fade-slide-up">
          <p className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)] shadow-sm">
            FIDE-Rated Online Coaching
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-[var(--color-primary)] sm:text-5xl">
            {headline}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">{subtext}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to={primaryCta.href}
              className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-[#082f58]"
            >
              {primaryCta.text}
            </Link>
            <Link
              to={secondaryCta.href}
              className="rounded-xl border border-[var(--color-primary)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-blue-50"
            >
              {secondaryCta.text}
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">2,000+ Students</span>
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">FIDE Coaches</span>
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">12 Countries</span>
          </div>
        </div>

        <div className="animate-fade-slide-up [animation-delay:100ms]">
          <img
            src={imageSrc}
            srcSet={`${imageSrc} 1x, ${imageSrc} 2x`}
            alt={imageAlt}
            loading="lazy"
            className="w-full rounded-3xl border border-blue-100 bg-white object-cover shadow-2xl shadow-blue-950/10"
          />
        </div>
      </div>
    </section>
  )
}
