/**
 * DynamoDB Client Utilities
 * 
 * Provides utilities for interacting with DynamoDB tables from the client-side application.
 * Uses serverless API routes for secure access to the database.
 */

import { AWS_CONSTANTS } from './aws-config';

/**
 * Base types for common fields
 */
interface BaseItem {
  id: string;
  createdAt: string;
  updatedAt?: string;
  userId: string;
}

/**
 * User item type
 */
export interface UserItem extends BaseItem {
  email: string;
  name?: string;
  settings?: {
    defaultUnits?: 'miles' | 'kilometers';
    defaultTransportRate?: number; // e.g., 500 miles/day
    defaultBusinessDimension?: string;
  };
}

/**
 * Analysis result item type
 */
export interface AnalysisItem extends BaseItem {
  name: string;
  description?: string;
  sourceFileKey: string;
  locations: Array<{
    id: string;
    name: string;
    address?: string;
    latitude: number;
    longitude: number;
    weight: number;
    type: 'customer' | 'distribution-center' | 'supplier';
    businessDimensions?: Record<string, string>;
  }>;
  results: {
    centerOfGravity: {
      latitude: number;
      longitude: number;
      address?: string;
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
  };
  ttl?: number; // Time-to-live for 30-day retention
}

/**
 * Scenario item type
 */
export interface ScenarioItem extends BaseItem {
  name: string;
  description?: string;
  baseAnalysisId: string;
  type: 'baseline' | 'single-dc' | 'multi-dc' | 'custom';
  parameters: {
    distributionCenters: Array<{
      id: string;
      name: string;
      latitude: number;
      longitude: number;
      address?: string;
      isOptimized: boolean;
    }>;
    transportRate?: number; // e.g., 500 miles/day
    businessDimension?: string;
  };
  results: {
    metrics: {
      totalDistance: number;
      averageDistance: number;
      maxDistance: number;
      weightedDistance: number;
      totalLeadTime: number;
      averageLeadTime: number;
      maxLeadTime: number;
      coverage: {
        sameDay: number; // Percentage of customers
        nextDay: number;
        twoDays: number;
        threePlusDays: number;
      };
    };
  };
  ttl?: number; // Time-to-live for 30-day retention
}

/**
 * API response type for DynamoDB operations
 */
interface ApiResponse<T> {
  data?: T;
  error?: string;
}

/**
 * Query options for DynamoDB operations
 */
interface QueryOptions {
  limit?: number;
  lastEvaluatedKey?: string;
  filters?: Record<string, any>;
  indexName?: string;
  sortDirection?: 'ASC' | 'DESC';
}

/**
 * Get an item from a DynamoDB table
 * 
 * @param tableName - The name of the table
 * @param id - The item ID
 * @returns A promise that resolves to the item
 */
export async function getItem<T>(tableName: string, id: string): Promise<T | null> {
  try {
    const response = await fetch(`/api/dynamodb/${tableName}/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get item: ${response.statusText}`);
    }
    
    const result: ApiResponse<T> = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result.data || null;
  } catch (error) {
    console.error(`Error getting item from ${tableName}:`, error);
    throw error;
  }
}

/**
 * Query items from a DynamoDB table
 * 
 * @param tableName - The name of the table
 * @param options - Query options
 * @returns A promise that resolves to the query results
 */
export async function queryItems<T>(
  tableName: string,
  keyCondition: Record<string, any>,
  options: QueryOptions = {}
): Promise<{ items: T[]; lastEvaluatedKey?: string }> {
  try {
    const response = await fetch(`/api/dynamodb/${tableName}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keyCondition,
        ...options,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to query items: ${response.statusText}`);
    }
    
    const result: ApiResponse<{ items: T[]; lastEvaluatedKey?: string }> = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result.data || { items: [] };
  } catch (error) {
    console.error(`Error querying items from ${tableName}:`, error);
    throw error;
  }
}

/**
 * Put an item into a DynamoDB table
 * 
 * @param tableName - The name of the table
 * @param item - The item to put
 * @returns A promise that resolves to the saved item
 */
export async function putItem<T extends BaseItem>(tableName: string, item: T): Promise<T> {
  try {
    // Ensure the item has timestamps
    if (!item.createdAt) {
      item.createdAt = new Date().toISOString();
    }
    item.updatedAt = new Date().toISOString();
    
    const response = await fetch(`/api/dynamodb/${tableName}/put`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ item }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to put item: ${response.statusText}`);
    }
    
    const result: ApiResponse<T> = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result.data || item;
  } catch (error) {
    console.error(`Error putting item to ${tableName}:`, error);
    throw error;
  }
}

/**
 * Update an item in a DynamoDB table
 * 
 * @param tableName - The name of the table
 * @param id - The item ID
 * @param updates - The updates to apply
 * @returns A promise that resolves to the updated item
 */
export async function updateItem<T>(
  tableName: string,
  id: string,
  updates: Partial<T>
): Promise<T | null> {
  try {
    const response = await fetch(`/api/dynamodb/${tableName}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        updates: {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update item: ${response.statusText}`);
    }
    
    const result: ApiResponse<T> = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result.data || null;
  } catch (error) {
    console.error(`Error updating item in ${tableName}:`, error);
    throw error;
  }
}

/**
 * Delete an item from a DynamoDB table
 * 
 * @param tableName - The name of the table
 * @param id - The item ID
 * @returns A promise that resolves when the item is deleted
 */
export async function deleteItem(tableName: string, id: string): Promise<void> {
  try {
    const response = await fetch(`/api/dynamodb/${tableName}/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete item: ${response.statusText}`);
    }
    
    const result: ApiResponse<null> = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error(`Error deleting item from ${tableName}:`, error);
    throw error;
  }
}

/**
 * Get all analysis items for a user
 * 
 * @param userId - The user ID
 * @param options - Query options
 * @returns A promise that resolves to the analysis items
 */
export async function getUserAnalyses(
  userId: string,
  options: QueryOptions = {}
): Promise<{ items: AnalysisItem[]; lastEvaluatedKey?: string }> {
  return queryItems<AnalysisItem>(
    AWS_CONSTANTS.DYNAMO_TABLES.ANALYSIS,
    { userId },
    {
      indexName: 'user-index',
      sortDirection: 'DESC',
      ...options,
    }
  );
}

/**
 * Get all scenario items for a user
 * 
 * @param userId - The user ID
 * @param options - Query options
 * @returns A promise that resolves to the scenario items
 */
export async function getUserScenarios(
  userId: string,
  options: QueryOptions = {}
): Promise<{ items: ScenarioItem[]; lastEvaluatedKey?: string }> {
  return queryItems<ScenarioItem>(
    AWS_CONSTANTS.DYNAMO_TABLES.SCENARIOS,
    { userId },
    {
      indexName: 'user-index',
      sortDirection: 'DESC',
      ...options,
    }
  );
}

/**
 * Create a new analysis item
 * 
 * @param analysis - The analysis item to create
 * @returns A promise that resolves to the created analysis
 */
export async function createAnalysis(
  analysis: Omit<AnalysisItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<AnalysisItem> {
  const id = `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  return putItem<AnalysisItem>(AWS_CONSTANTS.DYNAMO_TABLES.ANALYSIS, {
    id,
    createdAt: new Date().toISOString(),
    ...analysis,
  });
}

/**
 * Create a new scenario item
 * 
 * @param scenario - The scenario item to create
 * @returns A promise that resolves to the created scenario
 */
export async function createScenario(
  scenario: Omit<ScenarioItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ScenarioItem> {
  const id = `scenario-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  return putItem<ScenarioItem>(AWS_CONSTANTS.DYNAMO_TABLES.SCENARIOS, {
    id,
    createdAt: new Date().toISOString(),
    ...scenario,
  });
} 