import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { AWS_CONSTANTS } from '@/lib/aws-config';

// Initialize Lambda client
const lambdaClient = new LambdaClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the user session for authentication
    const session = await getSession({ req });
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get request body
    const { addresses } = req.body;
    
    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid addresses array' });
    }
    
    // Add the user ID to the request
    const lambdaPayload = {
      ...req.body,
      userId: session.user.id,
    };
    
    // Invoke the Lambda function
    const command = new InvokeCommand({
      FunctionName: process.env.LAMBDA_GEOCODING,
      InvocationType: 'RequestResponse',
      Payload: Buffer.from(JSON.stringify({
        body: JSON.stringify(lambdaPayload),
      })),
    });
    
    const response = await lambdaClient.send(command);
    
    // Parse the Lambda response
    const payloadString = Buffer.from(response.Payload || '').toString();
    const payload = JSON.parse(payloadString);
    const body = JSON.parse(payload.body || '{}');
    
    // Check for Lambda function errors
    if (payload.FunctionError) {
      console.error('Lambda function error:', payload);
      return res.status(500).json({ error: 'Lambda function error', details: payload });
    }
    
    // Return the result
    return res.status(payload.statusCode || 200).json(body);
  } catch (error) {
    console.error('Error invoking geocoding Lambda:', error);
    return res.status(500).json({ error: 'Failed to invoke geocoding Lambda' });
  }
} 