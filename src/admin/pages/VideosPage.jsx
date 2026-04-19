import {useEffect, useState} from 'react'
import adminApi from '../adminApi'

export default function VideosPage() {
  const [prefix, setPrefix] = useState('lectures/')
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadVideos() {
    setLoading(true)
    setError('')

    try {
      const {data} = await adminApi.get('/videos', {params: {prefix}})
      setItems(data.objects || [])
      setSelected(null)
    } catch (loadError) {
      setError(loadError?.response?.data?.error || loadError.message || 'Unable to load videos')
    } finally {
      setLoading(false)
    }
  }

  async function loadMeta(key) {
    try {
      const {data} = await adminApi.get(`/videos/${encodeURIComponent(key)}`)
      setSelected(data.object || null)
    } catch (metaError) {
      setError(metaError?.response?.data?.error || metaError.message || 'Unable to load metadata')
    }
  }

  async function deleteVideo(key) {
    const confirmed = window.confirm(`Delete ${key}?`)
    if (!confirmed) return

    try {
      await adminApi.delete(`/videos/${encodeURIComponent(key)}`)
      await loadVideos()
    } catch (deleteError) {
      setError(deleteError?.response?.data?.error || deleteError.message || 'Unable to delete video')
    }
  }

  useEffect(() => {
    loadVideos()
  }, [])

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-white">Videos</h2>
        <p className="text-sm text-slate-400">Browse and manage uploaded lecture videos.</p>
      </header>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={prefix}
            onChange={(event) => setPrefix(event.target.value)}
            className="w-72 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
            placeholder="lectures/"
          />
          <button
            type="button"
            onClick={loadVideos}
            className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-200"
          >
            Search
          </button>
        </div>

        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-slate-400">
                <th className="px-2 py-2">Key</th>
                <th className="px-2 py-2">Size</th>
                <th className="px-2 py-2">Uploaded</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-2 py-3 text-slate-400" colSpan={4}>Loading...</td>
                </tr>
              ) : null}

              {!loading && items.length === 0 ? (
                <tr>
                  <td className="px-2 py-3 text-slate-400" colSpan={4}>No videos found</td>
                </tr>
              ) : null}

              {items.map((item) => (
                <tr key={item.key} className="border-t border-slate-800 text-slate-200">
                  <td className="px-2 py-2">{item.key}</td>
                  <td className="px-2 py-2">{item.size}</td>
                  <td className="px-2 py-2">{item.uploaded ? new Date(item.uploaded).toLocaleString() : '-'}</td>
                  <td className="px-2 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => loadMeta(item.key)}
                        className="rounded-md border border-slate-700 px-2 py-1 text-xs"
                      >
                        Meta
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteVideo(item.key)}
                        className="rounded-md border border-red-600/40 px-2 py-1 text-xs text-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected ? (
        <pre className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 p-4 text-xs text-cyan-100">
          {JSON.stringify(selected, null, 2)}
        </pre>
      ) : null}
    </section>
  )
}
