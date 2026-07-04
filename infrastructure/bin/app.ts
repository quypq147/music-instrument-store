import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as fs from 'fs';
import * as path from 'path';
import { SecurityStack } from '../lib/security-stack';
import { DatabaseStack } from '../lib/database-stack';
import { AuthStack } from '../lib/auth-stack';
import { BackendStack } from '../lib/backend-stack';

// Helper to load env variables from .env.local file
const loadEnvFile = (filePath: string) => {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").replace(/^["']|["']$/g, "");
    process.env[key] = value;
  }
};

const envPath = path.resolve(__dirname, "../../frontend/.env.local");
loadEnvFile(envPath);

const app = new cdk.App();

// Resolve the deployment environment from CDK context, defaulting to dev.
const envName = app.node.tryGetContext('env') || 'dev';

// Khởi tạo các Stacks
const securityStack = new SecurityStack(app, `MusicStoreSecurityStack-${envName}`);

const databaseStack = new DatabaseStack(app, `MusicStoreDatabaseStack-${envName}`);

const authStack = new AuthStack(app, `MusicStoreAuthStack-${envName}`);

new BackendStack(app, `MusicStoreBackendStack-${envName}`, {
  productsTable: databaseStack.mainTable,
  productsBucket: databaseStack.productsBucket,
  userPool: authStack.userPool,
  stripeSecrets: securityStack.stripeSecrets,
});

app.synth();
