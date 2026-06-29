import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as iam from "aws-cdk-lib/aws-iam";
import * as events from "aws-cdk-lib/aws-events";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as targets from "aws-cdk-lib/aws-events-targets";
import { Construct } from "constructs";

interface BackendProps extends cdk.StackProps {
  productsTable: dynamodb.Table;
  productsBucket: s3.IBucket;
  userPool?: cognito.IUserPool;
  stripeSecrets: secretsmanager.ISecret;
}

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BackendProps) {
    super(scope, id, props);

    // 1. Tạo Event Bus cho Event-Driven Flows (PaymentWebhook -> EventBridge)
    const eventBus = new events.EventBus(this, "MusicStoreEventBus", {
      eventBusName: "MusicStoreEventBus",
    });

    // 2. Tạo các SQS Queues và Dead Letter Queues (DLQs)
    const orderDLQ = new sqs.Queue(this, "OrderDLQ", {
      queueName: "MusicStoreOrderDLQ",
      retentionPeriod: cdk.Duration.days(14),
    });

    const orderQueue = new sqs.Queue(this, "OrderQueue", {
      queueName: "MusicStoreOrderQueue",
      visibilityTimeout: cdk.Duration.seconds(30),
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: orderDLQ,
      },
    });

    const notificationDLQ = new sqs.Queue(this, "NotificationDLQ", {
      queueName: "MusicStoreNotificationDLQ",
      retentionPeriod: cdk.Duration.days(14),
    });

    const notificationQueue = new sqs.Queue(this, "NotificationQueue", {
      queueName: "MusicStoreNotificationQueue",
      visibilityTimeout: cdk.Duration.seconds(30),
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: notificationDLQ,
      },
    });

    // 3. Định nghĩa các Lambda Functions

    // Product API Lambda
    const productApiLambda = new lambda.Function(this, "ProductApiFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../services/product-api"),
      environment: {
        TABLE_NAME: props.productsTable.tableName,
        BUCKET_NAME: props.productsBucket.bucketName,
      },
    });

    // Order API Lambda (Đẩy đơn hàng vào SQS)
    const orderApiLambda = new lambda.Function(this, "OrderApiFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../services/order-api"),
      environment: {
        ORDER_QUEUE_URL: orderQueue.queueUrl,
      },
    });

    // Order Processing Lambda (Đọc SQS và lưu vào DynamoDB)
    const orderProcessingLambda = new lambda.Function(this, "OrderProcessingFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../services/order-processing"),
      environment: {
        TABLE_NAME: props.productsTable.tableName,
        EVENT_BUS_NAME: eventBus.eventBusName,
      },
    });

    // Checkout Service Lambda (Stripe integration)
    const checkoutApiLambda = new lambda.Function(this, "CheckoutApiFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../services/checkout-service"),
      environment: {
        STRIPE_SECRET_KEY: props.stripeSecrets.secretValueFromJson("STRIPE_SECRET_KEY").toString(),
      },
    });

    // Chatbot AI Lambda (Amazon Lex integration)
    const chatbotApiLambda = new lambda.Function(this, "ChatbotApiFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "chatBotHandler.handler",
      code: lambda.Code.fromAsset("../services/chatbot-backend"),
      environment: {
        LEX_BOT_ID: process.env.LEX_BOT_ID || "dummy-bot-id",
        LEX_BOT_ALIAS_ID: process.env.LEX_BOT_ALIAS_ID || "dummy-alias-id",
      },
    });

    // Notification Service Lambda (Lắng nghe NotificationQueue hoặc gọi đồng bộ)
    const notificationApiLambda = new lambda.Function(this, "NotificationApiFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../services/notification"),
      environment: {
        TABLE_NAME: props.productsTable.tableName,
      },
    });

    // Stripe Payment Webhook Lambda
    const paymentWebhookLambda = new lambda.Function(this, "PaymentWebhookFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../services/payment-webhook"),
      environment: {
        STRIPE_WEBHOOK_SECRET: props.stripeSecrets.secretValueFromJson("STRIPE_WEBHOOK_SECRET").toString(),
        EVENT_BUS_NAME: eventBus.eventBusName,
      },
    });

    // 4. Đăng ký SQS triggers cho Lambda Functions
    orderProcessingLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(orderQueue, {
        batchSize: 10,
      })
    );

    notificationApiLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(notificationQueue, {
        batchSize: 10,
      })
    );

    // 5. Tạo EventBridge Rules chuyển tiếp sự kiện sang Notification SQS Queue
    const orderPlacedRule = new events.Rule(this, "OrderPlacedRule", {
      eventBus,
      eventPattern: {
        source: ["com.musicstore.order"],
        detailType: ["OrderPlaced"],
      },
    });
    orderPlacedRule.addTarget(new targets.SqsQueue(notificationQueue));

    const paymentSucceededRule = new events.Rule(this, "PaymentSucceededRule", {
      eventBus,
      eventPattern: {
        source: ["com.musicstore.payment"],
        detailType: ["PaymentSucceeded"],
      },
    });
    paymentSucceededRule.addTarget(new targets.SqsQueue(notificationQueue));

    // 6. Cấp quyền IAM cho các tài nguyên
    props.productsTable.grantReadWriteData(productApiLambda);
    props.productsTable.grantReadWriteData(orderProcessingLambda); // Order Processor cần ghi DynamoDB
    props.productsBucket.grantReadWrite(productApiLambda);
    props.stripeSecrets.grantRead(checkoutApiLambda);
    props.stripeSecrets.grantRead(paymentWebhookLambda);
    
    orderQueue.grantSendMessages(orderApiLambda); // API Gateway Lambda cần quyền gửi tới OrderQueue
    eventBus.grantPutEventsTo(paymentWebhookLambda);
    eventBus.grantPutEventsTo(orderProcessingLambda); // Order Processor cần quyền bắn event tới EventBridge

    // Quyền gọi Lex V2 cho Chatbot Lambda
    chatbotApiLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["lex:RecognizeText"],
        resources: ["*"],
      })
    );

    // 7. Khởi tạo API Gateway REST API
    const api = new apigateway.RestApi(this, "ECommerceApi", {
      restApiName: "Music Store API",
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "DELETE"],
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
      },
    });

    // Tạo Cognito Authorizer
    let authorizer: apigateway.CognitoUserPoolsAuthorizer | undefined;
    if (props.userPool) {
      authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, "ECommerceApiAuthorizer", {
        cognitoUserPools: [props.userPool],
      });
    }

    // 8. Cấu hình các Resource và Method cho API Gateway

    // Route: /products
    const productsResource = api.root.addResource("products");
    productsResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(productApiLambda)
    );
    productsResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(productApiLambda),
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // Route: /products/{id}
    const productResource = productsResource.addResource("{id}");
    productResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(productApiLambda)
    );
    productResource.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(productApiLambda),
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );
    productResource.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(productApiLambda),
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // Route: /products/{id}/ratings
    const ratingsResource = productResource.addResource("ratings");
    ratingsResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(productApiLambda)
    );
    ratingsResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(productApiLambda),
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // Route: /products/{id}/comments
    const commentsResource = productResource.addResource("comments");
    commentsResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(productApiLambda)
    );
    commentsResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(productApiLambda),
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // Route: /users
    const usersResource = api.root.addResource("users");

    // Route: /users/profile
    const profileResource = usersResource.addResource("profile");
    profileResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(productApiLambda),
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );
    profileResource.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(productApiLambda),
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // Route: /users/wishlist
    const wishlistResource = usersResource.addResource("wishlist");
    wishlistResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(productApiLambda),
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );
    wishlistResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(productApiLambda),
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // Route: /users/wishlist/{productId}
    const wishlistProductResource = wishlistResource.addResource("{productId}");
    wishlistProductResource.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(productApiLambda),
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // Route: /orders
    const ordersResource = api.root.addResource("orders");
    ordersResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(orderApiLambda)
    );

    // Route: /checkout
    const checkoutResource = api.root.addResource("checkout");
    checkoutResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(checkoutApiLambda)
    );

    // Route: /chat
    const chatResource = api.root.addResource("chat");
    chatResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(chatbotApiLambda),
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // Route: /notifications
    const notificationsResource = api.root.addResource("notifications");
    notificationsResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(notificationApiLambda)
    );

    // Route: /webhooks/stripe
    const webhooksResource = api.root.addResource("webhooks");
    const stripeWebhookResource = webhooksResource.addResource("stripe");
    stripeWebhookResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(paymentWebhookLambda)
    );

    new cdk.CfnOutput(this, "ApiUrl", { value: api.url });
    new cdk.CfnOutput(this, "OrderQueueUrl", { value: orderQueue.queueUrl });
    new cdk.CfnOutput(this, "NotificationQueueUrl", { value: notificationQueue.queueUrl });
  }
}

