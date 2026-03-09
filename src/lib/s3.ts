import "server-only";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Ensure it is set in .env.local before using any S3 operations.`
    );
  }
  return value;
}

let _s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!_s3Client) {
    _s3Client = new S3Client({
      region: process.env.MINIO_REGION ?? "us-east-1",
      endpoint: requireEnv("MINIO_ENDPOINT"),
      credentials: {
        accessKeyId: requireEnv("MINIO_ACCESS_KEY"),
        secretAccessKey: requireEnv("MINIO_SECRET_KEY"),
      },
      forcePathStyle: true,
    });
  }
  return _s3Client;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  fileKey: string;
  fileUrl: string;
}

export async function getPresignedUploadUrl(
  fileName: string,
  mimeType: string,
  prefix: "media" | "thumbnails" = "media"
): Promise<PresignedUploadResult> {
  const bucket = process.env.MINIO_BUCKET ?? "goonroom";
  const publicUrl = requireEnv("MINIO_PUBLIC_URL");

  const uuid = crypto.randomUUID();
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileKey = `${prefix}/${uuid}_${sanitized}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: fileKey,
    ContentType: mimeType,
  });

  const uploadUrl = await getSignedUrl(getS3Client(), command, {
    expiresIn: 300,
  });
  const fileUrl = `${publicUrl}/${bucket}/${fileKey}`;

  return { uploadUrl, fileKey, fileUrl };
}
