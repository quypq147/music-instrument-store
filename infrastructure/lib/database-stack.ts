import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as backup from 'aws-cdk-lib/aws-backup';
import * as events from 'aws-cdk-lib/aws-events';

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
      pointInTimeRecovery: true, // Kích hoạt Point-in-Time Recovery (PITR) cho DynamoDB
      timeToLiveAttribute: 'ttl', // Dùng cho các item có vòng đời ngắn (vd. mã OTP xác minh thiết bị)
    });

    // Thêm Global Secondary Index (GSI1) cho Single Table Design
    this.mainTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI2: query sản phẩm theo category/type (TYPE#<type>) thay vì Scan toàn bảng
    this.mainTable.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
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

    // Khởi tạo AWS Backup Vault để lưu trữ các bản sao lưu
    const backupVault = new backup.BackupVault(this, 'MusicStoreBackupVault', {
      backupVaultName: 'MusicStoreBackupVault',
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Đổi thành RETAIN khi lên production thực tế
    });

    // Định nghĩa Kế hoạch sao lưu (Backup Plan)
    const backupPlan = new backup.BackupPlan(this, 'MusicStoreBackupPlan', {
      backupPlanName: 'MusicStoreBackupPlan',
    });

    // Quy tắc sao lưu hàng ngày (daily) - giữ lại trong 30 ngày
    backupPlan.addRule(new backup.BackupPlanRule({
      ruleName: 'DailyBackup',
      backupVault: backupVault,
      scheduleExpression: events.Schedule.expression('cron(0 0 * * ? *)'), // Chạy mỗi ngày lúc 00:00 UTC
      deleteAfter: cdk.Duration.days(30),
    }));

    // Quy tắc sao lưu hàng tuần (weekly) - giữ lại trong 90 ngày
    backupPlan.addRule(new backup.BackupPlanRule({
      ruleName: 'WeeklyBackup',
      backupVault: backupVault,
      scheduleExpression: events.Schedule.expression('cron(0 0 ? * SUN *)'), // Chạy mỗi Chủ Nhật lúc 00:00 UTC
      deleteAfter: cdk.Duration.days(90),
    }));

    // Gán DynamoDB Table vào Backup Plan
    backupPlan.addSelection('DynamoDbBackupSelection', {
      resources: [
        backup.BackupResource.fromDynamoDbTable(this.mainTable)
      ],
      backupSelectionName: 'DynamoDbTableSelection',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: this.mainTable.tableName,
      exportName: 'MainTableName',
    });

    new cdk.CfnOutput(this, 'ProductsBucketName', {
      value: this.productsBucket.bucketName,
      exportName: 'ProductsBucketName',
    });

    new cdk.CfnOutput(this, 'BackupVaultArn', {
      value: backupVault.backupVaultArn,
      exportName: 'MusicStoreBackupVaultArn',
    });

    new cdk.CfnOutput(this, 'BackupPlanArn', {
      value: backupPlan.backupPlanArn,
      exportName: 'MusicStoreBackupPlanArn',
    });
  }
}