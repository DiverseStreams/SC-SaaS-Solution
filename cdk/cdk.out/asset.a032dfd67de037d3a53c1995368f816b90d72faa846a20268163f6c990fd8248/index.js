/**
 * Center of Gravity Analysis Lambda Function
 * 
 * This Lambda function performs center of gravity calculations for supply chain optimization.
 * It is a placeholder that will be implemented in a future step.
 */

'use strict';

const { readCsvFromS3, calculateCenterOfGravity, putItemToDynamoDB, generateId } = require('/opt/nodejs/utils');

exports.handler = async (event) => {
  console.log('Analysis request received:', JSON.stringify(event));
  
  try {
    // Validate input
    if (!event.sourceFileKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid input: sourceFileKey is required' })
      };
    }
    
    if (!event.userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid input: userId is required' })
      };
    }
    
    // Read CSV data from S3
    const locations = await readCsvFromS3(
      process.env.S3_BUCKET,
      event.sourceFileKey
    );
    
    // Transform CSV data to location objects
    const transformedLocations = locations.map(location => ({
      latitude: parseFloat(location.latitude),
      longitude: parseFloat(location.longitude),
      weight: parseFloat(location.weight || location.volume || location.quantity || '1')
    }));
    
    // Calculate center of gravity
    const centerOfGravity = calculateCenterOfGravity(transformedLocations);
    
    // Save result to DynamoDB
    const analysisResult = {
      id: generateId('cog_'),
      userId: event.userId,
      name: event.name || 'Analysis ' + new Date().toISOString(),
      sourceFileKey: event.sourceFileKey,
      centerLatitude: centerOfGravity.latitude,
      centerLongitude: centerOfGravity.longitude,
      locationCount: locations.length,
      createdAt: new Date().toISOString()
    };
    
    await putItemToDynamoDB(process.env.DYNAMODB_TABLE, analysisResult);
    
    return {
      statusCode: 200,
      body: JSON.stringify(analysisResult)
    };
  } catch (error) {
    console.error('Error in analysis function:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Analysis operation failed: ' + error.message })
    };
  }
}; 