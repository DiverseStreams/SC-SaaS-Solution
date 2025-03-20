# Implementation Plan for Supply Chain Center of Gravity Optimization Tool

## Project Setup & Infrastructure

- [x] Step 1: Initialize project structure
  - **Task**: Set up the base project structure using Next.js with TypeScript for the frontend and AWS CDK for infrastructure as code
  - **Files**:
    - `package.json`: Define dependencies and scripts
    - `tsconfig.json`: TypeScript configuration
    - `next.config.js`: Next.js configuration
    - `cdk/lib/infra-stack.ts`: AWS CDK stack definition
    - `.gitignore`: Git ignore configuration
  - **Step Dependencies**: None
  - **User Instructions**: Run `npx create-next-app supply-chain-cog --typescript --eslint` and `npm install -g aws-cdk` followed by `cdk init app --language typescript` in a subdirectory called `cdk`

- [ ] Step 2: Configure AWS resources using CDK
  - **Task**: Define AWS resources (Lambda, S3, DynamoDB, API Gateway) in CDK
  - **Files**:
    - `cdk/lib/infra-stack.ts`: Update stack with resource definitions
    - `cdk/lib/lambda/index.ts`: Define Lambda function handlers
    - `cdk/lib/storage/s3-buckets.ts`: Configure S3 buckets for file storage
    - `cdk/lib/storage/dynamodb-tables.ts`: Define DynamoDB tables
    - `cdk/lib/api/api-gateway.ts`: Set up API Gateway endpoints
  - **Step Dependencies**: Step 1
  - **User Instructions**: Run `cd cdk && npm install @aws-cdk/aws-lambda @aws-cdk/aws-s3 @aws-cdk/aws-dynamodb @aws-cdk/aws-apigateway`

- [ ] Step 3: Implement authentication & authorization
  - **Task**: Set up AWS Cognito for user authentication and authorization
  - **Files**:
    - `cdk/lib/auth/cognito.ts`: Define Cognito user pool and identity pool
    - `src/lib/auth.ts`: Client-side authentication utilities
    - `src/components/auth/SignIn.tsx`: Sign-in component
    - `src/components/auth/SignUp.tsx`: Sign-up component
    - `src/pages/auth/signin.tsx`: Sign-in page
    - `src/pages/auth/signup.tsx`: Sign-up page
  - **Step Dependencies**: Step 2
  - **User Instructions**: Run `cd cdk && npm install @aws-cdk/aws-cognito`

## Core Components & Layouts

- [ ] Step 4: Create global styles and shared components
  - **Task**: Implement base UI components and layouts that will be reused throughout the application
  - **Files**:
    - `src/styles/globals.css`: Global CSS styles
    - `src/components/layout/Header.tsx`: Application header
    - `src/components/layout/Footer.tsx`: Application footer
    - `src/components/layout/Sidebar.tsx`: Navigation sidebar
    - `src/components/ui/Button.tsx`: Reusable button component
    - `src/components/ui/Card.tsx`: Card component for content containers
    - `src/components/ui/Modal.tsx`: Modal dialog component
  - **Step Dependencies**: Step 1
  - **User Instructions**: Run `npm install tailwindcss postcss autoprefixer && npx tailwindcss init -p`

- [ ] Step 5: Create main application layout
  - **Task**: Implement the main application layout with navigation and responsive design
  - **Files**:
    - `src/components/layout/MainLayout.tsx`: Main layout component
    - `src/pages/_app.tsx`: Custom App component for global layout
    - `src/pages/index.tsx`: Home/landing page
    - `src/pages/dashboard.tsx`: Main dashboard page
    - `src/components/layout/Navigation.tsx`: Navigation component
  - **Step Dependencies**: Step 4
  - **User Instructions**: None

## Data Management & API Integration

- [ ] Step 6: Implement file upload and validation
  - **Task**: Create components and API endpoints for CSV file upload with validation
  - **Files**:
    - `src/components/data/FileUpload.tsx`: File upload component
    - `src/components/data/FileValidation.tsx`: File validation component
    - `src/pages/api/upload.ts`: API route for file upload
    - `src/lib/validation.ts`: File validation utilities
    - `src/lib/s3.ts`: Client-side S3 utilities
  - **Step Dependencies**: Step 2, Step 5
  - **User Instructions**: Run `npm install aws-sdk multer`

- [ ] Step 7: Create CSV template generation
  - **Task**: Implement functionality to generate and download CSV templates
  - **Files**:
    - `src/components/data/TemplateDownload.tsx`: Template download component
    - `src/pages/api/template.ts`: API route for template generation
    - `src/lib/csv.ts`: CSV generation utilities
    - `public/templates/location-template.csv`: Static template file
  - **Step Dependencies**: Step 6
  - **User Instructions**: Run `npm install csv-writer`

- [ ] Step 8: Implement geocoding service
  - **Task**: Create Lambda function and frontend integration for OpenCage geocoding API
  - **Files**:
    - `cdk/lib/lambda/geocoding.ts`: Geocoding Lambda function
    - `src/lib/geocoding.ts`: Client-side geocoding utilities
    - `src/components/data/Geocoding.tsx`: Geocoding progress component
    - `src/pages/api/geocode.ts`: API route for geocoding requests
  - **Step Dependencies**: Step 2, Step 6
  - **User Instructions**: Create an account on OpenCage and obtain an API key, then add it to AWS Secrets Manager

## Center of Gravity Analysis

- [ ] Step 9: Implement core COG calculation algorithms
  - **Task**: Create Lambda functions for center of gravity calculations
  - **Files**:
    - `cdk/lib/lambda/cog.ts`: COG calculation Lambda function
    - `src/lib/algorithms/cog.ts`: COG calculation utilities
    - `src/lib/algorithms/distance.ts`: Distance calculation utilities
    - `src/lib/algorithms/leadTime.ts`: Lead time calculation utilities
  - **Step Dependencies**: Step 8
  - **User Instructions**: None

- [ ] Step 10: Implement optimization scenarios
  - **Task**: Create functionality for different optimization scenarios (current state, single DC, multi-DC)
  - **Files**:
    - `src/components/scenarios/ScenarioSelector.tsx`: Scenario selection component
    - `src/components/scenarios/CurrentState.tsx`: Current state scenario component
    - `src/components/scenarios/SingleDC.tsx`: Single DC optimization component
    - `src/components/scenarios/MultiDC.tsx`: Multi-DC optimization component
    - `src/pages/api/scenarios/[type].ts`: API routes for scenario calculations
  - **Step Dependencies**: Step 9
  - **User Instructions**: None

- [ ] Step 11: Create custom location testing
  - **Task**: Implement interface and backend for testing custom DC locations
  - **Files**:
    - `src/components/scenarios/CustomLocation.tsx`: Custom location testing component
    - `src/components/map/LocationPicker.tsx`: Map-based location picker
    - `src/pages/api/scenarios/custom.ts`: API route for custom location testing
  - **Step Dependencies**: Step 10
  - **User Instructions**: None

## Visualization & Maps

- [ ] Step 12: Implement interactive mapping
  - **Task**: Create interactive map components using Mapbox GL JS
  - **Files**:
    - `src/components/map/Map.tsx`: Main map component
    - `src/components/map/MapControls.tsx`: Map control components
    - `src/components/map/Markers.tsx`: Location markers component
    - `src/lib/map.ts`: Map utility functions
    - `src/styles/map.css`: Map-specific styles
  - **Step Dependencies**: Step 5
  - **User Instructions**: Create a Mapbox account and obtain an API key, then add it to your .env file

- [ ] Step 13: Implement lead time zone visualization
  - **Task**: Create color-coded lead time zones on the map
  - **Files**:
    - `src/components/map/LeadTimeZones.tsx`: Lead time zones component
    - `src/lib/algorithms/zones.ts`: Zone calculation utilities
    - `src/components/map/Legend.tsx`: Map legend component
  - **Step Dependencies**: Step 12
  - **User Instructions**: None

## Dashboard & Results

- [ ] Step 14: Create results dashboard
  - **Task**: Implement dashboard for displaying optimization results
  - **Files**:
    - `src/components/results/Dashboard.tsx`: Results dashboard component
    - `src/components/results/DistanceMetrics.tsx`: Distance metrics component
    - `src/components/results/LeadTimeMetrics.tsx`: Lead time metrics component
    - `src/components/results/CoverageAnalysis.tsx`: Coverage analysis component
    - `src/pages/results.tsx`: Results page
  - **Step Dependencies**: Step 11, Step 13
  - **User Instructions**: Run `npm install recharts`

- [ ] Step 15: Implement scenario comparison
  - **Task**: Create interface for comparing different optimization scenarios
  - **Files**:
    - `src/components/results/ScenarioComparison.tsx`: Scenario comparison component
    - `src/components/results/ComparisonChart.tsx`: Comparison chart component
    - `src/lib/comparison.ts`: Comparison utility functions
  - **Step Dependencies**: Step 14
  - **User Instructions**: None

## What-If Analysis

- [ ] Step 16: Create what-if analysis interface
  - **Task**: Implement interface for real-time scenario adjustments
  - **Files**:
    - `src/components/whatif/WhatIfAnalysis.tsx`: What-if analysis component
    - `src/components/whatif/ParameterControls.tsx`: Parameter adjustment controls
    - `src/pages/whatif.tsx`: What-if analysis page
    - `src/lib/whatif.ts`: What-if analysis utilities
  - **Step Dependencies**: Step 14
  - **User Instructions**: None

- [ ] Step 17: Implement drag-and-drop DC placement
  - **Task**: Create interactive drag-and-drop functionality for DC placement
  - **Files**:
    - `src/components/whatif/DragDropDC.tsx`: Drag-and-drop DC component
    - `src/components/map/DraggableMarker.tsx`: Draggable marker component
    - `src/lib/dragdrop.ts`: Drag-and-drop utility functions
  - **Step Dependencies**: Step 16
  - **User Instructions**: Run `npm install react-dnd react-dnd-html5-backend`

## Business Context & Filtering

- [ ] Step 18: Implement business dimension support
  - **Task**: Add support for business dimensions (units, modes, service levels)
  - **Files**:
    - `src/components/business/DimensionSelector.tsx`: Dimension selector component
    - `src/components/business/BusinessUnits.tsx`: Business units component
    - `src/components/business/TransportModes.tsx`: Transport modes component
    - `src/components/business/ServiceLevels.tsx`: Service levels component
    - `src/lib/dimensions.ts`: Business dimension utilities
  - **Step Dependencies**: Step 5
  - **User Instructions**: None

- [ ] Step 19: Create filtering and segmentation
  - **Task**: Implement filtering and segmentation by business dimensions
  - **Files**:
    - `src/components/business/Filters.tsx`: Filters component
    - `src/components/business/Segmentation.tsx`: Segmentation component
    - `src/lib/filters.ts`: Filtering utility functions
    - `src/pages/api/filter.ts`: API route for filtered data
  - **Step Dependencies**: Step 18
  - **User Instructions**: None

## Data Persistence & Integration

- [ ] Step 20: Implement DynamoDB integration
  - **Task**: Create data persistence layer using DynamoDB
  - **Files**:
    - `src/lib/dynamodb.ts`: DynamoDB utility functions
    - `src/pages/api/data/[id].ts`: API routes for data operations
    - `cdk/lib/lambda/data.ts`: Lambda functions for data operations
  - **Step Dependencies**: Step 2
  - **User Instructions**: None

- [ ] Step 21: Implement data retention policy
  - **Task**: Set up 30-day data retention policy for temporary data
  - **Files**:
    - `cdk/lib/lambda/retention.ts`: Lambda function for data retention
    - `cdk/lib/events/rules.ts`: EventBridge rules for scheduled cleanup
  - **Step Dependencies**: Step 20
  - **User Instructions**: None

## Security & Performance

- [ ] Step 22: Implement secure API key management
  - **Task**: Create secure API key management for third-party services
  - **Files**:
    - `cdk/lib/secrets/manager.ts`: AWS Secrets Manager configuration
    - `src/lib/secrets.ts`: Client-side secrets utilities
    - `cdk/lib/lambda/secrets.ts`: Lambda function for secrets access
  - **Step Dependencies**: Step 2
  - **User Instructions**: Run `cd cdk && npm install @aws-cdk/aws-secretsmanager`

- [ ] Step 23: Add progress indicators and performance optimizations
  - **Task**: Implement progress indicators and optimize for large datasets
  - **Files**:
    - `src/components/ui/ProgressBar.tsx`: Progress bar component
    - `src/components/ui/Spinner.tsx`: Loading spinner component
    - `src/lib/optimization.ts`: Performance optimization utilities
  - **Step Dependencies**: Step 5
  - **User Instructions**: None

## Testing & Finalization

- [ ] Step 24: Implement unit tests
  - **Task**: Create unit tests for critical components and algorithms
  - **Files**:
    - `__tests__/algorithms/cog.test.ts`: COG calculation tests
    - `__tests__/algorithms/distance.test.ts`: Distance calculation tests
    - `__tests__/components/map/Map.test.tsx`: Map component tests
    - `__tests__/lib/validation.test.ts`: Validation utility tests
  - **Step Dependencies**: Step 9, Step 12
  - **User Instructions**: Run `npm install --save-dev jest @testing-library/react @testing-library/jest-dom`

- [ ] Step 25: Implement integration tests
  - **Task**: Create integration tests for end-to-end workflows
  - **Files**:
    - `__tests__/integration/upload-workflow.test.ts`: File upload workflow test
    - `__tests__/integration/optimization-workflow.test.ts`: Optimization workflow test
    - `__tests__/integration/whatif-workflow.test.ts`: What-if analysis workflow test
  - **Step Dependencies**: Step 24
  - **User Instructions**: Run `npm install --save-dev cypress`

- [ ] Step 26: Finalize deployment configuration
  - **Task**: Configure CI/CD pipeline and finalize deployment settings
  - **Files**:
    - `.github/workflows/deploy.yml`: GitHub Actions workflow
    - `cdk/bin/deploy.ts`: CDK deployment script
    - `README.md`: Project documentation
    - `.env.example`: Example environment variables
  - **Step Dependencies**: All previous steps
  - **User Instructions**: Configure GitHub repository and AWS access keys for GitHub Actions
  