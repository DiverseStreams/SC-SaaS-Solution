'use client';

import { useState, useEffect } from 'react';
import { listFiles, getDownloadUrl, deleteFile, FileMetadata } from '@/lib/s3';
import FileUpload from './FileUpload';

export default function FileManager() {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load files on component mount and when refresh is triggered
  useEffect(() => {
    async function loadFiles() {
      setLoading(true);
      setError(null);
      
      try {
        const fileList = await listFiles();
        setFiles(fileList);
      } catch (err) {
        console.error('Error loading files:', err);
        setError('Failed to load files. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    loadFiles();
  }, [refreshTrigger]);

  // Handle file upload completion
  const handleUploadComplete = (fileMetadata: FileMetadata) => {
    setFiles((prevFiles) => [...prevFiles, fileMetadata]);
    // Trigger refresh to ensure we have the latest file list
    setRefreshTrigger((prev) => prev + 1);
  };

  // Handle download
  const handleDownload = async (fileKey: string, fileName: string) => {
    try {
      const downloadUrl = await getDownloadUrl(fileKey);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Failed to download file. Please try again.');
    }
  };

  // Handle delete
  const handleDelete = async (fileKey: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }
    
    try {
      await deleteFile(fileKey);
      setFiles((prevFiles) => prevFiles.filter((file) => file.key !== fileKey));
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Failed to delete file. Please try again.');
    }
  };

  // Format file size for display
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">File Upload</h2>
      <FileUpload
        onUploadComplete={handleUploadComplete}
        onUploadError={(err) => setError(err.message)}
        acceptedFileTypes=".csv"
        maxSizeMB={10}
      />
      
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Uploaded Files</h2>
          <button
            type="button"
            className="text-sm text-blue-600 hover:text-blue-500"
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <p className="mt-2 text-sm text-gray-500">Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 border rounded-lg">
            <p className="text-gray-500">No files uploaded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.map((file) => (
                  <tr key={file.key} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <svg
                          className="flex-shrink-0 h-5 w-5 text-gray-400 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {file.fileName}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(file.uploadedAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-800 mr-3"
                        onClick={() => handleDownload(file.key, file.fileName)}
                      >
                        Download
                      </button>
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-800"
                        onClick={() => handleDelete(file.key)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 