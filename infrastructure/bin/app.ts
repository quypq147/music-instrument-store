#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SecurityStack } from '../lib/security-stack';
import { DatabaseStack } from '../lib/database-stack';
import { AuthStack } from '../lib/auth-stack';
import { BackendStack } from '../lib/backend-stack';

const app = new cdk.App();

// Resolve the deployment environment from CDK context, defaulting to dev.
const envName = app.node.tryGetContext('env') || 'dev';

// Khởi tạo các Stacks
new SecurityStack(app, `MusicStoreSecurityStack-${envName}`);

const databaseStack = new DatabaseStack(app, `MusicStoreDatabaseStack-${envName}`);

const authStack = new AuthStack(app, `MusicStoreAuthStack-${envName}`);

new BackendStack(app, `MusicStoreBackendStack-${envName}`, {
  productsTable: databaseStack.mainTable,
  userPool: authStack.userPool,
});

app.synth();
