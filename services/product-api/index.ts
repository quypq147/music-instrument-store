import type { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  ScanCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import AWSXRay from "aws-xray-sdk-core";

AWSXRay.setContextMissingStrategy("LOG_ERROR");
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  ListUsersInGroupCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminDisableProviderForUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { randomUUID } from "node:crypto";
import type { UserProfile } from "@music-store/shared-types";

type ProductItem = {
  PK?: string;
  SK?: string;
  id: string;
  name: string;
  brand: string;
  type?: string;
  price: number;
  imageUrl: string;
  images?: string[];
  description: string;
  createdAt?: string;
  updatedAt?: string;
  averageRating?: number;
  ratingCount?: number;
  viewCount?: number;
  soldCount?: number;
  wishlistCount?: number;
  GSI2PK?: string;
  GSI2SK?: string;
  stock?: number;
};

const dynamoDb = DynamoDBDocumentClient.from(
  AWSXRay.captureAWSv3Client(new DynamoDBClient({}))
);
const tableName = process.env.TABLE_NAME;
const eventBridge = AWSXRay.captureAWSv3Client(new EventBridgeClient({}));
const eventBusName = process.env.EVENT_BUS_NAME;
const s3Client = AWSXRay.captureAWSv3Client(new S3Client({}));
const bucketName = process.env.BUCKET_NAME;
const cognitoClient = AWSXRay.captureAWSv3Client(new CognitoIdentityProviderClient({}));
const userPoolId = process.env.USER_POOL_ID;

// Lấy toàn bộ userId (sub) đang là thành viên của 1 Cognito Group, dùng để hiển thị
// đúng quyền thật (thay vì tin vào field `role` lưu trong DynamoDB có thể bị lệch).
const listGroupUserIds = async (groupName: string): Promise<Set<string>> => {
  const ids = new Set<string>();
  if (!userPoolId) return ids;

  let nextToken: string | undefined;
  do {
    const result = await cognitoClient.send(
      new ListUsersInGroupCommand({
        UserPoolId: userPoolId,
        GroupName: groupName,
        NextToken: nextToken,
      })
    );
    for (const user of result.Users ?? []) {
      const sub = user.Attributes?.find((attr) => attr.Name === "sub")?.Value;
      if (sub) ids.add(sub);
    }
    nextToken = result.NextToken;
  } while (nextToken);

  return ids;
};

// Suy ra nhà cung cấp đăng nhập thật (Google/Facebook) từ "cognito:username" trong JWT — user
// đăng nhập qua Hosted UI OAuth có username dạng "Google_<id>"/"Facebook_<id>", khác với user
// đăng ký email/password thường. Không tốn thêm lệnh gọi Cognito nào vì claim này có sẵn trong
// token do API Gateway Authorizer xác thực.
const deriveFederatedProvider = (
  cognitoUsername: string | undefined
): "Google" | "Facebook" | null => {
  const username = (cognitoUsername || "").toLowerCase();
  if (username.startsWith("google_") || username.startsWith("google")) return "Google";
  if (username.startsWith("facebook_") || username.startsWith("facebook")) return "Facebook";
  return null;
};

// Trạng thái liên kết Google/Facebook thật của tài khoản, đọc từ claim `identities` trong
// JWT — claim này liệt kê mọi identity đã được AdminLinkProviderForUser gắn vào user, kể cả
// khi phiên hiện tại đăng nhập bằng email/password. API Gateway authorizer serialize claim
// này thành chuỗi (có thể là JSON hoặc dạng Java-map "{providerName=Google, ...}") nên dò
// bằng regex thay vì JSON.parse để chịu được cả hai định dạng.
const getLinkedProvidersFromClaims = (
  claims: Record<string, string> | undefined
): { google: boolean; facebook: boolean } => {
  const identities = String(claims?.identities || "");
  return {
    google: /providerName["'\s]*[=:]\s*["']?Google/i.test(identities),
    facebook: /providerName["'\s]*[=:]\s*["']?Facebook/i.test(identities),
  };
};

// Toàn bộ user trong Cognito User Pool (không chỉ user đã có PROFILE trong DynamoDB) —
// dùng để merge vào danh sách admin, tránh trường hợp user bị "biến mất" khỏi trang
// quản trị chỉ vì chưa từng có bản ghi PROFILE (vd. backfill chưa chạy ở môi trường này).
const listAllCognitoUsers = async (): Promise<
  Array<{ userId: string; email: string; name: string; username: string; identitiesStr: string }>
> => {
  const users: Array<{ userId: string; email: string; name: string; username: string; identitiesStr: string }> = [];
  if (!userPoolId) return users;

  let paginationToken: string | undefined;
  do {
    const result = await cognitoClient.send(
      new ListUsersCommand({
        UserPoolId: userPoolId,
        PaginationToken: paginationToken,
      })
    );
    for (const user of result.Users ?? []) {
      const sub = user.Attributes?.find((attr) => attr.Name === "sub")?.Value;
      if (!sub) continue;
      const email = user.Attributes?.find((attr) => attr.Name === "email")?.Value || "";
      const name = user.Attributes?.find((attr) => attr.Name === "name")?.Value || "";
      const username = user.Username || "";
      const identitiesStr = user.Attributes?.find((attr) => attr.Name === "identities")?.Value || "";
      users.push({ userId: sub, email, name, username, identitiesStr });
    }
    paginationToken = result.PaginationToken;
  } while (paginationToken);

  return users;
};

// Đồng bộ Cognito Group thật khi admin đổi vai trò user trong UI, để field `role`
// hiển thị luôn khớp với quyền truy cập thật (thay vì chỉ là 1 field DB rời rạc).
const syncCognitoGroup = async (targetUserId: string, role: string) => {
  if (!userPoolId) return;

  const lookup = await cognitoClient.send(
    new ListUsersCommand({
      UserPoolId: userPoolId,
      Filter: `sub = "${targetUserId}"`,
      Limit: 1,
    })
  );
  const cognitoUsername = lookup.Users?.[0]?.Username;
  if (!cognitoUsername) return;

  const wantsAdmin = role === "Admin";
  const wantsStaff = role === "Staff";

  if (wantsAdmin) {
    await cognitoClient.send(
      new AdminAddUserToGroupCommand({ UserPoolId: userPoolId, Username: cognitoUsername, GroupName: "Admin" })
    );
  } else {
    await cognitoClient.send(
      new AdminRemoveUserFromGroupCommand({ UserPoolId: userPoolId, Username: cognitoUsername, GroupName: "Admin" })
    );
  }

  if (wantsStaff) {
    await cognitoClient.send(
      new AdminAddUserToGroupCommand({ UserPoolId: userPoolId, Username: cognitoUsername, GroupName: "Staff" })
    );
  } else {
    await cognitoClient.send(
      new AdminRemoveUserFromGroupCommand({ UserPoolId: userPoolId, Username: cognitoUsername, GroupName: "Staff" })
    );
  }
};

const REVIEW_IMAGE_ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const REVIEW_IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5MB/ảnh
const REVIEW_IMAGE_MAX_COUNT = 3; // tối đa 3 ảnh/đánh giá

const lambdaClient = AWSXRay.captureAWSv3Client(new LambdaClient({}));
const notificationFunctionName = process.env.NOTIFICATION_FUNCTION_NAME;

// Ngưỡng "thiết bị quen": trùng bậc với thời hạn refresh token mặc định của Cognito (30 ngày) —
// đến lúc refresh token hết hạn, user bắt buộc phải đăng nhập lại thật sự, và lần đó sẽ tự
// kích hoạt lại việc kiểm tra thiết bị, nên khoảng cách tối đa giữa 2 lần xác minh luôn bị chặn.
const DEVICE_TRUST_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
// 5 phút: đủ cho một vòng nhận email + nhập mã, nhưng thu hẹp cửa sổ để mã bị lộ/cũ còn dùng được.
const OTP_TTL_MINUTES = 5;
const OTP_TTL_MS = OTP_TTL_MINUTES * 60 * 1000;
// Giới hạn số lần nhập sai mã OTP trước khi buộc phải đăng nhập lại để nhận mã mới —
// không có giới hạn này thì một JWT hợp lệ (đã bị đánh cắp) có thể dò hết 900.000 mã trong
// 10 phút hiệu lực, làm mất hết tác dụng cảnh báo "thiết bị lạ" của tính năng này.
const MAX_OTP_ATTEMPTS = 5;

const generateOtpCode = (): string => String(Math.floor(100000 + Math.random() * 900000));

// Gửi email OTP bằng cách gọi thẳng (Lambda Invoke) vào handler đồng bộ có sẵn của
// services/notification, thay vì qua EventBridge (bất đồng bộ, độ trễ khó đoán) hoặc qua
// route API Gateway công khai /notifications (hiện chưa nơi nào gọi tới).
const sendOtpEmail = async (email: string, code: string): Promise<void> => {
  if (!notificationFunctionName) {
    throw new Error("NOTIFICATION_FUNCTION_NAME environment variable is not set");
  }

  const payload = {
    httpMethod: "POST",
    body: JSON.stringify({
      type: "EMAIL",
      recipient: email,
      title: "Mã xác minh đăng nhập - Music Instrument Store",
      message: `Mã xác minh thiết bị mới của bạn là: ${code}. Mã có hiệu lực trong ${OTP_TTL_MINUTES} phút. Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.`,
    }),
  };

  const result = await lambdaClient.send(
    new InvokeCommand({
      FunctionName: notificationFunctionName,
      InvocationType: "RequestResponse",
      Payload: Buffer.from(JSON.stringify(payload)),
    })
  );

  if (result.FunctionError) {
    throw new Error(`Notification Lambda returned an error: ${result.FunctionError}`);
  }

  // Handler của notification bắt lỗi bên trong và trả statusCode trong payload (không set
  // FunctionError), nên phải đọc payload để phát hiện email thực chất KHÔNG được gửi
  // (SES lỗi, chưa cấu hình SES_FROM_EMAIL, sandbox chặn người nhận...).
  const responseText = result.Payload ? Buffer.from(result.Payload).toString() : "";
  let response: { statusCode?: number } | undefined;
  try {
    response = responseText ? JSON.parse(responseText) : undefined;
  } catch {
    throw new Error(`Notification Lambda returned an unparseable payload: ${responseText}`);
  }
  if (!response?.statusCode || response.statusCode >= 400) {
    throw new Error(`Notification Lambda reported a failed email delivery: ${responseText}`);
  }
};

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
  const { PK, SK, pk, sk, GSI2PK, GSI2SK, ...rest } = item;
  return rest;
};

const getProductId = (path?: string, pathId?: string): string | undefined => {
  if (pathId) {
    return decodeURIComponent(pathId);
  }
  const match = path?.match(/^\/products\/([^/]+)$/);
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
};

// Trạng thái "đã giao, chờ khách xác nhận" — chỉ khách hàng mới được chuyển tiếp từ đây
// sang trạng thái hoàn tất (COMPLETED_STATUS), qua route /orders/{id}/confirm-receipt.
const DELIVERED_STATUS = "Đã giao hàng";
// Mốc duy nhất xác nhận khách đã thực sự nhận hàng: cộng soldCount + cấp quyền đánh giá (BOUGHT#).
const COMPLETED_STATUS = "Đánh giá";

const applyOrderStatusUpdate = async (
  targetOrderId: string,
  order: Record<string, any>,
  status: string,
  reason: string | undefined,
  changedBy: string
) => {
  const now = new Date().toISOString();

  const updatedOrder = {
    ...order,
    status,
    updatedAt: now,
  };

  // RELEASE RESERVED INVENTORY FOR ONLINE ORDERS WHEN ACTIVATING FROM PENDING
  const isActivating = (order.status === "PENDING" || order.status === "Chờ xác nhận") &&
                        (status === "Chờ lấy đơn" || status === "Đang giao hàng");
  const isOnlinePayment = order.paymentMethod === "VNPay" || order.paymentMethod === "Momo" || order.paymentMethod === "Stripe";

  if (isActivating && isOnlinePayment && Array.isArray(order.items)) {
    for (const item of order.items) {
      const productId = String(item.productId);
      const qty = Number(item.quantity || 1);
      try {
        await dynamoDb.send(
          new UpdateCommand({
            TableName: tableName,
            Key: {
              PK: `PRODUCT#${productId}`,
              SK: "INVENTORY",
            },
            UpdateExpression: "SET reserved = reserved - :qty",
            ExpressionAttributeValues: { ":qty": qty },
          })
        );
        console.log(`[Admin Update] Released reserved inventory for product ${productId} by ${qty}`);
      } catch (reserveErr) {
        console.error(`[Admin Update] Failed to release reserved inventory for ${productId}`, reserveErr);
      }
    }
  }

  await dynamoDb.send(
    new PutCommand({
      TableName: tableName,
      Item: updatedOrder,
    })
  );

  // Ghi lại lịch sử thay đổi trạng thái đơn hàng (audit trail)
  try {
    await dynamoDb.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          PK: `ORDER#${targetOrderId}`,
          SK: `STATUS_HISTORY#${now}`,
          status,
          changedBy,
          reason: reason || "",
          createdAt: now,
        },
      })
    );
  } catch (err) {
    console.error(`Failed to write status history for order ${targetOrderId}`, err);
  }

  // Khi đơn hàng chuyển sang trạng thái hoàn tất lần đầu, cộng dồn soldCount cho từng sản phẩm
  // và cấp quyền đánh giá (BOUGHT#) — đây là mốc duy nhất xác nhận khách đã thực sự nhận hàng.
  if (status === COMPLETED_STATUS && order.status !== COMPLETED_STATUS) {
    const items = Array.isArray(order.items) ? order.items : [];
    for (const item of items) {
      if (!item?.productId || typeof item?.quantity !== "number") continue;
      try {
        await dynamoDb.send(
          new UpdateCommand({
            TableName: tableName,
            Key: {
              PK: `PRODUCT#${item.productId}`,
              SK: "METADATA",
            },
            UpdateExpression: "ADD soldCount :qty",
            ConditionExpression: "attribute_exists(PK)",
            ExpressionAttributeValues: {
              ":qty": item.quantity,
            },
          })
        );
      } catch (err) {
        console.error(`Failed to increment soldCount for product ${item.productId}`, err);
      }

      if (order.userId) {
        try {
          await dynamoDb.send(
            new PutCommand({
              TableName: tableName,
              Item: {
                PK: `USER#${order.userId}`,
                SK: `BOUGHT#${item.productId}`,
                productId: item.productId,
                orderId: targetOrderId,
                purchasedAt: now,
              },
            })
          );
        } catch (err) {
          console.error(`Failed to grant review eligibility for product ${item.productId}`, err);
        }
      }
    }
  }

  // Gửi sự kiện cập nhật trạng thái đơn hàng sang EventBridge để kích hoạt gửi Mail tự động
  if (eventBusName) {
    const isCancellation = status === "Đã hủy";
    const detailType = isCancellation ? "OrderCancelled" : "OrderUpdated";
    try {
      console.log(`Publishing ${detailType} event for order ${targetOrderId} to ${eventBusName}...`);
      await eventBridge.send(
        new PutEventsCommand({
          Entries: [
            {
              EventBusName: eventBusName,
              Source: "com.musicstore.order",
              DetailType: detailType,
              Detail: JSON.stringify({
                eventId: randomUUID(),
                version: "1.0",
                orderId: targetOrderId,
                email: order.email,
                customer: order.customer,
                status: status,
                totalPrice: order.totalPrice,
                ...(isCancellation && {
                  reason: reason || "",
                  cancelledBy: changedBy,
                  items: order.items,
                }),
              }),
            },
          ],
        })
      );
    } catch (err) {
      console.error(`Failed to publish ${detailType} event to EventBridge`, err);
    }
  }

  return updatedOrder;
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
    let userName = authorizer?.claims?.name || email || authorizer?.claims?.["cognito:username"] || "User";

    // Proactively fetch the user's real name from their profile if available
    if (userId) {
      try {
        const userProfile = await dynamoDb.send(
          new GetCommand({
            TableName: tableName,
            Key: {
              PK: `USER#${userId}`,
              SK: "PROFILE",
            },
          })
        );
        if (userProfile.Item?.name) {
          userName = userProfile.Item.name;
        }
      } catch (err) {
        console.warn("Could not fetch user profile name:", err);
      }
    }

    // -------------------------------------------------------------
    // Route: /auth/device/check (kiểm tra thiết bị đã tin cậy hay chưa, gửi OTP nếu chưa)
    // -------------------------------------------------------------
    if (resource === "/auth/device/check" && method === "POST") {
      if (!userId) {
        return jsonResponse(401, { message: "Unauthorized: Chưa đăng nhập" });
      }

      // Bỏ qua xác minh thiết bị lạ cho Admin và Staff
      const groups = authorizer?.claims?.["cognito:groups"] || "";
      const isAdminOrStaff = groups.includes("Admin") || groups.includes("Staff");
      if (isAdminOrStaff) {
        return jsonResponse(200, { trusted: true });
      }
      if (!event.body) {
        return jsonResponse(400, { message: "Missing request body" });
      }

      const { deviceId } = JSON.parse(event.body);
      if (!deviceId) {
        return jsonResponse(400, { message: "Missing deviceId" });
      }

      const deviceRes = await dynamoDb.send(
        new GetCommand({
          TableName: tableName,
          Key: {
            PK: `USER#${userId}`,
            SK: `DEVICE#${deviceId}`,
          },
        })
      );

      const now = Date.now();
      const device = deviceRes.Item;
      const isTrusted =
        !!device &&
        typeof device.lastSeenAt === "string" &&
        now - new Date(device.lastSeenAt).getTime() < DEVICE_TRUST_WINDOW_MS;

      if (isTrusted) {
        await dynamoDb.send(
          new PutCommand({
            TableName: tableName,
            Item: {
              PK: `USER#${userId}`,
              SK: `DEVICE#${deviceId}`,
              deviceId,
              createdAt: device!.createdAt || new Date(now).toISOString(),
              lastSeenAt: new Date(now).toISOString(),
            },
          })
        );
        return jsonResponse(200, { trusted: true });
      }

      if (!email) {
        return jsonResponse(400, { message: "Không xác định được email để gửi mã xác minh" });
      }

      const code = generateOtpCode();
      const expiresAt = new Date(now + OTP_TTL_MS).toISOString();

      // Cố ý: khoá theo user (không theo deviceId) -> mỗi user chỉ có 1 OTP đang chờ tại 1 thời
      // điểm. Nếu 2 thiết bị lạ cùng kích hoạt gần nhau, mã của thiết bị trước sẽ bị ghi đè.
      await dynamoDb.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            PK: `USER#${userId}`,
            SK: "OTP",
            code,
            expiresAt,
            attempts: 0,
            ttl: Math.floor((now + OTP_TTL_MS) / 1000),
          },
        })
      );

      try {
        await sendOtpEmail(email, code);
      } catch (err) {
        console.error("Failed to send device verification OTP email", err);
        return jsonResponse(500, { message: "Không thể gửi mã xác minh, vui lòng thử lại." });
      }

      return jsonResponse(200, { trusted: false });
    }

    // -------------------------------------------------------------
    // Route: /auth/device/verify (xác minh OTP, đánh dấu thiết bị tin cậy)
    // -------------------------------------------------------------
    if (resource === "/auth/device/verify" && method === "POST") {
      if (!userId) {
        return jsonResponse(401, { message: "Unauthorized: Chưa đăng nhập" });
      }

      // Bỏ qua xác minh thiết bị lạ cho Admin và Staff
      const groups = authorizer?.claims?.["cognito:groups"] || "";
      const isAdminOrStaff = groups.includes("Admin") || groups.includes("Staff");
      if (isAdminOrStaff) {
        return jsonResponse(200, { message: "Admin/Staff verified automatically" });
      }
      if (!event.body) {
        return jsonResponse(400, { message: "Missing request body" });
      }

      const { deviceId, code } = JSON.parse(event.body);
      if (!deviceId || !code) {
        return jsonResponse(400, { message: "Missing deviceId or code" });
      }

      const otpRes = await dynamoDb.send(
        new GetCommand({
          TableName: tableName,
          Key: {
            PK: `USER#${userId}`,
            SK: "OTP",
          },
        })
      );

      const otp = otpRes.Item;
      if (!otp || new Date(otp.expiresAt).getTime() < Date.now()) {
        return jsonResponse(400, {
          message: "Mã xác minh đã hết hạn hoặc không tồn tại. Vui lòng đăng nhập lại để nhận mã mới.",
        });
      }

      const attempts = typeof otp.attempts === "number" ? otp.attempts : 0;
      if (attempts >= MAX_OTP_ATTEMPTS) {
        await dynamoDb.send(
          new DeleteCommand({
            TableName: tableName,
            Key: { PK: `USER#${userId}`, SK: "OTP" },
          })
        );
        return jsonResponse(400, {
          message: "Bạn đã nhập sai quá số lần cho phép. Vui lòng đăng nhập lại để nhận mã mới.",
        });
      }

      if (otp.code !== code) {
        // Tăng attempts bằng atomic update (không Get-rồi-Put) để nhiều request dò mã song song
        // không thể ghi đè bộ đếm của nhau và lách qua MAX_OTP_ATTEMPTS.
        await dynamoDb.send(
          new UpdateCommand({
            TableName: tableName,
            Key: { PK: `USER#${userId}`, SK: "OTP" },
            UpdateExpression: "SET attempts = if_not_exists(attempts, :zero) + :one",
            ConditionExpression: "attribute_exists(PK)",
            ExpressionAttributeValues: { ":zero": 0, ":one": 1 },
          })
        );
        return jsonResponse(400, { message: "Mã xác minh không đúng." });
      }

      const nowIso = new Date().toISOString();
      await dynamoDb.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            PK: `USER#${userId}`,
            SK: `DEVICE#${deviceId}`,
            deviceId,
            createdAt: nowIso,
            lastSeenAt: nowIso,
          },
        })
      );

      await dynamoDb.send(
        new DeleteCommand({
          TableName: tableName,
          Key: {
            PK: `USER#${userId}`,
            SK: "OTP",
          },
        })
      );

      return jsonResponse(200, { trusted: true });
    }

    // -------------------------------------------------------------
    // Route: /products/{id}/view
    // -------------------------------------------------------------
    if (resource === "/products/{id}/view" && method === "POST") {
      const productId = getProductId(event.path, event.pathParameters?.id);
      if (!productId) {
        return jsonResponse(400, { message: "Missing product ID" });
      }

      try {
        const result = await dynamoDb.send(
          new UpdateCommand({
            TableName: tableName,
            Key: {
              PK: `PRODUCT#${productId}`,
              SK: "METADATA",
            },
            UpdateExpression: "ADD viewCount :inc",
            ConditionExpression: "attribute_exists(PK)",
            ExpressionAttributeValues: {
              ":inc": 1,
            },
            ReturnValues: "UPDATED_NEW",
          })
        );

        return jsonResponse(200, { viewCount: result.Attributes?.viewCount ?? 0 });
      } catch (err: any) {
        if (err?.name === "ConditionalCheckFailedException") {
          return jsonResponse(404, { message: "Sản phẩm không tồn tại" });
        }
        throw err;
      }
    }

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

        const rawImages = Array.isArray(body.images) ? body.images : [];
        const images = rawImages.filter((url: unknown) => typeof url === "string" && url.trim().length > 0);
        if (images.length > REVIEW_IMAGE_MAX_COUNT) {
          return jsonResponse(400, { message: `Chỉ được đính kèm tối đa ${REVIEW_IMAGE_MAX_COUNT} ảnh` });
        }
        const invalidImage = images.find(
          (url: string) => bucketName && !url.startsWith(`https://${bucketName}.s3.`)
        );
        if (invalidImage) {
          return jsonResponse(400, { message: "Đường dẫn ảnh không hợp lệ" });
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
              images,
              userId,
              userName,
              createdAt: now,
            },
          })
        );

        // Tính lại rating trung bình và ghi cache lên item METADATA của sản phẩm
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
          const newRatingCount = ratings.length;
          const newAverageRating =
            newRatingCount > 0
              ? parseFloat(
                  (ratings.reduce((acc, r) => acc + (r.rating || 0), 0) / newRatingCount).toFixed(1)
                )
              : 0;

          await dynamoDb.send(
            new UpdateCommand({
              TableName: tableName,
              Key: {
                PK: `PRODUCT#${productId}`,
                SK: "METADATA",
              },
              UpdateExpression: "SET averageRating = :avg, ratingCount = :count",
              ExpressionAttributeValues: {
                ":avg": newAverageRating,
                ":count": newRatingCount,
              },
            })
          );
        } catch (err) {
          console.error("Failed to cache average rating on product", err);
        }

        return jsonResponse(201, { message: "Đánh giá sản phẩm thành công!" });
      }
    }

    // -------------------------------------------------------------
    // Route: /products/{id}/ratings/upload-url (sinh presigned POST để đính kèm ảnh đánh giá)
    // -------------------------------------------------------------
    if (resource === "/products/{id}/ratings/upload-url" && method === "POST") {
      if (!userId) {
        return jsonResponse(401, { message: "Unauthorized: Đăng nhập để thực hiện đánh giá" });
      }
      if (!bucketName) {
        return jsonResponse(500, { message: "BUCKET_NAME environment variable is not set" });
      }

      const productId = getProductId(event.path, event.pathParameters?.id);
      if (!productId) {
        return jsonResponse(400, { message: "Missing product ID" });
      }

      // Chỉ khách đã mua (đã nhận hàng) mới được upload ảnh đính kèm đánh giá
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
          message: "Bạn chỉ có thể đính kèm ảnh sau khi đã mua hàng thành công.",
        });
      }

      if (!event.body) {
        return jsonResponse(400, { message: "Missing request body" });
      }

      const { fileType } = JSON.parse(event.body);
      const extension = REVIEW_IMAGE_ALLOWED_TYPES[fileType];
      if (!extension) {
        return jsonResponse(400, {
          message: "Định dạng ảnh không hợp lệ. Chỉ chấp nhận JPEG, PNG hoặc WEBP.",
        });
      }

      const key = `reviews/${productId}/${userId}/${randomUUID()}.${extension}`;

      const { url, fields } = await createPresignedPost(s3Client, {
        Bucket: bucketName,
        Key: key,
        Conditions: [
          ["content-length-range", 1, REVIEW_IMAGE_MAX_BYTES],
          ["eq", "$Content-Type", fileType],
        ],
        Fields: {
          "Content-Type": fileType,
        },
        Expires: 60,
      });

      return jsonResponse(200, {
        uploadUrl: url,
        fields,
        publicUrl: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
        maxSizeBytes: REVIEW_IMAGE_MAX_BYTES,
      });
    }

    // -------------------------------------------------------------
    // Route: /products/{id}/image-upload-url (sinh presigned POST để admin upload ảnh sản phẩm)
    // -------------------------------------------------------------
    if (resource === "/products/{id}/image-upload-url" && method === "POST") {
      const groups = authorizer?.claims?.["cognito:groups"] || "";
      const isStaff = groups.includes("Admin") || groups.includes("Staff");
      if (!isStaff) {
        return jsonResponse(403, { message: "Forbidden: Bạn không có quyền tải ảnh sản phẩm" });
      }
      if (!bucketName) {
        return jsonResponse(500, { message: "BUCKET_NAME environment variable is not set" });
      }

      const productId = getProductId(event.path, event.pathParameters?.id);
      if (!productId) {
        return jsonResponse(400, { message: "Missing product ID" });
      }

      if (!event.body) {
        return jsonResponse(400, { message: "Missing request body" });
      }

      const { fileType } = JSON.parse(event.body);
      const extension = REVIEW_IMAGE_ALLOWED_TYPES[fileType];
      if (!extension) {
        return jsonResponse(400, {
          message: "Định dạng ảnh không hợp lệ. Chỉ chấp nhận JPEG, PNG hoặc WEBP.",
        });
      }

      const key = `products/${productId}/${randomUUID()}.${extension}`;

      const { url, fields } = await createPresignedPost(s3Client, {
        Bucket: bucketName,
        Key: key,
        Conditions: [
          ["content-length-range", 1, REVIEW_IMAGE_MAX_BYTES],
          ["eq", "$Content-Type", fileType],
        ],
        Fields: {
          "Content-Type": fileType,
        },
        Expires: 60,
      });

      return jsonResponse(200, {
        uploadUrl: url,
        fields,
        publicUrl: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
        maxSizeBytes: REVIEW_IMAGE_MAX_BYTES,
      });
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

        // Trạng thái liên kết Google/Facebook lấy từ Cognito thật (claim `identities` — có
        // mặt cả khi phiên hiện tại đăng nhập bằng email/password) cộng với cách đăng nhập
        // của phiên hiện tại, không phụ thuộc cờ googleLinked/facebookLinked lưu thủ công.
        const federatedProvider = deriveFederatedProvider(authorizer?.claims?.["cognito:username"]);
        const linked = getLinkedProvidersFromClaims(authorizer?.claims);
        const googleLinked = linked.google || federatedProvider === "Google";
        const facebookLinked = linked.facebook || federatedProvider === "Facebook";

        if (!result.Item) {
          // Trả về profile mặc định nếu chưa khởi tạo
          return jsonResponse(200, {
            profile: {
              userId,
              email: email || "",
              name: userName !== "User" ? userName : "",
              phone: "",
              address: "",
              avatarUrl: "",
              googleLinked,
              googleEmail: googleLinked ? email || "" : "",
              facebookLinked,
              facebookEmail: facebookLinked ? email || "" : "",
              authProvider: federatedProvider || "Email",
            },
          });
        }

        const profile = stripTableKeys(result.Item) as UserProfile;
        if (googleLinked) {
          profile.googleLinked = true;
          profile.googleEmail = profile.googleEmail || email || "";
        }
        if (facebookLinked) {
          profile.facebookLinked = true;
          profile.facebookEmail = profile.facebookEmail || email || "";
        }
        profile.authProvider = federatedProvider || "Email";

        return jsonResponse(200, { profile });
      }

      if (method === "PUT") {
        if (!event.body) {
          return jsonResponse(400, { message: "Missing body" });
        }

        const body = JSON.parse(event.body);
        const now = new Date().toISOString();

        // Đọc profile hiện có trước khi ghi đè, để một hành động chỉ đổi 1 field (vd. chỉ
        // upload avatar) không xoá mất các field khác chưa gửi kèm trong body lần này.
        const getRes = await dynamoDb.send(
          new GetCommand({
            TableName: tableName,
            Key: {
              PK: `USER#${userId}`,
              SK: "PROFILE",
            },
          })
        );
        const existing = getRes.Item || {};

        // Xem ghi chú ở route GET /users/profile: trạng thái liên kết lấy từ Cognito thật
        // (claim `identities` + cách đăng nhập của phiên hiện tại), không để 1 lần PUT cập
        // nhật field khác (vd. avatar) vô tình ghi đè cờ liên kết về false.
        const federatedProvider = deriveFederatedProvider(authorizer?.claims?.["cognito:username"]);
        const linked = getLinkedProvidersFromClaims(authorizer?.claims);
        const googleLinked = linked.google || federatedProvider === "Google";
        const facebookLinked = linked.facebook || federatedProvider === "Facebook";

        const updatedProfile: UserProfile = {
          userId,
          email: email || body.email || existing.email || "",
          name: body.name ?? existing.name ?? "",
          phone: body.phone ?? existing.phone ?? "",
          address: body.address ?? existing.address ?? "",
          avatarUrl: body.avatarUrl ?? existing.avatarUrl ?? "",
          // Bổ sung thông tin liên kết mạng xã hội
          googleLinked: googleLinked ? true : body.googleLinked ?? existing.googleLinked ?? false,
          facebookLinked: facebookLinked ? true : body.facebookLinked ?? existing.facebookLinked ?? false,
          googleEmail: googleLinked ? (body.googleEmail ?? existing.googleEmail ?? email ?? "") : body.googleEmail ?? existing.googleEmail ?? "",
          facebookEmail: facebookLinked ? (body.facebookEmail ?? existing.facebookEmail ?? email ?? "") : body.facebookEmail ?? existing.facebookEmail ?? "",
          // Chỉ giữ lại role hiện có, KHÔNG đọc từ body — route tự-phục-vụ này không được phép
          // để user tự đổi role của chính mình (chỉ route admin PUT /users/{userId} mới được).
          ...(existing.role ? { role: existing.role } : {}),
          updatedAt: now,
        };

        await dynamoDb.send(
          new PutCommand({
            TableName: tableName,
            Item: {
              PK: `USER#${userId}`,
              SK: "PROFILE",
              ...updatedProfile,
            },
          })
        );

        // authProvider không lưu DB — luôn suy ra lại theo JWT của phiên hiện tại nên chỉ gắn
        // vào response, không đưa vào Item ở PutCommand phía trên.
        return jsonResponse(200, { profile: { ...updatedProfile, authProvider: federatedProvider || "Email" } });
      }
    }

    // -------------------------------------------------------------
    // Route: /users/profile/unlink-provider (hủy liên kết Google/Facebook thật trong Cognito)
    // -------------------------------------------------------------
    if (resource === "/users/profile/unlink-provider" && method === "POST") {
      if (!userId) {
        return jsonResponse(401, { message: "Unauthorized: Chưa đăng nhập" });
      }
      if (!userPoolId) {
        return jsonResponse(500, { message: "USER_POOL_ID environment variable is not set" });
      }

      const provider = event.body ? JSON.parse(event.body).provider : undefined;
      if (provider !== "Google" && provider !== "Facebook") {
        return jsonResponse(400, { message: "Provider không hợp lệ. Chỉ hỗ trợ Google hoặc Facebook." });
      }

      // Không cho hủy liên kết đúng provider đang dùng để đăng nhập phiên hiện tại —
      // nếu gỡ, refresh token của phiên này thành mồ côi và user có thể tự khóa mình
      // khỏi tài khoản (khi chưa từng đặt mật khẩu email).
      const sessionProvider = deriveFederatedProvider(authorizer?.claims?.["cognito:username"]);
      if (sessionProvider === provider) {
        return jsonResponse(400, {
          message: `Bạn đang đăng nhập bằng ${provider} nên không thể hủy liên kết ${provider} trong phiên này.`,
        });
      }

      // Đọc attribute `identities` thật từ Cognito (JSON chuẩn, không như claim đã bị
      // API Gateway serialize) để lấy đúng id của identity cần gỡ.
      const lookup = await cognitoClient.send(
        new ListUsersCommand({
          UserPoolId: userPoolId,
          Filter: `sub = "${userId}"`,
          Limit: 1,
        })
      );
      const cognitoUser = lookup.Users?.[0];
      const identitiesStr = cognitoUser?.Attributes?.find((attr) => attr.Name === "identities")?.Value;
      let identity: { providerName?: string; userId?: string } | undefined;
      try {
        const identities = identitiesStr ? JSON.parse(identitiesStr) : [];
        identity = (identities as Array<{ providerName?: string; userId?: string }>).find(
          (item) => item.providerName === provider
        );
      } catch (parseError) {
        console.error("Failed to parse identities attribute:", parseError);
      }

      if (!identity?.userId) {
        return jsonResponse(404, { message: `Tài khoản chưa liên kết với ${provider}.` });
      }

      await cognitoClient.send(
        new AdminDisableProviderForUserCommand({
          UserPoolId: userPoolId,
          User: {
            ProviderName: provider,
            ProviderAttributeName: "Cognito_Subject",
            ProviderAttributeValue: identity.userId,
          },
        })
      );

      // Đồng bộ cờ hiển thị trong DynamoDB (nếu đã có profile) — trạng thái thật vẫn do
      // Cognito quyết định, cờ này chỉ để các phiên đang mở hiển thị đúng ngay.
      try {
        await dynamoDb.send(
          new UpdateCommand({
            TableName: tableName,
            Key: { PK: `USER#${userId}`, SK: "PROFILE" },
            ConditionExpression: "attribute_exists(PK)",
            UpdateExpression: "SET #linked = :false, #providerEmail = :empty, updatedAt = :now",
            ExpressionAttributeNames: {
              "#linked": provider === "Google" ? "googleLinked" : "facebookLinked",
              "#providerEmail": provider === "Google" ? "googleEmail" : "facebookEmail",
            },
            ExpressionAttributeValues: {
              ":false": false,
              ":empty": "",
              ":now": new Date().toISOString(),
            },
          })
        );
      } catch (updateError) {
        // Chưa có bản ghi PROFILE cũng không sao — GET /users/profile đọc trạng thái từ JWT.
        console.warn("Skipping profile flag sync after unlink:", updateError);
      }

      return jsonResponse(200, { message: `Đã hủy liên kết ${provider} thành công.` });
    }

    // -------------------------------------------------------------
    // Route: /users/profile/avatar-upload-url (sinh presigned POST để upload ảnh đại diện)
    // -------------------------------------------------------------
    if (resource === "/users/profile/avatar-upload-url" && method === "POST") {
      if (!userId) {
        return jsonResponse(401, { message: "Unauthorized: Chưa đăng nhập" });
      }
      if (!bucketName) {
        return jsonResponse(500, { message: "BUCKET_NAME environment variable is not set" });
      }
      if (!event.body) {
        return jsonResponse(400, { message: "Missing request body" });
      }

      const { fileType } = JSON.parse(event.body);
      const extension = REVIEW_IMAGE_ALLOWED_TYPES[fileType];
      if (!extension) {
        return jsonResponse(400, {
          message: "Định dạng ảnh không hợp lệ. Chỉ chấp nhận JPEG, PNG hoặc WEBP.",
        });
      }

      const key = `users/${userId}/profile/${randomUUID()}.${extension}`;

      const { url, fields } = await createPresignedPost(s3Client, {
        Bucket: bucketName,
        Key: key,
        Conditions: [
          ["content-length-range", 1, REVIEW_IMAGE_MAX_BYTES],
          ["eq", "$Content-Type", fileType],
        ],
        Fields: {
          "Content-Type": fileType,
        },
        Expires: 60,
      });

      return jsonResponse(200, {
        uploadUrl: url,
        fields,
        publicUrl: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
        maxSizeBytes: REVIEW_IMAGE_MAX_BYTES,
      });
    }

    // -------------------------------------------------------------
    // Route: /users/orders
    // -------------------------------------------------------------
    if (resource === "/users/orders") {
      if (!userId) {
        return jsonResponse(401, { message: "Unauthorized: Chưa đăng nhập" });
      }

      if (method === "GET") {
        const result = await dynamoDb.send(
          new QueryCommand({
            TableName: tableName,
            IndexName: "GSI1",
            KeyConditionExpression: "GSI1PK = :gsi1pk AND begins_with(GSI1SK, :gsi1sk)",
            ExpressionAttributeValues: {
              ":gsi1pk": `USER#${userId}`,
              ":gsi1sk": "ORDER#",
            },
          })
        );

        const orders = (result.Items ?? []).map((item) => {
          const stripped = stripTableKeys(item);
          return {
            ...stripped,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          };
        });
        return jsonResponse(200, orders);
      }
    }

    // -------------------------------------------------------------
    // Route: /orders (GET - Admin/Staff Order Management)
    // -------------------------------------------------------------
    if (resource === "/orders" && method === "GET") {
      const groups = authorizer?.claims?.["cognito:groups"] || "";
      const isStaff = groups.includes("Admin") || groups.includes("Staff");
      if (!isStaff) {
        return jsonResponse(403, { message: "Forbidden: Bạn không có quyền truy cập" });
      }

      const items: any[] = [];
      let ExclusiveStartKey: Record<string, unknown> | undefined;

      do {
        const result = await dynamoDb.send(
          new ScanCommand({
            TableName: tableName,
            FilterExpression: "begins_with(PK, :orderPrefix) AND SK = :metadataSk",
            ExpressionAttributeValues: {
              ":orderPrefix": "ORDER#",
              ":metadataSk": "METADATA",
            },
            ExclusiveStartKey,
          })
        );

        items.push(...(result.Items ?? []));
        ExclusiveStartKey = result.LastEvaluatedKey;
      } while (ExclusiveStartKey);

      // Sắp xếp đơn hàng mới nhất lên đầu
      const sortedOrders = items
        .map((item) => {
          const stripped = stripTableKeys(item);
          return {
            ...stripped,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return jsonResponse(200, sortedOrders);
    }

    // -------------------------------------------------------------
    // Route: /orders/{id} (PUT - Admin/Staff Order Update)
    // -------------------------------------------------------------
    if (resource === "/orders/{id}" && method === "PUT") {
      const groups = authorizer?.claims?.["cognito:groups"] || "";
      const isStaff = groups.includes("Admin") || groups.includes("Staff");
      if (!isStaff) {
        return jsonResponse(403, { message: "Forbidden: Bạn không có quyền truy cập" });
      }

      const targetOrderId = event.pathParameters?.id;
      if (!targetOrderId) {
        return jsonResponse(400, { message: "Missing order ID in path" });
      }

      if (!event.body) {
        return jsonResponse(400, { message: "Missing request body" });
      }

      const { status, reason } = JSON.parse(event.body);
      if (!status) {
        return jsonResponse(400, { message: "Status is required" });
      }

      const getResult = await dynamoDb.send(
        new GetCommand({
          TableName: tableName,
          Key: {
            PK: `ORDER#${targetOrderId}`,
            SK: "METADATA",
          },
        })
      );

      if (!getResult.Item) {
        return jsonResponse(404, { message: "Order not found" });
      }

      const changedBy =
        authorizer?.claims?.email ||
        authorizer?.claims?.name ||
        authorizer?.claims?.["cognito:username"] ||
        "SYSTEM";

      const updatedOrder = await applyOrderStatusUpdate(
        targetOrderId,
        getResult.Item,
        status,
        reason,
        changedBy
      );

      return jsonResponse(200, stripTableKeys(updatedOrder));
    }

    // -------------------------------------------------------------
    // Route: /orders/{id}/confirm-receipt (PUT - Khách hàng tự xác nhận đã nhận hàng)
    // -------------------------------------------------------------
    if (resource === "/orders/{id}/confirm-receipt" && method === "PUT") {
      if (!userId) {
        return jsonResponse(401, { message: "Unauthorized: Chưa đăng nhập" });
      }

      const targetOrderId = event.pathParameters?.id;
      if (!targetOrderId) {
        return jsonResponse(400, { message: "Missing order ID in path" });
      }

      const getResult = await dynamoDb.send(
        new GetCommand({
          TableName: tableName,
          Key: {
            PK: `ORDER#${targetOrderId}`,
            SK: "METADATA",
          },
        })
      );

      if (!getResult.Item) {
        return jsonResponse(404, { message: "Order not found" });
      }

      const order = getResult.Item;
      if (order.userId !== userId) {
        return jsonResponse(403, { message: "Forbidden: Đây không phải đơn hàng của bạn" });
      }

      if (order.status !== DELIVERED_STATUS) {
        return jsonResponse(400, {
          message: "Đơn hàng chưa ở trạng thái đã giao, không thể xác nhận nhận hàng",
        });
      }

      const changedBy = authorizer?.claims?.email || authorizer?.claims?.name || userId;
      const updatedOrder = await applyOrderStatusUpdate(
        targetOrderId,
        order,
        COMPLETED_STATUS,
        "Khách hàng xác nhận đã nhận hàng",
        changedBy
      );

      return jsonResponse(200, stripTableKeys(updatedOrder));
    }

    // -------------------------------------------------------------
    // Route: /orders/{id}/history (GET - Order Status Timeline)
    // -------------------------------------------------------------
    if (resource === "/orders/{id}/history" && method === "GET") {
      const targetOrderId = event.pathParameters?.id;
      if (!targetOrderId) {
        return jsonResponse(400, { message: "Missing order ID in path" });
      }

      const orderResult = await dynamoDb.send(
        new GetCommand({
          TableName: tableName,
          Key: {
            PK: `ORDER#${targetOrderId}`,
            SK: "METADATA",
          },
        })
      );

      if (!orderResult.Item) {
        return jsonResponse(404, { message: "Order not found" });
      }

      const groups = authorizer?.claims?.["cognito:groups"] || "";
      const isStaff = groups.includes("Admin") || groups.includes("Staff");
      const isOwner = orderResult.Item.userId && orderResult.Item.userId === userId;
      if (!isStaff && !isOwner) {
        return jsonResponse(403, { message: "Forbidden: Bạn không có quyền truy cập" });
      }

      const historyResult = await dynamoDb.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
          ExpressionAttributeValues: {
            ":pk": `ORDER#${targetOrderId}`,
            ":sk": "STATUS_HISTORY#",
          },
        })
      );

      const history = (historyResult.Items ?? [])
        .map((item) => stripTableKeys(item))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      return jsonResponse(200, history);
    }

    // -------------------------------------------------------------
    // Route: /coupons (POST - Admin tạo coupon)
    // -------------------------------------------------------------
    if (resource === "/coupons" && method === "POST") {
      const groups = authorizer?.claims?.["cognito:groups"] || "";
      const isStaff = groups.includes("Admin") || groups.includes("Staff");
      if (!isStaff) {
        return jsonResponse(403, { message: "Forbidden: Bạn không có quyền truy cập" });
      }

      if (!event.body) {
        return jsonResponse(400, { message: "Missing request body" });
      }

      const body = JSON.parse(event.body);
      const { code, discountType, discountValue, minOrderValue, usageLimit, validFrom, validUntil, isActive } = body;

      if (!code || !discountType || typeof discountValue !== "number") {
        return jsonResponse(400, { message: "Missing required fields: code, discountType, discountValue" });
      }
      if (discountType !== "percentage" && discountType !== "fixed") {
        return jsonResponse(400, { message: "discountType phải là 'percentage' hoặc 'fixed'" });
      }

      const now = new Date().toISOString();
      const coupon = {
        PK: `COUPON#${code}`,
        SK: "METADATA",
        code,
        discountType,
        discountValue,
        minOrderValue: minOrderValue ?? 0,
        usageLimit: usageLimit ?? null,
        usageCount: 0,
        validFrom: validFrom || now,
        validUntil: validUntil || null,
        isActive: isActive !== false,
        createdAt: now,
      };

      await dynamoDb.send(
        new PutCommand({
          TableName: tableName,
          Item: coupon,
        })
      );

      return jsonResponse(201, stripTableKeys(coupon));
    }

    // -------------------------------------------------------------
    // Route: /coupons/{code} (GET - Validate/preview coupon, public)
    // -------------------------------------------------------------
    if (resource === "/coupons/{code}" && method === "GET") {
      const code = event.pathParameters?.code;
      if (!code) {
        return jsonResponse(400, { message: "Missing coupon code" });
      }

      const result = await dynamoDb.send(
        new GetCommand({
          TableName: tableName,
          Key: {
            PK: `COUPON#${code}`,
            SK: "METADATA",
          },
        })
      );

      if (!result.Item) {
        return jsonResponse(404, { message: "Mã giảm giá không tồn tại" });
      }

      const coupon = result.Item;
      const now = new Date();
      const isExpired =
        (coupon.validFrom && now < new Date(coupon.validFrom)) ||
        (coupon.validUntil && now > new Date(coupon.validUntil));
      const isExhausted =
        typeof coupon.usageLimit === "number" && coupon.usageCount >= coupon.usageLimit;

      if (!coupon.isActive || isExpired || isExhausted) {
        return jsonResponse(400, { message: "Mã giảm giá không còn hiệu lực", valid: false });
      }

      return jsonResponse(200, { valid: true, coupon: stripTableKeys(coupon) });
    }

    // -------------------------------------------------------------
    // Route: /coupons (GET - Admin/Staff liệt kê toàn bộ coupon)
    // -------------------------------------------------------------
    if (resource === "/coupons" && method === "GET") {
      const groups = authorizer?.claims?.["cognito:groups"] || "";
      const isStaff = groups.includes("Admin") || groups.includes("Staff");
      if (!isStaff) {
        return jsonResponse(403, { message: "Forbidden: Bạn không có quyền truy cập" });
      }

      const items: any[] = [];
      let ExclusiveStartKey: Record<string, unknown> | undefined;

      do {
        const result = await dynamoDb.send(
          new ScanCommand({
            TableName: tableName,
            FilterExpression: "begins_with(PK, :couponPrefix) AND SK = :metadataSk",
            ExpressionAttributeValues: {
              ":couponPrefix": "COUPON#",
              ":metadataSk": "METADATA",
            },
            ExclusiveStartKey,
          })
        );

        items.push(...(result.Items ?? []));
        ExclusiveStartKey = result.LastEvaluatedKey;
      } while (ExclusiveStartKey);

      const coupons = items
        .map((item) => stripTableKeys(item))
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

      return jsonResponse(200, coupons);
    }

    // -------------------------------------------------------------
    // Route: /coupons/{code} (PUT/DELETE - Admin/Staff sửa hoặc xóa coupon)
    // -------------------------------------------------------------
    if (resource === "/coupons/{code}" && (method === "PUT" || method === "DELETE")) {
      const groups = authorizer?.claims?.["cognito:groups"] || "";
      const isStaff = groups.includes("Admin") || groups.includes("Staff");
      if (!isStaff) {
        return jsonResponse(403, { message: "Forbidden: Bạn không có quyền truy cập" });
      }

      const code = event.pathParameters?.code;
      if (!code) {
        return jsonResponse(400, { message: "Missing coupon code" });
      }

      if (method === "DELETE") {
        await dynamoDb.send(
          new DeleteCommand({
            TableName: tableName,
            Key: { PK: `COUPON#${code}`, SK: "METADATA" },
          })
        );
        return jsonResponse(200, { message: "Đã xóa mã giảm giá" });
      }

      if (!event.body) {
        return jsonResponse(400, { message: "Missing request body" });
      }

      const getResult = await dynamoDb.send(
        new GetCommand({
          TableName: tableName,
          Key: { PK: `COUPON#${code}`, SK: "METADATA" },
        })
      );

      if (!getResult.Item) {
        return jsonResponse(404, { message: "Mã giảm giá không tồn tại" });
      }

      const existing = getResult.Item;
      const body = JSON.parse(event.body);
      const {
        discountType,
        discountValue,
        minOrderValue,
        usageLimit,
        validFrom,
        validUntil,
        isActive,
      } = body;

      if (discountType && discountType !== "percentage" && discountType !== "fixed") {
        return jsonResponse(400, { message: "discountType phải là 'percentage' hoặc 'fixed'" });
      }

      const updatedCoupon = {
        ...existing,
        discountType: discountType ?? existing.discountType,
        discountValue: typeof discountValue === "number" ? discountValue : existing.discountValue,
        minOrderValue: typeof minOrderValue === "number" ? minOrderValue : existing.minOrderValue,
        usageLimit: usageLimit === null || typeof usageLimit === "number" ? usageLimit : existing.usageLimit,
        validFrom: validFrom ?? existing.validFrom,
        validUntil: validUntil === null || validUntil ? validUntil : existing.validUntil,
        isActive: typeof isActive === "boolean" ? isActive : existing.isActive,
      };

      await dynamoDb.send(
        new PutCommand({
          TableName: tableName,
          Item: updatedCoupon,
        })
      );

      return jsonResponse(200, stripTableKeys(updatedCoupon));
    }

    // -------------------------------------------------------------
    // Route: /users & /users/{userId} (Admin/Staff User Management)
    // -------------------------------------------------------------
    if (resource === "/users" || resource === "/users/{userId}") {
      const groups = authorizer?.claims?.["cognito:groups"] || "";
      const isStaff = groups.includes("Admin") || groups.includes("Staff");
      if (!isStaff) {
        return jsonResponse(403, { message: "Forbidden: Bạn không có quyền truy cập" });
      }

      if (resource === "/users" && method === "GET") {
        const items: any[] = [];
        let ExclusiveStartKey: Record<string, unknown> | undefined;

        do {
          const result = await dynamoDb.send(
            new ScanCommand({
              TableName: tableName,
              FilterExpression: "SK = :profileSk",
              ExpressionAttributeValues: {
                ":profileSk": "PROFILE",
              },
              ExclusiveStartKey,
            })
          );

          items.push(...(result.Items ?? []));
          ExclusiveStartKey = result.LastEvaluatedKey;
        } while (ExclusiveStartKey);

        // Quyền thật do Cognito Group quyết định, không phải field `role` lưu trong DynamoDB
        // (field này có thể lệch nếu bị đổi tay hoặc tạo từ trước khi có cơ chế đồng bộ).
        const [adminIds, staffIds, cognitoUsers] = await Promise.all([
          listGroupUserIds("Admin"),
          listGroupUserIds("Staff"),
          listAllCognitoUsers(),
        ]);

        const cognitoUserMap = new Map<string, typeof cognitoUsers[0]>();
        for (const u of cognitoUsers) {
          cognitoUserMap.set(u.userId, u);
        }

        const profilesByUserId = new Map<string, UserProfile>();
        for (const item of items) {
          const profile = stripTableKeys(item) as UserProfile;
          // Chỉ thêm vào danh sách hiển thị nếu tài khoản vẫn tồn tại thực tế trên Cognito
          // (Loại bỏ các profile cũ của các user đã bị xóa trên Cognito)
          if (cognitoUserMap.has(profile.userId)) {
            profilesByUserId.set(profile.userId, profile);
          } else {
            console.log(`[Admin Users] Lọc bỏ profile mồ côi trong DynamoDB: userId=${profile.userId}, email=${profile.email}`);
          }
        }

        // Bất kỳ user Cognito nào chưa có PROFILE trong DynamoDB (vd. backfill chưa chạy
        // ở môi trường này) vẫn phải xuất hiện trong danh sách, thay vì biến mất hoàn toàn.
        for (const cognitoUser of cognitoUsers) {
          if (!profilesByUserId.has(cognitoUser.userId)) {
            const fallbackProfile: Omit<UserProfile, "role"> = {
              userId: cognitoUser.userId,
              email: cognitoUser.email,
              name: cognitoUser.name || cognitoUser.email.split("@")[0] || "User",
              phone: "",
              address: "",
            };
            profilesByUserId.set(cognitoUser.userId, fallbackProfile as UserProfile);
          }
        }

        const profiles = Array.from(profilesByUserId.values()).map((profile) => {
          profile.role = adminIds.has(profile.userId)
            ? "Admin"
            : staffIds.has(profile.userId)
            ? "Staff"
            : "User";

          const cognitoUser = cognitoUserMap.get(profile.userId);
          const username = cognitoUser?.username || "";
          const identitiesStr = cognitoUser?.identitiesStr || "";

          let provider = "Email";
          if (identitiesStr) {
            try {
              const identities = JSON.parse(identitiesStr);
              if (Array.isArray(identities) && identities.length > 0) {
                const providerName = identities[0].providerName;
                if (providerName) {
                  // Chuẩn hóa tên provider (Google, Facebook)
                  const normalized = providerName.charAt(0).toUpperCase() + providerName.slice(1);
                  provider = normalized === "Cognito" ? "Email" : normalized;
                }
              }
            } catch (e) {
              console.error("Failed to parse identities JSON", e);
            }
          }

          if (provider === "Email" && username) {
            if (username.toLowerCase().startsWith("google_") || username.toLowerCase().startsWith("google")) {
              provider = "Google";
            } else if (username.toLowerCase().startsWith("facebook_") || username.toLowerCase().startsWith("facebook")) {
              provider = "Facebook";
            }
          }

          (profile as any).provider = provider;
          return profile;
        });
        return jsonResponse(200, profiles);
      }

      if (resource === "/users/{userId}") {
        const targetUserId = event.pathParameters?.userId;
        if (!targetUserId) {
          return jsonResponse(400, { message: "Missing userId in path" });
        }

        if (method === "PUT") {
          if (!event.body) {
            return jsonResponse(400, { message: "Missing body" });
          }

          const body = JSON.parse(event.body);
          const now = new Date().toISOString();

          const getRes = await dynamoDb.send(
            new GetCommand({
              TableName: tableName,
              Key: {
                PK: `USER#${targetUserId}`,
                SK: "PROFILE",
              },
            })
          );

          const existing = getRes.Item || {};
          const updatedProfile = {
            ...existing,
            PK: `USER#${targetUserId}`,
            SK: "PROFILE",
            userId: targetUserId,
            email: body.email || existing.email || "",
            name: body.name || existing.name || "",
            phone: body.phone || existing.phone || "",
            address: body.address || existing.address || "",
            role: body.role || existing.role || "User",
            updatedAt: now,
          };

          await dynamoDb.send(
            new PutCommand({
              TableName: tableName,
              Item: updatedProfile,
            })
          );

          if (body.role) {
            try {
              await syncCognitoGroup(targetUserId, body.role);
            } catch (error) {
              // Không throw: DB đã ghi thành công, chỉ log để điều tra nếu Cognito group bị lệch
              console.error("Failed to sync Cognito group for role change:", error);
            }
          }

          return jsonResponse(200, stripTableKeys(updatedProfile));
        }

        if (method === "DELETE") {
          await dynamoDb.send(
            new DeleteCommand({
              TableName: tableName,
              Key: {
                PK: `USER#${targetUserId}`,
                SK: "PROFILE",
              },
            })
          );

          return jsonResponse(200, { message: "User profile deleted successfully" });
        }
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

        // Kiểm tra đã có trong wishlist chưa để tránh cộng dồn wishlistCount nhiều lần
        const existingWishlistItem = await dynamoDb.send(
          new GetCommand({
            TableName: tableName,
            Key: {
              PK: `USER#${userId}`,
              SK: `WISHLIST#${productId}`,
            },
          })
        );

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

        if (!existingWishlistItem.Item) {
          try {
            await dynamoDb.send(
              new UpdateCommand({
                TableName: tableName,
                Key: {
                  PK: `PRODUCT#${productId}`,
                  SK: "METADATA",
                },
                UpdateExpression: "ADD wishlistCount :inc",
                ExpressionAttributeValues: {
                  ":inc": 1,
                },
              })
            );
          } catch (err) {
            console.error(`Failed to increment wishlistCount for product ${productId}`, err);
          }
        }

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

        const deleted = await dynamoDb.send(
          new DeleteCommand({
            TableName: tableName,
            Key: {
              PK: `USER#${userId}`,
              SK: `WISHLIST#${targetProductId}`,
            },
            ReturnValues: "ALL_OLD",
          })
        );

        if (deleted.Attributes) {
          try {
            await dynamoDb.send(
              new UpdateCommand({
                TableName: tableName,
                Key: {
                  PK: `PRODUCT#${targetProductId}`,
                  SK: "METADATA",
                },
                UpdateExpression: "ADD wishlistCount :dec",
                ConditionExpression: "attribute_exists(PK) AND wishlistCount > :zero",
                ExpressionAttributeValues: {
                  ":dec": -1,
                  ":zero": 0,
                },
              })
            );
          } catch (err) {
            if ((err as any)?.name !== "ConditionalCheckFailedException") {
              console.error(`Failed to decrement wishlistCount for product ${targetProductId}`, err);
            }
          }
        }

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

        const inventoryResult = await dynamoDb.send(
          new GetCommand({
            TableName: tableName,
            Key: {
              PK: `PRODUCT#${productId}`,
              SK: "INVENTORY",
            },
          })
        );
        const stock = inventoryResult.Item?.stock;

        const product = stripTableKeys(result.Item as ProductItem);
        return jsonResponse(200, {
          product: {
            ...product,
            images: product.images && product.images.length > 0 ? product.images : [product.imageUrl],
            averageRating: product.averageRating ?? 0,
            ratingCount: product.ratingCount ?? 0,
            viewCount: product.viewCount ?? 0,
            soldCount: product.soldCount ?? 0,
            wishlistCount: product.wishlistCount ?? 0,
            stock: stock ?? null,
            inStock: stock === undefined ? true : stock > 0,
          },
        });
      }

      const items: ProductItem[] = [];
      let ExclusiveStartKey: Record<string, unknown> | undefined;
      const category = event.queryStringParameters?.category;

      do {
        const result = await dynamoDb.send(
          category
            ? new QueryCommand({
                TableName: tableName,
                IndexName: "GSI2",
                KeyConditionExpression: "GSI2PK = :gsi2pk",
                ExpressionAttributeValues: {
                  ":gsi2pk": `TYPE#${category}`,
                },
                ExclusiveStartKey,
              })
            : new ScanCommand({
                TableName: tableName,
                FilterExpression: "begins_with(#pk, :productPrefix) AND #sk = :metadataSk",
                ExpressionAttributeNames: {
                  "#pk": "PK",
                  "#sk": "SK",
                },
                ExpressionAttributeValues: {
                  ":productPrefix": "PRODUCT#",
                  ":metadataSk": "METADATA",
                },
                ExclusiveStartKey,
              })
        );

        items.push(...((result.Items ?? []) as ProductItem[]));
        ExclusiveStartKey = result.LastEvaluatedKey;
      } while (ExclusiveStartKey);

      // Lấy tồn kho của tất cả sản phẩm trong 1 lượt Scan riêng để tránh N+1 query
      const stockByProductId = new Map<string, number>();
      let inventoryStartKey: Record<string, unknown> | undefined;
      do {
        const inventoryResult = await dynamoDb.send(
          new ScanCommand({
            TableName: tableName,
            FilterExpression: "begins_with(#pk, :productPrefix) AND #sk = :inventorySk",
            ExpressionAttributeNames: {
              "#pk": "PK",
              "#sk": "SK",
            },
            ExpressionAttributeValues: {
              ":productPrefix": "PRODUCT#",
              ":inventorySk": "INVENTORY",
            },
            ExclusiveStartKey: inventoryStartKey,
          })
        );
        for (const item of inventoryResult.Items ?? []) {
          const pid = String(item.PK).replace("PRODUCT#", "");
          stockByProductId.set(pid, item.stock);
        }
        inventoryStartKey = inventoryResult.LastEvaluatedKey;
      } while (inventoryStartKey);

      const products = items
        .map((item) => {
          const stripped = stripTableKeys(item);
          const stock = stockByProductId.get(String(stripped.id));
          return {
            ...stripped,
            images: stripped.images && stripped.images.length > 0 ? stripped.images : [stripped.imageUrl],
            averageRating: stripped.averageRating ?? 0,
            ratingCount: stripped.ratingCount ?? 0,
            viewCount: stripped.viewCount ?? 0,
            soldCount: stripped.soldCount ?? 0,
            wishlistCount: stripped.wishlistCount ?? 0,
            stock: stock ?? null,
            inStock: stock === undefined ? true : stock > 0,
          };
        })
        .sort((a, b) => Number(a.id) - Number(b.id));

      return jsonResponse(200, products);
    }

    // 2. POST request (Create Product)
    if (method === "POST") {
      if (!event.body) {
        return jsonResponse(400, { message: "Invalid request: Missing body" });
      }

      const body = JSON.parse(event.body) as any;
      const { id, name, brand, type, price, imageUrl, description, stock } = body;
      const images: string[] = Array.isArray(body.images) && body.images.length > 0
        ? body.images.filter((url: unknown) => typeof url === "string" && url.trim().length > 0)
        : imageUrl
          ? [imageUrl]
          : [];

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
        imageUrl: images[0] || imageUrl,
        images,
        description,
        createdAt: now,
        updatedAt: now,
        ...(type ? { GSI2PK: `TYPE#${type}`, GSI2SK: `PRODUCT#${id}` } : {}),
      };

      await dynamoDb.send(
        new PutCommand({
          TableName: tableName,
          Item: newItem,
        })
      );

      // Create INVENTORY record
      const initialStock = typeof stock === "number" ? stock : 0;
      await dynamoDb.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            PK: `PRODUCT#${id}`,
            SK: "INVENTORY",
            stock: initialStock,
            reserved: 0,
            updatedAt: now,
          },
        })
      );

      return jsonResponse(201, {
        ...stripTableKeys(newItem),
        stock: initialStock,
      });
    }

    // 3. PUT request (Update Product)
    if (method === "PUT") {
      if (!productId) {
        return jsonResponse(400, { message: "Missing product ID in path" });
      }

      if (!event.body) {
        return jsonResponse(400, { message: "Invalid request: Missing body" });
      }

      const body = JSON.parse(event.body) as any;

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

      // Chỉ cho phép client cập nhật các field thông tin sản phẩm cơ bản;
      // các field denormalize (rating/view/sold/wishlist/GSI2) không bao giờ bị ghi đè từ body.
      const allowedFields: (keyof ProductItem)[] = [
        "name",
        "brand",
        "type",
        "price",
        "imageUrl",
        "images",
        "description",
      ];
      const sanitizedBody: Partial<ProductItem> = {};
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          (sanitizedBody as any)[field] = body[field];
        }
      }
      if (Array.isArray(sanitizedBody.images) && sanitizedBody.images.length > 0) {
        sanitizedBody.imageUrl = sanitizedBody.images[0];
      }

      const now = new Date().toISOString();
      const existingProduct = existing.Item as ProductItem;
      const newType = sanitizedBody.type ?? existingProduct.type;
      const updatedItem: ProductItem = {
        ...existingProduct,
        ...sanitizedBody,
        PK: `PRODUCT#${productId}`,
        SK: "METADATA",
        id: productId,
        updatedAt: now,
        ...(newType ? { GSI2PK: `TYPE#${newType}`, GSI2SK: `PRODUCT#${productId}` } : {}),
      };

      await dynamoDb.send(
        new PutCommand({
          TableName: tableName,
          Item: updatedItem,
        })
      );

      // Update INVENTORY record if stock is provided
      let finalStock = null;
      if (body.stock !== undefined) {
        const newStock = typeof body.stock === "number" ? body.stock : Number(body.stock);
        if (Number.isInteger(newStock)) {
          const currentInv = await dynamoDb.send(
            new GetCommand({
              TableName: tableName,
              Key: {
                PK: `PRODUCT#${productId}`,
                SK: "INVENTORY",
              },
            })
          );
          const currentReserved = currentInv.Item?.reserved || 0;
          await dynamoDb.send(
            new PutCommand({
              TableName: tableName,
              Item: {
                PK: `PRODUCT#${productId}`,
                SK: "INVENTORY",
                stock: newStock,
                reserved: currentReserved,
                updatedAt: now,
              },
            })
          );
          finalStock = newStock;
        }
      }

      return jsonResponse(200, {
        ...stripTableKeys(updatedItem),
        ...(finalStock !== null ? { stock: finalStock } : {}),
      });
    }

    // 4. DELETE request (Delete Product)
    if (method === "DELETE") {
      if (!productId) {
        return jsonResponse(400, { message: "Missing product ID in path" });
      }

      await Promise.all([
        dynamoDb.send(
          new DeleteCommand({
            TableName: tableName,
            Key: {
              PK: `PRODUCT#${productId}`,
              SK: "METADATA",
            },
          })
        ),
        dynamoDb.send(
          new DeleteCommand({
            TableName: tableName,
            Key: {
              PK: `PRODUCT#${productId}`,
              SK: "INVENTORY",
            },
          })
        ),
      ]);

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
