'use strict';

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const csvParser = require('csv-parser');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Initialize AWS clients
const ddbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(ddbClient);
const s3Client = new S3Client();
const secretsClient = new SecretsManagerClient();

/**
 * Get an item from DynamoDB
 */
async function getItemFromDynamoDB(tableName, key) {
  const command = new GetCommand({
    TableName: tableName,
    Key: key,
  });
  
  try {
    const response = await docClient.send(command);
    return response.Item;
  } catch (error) {
    console.error(`Error getting item from ${tableName}:`, error);
    throw error;
  }
}

/**
 * Put an item into DynamoDB
 */
async function putItemToDynamoDB(tableName, item) {
  const command = new PutCommand({
    TableName: tableName,
    Item: item,
  });
  
  try {
    return await docClient.send(command);
  } catch (error) {
    console.error(`Error putting item to ${tableName}:`, error);
    throw error;
  }
}

/**
 * Query items from DynamoDB
 */
async function queryItemsFromDynamoDB(tableName, keyConditionExpression, expressionAttributeValues, options = {}) {
  const command = new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    IndexName: options.indexName,
    Limit: options.limit,
    ScanIndexForward: options.scanIndexForward,
  });
  
  try {
    return await docClient.send(command);
  } catch (error) {
    console.error(`Error querying items from ${tableName}:`, error);
    throw error;
  }
}

/**
 * Read a CSV file from S3
 */
async function readCsvFromS3(bucket, key) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  
  try {
    const response = await s3Client.send(command);
    const stream = response.Body;
    
    return new Promise((resolve, reject) => {
      const results = [];
      
      stream
        .pipe(csvParser())
        .on("data", (data) => results.push(data))
        .on("end", () => resolve(results))
        .on("error", (error) => reject(error));
    });
  } catch (error) {
    console.error(`Error reading CSV from S3:`, error);
    throw error;
  }
}

/**
 * Get a secret from AWS Secrets Manager
 */
async function getSecret(secretName) {
  const command = new GetSecretValueCommand({
    SecretId: secretName,
  });
  
  try {
    const response = await secretsClient.send(command);
    return response.SecretString;
  } catch (error) {
    console.error(`Error getting secret ${secretName}:`, error);
    throw error;
  }
}

/**
 * Geocode an address using OpenCage API
 */
async function geocodeAddress(address, apiKey) {
  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodedAddress}&key=${apiKey}`;
    
    const response = await axios.get(url);
    
    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        latitude: result.geometry.lat,
        longitude: result.geometry.lng,
        formattedAddress: result.formatted,
      };
    } else {
      throw new Error("No geocoding results found");
    }
  } catch (error) {
    console.error("Error geocoding address:", error);
    throw error;
  }
}

/**
 * Calculate the center of gravity for a set of weighted locations
 */
function calculateCenterOfGravity(locations) {
  if (!locations || locations.length === 0) {
    throw new Error("No locations provided");
  }
  
  let totalWeight = 0;
  let weightedLatSum = 0;
  let weightedLngSum = 0;
  
  for (const location of locations) {
    const { latitude, longitude, weight } = location;
    totalWeight += weight;
    weightedLatSum += latitude * weight;
    weightedLngSum += longitude * weight;
  }
  
  if (totalWeight === 0) {
    throw new Error("Total weight is zero");
  }
  
  return {
    latitude: weightedLatSum / totalWeight,
    longitude: weightedLngSum / totalWeight,
  };
}

/**
 * Generate a unique ID
 */
function generateId(prefix = '') {
  return `${prefix}${uuidv4()}`;
}

module.exports = {
  getItemFromDynamoDB,
  putItemToDynamoDB,
  queryItemsFromDynamoDB,
  readCsvFromS3,
  getSecret,
  geocodeAddress,
  calculateCenterOfGravity,
  generateId,
}; 