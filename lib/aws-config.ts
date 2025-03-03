/**
 * AWS Configuration Utilities
 * 
 * This file provides utilities for working with AWS services in the application.
 * It initializes AWS clients with proper credentials and configuration.
 */

import { S3Client } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { fromEnv } from '@aws-sdk/credential-providers';

// Default AWS region from environment
const REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';

// Base client configuration
const clientConfig = {
  region: REGION,
  credentials: fromEnv(),
};

// Initialize S3 client
export const s3Client = new S3Client(clientConfig);

// Initialize DynamoDB clients
export const dynamoDbClient = new DynamoDBClient(clientConfig);
export const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

// Initialize Lambda client
export const lambdaClient = new LambdaClient(clientConfig);

// Initialize Cognito client
export const cognitoClient = new CognitoIdentityClient(clientConfig);

// Initialize Secrets Manager client
export const secretsClient = new SecretsManagerClient(clientConfig);

// Constants for service names
export const AWS_CONSTANTS = {
  // S3 buckets
  S3_BUCKETS: {
    CSV_UPLOADS: process.env.NEXT_PUBLIC_S3_CSV_BUCKET || 'supply-chain-csv-uploads',
    PUBLIC_ASSETS: process.env.NEXT_PUBLIC_S3_PUBLIC_BUCKET || 'supply-chain-public-assets',
  },
  
  // DynamoDB tables
  DYNAMO_TABLES: {
    USERS: process.env.DYNAMODB_USERS_TABLE || 'SupplyChainUsers',
    ANALYSIS: process.env.DYNAMODB_ANALYSIS_TABLE || 'SupplyChainAnalysis',
    SCENARIOS: process.env.DYNAMODB_SCENARIOS_TABLE || 'SupplyChainScenarios',
  },
  
  // Cognito
  COGNITO: {
    USER_POOL_ID: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
  },
  
  // Lambda functions
  LAMBDA: {
    COG_ANALYSIS: process.env.LAMBDA_COG_ANALYSIS || 'supply-chain-cog-analysis',
    GEOCODING: process.env.LAMBDA_GEOCODING || 'supply-chain-geocoding',
  },
};

/**
 * Check if AWS is properly configured
 * @returns {boolean} True if AWS is properly configured
 */
export function isAwsConfigured(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_AWS_REGION &&
    (!!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_SECRET_ACCESS_KEY) ||
    !!process.env.AWS_PROFILE
  );
}

/**
 * Get a pre-signed URL for uploading a file to S3
 * This is a placeholder and should be implemented securely
 */
export function getUploadPresignedUrl(fileName: string): string {
  // This should be implemented via a server-side API route for security
  throw new Error('Method not implemented yet - must use secure server-side presigned URL generation');
} 
