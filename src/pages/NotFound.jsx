import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <Helmet>
        <title>404 — Chesssaga</title>
        <meta name="description" content="Page not found" />
      </Helmet>
      <h1 className="text-5xl font-bold text-primary">404</h1>
      <p className="mt-4 text-slate-700">Page not found.</p>
      <Link to="/" className="inline-block mt-6 bg-primary text-white px-4 py-2 rounded hover:bg-primary-light">Go home</Link>
    </div>
  )
}
