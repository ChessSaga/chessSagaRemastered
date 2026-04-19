import {useEffect, useMemo, useState} from 'react'
import {Helmet} from 'react-helmet-async'
import {Link} from 'react-router-dom'
import Hero from '../components/Hero'
import ProgramCard from '../components/ProgramCard'
import FAQAccordion from '../components/FAQAccordion'
import {client} from '../sanity'
import {ACTIVE_COURSES_QUERY} from '../lib/courseQueries'

const programs = [
  {
    title: 'Beginner Program',
    bullets: ['Learn rules', 'Board vision', 'Fun interactive sessions'],
    cta: {text: 'Explore Beginner', href: '/programs?level=beginner'},
    icon: '♙',
  },
  {
    title: 'Intermediate Program',
    bullets: ['Tactical patterns', 'Positional understanding', 'Opening systems'],
    cta: {text: 'Explore Intermediate', href: '/programs?level=intermediate'},
    icon: '♘',
  },
  {
    title: 'Advanced Program',
    bullets: ['Advanced strategy', 'Opening preparation', 'Endgame mastery'],
    cta: {text: 'Explore Advanced', href: '/programs?level=advanced'},
    icon: '♗',
  },
]

const reasons = [
  'Coaches who are FIDE-rated competitive players',
  'Structured learning path, not random lessons',
  'Small batches for personal attention',
  'Focus on thinking skills and discipline',
  'Regular progress tracking and feedback',
  'Tournament guidance and preparation',
]

const qualities = [
  {title: 'Expert Coaching', subtitle: 'FIDE-rated mentors with proven results'},
  {title: 'Structured Curriculum', subtitle: 'Level-based roadmap from basics to mastery'},
  {title: 'Personal Attention', subtitle: 'Small batches with focused individual feedback'},
  {title: 'Tournament Readiness', subtitle: 'Practical preparation for competitive success'},
]

const testimonials = [
  {
    quote: 'My son improved his chess skills a lot after joining these classes. He now thinks much more calmly during tournaments.',
    author: 'Neha Sharma, Parent',
  },
  {
    quote: 'We saw a clear improvement in rating and confidence within a few months. The structured lessons made a big difference.',
    author: 'Rohit Verma, Parent',
  },
  {
    quote: 'My daughter used to get nervous in competitive games, but now she plays with confidence and better planning.',
    author: 'Priya Nair, Parent',
  },
  {
    quote: 'The coaches give individual attention and regular feedback. We can actually track progress month by month.',
    author: 'Amit Kulkarni, Parent',
  },
  {
    quote: 'Classes are engaging and disciplined. My child has become more focused, not just in chess but in studies too.',
    author: 'Sonal Gupta, Parent',
  },
  {
    quote: 'Excellent guidance for tournaments and openings. My son gained confidence and improved his game significantly.',
    author: 'Karthik Reddy, Parent',
  },
]

const faqs = [
  {
    question: 'How does the free trial class work?',
    answer: 'Book a slot, join online, and our coach will assess your child level and suggest the right batch.',
  },
  {
    question: 'Do you provide tournament guidance?',
    answer: 'Yes. We help with preparation, game reviews, and tournament planning based on level.',
  },
  {
    question: 'Is this suitable for complete beginners?',
    answer: 'Absolutely. We have beginner-friendly sessions focused on fundamentals and confidence.',
  },
]

export default function Home() {
  const [courses, setCourses] = useState([])

  useEffect(() => {
    let active = true

    client
      .fetch(ACTIVE_COURSES_QUERY)
      .then((result) => {
        if (!active) return
        setCourses(result || [])
      })
      .catch(() => {
        if (!active) return
        setCourses([])
      })

    return () => {
      active = false
    }
  }, [])

  const pricingCards = useMemo(() => {
    const realCards = courses.slice(0, 3).map((course, index) => ({
      type: 'course',
      key: course._id,
      title: course.title,
      bullets: (course.benefits && course.benefits.length > 0
        ? course.benefits
        : ['Coach guidance', 'Practice assignments', 'Progress tracking']).slice(0, 3),
      featured: index === 1,
      courseSlug: course.slug?.current,
      ctaText: 'Continue to Enroll',
    }))

    const fallbackTemplates = [
      {
        type: 'info',
        key: 'fallback-explore',
        title: 'Explore All Active Plans',
        description: 'See every current course with live pricing and full details on the Enroll page.',
        ctaText: 'View All Plans',
        href: '/enroll',
      },
      {
        type: 'info',
        key: 'fallback-guidance',
        title: 'Need Help Choosing?',
        description: 'Book a free trial first and we will recommend the best-fit course based on level.',
        ctaText: 'Book Free Trial',
        href: '/trial',
      },
      {
        type: 'info',
        key: 'fallback-contact',
        title: 'Custom Learning Support',
        description: 'If you need a custom plan, contact us and our team will guide your enrollment.',
        ctaText: 'Contact Us',
        href: '/contact',
      },
    ]

    return [...realCards, ...fallbackTemplates].slice(0, 3)
  }, [courses])

  return (
    <main>
      <Helmet>
        <title>Chess Saga - Online Chess Coaching for Kids | Free Trial</title>
        <meta
          name="description"
          content="Structured online chess coaching for ages 5-18. FIDE-rated coaches, trial class available. Improve focus, strategy, and competitive play."
        />
      </Helmet>

      <Hero
        headline="Train Your Child to Think Like a Champion"
        subtext="Structured online chess coaching for ages 5-18, led by FIDE-rated players. Build focus, strategy, and real competitive skill from home."
        primaryCta={{text: 'Book Free Trial Class', href: '/trial'}}
        secondaryCta={{text: 'Explore Programs', href: '/programs'}}
        imageSrc="/icons/Chess Saga Logo.png"
        imageAlt="Chess board themed visual for Chess Saga coaching"
      />

      <section className="mx-auto mt-4 w-full max-w-7xl px-4 sm:px-6">
        <div className="rounded-2xl bg-[var(--color-primary)] px-5 py-4 text-sm font-medium text-blue-50">
          <p>Trusted by 2,000+ Students Across 12 Countries</p>
          <div className="mt-2 grid gap-2 text-xs text-blue-100 sm:grid-cols-2 lg:grid-cols-4">
            <span>FIDE-Rated Professional Coaches</span>
            <span>Structured Curriculum</span>
            <span>Tournament Pathway</span>
            <span>Real Rating Improvement</span>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-14 w-full max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-[var(--color-primary)] sm:text-3xl">
            Programs Designed for Every Stage of Your Child's Chess Journey
          </h2>
          <Link to="/programs" className="hidden text-sm font-semibold text-[var(--color-accent)] hover:underline sm:inline">
            View All Programs
          </Link>
        </div>

        <div className="grid snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((item) => (
            <div key={item.title} className="min-w-[280px] snap-center sm:min-w-0">
              <ProgramCard title={item.title} bullets={item.bullets} cta={item.cta} icon={item.icon} />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-14 w-full max-w-7xl px-4 sm:px-6">
        <h2 className="text-2xl font-bold text-[var(--color-primary)] sm:text-3xl">More Than Just Chess Classes</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((reason) => (
            <article key={reason} className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
              <p>{reason}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-14 w-full max-w-7xl px-4 sm:px-6">
        <h2 className="text-2xl font-bold text-[var(--color-primary)] sm:text-3xl">Getting Started Is Simple</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[
            'Book a free trial class',
            "Get your child's level assessed",
            'Join the right coaching batch',
            'Track improvement with monthly reports',
          ].map((step, index) => (
            <article key={step} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-[var(--color-accent)]">Step {index + 1}</p>
              <p className="mt-2 text-sm font-medium text-slate-800">{step}</p>
            </article>
          ))}
        </div>
        <Link
          to="/trial"
          className="mt-6 inline-flex rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white"
        >
          Start Free Trial
        </Link>
      </section>

      <section className="mx-auto mt-14 w-full max-w-7xl px-4 sm:px-6">
        <h2 className="text-2xl font-bold text-[var(--color-primary)] sm:text-3xl">Why Choose Chess Saga?</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {qualities.map((quality) => (
            <article key={quality.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-[var(--color-primary)]" aria-hidden="true">
                {quality.title.split(' ').slice(0, 2).map((part) => part[0]).join('')}
              </div>
              <h3 className="mt-4 text-center text-base font-semibold text-slate-900">{quality.title}</h3>
              <p className="text-center text-sm text-slate-500">{quality.subtitle}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-14 w-full max-w-7xl px-4 sm:px-6">
        <h2 className="text-2xl font-bold text-[var(--color-primary)] sm:text-3xl">Flexible Enrollment Plans</h2>
        <p className="mt-2 text-sm text-slate-600">
          Live preview from our enrollment catalog. Exact pricing and final course details are shown on Enroll.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {pricingCards.map((card) =>
            card.type === 'course' ? (
              <article
                key={card.key}
                className={`rounded-2xl border p-6 shadow-sm ${
                  card.featured
                    ? 'border-[var(--color-accent)] bg-blue-50/50 shadow-lg shadow-blue-900/10'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {card.featured ? (
                  <span className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                ) : null}
                <h3 className="mt-3 text-xl font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-600">View complete pricing and plan breakdown on Enroll.</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {card.bullets.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-accent-2)]" aria-hidden="true" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={card.courseSlug ? `/enroll?course=${card.courseSlug}` : '/enroll'}
                  className="mt-6 inline-flex rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#082f58]"
                >
                  View Details & Price
                </Link>
              </article>
            ) : (
              <article key={card.key} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-3 text-sm text-slate-600">{card.description}</p>
                <Link
                  to={card.href}
                  className="mt-6 inline-flex rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#082f58]"
                >
                  {card.ctaText}
                </Link>
              </article>
            )
          )}
        </div>
      </section>

      <section className="mx-auto mt-14 w-full max-w-7xl px-4 sm:px-6">
        <h2 className="text-2xl font-bold text-[var(--color-primary)] sm:text-3xl">Results That Speak</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {testimonials.map((item) => (
            <article key={item.author} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm leading-7 text-slate-700">"{item.quote}"</p>
              <p className="mt-3 text-sm font-semibold text-slate-900">{item.author}</p>
            </article>
          ))}
        </div>
        <Link to="/programs" className="mt-4 inline-flex text-sm font-semibold text-[var(--color-accent)] hover:underline">
          See Student Results
        </Link>
      </section>

      <section className="mx-auto mt-14 w-full max-w-7xl px-4 sm:px-6">
        <h2 className="text-2xl font-bold text-[var(--color-primary)] sm:text-3xl">Frequently Asked Questions</h2>
        <div className="mt-5 max-w-3xl">
          <FAQAccordion items={faqs} />
        </div>
      </section>

      <section className="mx-auto mt-16 w-full max-w-7xl px-4 pb-10 sm:px-6">
        <div className="rounded-3xl bg-[var(--color-primary)] px-6 py-10 text-center text-white">
          <h2 className="text-3xl font-bold">Give Your Child a Thinking Advantage That Lasts for Life</h2>
          <Link
            to="/trial"
            className="mt-6 inline-flex rounded-xl bg-[var(--color-accent-2)] px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-black/20"
          >
            Book Free Trial Class
          </Link>
        </div>
      </section>
    </main>
  )
}
