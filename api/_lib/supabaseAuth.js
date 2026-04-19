import {createClient} from '@supabase/supabase-js'

let supabaseServerClient

function getRequiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function getSupabaseServerClient() {
  if (supabaseServerClient) return supabaseServerClient

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !publishableKey) {
    throw new Error('Supabase server auth is not configured')
  }

  supabaseServerClient = createClient(supabaseUrl, publishableKey)
  return supabaseServerClient
}

export async function getVerifiedUserByAccessToken(accessToken) {
  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    return {success: false, message: 'Missing access token'}
  }

  const supabase = getSupabaseServerClient()
  const {data, error} = await supabase.auth.getUser(accessToken.trim())

  if (error || !data?.user?.email) {
    return {success: false, message: 'Unauthorized request. Please login again.'}
  }

  return {
    success: true,
    email: data.user.email.trim().toLowerCase(),
    userId: data.user.id,
  }
}
