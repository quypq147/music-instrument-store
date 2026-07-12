process.env.AWS_REGION = "ap-southeast-1";
process.env.EVENT_BUS_NAME = "test-bus";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
process.env.TABLE_NAME = "test-table";
// Momo ở chế độ mock (bỏ verify chữ ký) giống môi trường dev
process.env.MOMO_SECRET_KEY = "dummy_momo_secret";
process.env.MOMO_ACCESS_KEY = "dummy_momo_access";
