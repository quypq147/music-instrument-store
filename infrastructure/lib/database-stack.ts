import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class DatabaseStack extends cdk.Stack {
  public readonly mainTable: dynamodb.Table;
  public readonly productsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Khởi tạo DynamoDB Single Table
    this.mainTable = new dynamodb.Table(this, 'MusicStoreMainTable', {
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Tối ưu chi phí serverless
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Xóa table khi destroy stack (chỉ dùng cho Dev)
    });

    // Khởi tạo S3 Bucket lưu trữ hình ảnh sản phẩm
    this.productsBucket = new s3.Bucket(this, 'MusicStoreProductsBucket', {
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // Tự động xóa các file trong bucket khi destroy stack
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: this.mainTable.tableName,
      exportName: 'MainTableName',
    });

    new cdk.CfnOutput(this, 'ProductsBucketName', {
      value: this.productsBucket.bucketName,
      exportName: 'ProductsBucketName',
    });
  }
}