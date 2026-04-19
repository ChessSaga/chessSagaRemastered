import {useState} from 'react'

export default function FAQAccordion({items = []}) {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const expanded = openIndex === index
        const panelId = `faq-panel-${index}`
        const buttonId = `faq-button-${index}`

        return (
          <article key={item.question} className="rounded-xl border border-slate-200 bg-white">
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpenIndex(expanded ? -1 : index)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-900"
              >
                {item.question}
                <span aria-hidden="true" className="text-lg text-[var(--color-primary)]">{expanded ? '−' : '+'}</span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={`overflow-hidden px-4 text-sm text-slate-600 transition-all ${expanded ? 'max-h-60 pb-4' : 'max-h-0'}`}
            >
              {item.answer}
            </div>
          </article>
        )
      })}
    </div>
  )
}
