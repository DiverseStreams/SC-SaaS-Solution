import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { S3BucketConstruct } from './storage/s3-buckets';
import { DynamoDBTablesConstruct } from './storage/dynamodb-tables';
import { LambdaFunctionsConstruct } from './lambda/index';

export class SupplyChainInfraStack extends cdk.Stack {
  // Public properties to expose resources to other stacks if needed
  public readonly csvBucket: s3.Bucket;
  public readonly publicAssetsBucket: s3.Bucket;
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly usersTable: dynamodb.Table;
  public readonly analysisTable: dynamodb.Table;
  public readonly scenariosTable: dynamodb.Table;
  public readonly cogAnalysisFunction: lambda.Function;
  public readonly geocodingFunction: lambda.Function;
  public readonly openCageSecret: secretsmanager.Secret;

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
    
    // Create Lambda functions using the modular construct
    const lambdaFunctions = new LambdaFunctionsConstruct(this, 'LambdaFunctions', {
      environment,
      appName,
      csvBucket: this.csvBucket,
      publicAssetsBucket: this.publicAssetsBucket,
      usersTable: this.usersTable,
      analysisTable: this.analysisTable,
      scenariosTable: this.scenariosTable,
    });
    
    // Store references to Lambda resources
    this.cogAnalysisFunction = lambdaFunctions.cogAnalysisFunction;
    this.geocodingFunction = lambdaFunctions.geocodingFunction;
    this.openCageSecret = lambdaFunctions.openCageSecret;
    
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
    analysisResource.addMethod('POST', new apigateway.LambdaIntegration(this.cogAnalysisFunction), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    
    const geocodingResource = api.root.addResource('geocoding');
    geocodingResource.addMethod('POST', new apigateway.LambdaIntegration(this.geocodingFunction), {
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