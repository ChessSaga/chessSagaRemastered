import {S3Client} from '@aws-sdk/client-s3'

let r2Client

function getRequiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export function getR2BucketName() {
  return getRequiredEnv('R2_BUCKET_NAME')
}

export function getR2Client() {
  if (r2Client) return r2Client

  r2Client = new S3Client({
    region: 'auto',
    endpoint: getRequiredEnv('R2_ENDPOINT'),
    credentials: {
      accessKeyId: getRequiredEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: getRequiredEnv('R2_SECRET_ACCESS_KEY'),
    },
  })

  return r2Client
}
