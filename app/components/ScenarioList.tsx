'use client';

import { useState, useEffect } from 'react';
import { getUserScenarios, ScenarioItem, deleteItem } from '@/lib/dynamodb';
import { AWS_CONSTANTS } from '@/lib/aws-config';

interface ScenarioListProps {
  userId: string;
}

export default function ScenarioList({ userId }: ScenarioListProps) {
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);

  // Load scenarios on component mount
  useEffect(() => {
    loadScenarios();
  }, [userId]);

  // Load scenarios from DynamoDB
  const loadScenarios = async (refresh: boolean = true) => {
    if (refresh) {
      setLoading(true);
      setError(null);
    }
    
    try {
      // Start fresh if refresh is true
      const key = refresh ? undefined : lastEvaluatedKey;
      
      const result = await getUserScenarios(userId, {
        limit: 10,
        lastEvaluatedKey: key,
      });
      
      setScenarios(prev => refresh ? result.items : [...prev, ...result.items]);
      setLastEvaluatedKey(result.lastEvaluatedKey);
      setHasMore(!!result.lastEvaluatedKey);
    } catch (err: any) {
      console.error('Error loading scenarios:', err);
      setError(err.message || 'Failed to load scenarios');
    } finally {
      setLoading(false);
    }
  };

  // Load more scenarios
  const loadMore = () => {
    if (hasMore && !loading) {
      loadScenarios(false);
    }
  };

  // Handle scenario deletion
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scenario?')) {
      return;
    }
    
    try {
      await deleteItem(AWS_CONSTANTS.DYNAMO_TABLES.SCENARIOS, id);
      setScenarios(prev => prev.filter(scenario => scenario.id !== id));
    } catch (err: any) {
      console.error('Error deleting scenario:', err);
      setError(err.message || 'Failed to delete scenario');
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Optimization Scenarios</h2>
        <button
          className="text-blue-600 hover:text-blue-800 text-sm"
          onClick={() => loadScenarios()}
          disabled={loading}
        >
          Refresh
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md">
          {error}
        </div>
      )}
      
      {loading && scenarios.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <p className="mt-2 text-sm text-gray-500">Loading scenarios...</p>
        </div>
      ) : scenarios.length === 0 ? (
        <div className="text-center py-8 border rounded-lg">
          <p className="text-gray-500">No scenarios found</p>
          <p className="text-sm text-gray-400 mt-1">Create your first optimization scenario to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{scenario.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {scenario.description || 'No description'}
                  </p>
                </div>
                <div>
                  <span className="inline-block px-2 py-1 text-xs rounded-full font-medium capitalize bg-blue-100 text-blue-800">
                    {scenario.type.replace('-', ' ')}
                  </span>
                </div>
              </div>
              
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>{' '}
                  {formatDate(scenario.createdAt)}
                </div>
                <div>
                  <span className="text-gray-500">DCs:</span>{' '}
                  {scenario.parameters.distributionCenters.length}
                </div>
                <div>
                  <span className="text-gray-500">Avg Lead Time:</span>{' '}
                  {scenario.results.metrics.averageLeadTime.toFixed(1)} days
                </div>
                <div>
                  <span className="text-gray-500">Next-Day Coverage:</span>{' '}
                  {(scenario.results.metrics.coverage.nextDay * 100).toFixed(1)}%
                </div>
              </div>
              
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  className="text-sm text-blue-600 hover:text-blue-800"
                  onClick={() => alert('View details not implemented yet')}
                >
                  View Details
                </button>
                <button
                  className="text-sm text-red-600 hover:text-red-800"
                  onClick={() => handleDelete(scenario.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          
          {hasMore && (
            <div className="text-center pt-2">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 