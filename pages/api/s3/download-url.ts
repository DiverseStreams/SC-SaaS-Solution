import { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AWS_CONSTANTS } from '@/lib/aws-config';
import { s3Client } from '@/lib/aws-config';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get file key from request body
    const { fileKey } = req.body;

    // Validate request data
    if (!fileKey) {
      return res.status(400).json({ error: 'Missing fileKey' });
    }

    // Create command for S3 GetObject
    const command = new GetObjectCommand({
      Bucket: AWS_CONSTANTS.S3_BUCKETS.CSV_UPLOADS,
      Key: fileKey,
    });

    // Generate pre-signed URL
    const downloadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60 * 5, // URL expires in 5 minutes
    });

    // Return the pre-signed URL
    return res.status(200).json({
      downloadUrl,
    });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return res.status(500).json({ error: 'Failed to generate download URL' });
  }
} 