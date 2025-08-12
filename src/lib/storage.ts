import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

export interface StorageProvider {
  save(params: { buffer: Buffer; key: string; contentType?: string }): Promise<string>;
}

class LocalStorageProvider implements StorageProvider {
  constructor(private baseDir: string = path.join(process.cwd(), 'public', 'uploads'), private publicBase: string = '/uploads') {
    if (!fs.existsSync(this.baseDir)) fs.mkdirSync(this.baseDir, { recursive: true });
  }
  async save({ buffer, key }: { buffer: Buffer; key: string }): Promise<string> {
    const filePath = path.join(this.baseDir, path.basename(key));
    fs.writeFileSync(filePath, buffer);
    return `${this.publicBase}/${path.basename(key)}`;
  }
}

class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private publicBase?: string;

  constructor() {
    const region = process.env.AWS_S3_REGION || process.env.AWS_REGION || 'us-east-1';
    this.bucket = process.env.AWS_S3_BUCKET || '';
    this.publicBase = process.env.AWS_S3_PUBLIC_BASE; // e.g., https://cdn.example.com or https://bucket.s3.amazonaws.com
    this.client = new S3Client({ region, credentials: process.env.AWS_ACCESS_KEY_ID ? undefined : undefined });
  }

  async save({ buffer, key, contentType }: { buffer: Buffer; key: string; contentType?: string }): Promise<string> {
    if (!this.bucket) throw new Error('AWS_S3_BUCKET not configured');
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType || 'application/octet-stream',
      ACL: 'public-read' as any,
    }));
    if (this.publicBase) return `${this.publicBase.replace(/\/$/, '')}/${key}`;
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }
}

export function getStorage(): StorageProvider {
  const useS3 = process.env.USE_S3 === '1' || (!!process.env.AWS_S3_BUCKET && process.env.NODE_ENV === 'production');
  if (useS3) return new S3StorageProvider();
  return new LocalStorageProvider();
}