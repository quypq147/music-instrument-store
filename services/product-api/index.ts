import type { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

type ProductItem = {
  PK?: string;
  SK?: string;
  id: string;
  name: string;
  brand: string;
  type?: string;
  price: number;
  imageUrl: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
};

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const tableName = process.env.TABLE_NAME;

const jsonResponse = (
  statusCode: number,
  body: unknown
): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

const stripTableKeys = (item: ProductItem) => {
  const { PK, SK, createdAt, updatedAt, ...product } = item;

  return product;
};

const getProductId = (path?: string, pathId?: string): string | undefined => {
  if (pathId) {
    return decodeURIComponent(pathId);
  }

  const match = path?.match(/^\/products\/([^/]+)$/);

  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
};

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (!tableName) {
      throw new Error("TABLE_NAME environment variable is not set");
    }

    if (event.httpMethod !== "GET") {
      return jsonResponse(405, { message: "Method Not Allowed" });
    }

    const productId = getProductId(event.path, event.pathParameters?.id);

    if (productId) {
      const result = await dynamoDb.send(
        new GetCommand({
          TableName: tableName,
          Key: {
            PK: `PRODUCT#${productId}`,
            SK: "METADATA",
          },
        })
      );

      if (!result.Item) {
        return jsonResponse(404, { message: "Product not found" });
      }

      return jsonResponse(200, {
        product: stripTableKeys(result.Item as ProductItem),
      });
    }

    const result = await dynamoDb.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: "begins_with(#pk, :productPrefix)",
        ExpressionAttributeNames: {
          "#pk": "PK",
        },
        ExpressionAttributeValues: {
          ":productPrefix": "PRODUCT#",
        },
      })
    );

    const products = (result.Items ?? [])
      .map((item) => stripTableKeys(item as ProductItem))
      .sort((a, b) => Number(a.id) - Number(b.id));

    return jsonResponse(200, products);
  } catch (error) {
    console.error("Product API handler failed", {
      error,
      requestId: event.requestContext.requestId,
      path: event.path,
      method: event.httpMethod,
    });

    return jsonResponse(500, { message: "Internal Server Error" });
  }
};
