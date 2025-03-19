.
├── AWSCLIV2.pkg
├── DEPENDENCIES.md
├── IMPLEMENTATION_PLAN.md
├── INVENTORY.md
├── Implementation Plan
├── LICENSE
├── README.md
├── STRUCTURE.md
├── Self-Service-Suppyl-Chain-Analytics-Tool
│   └── README.md
├── Supply-chain-cog-optimizer
│   ├── IMPLEMENTATION_PLAN.md
│   ├── README.md
│   ├── eslint.config.mjs
│   ├── next.config.ts
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── public
│   │   ├── file.svg
│   │   ├── globe.svg
│   │   ├── next.svg
│   │   ├── vercel.svg
│   │   └── window.svg
│   ├── src
│   │   └── app
│   │       ├── favicon.ico
│   │       ├── globals.css
│   │       ├── layout.tsx
│   │       └── page.tsx
│   └── tsconfig.json
├── app
│   ├── (dashboard)
│   │   ├── dashboard
│   │   │   ├── activity
│   │   │   │   └── page.tsx
│   │   │   ├── general
│   │   │   │   └── page.tsx
│   │   │   ├── invite-team.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── security
│   │   │   │   └── page.tsx
│   │   │   └── settings.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── pricing
│   │   │   ├── page.tsx
│   │   │   └── submit-button.tsx
│   │   └── terminal.tsx
│   ├── (login)
│   │   ├── actions.ts
│   │   ├── login.tsx
│   │   ├── sign-in
│   │   │   └── page.tsx
│   │   └── sign-up
│   │       └── page.tsx
│   ├── admin
│   │   └── aws-status
│   │       └── page.tsx
│   ├── api
│   │   └── stripe
│   │       ├── checkout
│   │       │   └── route.ts
│   │       └── webhook
│   │           └── route.ts
│   ├── components
│   │   ├── AddressGeocoder.tsx
│   │   ├── FileManager.tsx
│   │   ├── FileUpload.tsx
│   │   └── ScenarioList.tsx
│   ├── dynamodb-test
│   │   └── page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── lambda-test
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── not-found.tsx
│   └── s3-test
│       └── page.tsx
├── auth-test.html
├── cdk
│   ├── README.md
│   ├── bin
│   │   └── cdk.ts
│   ├── cdk.json
│   ├── cdk.out
│   │   ├── asset.93b99e790463ce3ee70210e9b6f6b50834eff40adca1098afaa1863e7299ab0a
│   │   │   └── nodejs
│   │   │       ├── package-lock.json
│   │   │       ├── package.json
│   │   │       └── utils.js
│   │   ├── asset.a032dfd67de037d3a53c1995368f816b90d72faa846a20268163f6c990fd8248
│   │   │   └── index.js
│   │   ├── asset.b202ce01cf17ae4c180202e39f6e813859ada44fcf1985873aa797c167060277
│   │   │   └── nodejs
│   │   │       ├── package.json
│   │   │       └── utils.js
│   │   ├── asset.c55b7419389de4e42b2577f0fb4a827459669f6b1e9c23847651d6e7bfa17d52
│   │   │   └── index.js
│   │   ├── cdk.out
│   │   ├── manifest.json
│   │   ├── supply-chain-cog-dev.assets.json
│   │   ├── supply-chain-cog-dev.template.json
│   │   └── tree.json
│   ├── jest.config.js
│   ├── lambda
│   │   ├── cog-analysis
│   │   │   └── index.js
│   │   ├── geocoding
│   │   │   └── index.js
│   │   └── layer
│   │       └── nodejs
│   │           ├── package-lock.json
│   │           ├── package.json
│   │           └── utils.js
│   ├── lib
│   │   ├── infra-stack.ts
│   │   ├── lambda
│   │   │   ├── index.ts
│   │   │   └── supply-chain-processor
│   │   └── storage
│   │       ├── dynamodb-tables.ts
│   │       └── s3-buckets.ts
│   ├── package-lock.json
│   ├── package.json
│   ├── test
│   │   └── infra-stack.test.ts
│   └── tsconfig.json
├── cdk.json
├── cdk.out
├── components
│   └── ui
│       ├── avatar.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── radio-group.tsx
├── components.json
├── docs
│   ├── ARCHITECTURE.md
│   └── existing-architecture.md
├── drizzle.config.ts
├── geocoding-function
│   ├── function.zip
│   ├── package-lock.json
│   └── package.json
├── index.js
├── inventory.sh
├── inventory_simple.sh
├── lambda
│   ├── cog-analysis
│   │   └── index.js
│   ├── geocoding
│   │   └── index.js
│   └── layer
│       └── nodejs
│           ├── package.json
│           └── utils.js
├── layer.zip
├── lib
│   ├── auth
│   │   ├── index.tsx
│   │   ├── middleware.ts
│   │   └── session.ts
│   ├── aws-config.ts
│   ├── aws-status.ts
│   ├── db
│   │   ├── drizzle.ts
│   │   ├── migrations
│   │   │   ├── 0000_soft_the_anarchist.sql
│   │   │   └── meta
│   │   │       ├── 0000_snapshot.json
│   │   │       └── _journal.json
│   │   ├── queries.ts
│   │   ├── schema.ts
│   │   ├── seed.ts
│   │   └── setup.ts
│   ├── dynamodb.ts
│   ├── lambda.ts
│   ├── payments
│   │   ├── actions.ts
│   │   └── stripe.ts
│   ├── s3.ts
│   └── utils.ts
├── middleware.ts
├── migrate.sh
├── next-env.d.ts
├── next.config.ts
├── nodejs
│   ├── package-lock.json
│   └── package.json
├── package-lock.json
├── package.json
├── pages
│   └── api
│       ├── dynamodb
│       │   └── [table]
│       │       └── [operation].ts
│       ├── lambda
│       │   ├── analysis.ts
│       │   └── geocoding.ts
│       └── s3
│           ├── delete.ts
│           ├── download-url.ts
│           ├── list.ts
│           └── upload-url.ts
├── pnpm-lock.yaml
├── postcss.config.mjs
├── saas-starter
│   ├── AWSCLIV2.pkg
│   ├── IMPLEMENTATION_PLAN.md
│   ├── LICENSE
│   ├── README.md
│   ├── app
│   │   ├── (dashboard)
│   │   │   ├── dashboard
│   │   │   │   ├── activity
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── general
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── invite-team.tsx
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── security
│   │   │   │   │   └── page.tsx
│   │   │   │   └── settings.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── pricing
│   │   │   │   ├── page.tsx
│   │   │   │   └── submit-button.tsx
│   │   │   └── terminal.tsx
│   │   ├── (login)
│   │   │   ├── actions.ts
│   │   │   ├── login.tsx
│   │   │   ├── sign-in
│   │   │   │   └── page.tsx
│   │   │   └── sign-up
│   │   │       └── page.tsx
│   │   ├── admin
│   │   │   └── aws-status
│   │   │       └── page.tsx
│   │   ├── api
│   │   │   └── stripe
│   │   │       ├── checkout
│   │   │       │   └── route.ts
│   │   │       └── webhook
│   │   │           └── route.ts
│   │   ├── components
│   │   │   ├── AddressGeocoder.tsx
│   │   │   ├── FileManager.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   └── ScenarioList.tsx
│   │   ├── dynamodb-test
│   │   │   └── page.tsx
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── lambda-test
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   └── s3-test
│   │       └── page.tsx
│   ├── auth-test.html
│   ├── cdk
│   │   ├── README.md
│   │   ├── bin
│   │   │   └── cdk.ts
│   │   ├── cdk.json
│   │   ├── cdk.out
│   │   │   ├── asset.93b99e790463ce3ee70210e9b6f6b50834eff40adca1098afaa1863e7299ab0a
│   │   │   │   └── nodejs
│   │   │   │       ├── package-lock.json
│   │   │   │       ├── package.json
│   │   │   │       └── utils.js
│   │   │   ├── asset.a032dfd67de037d3a53c1995368f816b90d72faa846a20268163f6c990fd8248
│   │   │   │   └── index.js
│   │   │   ├── asset.b202ce01cf17ae4c180202e39f6e813859ada44fcf1985873aa797c167060277
│   │   │   │   └── nodejs
│   │   │   │       ├── package.json
│   │   │   │       └── utils.js
│   │   │   ├── asset.c55b7419389de4e42b2577f0fb4a827459669f6b1e9c23847651d6e7bfa17d52
│   │   │   │   └── index.js
│   │   │   ├── cdk.out
│   │   │   ├── manifest.json
│   │   │   ├── supply-chain-cog-dev.assets.json
│   │   │   ├── supply-chain-cog-dev.template.json
│   │   │   └── tree.json
│   │   ├── jest.config.js
│   │   ├── lambda
│   │   │   ├── cog-analysis
│   │   │   │   └── index.js
│   │   │   ├── geocoding
│   │   │   │   └── index.js
│   │   │   └── layer
│   │   │       └── nodejs
│   │   │           ├── package-lock.json
│   │   │           ├── package.json
│   │   │           └── utils.js
│   │   ├── lib
│   │   │   ├── infra-stack.ts
│   │   │   ├── lambda
│   │   │   │   └── index.ts
│   │   │   └── storage
│   │   │       ├── dynamodb-tables.ts
│   │   │       └── s3-buckets.ts
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── test
│   │   │   └── infra-stack.test.ts
│   │   └── tsconfig.json
│   ├── cdk.json
│   ├── components
│   │   └── ui
│   │       ├── avatar.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       └── radio-group.tsx
│   ├── components.json
│   ├── docs
│   │   └── existing-architecture.md
│   ├── drizzle.config.ts
│   ├── geocoding-function
│   │   ├── function.zip
│   │   ├── package-lock.json
│   │   └── package.json
│   ├── lambda
│   │   ├── cog-analysis
│   │   │   └── index.js
│   │   ├── geocoding
│   │   │   └── index.js
│   │   └── layer
│   │       └── nodejs
│   │           ├── package.json
│   │           └── utils.js
│   ├── lib
│   │   ├── auth
│   │   │   ├── index.tsx
│   │   │   ├── middleware.ts
│   │   │   └── session.ts
│   │   ├── aws-config.ts
│   │   ├── aws-status.ts
│   │   ├── db
│   │   │   ├── drizzle.ts
│   │   │   ├── migrations
│   │   │   │   ├── 0000_soft_the_anarchist.sql
│   │   │   │   └── meta
│   │   │   │       ├── 0000_snapshot.json
│   │   │   │       └── _journal.json
│   │   │   ├── queries.ts
│   │   │   ├── schema.ts
│   │   │   ├── seed.ts
│   │   │   └── setup.ts
│   │   ├── dynamodb.ts
│   │   ├── lambda.ts
│   │   ├── payments
│   │   │   ├── actions.ts
│   │   │   └── stripe.ts
│   │   ├── s3.ts
│   │   └── utils.ts
│   ├── middleware.ts
│   ├── next.config.ts
│   ├── package-lock.json
│   ├── package.json
│   ├── pages
│   │   └── api
│   │       ├── dynamodb
│   │       │   └── [table]
│   │       │       └── [operation].ts
│   │       ├── lambda
│   │       │   ├── analysis.ts
│   │       │   └── geocoding.ts
│   │       └── s3
│   │           ├── delete.ts
│   │           ├── download-url.ts
│   │           ├── list.ts
│   │           └── upload-url.ts
│   ├── pnpm-lock.yaml
│   ├── postcss.config.mjs
│   └── tsconfig.json
├── tsconfig.json
├── tsconfig.tsbuildinfo
└── ~
    └── supply-chain-consolidation
        └── INVENTORY.md

131 directories, 262 files
