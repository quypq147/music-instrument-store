# Hướng Dẫn Thiết Lập Môi Trường Phát Triển (Đồng Bộ & Chuẩn Hóa)

Tài liệu này hướng dẫn cách thiết lập môi trường phát triển dự án **Music Instrument Store** cho tất cả thành viên trong nhóm, giúp loại bỏ hoàn toàn lỗi "chỉ chạy được trên máy tôi" (*only works on my machine*).

---

## 1. Yêu Cầu Hệ Thống (Prerequisites)

Để đảm bảo mọi người dùng chung một môi trường cấu hình đồng nhất, vui lòng cài đặt:

*   **Node.js**: Phiên bản **v20** trở lên.
    *   *Khuyến nghị*: Sử dụng công cụ quản lý phiên bản Node như **nvm** (Node Version Manager).
    *   Dự án đã có sẵn file [`.nvmrc`](file:///E:/Project/repo/music-instrument-store/.nvmrc) ở thư mục gốc để pin phiên bản. Khi vào dự án, bạn chỉ cần gõ:
        ```bash
        nvm use
        ```
*   **AWS CLI**: Cần thiết nếu bạn muốn triển khai hạ tầng AWS CDK hoặc chạy dịch vụ Cloud. Sau khi cài đặt, hãy cấu hình tài khoản AWS của bạn bằng lệnh:
        ```bash
        aws configure
        ```
        *(Đảm bảo điền đúng Access Key, Secret Key và Region của nhóm phát triển, ví dụ: `ap-southeast-1`)*

---

## 2. Quản Lý Thư Mục Dự Án (Monorepo Workspace)

Dự án này sử dụng tính năng **npm workspaces** (Monorepo) với cấu trúc:
*   `frontend/`: Ứng dụng Next.js
*   `packages/`: Thư viện dùng chung (như `@music-store/shared-types`, `@music-store/db-models`)
*   `services/`: Các Lambda functions backend

> [!IMPORTANT]
> **LUÔN LUÔN** chạy lệnh cài đặt thư viện từ thư mục gốc của dự án (project root). 
> **KHÔNG** chạy `npm install` bên trong folder `frontend` hoặc `services/*`. Việc cài đặt ở root giúp npm tự động liên kết chéo (hoist) các thư viện nội bộ và chia sẻ dependencies chính xác.

**Các bước cài đặt ban đầu:**
```bash
# Di chuyển tới thư mục gốc dự án
cd music-instrument-store

# Cài đặt toàn bộ dependencies cho toàn bộ workspace
npm install
```

---

## 3. Cấu Hình Biến Môi Trường (.env)

Hệ thống đã được cấu hình tự động hóa tối đa thông qua các file mẫu và công cụ đồng bộ.

### Bước 1: Tạo file cấu hình môi trường
Trong thư mục [`frontend/`](file:///E:/Project/repo/music-instrument-store/frontend), bạn có thể lựa chọn 1 trong 2 cách thiết lập tùy thuộc vào vai trò phát triển:

#### 👉 Cách 1: Chỉ phát triển Frontend (Không cần deploy AWS)
Nếu bạn chỉ làm việc với UI và đã có một môi trường AWS Backend chung được Deploy trước bởi DevOps/Lead:
1. Copy file mẫu [`frontend/.env.example`](file:///E:/Project/repo/music-instrument-store/frontend/.env.example) thành `frontend/.env.local`.
2. Xin các biến môi trường phát triển chung từ Lead/nhóm của bạn (bao gồm Cognito Client ID, API Gateway URL, và các Stripe keys) để điền vào.

#### 👉 Cách 2: Phát triển Fullstack (Cần tự Deploy hạ tầng AWS cá nhân)
Nếu bạn phát triển các tính năng AWS hoặc muốn test trên AWS Sandbox cá nhân:
1. Chạy lệnh tự động deploy và map biến môi trường từ thư mục gốc:
   ```bash
   npm run setup:local
   ```
2. **Quy trình hoạt động tự động của lệnh này:**
   - Triển khai toàn bộ AWS CDK stacks (`cdk deploy --all`) lên tài khoản AWS của bạn.
   - Kết xuất các tài nguyên được tạo ra thành file cấu hình cục bộ [`frontend/cdk-outputs.json`](file:///E:/Project/repo/music-instrument-store/frontend/cdk-outputs.json).
   - Tự động chạy script [generate-env.ts](file:///E:/Project/repo/music-instrument-store/frontend/generate-env.ts) để trích xuất `UserPoolId`, `UserPoolClientId` và `ApiGatewayUrl` từ `cdk-outputs.json`, sau đó **merge (gộp)** thẳng vào file `frontend/.env.local` của bạn.

> [!TIP]
> Script gộp môi trường thông minh [generate-env.ts](file:///E:/Project/repo/music-instrument-store/frontend/generate-env.ts) sẽ **KHÔNG ghi đè** hay làm mất các biến cấu hình thủ công của bạn (như `OPENAI_API_KEY` hay các API Keys từ bên thứ ba). Nó chỉ cập nhật hoặc bổ sung các tài nguyên AWS vừa được Deploy.

---

## 4. Các Biến Môi Trường Cần Thiết

Dưới đây là mô tả các biến môi trường được khai báo trong [`frontend/.env.example`](file:///E:/Project/repo/music-instrument-store/frontend/.env.example):

| Biến môi trường | Mục đích / Sử dụng | Nguồn gốc |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | Quản lý định danh người dùng qua Cognito | Tự động cập nhật qua CDK |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | Client ID kết nối với Cognito User Pool | Tự động cập nhật qua CDK |
| `NEXT_PUBLIC_API_GATEWAY_URL` | Điểm cuối (Endpoint) của AWS API Gateway | Tự động cập nhật qua CDK |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Key Stripe client-side để hiển thị cổng thanh toán | Lấy từ tài khoản Stripe Dev |
| `STRIPE_SECRET_KEY` | Key Stripe server-side để xử lý giao dịch | Lấy từ tài khoản Stripe Dev |
| `STRIPE_WEBHOOK_SECRET` | Xác thực tín hiệu thanh toán thành công gửi từ Stripe | Lấy từ Stripe CLI webhook listen |
| `AWS_REGION` | Khu vực deploy AWS Cloud | Cấu hình thủ công |
| `AWS_ACCESS_KEY_ID` & `AWS_SECRET_ACCESS_KEY` | Quyền truy cập SDK của AWS (dành cho Lex Bot) | IAM User có quyền gọi Lex |
| `LEX_BOT_ID` & `LEX_BOT_ALIAS_ID` | Thông tin Lex Bot dùng cho Chatbot AI | Lấy từ Lex Console |
| `S3_BUCKET_NAME` | Tên S3 Bucket dùng chứa ảnh sản phẩm và logo | Tự tạo thủ công hoặc lấy từ CDK Assets |

---

## 5. Seed Dữ Liệu (S3 & DynamoDB)

Để hệ thống hiển thị đầy đủ hình ảnh sản phẩm được lưu trên Cloud, bạn cần thực hiện upload ảnh lên S3 và seed dữ liệu vào DynamoDB:

1. Đảm bảo đã khai báo `S3_BUCKET_NAME` trong file `frontend/.env.local`.
2. Chạy lệnh tự động hóa việc upload các ảnh sản phẩm/logo lên S3 (sử dụng SSE-S3 để cho phép đọc công khai) và nạp thông tin sản phẩm vào bảng DynamoDB:
   ```bash
   npm run seed:s3-products
   ```

---

## 6. Khởi Chạy Project Cục Bộ

Sau khi đã hoàn thành cài đặt thư viện và cấu hình biến môi trường:

```bash
# Khởi chạy Next.js Dev Server ở local từ thư mục gốc
npm run dev:web
```
*Trang web sẽ chạy tại địa chỉ:* `http://localhost:3000`

---

## 7. Quy Tắc Tránh Lỗi Môi Trường Trong Nhóm

1.  **Không bao giờ commit file nhạy cảm**:
    *   Các file như `.env.local` và `cdk-outputs.json` chứa thông tin nhạy cảm và thông số cá nhân, đã được liệt kê trong file [`.gitignore`](file:///E:/Project/repo/music-instrument-store/.gitignore) để tránh đẩy lên GitHub.
2.  **Sử dụng package-lock.json đồng nhất**:
    *   Không tự ý xóa `package-lock.json`. Luôn dùng `npm install` để cập nhật dependencies giúp lockfile luôn đồng bộ phiên bản chính xác cho tất cả mọi người.
3.  **Deploy hạ tầng cần có context**:
    *   Khi chạy CDK deploy thủ công ngoài script, nhớ chỉ rõ môi trường:
        *   Môi trường Phát triển (Dev/Sandbox): `npx cdk deploy --all --context env=dev`
        *   Môi trường Tiền phát hành (Staging): `npx cdk deploy --all --context env=staging`
        *   Môi trường Chạy thực tế (Production): `npx cdk deploy --all --context env=prod`
    *   Việc chỉ định cụ thể môi trường qua `--context env=...` giúp tránh ghi đè hoặc xung đột tài nguyên giữa các môi trường chung của nhóm.
