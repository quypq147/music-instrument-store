import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

interface BackendProps extends cdk.StackProps {
  productsTable: cdk.aws_dynamodb.Table;
}

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BackendProps) {
    super(scope, id, props);

    // Định nghĩa hàm Lambda
    const productApiLambda = new lambda.Function(this, 'ProductApiFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../services/product-api'),
      environment: {
        TABLE_NAME: props.productsTable.tableName,
      }
    });

    // Cấp quyền cho Lambda đọc/ghi bảng DB
    props.productsTable.grantReadWriteData(productApiLambda);

    // Định nghĩa API Gateway
    const api = new apigateway.RestApi(this, 'ECommerceApi', {
      restApiName: 'Music Store API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      }
    });

    // Tạo endpoint: GET /products
    const productsResource = api.root.addResource('products');
    productsResource.addMethod('GET', new apigateway.LambdaIntegration(productApiLambda));

    const productResource = productsResource.addResource('{id}');
    productResource.addMethod('GET', new apigateway.LambdaIntegration(productApiLambda));
    
    // In URL ra màn hình console sau khi deploy thành công
    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
  }
}
