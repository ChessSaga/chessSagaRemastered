import {useMemo, useState} from 'react'
import adminApi from '../adminApi'

// R2 multipart uploads require every part except the last to be >= 5MB.
const CHUNK_SIZE = 5 * 1024 * 1024

export default function UploadPage() {
  const [file, setFile] = useState(null)
  const [courseId, setCourseId] = useState('')
  const [lectureId, setLectureId] = useState('')
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const canUpload = useMemo(() => {
    return Boolean(file && courseId.trim() && lectureId.trim())
  }, [file, courseId, lectureId])

  async function uploadChunkWithRetry(key, uploadId, partNumber, chunk) {
    try {
      const {data} = await adminApi.put(
        `/upload/part?key=${encodeURIComponent(key)}&uploadId=${encodeURIComponent(uploadId)}&partNumber=${partNumber}`,
        chunk,
        {
          headers: {'Content-Type': 'application/octet-stream'},
        }
      )
      return data
    } catch (firstError) {
      const {data} = await adminApi.put(
        `/upload/part?key=${encodeURIComponent(key)}&uploadId=${encodeURIComponent(uploadId)}&partNumber=${partNumber}`,
        chunk,
        {
          headers: {'Content-Type': 'application/octet-stream'},
        }
      )
      return data
    }
  }

  async function handleUpload() {
    if (!canUpload) return

    let activeUpload = null

    setStatus('uploading')
    setProgress(0)
    setError('')
    setMessage('Starting multipart upload...')

    try {

      const {data: startData} = await adminApi.post('/upload/start', {
        courseId: courseId.trim(),
        lectureId: lectureId.trim(),
        contentType: file.type,
        fileName: file.name,
      })

      const key = startData.key
      const uploadId = startData.uploadId
      if (!key || !uploadId) {
        throw new Error('Upload session was not created')
      }

      activeUpload = {key, uploadId}

      const totalParts = Math.ceil(file.size / CHUNK_SIZE)
      const parts = []

      for (let partNumber = 1; partNumber <= totalParts; partNumber += 1) {
        const start = (partNumber - 1) * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, file.size)
        const chunk = file.slice(start, end)

        const partResp = await uploadChunkWithRetry(key, uploadId, partNumber, chunk)
        if (!partResp?.etag) {
          throw new Error(`Missing etag for uploaded part ${partNumber}`)
        }
        parts.push({partNumber, etag: partResp.etag})

        const nextProgress = Math.floor((partNumber / totalParts) * 100)
        setProgress(nextProgress)
        setMessage(`Uploading part ${partNumber}/${totalParts}...`)
      }

      setMessage('Finalizing upload...')

      const {data: completeData} = await adminApi.post('/upload/complete', {
        key,
        uploadId,
        parts,
      })

      if (!completeData?.success) {
        throw new Error(completeData?.error || 'Unable to complete upload')
      }

      activeUpload = null

      setStatus('success')
      setMessage(`Upload complete. Video key: ${key}`)
    } catch (uploadError) {
      setStatus('error')
      setError(uploadError?.response?.data?.error || uploadError.message || 'Upload failed')

      try {
        // Best-effort cleanup of failed multipart uploads.
        if (activeUpload?.key && activeUpload?.uploadId) {
          await adminApi.post('/upload/abort', {
            key: activeUpload.key,
            uploadId: activeUpload.uploadId,
          })
        }
      } catch {
        // Ignore cleanup errors and keep original error shown to user.
      }
    }
  }

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-white">Upload Video</h2>
        <p className="text-sm text-slate-400">Drag and drop a lecture video to upload in 5MB chunks.</p>
      </header>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
            placeholder="Course ID"
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
          />
          <input
            value={lectureId}
            onChange={(event) => setLectureId(event.target.value)}
            placeholder="Lecture ID"
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
          />
        </div>

        <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center">
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(event) => {
              const picked = event.target.files?.[0] || null
              setFile(picked)
            }}
          />
          <p className="text-sm font-semibold text-slate-100">Drop video here or click to choose</p>
          <p className="mt-1 text-xs text-slate-400">Only video files are accepted</p>
          {file ? <p className="mt-3 text-sm text-cyan-300">{file.name}</p> : null}
        </label>

        <button
          type="button"
          onClick={handleUpload}
          disabled={!canUpload || status === 'uploading'}
          className="mt-4 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-70"
        >
          {status === 'uploading' ? 'Uploading...' : 'Upload Video'}
        </button>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full bg-cyan-400 transition-all" style={{width: `${progress}%`}} />
        </div>

        {message ? <p className="mt-3 text-sm text-cyan-200">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      </div>
    </section>
  )
}
