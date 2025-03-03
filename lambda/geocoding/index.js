'use strict';

const utils = require('/opt/nodejs/utils');

/**
 * Handler for geocoding Lambda function
 */
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    // Get request body
    const body = JSON.parse(event.body || '{}');
    const { addresses, userId } = body;
    
    // Validate request
    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return formatResponse(400, { error: 'Missing or invalid addresses array' });
    }
    
    if (!userId) {
      return formatResponse(400, { error: 'Missing userId' });
    }

    // Get environment variables for cost optimization
    const maxBatchSize = parseInt(process.env.MAX_BATCH_SIZE || '25', 10);
    const enableCaching = process.env.CACHE_RESULTS === 'true';
    const cacheTtlDays = parseInt(process.env.CACHE_TTL_DAYS || '30', 10);
    
    // Enforce batch size limit
    if (addresses.length > maxBatchSize) {
      return formatResponse(400, { 
        error: `Too many addresses. Maximum batch size is ${maxBatchSize}.`,
        message: `Please split your request into batches of ${maxBatchSize} or fewer addresses.`
      });
    }

    console.log(`Processing geocoding request for user ${userId}, ${addresses.length} addresses`);
    
    // Get the OpenCage API key from Secrets Manager
    const secretName = process.env.OPENCAGE_SECRET_NAME;
    if (!secretName) {
      return formatResponse(500, { error: 'OpenCage API key not configured' });
    }
    
    const secretValue = await utils.getSecret(secretName);
    const apiKey = JSON.parse(secretValue).apiKey;
    
    if (!apiKey) {
      return formatResponse(500, { error: 'Failed to retrieve OpenCage API key' });
    }
    
    // Check cache for existing geocoding results if caching is enabled
    let results = [];
    const addressesToGeocode = [];
    const addressMap = new Map();
    
    if (enableCaching) {
      // Build a map of normalized addresses to original address objects
      addresses.forEach(item => {
        const normalizedAddress = normalizeAddress(item.address);
        addressMap.set(normalizedAddress, item);
      });
      
      // Try to get cached results
      try {
        const cachedResults = await utils.queryCachedGeocodingResults(
          process.env.ANALYSIS_TABLE,
          userId,
          Array.from(addressMap.keys())
        );
        
        console.log(`Found ${cachedResults.length} cached geocoding results`);
        
        // Process cached results
        cachedResults.forEach(cachedResult => {
          const originalItem = addressMap.get(cachedResult.normalizedAddress);
          if (originalItem) {
            results.push({
              id: originalItem.id,
              address: originalItem.address,
              latitude: cachedResult.latitude,
              longitude: cachedResult.longitude,
              formattedAddress: cachedResult.formattedAddress,
              confidence: cachedResult.confidence,
              components: cachedResult.components,
              status: 'cached',
            });
            
            // Remove from the map so we don't geocode it again
            addressMap.delete(cachedResult.normalizedAddress);
          }
        });
      } catch (error) {
        console.warn('Error retrieving cached geocoding results:', error);
        // Continue with geocoding - don't fail the whole operation if cache fails
      }
      
      // Prepare the list of addresses that still need geocoding
      Array.from(addressMap.values()).forEach(item => {
        addressesToGeocode.push(item);
      });
    } else {
      // If caching is disabled, geocode all addresses
      addressesToGeocode.push(...addresses);
    }
    
    console.log(`Geocoding ${addressesToGeocode.length} addresses`);
    
    // Geocode addresses that weren't in the cache
    const geocodedResults = await Promise.all(
      addressesToGeocode.map(async (item) => {
        try {
          // Skip if already has coordinates
          if (
            item.latitude !== undefined && 
            item.longitude !== undefined && 
            !isNaN(item.latitude) && 
            !isNaN(item.longitude)
          ) {
            return {
              id: item.id,
              address: item.address,
              latitude: parseFloat(item.latitude),
              longitude: parseFloat(item.longitude),
              formattedAddress: item.address,
              status: 'existing',
            };
          }
          
          // Geocode the address
          const geocodeResult = await utils.geocodeAddress(item.address, apiKey);
          
          // If caching is enabled, store the result
          if (enableCaching) {
            try {
              await utils.putItemToDynamoDB(
                process.env.ANALYSIS_TABLE,
                {
                  id: `geo-cache-${utils.generateId()}`,
                  userId,
                  createdAt: new Date().toISOString(),
                  type: 'geocoding-cache-item',
                  normalizedAddress: normalizeAddress(item.address),
                  address: item.address,
                  latitude: geocodeResult.latitude,
                  longitude: geocodeResult.longitude,
                  formattedAddress: geocodeResult.formattedAddress,
                  confidence: geocodeResult.confidence,
                  components: geocodeResult.components,
                  ttl: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * cacheTtlDays,
                }
              );
            } catch (cacheError) {
              console.warn('Error caching geocoding result:', cacheError);
              // Continue execution - caching failure shouldn't fail the operation
            }
          }
          
          return {
            id: item.id,
            address: item.address,
            latitude: geocodeResult.latitude,
            longitude: geocodeResult.longitude,
            formattedAddress: geocodeResult.formattedAddress,
            confidence: geocodeResult.confidence,
            components: geocodeResult.components,
            status: 'geocoded',
          };
        } catch (error) {
          console.error(`Error geocoding address "${item.address}":`, error);
          
          return {
            id: item.id,
            address: item.address,
            status: 'error',
            error: error.message,
          };
        }
      })
    );
    
    // Combine cached and freshly geocoded results
    results = [...results, ...geocodedResults];
    
    // Calculate success rate
    const successCount = results.filter(r => ['geocoded', 'existing', 'cached'].includes(r.status)).length;
    const successRate = (successCount / results.length) * 100;
    
    console.log(`Geocoding complete. Success rate: ${successRate.toFixed(1)}%`);
    
    // Generate a cache key for storing results
    const cacheId = utils.generateId('geocache-');
    
    // Save results to DynamoDB cache
    await utils.putItemToDynamoDB(
      process.env.ANALYSIS_TABLE,
      {
        id: cacheId,
        userId,
        createdAt: new Date().toISOString(),
        type: 'geocoding-cache',
        results,
        // Set TTL for 7 days
        ttl: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      }
    );
    
    // Return the geocoding results
    return formatResponse(200, {
      message: 'Geocoding completed',
      cacheId,
      results,
      stats: {
        total: results.length,
        success: successCount,
        error: results.length - successCount,
        successRate: successRate.toFixed(1),
        fromCache: results.filter(r => r.status === 'cached').length,
      },
    });
  } catch (error) {
    console.error('Error processing geocoding request:', error);
    return formatResponse(500, { 
      error: 'Error processing geocoding request',
      message: error.message 
    });
  }
};

/**
 * Normalize an address for caching purposes
 * 
 * @param {string} address - The address to normalize
 * @returns {string} Normalized address
 */
function normalizeAddress(address) {
  if (!address) return '';
  
  // Remove common irrelevant differences
  return address
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/,\s*/g, ',')
    .trim();
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