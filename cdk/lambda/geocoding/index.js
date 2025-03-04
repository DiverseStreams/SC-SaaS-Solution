/**
 * Geocoding Lambda Function
 * 
 * This Lambda function handles geocoding requests using the OpenCage API.
 * It is a placeholder that will be implemented in a future step.
 */

'use strict';

const { getSecret, geocodeAddress, putItemToDynamoDB, generateId } = require('/opt/nodejs/utils');

exports.handler = async (event) => {
  console.log('Geocoding request received:', JSON.stringify(event));
  
  try {
    // Validate input
    if (!event.addresses || !Array.isArray(event.addresses)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid input: addresses array is required' })
      };
    }
    
    if (!event.userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid input: userId is required' })
      };
    }
    
    // Get OpenCage API key from Secrets Manager
    const secretName = process.env.OPENCAGE_API_KEY_SECRET;
    const secretString = await getSecret(secretName);
    const secretData = JSON.parse(secretString);
    const apiKey = secretData.apiKey;
    
    // Process addresses
    const results = [];
    for (const address of event.addresses) {
      const geocoded = await geocodeAddress(address, apiKey);
      
      // Save to DynamoDB
      const item = {
        id: generateId('geo_'),
        userId: event.userId,
        address,
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
        formattedAddress: geocoded.formattedAddress,
        createdAt: new Date().toISOString()
      };
      
      await putItemToDynamoDB(process.env.DYNAMODB_TABLE, item);
      results.push(item);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify(results)
    };
  } catch (error) {
    console.error('Error in geocoding function:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Geocoding operation failed' })
    };
  }
}; 