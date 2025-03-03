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
 * 
 * @param {string} tableName - The name of the table
 * @param {object} key - The primary key of the item
 * @returns {Promise<object>} The item from DynamoDB
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
 * 
 * @param {string} tableName - The name of the table
 * @param {object} item - The item to put
 * @returns {Promise<object>} The result of the operation
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
 * 
 * @param {string} tableName - The name of the table
 * @param {string} keyConditionExpression - The key condition expression
 * @param {object} expressionAttributeNames - The expression attribute names
 * @param {object} expressionAttributeValues - The expression attribute values
 * @param {object} options - Additional options
 * @returns {Promise<object>} The query results
 */
async function queryItemsFromDynamoDB(
  tableName,
  keyConditionExpression,
  expressionAttributeNames,
  expressionAttributeValues,
  options = {}
) {
  const command = new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    IndexName: options.indexName,
    Limit: options.limit,
    ExclusiveStartKey: options.exclusiveStartKey,
    ScanIndexForward: options.scanIndexForward,
    FilterExpression: options.filterExpression,
  });
  
  try {
    return await docClient.send(command);
  } catch (error) {
    console.error(`Error querying items from ${tableName}:`, error);
    throw error;
  }
}

/**
 * Get cached analysis result for a file
 * 
 * @param {string} tableName - The name of the table
 * @param {string} userId - The user ID
 * @param {string} sourceFileKey - The source file key
 * @returns {Promise<object|null>} The cached analysis result or null
 */
async function getCachedAnalysisResult(tableName, userId, sourceFileKey) {
  try {
    const response = await queryItemsFromDynamoDB(
      tableName,
      'userId = :userId',
      { },
      { ':userId': userId, ':type': 'analysis-cache', ':fileKey': sourceFileKey },
      {
        filterExpression: 'type = :type AND sourceFileKey = :fileKey',
        scanIndexForward: false,
        limit: 1,
      }
    );
    
    if (response.Items && response.Items.length > 0) {
      return response.Items[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error getting cached analysis result:', error);
    return null;
  }
}

/**
 * Query cached geocoding results
 * 
 * @param {string} tableName - The name of the table
 * @param {string} userId - The user ID
 * @param {Array<string>} normalizedAddresses - Array of normalized addresses
 * @returns {Promise<Array>} The cached geocoding results
 */
async function queryCachedGeocodingResults(tableName, userId, normalizedAddresses) {
  if (!normalizedAddresses || normalizedAddresses.length === 0) {
    return [];
  }
  
  try {
    // Create filter expression for all addresses
    // Note: DynamoDB limits the number of filter expressions, so for large datasets
    // this would need to be batched. For simplicity, we'll assume it's under the limit.
    const filterValues = {};
    const filterConditions = [];
    
    normalizedAddresses.forEach((address, index) => {
      const placeholder = `:addr${index}`;
      filterValues[placeholder] = address;
      filterConditions.push(`normalizedAddress = ${placeholder}`);
    });
    
    const response = await queryItemsFromDynamoDB(
      tableName,
      'userId = :userId',
      { },
      { ':userId': userId, ':type': 'geocoding-cache-item', ...filterValues },
      {
        filterExpression: `type = :type AND (${filterConditions.join(' OR ')})`,
        scanIndexForward: false,
      }
    );
    
    return response.Items || [];
  } catch (error) {
    console.error('Error querying cached geocoding results:', error);
    return [];
  }
}

/**
 * Read a CSV file from S3
 * 
 * @param {string} bucket - The S3 bucket name
 * @param {string} key - The S3 object key
 * @returns {Promise<Array>} The parsed CSV data
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
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  } catch (error) {
    console.error(`Error reading CSV from S3 (${bucket}/${key}):`, error);
    throw error;
  }
}

/**
 * Get a secret from AWS Secrets Manager
 * 
 * @param {string} secretName - The name of the secret
 * @returns {Promise<string>} The secret value
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
 * 
 * @param {string} address - The address to geocode
 * @param {string} apiKey - The OpenCage API key
 * @returns {Promise<object>} The geocoding result
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
        confidence: result.confidence,
        components: result.components,
      };
    } else {
      throw new Error('No geocoding results found');
    }
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw error;
  }
}

/**
 * Calculate the center of gravity for a set of weighted locations
 * 
 * @param {Array} locations - Array of location objects with latitude, longitude, and weight
 * @returns {object} The center of gravity coordinates
 */
function calculateCenterOfGravity(locations) {
  // Ensure there are locations
  if (!locations || locations.length === 0) {
    throw new Error('No locations provided for center of gravity calculation');
  }
  
  // Calculate weighted sum of coordinates
  let totalWeight = 0;
  let weightedLatSum = 0;
  let weightedLngSum = 0;
  
  for (const location of locations) {
    const { latitude, longitude, weight } = location;
    
    // Validate coordinates and weight
    if (
      typeof latitude !== 'number' || 
      typeof longitude !== 'number' || 
      typeof weight !== 'number'
    ) {
      console.warn('Invalid location data:', location);
      continue;
    }
    
    totalWeight += weight;
    weightedLatSum += latitude * weight;
    weightedLngSum += longitude * weight;
  }
  
  // Avoid division by zero
  if (totalWeight === 0) {
    throw new Error('Total weight is zero, cannot calculate center of gravity');
  }
  
  // Calculate weighted average coordinates
  const centerLatitude = weightedLatSum / totalWeight;
  const centerLongitude = weightedLngSum / totalWeight;
  
  return {
    latitude: centerLatitude,
    longitude: centerLongitude,
  };
}

/**
 * Calculate the distance between two sets of coordinates (haversine formula)
 * 
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Convert degrees to radians
 * 
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate lead time based on distance
 * 
 * @param {number} distance - Distance in kilometers
 * @param {number} transportRate - Transport rate in km/day
 * @returns {number} Lead time in days
 */
function calculateLeadTime(distance, transportRate = 800) {
  // Add a minimum of 0.5 days for processing
  return 0.5 + (distance / transportRate);
}

/**
 * Generate a unique ID
 * 
 * @param {string} prefix - Prefix for the ID
 * @returns {string} A unique ID
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
  calculateDistance,
  calculateLeadTime,
  generateId,
  getCachedAnalysisResult,
  queryCachedGeocodingResults,
};