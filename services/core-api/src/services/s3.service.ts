/**
 * S3 Service
 * 
 * Business logic for AWS S3 file operations.
 * Handles presigned URLs, file uploads, and file management.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Logger } from 'winston';
import { env } from '@/config/env';
import { ValidationError } from '@/utils/errors';

export interface PresignedUrlRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface PresignedUrlResponse {
  url: string;
  fileName: string;
  key: string;
  expiresAt: Date;
}

export interface FileMetadata {
  bucket: string;
  key: string;
  size?: number;
  contentType?: string;
  lastModified?: Date;
}

export class S3Service {
  private s3Client: S3Client;
  private bucket: string;

  constructor(private logger: Logger) {
    // Initialize S3 client
    this.s3Client = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });

    this.bucket = env.S3_BUCKET_NAME;
  }

  /**
   * Generate presigned URL for file upload
   */
  async generatePresignedUploadUrl(
    projectId: string,
    request: PresignedUrlRequest,
    expiresIn: number = 3600 // 1 hour default
  ): Promise<PresignedUrlResponse> {
    // Validate file size (max 100MB for now)
    const maxFileSize = 100 * 1024 * 1024; // 100MB
    if (request.fileSize > maxFileSize) {
      throw new ValidationError('File size exceeds maximum allowed size', {
        fileSize: `Maximum file size is ${maxFileSize / 1024 / 1024}MB`,
      });
    }

    // Validate file type (basic validation, extend as needed)
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'audio/mpeg',
      'audio/wav',
      'video/mp4',
      'video/quicktime',
      'text/plain',
    ];

    if (!allowedTypes.includes(request.fileType)) {
      throw new ValidationError('File type not allowed', {
        fileType: 'File type is not supported',
      });
    }

    // Generate S3 key with date hierarchy
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    
    // Sanitize filename
    const sanitizedFileName = request.fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .toLowerCase();
    
    const timestamp = Date.now();
    const key = `projects/${projectId}/${year}/${month}/${day}/${hour}/${timestamp}_${sanitizedFileName}`;

    // Create presigned URL for PUT
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: request.fileType,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn });

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    this.logger.info('Generated presigned upload URL', {
      projectId,
      fileName: request.fileName,
      key,
      expiresAt,
    });

    return {
      url,
      fileName: request.fileName,
      key,
      expiresAt,
    };
  }

  /**
   * Generate presigned URL for file download
   */
  async generatePresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn });

    this.logger.info('Generated presigned download URL', { key });

    return url;
  }

  /**
   * Check if file exists in S3
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string): Promise<FileMetadata> {
    const response = await this.s3Client.send(
      new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );

    return {
      bucket: this.bucket,
      key,
      size: response.ContentLength,
      contentType: response.ContentType,
      lastModified: response.LastModified,
    };
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );

    this.logger.info('File deleted from S3', { key });
  }

  /**
   * Copy file within S3
   */
  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    await this.s3Client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destinationKey,
      })
    );

    this.logger.info('File copied in S3', { sourceKey, destinationKey });
  }

  /**
   * Generate multiple presigned upload URLs
   */
  async generateBulkPresignedUploadUrls(
    projectId: string,
    requests: PresignedUrlRequest[]
  ): Promise<PresignedUrlResponse[]> {
    const urls = await Promise.all(
      requests.map((request) => this.generatePresignedUploadUrl(projectId, request))
    );

    this.logger.info('Generated bulk presigned URLs', {
      projectId,
      count: urls.length,
    });

    return urls;
  }

  /**
   * Get S3 URL for a key (without presigning, for public files)
   */
  getPublicUrl(key: string): string {
    return `https://${this.bucket}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  }

  /**
   * Extract S3 key from full URL
   */
  extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      // Remove leading slash
      return urlObj.pathname.substring(1);
    } catch {
      return null;
    }
  }
}