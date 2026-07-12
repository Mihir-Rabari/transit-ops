import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const S3_BUCKET = process.env.S3_BUCKET || '';

let s3Client: S3Client | null = null;

if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && S3_BUCKET) {
  s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY
    }
  });
  console.log('S3 Client initialized. Files will be uploaded to S3 bucket:', S3_BUCKET);
} else {
  console.log('S3 configuration missing. Uploads will fall back to local disk storage (/uploads).');
}

// Multer middleware for parsing file uploads
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

interface UploadResult {
  s3Key: string;
  s3Url: string;
}

export async function uploadFile(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  companyId: string
): Promise<UploadResult> {
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension).replace(/[^a-zA-Z0-9]/g, '_');
  const uniqueKey = `${companyId}/${Date.now()}_${baseName}${extension}`;

  if (s3Client && S3_BUCKET) {
    try {
      const command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: uniqueKey,
        Body: fileBuffer,
        ContentType: mimeType
      });
      await s3Client.send(command);
      
      const s3Url = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${uniqueKey}`;
      return { s3Key: uniqueKey, s3Url };
    } catch (err) {
      console.error('S3 Upload failed, falling back to local file storage:', err);
    }
  }

  // Fallback: Local disk storage
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const localFileName = `${companyId}_${Date.now()}_${baseName}${extension}`;
  const filePath = path.join(uploadDir, localFileName);
  
  fs.writeFileSync(filePath, fileBuffer);
  console.log(`[Local Upload] File saved locally: ${filePath}`);

  const localUrl = `http://localhost:4000/uploads/${localFileName}`;
  return { s3Key: localFileName, s3Url: localUrl };
}
