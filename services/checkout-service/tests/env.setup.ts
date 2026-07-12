process.env.AWS_REGION = "ap-southeast-1";
process.env.TABLE_NAME = "test-table";
// Key giả dạng "dummy" để handler đi nhánh mock của Stripe/Momo — unit test
// không gọi cổng thanh toán thật.
process.env.STRIPE_SECRET_KEY = "dummy_stripe_key";
process.env.MOMO_PARTNER_CODE = "dummy_partner";
process.env.MOMO_SECRET_KEY = "";
