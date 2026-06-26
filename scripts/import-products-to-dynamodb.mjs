import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const __dirname = dirname(fileURLToPath(import.meta.url));
const catalogPath = resolve(__dirname, "product-catalog.json");
const tableName = process.env.TABLE_NAME;
const imageBaseUrl = process.env.PRODUCT_IMAGE_BASE_URL;

if (!tableName) {
  throw new Error("TABLE_NAME is required.");
}

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));

if (!Array.isArray(catalog)) {
  throw new Error("Product catalog must be an array.");
}

const toImageUrl = (imagePath) => {
  if (!imageBaseUrl) {
    return imagePath;
  }

  return `${imageBaseUrl.replace(/\/$/, "")}/${imagePath.replace(/^\//, "")}`;
};

const now = new Date().toISOString();
const items = catalog.map((product) => ({
  PK: `PRODUCT#${product.id}`,
  SK: "METADATA",
  id: product.id,
  name: product.name,
  brand: product.brand,
  type: product.type,
  price: product.price,
  imageUrl: toImageUrl(product.imagePath),
  description: product.description,
  createdAt: now,
  updatedAt: now,
}));

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const writeBatch = async (requests) => {
  let requestItems = {
    [tableName]: requests,
  };

  do {
    const result = await client.send(
      new BatchWriteCommand({
        RequestItems: requestItems,
      })
    );

    requestItems = result.UnprocessedItems ?? {};
  } while (Object.keys(requestItems).length > 0);
};

for (let index = 0; index < items.length; index += 25) {
  const chunk = items.slice(index, index + 25);
  const requests = chunk.map((Item) => ({
    PutRequest: {
      Item,
    },
  }));

  await writeBatch(requests);
}

console.log(`Imported ${items.length} products into ${tableName}.`);
