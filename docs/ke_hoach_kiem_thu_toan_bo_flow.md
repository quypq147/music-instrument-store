# Kế hoạch kiểm thử toàn bộ flow — Music Instrument Store

> Branch: `test/full-flow-verification` (tách từ `dev`)
> Ngày lập: 2026-07-12
> Phạm vi: toàn bộ luồng nghiệp vụ của frontend (Next.js App Router), API routes, và các Lambda service trong `services/`.

## 1. Mục tiêu

- Xác nhận mọi luồng nghiệp vụ chính (auth, mua hàng, thanh toán, admin, chat, liên hệ) hoạt động đúng từ đầu đến cuối.
- Chuẩn hóa 3 tầng kiểm thử: **unit (Jest)** cho services, **API/integration** cho route handlers, **E2E (Playwright)** cho luồng người dùng.
- Phát hiện regression trước khi merge về `dev`/`main`.

## 2. Hiện trạng kiểm thử

| Hạng mục | Trạng thái |
|---|---|
| Unit test Jest | Chỉ có ở `product-api`, `notification`, `auth-pre-signup`, `auth-post-confirmation` |
| Các service còn lại | `test` script là placeholder ("No tests configured") |
| Playwright | Đã cài `@playwright/test` trong `frontend` nhưng **chưa có config và test nào** |
| API route tests | Chưa có |

## 3. Danh sách flow cần kiểm thử

### 3.1 Xác thực (Cognito) — ưu tiên CAO
| ID | Flow | Điểm kiểm tra chính |
|---|---|---|
| AUTH-01 | Đăng ký (`/register`) | Validate form, pre-signup trigger, email xác nhận, post-confirmation tạo profile |
| AUTH-02 | Đăng nhập (`/login`) | Sai mật khẩu, tài khoản chưa xác nhận, đăng nhập thành công, JWT lưu đúng |
| AUTH-03 | Xác minh thiết bị (`/verify-device`) | Gửi OTP, nhập sai OTP, OTP hết hạn, verify thành công (API `auth/device`) |
| AUTH-04 | Quên mật khẩu (`/forgot-password`) | Gửi mã, đổi mật khẩu, đăng nhập lại bằng mật khẩu mới |
| AUTH-05 | OAuth Google/Facebook | Redirect URL đúng theo domain (đã fix tách theo dấu phẩy — kiểm tra regression), callback tạo session |
| AUTH-06 | Đăng xuất & bảo vệ route | Route cần đăng nhập (profile, orders, admin) redirect về login khi chưa có session |

### 3.2 Duyệt sản phẩm (storefront)
| ID | Flow | Điểm kiểm tra chính |
|---|---|---|
| PROD-01 | Trang chủ `/` | Render danh mục, sản phẩm nổi bật, không lỗi console |
| PROD-02 | Danh sách `/products` | Tìm kiếm, lọc theo danh mục/giá, phân trang, trạng thái rỗng |
| PROD-03 | Chi tiết sản phẩm | Ảnh, giá, tồn kho, nút thêm giỏ hàng |
| PROD-04 | Wishlist (`WishlistContext`) | Thêm/xóa, persist qua reload |
| PROD-05 | API `GET /products`, `GET /products/{id}` (product-api Lambda) | 200 với dữ liệu đúng schema, 404 khi id không tồn tại |

### 3.3 Giỏ hàng
| ID | Flow | Điểm kiểm tra chính |
|---|---|---|
| CART-01 | Thêm/sửa số lượng/xóa (`CartContext`) | Tính tổng đúng, số lượng tối đa theo tồn kho |
| CART-02 | Persist giỏ hàng | Reload trang giữ nguyên giỏ, đăng nhập không mất giỏ |
| CART-03 | Giỏ rỗng | Trạng thái rỗng, nút quay lại mua hàng |

### 3.4 Checkout & thanh toán (Stripe) — ưu tiên CAO
| ID | Flow | Điểm kiểm tra chính |
|---|---|---|
| CHK-01 | Trang `/checkout` | Form địa chỉ, validate, tính phí/tổng |
| CHK-02 | Áp mã giảm giá | Mã hợp lệ, hết hạn, sai mã (API `coupons`) |
| CHK-03 | API `POST /api/checkout` → `checkout-service` | Idempotency-Key, tạo Stripe session, lỗi khi giỏ rỗng/dữ liệu thiếu |
| CHK-04 | Thanh toán Stripe (test card) | Thành công → `/checkout/success`; thẻ bị từ chối → hiển thị lỗi |
| CHK-05 | Webhook `payment-webhook` | Verify chữ ký Stripe, publish `PaymentSucceeded` lên EventBridge, reject chữ ký sai |
| CHK-06 | `order-processing` (SQS) | Ghi order pending vào DynamoDB, retry/DLQ khi lỗi |

### 3.5 Đơn hàng
| ID | Flow | Điểm kiểm tra chính |
|---|---|---|
| ORD-01 | Danh sách đơn `/orders` | Chỉ hiện đơn của user đang đăng nhập |
| ORD-02 | Chi tiết đơn (`/api/orders/[id]`) | Đúng dữ liệu, chặn xem đơn của user khác (403/404) |
| ORD-03 | Trạng thái đơn | Chuyển trạng thái sau thanh toán (event-driven) |

### 3.6 Hồ sơ người dùng
| ID | Flow | Điểm kiểm tra chính |
|---|---|---|
| PRF-01 | Xem/cập nhật profile | API `users`, dữ liệu đồng bộ với Cognito/DynamoDB |
| PRF-02 | Upload avatar | Định dạng/kích thước hợp lệ, upload S3 (đã có unit test `avatarUpload.test.ts` — mở rộng E2E) |

### 3.7 Admin — ưu tiên CAO (phân quyền)
| ID | Flow | Điểm kiểm tra chính |
|---|---|---|
| ADM-01 | Phân quyền | User thường truy cập `/admin` bị chặn; API `/api/admin/*` từ chối token không có quyền |
| ADM-02 | Quản lý sản phẩm | CRUD + upload ảnh sản phẩm |
| ADM-03 | Quản lý danh mục | CRUD categories |
| ADM-04 | Quản lý coupon | Tạo/sửa/vô hiệu hóa, áp dụng được ở checkout |
| ADM-05 | Quản lý đơn hàng | Xem, đổi trạng thái đơn |
| ADM-06 | Quản lý users/staff | Danh sách, phân quyền (API `admin/users`) |
| ADM-07 | Campaign (`campaign-api`, `campaign-fanout`) | Tạo campaign, fanout gửi thông báo, kiểm tra idempotency |
| ADM-08 | Admin chat (`/api/chat/admin`) | Trả lời chat khách hàng |

### 3.8 Chatbot & liên hệ
| ID | Flow | Điểm kiểm tra chính |
|---|---|---|
| CHAT-01 | Chat widget (`/api/chat`) | Gửi/nhận tin, history, reset, upload file, switch (bot ↔ admin) |
| CNT-01 | Form liên hệ `/lien-he` (`/api/contact` → `contact-api`) | Validate, gửi thành công, chống spam |
| CNT-02 | FloatingContacts (Zalo, social links) | Link đúng, hiển thị responsive (file vừa sửa — kiểm tra regression) |

### 3.9 Thông báo
| ID | Flow | Điểm kiểm tra chính |
|---|---|---|
| NTF-01 | `notification` dispatcher | Đã có unit test — bổ sung case lỗi provider, template thiếu biến |

## 4. Chiến lược & công cụ theo tầng

1. **Unit (Jest)** — `services/*`: bổ sung test cho `checkout-service`, `order-api`, `order-processing`, `payment-webhook`, `campaign-*`, `contact-api`, `auth-triggers` (mock AWS SDK v3 bằng `aws-sdk-client-mock`).
2. **API/Integration** — Next.js route handlers (`app/api/*`): gọi trực tiếp handler với request giả lập, mock Lambda/DynamoDB client trong `frontend/lib`.
3. **E2E (Playwright)** — luồng người dùng thật trên `next dev`:
   - Tạo `frontend/playwright.config.ts` + thư mục `frontend/e2e/`.
   - Dùng Stripe test mode + test card; Cognito user test riêng (script `scripts/create-users.ps1` có sẵn).
   - Suite theo nhóm: `auth.spec.ts`, `shopping.spec.ts`, `checkout.spec.ts`, `admin.spec.ts`, `contact-chat.spec.ts`.

## 5. Thứ tự thực hiện

| Giai đoạn | Nội dung | Ưu tiên |
|---|---|---|
| 1 | Thiết lập Playwright config + smoke test (trang chủ, login) | Cao |
| 2 | E2E luồng doanh thu: duyệt sản phẩm → giỏ → checkout → Stripe test → success | Cao |
| 3 | E2E auth đầy đủ (AUTH-01 → AUTH-06) | Cao |
| 4 | Unit test cho services chưa có test (checkout, webhook, order) | Cao |
| 5 | E2E admin + phân quyền | Trung bình |
| 6 | Chat, contact, notification, campaign | Trung bình |
| 7 | Chạy toàn bộ, tổng hợp báo cáo lỗi, fix hoặc mở issue | — |

## 6. Môi trường & dữ liệu kiểm thử

- **Môi trường:** local (`npm run dev` trong `frontend`) với `.env.local` trỏ tới môi trường dev AWS; Stripe ở test mode.
- **Dữ liệu:** seed sản phẩm bằng `scripts/seed-products.ts` / `import-products-to-dynamodb.mjs`; user test tạo bằng `scripts/create-users.ps1`.
- **Không chạy** test thanh toán/webhook trên môi trường production.

## 7. Kết quả đợt kiểm thử 1 (2026-07-12)

Suite E2E: 29 test trong `frontend/e2e/` — chạy bằng `npm run test:e2e` (từ thư mục `frontend`).

| Nhóm | Kết quả |
|---|---|
| Smoke (PROD-01/02, AUTH-02 render) | ✅ 6/6 |
| Giỏ hàng + coupon + modal đặt hàng (CART, CHK-01/02) | ✅ 8/8 |
| Bảo vệ route/API (AUTH-06, ADM-01) | ✅ 6/6 |
| Đăng nhập thật Cognito (AUTH-02/03) | ✅ 2/2 |
| Đặt hàng COD end-to-end (ORD-01) | ✅ 1/1 — tạo đơn thật trong DynamoDB dev |
| Chat Lex (CHAT-01) | ✅ 1/1 |
| Liên hệ (CNT-01/02) | ✅ 5/6 — 1 bug hạ tầng bên dưới |

**BUG-01 (mở):** Form liên hệ luôn thất bại — `contact-api` trả 500 vì **SES đang ở sandbox mode** (`ProductionAccessEnabled: false`), identity `no-reply@soniccart.dev` chưa hoàn tất verify và `support@nhomtttnmusic.vn` chưa được verify làm người nhận. Cách xử lý: verify 2 địa chỉ trong SES console (hoặc xin production access). Test tương ứng đang đánh dấu `test.fail()` — khi hạ tầng sửa xong sẽ báo "passed unexpectedly", lúc đó gỡ annotation.

### Giai đoạn 4 — Unit test services (hoàn thành 2026-07-12)

11/11 service có test, tổng **105 test pass**. Chạy toàn bộ: `npm run test:services` (root).

| Service | Test | Phủ chính |
|---|---|---|
| payment-webhook | 11 | Verify chữ ký Stripe (sai/replay/base64), commit & hoàn kho idempotent, PaymentSucceeded, Momo (CHK-05) |
| order-api | 13 | JWT 401, chống giả mạo userId, coupon (hết hạn/minOrder/race usageLimit), đẩy SQS (CHK-03) |
| checkout-service | 10 | Giữ chỗ tồn kho atomic + marker, idempotency retry, InventoryConflict, mock Stripe/Momo (CHK-03) |
| contact-api | 8 | Validate, SES đúng from/inbox/reply-to, tái hiện lỗi 500 khi SES từ chối (BUG-01) |
| order-processing | 5 | Lưu đơn + GSI, COD trừ kho atomic, hết hàng → DLQ, OrderPlaced (CHK-06) |
| campaign-api | 7 | Phân quyền Admin/Staff 403, tạo campaign QUEUED + CampaignRequested (ADM-07) |
| campaign-fanout | 4 | Loại trùng/opt-out, batch 10 theo giới hạn SQS, phân trang scan (ADM-07) |
| auth-triggers | 5 | Template email OTP SignUp/ForgotPassword/ResendCode (AUTH-01/04) |
| product-api, notification, auth-pre-signup, auth-post-confirmation | 42 | (đã có từ trước, vẫn pass) |

**Chưa phủ tự động (cần điều kiện ngoài):** AUTH-01/04 E2E (cần đọc email OTP thật), AUTH-05 (OAuth bên thứ ba), CHK-04 (UI thanh toán Stripe thật — logic backend đã phủ bằng unit), ADM-02→08 E2E (cần tài khoản Admin test).

## 8. Tiêu chí hoàn thành (Definition of Done)

- 100% flow ưu tiên CAO có test tự động (E2E hoặc unit) và pass.
- Các flow còn lại tối thiểu được kiểm thử thủ công và ghi kết quả vào bảng checklist.
- Không có lỗi console/error nghiêm trọng trên các trang chính.
- Báo cáo lỗi phát hiện được ghi thành issue với bước tái hiện.
