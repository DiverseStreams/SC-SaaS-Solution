import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { SupplyChainInfraStack } from '../lib/infra-stack';

describe('SupplyChainInfraStack', () => {
  const app = new cdk.App();
  const stack = new SupplyChainInfraStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  test('S3 Buckets Created', () => {
    template.resourceCountIs('AWS::S3::Bucket', 2); // CSV and Public Assets buckets
  });

  test('DynamoDB Tables Created', () => {
    template.resourceCountIs('AWS::DynamoDB::Table', 3); // Users, Analysis, and Scenarios tables
  });

  test('Cognito User Pool Created', () => {
    template.resourceCountIs('AWS::Cognito::UserPool', 1);
    template.resourceCountIs('AWS::Cognito::UserPoolClient', 1);
  });

  test('Lambda Functions Created', () => {
    template.resourceCountIs('AWS::Lambda::Function', 2); // COG Analysis and Geocoding
  });

  test('API Gateway Created', () => {
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
  });

  test('Secrets Manager Secret Created', () => {
    template.resourceCountIs('AWS::SecretsManager::Secret', 1); // OpenCage API key
  });
}); 