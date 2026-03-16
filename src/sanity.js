import { createClient } from '@sanity/client'

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production'

export const client = createClient({
  projectId,
  dataset,
  apiVersion: '2023-10-01',
  useCdn: true
})

export const urlForImage = (asset) => {
  if (!asset || !asset._ref) return ''
  const base = `https://cdn.sanity.io/images/${projectId}/${dataset}/`
  const id = asset._ref.split('-').slice(1, -1).join('-')
  const ext = asset._ref.split('-').pop()
  return `${base}${id}.${ext}`
}
