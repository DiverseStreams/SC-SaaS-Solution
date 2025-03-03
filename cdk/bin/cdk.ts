#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SupplyChainInfraStack } from '../lib/infra-stack';

const app = new cdk.App();

// Environment configuration
const account = process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID;
const region = process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1';
const appName = 'supply-chain-cog';
const environment = process.env.ENVIRONMENT || 'dev';

// Create the main infrastructure stack
new SupplyChainInfraStack(app, `${appName}-${environment}`, {
  env: { account, region },
  stackName: `${appName}-${environment}`,
  description: 'Supply Chain Center of Gravity Optimization Tool Infrastructure',
  // Tags for all resources in this stack
  tags: {
    Project: appName,
    Environment: environment,
    ManagedBy: 'CDK',
  },
  // Cross-stack references
  crossRegionReferences: false,
});

// Apply runtime environment-specific configurations if needed
// Example: if (environment === 'prod') { ... }

app.synth(); 