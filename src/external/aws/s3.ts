// docs https://developers.cloudflare.com/r2/api/s3/api/

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import GetErrorMessage from "../../GetErrorMessage";

const {
  CLOUDFLARE_ACCESS_ID,
  CLOUDFLARE_ACCESS_KEY,
  CLOUDFLARE_ACCOUNT_ID,
} = process.env


const S3Instance = new S3Client({
  region: 'auto',
  endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: CLOUDFLARE_ACCESS_ID,
    secretAccessKey: CLOUDFLARE_ACCESS_KEY
  }
})


export async function deleteObject(key: string) {
  try {
    const input = {
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key
    };

    const cmd = new DeleteObjectCommand(input);
    const response = await S3Instance.send(cmd);

    console.log(`Successfully deleted object: ${key} from bucket: ${input.Bucket}`);
    return response;
  } catch (error) {
    return GetErrorMessage(error)
  }
}

export async function getObject(key: string) {
  try {
    // Using cloudfront we don't need to use getObjectCommand 
    // https://d2lku1dn9u0a1u.cloudfront.net/3f73e4b4-7c34-4a12-b1e6-18a49f574f91/3de69f25-7f4d-4a08-9971-797d36ed1a84.webp
    // Look for cloudfront signed urls

    const input = {
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
    }

    const cmd = new GetObjectCommand(input)
    const url = await getSignedUrl(S3Instance, cmd, { expiresIn: 3600 });
    // const url = await getSignedUrl(S3, cmd, { expiresIn: 3600 * 24 }); // expires in 24 hour
    // const url = await getSignedUrl(S3, cmd, { expiresIn: 3600 }); // expires in 1 hour
    // const url = await getSignedUrl(S3, cmd, { expiresIn: 60 * 30 }); // expires in 30 minutes
    
    return url
  } catch (error) {
    return GetErrorMessage(error)
  }
}

export async function putObject(key: string, size: number, type: string) {
  try {
    const cmd = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
      ContentLength: size,
      ContentType: type,
    })

    const url = await getSignedUrl(S3Instance, cmd, { expiresIn: 3600 * 24 * 3 });
    return url
  } catch (error) {
    return GetErrorMessage(error)
  }
}