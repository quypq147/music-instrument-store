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

// Cho phép khai báo nhiều callback/logout URL cùng lúc (VD: vừa localhost cho dev,
// vừa domain production) bằng cách phân tách các URL bằng dấu phẩy trong 1 biến env.
const parseUrlList = (value: string | undefined): string[] | undefined => {
  if (!value) return undefined;
  const urls = value.split(",").map((url) => url.trim()).filter(Boolean);
  return urls.length > 0 ? urls : undefined;
};

const app = new cdk.App();

// Resolve the deployment environment from CDK context, defaulting to dev.
const envName = app.node.tryGetContext('env') || 'dev';

// Khởi tạo các Stacks
const securityStack = new SecurityStack(app, `MusicStoreSecurityStack-${envName}`);

const databaseStack = new DatabaseStack(app, `MusicStoreDatabaseStack-${envName}`);

const authStack = new AuthStack(app, `MusicStoreAuthStack-${envName}`, {
  productsTable: databaseStack.mainTable,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  facebookClientId: process.env.FACEBOOK_CLIENT_ID,
  facebookClientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  cognitoDomainPrefix: process.env.COGNITO_DOMAIN_PREFIX,
  callbackUrls: parseUrlList(process.env.NEXT_PUBLIC_OAUTH_REDIRECT_SIGN_IN),
  logoutUrls: parseUrlList(process.env.NEXT_PUBLIC_OAUTH_REDIRECT_SIGN_OUT),
});

new BackendStack(app, `MusicStoreBackendStack-${envName}`, {
  productsTable: databaseStack.mainTable,
  productsBucket: databaseStack.productsBucket,
  userPool: authStack.userPool,
  stripeSecrets: securityStack.stripeSecrets,
});

app.synth();
