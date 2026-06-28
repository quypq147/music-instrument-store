import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

interface BackendProps extends cdk.StackProps {
  productsTable: dynamodb.Table;
  userPool?: cognito.IUserPool;
}

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BackendProps) {
    super(scope, id, props);

    const productApiLambda = new lambda.Function(this, "ProductApiFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../services/product-api"),
      environment: {
        TABLE_NAME: props.productsTable.tableName,
      },
    });

    const orderApiLambda = new lambda.Function(this, "OrderApiFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../services/order-api"),
      environment: {
        TABLE_NAME: props.productsTable.tableName,
      },
    });

    props.productsTable.grantReadWriteData(productApiLambda);
    props.productsTable.grantWriteData(orderApiLambda);

    const api = new apigateway.RestApi(this, "ECommerceApi", {
      restApiName: "Music Store API",
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "DELETE"],
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
      },
    });

    // Create Cognito Authorizer if userPool is provided
    let authorizer: apigateway.CognitoUserPoolsAuthorizer | undefined;
    if (props.userPool) {
      authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, "ECommerceApiAuthorizer", {
        cognitoUserPools: [props.userPool],
      });
    }

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

    const ordersResource = api.root.addResource("orders");
    ordersResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(orderApiLambda)
    );

    new cdk.CfnOutput(this, "ApiUrl", { value: api.url });
  }
}
