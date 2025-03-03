import { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AWS_CONSTANTS } from '@/lib/aws-config';
import { s3Client } from '@/lib/aws-config';

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get file details from request body
    const { fileName, fileType, fileSize, fileKey } = req.body;

    // Validate request data
    if (!fileName || !fileType || !fileSize || !fileKey) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      return res.status(400).json({ error: 'File too large' });
    }

    // Create command for S3 PutObject
    const command = new PutObjectCommand({
      Bucket: AWS_CONSTANTS.S3_BUCKETS.CSV_UPLOADS,
      Key: fileKey,
      ContentType: fileType,
    });

    // Generate pre-signed URL
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60 * 5, // URL expires in 5 minutes
    });

    // Return the pre-signed URL and file key
    return res.status(200).json({
      uploadUrl,
      fileKey,
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return res.status(500).json({ error: 'Failed to generate upload URL' });
  }
} 