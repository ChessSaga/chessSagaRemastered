import {createClient} from '@sanity/client'

const projectId = process.env.SANITY_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET || process.env.VITE_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId || !token) {
  throw new Error('Missing SANITY_PROJECT_ID and/or SANITY_API_WRITE_TOKEN')
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-06-01',
  token,
  useCdn: false,
})

const ids = await client.fetch('*[_type == "purchase"]._id')
await Promise.all(ids.map((id) => client.delete(id)))

console.log(`Deleted ${ids.length} purchase docs`)