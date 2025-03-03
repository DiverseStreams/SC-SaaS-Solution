'use client';

import { useState, useRef } from 'react';
import { uploadFile, FileMetadata } from '@/lib/s3';

interface FileUploadProps {
  onUploadComplete?: (fileMetadata: FileMetadata) => void;
  onUploadError?: (error: Error) => void;
  acceptedFileTypes?: string;
  maxSizeMB?: number;
}

export default function FileUpload({
  onUploadComplete,
  onUploadError,
  acceptedFileTypes = '.csv',
  maxSizeMB = 10,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    
    // Validate file size
    if (selectedFile.size > maxSizeBytes) {
      setError(`File size exceeds maximum allowed size (${maxSizeMB}MB)`);
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    setError(null);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    const droppedFile = event.dataTransfer.files?.[0];
    if (!droppedFile) return;
    
    // Validate file size
    if (droppedFile.size > maxSizeBytes) {
      setError(`File size exceeds maximum allowed size (${maxSizeMB}MB)`);
      return;
    }
    
    setFile(droppedFile);
    setError(null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 100);
      
      // Upload file to S3
      const fileMetadata = await uploadFile(file);
      
      // Complete progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Call callback if provided
      if (onUploadComplete) {
        onUploadComplete(fileMetadata);
      }
      
      // Reset after a short delay
      setTimeout(() => {
        setFile(null);
        setUploadProgress(0);
        setIsUploading(false);
      }, 1000);
    } catch (error) {
      setError('Failed to upload file. Please try again.');
      setIsUploading(false);
      
      // Call error callback if provided
      if (onUploadError && error instanceof Error) {
        onUploadError(error);
      }
    }
  };

  const handleReset = () => {
    setFile(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          error ? 'border-red-400' : 'border-gray-300'
        } ${isUploading ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept={acceptedFileTypes}
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />
        
        {!file && !isUploading && (
          <div>
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-500">
              Drag and drop file here, or{' '}
              <button
                type="button"
                className="font-medium text-blue-600 hover:text-blue-500"
                onClick={() => fileInputRef.current?.click()}
              >
                browse
              </button>
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Accepted file types: {acceptedFileTypes} (Max {maxSizeMB}MB)
            </p>
          </div>
        )}
        
        {file && !isUploading && (
          <div>
            <svg
              className="mx-auto h-12 w-12 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="mt-2 text-sm font-medium">{file.name}</p>
            <p className="text-xs text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <div className="mt-4 flex justify-center space-x-3">
              <button
                type="button"
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
                onClick={handleUpload}
              >
                Upload
              </button>
              <button
                type="button"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={handleReset}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {isUploading && (
          <div>
            <svg
              className="animate-spin mx-auto h-10 w-10 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="mt-2 text-sm font-medium">Uploading {file?.name}</p>
            <div className="mt-2 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="mt-1 text-xs text-gray-500">{uploadProgress}% complete</p>
          </div>
        )}
        
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
} 