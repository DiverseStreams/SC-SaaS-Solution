#!/bin/bash
# Create necessary directories
mkdir -p src/components
mkdir -p lambda/geocode
mkdir -p lambda/processor
mkdir -p infrastructure/terraform

# Copy Lambda functions
cp -r ../Supply-chain-cog-optimizer/lambda/* lambda/
cp -r ../saas-starter/src/components/* src/components/

# Copy infrastructure code
cp -r ../Supply-chain-cog-optimizer/infrastructure/* infrastructure/ 