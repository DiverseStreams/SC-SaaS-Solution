'use client';

import { useState } from 'react';
import { geocodeAddresses, GeocodingResult } from '@/lib/lambda';

interface AddressGeocoderProps {
  userId: string;
  onGeocodingComplete?: (results: GeocodingResult[]) => void;
}

export default function AddressGeocoder({ userId, onGeocodingComplete }: AddressGeocoderProps) {
  const [addresses, setAddresses] = useState<string>('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!addresses.trim()) {
      setError('Please enter at least one address');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Parse addresses (one per line)
      const addressList = addresses
        .split('\n')
        .map(a => a.trim())
        .filter(a => a.length > 0)
        .map((address, index) => ({
          id: `addr-${index}`,
          address,
        }));
      
      if (addressList.length === 0) {
        setError('Please enter at least one valid address');
        setLoading(false);
        return;
      }
      
      // Geocode addresses
      const response = await geocodeAddresses({
        addresses: addressList,
        userId,
      });
      
      // Update state with results
      setResults(response.results);
      setSuccess(`Successfully geocoded ${response.stats.success} out of ${response.stats.total} addresses (${response.stats.successRate}%)`);
      
      // Call callback if provided
      if (onGeocodingComplete) {
        onGeocodingComplete(response.results);
      }
    } catch (err: any) {
      console.error('Error geocoding addresses:', err);
      setError(err.message || 'Failed to geocode addresses');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Address Geocoder</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="addresses" className="block text-sm font-medium text-gray-700 mb-1">
            Enter addresses (one per line)
          </label>
          <textarea
            id="addresses"
            rows={5}
            className="w-full rounded-md border border-gray-300 p-2"
            value={addresses}
            onChange={(e) => setAddresses(e.target.value)}
            placeholder="123 Main St, New York, NY 10001&#10;456 Market St, San Francisco, CA 94103"
            disabled={loading}
          />
        </div>
        
        <div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={loading}
          >
            {loading ? 'Geocoding...' : 'Geocode Addresses'}
          </button>
        </div>
      </form>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded-md">
          {success}
        </div>
      )}
      
      {results.length > 0 && (
        <div className="mt-6">
          <h3 className="text-md font-semibold mb-3">Geocoding Results</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Geocoded Address
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coordinates
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result) => (
                  <tr key={result.id} className={result.status === 'error' ? 'bg-red-50' : ''}>
                    <td className="px-4 py-3 text-sm">{result.address}</td>
                    <td className="px-4 py-3 text-sm">{result.formattedAddress || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      {result.latitude !== undefined && result.longitude !== undefined
                        ? `${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          result.status === 'geocoded'
                            ? 'bg-green-100 text-green-800'
                            : result.status === 'existing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {result.status}
                      </span>
                      {result.error && <div className="text-xs text-red-600 mt-1">{result.error}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 