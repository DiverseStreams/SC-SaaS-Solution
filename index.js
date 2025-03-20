const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const https = require('https');
const querystring = require('querystring');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const XLSX = require('xlsx');
const csvParser = require('csv-parser');
const { Readable } = require('stream');
const crypto = require('crypto');

// Initialize the Secrets Manager client
const secretsClient = new SecretsManagerClient({ region: 'us-east-1' });

// Initialize clients
const s3Client = new S3Client({ region: 'us-east-1' });
const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const lambdaClient = new LambdaClient({ region: 'us-east-1' });

// Constants
const GEOCODE_FUNCTION_NAME = 'GeoCodeTestv3';

exports.handler = async (event) => {
    try {
        // Get address from the request
        let address;
        
        // Check if the request came through API Gateway
        if (event.body) {
            // Parse body if it's a string (from API Gateway)
            const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
            address = body.address;
        } else if (event.address) {
            // If the request is a direct Lambda invocation with an address property
            address = event.address;
        } else {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ error: 'Address parameter is required' })
            };
        }
        
        // Validate the address
        if (!address) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ error: 'Address parameter is required' })
            };
        }

        // Retrieve the API key from Secrets Manager
        const command = new GetSecretValueCommand({
            SecretId: 'supply-chain/geocoding'
        });
        
        const secretData = await secretsClient.send(command);
        
        // Parse the secret data
        const secret = JSON.parse(secretData.SecretString);
        const apiKey = secret.OPENCAGE_API_KEY;
        
        if (!apiKey) {
            throw new Error('API key not found in secrets');
        }
        
        // Call the OpenCage API
        const geocodingResult = await geocodeAddress(address, apiKey);
        
        // Return a successful response
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(geocodingResult)
        };
    } catch (error) {
        console.error('Error:', error);
        
        // Return an error response
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                error: 'An error occurred while processing your request',
                details: error.message
            })
        };
    }
};

// Function to geocode an address using the OpenCage API
async function geocodeAddress(address, apiKey) {
    // Prepare the API request parameters
    const params = querystring.stringify({
        q: address,
        key: apiKey,
        limit: 1,
        no_annotations: 1
    });
    
    // Set up the request options
    const options = {
        hostname: 'api.opencagedata.com',
        path: `/geocode/v1/json?${params}`,
        method: 'GET'
    };
    
    // Return a Promise that resolves with the geocoding results
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            // Accumulate the response data
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            // Process the complete response
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    
                    // Check if the API returned results
                    if (response.results && response.results.length > 0) {
                        const result = response.results[0];
                        
                        // Extract the latitude and longitude
                        const { lat, lng } = result.geometry;
                        
                        // Return a simplified response
                        resolve({
                            query: address,
                            latitude: lat,
                            longitude: lng,
                            formatted_address: result.formatted,
                            confidence: result.confidence,
                            components: result.components
                        });
                    } else {
                        // No results found
                        resolve({
                            query: address,
                            error: 'No results found for this address'
                        });
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });
        
        // Handle request errors
        req.on('error', (error) => {
            reject(error);
        });
        
        // End the request
        req.end();
    });
}

async function invokeGeocodingFunction(locationString) {
    try {
        // Prepare payload for the geocoding function
        const payload = {
            address: locationString  // Changed from 'location' to 'address'
        };
        
        // Invoke the function
        const command = new InvokeCommand({
            FunctionName: GEOCODE_FUNCTION_NAME,
            Payload: JSON.stringify(payload),
            InvocationType: 'RequestResponse'
        });
        
        const response = await lambdaClient.send(command);
        
        // Parse the response
        const responsePayload = Buffer.from(response.Payload).toString();
        const geocodeResult = JSON.parse(responsePayload);
        
        if (geocodeResult.statusCode === 200) {
            const body = JSON.parse(geocodeResult.body);
            return {
                latitude: body.latitude || null,
                longitude: body.longitude || null,
                accuracy: body.confidence || 0,
                formattedAddress: body.formatted_address || null
            };
        } else {
            console.error('Geocoding error:', geocodeResult);
            return {
                latitude: null,
                longitude: null,
                accuracy: 0,
                formattedAddress: null
            };
        }
    } catch (error) {
        console.error('Error invoking geocoding function:', error);
        throw error;
    }
} 