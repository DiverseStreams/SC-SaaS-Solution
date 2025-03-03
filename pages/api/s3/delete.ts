import { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { AWS_CONSTANTS } from '@/lib/aws-config';
import { s3Client } from '@/lib/aws-config';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow DELETE requests
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get file key from request body
    const { fileKey } = req.body;

    // Validate request data
    if (!fileKey) {
      return res.status(400).json({ error: 'Missing fileKey' });
    }

    // Create command for S3 DeleteObject
    const command = new DeleteObjectCommand({
      Bucket: AWS_CONSTANTS.S3_BUCKETS.CSV_UPLOADS,
      Key: fileKey,
    });

    // Execute the command
    await s3Client.send(command);

    // Return success
    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({ error: 'Failed to delete file' });
  }
} 