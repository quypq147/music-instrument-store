const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");
const {
  DynamoDBClient,
} = require("@aws-sdk/client-dynamodb") as typeof import("@aws-sdk/client-dynamodb");
const {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} = require("@aws-sdk/lib-dynamodb") as typeof import("@aws-sdk/lib-dynamodb");

type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  imageUrl: string;
  description: string;
};

type ProductSeed = Omit<Product, "imageUrl"> & {
  imagePath: string;
  type: string;
};

type BatchWriteRequest = {
  PutRequest: {
    Item: Record<string, unknown>;
  };
};

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

const tableName = process.env.PRODUCTS_TABLE_NAME ?? process.env.TABLE_NAME;
const awsRegion = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION;
const imageBaseUrl = process.env.PRODUCT_IMAGE_BASE_URL;

const products: ProductSeed[] = [
  {
    id: "1",
    name: "Yamaha YAS-280",
    brand: "Yamaha",
    type: "Alto Saxophone",
    price: 35800000,
    imagePath: "/images/yamaha-yas280.jpg",
    description:
      "Student alto saxophone with reliable intonation, light key action, and a clear Yamaha tone.",
  },
  {
    id: "2",
    name: "Selmer AS500",
    brand: "Selmer",
    type: "Alto Saxophone",
    price: 51000000,
    imagePath: "/images/selmer-as500.jpg",
    description:
      "Warm alto saxophone for advancing players who need dependable response and strong projection.",
  },
  {
    id: "3",
    name: "Conn AS650",
    brand: "Conn",
    type: "Alto Saxophone",
    price: 12000000,
    imagePath: "/images/conn-as650.jpg",
    description:
      "Affordable alto saxophone with sturdy construction for beginner lessons and daily practice.",
  },
  {
    id: "4",
    name: "Yamaha YTS-280",
    brand: "Yamaha",
    type: "Tenor Saxophone",
    price: 42000000,
    imagePath: "/images/yamaha-yts280.jpg",
    description:
      "Tenor saxophone with balanced resistance, durable build quality, and comfortable ergonomics.",
  },
  {
    id: "5",
    name: "Selmer TS400",
    brand: "Selmer",
    type: "Tenor Saxophone",
    price: 58000000,
    imagePath: "/images/selmer-ts400.jpg",
    description:
      "Expressive tenor saxophone with a focused sound and smooth mechanism for developing musicians.",
  },
  {
    id: "6",
    name: "Jupiter JTS700",
    brand: "Jupiter",
    type: "Tenor Saxophone",
    price: 35000000,
    imagePath: "/images/jupiter-jts700.jpg",
    description:
      "Reliable tenor saxophone suited for school bands, ensemble rehearsals, and stage performance.",
  },
  {
    id: "7",
    name: "Yamaha YSS-475",
    brand: "Yamaha",
    type: "Soprano Saxophone",
    price: 56000000,
    imagePath: "/images/yamaha-yss475.jpg",
    description:
      "Intermediate soprano saxophone with refined response, clean projection, and stable pitch.",
  },
  {
    id: "8",
    name: "Yanagisawa S901",
    brand: "Yanagisawa",
    type: "Soprano Saxophone",
    price: 72000000,
    imagePath: "/images/yanagisawa-s901.jpg",
    description:
      "Premium soprano saxophone with precise intonation and a flexible, expressive tone.",
  },
  {
    id: "9",
    name: "Jupiter JAS700",
    brand: "Jupiter",
    type: "Alto Saxophone",
    price: 31000000,
    imagePath: "/images/jupiter-jas700.jpg",
    description:
      "Student-friendly alto saxophone with sturdy keywork and an even tone across registers.",
  },
  {
    id: "10",
    name: "Yanagisawa AWO1",
    brand: "Yanagisawa",
    type: "Alto Saxophone",
    price: 68000000,
    imagePath: "/images/yanagisawa-awo1.jpg",
    description:
      "Professional alto saxophone with precise response, rich tonal color, and premium build quality.",
  },
];

const toImageUrl = (imagePath: string) => {
  if (!imageBaseUrl) {
    return imagePath;
  }

  return `${imageBaseUrl.replace(/\/$/, "")}/${imagePath.replace(/^\//, "")}`;
};

const chunkItems = <T>(items: T[], size: number) => {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

const writeBatch = async (
  client: import("@aws-sdk/lib-dynamodb").DynamoDBDocumentClient,
  requests: BatchWriteRequest[]
) => {
  let requestItems: Record<string, BatchWriteRequest[]> = {
    [tableName]: requests,
  };

  do {
    const result = await client.send(
      new BatchWriteCommand({
        RequestItems: requestItems,
      })
    );

    requestItems =
      (result.UnprocessedItems as Record<string, BatchWriteRequest[]>) ?? {};
  } while (Object.keys(requestItems).length > 0);
};

const seedProducts = async () => {
  if (!tableName) {
    throw new Error("PRODUCTS_TABLE_NAME or TABLE_NAME is required.");
  }

  if (!awsRegion) {
    throw new Error("AWS_REGION or AWS_DEFAULT_REGION is required.");
  }

  const now = new Date().toISOString();
  const items = products.map((product) => ({
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

  const client = DynamoDBDocumentClient.from(
    new DynamoDBClient({ region: awsRegion })
  );

  console.log(`Seeding ${items.length} products into ${tableName}...`);

  for (const chunk of chunkItems(items, 25)) {
    await writeBatch(
      client,
      chunk.map((Item) => ({
        PutRequest: {
          Item,
        },
      }))
    );
  }

  console.log(`Successfully seeded ${items.length} products into ${tableName}.`);
};

seedProducts().catch((error) => {
  console.error(
    `Failed to seed products: ${
      error instanceof Error ? error.message : String(error)
    }`
  );
  process.exit(1);
});

export {};
