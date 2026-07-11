import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface AuthStackProps extends cdk.StackProps {
  productsTable: dynamodb.Table;
  googleClientId?: string;
  googleClientSecret?: string;
  facebookClientId?: string;
  facebookClientSecret?: string;
  cognitoDomainPrefix?: string;
  callbackUrls?: string[];
  logoutUrls?: string[];
}

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    // 1. Tạo Cognito User Pool (Nơi lưu trữ User)
    this.userPool = new cognito.UserPool(this, 'MusicStoreUserPool', {
      userPoolName: 'MusicStoreUsers',
      selfSignUpEnabled: true,
      signInAliases: { email: true }, // Cho phép đăng nhập bằng email
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Lưu ý: Đổi thành RETAIN khi lên Production thực tế
    });

    // 1b. Cognito Lambda Trigger: tuỳ biến nội dung email OTP (đăng ký / quên mật khẩu)
    const customMessageFn = new lambda.Function(this, 'CustomMessageTriggerFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../services/auth-triggers'),
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });
    this.userPool.addTrigger(cognito.UserPoolOperation.CUSTOM_MESSAGE, customMessageFn);

    // 1c. Cognito Lambda Trigger: tự tạo bản ghi PROFILE trong DynamoDB ngay khi xác nhận đăng ký
    const postConfirmationFn = new lambda.Function(this, 'PostConfirmationTriggerFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../services/auth-post-confirmation'),
      environment: {
        TABLE_NAME: props.productsTable.tableName,
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });
    props.productsTable.grantWriteData(postConfirmationFn);
    this.userPool.addTrigger(cognito.UserPoolOperation.POST_CONFIRMATION, postConfirmationFn);

    // 1c'. Cognito Lambda Trigger: hợp nhất đăng nhập Google/Facebook với tài khoản email
    // cùng địa chỉ (AdminLinkProviderForUser) để mỗi người dùng chỉ có một `sub` duy nhất —
    // profile/đơn hàng/wishlist không bị tách đôi khi đổi cách đăng nhập.
    const preSignUpFn = new lambda.Function(this, 'PreSignUpTriggerFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../services/auth-pre-signup'),
      environment: {
        TABLE_NAME: props.productsTable.tableName,
      },
      // Cognito chỉ chờ trigger tối đa 5 giây; để timeout mặc định 3s dễ bị cắt giữa chừng
      // khi phải gọi liên tiếp ListUsers + AdminCreateUser + AdminLinkProviderForUser.
      timeout: cdk.Duration.seconds(5),
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });
    props.productsTable.grantWriteData(preSignUpFn);
    // Không dùng this.userPool.grant(): policy đó tham chiếu ARN của pool trong khi pool
    // lại tham chiếu Lambda (trigger) và Lambda DependsOn chính DefaultPolicy — tạo vòng
    // phụ thuộc CloudFormation. Dựng ARN wildcard thủ công để cắt vòng (Lambda này chỉ
    // được Cognito của chính account gọi nên phạm vi rộng hơn 1 pool là chấp nhận được).
    preSignUpFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'cognito-idp:ListUsers',
          'cognito-idp:AdminLinkProviderForUser',
          'cognito-idp:AdminCreateUser',
          'cognito-idp:AdminSetUserPassword',
        ],
        resources: [
          cdk.Stack.of(this).formatArn({
            service: 'cognito-idp',
            resource: 'userpool',
            resourceName: '*',
          }),
        ],
      })
    );
    this.userPool.addTrigger(cognito.UserPoolOperation.PRE_SIGN_UP, preSignUpFn);

    // 1d. Tạo Cognito Domain cho Hosted UI (nếu có prefix)
    if (props.cognitoDomainPrefix) {
      this.userPool.addDomain('CognitoDomain', {
        cognitoDomain: {
          domainPrefix: props.cognitoDomainPrefix,
        },
      });
    }
    // 1e. Cấu hình Google Identity Provider (IdP)
    let googleProvider: cognito.UserPoolIdentityProviderGoogle | undefined;
    if (props.googleClientId && props.googleClientSecret) {
      googleProvider = new cognito.UserPoolIdentityProviderGoogle(this, 'GoogleProvider', {
        userPool: this.userPool,
        clientId: props.googleClientId,
        clientSecretValue: cdk.SecretValue.unsafePlainText(props.googleClientSecret),
        attributeMapping: {
          email: cognito.ProviderAttribute.GOOGLE_EMAIL,
          fullname: cognito.ProviderAttribute.GOOGLE_NAME,
          emailVerified: cognito.ProviderAttribute.GOOGLE_EMAIL_VERIFIED,
        },
        scopes: ['profile', 'email', 'openid'],
      });
    }
    // 1f. Cấu hình Facebook Identity Provider (IdP)
    let facebookProvider: cognito.UserPoolIdentityProviderFacebook | undefined;
    if (props.facebookClientId && props.facebookClientSecret) {
      facebookProvider = new cognito.UserPoolIdentityProviderFacebook(this, 'FacebookProvider', {
        userPool: this.userPool,
        clientId: props.facebookClientId,
        clientSecret: props.facebookClientSecret,
        attributeMapping: {
          email: cognito.ProviderAttribute.FACEBOOK_EMAIL,
          fullname: cognito.ProviderAttribute.FACEBOOK_NAME,
        },
        scopes: ['public_profile', 'email'],
      });
    }

    // 2. Tạo App Client cho Next.js Frontend (hỗ trợ OAuth + Social Providers)
    const supportedProviders = [cognito.UserPoolClientIdentityProvider.COGNITO];
    if (googleProvider) supportedProviders.push(cognito.UserPoolClientIdentityProvider.GOOGLE);
    if (facebookProvider) supportedProviders.push(cognito.UserPoolClientIdentityProvider.FACEBOOK);

    this.userPoolClient = new cognito.UserPoolClient(this, 'MusicStoreUserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: 'WebClient',
      generateSecret: false, // Frontend (Next.js) public client không dùng secret
      supportedIdentityProviders: supportedProviders,
      oAuth: props.cognitoDomainPrefix ? {
        callbackUrls: props.callbackUrls || ['http://localhost:3000/'],
        logoutUrls: props.logoutUrls || ['http://localhost:3000/'],
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
          cognito.OAuthScope.COGNITO_ADMIN,
        ],
      } : undefined,
    });

    // Thiết lập explicit dependencies để tránh race condition khi deploy
    if (googleProvider) {
      this.userPoolClient.node.addDependency(googleProvider);
    }
    if (facebookProvider) {
      this.userPoolClient.node.addDependency(facebookProvider);
    }

    // 3. Xuất giá trị (Outputs) để dùng cho Frontend và API Gateway
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      exportName: 'CognitoUserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      exportName: 'CognitoClientId',
    });
  }
}