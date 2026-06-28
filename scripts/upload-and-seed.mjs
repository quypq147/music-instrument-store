import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

// Helper to load env variables from .env.local files
const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").replace(/^["']|["']$/g, "");
    process.env[key] ??= value;
  }
};

loadEnvFile(path.join(repoRoot, ".env.local"));
loadEnvFile(path.join(repoRoot, "frontend", ".env.local"));

// Parse cdk-outputs.json
const getCdkConfig = () => {
  const outputsPath = path.join(repoRoot, "frontend", "cdk-outputs.json");
  if (!fs.existsSync(outputsPath)) {
    console.warn("cdk-outputs.json not found in frontend/");
    return {};
  }
  try {
    const outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
    const dbStackKey = Object.keys(outputs).find(key => key.includes("DatabaseStack"));
    if (dbStackKey) {
      const tableName = outputs[dbStackKey].DynamoDBTableName;
      const tableArn = outputs[dbStackKey].ExportsOutputFnGetAttMusicStoreMainTable79B09B43ArnF84EBF26 || "";
      // Extract region from ARN: arn:aws:dynamodb:region:account:table/name
      const region = tableArn.split(":")[3] || "ap-southeast-1";
      return { tableName, region };
    }
  } catch (error) {
    console.error("Error reading cdk-outputs.json:", error);
  }
  return {};
};

const cdkConfig = getCdkConfig();
const tableName = process.env.TABLE_NAME || process.env.PRODUCTS_TABLE_NAME || cdkConfig.tableName;
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || cdkConfig.region || "ap-southeast-1";
const s3BucketName = process.env.S3_BUCKET_NAME;

async function run() {
  if (!s3BucketName) {
    console.error("\n[ERROR] S3_BUCKET_NAME is required. Please set it as an environment variable or define it in your .env.local file.");
    console.error("Example: S3_BUCKET_NAME=my-music-store-bucket node scripts/upload-and-seed.mjs\n");
    process.exit(1);
  }

  if (!tableName) {
    console.error("\n[ERROR] DynamoDB Table Name could not be detected. Make sure you deployed your CDK stacks or set TABLE_NAME environment variable.\n");
    process.exit(1);
  }

  console.log("==========================================");
  console.log(`S3 Bucket:     ${s3BucketName}`);
  console.log(`DynamoDB Table:${tableName}`);
  console.log(`AWS Region:    ${region}`);
  console.log("==========================================\n");

  const imagesDir = path.join(repoRoot, "frontend", "public", "images");
  if (!fs.existsSync(imagesDir)) {
    console.error(`Images directory not found at: ${imagesDir}`);
    process.exit(1);
  }

  // 1. Upload logos to s3://<bucket-name>/logos/
  console.log("Identifying brand logos...");
  const files = fs.readdirSync(imagesDir);
  const logoFiles = files.filter(f => f.toLowerCase().includes("logo.png") || f.toLowerCase().includes("-logo."));
  
  if (logoFiles.length > 0) {
    console.log(`Found ${logoFiles.length} brand logos. Uploading to S3 under 'logos/' folder...`);
    for (const file of logoFiles) {
      const filePath = path.join(imagesDir, file);
      const s3Path = `s3://${s3BucketName}/logos/${file}`;
      console.log(`Uploading ${file} -> ${s3Path}`);
      execSync(`aws s3 cp "${filePath}" "${s3Path}"`, { stdio: "inherit" });
    }
  }

  // 2. Load catalog data
  const catalogPath = path.join(repoRoot, "scripts", "product-catalog.json");
  if (!fs.existsSync(catalogPath)) {
    console.error(`Catalog path not found at: ${catalogPath}`);
    process.exit(1);
  }

  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  if (!Array.isArray(catalog)) {
    console.error("Product catalog must be an array.");
    process.exit(1);
  }

  // 3. Upload product images to s3://<bucket-name>/products/
  console.log("\nUploading product images to S3 under 'products/' folder...");
  const uploadedFiles = new Set();
  
  for (const product of catalog) {
    const originalPath = product.imagePath;
    if (!originalPath) continue;

    // e.g., /images/yamaha-yas280.jpg -> yamaha-yas280.jpg
    const filename = path.basename(originalPath);
    const localPath = path.join(imagesDir, filename);

    if (fs.existsSync(localPath)) {
      if (!uploadedFiles.has(filename)) {
        const s3Path = `s3://${s3BucketName}/products/${filename}`;
        console.log(`Uploading product image: ${filename} -> ${s3Path}`);
        execSync(`aws s3 cp "${localPath}" "${s3Path}"`, { stdio: "inherit" });
        uploadedFiles.add(filename);
      }
    } else {
      console.warn(`[WARNING] Image not found locally: ${localPath}`);
    }

    // Also look for additional images for this product (e.g. yamaha-yas280-2.jpg, yamaha-yas280-3.jpg)
    const baseNameWithoutExt = path.basename(filename, path.extname(filename));
    const ext = path.extname(filename);
    const relatedFiles = files.filter(f => f.startsWith(`${baseNameWithoutExt}-`) && f.endsWith(ext));

    for (const relatedFile of relatedFiles) {
      if (!uploadedFiles.has(relatedFile)) {
        const relatedLocalPath = path.join(imagesDir, relatedFile);
        const s3Path = `s3://${s3BucketName}/products/${relatedFile}`;
        console.log(`Uploading related product image: ${relatedFile} -> ${s3Path}`);
        execSync(`aws s3 cp "${relatedLocalPath}" "${s3Path}"`, { stdio: "inherit" });
        uploadedFiles.add(relatedFile);
      }
    }
  }

  // 4. Seed products into DynamoDB
  console.log("\nSeeding products into DynamoDB table...");
  const now = new Date().toISOString();
  
  const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
  const items = catalog.map((product) => {
    const filename = path.basename(product.imagePath);
    const s3Url = `https://${s3BucketName}.s3.${region}.amazonaws.com/products/${filename}`;
    
    return {
      PK: `PRODUCT#${product.id}`,
      SK: "METADATA",
      id: String(product.id),
      name: product.name,
      brand: product.brand,
      type: product.type,
      price: Number(product.price),
      imageUrl: s3Url,
      description: product.description,
      createdAt: now,
      updatedAt: now,
    };
  });

  const writeBatch = async (requests) => {
    let requestItems = {
      [tableName]: requests,
    };

    do {
      const result = await ddbClient.send(
        new BatchWriteCommand({
          RequestItems: requestItems,
        })
      );

      requestItems = result.UnprocessedItems || {};
    } while (Object.keys(requestItems).length > 0);
  };

  // Batch write in chunks of 25 (DynamoDB limit)
  for (let index = 0; index < items.length; index += 25) {
    const chunk = items.slice(index, index + 25);
    const requests = chunk.map((Item) => ({
      PutRequest: {
        Item,
      },
    }));

    await writeBatch(requests);
  }

  console.log(`\n[SUCCESS] Successfully uploaded images and seeded ${items.length} products into table: ${tableName}.`);
}

run().catch((error) => {
  console.error("Execution failed:", error);
  process.exit(1);
});
