# Supply Chain Center of Gravity Optimization Tool - AWS Infrastructure

This directory contains the AWS CDK (Cloud Development Kit) code for provisioning and managing the cloud infrastructure required by the Supply Chain Center of Gravity Optimization Tool.

## Infrastructure Components

- **S3 Buckets**
  - CSV Uploads Bucket: For storing uploaded CSV files
  - Public Assets Bucket: For publicly accessible assets

- **DynamoDB Tables**
  - Users Table: For user data
  - Analysis Table: For storing analysis results
  - Scenarios Table: For storing optimization scenarios

- **Cognito User Pool**
  - User authentication and authorization

- **Lambda Functions**
  - Center of Gravity Analysis: For running optimization algorithms
  - Geocoding: For converting addresses to coordinates

- **API Gateway**
  - RESTful API endpoints for the application

- **Secrets Manager**
  - Secure storage for API keys

## Getting Started

### Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js and npm installed

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Build the project:
   ```
   npm run build
   ```

3. Deploy the stack to AWS:
   ```
   npm run deploy
   ```

### Common Commands

- Synthesize CloudFormation template:
  ```
  npm run synth
  ```

- Compare deployed stack with current state:
  ```
  npm run cdk diff
  ```

- Remove the stack from AWS:
  ```
  npm run destroy
  ```

## Environment Variables

Create a `.env` file in the CDK directory with the following variables:

```
AWS_ACCOUNT_ID=your-aws-account-id
AWS_REGION=your-aws-region
ENVIRONMENT=dev|staging|prod
```

## Testing

Run the tests with:
```
npm test
``` 