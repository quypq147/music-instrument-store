const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");
const {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} = require("@aws-sdk/client-cognito-identity-provider") as typeof import("@aws-sdk/client-cognito-identity-provider");
const {
  DynamoDBClient,
} = require("@aws-sdk/client-dynamodb") as typeof import("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
} = require("@aws-sdk/lib-dynamodb") as typeof import("@aws-sdk/lib-dynamodb");

// Backfill 1 lần: tạo bản ghi PROFILE trong DynamoDB cho những user Cognito đã tồn tại
// từ trước khi có Post-Confirmation trigger (bao gồm 3 tài khoản mẫu admin/staff/customer
// và mọi user đăng ký trước thời điểm trigger được deploy).
// Không ghi đè user đã có PROFILE (dùng attribute_not_exists(PK)).

const repoRoot = path.resolve(__dirname, "..");
const envFiles = [
  path.join(repoRoot, ".env.local"),
  path.join(repoRoot, "frontend", ".env.local"),
];

const loadEnvFile = (filePath: string) => {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").replace(/^["']|["']$/g, "");

    process.env[key] ??= value;
  }
};

envFiles.forEach(loadEnvFile);

const tableName = (process.env.PRODUCTS_TABLE_NAME ?? process.env.TABLE_NAME) as string;
const userPoolId = (process.env.COGNITO_USER_POOL_ID ?? process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID) as string;
const awsRegion = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION;

if (!tableName) {
  throw new Error("PRODUCTS_TABLE_NAME or TABLE_NAME is required.");
}

if (!userPoolId) {
  throw new Error("COGNITO_USER_POOL_ID or NEXT_PUBLIC_COGNITO_USER_POOL_ID is required.");
}

const cognitoClient = new CognitoIdentityProviderClient({ region: awsRegion });
const ddbDocClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: awsRegion }));

const getAttr = (attributes: { Name?: string; Value?: string }[] | undefined, name: string) =>
  attributes?.find((attr) => attr.Name === name)?.Value ?? "";

async function main() {
  let paginationToken: string | undefined;
  let scanned = 0;
  let created = 0;
  let skipped = 0;

  do {
    const result = await cognitoClient.send(
      new ListUsersCommand({
        UserPoolId: userPoolId,
        PaginationToken: paginationToken,
      })
    );

    for (const user of result.Users ?? []) {
      scanned += 1;
      const userId = getAttr(user.Attributes, "sub");
      if (!userId) {
        continue;
      }

      const now = new Date().toISOString();
      const email = getAttr(user.Attributes, "email");
      const name = getAttr(user.Attributes, "name") || email.split("@")[0] || "";

      try {
        await ddbDocClient.send(
          new PutCommand({
            TableName: tableName,
            Item: {
              PK: `USER#${userId}`,
              SK: "PROFILE",
              userId,
              email,
              name,
              phone: getAttr(user.Attributes, "phone_number"),
              address: "",
              updatedAt: now,
            },
            ConditionExpression: "attribute_not_exists(PK)",
          })
        );
        created += 1;
        console.log(`Created profile for ${getAttr(user.Attributes, "email") || userId}`);
      } catch (error: any) {
        if (error.name === "ConditionalCheckFailedException") {
          skipped += 1;
        } else {
          throw error;
        }
      }
    }

    paginationToken = result.PaginationToken;
  } while (paginationToken);

  console.log(`Done. Scanned ${scanned} users, created ${created} profiles, skipped ${skipped} (already had a profile).`);
}

main().catch((error) => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
