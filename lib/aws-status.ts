/**
 * AWS Status Utility
 * 
 * Provides functions to check the status of AWS integration.
 * Useful for verifying that the application is properly connected to AWS services.
 */

import { ListBucketsCommand } from '@aws-sdk/client-s3';
import { ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { s3Client, dynamoDbClient, isAwsConfigured } from './aws-config';

/**
 * Check S3 connectivity
 * @returns {Promise<boolean>} True if S3 connection is working
 */
export async function checkS3Connectivity(): Promise<boolean> {
  if (!isAwsConfigured()) return false;
  
  try {
    const response = await s3Client.send(new ListBucketsCommand({}));
    return Array.isArray(response.Buckets);
  } catch (error) {
    console.error('S3 connectivity check failed:', error);
    return false;
  }
}

/**
 * Check DynamoDB connectivity
 * @returns {Promise<boolean>} True if DynamoDB connection is working
 */
export async function checkDynamoDbConnectivity(): Promise<boolean> {
  if (!isAwsConfigured()) return false;
  
  try {
    const response = await dynamoDbClient.send(new ListTablesCommand({}));
    return Array.isArray(response.TableNames);
  } catch (error) {
    console.error('DynamoDB connectivity check failed:', error);
    return false;
  }
}

/**
 * Check overall AWS connectivity
 * @returns {Promise<{isConfigured: boolean, s3: boolean, dynamoDb: boolean}>} Status of AWS services
 */
export async function checkAwsStatus(): Promise<{
  isConfigured: boolean;
  s3: boolean;
  dynamoDb: boolean;
}> {
  const isConfigured = isAwsConfigured();
  
  if (!isConfigured) {
    return {
      isConfigured: false,
      s3: false,
      dynamoDb: false,
    };
  }
  
  const [s3Status, dynamoDbStatus] = await Promise.all([
    checkS3Connectivity(),
    checkDynamoDbConnectivity(),
  ]);
  
  return {
    isConfigured: true,
    s3: s3Status,
    dynamoDb: dynamoDbStatus,
  };
} 