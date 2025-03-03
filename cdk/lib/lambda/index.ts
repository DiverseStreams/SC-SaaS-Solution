import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

/**
 * Properties for LambdaFunctionsConstruct
 */
export interface LambdaFunctionsConstructProps {
  /**
   * Environment name (e.g., 'dev', 'prod')
   */
  environment: string;
  
  /**
   * Application name for resource naming
   */
  appName: string;
  
  /**
   * S3 bucket for CSV file uploads
   */
  csvBucket: s3.Bucket;
  
  /**
   * S3 bucket for public assets
   */
  publicAssetsBucket: s3.Bucket;
  
  /**
   * DynamoDB table for users
   */
  usersTable: dynamodb.Table;
  
  /**
   * DynamoDB table for analysis results
   */
  analysisTable: dynamodb.Table;
  
  /**
   * DynamoDB table for scenarios
   */
  scenariosTable: dynamodb.Table;
}

/**
 * A construct for creating the Lambda functions needed by the application
 */
export class LambdaFunctionsConstruct extends Construct {
  /**
   * Lambda function for center of gravity calculations
   */
  public readonly cogAnalysisFunction: lambda.Function;
  
  /**
   * Lambda function for geocoding
   */
  public readonly geocodingFunction: lambda.Function;
  
  /**
   * OpenCage API key secret
   */
  public readonly openCageSecret: secretsmanager.Secret;
  
  /**
   * Lambda execution role
   */
  public readonly lambdaRole: iam.Role;
  
  constructor(scope: Construct, id: string, props: LambdaFunctionsConstructProps) {
    super(scope, id);
    
    const { 
      environment, 
      appName, 
      csvBucket, 
      publicAssetsBucket, 
      usersTable, 
      analysisTable, 
      scenariosTable 
    } = props;
    
    // Create Secret for OpenCage API key
    this.openCageSecret = new secretsmanager.Secret(this, 'OpenCageApiKey', {
      secretName: `${appName}/opencage-api-key-${environment}`,
      description: 'API key for OpenCage Geocoding service',
    });
    
    // Create Lambda execution role
    this.lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `${appName}-lambda-role-${environment}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });
    
    // Grant permissions to S3 buckets
    csvBucket.grantReadWrite(this.lambdaRole);
    publicAssetsBucket.grantRead(this.lambdaRole);
    
    // Grant permissions to DynamoDB tables
    usersTable.grantReadWriteData(this.lambdaRole);
    analysisTable.grantReadWriteData(this.lambdaRole);
    scenariosTable.grantReadWriteData(this.lambdaRole);
    
    // Grant permission to read the OpenCage API key
    this.openCageSecret.grantRead(this.lambdaRole);
    
    // Create Lambda layer for shared code
    const lambdaLayer = new lambda.LayerVersion(this, 'SharedLayer', {
      code: lambda.Code.fromAsset('lambda/layer'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      description: 'Shared utilities for Lambda functions',
    });
    
    // COG Analysis Lambda - Cost-optimized but functional
    this.cogAnalysisFunction = new lambda.Function(this, 'CogAnalysisFunction', {
      functionName: `${appName}-cog-analysis-${environment}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/cog-analysis'),
      timeout: cdk.Duration.seconds(60), // Reduced from 5 minutes to 1 minute
      memorySize: 512, // Reduced from 1024MB to 512MB for cost savings
      role: this.lambdaRole,
      layers: [lambdaLayer],
      reservedConcurrentExecutions: 10, // Limit concurrent executions to control costs
      environment: {
        ENVIRONMENT: environment,
        USERS_TABLE: usersTable.tableName,
        ANALYSIS_TABLE: analysisTable.tableName,
        SCENARIOS_TABLE: scenariosTable.tableName,
        CSV_BUCKET: csvBucket.bucketName,
        CACHE_RESULTS: 'true', // Enable caching for cost efficiency
        MAX_LOCATIONS: '10000', // Limit the number of locations to process
      },
    });
    
    // Geocoding Lambda - Cost-optimized
    this.geocodingFunction = new lambda.Function(this, 'GeocodingFunction', {
      functionName: `${appName}-geocoding-${environment}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/geocoding'),
      timeout: cdk.Duration.seconds(30), // Reduced from 1 minute to 30 seconds
      memorySize: 256, // Maintained at 256MB as this is sufficient for geocoding
      role: this.lambdaRole,
      layers: [lambdaLayer],
      reservedConcurrentExecutions: 5, // Limit concurrent executions to control costs
      environment: {
        ENVIRONMENT: environment,
        USERS_TABLE: usersTable.tableName,
        ANALYSIS_TABLE: analysisTable.tableName,
        SCENARIOS_TABLE: scenariosTable.tableName,
        CSV_BUCKET: csvBucket.bucketName,
        OPENCAGE_SECRET_NAME: this.openCageSecret.secretName,
        CACHE_RESULTS: 'true', // Enable caching for cost efficiency
        MAX_BATCH_SIZE: '25', // Limit batch size for geocoding to stay within free tier limits
        CACHE_TTL_DAYS: '30', // Store geocoding results for 30 days to reduce API calls
      },
    });
    
    // Add CloudFormation outputs
    new cdk.CfnOutput(this, 'CogAnalysisFunctionName', {
      value: this.cogAnalysisFunction.functionName,
      description: 'Name of the center of gravity analysis Lambda function',
      exportName: `${appName}-cog-analysis-function-name-${environment}`,
    });
    
    new cdk.CfnOutput(this, 'GeocodingFunctionName', {
      value: this.geocodingFunction.functionName,
      description: 'Name of the geocoding Lambda function',
      exportName: `${appName}-geocoding-function-name-${environment}`,
    });
    
    new cdk.CfnOutput(this, 'OpenCageSecretName', {
      value: this.openCageSecret.secretName,
      description: 'Name of the OpenCage API key secret',
      exportName: `${appName}-opencage-secret-name-${environment}`,
    });
  }
} 