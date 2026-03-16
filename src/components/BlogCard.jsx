import { Link } from 'react-router-dom'
import { urlForImage } from '../sanity'

function extractPlainText(content) {
  if (!content) return ''
  // Portable Text array: take first block's children text
  if (Array.isArray(content)) {
    for (const block of content) {
      if (block?._type === 'block' && Array.isArray(block.children)) {
        const text = block.children.map((c) => c.text || '').join(' ')
        if (text.trim()) return text.trim()
      }
    }
    // fallback: join all blocks
    return content
      .map((b) => (Array.isArray(b?.children) ? b.children.map((c) => c.text || '').join(' ') : ''))
      .join(' ')
      .trim()
  }
  // Plain text field
  if (typeof content === 'string') return content
  return ''
}

export default function BlogCard({ post }) {
  if (!post) return null
  const excerptSrc = extractPlainText(post.content)
  const excerpt = excerptSrc ? `${excerptSrc.slice(0, 140)}${excerptSrc.length > 140 ? '…' : ''}` : ''
  return (
          <article className="group bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-transform duration-200 hover:shadow-md hover:-translate-y-0.5 h-full flex flex-col">
            <div className="w-full h-64 sm:h-80 lg:h-88 bg-slate-100">
  <img
    src={urlForImage(post.image?.asset)}
    alt={post.title}
    className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
    loading="lazy"
  />
</div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-semibold tracking-tight text-[#0f172a]">
          {post.title}
        </h3>
        <p className="text-xs text-[#64748b] mt-1">
          {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}
        </p>
        {excerpt && (
          <p className="mt-3 text-sm text-[#64748b] leading-6 line-clamp-3">
            {excerpt}
          </p>
        )}
        <div className="mt-4">
          <Link
            aria-label={`Read ${post.title}`}
            to={`/blogs/${post.slug?.current}`}
            className="inline-flex items-center gap-1 text-[#2563eb] font-medium hover:underline"
          >
            Read →
          </Link>
        </div>
      </div>
    </article>
  )
}
