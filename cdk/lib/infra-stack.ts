import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { S3BucketConstruct } from './storage/s3-buckets';
import { DynamoDBTablesConstruct } from './storage/dynamodb-tables';

export class SupplyChainInfraStack extends cdk.Stack {
  // Public properties to expose resources to other stacks if needed
  public readonly csvBucket: s3.Bucket;
  public readonly publicAssetsBucket: s3.Bucket;
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly usersTable: dynamodb.Table;
  public readonly analysisTable: dynamodb.Table;
  public readonly scenariosTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Environment name extraction from stack ID for resource naming
    const environment = id.split('-').pop() || 'dev';
    const appName = 'supply-chain-cog';

    // ============================================================
    // S3 Buckets for file storage
    // ============================================================
    
    // Create S3 buckets using the modular construct
    const s3Buckets = new S3BucketConstruct(this, 'S3Buckets', {
      environment,
      appName,
      accountId: this.account,
      corsAllowedOrigins: ['http://localhost:3000'], // TODO: Update with actual domains
    });
    
    // Store references to buckets
    this.csvBucket = s3Buckets.csvBucket;
    this.publicAssetsBucket = s3Buckets.publicAssetsBucket;

    // ============================================================
    // DynamoDB Tables
    // ============================================================
    
    // Create DynamoDB tables using the modular construct
    const dynamoTables = new DynamoDBTablesConstruct(this, 'DynamoDBTables', {
      environment,
      appName,
    });
    
    // Store references to tables
    this.usersTable = dynamoTables.usersTable;
    this.analysisTable = dynamoTables.analysisTable;
    this.scenariosTable = dynamoTables.scenariosTable;

    // ============================================================
    // Cognito User Pool
    // ============================================================
    
    // User pool for authentication
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${appName}-user-pool-${environment}`,
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        fullname: { required: false, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });
    
    // User pool client
    this.userPoolClient = this.userPool.addClient('UserPoolClient', {
      userPoolClientName: `${appName}-client-${environment}`,
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
        adminUserPassword: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
        callbackUrls: ['http://localhost:3000/api/auth/callback/cognito'], // TODO: Update with application domain
        logoutUrls: ['http://localhost:3000'], // TODO: Update with application domain
      },
    });
    
    // ============================================================
    // Lambda Functions
    // ============================================================
    
    // Common Lambda role with basic permissions
    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });
    
    // Add S3 permissions
    this.csvBucket.grantReadWrite(lambdaRole);
    this.publicAssetsBucket.grantRead(lambdaRole);
    
    // Add DynamoDB permissions
    this.usersTable.grantReadWriteData(lambdaRole);
    this.analysisTable.grantReadWriteData(lambdaRole);
    this.scenariosTable.grantReadWriteData(lambdaRole);
    
    // Center of Gravity analysis Lambda function
    const cogAnalysisLambda = new lambda.Function(this, 'CogAnalysisLambda', {
      functionName: `${appName}-cog-analysis-${environment}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/cog-analysis'), // Placeholder, we'll create this later
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      role: lambdaRole,
      environment: {
        USERS_TABLE: this.usersTable.tableName,
        ANALYSIS_TABLE: this.analysisTable.tableName,
        SCENARIOS_TABLE: this.scenariosTable.tableName,
        CSV_BUCKET: this.csvBucket.bucketName,
      },
    });
    
    // Geocoding Lambda function
    const geocodingLambda = new lambda.Function(this, 'GeocodingLambda', {
      functionName: `${appName}-geocoding-${environment}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/geocoding'), // Placeholder, we'll create this later
      timeout: cdk.Duration.minutes(1),
      memorySize: 256,
      role: lambdaRole,
      environment: {
        USERS_TABLE: this.usersTable.tableName,
        ANALYSIS_TABLE: this.analysisTable.tableName,
        SCENARIOS_TABLE: this.scenariosTable.tableName,
        CSV_BUCKET: this.csvBucket.bucketName,
      },
    });

    // ============================================================
    // Secrets Manager for API Keys
    // ============================================================
    
    // Secret for OpenCage API key
    const openCageSecret = new secretsmanager.Secret(this, 'OpenCageApiKey', {
      secretName: `${appName}/opencage-api-key-${environment}`,
      description: 'API key for OpenCage Geocoding service',
    });
    
    // Grant Lambda functions access to secrets
    openCageSecret.grantRead(geocodingLambda);
    
    // ============================================================
    // API Gateway
    // ============================================================
    
    // REST API for Lambda functions
    const api = new apigateway.RestApi(this, 'SupplyChainApi', {
      restApiName: `${appName}-api-${environment}`,
      description: 'API for Supply Chain Optimization Tool',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // TODO: Restrict to application domain
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
        maxAge: cdk.Duration.days(1),
      },
    });
    
    // Cognito authorizer for the API
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'ApiAuthorizer', {
      cognitoUserPools: [this.userPool],
    });
    
    // API resources and integrations
    const analysisResource = api.root.addResource('analysis');
    analysisResource.addMethod('POST', new apigateway.LambdaIntegration(cogAnalysisLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    
    const geocodingResource = api.root.addResource('geocoding');
    geocodingResource.addMethod('POST', new apigateway.LambdaIntegration(geocodingLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // ============================================================
    // Output values for easy access
    // ============================================================
    
    // API Gateway URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'URL of the API Gateway',
      exportName: `${appName}-api-url-${environment}`,
    });
    
    // Cognito user pool ID and client ID
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'ID of the Cognito User Pool',
      exportName: `${appName}-user-pool-id-${environment}`,
    });
    
    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'ID of the Cognito User Pool Client',
      exportName: `${appName}-user-pool-client-id-${environment}`,
    });
  }
} 