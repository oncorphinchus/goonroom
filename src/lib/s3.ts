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

function s3Credentials(): { accessKeyId: string; secretAccessKey: string } {
  return {
    accessKeyId: requireEnv("MINIO_ACCESS_KEY"),
    secretAccessKey: requireEnv("MINIO_SECRET_KEY"),
  };
}

const region = (): string => process.env.MINIO_REGION ?? "us-east-1";

/**
 * Internal S3 client — routes through Docker bridge (http://minio:9000).
 * Use for server-only operations: listing, deleting, bucket management.
 */
let _internalClient: S3Client | null = null;

function getInternalClient(): S3Client {
  if (!_internalClient) {
    _internalClient = new S3Client({
      region: region(),
      endpoint: requireEnv("MINIO_ENDPOINT"),
      credentials: s3Credentials(),
      forcePathStyle: true,
    });
  }
  return _internalClient;
}

/**
 * Public S3 client — uses the Cloudflare Tunnel URL (MINIO_PUBLIC_URL).
 * Presigned URLs must be generated with this client so the browser can
 * reach the signed endpoint and the Host header matches the signature.
 */
let _publicClient: S3Client | null = null;

function getPublicClient(): S3Client {
  if (!_publicClient) {
    _publicClient = new S3Client({
      region: region(),
      endpoint: requireEnv("MINIO_PUBLIC_URL"),
      credentials: s3Credentials(),
      forcePathStyle: true,
    });
  }
  return _publicClient;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  fileKey: string;
  fileUrl: string;
}

export async function getPresignedUploadUrl(
  fileName: string,
  mimeType: string,
  prefix: "media" | "thumbnails" | "avatars" | "banners" = "media"
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

  const uploadUrl = await getSignedUrl(getPublicClient(), command, {
    expiresIn: 300,
  });
  const fileUrl = `${publicUrl}/${bucket}/${fileKey}`;

  return { uploadUrl, fileKey, fileUrl };
}
