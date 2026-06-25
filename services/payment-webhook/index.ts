import type { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";

const eventBridge = new EventBridgeClient({});
const eventBusName = process.env.EVENT_BUS_NAME;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

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

    const payload = JSON.parse(
      event.isBase64Encoded
        ? Buffer.from(event.body, "base64").toString("utf8")
        : event.body
    );

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
