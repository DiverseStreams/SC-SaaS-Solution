import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';

/**
 * Properties for S3BucketConstruct
 */
export interface S3BucketConstructProps {
  /**
   * Environment name (e.g., 'dev', 'prod')
   */
  environment: string;
  
  /**
   * Application name for resource naming
   */
  appName: string;
  
  /**
   * AWS account ID for resource naming
   */
  accountId: string;
  
  /**
   * Optional CORS allowed origins
   * @default ['*']
   */
  corsAllowedOrigins?: string[];
}

/**
 * A construct for creating the S3 buckets needed by the application
 */
export class S3BucketConstruct extends Construct {
  /**
   * The S3 bucket for CSV file uploads
   */
  public readonly csvBucket: s3.Bucket;
  
  /**
   * The S3 bucket for public assets
   */
  public readonly publicAssetsBucket: s3.Bucket;
  
  constructor(scope: Construct, id: string, props: S3BucketConstructProps) {
    super(scope, id);
    
    const { environment, appName, accountId, corsAllowedOrigins = ['*'] } = props;
    
    // Create CSV uploads bucket
    this.csvBucket = new s3.Bucket(this, 'CSVUploadsBucket', {
      bucketName: `${appName}-csv-uploads-${environment}-${accountId}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: corsAllowedOrigins,
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
      lifecycleRules: [
        {
          // 30-day retention policy for uploaded files
          expiration: cdk.Duration.days(30),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      // Set removal policy based on environment
      removalPolicy: environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
    });
    
    // Create public assets bucket
    this.publicAssetsBucket = new s3.Bucket(this, 'PublicAssetsBucket', {
      bucketName: `${appName}-public-assets-${environment}-${accountId}`,
      versioned: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: true,
        blockPublicPolicy: false,
        ignorePublicAcls: true,
        restrictPublicBuckets: false,
      }),
      websiteIndexDocument: 'index.html',
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: corsAllowedOrigins,
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
      // Set removal policy based on environment
      removalPolicy: environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
    });
    
    // Make the public bucket accessible
    const publicBucketPolicy = new s3.BucketPolicy(this, 'PublicAssetsBucketPolicy', {
      bucket: this.publicAssetsBucket,
    });
    
    publicBucketPolicy.document.addStatements(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        resources: [this.publicAssetsBucket.arnForObjects('*')],
      })
    );
    
    // Add CloudFormation outputs
    new cdk.CfnOutput(this, 'CSVBucketName', {
      value: this.csvBucket.bucketName,
      description: 'Name of the S3 bucket for CSV uploads',
      exportName: `${appName}-csv-bucket-name-${environment}`,
    });
    
    new cdk.CfnOutput(this, 'PublicAssetsBucketName', {
      value: this.publicAssetsBucket.bucketName,
      description: 'Name of the S3 bucket for public assets',
      exportName: `${appName}-public-assets-bucket-name-${environment}`,
    });
  }
} 