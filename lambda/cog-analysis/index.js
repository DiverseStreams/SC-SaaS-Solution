'use strict';

const utils = require('/opt/nodejs/utils');

/**
 * Handler for center of gravity analysis Lambda function
 */
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    // Get request body
    const body = JSON.parse(event.body || '{}');
    const { 
      sourceFileKey, 
      analysisName, 
      description, 
      userId, 
      parameters = {} 
    } = body;
    
    // Validate request
    if (!sourceFileKey || !analysisName || !userId) {
      return formatResponse(400, { 
        error: 'Missing required parameters: sourceFileKey, analysisName, userId' 
      });
    }

    // Get environment variables for cost optimization
    const maxLocations = parseInt(process.env.MAX_LOCATIONS || '10000', 10);
    const enableCaching = process.env.CACHE_RESULTS === 'true';

    console.log(`Processing analysis request for user ${userId}, file ${sourceFileKey}`);
    
    // Check if we have a cached result for this file
    let cachedResult = null;
    if (enableCaching) {
      try {
        cachedResult = await utils.getCachedAnalysisResult(
          process.env.ANALYSIS_TABLE,
          userId,
          sourceFileKey
        );
        
        if (cachedResult) {
          console.log('Found cached analysis result');
          
          // Update cached result with new name and description
          cachedResult.name = analysisName;
          if (description) cachedResult.description = description;
          
          // Create a new ID for this analysis
          const analysisId = utils.generateId('analysis-');
          cachedResult.id = analysisId;
          
          // Save the updated analysis to DynamoDB
          await utils.putItemToDynamoDB(
            process.env.ANALYSIS_TABLE,
            cachedResult
          );
          
          console.log(`Saved analysis ${analysisId} from cache to DynamoDB`);
          
          // Return the cached result
          return formatResponse(200, { 
            message: 'Analysis completed successfully (from cache)',
            analysisId,
            centerOfGravity: cachedResult.results.centerOfGravity,
            metrics: cachedResult.results.metrics,
            fromCache: true,
          });
        }
      } catch (cacheError) {
        console.warn('Error retrieving cached analysis:', cacheError);
        // Continue with regular analysis
      }
    }
    
    // Read the CSV data from S3
    const csvData = await utils.readCsvFromS3(
      process.env.CSV_BUCKET,
      sourceFileKey
    );
    
    if (!csvData || csvData.length === 0) {
      return formatResponse(400, { error: 'No data found in the CSV file' });
    }
    
    console.log(`Loaded ${csvData.length} records from CSV`);
    
    // Enforce size limit for cost control
    if (csvData.length > maxLocations) {
      return formatResponse(400, { 
        error: `The CSV file contains too many locations (${csvData.length}). Maximum allowed is ${maxLocations}.`,
        message: `Please reduce the number of locations or contact support to increase your limit.`
      });
    }
    
    // Transform CSV data to locations
    const locations = transformCsvToLocations(csvData);
    
    // Calculate center of gravity
    const centerOfGravity = utils.calculateCenterOfGravity(locations);
    
    console.log('Calculated center of gravity:', centerOfGravity);
    
    // Calculate metrics for the result
    const metrics = calculateMetrics(locations, centerOfGravity);
    
    // Create a unique ID for the analysis
    const analysisId = utils.generateId('analysis-');
    
    // Create analysis result
    const analysis = {
      id: analysisId,
      userId,
      createdAt: new Date().toISOString(),
      name: analysisName,
      description,
      sourceFileKey,
      locations: locations.slice(0, 100), // Only store first 100 locations to reduce storage costs
      locationCount: locations.length, // Store the full count
      results: {
        centerOfGravity,
        metrics,
      },
      // Set TTL for 30 days
      ttl: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
    };
    
    // Save analysis to DynamoDB
    await utils.putItemToDynamoDB(
      process.env.ANALYSIS_TABLE,
      analysis
    );
    
    console.log(`Saved analysis ${analysisId} to DynamoDB`);
    
    // Cache the result for future use if caching is enabled
    if (enableCaching) {
      try {
        await utils.putItemToDynamoDB(
          process.env.ANALYSIS_TABLE,
          {
            id: utils.generateId('analysis-cache-'),
            userId,
            createdAt: new Date().toISOString(),
            type: 'analysis-cache',
            sourceFileKey,
            results: {
              centerOfGravity,
              metrics,
            },
            ttl: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // Cache for 7 days
          }
        );
      } catch (cacheError) {
        console.warn('Error caching analysis result:', cacheError);
        // Continue - caching failure shouldn't fail the operation
      }
    }
    
    // Return the analysis result
    return formatResponse(200, { 
      message: 'Analysis completed successfully',
      analysisId,
      centerOfGravity,
      metrics,
      fromCache: false,
    });
  } catch (error) {
    console.error('Error processing analysis:', error);
    return formatResponse(500, { 
      error: 'Error processing analysis',
      message: error.message 
    });
  }
};

/**
 * Transform CSV data to location objects
 * 
 * @param {Array} csvData - The raw CSV data
 * @returns {Array} Array of location objects
 */
function transformCsvToLocations(csvData) {
  return csvData.map((row, index) => {
    // Try to parse latitude and longitude
    let latitude = parseFloat(row.latitude || row.Latitude || row.lat || row.Lat);
    let longitude = parseFloat(row.longitude || row.Longitude || row.lng || row.Lng || row.long || row.Long);
    
    // If latitude or longitude is missing, use a default (for this example)
    if (isNaN(latitude) || isNaN(longitude)) {
      console.warn(`Missing coordinates for row ${index}, using defaults`);
      latitude = 0;
      longitude = 0;
    }
    
    // Parse weight, defaulting to 1 if missing
    const weight = parseFloat(row.weight || row.Weight || row.volume || row.Volume || 1);
    
    // Get name and address
    const name = row.name || row.Name || row.location || row.Location || `Location ${index}`;
    const address = row.address || row.Address || '';
    
    // Extract business dimensions
    const businessDimensions = {};
    Object.keys(row).forEach(key => {
      if (
        !['latitude', 'longitude', 'weight', 'name', 'address', 'lat', 'lng', 'long', 'volume'].includes(key.toLowerCase()) &&
        row[key] // Only include non-empty values
      ) {
        businessDimensions[key] = row[key];
      }
    });
    
    return {
      id: utils.generateId('loc-'),
      name,
      address,
      latitude,
      longitude,
      weight,
      type: 'customer', // Default type
      businessDimensions,
    };
  });
}

/**
 * Calculate metrics for the analysis result
 * 
 * @param {Array} locations - Array of location objects
 * @param {object} centerOfGravity - The center of gravity coordinates
 * @returns {object} Metrics object
 */
function calculateMetrics(locations, centerOfGravity) {
  const { latitude, longitude } = centerOfGravity;
  
  // Calculate distances from each location to the center of gravity
  const distances = locations.map(location => {
    return utils.calculateDistance(
      location.latitude,
      location.longitude,
      latitude,
      longitude
    );
  });
  
  // Calculate weighted distances
  const weightedDistances = locations.map((location, index) => {
    return distances[index] * location.weight;
  });
  
  // Calculate total weight
  const totalWeight = locations.reduce((sum, location) => sum + location.weight, 0);
  
  // Calculate lead times (assuming 800 km/day transport rate)
  const leadTimes = distances.map(distance => utils.calculateLeadTime(distance));
  
  // Calculate metrics
  const totalDistance = distances.reduce((sum, distance) => sum + distance, 0);
  const averageDistance = totalDistance / distances.length;
  const maxDistance = Math.max(...distances);
  const weightedDistance = weightedDistances.reduce((sum, wd) => sum + wd, 0) / totalWeight;
  
  const totalLeadTime = leadTimes.reduce((sum, lt) => sum + lt, 0);
  const averageLeadTime = totalLeadTime / leadTimes.length;
  const maxLeadTime = Math.max(...leadTimes);
  
  return {
    totalDistance,
    averageDistance,
    maxDistance,
    weightedDistance,
    totalLeadTime,
    averageLeadTime,
    maxLeadTime,
  };
}

/**
 * Format the Lambda response
 * 
 * @param {number} statusCode - HTTP status code
 * @param {object} body - Response body
 * @returns {object} Formatted response
 */
function formatResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // TODO: Restrict to specific origins
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(body),
  };
} 