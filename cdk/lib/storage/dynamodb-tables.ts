import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

/**
 * Properties for DynamoDBTablesConstruct
 */
export interface DynamoDBTablesConstructProps {
  /**
   * Environment name (e.g., 'dev', 'prod')
   */
  environment: string;
  
  /**
   * Application name for resource naming
   */
  appName: string;
}

/**
 * A construct for creating the DynamoDB tables needed by the application
 */
export class DynamoDBTablesConstruct extends Construct {
  /**
   * The DynamoDB table for users
   */
  public readonly usersTable: dynamodb.Table;
  
  /**
   * The DynamoDB table for analysis results
   */
  public readonly analysisTable: dynamodb.Table;
  
  /**
   * The DynamoDB table for scenarios
   */
  public readonly scenariosTable: dynamodb.Table;
  
  constructor(scope: Construct, id: string, props: DynamoDBTablesConstructProps) {
    super(scope, id);
    
    const { environment, appName } = props;
    
    // Determine removal policy based on environment
    const removalPolicy = environment === 'prod' 
      ? cdk.RemovalPolicy.RETAIN 
      : cdk.RemovalPolicy.DESTROY;
    
    // Create Users table
    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: `${appName}-users-${environment}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: removalPolicy,
      pointInTimeRecovery: environment === 'prod',
    });
    
    // Create Analysis Results table
    this.analysisTable = new dynamodb.Table(this, 'AnalysisTable', {
      tableName: `${appName}-analysis-${environment}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: removalPolicy,
      timeToLiveAttribute: 'ttl', // TTL for 30-day retention
      pointInTimeRecovery: environment === 'prod',
    });
    
    // Add Global Secondary Index for user-based querying
    this.analysisTable.addGlobalSecondaryIndex({
      indexName: 'user-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    
    // Add Global Secondary Index for location filtering
    this.analysisTable.addGlobalSecondaryIndex({
      indexName: 'location-index',
      partitionKey: { name: 'locationId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    
    // Create Scenarios table
    this.scenariosTable = new dynamodb.Table(this, 'ScenariosTable', {
      tableName: `${appName}-scenarios-${environment}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: removalPolicy,
      timeToLiveAttribute: 'ttl', // TTL for 30-day retention
      pointInTimeRecovery: environment === 'prod',
    });
    
    // Add Global Secondary Index for user-based querying
    this.scenariosTable.addGlobalSecondaryIndex({
      indexName: 'user-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    
    // Add Global Secondary Index for business dimensions
    this.scenariosTable.addGlobalSecondaryIndex({
      indexName: 'business-dimension-index',
      partitionKey: { name: 'businessDimension', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    
    // Add CloudFormation outputs
    new cdk.CfnOutput(this, 'UsersTableName', {
      value: this.usersTable.tableName,
      description: 'Name of the DynamoDB table for users',
      exportName: `${appName}-users-table-name-${environment}`,
    });
    
    new cdk.CfnOutput(this, 'AnalysisTableName', {
      value: this.analysisTable.tableName,
      description: 'Name of the DynamoDB table for analysis results',
      exportName: `${appName}-analysis-table-name-${environment}`,
    });
    
    new cdk.CfnOutput(this, 'ScenariosTableName', {
      value: this.scenariosTable.tableName,
      description: 'Name of the DynamoDB table for scenarios',
      exportName: `${appName}-scenarios-table-name-${environment}`,
    });
  }
} 