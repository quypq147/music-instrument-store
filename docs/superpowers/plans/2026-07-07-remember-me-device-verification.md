# Remember Me + Device/Inactivity Re-Verification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the login page's "remember me" checkbox actually do something (session-only vs. persistent login), and add a lightweight app-level check that requires re-confirming identity by email OTP when signing in from a device/browser that hasn't been seen in the last 30 days.

**Architecture:** Two independent mechanisms, both app-level (no change to Cognito's own sign-in flow):
1. **Remember me** — swap Amplify's token key-value storage between `localStorage` (persistent) and a `sessionStorage`-backed adapter (cleared on browser close) at sign-in time, based on the checkbox. The choice itself is recorded in `sessionStorage` (which survives a hard refresh but not a browser close) so a page reload mid-session doesn't lose track of which storage to keep reading from.
2. **Device/inactivity re-verification** — a random `deviceId` persisted in `localStorage` identifies "this browser." Right after a successful `signIn()`, the frontend calls a new backend endpoint that checks a DynamoDB record of trusted devices (`lastSeenAt` within 30 days = trusted). If untrusted, the backend generates a 6-digit OTP, stores it with a short TTL, and sends it by email via a **direct Lambda-to-Lambda invoke** of the existing `services/notification` Lambda's already-deployed synchronous handler (`handleApiEvent`) — chosen over the async EventBridge path for lower, predictable latency. The frontend then redirects to a new `/verify-device` page that blocks the rest of the app until the code is confirmed.

**Tech Stack:** TypeScript, AWS Lambda (`services/product-api`), `@aws-sdk/client-lambda` (new dependency for `services/product-api`), DynamoDB (new TTL attribute + two new item shapes on the existing single table), Amplify Auth v6 (`aws-amplify/auth/cognito` — `cognitoUserPoolsTokenProvider`), Next.js API routes, Jest + ts-jest + `aws-sdk-client-mock` (existing test infra in `services/product-api`).

## Global Constraints

- This is section B of `docs/superpowers/specs/2026-07-07-account-ux-chatbot-upgrade-design.md`.
- **Out of scope (per spec):** MFA, Cognito native device tracking, changing the Cognito auth flow to `CUSTOM_AUTH`. This is deliberately an app-level gate layered on top of the existing `signIn()` call, not a Cognito-level redesign.
- The 30-day device-trust window and the Cognito refresh-token validity (also 30 days, unconfigured/default) are the same order of magnitude by design — a device can only go this long between checks because Cognito itself forces a real re-`signIn()` at that point anyway, which re-triggers the check. This is a constant (`DEVICE_TRUST_WINDOW_MS`), not user-configurable.
- OTP send path (confirmed with the user): call the notification Lambda's existing synchronous handler (`services/notification/src/handlers/apiHandler.ts`'s `handleApiEvent`, which already sends real emails via `SesEmailProvider` when invoked with `{ httpMethod: "POST", body: JSON.stringify({ type, recipient, message, title }) }`) directly via `@aws-sdk/client-lambda`'s `InvokeCommand`, rather than the async EventBridge→SQS pattern used for order emails, and rather than that Lambda's own public `/notifications` API Gateway route (which today has zero callers anywhere in the repo — going through it would mean relying on an unexercised code path over an extra public network hop for no benefit over a direct invoke).
- `services/product-api` already has Jest test infra (`jest.config.js`, `tsconfig.json`) from a prior plan — reuse it, no new test tooling needed.
- `services/product-api/index.js` is a committed esbuild bundle that must be rebuilt after any `index.ts` change in this plan: `npx esbuild services/product-api/index.ts --bundle --platform=node --target=node22 --external:@aws-sdk/* --outfile=services/product-api/index.js`.
- CDK changes are verified with `npx tsc --noEmit` only in this plan — **do not run `cdk deploy`**, that's a separate, explicit, human-triggered action.
- Frontend has no test runner repo-wide — frontend tasks are verified via `npx tsc --noEmit`, `npm run lint`, and manual browser testing, consistent with prior plans' Global Constraints.

---

## Task 1: Remember-me — real storage behavior

**Files:**
- Create: `frontend/app/lib/authStorage.ts`
- Modify: `frontend/app/components/common/AmplifyConfig.tsx`
- Modify: `frontend/app/(auth)/login/page.tsx`

**Interfaces:**
- Produces: `applyRememberMePreference(rememberMe: boolean): void` and `initAuthStorageFromPreference(): void`, exported from `frontend/app/lib/authStorage.ts`. `initAuthStorageFromPreference` is consumed by `AmplifyConfig.tsx`; `applyRememberMePreference` is consumed by `login/page.tsx`.

- [ ] **Step 1: Create the storage-preference helper**

Create `frontend/app/lib/authStorage.ts`:

```ts
import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito";
import type { KeyValueStorageInterface } from "@aws-amplify/core";

const STORAGE_MODE_KEY = "music-store-auth-storage-mode";

// Adapter phù hợp KeyValueStorageInterface của Amplify, dùng sessionStorage thay vì
// localStorage mặc định — token sẽ tự mất khi đóng tab/trình duyệt (không "ghi nhớ đăng nhập").
const sessionStorageAdapter: KeyValueStorageInterface = {
  async setItem(key: string, value: string) {
    window.sessionStorage.setItem(key, value);
  },
  async getItem(key: string) {
    return window.sessionStorage.getItem(key);
  },
  async removeItem(key: string) {
    window.sessionStorage.removeItem(key);
  },
  async clear() {
    window.sessionStorage.clear();
  },
};

// Gọi ngay sau khi signIn() thành công, dựa trên trạng thái checkbox "Ghi nhớ đăng nhập".
// Không tích -> chuyển Amplify sang lưu token ở sessionStorage (mất khi đóng trình duyệt).
// Có tích -> giữ hành vi mặc định của Amplify (localStorage, tồn tại qua các lần mở lại).
export function applyRememberMePreference(rememberMe: boolean): void {
  if (rememberMe) {
    window.sessionStorage.removeItem(STORAGE_MODE_KEY);
    return;
  }

  window.sessionStorage.setItem(STORAGE_MODE_KEY, "session");
  cognitoUserPoolsTokenProvider.setKeyValueStorage(sessionStorageAdapter);
}

// Gọi 1 lần khi app khởi động (module scope của AmplifyConfig). sessionStorage (khác với
// token bên trong nó) sống sót qua F5/refresh trong cùng tab, nên đây là cách duy nhất để
// một phiên "không ghi nhớ" tiếp tục đọc đúng token từ sessionStorage sau khi người dùng
// refresh trang, thay vì Amplify quay về đọc nhầm localStorage (rỗng) và tưởng đã đăng xuất.
export function initAuthStorageFromPreference(): void {
  if (typeof window === "undefined") return;
  if (window.sessionStorage.getItem(STORAGE_MODE_KEY) === "session") {
    cognitoUserPoolsTokenProvider.setKeyValueStorage(sessionStorageAdapter);
  }
}
```

- [ ] **Step 2: Apply the stored preference at Amplify bootstrap**

Modify `frontend/app/components/common/AmplifyConfig.tsx` — add the import and call right after `Amplify.configure(...)`:

```ts
"use client";

import React from "react";
import { Amplify } from "aws-amplify";
import { initAuthStorageFromPreference } from "../../lib/authStorage";


if (!process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || !process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID) {
  console.warn(
    "AmplifyConfig: NEXT_PUBLIC_COGNITO_USER_POOL_ID or NEXT_PUBLIC_COGNITO_CLIENT_ID is missing. " +
    "If you just deployed the stack, please restart your Next.js development server to load the new env variables."
  );
}

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "",
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "",
    },
  },
});

initAuthStorageFromPreference();

export default function AmplifyConfig({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

- [ ] **Step 3: Call it from the login page at sign-in time**

Modify `frontend/app/(auth)/login/page.tsx` — add the import:

```ts
import { applyRememberMePreference } from "../../lib/authStorage";
```

In `handleLogin`, call it immediately before `signIn(...)`:

```ts
    setIsSubmitting(true);
    try {
      applyRememberMePreference(rememberMe);
      await signIn({
        username: email,
        password: password,
      });
```

- [ ] **Step 4: Type-check and lint**

Run: `cd frontend && npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 5: Manual browser verification**

Run: `npm run dev -w @music-store/web`, open the login page in a browser with DevTools open (Application/Storage tab):
1. Uncheck "Ghi nhớ đăng nhập", log in. Confirm Cognito token keys appear under **Session Storage**, not Local Storage.
2. Hard-refresh the page (F5). Confirm you're still logged in (the app didn't fall back to reading empty localStorage).
3. Close the tab entirely and reopen the site. Confirm you're now logged out (session storage was cleared by the browser).
4. Log out, then log back in with "Ghi nhớ đăng nhập" checked. Confirm tokens appear under **Local Storage** this time, and you're still logged in after fully closing and reopening the browser.
Stop the dev server when done.

- [ ] **Step 6: Commit**

```bash
git add frontend/app/lib/authStorage.ts frontend/app/components/common/AmplifyConfig.tsx "frontend/app/(auth)/login/page.tsx"
git commit -m "feat(frontend): make remember-me checkbox actually switch token storage"
```

---

## Task 2: DynamoDB TTL attribute (for OTP auto-cleanup)

**Files:**
- Modify: `infrastructure/lib/database-stack.ts`

**Interfaces:**
- Produces: a `ttl` numeric attribute enabled as the table's TTL field, consumed by Task 3 (OTP items set this field so DynamoDB garbage-collects them; the application still checks `expiresAt` explicitly, since DynamoDB TTL deletion can lag by hours and must never be relied on for security enforcement).

- [ ] **Step 1: Enable TTL on the main table**

Modify `infrastructure/lib/database-stack.ts` — add `timeToLiveAttribute` to the existing `mainTable` definition:

```ts
    this.mainTable = new dynamodb.Table(this, 'MusicStoreMainTable', {
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Tối ưu chi phí serverless
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Xóa table khi destroy stack (chỉ dùng cho Dev)
      pointInTimeRecovery: true, // Kích hoạt Point-in-Time Recovery (PITR) cho DynamoDB
      timeToLiveAttribute: 'ttl', // Dùng cho các item có vòng đời ngắn (vd. mã OTP xác minh thiết bị)
    });
```

- [ ] **Step 2: Verify it type-checks**

Run: `cd infrastructure && npx tsc --noEmit`
Expected: no errors. Do not run `cdk deploy`/`cdk synth` against a real account.

- [ ] **Step 3: Commit**

```bash
git add infrastructure/lib/database-stack.ts
git commit -m "feat(infra): enable DynamoDB TTL attribute for short-lived items"
```

---

## Task 3: Backend — `/auth/device/check` route + Lambda-invoke wiring

**Files:**
- Modify: `services/product-api/index.ts`
- Modify: `services/product-api/package.json` (add `@aws-sdk/client-lambda` dependency)
- Modify: `services/product-api/tests/env.setup.ts`
- Create: `services/product-api/tests/deviceCheck.test.ts`
- Modify: `infrastructure/lib/backend-stack.ts`

**Interfaces:**
- Produces: `POST /auth/device/check` route; module-scope constants `DEVICE_TRUST_WINDOW_MS`, `OTP_TTL_MS`; helpers `generateOtpCode(): string` and `sendOtpEmail(email: string, code: string): Promise<void>` — the latter consumed by Task 4's `/auth/device/verify` is NOT needed (verify doesn't send email), but the DynamoDB item shapes (`DEVICE#<deviceId>`, `SK: "OTP"`) are shared with Task 4.

- [ ] **Step 1: Add the new dependency**

Edit `services/product-api/package.json`, add to `dependencies`:

```json
    "@aws-sdk/client-lambda": "^3.1075.0",
```

Run: `npm install --workspace=services/product-api`
Expected: exits 0.

- [ ] **Step 2: Add `NOTIFICATION_FUNCTION_NAME` to the test env setup**

Edit `services/product-api/tests/env.setup.ts` to add one line:

```ts
process.env.TABLE_NAME = "test-table";
process.env.USER_POOL_ID = "test-pool";
process.env.AWS_REGION = "ap-southeast-1";
process.env.BUCKET_NAME = "test-bucket";
process.env.NOTIFICATION_FUNCTION_NAME = "test-notification-function";
```

- [ ] **Step 3: Write the failing tests**

Create `services/product-api/tests/deviceCheck.test.ts`:

```ts
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import type { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../index";

const ddbMock = mockClient(DynamoDBDocumentClient);
const lambdaMock = mockClient(LambdaClient);

function buildEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    resource: "/auth/device/check",
    httpMethod: "POST",
    path: "/auth/device/check",
    pathParameters: null,
    body: JSON.stringify({ deviceId: "device-abc" }),
    requestContext: {
      authorizer: {
        claims: {
          sub: "user-1",
          email: "user1@example.com",
        },
      },
    },
    ...overrides,
  } as unknown as APIGatewayProxyEvent;
}

beforeEach(() => {
  ddbMock.reset();
  lambdaMock.reset();
  lambdaMock.on(InvokeCommand).resolves({ StatusCode: 200 });
});

describe("POST /auth/device/check", () => {
  it("returns 401 when not authenticated", async () => {
    const result = await handler(
      buildEvent({ requestContext: { authorizer: undefined } as any }),
      {} as Context,
      () => {}
    );
    expect(result!.statusCode).toBe(401);
  });

  it("trusts a device seen within the last 30 days without sending an OTP", async () => {
    ddbMock.on(GetCommand).resolves({
      Item: {
        PK: "USER#user-1",
        SK: "DEVICE#device-abc",
        deviceId: "device-abc",
        lastSeenAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    ddbMock.on(PutCommand).resolves({});

    const result = await handler(buildEvent(), {} as Context, () => {});

    expect(result!.statusCode).toBe(200);
    expect(JSON.parse(result!.body)).toEqual({ trusted: true });
    expect(lambdaMock.commandCalls(InvokeCommand)).toHaveLength(0);
  });

  it("treats a device unseen for over 30 days as untrusted and sends an OTP email", async () => {
    ddbMock.on(GetCommand).resolves({
      Item: {
        PK: "USER#user-1",
        SK: "DEVICE#device-abc",
        deviceId: "device-abc",
        lastSeenAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    ddbMock.on(PutCommand).resolves({});

    const result = await handler(buildEvent(), {} as Context, () => {});

    expect(result!.statusCode).toBe(200);
    expect(JSON.parse(result!.body)).toEqual({ trusted: false });
    expect(lambdaMock.commandCalls(InvokeCommand)).toHaveLength(1);
    const invokePayload = JSON.parse(
      Buffer.from(lambdaMock.commandCalls(InvokeCommand)[0].args[0].input.Payload as Uint8Array).toString()
    );
    const emailBody = JSON.parse(invokePayload.body);
    expect(emailBody.recipient).toBe("user1@example.com");
    expect(emailBody.message).toMatch(/\d{6}/);
  });

  it("treats a never-seen device as untrusted and sends an OTP email", async () => {
    ddbMock.on(GetCommand).resolves({ Item: undefined });
    ddbMock.on(PutCommand).resolves({});

    const result = await handler(buildEvent(), {} as Context, () => {});

    expect(result!.statusCode).toBe(200);
    expect(JSON.parse(result!.body)).toEqual({ trusted: false });
    expect(lambdaMock.commandCalls(InvokeCommand)).toHaveLength(1);
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npm test --workspace=services/product-api -- deviceCheck`
Expected: FAIL — no route matches `/auth/device/check` yet.

- [ ] **Step 5: Add module-scope constants and helpers**

Modify `services/product-api/index.ts` — add this import near the top with the other AWS SDK imports:

```ts
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
```

Add these constants/helpers right after the existing `REVIEW_IMAGE_MAX_COUNT` constant (search for it — it's a `const REVIEW_IMAGE_MAX_COUNT = 3;` line):

```ts
const lambdaClient = new LambdaClient({});
const notificationFunctionName = process.env.NOTIFICATION_FUNCTION_NAME;

// Ngưỡng "thiết bị quen": trùng bậc với thời hạn refresh token mặc định của Cognito (30 ngày) —
// đến lúc refresh token hết hạn, user bắt buộc phải đăng nhập lại thật sự, và lần đó sẽ tự
// kích hoạt lại việc kiểm tra thiết bị, nên khoảng cách tối đa giữa 2 lần xác minh luôn bị chặn.
const DEVICE_TRUST_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;

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
      message: `Mã xác minh thiết bị mới của bạn là: ${code}. Mã có hiệu lực trong 10 phút. Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.`,
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
};
```

- [ ] **Step 6: Add the route**

Insert this new block right after the auth-claims extraction (search for `const userName = authorizer?.claims?.name` — add this immediately after that line, before the `// Route: /products/{id}/view` comment):

```ts
    // -------------------------------------------------------------
    // Route: /auth/device/check (kiểm tra thiết bị đã tin cậy hay chưa, gửi OTP nếu chưa)
    // -------------------------------------------------------------
    if (resource === "/auth/device/check" && method === "POST") {
      if (!userId) {
        return jsonResponse(401, { message: "Unauthorized: Chưa đăng nhập" });
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

      await dynamoDb.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            PK: `USER#${userId}`,
            SK: "OTP",
            code,
            expiresAt,
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
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test --workspace=services/product-api -- deviceCheck`
Expected: PASS (4 tests). Also run the full suite: `npm test --workspace=services/product-api`.

- [ ] **Step 8: Wire up CDK — permission, env var, and both `/auth/device/*` routes**

Modify `infrastructure/lib/backend-stack.ts`. First, right after the `notificationApiLambda` definition (search for `"Notification Service Lambda"` — add this right after its closing `});`):

```ts
    // productApiLambda gọi thẳng (Invoke) vào notificationApiLambda để gửi email OTP xác minh
    // thiết bị đồng bộ, không qua EventBridge/SQS (độ trễ khó đoán) hay route API Gateway công khai.
    productApiLambda.addEnvironment("NOTIFICATION_FUNCTION_NAME", notificationApiLambda.functionName);
    notificationApiLambda.grantInvoke(productApiLambda);
```

Then, add the new API Gateway routes right after the existing `/users/profile/avatar-upload-url` route block (search for `avatarUploadUrlResource` — add this right after that block; if that route doesn't exist yet in this checkout, add it right after the `/users/orders` route block instead, search for `"// Route: /users/orders"`):

```ts
    // Route: /auth/device/check, /auth/device/verify (xác minh thiết bị/OTP khi đăng nhập)
    const authResource = api.root.addResource("auth");
    const deviceResource = authResource.addResource("device");

    const deviceCheckResource = deviceResource.addResource("check");
    deviceCheckResource.addMethod(
      "POST",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    const deviceVerifyResource = deviceResource.addResource("verify");
    deviceVerifyResource.addMethod(
      "POST",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );
```

- [ ] **Step 9: Verify the CDK change type-checks**

Run: `cd infrastructure && npx tsc --noEmit`
Expected: no errors. Do not run `cdk deploy`/`cdk synth` against a real account.

- [ ] **Step 10: Rebuild the committed esbuild bundle**

Run: `npx esbuild services/product-api/index.ts --bundle --platform=node --target=node22 --external:@aws-sdk/* --outfile=services/product-api/index.js`

- [ ] **Step 11: Commit**

```bash
git add services/product-api infrastructure/lib/backend-stack.ts
git commit -m "feat(product-api): add /auth/device/check route with OTP email via direct Lambda invoke"
```

---

## Task 4: Backend — `/auth/device/verify` route

**Files:**
- Modify: `services/product-api/index.ts`
- Create: `services/product-api/tests/deviceVerify.test.ts`

**Interfaces:**
- Consumes: the `DEVICE#<deviceId>` and `SK: "OTP"` DynamoDB item shapes from Task 3.
- Produces: `POST /auth/device/verify` route (already wired in CDK by Task 3).

- [ ] **Step 1: Write the failing tests**

Create `services/product-api/tests/deviceVerify.test.ts`:

```ts
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../index";

const ddbMock = mockClient(DynamoDBDocumentClient);

function buildEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    resource: "/auth/device/verify",
    httpMethod: "POST",
    path: "/auth/device/verify",
    pathParameters: null,
    body: JSON.stringify({ deviceId: "device-abc", code: "123456" }),
    requestContext: {
      authorizer: {
        claims: {
          sub: "user-1",
          email: "user1@example.com",
        },
      },
    },
    ...overrides,
  } as unknown as APIGatewayProxyEvent;
}

beforeEach(() => {
  ddbMock.reset();
});

describe("POST /auth/device/verify", () => {
  it("returns 400 when no OTP has been requested", async () => {
    ddbMock.on(GetCommand).resolves({ Item: undefined });

    const result = await handler(buildEvent(), {} as Context, () => {});
    expect(result!.statusCode).toBe(400);
  });

  it("returns 400 for an expired OTP", async () => {
    ddbMock.on(GetCommand).resolves({
      Item: {
        code: "123456",
        expiresAt: new Date(Date.now() - 60 * 1000).toISOString(),
      },
    });

    const result = await handler(buildEvent(), {} as Context, () => {});
    expect(result!.statusCode).toBe(400);
  });

  it("returns 400 for an incorrect code", async () => {
    ddbMock.on(GetCommand).resolves({
      Item: {
        code: "999999",
        expiresAt: new Date(Date.now() + 60 * 1000).toISOString(),
      },
    });

    const result = await handler(buildEvent(), {} as Context, () => {});
    expect(result!.statusCode).toBe(400);
  });

  it("trusts the device and deletes the OTP on a correct, unexpired code", async () => {
    ddbMock.on(GetCommand).resolves({
      Item: {
        code: "123456",
        expiresAt: new Date(Date.now() + 60 * 1000).toISOString(),
      },
    });
    ddbMock.on(PutCommand).resolves({});
    ddbMock.on(DeleteCommand).resolves({});

    const result = await handler(buildEvent(), {} as Context, () => {});

    expect(result!.statusCode).toBe(200);
    expect(JSON.parse(result!.body)).toEqual({ trusted: true });

    const putCall = ddbMock.commandCalls(PutCommand)[0];
    expect(putCall.args[0].input.Item?.SK).toBe("DEVICE#device-abc");

    const deleteCall = ddbMock.commandCalls(DeleteCommand)[0];
    expect(deleteCall.args[0].input.Key?.SK).toBe("OTP");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test --workspace=services/product-api -- deviceVerify`
Expected: FAIL — no route matches `/auth/device/verify` yet.

- [ ] **Step 3: Add the route**

Insert this new block immediately after the `/auth/device/check` block added in Task 3 (same location, right before `// Route: /products/{id}/view`):

```ts
    // -------------------------------------------------------------
    // Route: /auth/device/verify (xác minh OTP, đánh dấu thiết bị tin cậy)
    // -------------------------------------------------------------
    if (resource === "/auth/device/verify" && method === "POST") {
      if (!userId) {
        return jsonResponse(401, { message: "Unauthorized: Chưa đăng nhập" });
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

      if (otp.code !== code) {
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test --workspace=services/product-api -- deviceVerify`
Expected: PASS (4 tests). Also run the full suite: `npm test --workspace=services/product-api`.

- [ ] **Step 5: Rebuild the committed esbuild bundle**

Run: `npx esbuild services/product-api/index.ts --bundle --platform=node --target=node22 --external:@aws-sdk/* --outfile=services/product-api/index.js`

- [ ] **Step 6: Commit**

```bash
git add services/product-api
git commit -m "feat(product-api): add /auth/device/verify route"
```

---

## Task 5: Frontend proxy routes for device check/verify

**Files:**
- Create: `frontend/app/api/auth/device/check/route.ts`
- Create: `frontend/app/api/auth/device/verify/route.ts`

**Interfaces:**
- Consumes: `POST /auth/device/check` and `POST /auth/device/verify` backend routes from Tasks 3-4.
- Produces: `POST /api/auth/device/check` and `POST /api/auth/device/verify`, consumed by Task 6.

- [ ] **Step 1: Create the check proxy route**

Create `frontend/app/api/auth/device/check/route.ts` (same proxy pattern as every other route under `frontend/app/api/*`):

```ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL?.replace(/\/$/, "");
    if (!apiGatewayUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_API_GATEWAY_URL is not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const authHeader = req.headers.get("Authorization");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const res = await fetch(`${apiGatewayUrl}/auth/device/check`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || `API Gateway returned status ${res.status}` },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy POST /api/auth/device/check error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create the verify proxy route**

Create `frontend/app/api/auth/device/verify/route.ts` (identical shape, different target path):

```ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL?.replace(/\/$/, "");
    if (!apiGatewayUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_API_GATEWAY_URL is not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const authHeader = req.headers.get("Authorization");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const res = await fetch(`${apiGatewayUrl}/auth/device/verify`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || `API Gateway returned status ${res.status}` },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy POST /api/auth/device/verify error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Type-check**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/api/auth/device
git commit -m "feat(frontend): add proxy routes for device check/verify"
```

---

## Task 6: Frontend — device-id helper, login-page gate, `/verify-device` page

**Files:**
- Create: `frontend/app/lib/deviceId.ts`
- Modify: `frontend/app/(auth)/login/page.tsx`
- Create: `frontend/app/(auth)/verify-device/page.tsx`

**Interfaces:**
- Consumes: `ImagePicker`-style pattern N/A here; consumes `/api/auth/device/check` and `/api/auth/device/verify` from Task 5.
- Produces: `getOrCreateDeviceId(): string`, consumed by both the login page and the verify-device page (must return the same value across both, since it's the same browser).

- [ ] **Step 1: Create the device-id helper**

Create `frontend/app/lib/deviceId.ts`:

```ts
const DEVICE_ID_KEY = "music-store-device-id";

// Định danh trình duyệt này (không phải định danh user) — dùng localStorage (không phải
// sessionStorage) vì cần nhận ra "thiết bị quen" ngay cả khi người dùng chọn không ghi nhớ
// đăng nhập ở lần đó; việc gợi nhớ device khác hoàn toàn việc ghi nhớ phiên đăng nhập.
export function getOrCreateDeviceId(): string {
  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const generated = crypto.randomUUID();
  window.localStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
}
```

- [ ] **Step 2: Wire the device check into the login flow**

Modify `frontend/app/(auth)/login/page.tsx` — add the import:

```ts
import { getOrCreateDeviceId } from "../../lib/deviceId";
```

Replace the body of `handleLogin` from the point right after `signIn(...)` to the end with:

```ts
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Vui lòng nhập email và mật khẩu!", "warning");
      return;
    }
    setIsSubmitting(true);
    try {
      applyRememberMePreference(rememberMe);
      await signIn({
        username: email,
        password: password,
      });

      let isAdminOrStaff = false;
      let token = "";
      try {
        const session = await fetchAuthSession();
        const groups = session.tokens?.idToken?.payload["cognito:groups"] as string[] | undefined;
        isAdminOrStaff = !!(groups && (groups.includes("Admin") || groups.includes("Staff")));
        token = session.tokens?.idToken?.toString() || "";
      } catch (sessionError) {
        console.warn("Could not fetch session in login redirect:", sessionError);
      }

      const redirectTarget = isAdminOrStaff ? "/admin" : "/";

      if (token) {
        try {
          const deviceId = getOrCreateDeviceId();
          const checkRes = await fetch("/api/auth/device/check", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ deviceId }),
          });
          const checkData = await checkRes.json();

          if (checkRes.ok && checkData.trusted === false) {
            router.push(`/verify-device?redirect=${encodeURIComponent(redirectTarget)}`);
            return;
          }
        } catch (deviceCheckError) {
          // Nếu bước kiểm tra thiết bị lỗi (vd. mạng chập chờn), không chặn đăng nhập —
          // đây là lớp bảo vệ bổ sung, không phải điều kiện bắt buộc để vào được app.
          console.warn("Device check failed, proceeding without it:", deviceCheckError);
        }
      }

      showToast("Đăng nhập thành công!", "success");
      router.refresh();
      window.location.href = redirectTarget;
    } catch (err) {
      const error = err as Error;
      showToast(error.message || "Tên đăng nhập hoặc mật khẩu không đúng!", "error");
    } finally {
      setIsSubmitting(false);
    }
  };
```

- [ ] **Step 3: Create the `/verify-device` page**

Create `frontend/app/(auth)/verify-device/page.tsx`:

```tsx
"use client";

import "../../components/common/AmplifyConfig";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchAuthSession } from "aws-amplify/auth";
import { useToast } from "../../context/ToastContext";
import { getOrCreateDeviceId } from "../../lib/deviceId";

function VerifyDeviceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTarget = searchParams.get("redirect") || "/";

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      showToast("Vui lòng nhập đủ 6 chữ số.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error("No session token found");

      const deviceId = getOrCreateDeviceId();
      const res = await fetch("/api/auth/device/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ deviceId, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Mã xác minh không đúng.", "error");
        return;
      }

      showToast("Xác minh thiết bị thành công!", "success");
      router.refresh();
      window.location.href = redirectTarget;
    } catch (err) {
      console.error("Device verify error:", err);
      showToast("Đã xảy ra lỗi khi xác minh. Vui lòng thử lại.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-cream dark:bg-[#02140f] p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#06261d] rounded-md border border-border-subtle dark:border-primary-container/20 shadow-sm p-8">
        <h1 className="font-serif text-2xl text-primary dark:text-white font-bold mb-3">
          Xác minh thiết bị mới
        </h1>
        <p className="text-gray-500 dark:text-emerald-100/60 text-sm leading-relaxed mb-6">
          Chúng tôi phát hiện bạn đăng nhập từ một thiết bị hoặc trình duyệt chưa từng dùng gần đây.
          Vui lòng nhập mã 6 chữ số vừa được gửi tới email của bạn để tiếp tục.
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            disabled={isSubmitting}
            placeholder="000000"
            className="w-full py-3 px-4 bg-white dark:bg-[#031d16] border border-border-subtle dark:border-emerald-900/40 rounded-sm text-center text-2xl tracking-[0.5em] text-[#1F2937] dark:text-emerald-50 outline-none focus:border-secondary disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary dark:bg-[#064e3b] hover:bg-primary-container dark:hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-[0.15em] py-4 rounded-sm transition-all disabled:opacity-75"
          >
            {isSubmitting ? "Đang xác minh..." : "Xác Minh"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-emerald-900/40">
          Mã hết hạn sau 10 phút.{" "}
          <Link href="/login" className="text-secondary dark:text-[#fe932c] font-bold">
            Quay lại đăng nhập
          </Link>{" "}
          để nhận mã mới nếu cần.
        </p>
      </div>
    </main>
  );
}

export default function VerifyDevicePage() {
  return (
    <Suspense fallback={null}>
      <VerifyDeviceContent />
    </Suspense>
  );
}
```

- [ ] **Step 4: Type-check and lint**

Run: `cd frontend && npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 5: Manual browser verification**

Run: `npm run dev -w @music-store/web`. In a browser:
1. Clear `localStorage` for the site (or use a fresh incognito window) so no `music-store-device-id` exists yet.
2. Log in. Confirm you're redirected to `/verify-device` instead of the home/admin page, and that an email arrives with a 6-digit code (check the SES sandbox/verified test inbox configured for this environment).
3. Enter the wrong code — confirm an error toast, no redirect.
4. Enter the correct code — confirm you're redirected to the right destination (home or `/admin` depending on role).
5. Log out and log back in again (same browser, device now trusted) — confirm you go straight to the destination without hitting `/verify-device` this time.
Stop the dev server when done.

- [ ] **Step 6: Commit**

```bash
git add frontend/app/lib/deviceId.ts "frontend/app/(auth)/login/page.tsx" "frontend/app/(auth)/verify-device"
git commit -m "feat(frontend): gate login on device verification, add /verify-device page"
```

---

## Self-Review Notes

- **Spec coverage:** Both spec section B bullets are covered — real remember-me storage swap (Task 1) and device/inactivity OTP re-verification (Tasks 2-6).
- **Explicit deviation from the spec's literal wording, confirmed with the user first:** the spec said the OTP send should follow the `services/notification` "use-case" pattern (implying the async EventBridge dispatcher path used for order emails). After finding that service also already exposes an unused synchronous HTTP handler, the user chose to call that synchronous path directly (via Lambda invoke, not its own public route) for lower/more predictable OTP latency, rather than add a new EventBridge event type. This is called out in Global Constraints rather than silently substituted.
- **Bounded worst-case gap:** confirmed in the task text that a device can only go up to ~30 days without a fresh check, because Cognito's own refresh-token expiry (also ~30 days, default) forces a real `signIn()` at that point regardless of whether the tab was ever closed — so there's no scenario where a session silently persists for months without ever re-triggering the check.
- **No middleware/global route guard added** — the design was explicitly scoped to gate right at the post-`signIn()` moment, not every page load; this matches the approved spec and the repo's existing convention of no `middleware.ts` and per-layout client-side gating (e.g. `AdminLayout`).
- **Type consistency:** the `DEVICE#<deviceId>` item shape (`{ deviceId, createdAt, lastSeenAt }`) is identical in Task 3's trusted-refresh path, Task 3's OTP-issuance path (implicitly, when it later gets created by Task 4's verify), and Task 4's verify-success path.
