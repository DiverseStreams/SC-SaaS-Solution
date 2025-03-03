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

- [ ] Step 2: Understand existing authentication and database models
  - **Task**: Review existing auth system and database models to determine adaptation needs
  - **Files**:
    - Authentication-related components and hooks
    - Database schema definitions
    - API routes for user management
  - **Step Dependencies**: Step 1
  - **User Instructions**: None

- [ ] Step 3: Add AWS SDK and configuration
  - **Task**: Integrate AWS SDK and set up configuration for AWS services
  - **Files**:
    - `package.json`: Add AWS SDK dependencies
    - `lib/aws-config.ts`: AWS configuration utilities
    - `.env.local`: Add AWS credentials and config variables
  - **Step Dependencies**: Step 1
  - **User Instructions**: Run `npm install aws-sdk`

## Phase 2: AWS Infrastructure

- [ ] Step 4: Set up AWS CDK project in a subdirectory
  - **Task**: Create and configure AWS CDK for infrastructure as code
  - **Files**:
    - `cdk/lib/infra-stack.ts`: Main CDK stack
    - `cdk/bin/cdk.ts`: CDK entry point
    - `cdk/package.json`: CDK dependencies
  - **Step Dependencies**: Step 3
  - **User Instructions**: Run `mkdir cdk && cd cdk && npx aws-cdk init app --language typescript && npm install @aws-sdk/client-s3 @aws-sdk/client-dynamodb @aws-sdk/client-lambda @aws-sdk/client-cognito-identity @aws-sdk/client-secrets-manager`

- [ ] Step 5: Configure S3 buckets for file storage
  - **Task**: Create S3 buckets for CSV file uploads and storage
  - **Files**:
    - `cdk/lib/storage/s3-buckets.ts`: S3 bucket configuration
    - `lib/s3.ts`: Client-side S3 utilities
  - **Step Dependencies**: Step 4
  - **User Instructions**: None

- [ ] Step 6: Set up DynamoDB tables
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
    - `pages/api/geocode.ts`: API route for geocoding
  - **Step Dependencies**: Step 7
  - **User Instructions**: Create an OpenCage account and get API key

- [ ] Step 13: Create center of gravity calculation algorithms
  - **Task**: Implement core COG calculation algorithms
  - **Files**:
    - `lib/algorithms/cog.ts`: COG calculation utilities
    - `lib/algorithms/distance.ts`: Distance calculation utilities
    - `lib/algorithms/leadTime.ts`: Lead time calculation utilities
    - `pages/api/analyze.ts`: API route for analysis
  - **Step Dependencies**: Step 12
  - **User Instructions**: None

- [ ] Step 14: Implement optimization scenarios
  - **Task**: Create functionality for different optimization scenarios
  - **Files**:
    - `app/components/scenarios/`: Scenario components
    - `lib/scenarios.ts`: Scenario utilities
    - `pages/api/scenarios/[type].ts`: API routes for scenarios
  - **Step Dependencies**: Step 13
  - **User Instructions**: None

## Phase 6: Visualization & Maps

- [ ] Step 15: Add Mapbox integration
  - **Task**: Integrate Mapbox for interactive mapping
  - **Files**:
    - `app/components/map/Map.tsx`: Main map component
    - `app/components/map/Markers.tsx`: Location markers component
    - `lib/map.ts`: Map utility functions
  - **Step Dependencies**: Step 12
  - **User Instructions**: Run `npm install mapbox-gl @types/mapbox-gl` and create Mapbox account for API key

- [ ] Step 16: Implement lead time visualization
  - **Task**: Create visualization for lead time zones
  - **Files**:
    - `app/components/map/LeadTimeZones.tsx`: Lead time visualization
    - `app/components/map/Legend.tsx`: Map legend component
    - `lib/visualization.ts`: Visualization utilities
  - **Step Dependencies**: Step 15
  - **User Instructions**: None

- [ ] Step 17: Create results dashboard
  - **Task**: Build dashboard for displaying optimization results
  - **Files**:
    - `app/components/dashboard/`: Dashboard components
    - `app/results/page.tsx`: Results page
    - `lib/metrics.ts`: Metrics calculation utilities
  - **Step Dependencies**: Step 14, Step 16
  - **User Instructions**: Run `npm install recharts`

## Phase 7: Business Logic & What-If Analysis

- [ ] Step 18: Implement business dimension support
  - **Task**: Add support for business units, transport modes, service levels
  - **Files**:
    - `app/components/business/`: Business dimension components
    - `lib/dimensions.ts`: Business dimension utilities
  - **Step Dependencies**: Step 14
  - **User Instructions**: None

- [ ] Step 19: Create what-if analysis interface
  - **Task**: Build interface for real-time scenario adjustments
  - **Files**:
    - `app/components/whatif/`: What-if components
    - `app/whatif/page.tsx`: What-if analysis page
    - `lib/whatif.ts`: What-if analysis utilities
  - **Step Dependencies**: Step 17
  - **User Instructions**: None

- [ ] Step 20: Implement drag-and-drop DC placement
  - **Task**: Add drag-and-drop functionality for DC placement
  - **Files**:
    - `app/components/map/DraggableMarker.tsx`: Draggable marker
    - `lib/dragdrop.ts`: Drag-and-drop utilities
  - **Step Dependencies**: Step 19
  - **User Instructions**: Run `npm install react-dnd react-dnd-html5-backend`

## Phase 8: Security & Performance

- [ ] Step 21: Implement secure API key management
  - **Task**: Set up secure management for third-party API keys
  - **Files**:
    - `cdk/lib/secrets/manager.ts`: AWS Secrets Manager config
    - `lib/secrets.ts`: Client-side secrets utilities
  - **Step Dependencies**: Step 4
  - **User Instructions**: None

- [ ] Step 22: Add progress indicators and optimizations
  - **Task**: Implement progress indicators and performance optimizations
  - **Files**:
    - `app/components/ui/ProgressBar.tsx`: Progress indicator
    - `app/components/ui/Spinner.tsx`: Loading spinner
    - `lib/optimization.ts`: Performance utilities
  - **Step Dependencies**: Step 10, Step 13
  - **User Instructions**: None

- [ ] Step 23: Implement data retention policy
  - **Task**: Set up 30-day data retention for temporary data
  - **Files**:
    - `cdk/lib/lambda/retention.ts`: Data retention Lambda
    - `cdk/lib/events/rules.ts`: EventBridge rules
  - **Step Dependencies**: Step 6
  - **User Instructions**: None

## Phase 9: Testing & Deployment

- [ ] Step 24: Write unit and integration tests
  - **Task**: Create tests for critical components and flows
  - **Files**:
    - `__tests__/algorithms/`: Algorithm tests
    - `__tests__/components/`: Component tests
    - `__tests__/api/`: API tests
  - **Step Dependencies**: Step 13, Step 15
  - **User Instructions**: Run `npm install --save-dev jest @testing-library/react @testing-library/jest-dom`

- [ ] Step 25: Configure CI/CD pipeline
  - **Task**: Set up continuous integration and deployment
  - **Files**:
    - `.github/workflows/ci.yml`: CI workflow
    - `.github/workflows/deploy.yml`: Deployment workflow
    - `scripts/deploy.sh`: Deployment script
  - **Step Dependencies**: Step 24
  - **User Instructions**: Configure GitHub repository secrets for AWS access

- [ ] Step 26: Finalize documentation
  - **Task**: Create comprehensive documentation
  - **Files**:
    - `README.md`: Main documentation
    - `docs/`: Additional documentation
    - `.env.example`: Example environment configuration
  - **Step Dependencies**: All previous steps
  - **User Instructions**: None
