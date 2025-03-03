/**
 * S3 Client Utilities
 * 
 * Provides utilities for interacting with S3 buckets from the client-side application.
 * Uses pre-signed URLs for secure uploads and downloads.
 */

import { AWS_CONSTANTS } from './aws-config';

/**
 * File metadata type
 */
export interface FileMetadata {
  key: string;
  fileName: string;
  fileType: string;
  size: number;
  lastModified?: number;
  uploadedAt?: string;
  url?: string;
}

/**
 * Get a pre-signed URL for uploading a file to S3
 * 
 * @param fileName - The name of the file to upload
 * @param fileType - The MIME type of the file
 * @param fileSize - The size of the file in bytes
 * @returns A promise that resolves to the pre-signed URL and file key
 */
export async function getUploadUrl(
  fileName: string,
  fileType: string,
  fileSize: number
): Promise<{ uploadUrl: string; fileKey: string }> {
  try {
    // Generate a unique file key using a timestamp and random string
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileKey = `uploads/${timestamp}-${randomString}-${fileName}`;
    
    // Call the API to get a pre-signed URL (securely generated on the server)
    const response = await fetch('/api/s3/upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName,
        fileType,
        fileSize,
        fileKey,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get upload URL: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      uploadUrl: data.uploadUrl,
      fileKey: data.fileKey,
    };
  } catch (error) {
    console.error('Error getting upload URL:', error);
    throw error;
  }
}

/**
 * Upload a file to S3 using a pre-signed URL
 * 
 * @param file - The file to upload
 * @returns A promise that resolves to the file metadata
 */
export async function uploadFile(file: File): Promise<FileMetadata> {
  try {
    // Get a pre-signed URL for the upload
    const { uploadUrl, fileKey } = await getUploadUrl(
      file.name,
      file.type,
      file.size
    );
    
    // Upload the file directly to S3 using the pre-signed URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
    }
    
    // Return metadata about the uploaded file
    return {
      key: fileKey,
      fileName: file.name,
      fileType: file.type,
      size: file.size,
      lastModified: file.lastModified,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Get a pre-signed URL for downloading a file from S3
 * 
 * @param fileKey - The key of the file in S3
 * @returns A promise that resolves to the download URL
 */
export async function getDownloadUrl(fileKey: string): Promise<string> {
  try {
    // Call the API to get a pre-signed URL (securely generated on the server)
    const response = await fetch('/api/s3/download-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileKey,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get download URL: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.downloadUrl;
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
}

/**
 * List files in a specific S3 path
 * 
 * @param prefix - The S3 path prefix to list
 * @returns A promise that resolves to an array of file metadata
 */
export async function listFiles(prefix: string = 'uploads/'): Promise<FileMetadata[]> {
  try {
    const response = await fetch(`/api/s3/list?prefix=${encodeURIComponent(prefix)}`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.files;
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
}

/**
 * Delete a file from S3
 * 
 * @param fileKey - The key of the file to delete
 * @returns A promise that resolves when the file is deleted
 */
export async function deleteFile(fileKey: string): Promise<void> {
  try {
    const response = await fetch('/api/s3/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileKey,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
} 