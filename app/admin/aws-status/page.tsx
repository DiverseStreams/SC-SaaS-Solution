'use client';

import { useState, useEffect } from 'react';
import { checkAwsStatus } from '@/lib/aws-status';
import { isAwsConfigured, AWS_CONSTANTS } from '@/lib/aws-config';

export default function AwsStatusPage() {
  const [loading, setLoading] = useState(true);
  const [awsStatus, setAwsStatus] = useState<{
    isConfigured: boolean;
    s3: boolean;
    dynamoDb: boolean;
  }>({
    isConfigured: false,
    s3: false,
    dynamoDb: false,
  });

  useEffect(() => {
    async function checkStatus() {
      setLoading(true);
      try {
        const status = await checkAwsStatus();
        setAwsStatus(status);
      } catch (error) {
        console.error('Failed to check AWS status:', error);
      } finally {
        setLoading(false);
      }
    }

    checkStatus();
  }, []);

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">AWS Integration Status</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Configuration Status</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="font-medium">AWS Configured:</div>
              <div className={awsStatus.isConfigured ? "text-green-600" : "text-red-600"}>
                {awsStatus.isConfigured ? "Yes" : "No"}
              </div>
              
              <div className="font-medium">S3 Connection:</div>
              <div className={awsStatus.s3 ? "text-green-600" : "text-red-600"}>
                {awsStatus.s3 ? "Connected" : "Failed"}
              </div>
              
              <div className="font-medium">DynamoDB Connection:</div>
              <div className={awsStatus.dynamoDb ? "text-green-600" : "text-red-600"}>
                {awsStatus.dynamoDb ? "Connected" : "Failed"}
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">AWS Resource Configuration</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">S3 Buckets</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>CSV Uploads: <code>{AWS_CONSTANTS.S3_BUCKETS.CSV_UPLOADS}</code></li>
                  <li>Public Assets: <code>{AWS_CONSTANTS.S3_BUCKETS.PUBLIC_ASSETS}</code></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">DynamoDB Tables</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Users: <code>{AWS_CONSTANTS.DYNAMO_TABLES.USERS}</code></li>
                  <li>Analysis: <code>{AWS_CONSTANTS.DYNAMO_TABLES.ANALYSIS}</code></li>
                  <li>Scenarios: <code>{AWS_CONSTANTS.DYNAMO_TABLES.SCENARIOS}</code></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Lambda Functions</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>COG Analysis: <code>{AWS_CONSTANTS.LAMBDA.COG_ANALYSIS}</code></li>
                  <li>Geocoding: <code>{AWS_CONSTANTS.LAMBDA.GEOCODING}</code></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">Next Steps</h3>
            {awsStatus.isConfigured ? (
              awsStatus.s3 && awsStatus.dynamoDb ? (
                <p className="text-green-600">
                  AWS is properly configured and all connections are working! You can proceed with the next steps in the implementation plan.
                </p>
              ) : (
                <p className="text-yellow-600">
                  AWS is configured but some connections failed. Check your AWS credentials and make sure the required services are accessible.
                </p>
              )
            ) : (
              <p className="text-red-600">
                AWS is not configured. Add your AWS credentials to the <code>.env.local</code> file and restart the application.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 