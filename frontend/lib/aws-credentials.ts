// Chỉ truyền credentials tường minh khi env có đủ key (chạy local với .env.local).
// Trên Amplify Hosting không set access key: trả về undefined để AWS SDK dùng
// default credential chain và nhận IAM compute role của app.
export const awsRegion = process.env.AWS_REGION || "ap-southeast-1";

export const awsCredentials =
  process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined;
