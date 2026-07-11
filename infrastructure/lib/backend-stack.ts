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
import * as logs from "aws-cdk-lib/aws-logs";
import * as cw from "aws-cdk-lib/aws-cloudwatch";
import * as cw_actions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as sns from "aws-cdk-lib/aws-sns";
import * as sns_subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as ses from "aws-cdk-lib/aws-ses";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";
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

    // Campaign Queue tách riêng khỏi Notification Queue để gửi hàng loạt (marketing) không làm
    // nghẽn/chậm các thông báo giao dịch quan trọng (hủy đơn, xác nhận đơn).
    const campaignDLQ = new sqs.Queue(this, "CampaignDLQ", {
      queueName: "MusicStoreCampaignDLQ",
      retentionPeriod: cdk.Duration.days(14),
    });

    const campaignQueue = new sqs.Queue(this, "CampaignQueue", {
      queueName: "MusicStoreCampaignQueue",
      visibilityTimeout: cdk.Duration.seconds(30),
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: campaignDLQ,
      },
    });

    // 3. Định nghĩa các Lambda Functions

    // Product API Lambda
    const productApiLambda = new lambda.Function(this, "ProductApiFunction", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../services/product-api"),
      environment: {
        TABLE_NAME: props.productsTable.tableName,
        BUCKET_NAME: props.productsBucket.bucketName,
        EVENT_BUS_NAME: eventBus.eventBusName,
        USER_POOL_ID: props.userPool?.userPoolId || "",
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Cho phép Product API đồng bộ Cognito Group (Admin/Staff) khi admin đổi vai trò user
    // và đọc danh sách thành viên nhóm để hiển thị đúng quyền thật trong /admin/staff, /admin/users
    if (props.userPool) {
      productApiLambda.addToRolePolicy(
        new iam.PolicyStatement({
          actions: [
            "cognito-idp:AdminAddUserToGroup",
            "cognito-idp:AdminRemoveUserFromGroup",
            "cognito-idp:ListUsersInGroup",
            "cognito-idp:ListUsers",
            // Hủy liên kết Google/Facebook thật trong Cognito (POST /users/profile/unlink-provider)
            "cognito-idp:AdminDisableProviderForUser",
          ],
          resources: [props.userPool.userPoolArn],
        })
      );
    }

    // Order API Lambda (Đẩy đơn hàng vào SQS)
    const orderApiLambda = new lambda.Function(this, "OrderApiFunction", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../services/order-api"),
      environment: {
        ORDER_QUEUE_URL: orderQueue.queueUrl,
        TABLE_NAME: props.productsTable.tableName,
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Order Processing Lambda (Đọc SQS và lưu vào DynamoDB)
    const orderProcessingLambda = new lambda.Function(this, "OrderProcessingFunction", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../services/order-processing"),
      environment: {
        TABLE_NAME: props.productsTable.tableName,
        EVENT_BUS_NAME: eventBus.eventBusName,
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Checkout Service Lambda (Stripe integration)
    const checkoutApiLambda = new lambda.Function(this, "CheckoutApiFunction", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../services/checkout-service"),
      environment: {
        STRIPE_SECRET_KEY: props.stripeSecrets.secretValueFromJson("STRIPE_SECRET_KEY").toString(),
        TABLE_NAME: props.productsTable.tableName,
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // SES: identity email dùng làm "From" cho mọi email hệ thống gửi (thông báo đơn hàng, chiến dịch,
    // liên hệ). Đây là identity dạng "single email" — sau khi deploy, AWS tự gửi 1 email xác minh tới
    // địa chỉ này; phải bấm link xác minh trong email đó thì SES mới thực sự gửi được (không có bước
    // này, provider sẽ tự rơi vào "mock mode", xem services/notification/.../sesEmailProvider.ts).
    // Đặt cùng 1 giá trị ở đây và trong environment của các Lambda bên dưới để không bị lệch nhau.
    const sesFromEmail = process.env.SES_FROM_EMAIL || "no-reply@soniccart.dev";
    new ses.EmailIdentity(this, "SesFromEmailIdentity", {
      identity: ses.Identity.email(sesFromEmail),
    });
    new cdk.CfnOutput(this, "SesFromEmailVerificationNote", {
      value: `Kiểm tra hộp thư ${sesFromEmail} và bấm link xác minh AWS SES gửi tới sau khi deploy stack này.`,
    });

    // Notification Service Lambda (Lắng nghe NotificationQueue hoặc gọi đồng bộ)
    const notificationApiLambda = new lambda.Function(this, "NotificationApiFunction", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../services/notification"),
      environment: {
        TABLE_NAME: props.productsTable.tableName,
        SES_FROM_EMAIL: sesFromEmail,
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // productApiLambda gọi thẳng (Invoke) vào notificationApiLambda để gửi email OTP xác minh
    // thiết bị đồng bộ, không qua EventBridge/SQS (độ trễ khó đoán) hay route API Gateway công khai.
    productApiLambda.addEnvironment("NOTIFICATION_FUNCTION_NAME", notificationApiLambda.functionName);
    notificationApiLambda.grantInvoke(productApiLambda);

    // Campaign Sender Lambda (tiêu thụ CampaignQueue, dùng chung code với NotificationApiFunction
    // nhưng là Lambda riêng để tách biệt log/scaling với luồng giao dịch)
    const campaignSenderLambda = new lambda.Function(this, "CampaignSenderFunction", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.campaignHandler",
      code: lambda.Code.fromAsset("../services/notification"),
      environment: {
        TABLE_NAME: props.productsTable.tableName,
        SES_FROM_EMAIL: sesFromEmail,
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Campaign API Lambda (Admin tạo/liệt kê chiến dịch)
    const campaignApiLambda = new lambda.Function(this, "CampaignApiFunction", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../services/campaign-api"),
      environment: {
        TABLE_NAME: props.productsTable.tableName,
        EVENT_BUS_NAME: eventBus.eventBusName,
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Campaign Fan-out Lambda (EventBridge trigger, chia batch khách hàng vào CampaignQueue)
    const campaignFanOutLambda = new lambda.Function(this, "CampaignFanOutFunction", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../services/campaign-fanout"),
      environment: {
        TABLE_NAME: props.productsTable.tableName,
        CAMPAIGN_QUEUE_URL: campaignQueue.queueUrl,
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Contact API Lambda (form Liên Hệ công khai, gửi email qua SES)
    const contactApiLambda = new lambda.Function(this, "ContactApiFunction", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../services/contact-api"),
      environment: {
        SES_FROM_EMAIL: sesFromEmail,
        CONTACT_INBOX_EMAIL: process.env.CONTACT_INBOX_EMAIL || "support@nhomtttnmusic.vn",
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Stripe Payment Webhook Lambda
    const paymentWebhookLambda = new lambda.Function(this, "PaymentWebhookFunction", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../services/payment-webhook"),
      environment: {
        STRIPE_WEBHOOK_SECRET: props.stripeSecrets.secretValueFromJson("STRIPE_WEBHOOK_SECRET").toString(),
        EVENT_BUS_NAME: eventBus.eventBusName,
        TABLE_NAME: props.productsTable.tableName,
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
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

    campaignSenderLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(campaignQueue, {
        batchSize: 10,
      })
    );

    // 5. Tạo EventBridge Rules chuyển tiếp sự kiện sang Notification SQS Queue
    const orderPlacedRule = new events.Rule(this, "OrderPlacedRule", {
      eventBus,
      eventPattern: {
        source: ["com.musicstore.order"],
        detailType: ["OrderPlaced", "OrderUpdated", "OrderCancelled"],
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

    // Campaign là hành động one-shot (không cần buffer) nên trigger thẳng Lambda fan-out thay vì qua SQS
    const campaignRequestedRule = new events.Rule(this, "CampaignRequestedRule", {
      eventBus,
      eventPattern: {
        source: ["com.musicstore.campaign"],
        detailType: ["CampaignRequested"],
      },
    });
    campaignRequestedRule.addTarget(new targets.LambdaFunction(campaignFanOutLambda));

    // 6. Cấp quyền IAM cho các tài nguyên
    props.productsTable.grantReadWriteData(productApiLambda);
    props.productsTable.grantReadWriteData(orderApiLambda); // Order API cần đọc/ghi coupon (validate + tăng usageCount)
    props.productsTable.grantReadWriteData(orderProcessingLambda); // Order Processor cần ghi DynamoDB
    props.productsTable.grantReadWriteData(checkoutApiLambda); // Checkout API cần cập nhật kho sản phẩm
    props.productsTable.grantReadWriteData(paymentWebhookLambda); // Payment Webhook cần cập nhật kho sản phẩm
    props.productsBucket.grantReadWrite(productApiLambda);
    props.stripeSecrets.grantRead(checkoutApiLambda);
    eventBus.grantPutEventsTo(productApiLambda);
    props.stripeSecrets.grantRead(paymentWebhookLambda);

    orderQueue.grantSendMessages(orderApiLambda); // API Gateway Lambda cần quyền gửi tới OrderQueue
    eventBus.grantPutEventsTo(paymentWebhookLambda);
    eventBus.grantPutEventsTo(orderProcessingLambda); // Order Processor cần quyền bắn event tới EventBridge

    props.productsTable.grantReadWriteData(notificationApiLambda); // Ghi bản ghi idempotency EVENT#{eventId}
    notificationApiLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ses:SendEmail", "ses:SendRawEmail"],
        resources: ["*"],
      })
    );
    notificationApiLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["sns:Publish"],
        resources: ["*"],
      })
    );

    props.productsTable.grantReadWriteData(campaignSenderLambda); // Idempotency EVENT#{eventId} cho từng lượt gửi campaign
    campaignSenderLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ses:SendEmail", "ses:SendRawEmail"],
        resources: ["*"],
      })
    );
    campaignSenderLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["sns:Publish"],
        resources: ["*"],
      })
    );

    props.productsTable.grantReadWriteData(campaignApiLambda); // Ghi/đọc bản ghi CAMPAIGN#{id}
    eventBus.grantPutEventsTo(campaignApiLambda);

    props.productsTable.grantReadData(campaignFanOutLambda); // Scan đơn hàng để lấy danh sách khách hàng
    campaignQueue.grantSendMessages(campaignFanOutLambda);

    contactApiLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ses:SendEmail", "ses:SendRawEmail"],
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
      deployOptions: {
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
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

    // productApiLambda phục vụ rất nhiều route trên cùng 1 API Gateway; tắt allowTestInvoke
    // để tránh resource policy của Lambda vượt giới hạn 20KB (mỗi route x2 statement: prod + test-invoke).
    const productApiIntegration = new apigateway.LambdaIntegration(productApiLambda, {
      allowTestInvoke: false,
    });

    // Route: /products
    const productsResource = api.root.addResource("products");
    productsResource.addMethod(
      "GET",
      productApiIntegration
    );
    productsResource.addMethod(
      "POST",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // Route: /products/{id}
    const productResource = productsResource.addResource("{id}");
    productResource.addMethod(
      "GET",
      productApiIntegration
    );
    productResource.addMethod(
      "PUT",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );
    productResource.addMethod(
      "DELETE",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // Route: /products/{id}/view
    const viewResource = productResource.addResource("view");
    viewResource.addMethod(
      "POST",
      productApiIntegration
    );

    // Route: /products/{id}/ratings
    const ratingsResource = productResource.addResource("ratings");
    ratingsResource.addMethod(
      "GET",
      productApiIntegration
    );
    ratingsResource.addMethod(
      "POST",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // Route: /products/{id}/ratings/upload-url (sinh presigned POST để đính kèm ảnh đánh giá)
    const ratingsUploadUrlResource = ratingsResource.addResource("upload-url");
    ratingsUploadUrlResource.addMethod(
      "POST",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // Route: /products/{id}/image-upload-url (sinh presigned POST để admin upload ảnh sản phẩm)
    const productImageUploadUrlResource = productResource.addResource("image-upload-url");
    productImageUploadUrlResource.addMethod(
      "POST",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // Route: /products/{id}/comments
    const commentsResource = productResource.addResource("comments");
    commentsResource.addMethod(
      "GET",
      productApiIntegration
    );
    commentsResource.addMethod(
      "POST",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // Route: /users
    const usersResource = api.root.addResource("users");
    usersResource.addMethod(
      "GET",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // Route: /users/{userId}
    const userResource = usersResource.addResource("{userId}");
    userResource.addMethod(
      "PUT",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );
    userResource.addMethod(
      "DELETE",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // Route: /users/profile
    const profileResource = usersResource.addResource("profile");
    profileResource.addMethod(
      "GET",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );
    profileResource.addMethod(
      "PUT",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // Route: /users/profile/unlink-provider (hủy liên kết Google/Facebook thật trong Cognito)
    const unlinkProviderResource = profileResource.addResource("unlink-provider");
    unlinkProviderResource.addMethod(
      "POST",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // Route: /users/profile/avatar-upload-url (sinh presigned POST để upload ảnh đại diện)
    const avatarUploadUrlResource = profileResource.addResource("avatar-upload-url");
    avatarUploadUrlResource.addMethod(
      "POST",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

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

    // Route: /users/orders
    const userOrdersResource = usersResource.addResource("orders");
    userOrdersResource.addMethod(
      "GET",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // Route: /users/wishlist
    const wishlistResource = usersResource.addResource("wishlist");
    wishlistResource.addMethod(
      "GET",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );
    wishlistResource.addMethod(
      "POST",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // Route: /users/wishlist/{productId}
    const wishlistProductResource = wishlistResource.addResource("{productId}");
    wishlistProductResource.addMethod(
      "DELETE",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // Route: /orders
    // POST /orders (User - blueprint §7: đơn hàng phải gắn với người dùng đã đăng nhập,
    // userId/email được order-api lấy từ JWT claims thay vì tin body của client)
    const ordersResource = api.root.addResource("orders");
    ordersResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(orderApiLambda),
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // GET /orders (Admin/Staff only)
    ordersResource.addMethod(
      "GET",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // PUT /orders/{id} (Admin/Staff only)
    const orderIdResource = ordersResource.addResource("{id}");
    orderIdResource.addMethod(
      "PUT",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // GET /orders/{id} (chủ đơn hàng hoặc Admin/Staff - blueprint §7)
    orderIdResource.addMethod(
      "GET",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // Route: /orders/{id}/confirm-receipt (PUT - Khách hàng tự xác nhận đã nhận hàng)
    const orderConfirmReceiptResource = orderIdResource.addResource("confirm-receipt");
    orderConfirmReceiptResource.addMethod(
      "PUT",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // Route: /orders/{id}/history (GET - Staff hoặc chủ đơn hàng)
    const orderHistoryResource = orderIdResource.addResource("history");
    orderHistoryResource.addMethod(
      "GET",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // Route: /coupons
    const couponsResource = api.root.addResource("coupons");
    couponsResource.addMethod(
      "POST",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // GET /coupons (Admin/Staff liệt kê toàn bộ coupon)
    couponsResource.addMethod(
      "GET",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // Route: /coupons/{code} (GET - public preview/validate)
    const couponCodeResource = couponsResource.addResource("{code}");
    couponCodeResource.addMethod(
      "GET",
      productApiIntegration
    );

    // PUT/DELETE /coupons/{code} (Admin/Staff sửa hoặc xóa coupon)
    couponCodeResource.addMethod(
      "PUT",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );
    couponCodeResource.addMethod(
      "DELETE",
      productApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // Route: /checkout
    const checkoutResource = api.root.addResource("checkout");
    checkoutResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(checkoutApiLambda)
    );

    // Route: /notifications
    const notificationsResource = api.root.addResource("notifications");
    notificationsResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(notificationApiLambda)
    );

    // Route: /campaigns (Admin/Staff only - kiểm tra Cognito group ngay trong CampaignApiFunction)
    const campaignsResource = api.root.addResource("campaigns");
    const campaignApiIntegration = new apigateway.LambdaIntegration(campaignApiLambda);
    campaignsResource.addMethod(
      "POST",
      campaignApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );
    campaignsResource.addMethod(
      "GET",
      campaignApiIntegration,
      authorizer ? {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      } : undefined
    );

    // Route: /contact (public - form Liên Hệ)
    const contactResource = api.root.addResource("contact");
    contactResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(contactApiLambda)
    );

    // Route: /webhooks/stripe
    const webhooksResource = api.root.addResource("webhooks");
    const stripeWebhookResource = webhooksResource.addResource("stripe");
    stripeWebhookResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(paymentWebhookLambda)
    );

    // Route: /webhooks/momo
    const momoWebhookResource = webhooksResource.addResource("momo");
    momoWebhookResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(paymentWebhookLambda)
    );

    new cdk.CfnOutput(this, "ApiUrl", { value: api.url });
    new cdk.CfnOutput(this, "OrderQueueUrl", { value: orderQueue.queueUrl });
    new cdk.CfnOutput(this, "NotificationQueueUrl", { value: notificationQueue.queueUrl });

    // 9. Cấu hình Giám sát và Cảnh báo (CloudWatch & SNS Alarms)
    const alarmsTopic = new sns.Topic(this, "SystemAlarmsTopic", {
      topicName: "MusicStoreSystemAlarms",
      displayName: "Music Store System Alarms",
    });
    alarmsTopic.addSubscription(new sns_subscriptions.EmailSubscription("admin@example.com"));

    // Alarm cho các Dead Letter Queues (DLQ)
    const orderDlqAlarm = new cw.Alarm(this, "OrderDLQAlarm", {
      metric: orderDLQ.metricApproximateNumberOfMessagesVisible(),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription: "Cảnh báo khi có tin nhắn bị lỗi trong Order DLQ",
    });
    orderDlqAlarm.addAlarmAction(new cw_actions.SnsAction(alarmsTopic));

    const notificationDlqAlarm = new cw.Alarm(this, "NotificationDLQAlarm", {
      metric: notificationDLQ.metricApproximateNumberOfMessagesVisible(),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription: "Cảnh báo khi có tin nhắn bị lỗi trong Notification DLQ",
    });
    notificationDlqAlarm.addAlarmAction(new cw_actions.SnsAction(alarmsTopic));

    // Alarm cho API Gateway 5XX Errors
    const api5xxAlarm = new cw.Alarm(this, "Api5xxAlarm", {
      metric: api.metricServerError({
        period: cdk.Duration.minutes(5),
        statistic: "Sum",
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription: "Cảnh báo khi API Gateway trả về lỗi server 5XX",
    });
    api5xxAlarm.addAlarmAction(new cw_actions.SnsAction(alarmsTopic));

    // Helper tạo Alarm cho lỗi Lambda
    const createLambdaErrorAlarm = (func: lambda.Function, name: string) => {
      const alarm = new cw.Alarm(this, `${name}ErrorAlarm`, {
        metric: func.metricErrors({
          period: cdk.Duration.minutes(5),
          statistic: "Sum",
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator: cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        alarmDescription: `Cảnh báo khi Lambda function ${name} gặp lỗi`,
      });
      alarm.addAlarmAction(new cw_actions.SnsAction(alarmsTopic));
    };

    // Tạo cảnh báo lỗi cho các Lambda Functions quan trọng
    createLambdaErrorAlarm(orderProcessingLambda, "OrderProcessing");
    createLambdaErrorAlarm(checkoutApiLambda, "CheckoutApi");
    createLambdaErrorAlarm(paymentWebhookLambda, "PaymentWebhook");

    // 10. AWS WAF cho API Gateway (blueprint §10: managed rules + rate-based rule).
    // Web ACL của Amplify/CloudFront quản lý qua console Amplify; Web ACL này bảo vệ
    // trực tiếp REST API ở tầng regional.
    const apiWebAcl = new wafv2.CfnWebACL(this, "ApiWebAcl", {
      name: "MusicStoreApiWebAcl",
      scope: "REGIONAL",
      defaultAction: { allow: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "MusicStoreApiWebAcl",
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: "AWSManagedRulesCommonRuleSet",
          priority: 0,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesCommonRuleSet",
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "CommonRuleSet",
            sampledRequestsEnabled: true,
          },
        },
        {
          name: "AWSManagedRulesAmazonIpReputationList",
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesAmazonIpReputationList",
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "IpReputationList",
            sampledRequestsEnabled: true,
          },
        },
        {
          name: "RateLimitPerIp",
          priority: 2,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              // Giới hạn mỗi IP 2000 request / 5 phút — đủ rộng cho demo/workshop,
              // vẫn chặn được bot spam và brute-force.
              limit: 2000,
              aggregateKeyType: "IP",
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "RateLimitPerIp",
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    new wafv2.CfnWebACLAssociation(this, "ApiWebAclAssociation", {
      resourceArn: api.deploymentStage.stageArn,
      webAclArn: apiWebAcl.attrArn,
    });
  }
}

