import {useEffect, useMemo, useState} from 'react'
import adminApi from '../adminApi'

export default function LectureMappingPage() {
  const [lectures, setLectures] = useState([])
  const [videos, setVideos] = useState([])
  const [selectedLecture, setSelectedLecture] = useState('')
  const [selectedVideoKey, setSelectedVideoKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const lecture = useMemo(() => lectures.find((item) => item._id === selectedLecture) || null, [lectures, selectedLecture])

  useEffect(() => {
    let active = true

    async function loadData() {
      setLoading(true)
      setError('')

      try {
        const [lecturesResp, videosResp] = await Promise.all([
          adminApi.get('/lectures/map'),
          adminApi.get('/videos', {params: {prefix: 'lectures/'}}),
        ])

        if (!active) return

        const lecturesList = lecturesResp.data?.lectures || []
        const videosList = videosResp.data?.objects || []

        setLectures(lecturesList)
        setVideos(videosList)

        if (lecturesList[0]) {
          setSelectedLecture(lecturesList[0]._id)
          setSelectedVideoKey(lecturesList[0].videoKey || videosList[0]?.key || '')
        }
      } catch (loadError) {
        if (!active) return
        setError(loadError?.response?.data?.error || loadError.message || 'Unable to load mapping data')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const target = lectures.find((item) => item._id === selectedLecture)
    if (target) {
      setSelectedVideoKey(target.videoKey || '')
    }
  }, [selectedLecture, lectures])

  async function saveMapping() {
    if (!selectedLecture || !selectedVideoKey) return

    setStatus('')
    setError('')

    try {
      await adminApi.post('/lectures/map', {
        lectureId: selectedLecture,
        videoKey: selectedVideoKey,
      })

      setLectures((prev) =>
        prev.map((item) => (item._id === selectedLecture ? {...item, videoKey: selectedVideoKey} : item))
      )

      setStatus('Lecture video mapping saved.')
    } catch (saveError) {
      setError(saveError?.response?.data?.error || saveError.message || 'Unable to save mapping')
    }
  }

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-white">Lecture Mapping</h2>
        <p className="text-sm text-slate-400">Map uploaded video keys to Sanity lectures.</p>
      </header>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        {loading ? <p className="text-sm text-slate-400">Loading...</p> : null}

        {!loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={selectedLecture}
              onChange={(event) => setSelectedLecture(event.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
            >
              {lectures.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.courseTitle} - {item.order}. {item.title}
                </option>
              ))}
            </select>

            <select
              value={selectedVideoKey}
              onChange={(event) => setSelectedVideoKey(event.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
            >
              <option value="">Select video key</option>
              {videos.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.key}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {lecture ? (
          <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300">
            Current key: {lecture.videoKey || 'Not set'}
          </p>
        ) : null}

        <button
          type="button"
          onClick={saveMapping}
          disabled={!selectedLecture || !selectedVideoKey}
          className="mt-4 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-70"
        >
          Save Mapping
        </button>

        {status ? <p className="mt-3 text-sm text-cyan-200">{status}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      </div>
    </section>
  )
}
