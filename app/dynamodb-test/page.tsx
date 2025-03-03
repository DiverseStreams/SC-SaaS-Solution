'use client';

import { useState } from 'react';
import ScenarioList from '@/app/components/ScenarioList';
import { createScenario, ScenarioItem } from '@/lib/dynamodb';

export default function DynamoDBTestPage() {
  const [userId, setUserId] = useState('user-123'); // Simulated user ID
  const [creatingDemo, setCreatingDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create a demo scenario for testing
  const createDemoScenario = async () => {
    setCreatingDemo(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create a random demo scenario
      const scenario: Omit<ScenarioItem, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        name: `Demo Scenario ${Math.floor(Math.random() * 1000)}`,
        description: 'This is a demo scenario created for testing purposes.',
        baseAnalysisId: `analysis-${Date.now()}`,
        type: ['baseline', 'single-dc', 'multi-dc', 'custom'][Math.floor(Math.random() * 4)] as any,
        parameters: {
          distributionCenters: [
            {
              id: `dc-${Date.now()}-1`,
              name: 'Distribution Center 1',
              latitude: 40.7128 + (Math.random() - 0.5) * 2,
              longitude: -74.0060 + (Math.random() - 0.5) * 2,
              address: 'New York, NY',
              isOptimized: true,
            },
            {
              id: `dc-${Date.now()}-2`,
              name: 'Distribution Center 2',
              latitude: 34.0522 + (Math.random() - 0.5) * 2,
              longitude: -118.2437 + (Math.random() - 0.5) * 2,
              address: 'Los Angeles, CA',
              isOptimized: false,
            },
          ],
          transportRate: 500,
          businessDimension: 'Region',
        },
        results: {
          metrics: {
            totalDistance: 25000 + Math.random() * 5000,
            averageDistance: 500 + Math.random() * 100,
            maxDistance: 1200 + Math.random() * 300,
            weightedDistance: 600 + Math.random() * 100,
            totalLeadTime: 50 + Math.random() * 10,
            averageLeadTime: 2 + Math.random(),
            maxLeadTime: 5 + Math.random(),
            coverage: {
              sameDay: 0.2 + Math.random() * 0.1,
              nextDay: 0.5 + Math.random() * 0.1,
              twoDays: 0.2 + Math.random() * 0.1,
              threePlusDays: 0.1 + Math.random() * 0.1,
            },
          },
        },
        ttl: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days from now
      };
      
      await createScenario(scenario);
      
      setSuccess('Demo scenario created successfully!');
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error creating demo scenario:', err);
      setError(err.message || 'Failed to create demo scenario');
    } finally {
      setCreatingDemo(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">DynamoDB Integration Test</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <p className="text-gray-600 mb-6">
          This page demonstrates the integration with AWS DynamoDB for storing and retrieving
          optimization scenarios. You can create a demo scenario or view existing scenarios.
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
          <div className="ml-4 pt-5">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={createDemoScenario}
              disabled={creatingDemo}
            >
              {creatingDemo ? 'Creating...' : 'Create Demo Scenario'}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-md mb-4">
            {success}
          </div>
        )}
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <ScenarioList userId={userId} />
      </div>
      
      <div className="mt-8 bg-blue-50 p-4 rounded-md">
        <h2 className="text-lg font-medium text-blue-800 mb-2">About this component</h2>
        <p className="text-sm text-blue-700">
          This component uses the DynamoDB utilities from <code>lib/dynamodb.ts</code> to interact 
          with the AWS DynamoDB tables. It demonstrates secure querying, creation, and deletion 
          of scenario data through the API routes in <code>pages/api/dynamodb/</code>.
        </p>
      </div>
    </div>
  );
} 