/**
 * Lambda Client Utilities
 * 
 * Provides utilities for invoking Lambda functions through API Gateway.
 */

import { AWS_CONSTANTS } from './aws-config';

/**
 * Geocoding API types
 */
export interface GeocodingRequest {
  addresses: Array<{
    id: string;
    address: string;
    latitude?: number;
    longitude?: number;
  }>;
  userId: string;
}

export interface GeocodingResult {
  id: string;
  address: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  confidence?: number;
  components?: Record<string, any>;
  status: 'geocoded' | 'existing' | 'error';
  error?: string;
}

export interface GeocodingResponse {
  message: string;
  cacheId: string;
  results: GeocodingResult[];
  stats: {
    total: number;
    success: number;
    error: number;
    successRate: string;
  };
}

/**
 * Analysis API types
 */
export interface AnalysisRequest {
  sourceFileKey: string;
  analysisName: string;
  description?: string;
  userId: string;
  parameters?: Record<string, any>;
}

export interface AnalysisResponse {
  message: string;
  analysisId: string;
  centerOfGravity: {
    latitude: number;
    longitude: number;
  };
  metrics: {
    totalDistance: number;
    averageDistance: number;
    maxDistance: number;
    weightedDistance: number;
    totalLeadTime: number;
    averageLeadTime: number;
    maxLeadTime: number;
  };
}

/**
 * API error type
 */
export interface ApiError {
  error: string;
  message?: string;
}

/**
 * Geocode addresses using the geocoding Lambda function
 * 
 * @param request - The geocoding request
 * @returns A promise that resolves to the geocoding response
 */
export async function geocodeAddresses(request: GeocodingRequest): Promise<GeocodingResponse> {
  try {
    const response = await fetch('/api/lambda/geocoding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to geocode addresses');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error geocoding addresses:', error);
    throw error;
  }
}

/**
 * Run a center of gravity analysis using the COG Lambda function
 * 
 * @param request - The analysis request
 * @returns A promise that resolves to the analysis response
 */
export async function runCOGAnalysis(request: AnalysisRequest): Promise<AnalysisResponse> {
  try {
    const response = await fetch('/api/lambda/analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to run center of gravity analysis');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error running center of gravity analysis:', error);
    throw error;
  }
} 