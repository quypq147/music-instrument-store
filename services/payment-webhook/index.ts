import type { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import { createHmac, timingSafeEqual } from "crypto";
import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";

const eventBridge = new EventBridgeClient({});
const eventBusName = process.env.EVENT_BUS_NAME;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripeSignatureToleranceSeconds = 300;

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

const getRawBody = (body: string, isBase64Encoded: boolean | undefined) =>
  isBase64Encoded ? Buffer.from(body, "base64").toString("utf8") : body;

const parseStripeSignatureHeader = (header: string) =>
  header.split(",").reduce(
    (parts, segment) => {
      const [key, ...valueParts] = segment.split("=");
      const value = valueParts.join("=");

      if (key === "t") {
        parts.timestamp = value;
      }

      if (key === "v1" && value) {
        parts.signatures.push(value);
      }

      return parts;
    },
    { timestamp: undefined as string | undefined, signatures: [] as string[] }
  );

const safeHexEqual = (expectedHex: string, actualHex: string) => {
  const expected = Buffer.from(expectedHex, "hex");
  const actual = Buffer.from(actualHex, "hex");

  return expected.length === actual.length && timingSafeEqual(expected, actual);
};

const verifyStripeSignature = (
  rawBody: string,
  signatureHeader: string,
  webhookSecret: string
) => {
  const { timestamp, signatures } =
    parseStripeSignatureHeader(signatureHeader);

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const timestampSeconds = Number(timestamp);

  if (!Number.isFinite(timestampSeconds)) {
    return false;
  }

  const ageSeconds = Math.abs(Date.now() / 1000 - timestampSeconds);

  if (ageSeconds > stripeSignatureToleranceSeconds) {
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedSignature = createHmac("sha256", webhookSecret)
    .update(signedPayload, "utf8")
    .digest("hex");

  return signatures.some((signature) =>
    safeHexEqual(expectedSignature, signature)
  );
};

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (!eventBusName) {
      throw new Error("EVENT_BUS_NAME environment variable is not set");
    }

    if (!stripeWebhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET environment variable is not set");
    }

    if (event.httpMethod !== "POST") {
      return jsonResponse(405, { message: "Method Not Allowed" });
    }

    if (event.path !== "/webhooks/stripe") {
      return jsonResponse(404, { message: "Route not found" });
    }

    const signature =
      event.headers["stripe-signature"] ?? event.headers["Stripe-Signature"];

    // TODO: Verify the raw request body with Stripe using signature and stripeWebhookSecret.
    if (!signature) {
      return jsonResponse(400, { message: "Missing Stripe signature" });
    }

    if (!event.body) {
      return jsonResponse(400, { message: "Missing webhook body" });
    }

    const rawBody = getRawBody(event.body, event.isBase64Encoded);

    if (!verifyStripeSignature(rawBody, signature, stripeWebhookSecret)) {
      return jsonResponse(400, { message: "Invalid Stripe signature" });
    }

    const payload = JSON.parse(rawBody);

    if (payload.type !== "checkout.session.completed") {
      return jsonResponse(200, { received: true, ignored: true });
    }

    const orderInfo = payload.data?.object ?? payload;

    const result = await eventBridge.send(
      new PutEventsCommand({
        Entries: [
          {
            EventBusName: eventBusName,
            Source: "com.musicstore.payment",
            DetailType: "PaymentSucceeded",
            Detail: JSON.stringify(orderInfo),
          },
        ],
      })
    );

    const failedEntryCount = result.FailedEntryCount ?? 0;

    if (failedEntryCount > 0) {
      throw new Error(
        `EventBridge PutEvents failed for ${failedEntryCount} entr${
          failedEntryCount === 1 ? "y" : "ies"
        }`
      );
    }

    return jsonResponse(200, { received: true });
  } catch (error) {
    console.error("Payment webhook handler failed", {
      error,
      requestId: event.requestContext.requestId,
      path: event.path,
      method: event.httpMethod,
    });

    return jsonResponse(500, { message: "Internal Server Error" });
  }
};
