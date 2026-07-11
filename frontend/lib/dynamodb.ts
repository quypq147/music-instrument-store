import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { awsRegion, awsCredentials } from "./aws-credentials";

const client = new DynamoDBClient({
  region: awsRegion,
  credentials: awsCredentials,
});

export const ddbDocClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

export const TABLE_NAME =
  process.env.DYNAMODB_TABLE_NAME ||
  "MusicStoreDatabaseStack-dev-MusicStoreMainTable79B09B43-1RLNIV6RO7DCR";
