import crypto from "node:crypto";

export interface StorageHealth {
  provider: "S3_COMPATIBLE" | "LOCAL_DEV_VAULT";
  configured: boolean;
  bucket: string;
  signedUrlSupport: boolean;
}

export interface EmailHealth {
  provider: "SMTP_RESEND" | "LOCAL_MAIL_SINK";
  configured: boolean;
  fromAddress: string;
}

export function getStorageAdapterStatus(): StorageHealth {
  const hasS3 = Boolean(
    process.env.S3_BUCKET_NAME &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY
  );

  return {
    provider: hasS3 ? "S3_COMPATIBLE" : "LOCAL_DEV_VAULT",
    configured: hasS3,
    bucket: process.env.S3_BUCKET_NAME || "local-isolated-vault",
    signedUrlSupport: true,
  };
}

export function generateAuthorizedSignedUrl(
  documentId: string,
  fileName: string
): {
  signedUrl: string;
  expiresAt: string;
} {
  const expires = Date.now() + 15 * 60 * 1000;
  const secret = process.env.NEXTAUTH_SECRET || "rg-signing-key";
  const safeFile = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${documentId}:${safeFile}:${expires}`)
    .digest("hex");

  return {
    signedUrl: `/api/documents/${documentId}?download=${encodeURIComponent(
      safeFile
    )}&expires=${expires}&sig=${signature}`,
    expiresAt: new Date(expires).toISOString(),
  };
}

export function getEmailAdapterStatus(): EmailHealth {
  const hasSmtp = Boolean(process.env.SMTP_HOST || process.env.RESEND_API_KEY);
  return {
    provider: hasSmtp ? "SMTP_RESEND" : "LOCAL_MAIL_SINK",
    configured: hasSmtp,
    fromAddress: process.env.EMAIL_FROM || "alerts@renewalguard.local",
  };
}