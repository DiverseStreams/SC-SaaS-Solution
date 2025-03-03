import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  UpdateCommand, 
  DeleteCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb';
import { AWS_CONSTANTS } from '@/lib/aws-config';

// Initialize DynamoDB clients
const ddbClient = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(ddbClient);

// Map table name query parameters to actual table names
const tableMap: Record<string, string> = {
  'users': AWS_CONSTANTS.DYNAMO_TABLES.USERS,
  'analysis': AWS_CONSTANTS.DYNAMO_TABLES.ANALYSIS,
  'scenarios': AWS_CONSTANTS.DYNAMO_TABLES.SCENARIOS,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the table and operation from the URL
    const { table, operation } = req.query as { table: string; operation: string };
    
    // Get the actual table name
    const tableName = tableMap[table];
    if (!tableName) {
      return res.status(400).json({ error: 'Invalid table name' });
    }
    
    // Get the user session for authentication
    const session = await getSession({ req });
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Handle different operations
    switch (operation) {
      case 'get':
        return handleGetItem(req, res, tableName);
      case 'query':
        return handleQueryItems(req, res, tableName);
      case 'put':
        return handlePutItem(req, res, tableName, session.user.id);
      case 'update':
        return handleUpdateItem(req, res, tableName, session.user.id);
      case 'delete':
        return handleDeleteItem(req, res, tableName, session.user.id);
      default:
        return res.status(400).json({ error: 'Invalid operation' });
    }
  } catch (error) {
    console.error('Error handling DynamoDB operation:', error);
    return res.status(500).json({ error: 'Failed to perform DynamoDB operation' });
  }
}

/**
 * Handle getting an item from DynamoDB
 */
async function handleGetItem(
  req: NextApiRequest,
  res: NextApiResponse,
  tableName: string
) {
  const { id } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: 'Missing id' });
  }
  
  try {
    const command = new GetCommand({
      TableName: tableName,
      Key: { id },
    });
    
    const result = await docClient.send(command);
    
    return res.status(200).json({
      data: result.Item || null,
    });
  } catch (error) {
    console.error(`Error getting item from ${tableName}:`, error);
    return res.status(500).json({ error: 'Failed to get item from DynamoDB' });
  }
}

/**
 * Handle querying items from DynamoDB
 */
async function handleQueryItems(
  req: NextApiRequest,
  res: NextApiResponse,
  tableName: string
) {
  const { 
    keyCondition,
    indexName,
    limit = 20,
    lastEvaluatedKey,
    filters,
    sortDirection,
  } = req.body;
  
  if (!keyCondition || Object.keys(keyCondition).length === 0) {
    return res.status(400).json({ error: 'Missing key condition' });
  }
  
  try {
    // Build key condition expression
    const keyConditionExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};
    
    Object.entries(keyCondition).forEach(([key, value], index) => {
      const nameKey = `#key${index}`;
      const valueKey = `:value${index}`;
      
      keyConditionExpressions.push(`${nameKey} = ${valueKey}`);
      expressionAttributeNames[nameKey] = key;
      expressionAttributeValues[valueKey] = value;
    });
    
    // Build filter expression if filters are provided
    let filterExpression;
    if (filters && Object.keys(filters).length > 0) {
      const filterExpressions: string[] = [];
      
      Object.entries(filters).forEach(([key, value], index) => {
        const nameKey = `#filter${index}`;
        const valueKey = `:filter${index}`;
        
        filterExpressions.push(`${nameKey} = ${valueKey}`);
        expressionAttributeNames[nameKey] = key;
        expressionAttributeValues[valueKey] = value;
      });
      
      filterExpression = filterExpressions.join(' AND ');
    }
    
    // Build the query command
    const command = new QueryCommand({
      TableName: tableName,
      IndexName: indexName,
      KeyConditionExpression: keyConditionExpressions.join(' AND '),
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      FilterExpression: filterExpression,
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey ? JSON.parse(lastEvaluatedKey) : undefined,
      ScanIndexForward: sortDirection !== 'DESC', // false for descending order
    });
    
    const result = await docClient.send(command);
    
    return res.status(200).json({
      data: {
        items: result.Items || [],
        lastEvaluatedKey: result.LastEvaluatedKey 
          ? JSON.stringify(result.LastEvaluatedKey) 
          : undefined,
      },
    });
  } catch (error) {
    console.error(`Error querying items from ${tableName}:`, error);
    return res.status(500).json({ error: 'Failed to query items from DynamoDB' });
  }
}

/**
 * Handle putting an item into DynamoDB
 */
async function handlePutItem(
  req: NextApiRequest,
  res: NextApiResponse,
  tableName: string,
  userId: string
) {
  const { item } = req.body;
  
  if (!item) {
    return res.status(400).json({ error: 'Missing item' });
  }
  
  // Ensure the item belongs to the current user
  if (item.userId && item.userId !== userId) {
    return res.status(403).json({ error: 'Not authorized to put this item' });
  }
  
  // Set the userId if not already set
  if (!item.userId) {
    item.userId = userId;
  }
  
  try {
    const command = new PutCommand({
      TableName: tableName,
      Item: item,
    });
    
    await docClient.send(command);
    
    return res.status(200).json({
      data: item,
    });
  } catch (error) {
    console.error(`Error putting item to ${tableName}:`, error);
    return res.status(500).json({ error: 'Failed to put item to DynamoDB' });
  }
}

/**
 * Handle updating an item in DynamoDB
 */
async function handleUpdateItem(
  req: NextApiRequest,
  res: NextApiResponse,
  tableName: string,
  userId: string
) {
  const { id, updates } = req.body;
  
  if (!id || !updates) {
    return res.status(400).json({ error: 'Missing id or updates' });
  }
  
  try {
    // First, get the item to verify ownership
    const getCommand = new GetCommand({
      TableName: tableName,
      Key: { id },
    });
    
    const getResult = await docClient.send(getCommand);
    const item = getResult.Item;
    
    // Ensure the item exists and belongs to the current user
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    if (item.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this item' });
    }
    
    // Build update expression
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};
    
    Object.entries(updates).forEach(([key, value], index) => {
      // Skip id and userId which shouldn't be updated
      if (key === 'id' || key === 'userId') {
        return;
      }
      
      const nameKey = `#key${index}`;
      const valueKey = `:value${index}`;
      
      updateExpressions.push(`${nameKey} = ${valueKey}`);
      expressionAttributeNames[nameKey] = key;
      expressionAttributeValues[valueKey] = value;
    });
    
    // Create update command
    const updateCommand = new UpdateCommand({
      TableName: tableName,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });
    
    const updateResult = await docClient.send(updateCommand);
    
    return res.status(200).json({
      data: updateResult.Attributes,
    });
  } catch (error) {
    console.error(`Error updating item in ${tableName}:`, error);
    return res.status(500).json({ error: 'Failed to update item in DynamoDB' });
  }
}

/**
 * Handle deleting an item from DynamoDB
 */
async function handleDeleteItem(
  req: NextApiRequest,
  res: NextApiResponse,
  tableName: string,
  userId: string
) {
  const { id } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: 'Missing id' });
  }
  
  try {
    // First, get the item to verify ownership
    const getCommand = new GetCommand({
      TableName: tableName,
      Key: { id },
    });
    
    const getResult = await docClient.send(getCommand);
    const item = getResult.Item;
    
    // Ensure the item exists and belongs to the current user
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    if (item.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this item' });
    }
    
    // Delete the item
    const deleteCommand = new DeleteCommand({
      TableName: tableName,
      Key: { id },
    });
    
    await docClient.send(deleteCommand);
    
    return res.status(200).json({
      data: null,
    });
  } catch (error) {
    console.error(`Error deleting item from ${tableName}:`, error);
    return res.status(500).json({ error: 'Failed to delete item from DynamoDB' });
  }
} 