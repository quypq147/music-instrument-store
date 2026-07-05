[ENG](/README.md) [VN](/README_VI.md)

# Music Instrument Store - AWS Serverless Platform

An e-commerce platform for musical instruments built with **Next.js** and a target **AWS Serverless** architecture. The system is designed for scalability, secure Stripe payments, event-driven processing, observability, and an integrated AI chatbot.

## The Team

The project is designed for a 5-person team:

1. **[Member 1 Name]** - Team Lead / Solution Architect
2. **[Member 2 Name]** - Frontend Developer (Next.js / UI)
3. **[Member 3 Name]** - Backend / AWS Serverless Developer
4. **[Member 4 Name]** - Database & Data Engineer (DynamoDB / S3)
5. **[Member 5 Name]** - DevOps & QA / Security (Amplify / WAF / IAM)

## Overview

Music Instrument Store is an e-commerce project for selling saxophones and accessories. The working application is a Next.js web app in `frontend` with product browsing, search and filtering, product details, cart flow, order pages, admin page, login and register pages, and an AI chat endpoint.

The repository also includes backend and infrastructure folders for the target serverless architecture:

- `services/product-api` implements API Gateway Lambda handlers for product reads from DynamoDB.
- `services/order-processing` implements an SQS Lambda handler for persisting pending orders in DynamoDB.
- `services/payment-webhook` implements a Stripe webhook Lambda handler that publishes payment events to EventBridge.
- `infrastructure/` contains an AWS CDK skeleton, including a SecurityStack for storing Stripe credentials in AWS Secrets Manager.

## Tech Stack

- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS.
- **Hosting & CI/CD:** AWS Amplify.
- **Authentication:** Amazon Cognito, JWT, protected routes.
- **Database & Storage:** Amazon DynamoDB, Amazon S3.
- **Payment:** Stripe, Idempotency-Key, webhook validation.
- **Messaging & Event-driven:** Amazon SQS, DLQ, Amazon EventBridge.
- **AI/Bot:** Amazon Lex and the current OpenAI-powered chatbot API.
- **Security & Observability:** AWS WAF, GuardDuty, CloudWatch, CloudTrail, X-Ray, AWS Backup.

## Current Implementation

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS.
- Product catalog: static product data and local image assets.
- Cart: client-side cart context.
- Chatbot API: Next.js route handler using the OpenAI API.
- Product API Lambda: `GET /products` and `GET /products/{id}` backed by DynamoDB SDK v3.
- Order processing Lambda: SQS event handler that stores pending order records in DynamoDB.
- Payment webhook Lambda: Stripe checkout completion handler that publishes `PaymentSucceeded` events to EventBridge.
- Infrastructure: partial AWS CDK skeleton under `infrastructure`.
- Backend services: Node.js Lambda service packages under `services`.
- App location: `frontend`.

## Repository Structure

```text
music-instrument-store/
|-- package.json                     # npm workspace root
|-- package-lock.json                # workspace lockfile
|-- frontend/                        # Next.js frontend app
|       |-- app/                     # App Router pages, API routes, components, context
|       |-- public/                  # Product images and static assets
|       |-- package.json
|       `-- README.md
|-- infrastructure/
|   |-- bin/
|   |   `-- app.ts                   # CDK app entrypoint
|   |-- package.json
|   `-- lib/
|       |-- edge-stack.ts            # Placeholder edge stack
|       `-- security-stack.ts        # CDK stack for Stripe secrets
|-- packages/
|   |-- db-models/                   # Shared DynamoDB record models
|   `-- shared-types/                # Shared TypeScript interfaces
|-- services/
|   |-- chatbot-backend/             # Chatbot Lambda package
|   |-- notification/                # Notification Lambda package
|   |-- order-processing/            # SQS order processing Lambda
|   |-- payment-webhook/             # Stripe webhook Lambda
|   `-- product-api/                 # Product API Gateway Lambda
|-- LICENSE
|-- README_ENG.md
`-- README_VI.md
```

## Getting Started

Requirements:

- Node.js 20 or newer
- npm

Clone the repository:

```bash
git clone https://github.com/Thien-132/music-instrument-store.git
cd music-instrument-store
git checkout dev
```

Install workspace dependencies from the repository root:

```bash
npm install
```

Create a local environment file when using the chatbot:

```bash
OPENAI_API_KEY=your_openai_api_key
```

Save it as:

```text
frontend/.env.local
```

If AWS, Cognito, or Stripe features are enabled, add the related environment variables:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID=
```

Run the web development server:

```bash
npm run dev:web
```

Open:

```text
http://localhost:3000
```

## Available Scripts

Run from the repository root:

```bash
npm run dev:web
npm run build
npm run lint
```

Run from `frontend` when working only on the frontend:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Backend Services

The implemented Lambda entrypoints are:

- `services/product-api/index.ts`
  - API Gateway proxy handler.
  - `GET /products` scans DynamoDB for records whose `pk` begins with `PRODUCT#`.
  - `GET /products/{id}` queries DynamoDB for `pk = PRODUCT#{id}`.
  - Required environment variable: `TABLE_NAME`.
- `services/order-processing/index.ts`
  - SQS handler using `SQSHandler` from `aws-lambda`.
  - Parses each SQS record body as an order payload.
  - Writes pending order records to DynamoDB with `pk = ORDER#{id}` and `sk = STATUS#PENDING`.
  - Required environment variable: `TABLE_NAME`.
- `services/payment-webhook/index.ts`
  - API Gateway proxy handler for `POST /webhooks/stripe`.
  - Includes a placeholder for Stripe signature verification.
  - Publishes `checkout.session.completed` payloads to EventBridge with source `com.musicstore.payment` and detail type `PaymentSucceeded`.
  - Required environment variables: `EVENT_BUS_NAME`, `STRIPE_WEBHOOK_SECRET`.

## Key Routes

- `/` - home page, categories, brands, product highlights, search and filter controls.
- `/products` - product listing and search results.
- `/product/[id]` - product detail page.
- `/cart` - cart page.
- `/orders` - order page.
- `/login` - login page.
- `/register` - register page.
- `/admin` - admin page.
- `/api/chat` - chatbot API endpoint.

## Contribution Guidelines

To reduce conflicts while 5 people work in the same repository, use this workflow:

1. `main` is the production-ready branch. It only receives merges from the `staging` branch.
2. `staging` is the pre-release / staging branch, used for integration and User Acceptance Testing (UAT) before deploying to production. It only receives merges from the `dev` branch.
3. `dev` is the team integration branch for the development environment.
4. Create each task branch from `dev`, for example `feature/cognito-auth` or `feature/stripe-checkout`.
5. Write clear commit messages adhering to Conventional Commits, for example `feat: add cognito auth` or `fix: stripe webhook bug`.
6. Push your branch to GitHub and open a Pull Request against `dev`.
7. Require at least 1 peer review before merging into `dev`.
8. Once changes are stable on the dev environment, open a Pull Request to merge `dev` into `staging` for testing.
9. After successful verification and acceptance testing on staging, merge `staging` into `main` to release to production.
10. Update architecture documentation or ADRs when infrastructure changes are made.

Workflow diagram:
```mermaid
gitGraph
  commit id: "Initial Commit"
  branch dev
  checkout dev
  commit id: "Dev Baseline"
  branch feature/auth
  checkout feature/auth
  commit id: "feat: login UI"
  commit id: "feat: cognito integration"
  checkout dev
  merge feature/auth id: "Merge PR"
  branch staging
  checkout staging
  merge dev id: "UAT testing"
  checkout main
  merge staging id: "Release 1.0.0"
```

Recommended GitHub settings:

- Protect `main`, `staging`, and `dev`.
- Require pull request approval before merging.
- Require CI/CD checks such as lint, tests, or AWS Amplify build.

## Target Serverless Architecture

The planned production architecture includes:

- Route 53 and AWS WAF for DNS, edge protection, managed rules, and rate limiting.
- AWS Amplify for hosting the Next.js frontend.
- Amazon Cognito for registration, login, JWT issuance, and protected routes.
- API Gateway with Cognito Authorizer for backend APIs.
- Lambda services for products, orders, checkout, chatbot, and notifications.
- DynamoDB for catalog, orders, payment references, event processing, and metadata.
- S3 for private product image storage.
- SQS queues and DLQs for order and notification processing.
- EventBridge for event-driven flows such as `order.placed` and `payment.succeeded`.
- Stripe for payment intent creation, webhook verification, and idempotent checkout.
- Amazon Lex as the target chatbot engine.
- CloudWatch, CloudTrail, X-Ray, and GuardDuty for logs, audit, tracing, alarms, and threat detection.
- AWS Backup for DynamoDB backup and restore procedures.

## Deployment

For details on how to deploy the Next.js frontend to AWS Amplify Hosting, please refer to:
*   [AWS Amplify Deployment Guide (Vietnamese)](file:///E:/Project/repo/music-instrument-store/docs/huong_dan_trien_khai_amplify.md)

## Roadmap

- Replace static catalog data with a Product Service backed by DynamoDB and S3.
- Add Cognito authentication and route protection.
- Add API Gateway and Lambda services for products, orders, checkout, chatbot, and notifications.
- Integrate Stripe payment intent and webhook flows with idempotency.
- Add SQS, DLQ, and EventBridge for asynchronous order and notification processing.
- Expand Infrastructure as Code for AWS resources.
- Add CI/CD pipelines, smoke tests, dashboards, alarms, tracing, backup, and runbooks.

