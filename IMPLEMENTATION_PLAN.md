# Revised Implementation Plan for Supply Chain Center of Gravity Optimization Tool

This plan adapts our original implementation approach to leverage the nextjs/saas-starter repository (with 11k+ stars) as our foundation, focusing on adding AWS serverless infrastructure and domain-specific features.

## Phase 1: Project Setup & Foundation

- [X] Step 1: Clone and configure nextjs/saas-starter
  - **Task**: Clone the repository and set up the base environment
  - **Files**:
    - `.env.local`: Configure environment variables
    - `package.json`: Review and update dependencies as needed
  - **Step Dependencies**: None
  - **User Instructions**: Run `git clone https://github.com/nextjs/saas-starter.git supply-chain-cog && cd supply-chain-cog && npm install`

- [X] Step 2: Understand existing authentication and database models
  - **Task**: Review existing auth system and database models to determine adaptation needs
  - **Files**:
    - Authentication-related components and hooks
    - Database schema definitions
    - API routes for user management
  - **Step Dependencies**: Step 1
  - **User Instructions**: None

- [X] Step 3: Add AWS SDK and configuration
  - **Task**: Integrate AWS SDK and set up configuration for AWS services
  - **Files**:
    - `package.json`: Add AWS SDK dependencies
    - `lib/aws-config.ts`: AWS configuration utilities
    - `.env.local`: Add AWS credentials and config variables
  - **Step Dependencies**: Step 1
  - **User Instructions**: Run `npm install` to install the newly added AWS SDK dependencies

## Phase 2: AWS Infrastructure

- [X] Step 4: Set up AWS CDK project in a subdirectory
  - **Task**: Create and configure AWS CDK for infrastructure as code
  - **Files**:
    - `cdk/lib/infra-stack.ts`: Main CDK stack
    - `cdk/bin/cdk.ts`: CDK entry point
    - `cdk/package.json`: CDK dependencies
  - **Step Dependencies**: Step 3
  - **User Instructions**: Run `cd cdk && npm install` to install CDK dependencies

- [X] Step 5: Configure S3 buckets for file storage
  - **Task**: Create S3 buckets for CSV file uploads and storage
  - **Files**:
    - `cdk/lib/storage/s3-buckets.ts`: S3 bucket configuration
    - `lib/s3.ts`: Client-side S3 utilities
  - **Step Dependencies**: Step 4
  - **User Instructions**: None

- [X] Step 6: Set up DynamoDB tables
  - **Task**: Create DynamoDB tables for user data, analysis results, and configuration
  - **Files**:
    - `cdk/lib/storage/dynamodb-tables.ts`: DynamoDB table definitions
    - `lib/dynamodb.ts`: Client-side DynamoDB utilities
  - **Step Dependencies**: Step 4
  - **User Instructions**: None

- [ ] Step 7: Create Lambda functions for backend processing
  - **Task**: Set up Lambda functions for data processing and analysis
  - **Files**:
    - `cdk/lib/lambda/index.ts`: Lambda function configuration
    - `cdk/lib/lambda/cog.ts`: Center of gravity calculation Lambda
    - `cdk/lib/lambda/geocoding.ts`: Geocoding service Lambda
  - **Step Dependencies**: Step 5, Step 6
  - **User Instructions**: None

## Phase 3: Database Adaptation

- [ ] Step 8: Create adapters for PostgreSQL to DynamoDB
  - **Task**: Create adapter layer to switch between PostgreSQL and DynamoDB when needed
  - **Files**:
    - `lib/db-adapter.ts`: Database adapter utilities
    - `pages/api/db-proxy.ts`: API routes for database operations
  - **Step Dependencies**: Step 6
  - **User Instructions**: None

- [ ] Step 9: Update authentication to work with AWS Cognito
  - **Task**: Adapt existing authentication to work with AWS Cognito
  - **Files**:
    - `app/auth/`: Authentication components and hooks
    - `lib/auth.ts`: Authentication utilities
  - **Step Dependencies**: Step 7
  - **User Instructions**: None

## Phase 4: File Management

- [ ] Step 10: Implement file upload and CSV processing
  - **Task**: Create components and API endpoints for CSV file upload with validation
  - **Files**:
    - `app/csv-upload/`: File upload components
    - `pages/api/upload.ts`: API route for file upload
    - `lib/validation.ts`: File validation utilities
  - **Step Dependencies**: Step 5
  - **User Instructions**: Run `npm install papaparse @types/papaparse`

- [ ] Step 11: Create CSV template generation
  - **Task**: Implement functionality to generate and download CSV templates
  - **Files**:
    - `app/templates/`: Template components
    - `pages/api/template.ts`: API route for template generation
    - `public/templates/location-template.csv`: Static template file
  - **Step Dependencies**: Step 10
  - **User Instructions**: None

## Phase 5: Core Analysis Functionality

- [ ] Step 12: Implement geocoding service integration
  - **Task**: Integrate with OpenCage geocoding API
  - **Files**:
    - `lib/geocoding.ts`: Geocoding utilities
    - `app/components/map/Geocoder.tsx`: Geocoding component
    - `