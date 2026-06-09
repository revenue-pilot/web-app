import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private storagePath: string;

  constructor() {
    this.storagePath = process.env.STORAGE_PATH || path.join(process.cwd(), 'uploads');
    this.initializeStorageDirectory();
  }

  private async initializeStorageDirectory() {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
      this.logger.log(`Storage directory initialized at: ${this.storagePath}`);
    } catch (e) {
      this.logger.error(`Failed to initialize storage directory: ${e.message}`);
    }
  }

  async uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
    try {
      const parsedPath = path.parse(key);
      const uuidFileName = `${parsedPath.name}_${crypto.randomUUID()}${parsedPath.ext}`;
      
      let relativeDir = parsedPath.dir;
      if (!relativeDir) {
        if (contentType.includes('pdf') || contentType.includes('excel') || contentType.includes('csv')) {
          relativeDir = 'reports';
        } else {
          relativeDir = 'general';
        }
      }

      const absoluteDir = path.join(this.storagePath, relativeDir);
      await fs.mkdir(absoluteDir, { recursive: true });

      const absoluteFilePath = path.join(absoluteDir, uuidFileName);
      await fs.writeFile(absoluteFilePath, body);

      const downloadUrl = `/api/storage/file/${relativeDir}/${uuidFileName}`;
      this.logger.log(`File saved locally: ${absoluteFilePath}`);
      return downloadUrl;
    } catch (e) {
      this.logger.error(`Failed to save file locally (${key}): ${e.message}`);
      throw e;
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const absoluteFilePath = path.join(this.storagePath, key);
      await fs.unlink(absoluteFilePath);
      this.logger.log(`File deleted locally: ${absoluteFilePath}`);
      return true;
    } catch (e) {
      this.logger.error(`Failed to delete file locally (${key}): ${e.message}`);
      return false;
    }
  }

  async getPresignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    // For local storage, we just return the static file URL or a streaming endpoint
    return `/api/storage/file/${key}`;
  }

  async getFileBuffer(key: string): Promise<Buffer> {
    const absoluteFilePath = path.join(this.storagePath, key);
    return fs.readFile(absoluteFilePath);
  }
}
