# Music Instrument Store - AWS Serverless Platform

Dự án nền tảng thương mại điện tử bán nhạc cụ sử dụng kiến trúc **AWS Serverless** và **Next.js**. Dự án được thiết kế với khả năng mở rộng cao, bảo mật, xử lý thanh toán an toàn qua Stripe và tích hợp AI Chatbot.

## Đội Ngũ Phát Triển

Nhóm gồm 5 thành viên:

1. **[Tên Thành Viên 1]** - Team Lead / Solution Architect
2. **[Tên Thành Viên 2]** - Frontend Developer (Next.js / UI)
3. **[Tên Thành Viên 3]** - Backend / AWS Serverless Developer
4. **[Tên Thành Viên 4]** - Database & Data Engineer (DynamoDB / S3)
5. **[Tên Thành Viên 5]** - DevOps & QA / Security (Amplify / WAF / IAM)

## Tổng Quan

Music Instrument Store là dự án thương mại điện tử bán saxophone và phụ kiện. Ứng dụng hiện tại là web app Next.js trong `frontend`, gồm các chức năng xem sản phẩm, tìm kiếm và lọc sản phẩm, trang chi tiết sản phẩm, giỏ hàng, đơn hàng, trang quản trị, đăng nhập, đăng ký và API chatbot AI.

Repository cũng có các thư mục ban đầu cho backend và infrastructure mục tiêu:

- `services/` chứa các thư mục placeholder cho product, checkout, chatbot và notification services.
- `infrastructure/` chứa bộ khung AWS CDK, bao gồm SecurityStack để lưu thông tin Stripe trong AWS Secrets Manager.

## Công Nghệ Sử Dụng

- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS.
- **Hosting & CI/CD:** AWS Amplify.
- **Authentication:** Amazon Cognito, JWT, protected routes.
- **Database & Storage:** Amazon DynamoDB, Amazon S3.
- **Payment:** Stripe, Idempotency-Key, webhook validation.
- **Messaging & Event-driven:** Amazon SQS, DLQ, Amazon EventBridge.
- **AI/Bot:** Amazon Lex và API chatbot hiện tại dùng OpenAI API.
- **Security & Observability:** AWS WAF, GuardDuty, CloudWatch, CloudTrail, X-Ray, AWS Backup.

## Hiện Trạng Triển Khai

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS.
- Danh mục sản phẩm: dữ liệu tĩnh và sản phẩm lưu trong local assets.
- Giỏ hàng: quản lý bằng client-side cart context.
- API chatbot: Next.js route handler dùng OpenAI API.
- Infrastructure: bộ khung AWS CDK một phần trong `infrastructure`.
- Backend services: các thư mục placeholder trong `services`.
- Vị trí ứng dụng: `frontend`.
ảnh 
## Cấu Trúc Repository

```text
music-instrument-store/
|-- frontend/                        # Next.js frontend app
|       |-- app/                     # App Router pages, API routes, components, context
|       |-- public/                  # Static assets
|       |-- package.json
|       `-- README.md
|-- infrastructure/
|   `-- lib/
|       |-- edge-stack.ts            # Placeholder edge stack
|       `-- security-stack.ts        # CDK stack for Stripe secrets
|-- services/
|   |-- chatbot-backend/             # Placeholder chatbot backend
|   |-- checkout-service/            # Placeholder checkout service
|   |-- notification-service/        # Placeholder notification service
|   `-- product-services/            # Placeholder product services
|-- LICENSE
|-- README_END.md
`-- README_VI.md
```

## Hướng Dẫn Cài Đặt

Yêu cầu:

- Node.js 20 hoặc mới hơn
- npm

Clone repository:

```bash
git clone https://github.com/Thien-132/music-instrument-store.git
cd music-instrument-store
git checkout dev
```

Cài dependencies:

```bash
cd frontend
npm install
```

Tạo file môi trường local khi dùng chatbot:

```bash
OPENAI_API_KEY=your_openai_api_key
```

Lưu tại:

```text
frontend/.env.local
```

Nếu dùng AWS, Cognito hoặc Stripe, thêm các biến môi trường tương ứng:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID=
```

Chạy development server:

```bash
npm run dev
```

Mở trình duyệt tại:

```text
http://localhost:3000
```

## Scripts

Chạy trong thư mục `frontend`:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Các Route Chính

- `/` - trang chủ, danh mục, thương hiệu, sản phẩm nổi bật, tìm kiếm và lọc.
- `/products` - danh sách sản phẩm và kết quả tìm kiếm.
- `/product/[id]` - chi tiết sản phẩm.
- `/cart` - giỏ hàng.
- `/orders` - đơn hàng.
- `/login` - đăng nhập.
- `/register` - đăng ký.
- `/admin` - trang quản trị.
- `/api/chat` - API chatbot.

## Quy Trình Làm Việc

Để hạn chế conflict khi 5 người cùng làm việc, nhóm thống nhất workflow:

1. `main` là nhánh chạy thực tế (Production-ready). Chỉ nhận code từ nhánh `staging`.
2. `staging` là nhánh tiền phát hành (Pre-release / Staging), dùng để tích hợp và kiểm thử tích hợp cuối cùng (UAT) trước khi release lên production. Chỉ nhận code từ nhánh `dev`.
3. `dev` là nhánh tích hợp chính của nhóm cho môi trường phát triển (Development).
4. Mỗi task tạo nhánh mới từ `dev`, ví dụ `feature/cognito-auth` hoặc `feature/stripe-checkout`.
5. Commit với message rõ ràng theo quy tắc Conventional Commits, ví dụ `feat: add cognito auth` hoặc `fix: stripe webhook bug`.
6. Push nhánh lên GitHub và tạo Pull Request trỏ vào `dev`.
7. Yêu cầu ít nhất 1 thành viên khác review trước khi merge vào `dev`.
8. Sau khi chạy ổn định trên môi trường dev, tạo Pull Request để merge `dev` vào `staging` để kiểm thử.
9. Sau khi kết quả kiểm thử trên môi trường staging đạt yêu cầu và được nghiệm thu, merge từ `staging` vào `main` để release lên production.
10. Cập nhật tài liệu kiến trúc hoặc ADR nếu có thay đổi về infrastructure.

Sơ đồ quy trình:
```mermaid
gitGraph
  commit id: "Initial Commit"
  branch dev
  checkout dev
  commit id: "Dev Baseline"
  branch feature/auth
  checkout feature/auth
  commit id: "feat: login UI"
  commit id: "feat: cognito integration"
  checkout dev
  merge feature/auth id: "Merge PR"
  branch staging
  checkout staging
  merge dev id: "UAT testing"
  checkout main
  merge staging id: "Release 1.0.0"
```

Khuyến nghị cấu hình GitHub:

- Protect `main`, `staging` và `dev`.
- Require pull request approval trước khi merge.
- Require CI/CD checks như lint, test hoặc AWS Amplify build.

## Kiến Trúc Serverless Mục Tiêu

Kế hoạch production gồm:

- Route 53 và AWS WAF cho DNS, edge protection, managed rules và rate limiting.
- AWS Amplify để host frontend Next.js.
- Amazon Cognito cho registration, login, JWT issuance và protected routes.
- API Gateway với Cognito Authorizer cho backend APIs.
- Lambda services cho products, orders, checkout, chatbot và notifications.
- DynamoDB cho catalog, orders, payment references, event processing và metadata.
- S3 cho private product image storage.
- SQS queues và DLQs cho xử lý order và notification.
- EventBridge cho event-driven flows như `order.placed` và `payment.succeeded`.
- Stripe cho payment intent creation, webhook verification và idempotent checkout.
- Amazon Lex là chatbot engine mục tiêu.
- CloudWatch, CloudTrail, X-Ray và GuardDuty cho logs, audit, tracing, alarms và threat detection.
- AWS Backup cho backup và restore DynamoDB.

## Triển Khai

Chi tiết cách triển khai Next.js frontend lên AWS Amplify Hosting:
*   Xem [Hướng Dẫn Triển Khai AWS Amplify](file:///E:/Project/repo/music-instrument-store/docs/huong_dan_trien_khai_amplify.md) để biết cách thiết lập trên AWS Console, cấu hình biến môi trường và xử lý sự cố.

## Lộ Trình

- Thay dữ liệu catalog tĩnh bằng Product Service dùng DynamoDB và S3.
- Thêm xác thực Cognito và bảo vệ route.
- Thêm API Gateway và Lambda services cho product, order, checkout, chatbot và notification.
- Tích hợp Stripe Payment Intent, webhook và cơ chế idempotency.
- Thêm SQS, DLQ và EventBridge cho xử lý đơn hàng và thông báo bất đồng bộ.
- Mở rộng Infrastructure as Code cho tài nguyên AWS.
- Thêm CI/CD pipelines, smoke tests, dashboard, alarm, tracing, backup và runbook.

