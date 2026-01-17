import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import env from "../config/env";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export const storageService = {
  /**
   * Check if a file exists in R2
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: key,
      });
      await s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  },

  /**
   * Upload a file to R2
   */
  async uploadFile(key: string, body: Buffer | Uint8Array | Blob | string, contentType?: string) {
    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await s3Client.send(command);
    return `${env.R2_PUBLIC_URL}/${key}`;
  },

  /**
   * Get a presigned URL for downloading a file
   * @param key The file key in R2
   * @param expiresIn Expiration time in seconds (default 1 hour)
   */
  async getDownloadUrl(key: string, expiresIn: number = 3600) {
    const command = new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  },

  /**
   * Delete a file from R2
   */
  async deleteFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  },

  /**
   * Delete a folder and all its contents from R2
   */
  async deleteFolder(prefix: string) {
    const listCommand = new ListObjectsV2Command({
      Bucket: env.R2_BUCKET_NAME,
      Prefix: prefix,
    });

    const list = await s3Client.send(listCommand);
    if (!list.Contents || list.Contents.length === 0) return;

    const deleteCommand = new DeleteObjectsCommand({
      Bucket: env.R2_BUCKET_NAME,
      Delete: {
        Objects: list.Contents.map((item) => ({ Key: item.Key! })),
      },
    });

    await s3Client.send(deleteCommand);
  },

  /**
   * Get public URL for a file
   */
  getPublicUrl(key: string) {
    return `${env.R2_PUBLIC_URL}/${key}`;
  }
};

export default storageService;
