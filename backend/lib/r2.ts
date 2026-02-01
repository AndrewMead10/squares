import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export interface R2Env {
  CF_ACCOUNT_ID: string
  R2_ACCESS_KEY_ID: string
  R2_SECRET_ACCESS_KEY: string
  R2_BUCKET_NAME: string
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

export async function getUploadUrl(env: R2Env, key: string, expiresIn = 3600) {
  const client = getR2Client(env)
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
  })
  return getSignedUrl(client, command, { expiresIn })
}
