import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3: S3Client | null = null;
  private bucketName = process.env.AWS_BUCKET_NAME || 'Revenuepilot-production-storage';

  constructor() {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || 'us-east-1';

    if (accessKeyId && secretAccessKey) {
      this.s3 = new S3Client({
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        region,
      });
    } else {
      this.logger.warn('AWS S3 credentials (AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY) missing. Running in local simulation mode.');
    }
  }

  async uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
    if (!this.s3) {
      this.logger.log(`[Simulated Upload] Key: ${key} | Size: ${body.length} bytes | Type: ${contentType}`);
      // return a simulated local file URL
      return `/api/storage/file/${key}`;
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      });

      await this.s3.send(command);
      this.logger.log(`S3 File uploaded successfully: ${key}`);
      return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
    } catch (e) {
      this.logger.error(`Failed to upload file to S3 (${key}): ${e.message}`);
      throw e;
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    if (!this.s3) {
      this.logger.log(`[Simulated Delete] Key: ${key}`);
      return true;
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3.send(command);
      this.logger.log(`S3 File deleted successfully: ${key}`);
      return true;
    } catch (e) {
      this.logger.error(`Failed to delete file from S3 (${key}): ${e.message}`);
      return false;
    }
  }

  async getPresignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    if (!this.s3) {
      this.logger.log(`[Simulated Presigned URL] Key: ${key}`);
      return `/api/storage/file/${key}?token=simulated_presigned_url_token`;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
      return url;
    } catch (e) {
      this.logger.error(`Failed to generate presigned download URL for S3 (${key}): ${e.message}`);
      throw e;
    }
  }
}
