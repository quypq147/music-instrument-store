import type { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const tableName = process.env.TABLE_NAME;

const jsonResponse = (
  statusCode: number,
  body: unknown
): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify(body),
});

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

    if (event.resource === "/products" || event.path === "/products") {
      const result = await dynamoDb.send(
        new ScanCommand({
          TableName: tableName,
          FilterExpression: "begins_with(pk, :productPrefix)",
          ExpressionAttributeValues: {
            ":productPrefix": "PRODUCT#",
          },
        })
      );

      return jsonResponse(200, { products: result.Items ?? [] });
    }

    if (productId) {
      const result = await dynamoDb.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: "pk = :pk",
          ExpressionAttributeValues: {
            ":pk": `PRODUCT#${productId}`,
          },
          Limit: 1,
        })
      );

      const product = result.Items?.[0];

      if (!product) {
        return jsonResponse(404, { message: "Product not found" });
      }

      return jsonResponse(200, { product });
    }

    return jsonResponse(404, { message: "Route not found" });
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
