// docs https://developers.cloudflare.com/r2/api/s3/api/

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import GetErrorMessage from "./GetErrorMessage"

const {
  CLOUDFLARE_ACCESS_ID,
  CLOUDFLARE_ACCESS_KEY,
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_R2_BUCKET_NAME
} = process.env


export const S3 = new S3Client({
  region: 'auto',
  endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/cdn`,
  credentials: {
    accessKeyId: CLOUDFLARE_ACCESS_ID,
    secretAccessKey: CLOUDFLARE_ACCESS_KEY
  }
})