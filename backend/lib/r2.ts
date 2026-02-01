import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export interface R2Env {
  CF_ACCOUNT_ID: string
  R2_ACCESS_KEY_ID: string
  R2_SECRET_ACCESS_KEY: string
  R2_BUCKET_NAME: string
  R2_PUBLIC_URL?: string
}

function isNonEmpty(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function getR2EnvFromBindings(env: {
  CF_ACCOUNT_ID?: string
  R2_ACCESS_KEY_ID?: string
  R2_SECRET_ACCESS_KEY?: string
  R2_BUCKET_NAME?: string
  R2_PUBLIC_URL?: string
}): R2Env | null {
  if (!isNonEmpty(env.CF_ACCOUNT_ID)) return null
  if (!isNonEmpty(env.R2_ACCESS_KEY_ID)) return null
  if (!isNonEmpty(env.R2_SECRET_ACCESS_KEY)) return null
  if (!isNonEmpty(env.R2_BUCKET_NAME)) return null
  return {
    CF_ACCOUNT_ID: env.CF_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: env.R2_BUCKET_NAME,
    R2_PUBLIC_URL: env.R2_PUBLIC_URL,
  }
}

export function getPublicUrl(baseUrl: string, key: string) {
  const trimmedBase = baseUrl.replace(/\/+$/, '')
  const trimmedKey = key.replace(/^\/+/, '')
  return `${trimmedBase}/${trimmedKey}`
}

export function getR2Client(env: R2Env) {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  })
}

export async function getDownloadUrl(env: R2Env, key: string, expiresIn = 3600) {
  const client = getR2Client(env)
  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
  })
  return getSignedUrl(client, command, { expiresIn })
}

export async function deleteObject(env: R2Env, key: string) {
  const client = getR2Client(env)
  await client.send(new DeleteObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
  }))
}

export async function getUploadUrl(env: R2Env, key: string, expiresIn = 3600) {
  const client = getR2Client(env)
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
  })
  return getSignedUrl(client, command, { expiresIn })
}
