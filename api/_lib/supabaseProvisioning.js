import {createClient} from '@supabase/supabase-js'

let supabaseAdminClient

function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
}

function getSupabasePublishableKey() {
  return process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
}

function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function getRedirectTo() {
  return process.env.SUPABASE_PASSWORD_SETUP_REDIRECT || process.env.SUPABASE_SITE_URL || undefined
}

function getAdminClient() {
  if (supabaseAdminClient) return supabaseAdminClient

  const supabaseUrl = getSupabaseUrl()
  const serviceRoleKey = getSupabaseServiceRoleKey()

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase admin provisioning is not configured')
  }

  supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return supabaseAdminClient
}

function isAlreadyRegisteredError(error) {
  const message = String(error?.message || '').toLowerCase()
  const code = String(error?.code || '').toLowerCase()

  return (
    message.includes('already') ||
    message.includes('registered') ||
    message.includes('exists') ||
    code === 'email_exists'
  )
}

export async function provisionSupabaseUserAndSendPasswordSetup(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  if (!normalizedEmail) {
    throw new Error('Missing email for Supabase provisioning')
  }

  const admin = getAdminClient()

  let userCreated = false

  const {error: createError} = await admin.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
  })

  if (createError && !isAlreadyRegisteredError(createError)) {
    throw new Error(`Unable to create Supabase user: ${createError.message}`)
  }

  if (!createError) {
    userCreated = true
  }

  const redirectTo = getRedirectTo()
  const {data: linkData, error: linkError} = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: normalizedEmail,
    options: {redirectTo},
  })

  if (linkError) {
    throw new Error(`Unable to generate reset session link: ${linkError.message}`)
  }

  const recoveryLink = linkData?.properties?.action_link || linkData?.action_link || ''
  if (!recoveryLink) {
    throw new Error('Unable to generate reset session link')
  }

  return {
    userCreated,
    recoveryLink,
    email: normalizedEmail,
  }
}