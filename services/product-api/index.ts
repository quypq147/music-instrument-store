import type { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  ScanCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
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
  averageRating?: number;
  ratingCount?: number;
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
    "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

const stripTableKeys = (item: any) => {
  if (!item) return item;
  const { PK, SK, pk, sk, createdAt, updatedAt, ...rest } = item;
  return rest;
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

    if (event.httpMethod === "OPTIONS") {
      return jsonResponse(204, {});
    }

    const resource = event.resource;
    const method = event.httpMethod;

    // Cognito Auth Claims Helper
    const authorizer = event.requestContext.authorizer;
    const userId = authorizer?.claims?.sub;
    const email = authorizer?.claims?.email;
    const userName = authorizer?.claims?.name || email || authorizer?.claims?.["cognito:username"] || "User";

    // -------------------------------------------------------------
    // Route: /products/{id}/ratings
    // -------------------------------------------------------------
    if (resource === "/products/{id}/ratings") {
      const productId = getProductId(event.path, event.pathParameters?.id);
      if (!productId) {
        return jsonResponse(400, { message: "Missing product ID" });
      }

      if (method === "GET") {
        const ratingsResult = await dynamoDb.send(
          new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues: {
              ":pk": `PRODUCT#${productId}`,
              ":sk": "RATING#",
            },
          })
        );
        const ratings = (ratingsResult.Items ?? []).map((item) => stripTableKeys(item));
        return jsonResponse(200, ratings);
      }

      if (method === "POST") {
        if (!userId) {
          return jsonResponse(401, { message: "Unauthorized: Đăng nhập để thực hiện đánh giá" });
        }

        // Kiểm tra sản phẩm tồn tại
        const productCheck = await dynamoDb.send(
          new GetCommand({
            TableName: tableName,
            Key: {
              PK: `PRODUCT#${productId}`,
              SK: "METADATA",
            },
          })
        );
        if (!productCheck.Item) {
          return jsonResponse(404, { message: "Sản phẩm không tồn tại" });
        }

        // Kiểm tra xem user đã mua sản phẩm chưa
        const boughtCheck = await dynamoDb.send(
          new GetCommand({
            TableName: tableName,
            Key: {
              PK: `USER#${userId}`,
              SK: `BOUGHT#${productId}`,
            },
          })
        );
        if (!boughtCheck.Item) {
          return jsonResponse(403, {
            message: "Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua hàng thành công.",
          });
        }

        if (!event.body) {
          return jsonResponse(400, { message: "Body không hợp lệ" });
        }

        const body = JSON.parse(event.body);
        const rating = Number(body.rating);
        const comment = body.comment || "";

        if (isNaN(rating) || rating < 1 || rating > 5) {
          return jsonResponse(400, { message: "Số sao đánh giá phải từ 1 đến 5" });
        }

        const now = new Date().toISOString();
        await dynamoDb.send(
          new PutCommand({
            TableName: tableName,
            Item: {
              PK: `PRODUCT#${productId}`,
              SK: `RATING#${userId}`,
              rating,
              comment,
              userId,
              userName,
              createdAt: now,
            },
          })
        );

        return jsonResponse(201, { message: "Đánh giá sản phẩm thành công!" });
      }
    }

    // -------------------------------------------------------------
    // Route: /products/{id}/comments
    // -------------------------------------------------------------
    if (resource === "/products/{id}/comments") {
      const productId = getProductId(event.path, event.pathParameters?.id);
      if (!productId) {
        return jsonResponse(400, { message: "Missing product ID" });
      }

      if (method === "GET") {
        const commentsResult = await dynamoDb.send(
          new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues: {
              ":pk": `PRODUCT#${productId}`,
              ":sk": "COMMENT#",
            },
          })
        );
        const comments = (commentsResult.Items ?? []).map((item) => stripTableKeys(item));
        return jsonResponse(200, comments);
      }

      if (method === "POST") {
        if (!userId) {
          return jsonResponse(401, { message: "Unauthorized: Đăng nhập để bình luận" });
        }

        // Kiểm tra sản phẩm tồn tại
        const productCheck = await dynamoDb.send(
          new GetCommand({
            TableName: tableName,
            Key: {
              PK: `PRODUCT#${productId}`,
              SK: "METADATA",
            },
          })
        );
        if (!productCheck.Item) {
          return jsonResponse(404, { message: "Sản phẩm không tồn tại" });
        }

        if (!event.body) {
          return jsonResponse(400, { message: "Body không hợp lệ" });
        }

        const body = JSON.parse(event.body);
        const content = body.content;

        if (!content || typeof content !== "string" || !content.trim()) {
          return jsonResponse(400, { message: "Nội dung bình luận không được để trống" });
        }

        const now = new Date().toISOString();
        const commentId = `comment_${Date.now()}_${userId.slice(0, 6)}`;
        await dynamoDb.send(
          new PutCommand({
            TableName: tableName,
            Item: {
              PK: `PRODUCT#${productId}`,
              SK: `COMMENT#${commentId}`,
              commentId,
              content,
              userId,
              userName,
              createdAt: now,
            },
          })
        );

        return jsonResponse(201, { message: "Gửi bình luận thành công!" });
      }
    }

    // -------------------------------------------------------------
    // Route: /users/profile
    // -------------------------------------------------------------
    if (resource === "/users/profile") {
      if (!userId) {
        return jsonResponse(401, { message: "Unauthorized: Chưa đăng nhập" });
      }

      if (method === "GET") {
        const result = await dynamoDb.send(
          new GetCommand({
            TableName: tableName,
            Key: {
              PK: `USER#${userId}`,
              SK: "PROFILE",
            },
          })
        );

        if (!result.Item) {
          // Trả về profile mặc định nếu chưa khởi tạo
          return jsonResponse(200, {
            profile: {
              userId,
              email: email || "",
              name: userName !== "User" ? userName : "",
              phone: "",
              address: "",
            },
          });
        }

        return jsonResponse(200, { profile: stripTableKeys(result.Item) });
      }

      if (method === "PUT") {
        if (!event.body) {
          return jsonResponse(400, { message: "Missing body" });
        }

        const body = JSON.parse(event.body);
        const now = new Date().toISOString();

        const updatedProfile = {
          PK: `USER#${userId}`,
          SK: "PROFILE",
          userId,
          email: email || body.email || "",
          name: body.name || "",
          phone: body.phone || "",
          address: body.address || "",
          updatedAt: now,
        };

        await dynamoDb.send(
          new PutCommand({
            TableName: tableName,
            Item: updatedProfile,
          })
        );

        return jsonResponse(200, { profile: stripTableKeys(updatedProfile) });
      }
    }

    // -------------------------------------------------------------
    // Route: /users/wishlist
    // -------------------------------------------------------------
    if (resource === "/users/wishlist") {
      if (!userId) {
        return jsonResponse(401, { message: "Unauthorized" });
      }

      if (method === "GET") {
        const result = await dynamoDb.send(
          new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues: {
              ":pk": `USER#${userId}`,
              ":sk": "WISHLIST#",
            },
          })
        );
        const wishlist = (result.Items ?? []).map((item) => stripTableKeys(item));
        return jsonResponse(200, wishlist);
      }

      if (method === "POST") {
        if (!event.body) {
          return jsonResponse(400, { message: "Missing body" });
        }

        const body = JSON.parse(event.body);
        const { productId } = body;

        if (!productId) {
          return jsonResponse(400, { message: "productId is required" });
        }

        // Lấy thông tin sản phẩm để lưu vào wishlist
        const productRes = await dynamoDb.send(
          new GetCommand({
            TableName: tableName,
            Key: {
              PK: `PRODUCT#${productId}`,
              SK: "METADATA",
            },
          })
        );

        if (!productRes.Item) {
          return jsonResponse(404, { message: "Sản phẩm không tồn tại" });
        }

        const product = productRes.Item as ProductItem;
        const now = new Date().toISOString();

        await dynamoDb.send(
          new PutCommand({
            TableName: tableName,
            Item: {
              PK: `USER#${userId}`,
              SK: `WISHLIST#${productId}`,
              productId,
              name: product.name,
              price: product.price,
              imageUrl: product.imageUrl,
              brand: product.brand,
              type: product.type || "",
              addedAt: now,
            },
          })
        );

        return jsonResponse(201, { message: "Đã thêm sản phẩm vào danh sách yêu thích!" });
      }
    }

    // -------------------------------------------------------------
    // Route: /users/wishlist/{productId}
    // -------------------------------------------------------------
    if (resource === "/users/wishlist/{productId}") {
      if (!userId) {
        return jsonResponse(401, { message: "Unauthorized" });
      }

      if (method === "DELETE") {
        const targetProductId = event.pathParameters?.productId;
        if (!targetProductId) {
          return jsonResponse(400, { message: "Missing productId in path" });
        }

        await dynamoDb.send(
          new DeleteCommand({
            TableName: tableName,
            Key: {
              PK: `USER#${userId}`,
              SK: `WISHLIST#${targetProductId}`,
            },
          })
        );

        return jsonResponse(200, { message: "Đã xóa sản phẩm khỏi danh sách yêu thích" });
      }
    }

    // -------------------------------------------------------------
    // Legacy Product Routes (/products & /products/{id})
    // -------------------------------------------------------------
    const productId = getProductId(event.path, event.pathParameters?.id);

    // 1. GET requests
    if (method === "GET") {
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

        // Tính trung bình rating và số lượt đánh giá
        let averageRating = 0;
        let ratingCount = 0;
        try {
          const ratingsResult = await dynamoDb.send(
            new QueryCommand({
              TableName: tableName,
              KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
              ExpressionAttributeValues: {
                ":pk": `PRODUCT#${productId}`,
                ":sk": "RATING#",
              },
            })
          );
          const ratings = ratingsResult.Items ?? [];
          ratingCount = ratings.length;
          if (ratingCount > 0) {
            const sum = ratings.reduce((acc, r) => acc + (r.rating || 0), 0);
            averageRating = parseFloat((sum / ratingCount).toFixed(1));
          }
        } catch (err) {
          console.error("Failed to fetch ratings for average calculation", err);
        }

        const product = stripTableKeys(result.Item as ProductItem);
        return jsonResponse(200, {
          product: {
            ...product,
            averageRating,
            ratingCount,
          },
        });
      }

      const items: ProductItem[] = [];
      let ExclusiveStartKey: Record<string, unknown> | undefined;

      do {
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
            ExclusiveStartKey,
          })
        );

        items.push(...((result.Items ?? []) as ProductItem[]));
        ExclusiveStartKey = result.LastEvaluatedKey;
      } while (ExclusiveStartKey);

      const products = items
        .map((item) => stripTableKeys(item))
        .sort((a, b) => Number(a.id) - Number(b.id));

      return jsonResponse(200, products);
    }

    // 2. POST request (Create Product)
    if (method === "POST") {
      if (!event.body) {
        return jsonResponse(400, { message: "Invalid request: Missing body" });
      }

      const body = JSON.parse(event.body) as ProductItem;
      const { id, name, brand, type, price, imageUrl, description } = body;

      if (!id || !name || !brand || typeof price !== "number" || !imageUrl || !description) {
        return jsonResponse(400, { message: "Missing required fields" });
      }

      const now = new Date().toISOString();
      const newItem: ProductItem = {
        PK: `PRODUCT#${id}`,
        SK: "METADATA",
        id,
        name,
        brand,
        type,
        price,
        imageUrl,
        description,
        createdAt: now,
        updatedAt: now,
      };

      await dynamoDb.send(
        new PutCommand({
          TableName: tableName,
          Item: newItem,
        })
      );

      return jsonResponse(201, stripTableKeys(newItem));
    }

    // 3. PUT request (Update Product)
    if (method === "PUT") {
      if (!productId) {
        return jsonResponse(400, { message: "Missing product ID in path" });
      }

      if (!event.body) {
        return jsonResponse(400, { message: "Invalid request: Missing body" });
      }

      const body = JSON.parse(event.body) as Partial<ProductItem>;
      
      // Get existing product to update
      const existing = await dynamoDb.send(
        new GetCommand({
          TableName: tableName,
          Key: {
            PK: `PRODUCT#${productId}`,
            SK: "METADATA",
          },
        })
      );

      if (!existing.Item) {
        return jsonResponse(404, { message: "Product not found" });
      }

      const now = new Date().toISOString();
      const updatedItem: ProductItem = {
        ...(existing.Item as ProductItem),
        ...body,
        PK: `PRODUCT#${productId}`,
        SK: "METADATA",
        id: productId,
        updatedAt: now,
      };

      await dynamoDb.send(
        new PutCommand({
          TableName: tableName,
          Item: updatedItem,
        })
      );

      return jsonResponse(200, stripTableKeys(updatedItem));
    }

    // 4. DELETE request (Delete Product)
    if (method === "DELETE") {
      if (!productId) {
        return jsonResponse(400, { message: "Missing product ID in path" });
      }

      await dynamoDb.send(
        new DeleteCommand({
          TableName: tableName,
          Key: {
            PK: `PRODUCT#${productId}`,
            SK: "METADATA",
          },
        })
      );

      return jsonResponse(200, { message: "Product deleted successfully" });
    }

    return jsonResponse(405, { message: "Method Not Allowed" });
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
