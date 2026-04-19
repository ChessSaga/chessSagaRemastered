let cachedAdminConfig

function getEnv(name, fallback = '') {
  const value = process.env[name]
  if (value === undefined || value === null || value === '') return fallback
  return String(value)
}

function requireEnv(name) {
  const value = getEnv(name)
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export function getAdminConfig() {
  if (cachedAdminConfig) return cachedAdminConfig

  const adminPasswordHash = getEnv('ADMIN_PASSWORD_HASH')
  const adminPassword = getEnv('ADMIN_PASSWORD')

  if (!adminPasswordHash && !adminPassword) {
    throw new Error('Provide ADMIN_PASSWORD_HASH or ADMIN_PASSWORD for admin auth')
  }

  cachedAdminConfig = {
    adminEmail: requireEnv('ADMIN_EMAIL').toLowerCase(),
    adminPassword,
    adminPasswordHash,
    jwtSecret: requireEnv('ADMIN_JWT_SECRET'),
    jwtExpiresIn: getEnv('ADMIN_JWT_EXPIRES_IN', '8h'),
    workerApiBaseUrl: requireEnv('WORKER_API_BASE_URL'),
    workerAuthKeySecret: requireEnv('WORKER_AUTH_KEY_SECRET'),
    sanityProjectId: requireEnv('SANITY_PROJECT_ID'),
    sanityDataset: requireEnv('SANITY_DATASET'),
    sanityApiWriteToken: requireEnv('SANITY_API_WRITE_TOKEN'),
    sanityApiVersion: getEnv('SANITY_API_VERSION', '2024-06-01'),
  }

  return cachedAdminConfig
}
