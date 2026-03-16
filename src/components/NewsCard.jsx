import { Link } from 'react-router-dom'
import { urlForImage } from '../sanity'

export default function NewsCard({ item }) {
  if (!item) return null
  const excerpt = item.summary?.slice(0, 120)
  return (
    <article className="group bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-transform duration-200 hover:shadow-md hover:-translate-y-0.5 h-full flex flex-col">
      <div className="w-full aspect-[16/9] bg-slate-100">
        {item.image?.asset && (
          <img
            src={urlForImage(item.image.asset)}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-semibold tracking-tight text-[#0f172a]">{item.title}</h3>
        {excerpt && (
          <p className="text-sm text-[#64748b] mt-2 leading-6 line-clamp-3">{excerpt}...</p>
        )}
        <p className="text-xs text-[#64748b] mt-1">
          {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : ''}
        </p>
        <div className="mt-4">
          <Link
            to={`/news/${item.slug?.current}`}
            className="inline-flex items-center gap-1 text-[#2563eb] font-medium hover:underline"
          >
            Read →
          </Link>
        </div>
      </div>
    </article>
  )
}
