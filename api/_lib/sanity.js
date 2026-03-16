import {createClient} from '@sanity/client'

const projectId = process.env.SANITY_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET || process.env.VITE_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId || !dataset || !token) {
  throw new Error('Missing Sanity server environment variables')
}

export const sanityServerClient = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2023-10-01',
  useCdn: false,
})
