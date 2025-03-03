import { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { AWS_CONSTANTS } from '@/lib/aws-config';
import { s3Client } from '@/lib/aws-config';
import { FileMetadata } from '@/lib/s3';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the prefix from query parameters
    const prefix = req.query.prefix as string || 'uploads/';

    // Create command for S3 ListObjectsV2
    const command = new ListObjectsV2Command({
      Bucket: AWS_CONSTANTS.S3_BUCKETS.CSV_UPLOADS,
      Prefix: prefix,
    });

    // Execute the command
    const result = await s3Client.send(command);

    // Transform S3 objects into file metadata
    const files: FileMetadata[] = result.Contents?.map((object) => {
      const key = object.Key || '';
      const fileName = key.split('/').pop() || '';
      
      return {
        key,
        fileName,
        fileType: '', // S3 doesn't provide this information directly
        size: object.Size || 0,
        lastModified: object.LastModified?.getTime(),
        uploadedAt: object.LastModified?.toISOString(),
      };
    }) || [];

    // Return the list of files
    return res.status(200).json({
      files,
    });
  } catch (error) {
    console.error('Error listing files:', error);
    return res.status(500).json({ error: 'Failed to list files' });
  }
} 