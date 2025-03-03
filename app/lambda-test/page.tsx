'use client';

import { useState } from 'react';
import AddressGeocoder from '@/app/components/AddressGeocoder';
import { runCOGAnalysis, AnalysisResponse, GeocodingResult } from '@/lib/lambda';

export default function LambdaTestPage() {
  const [userId, setUserId] = useState('user-123'); // Simulated user ID
  const [geocodedAddresses, setGeocodedAddresses] = useState<GeocodingResult[]>([]);
  const [showAnalysisForm, setShowAnalysisForm] = useState(false);
  const [analysisName, setAnalysisName] = useState('');
  const [sourceFileKey, setSourceFileKey] = useState('');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle geocoding completion
  const handleGeocodingComplete = (results: GeocodingResult[]) => {
    setGeocodedAddresses(results);
    setShowAnalysisForm(true);
  };

  // Handle analysis form submission
  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sourceFileKey || !analysisName) {
      setError('Please enter a source file key and analysis name');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await runCOGAnalysis({
        sourceFileKey,
        analysisName,
        description: 'Analysis created from lambda test page',
        userId,
      });
      
      setAnalysisResults(response);
    } catch (err: any) {
      console.error('Error running analysis:', err);
      setError(err.message || 'Failed to run analysis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Lambda Functions Test</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <p className="text-gray-600 mb-6">
          This page demonstrates the integration with AWS Lambda functions for geocoding addresses
          and running center of gravity analysis calculations.
        </p>
        
        <div className="flex items-center mb-6">
          <div className="flex-grow">
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
              User ID (for testing)
            </label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-full"
            />
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <AddressGeocoder 
          userId={userId} 
          onGeocodingComplete={handleGeocodingComplete} 
        />
      </div>
      
      {showAnalysisForm && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Run Center of Gravity Analysis</h2>
          
          <p className="text-gray-600 mb-4">
            Now that you have geocoded addresses, you can run a center of gravity analysis.
            In a real application, the geocoded addresses would be used to create a CSV file
            that is then uploaded to S3. For this demonstration, please enter a file key
            manually.
          </p>
          
          <form onSubmit={handleRunAnalysis} className="space-y-4">
            <div>
              <label htmlFor="sourceFileKey" className="block text-sm font-medium text-gray-700 mb-1">
                Source File Key (S3 object key)
              </label>
              <input
                type="text"
                id="sourceFileKey"
                value={sourceFileKey}
                onChange={(e) => setSourceFileKey(e.target.value)}
                placeholder="uploads/sample-data.csv"
                className="border border-gray-300 rounded-md px-3 py-2 w-full"
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="analysisName" className="block text-sm font-medium text-gray-700 mb-1">
                Analysis Name
              </label>
              <input
                type="text"
                id="analysisName"
                value={analysisName}
                onChange={(e) => setAnalysisName(e.target.value)}
                placeholder="My Analysis"
                className="border border-gray-300 rounded-md px-3 py-2 w-full"
                disabled={loading}
              />
            </div>
            
            <div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                disabled={loading}
              >
                {loading ? 'Running Analysis...' : 'Run Analysis'}
              </button>
            </div>
          </form>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mt-4">
              {error}
            </div>
          )}
          
          {analysisResults && (
            <div className="mt-6">
              <h3 className="text-md font-semibold mb-3">Analysis Results</h3>
              
              <div className="bg-gray-50 p-4 rounded-md space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Analysis ID</p>
                  <p className="text-sm">{analysisResults.analysisId}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Center of Gravity</p>
                  <p className="text-sm">
                    {analysisResults.centerOfGravity.latitude.toFixed(6)}, {analysisResults.centerOfGravity.longitude.toFixed(6)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Metrics</p>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <p className="text-xs text-gray-500">Average Distance:</p>
                      <p className="text-sm">{analysisResults.metrics.averageDistance.toFixed(2)} km</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Max Distance:</p>
                      <p className="text-sm">{analysisResults.metrics.maxDistance.toFixed(2)} km</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Average Lead Time:</p>
                      <p className="text-sm">{analysisResults.metrics.averageLeadTime.toFixed(2)} days</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Max Lead Time:</p>
                      <p className="text-sm">{analysisResults.metrics.maxLeadTime.toFixed(2)} days</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8 bg-blue-50 p-4 rounded-md">
        <h2 className="text-lg font-medium text-blue-800 mb-2">About Lambda Functions</h2>
        <p className="text-sm text-blue-700">
          This page demonstrates the invocation of AWS Lambda functions through API Gateway.
          The Lambda functions provide geocoding and center of gravity analysis capabilities.
          The geocoding Lambda uses the OpenCage API to convert addresses to coordinates.
          The center of gravity Lambda analyzes location data to find the optimal distribution center location.
        </p>
      </div>
    </div>
  );
} 