'use client';

import { useState } from 'react';
import FileManager from '@/app/components/FileManager';

export default function S3TestPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">S3 Integration Test</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <p className="text-gray-600 mb-6">
          This page demonstrates the integration with AWS S3 for file storage. 
          You can upload CSV files, list existing files, download them, and delete them.
        </p>
        
        <FileManager />
      </div>
      
      <div className="mt-8 bg-blue-50 p-4 rounded-md">
        <h2 className="text-lg font-medium text-blue-800 mb-2">About this component</h2>
        <p className="text-sm text-blue-700">
          This component uses the S3 utilities from <code>lib/s3.ts</code> to interact 
          with the AWS S3 bucket. It demonstrates secure file uploads using pre-signed URLs, 
          file listing, downloading, and deletion. All S3 operations are performed through 
          the API routes in <code>pages/api/s3/</code> to ensure secure access to the bucket.
        </p>
      </div>
    </div>
  );
} 