# Tài Liệu Cấu Trúc Cơ Sở Dữ Liệu & Danh Sách Tài Khoản Thử Nghiệm

Tài liệu này cung cấp chi tiết về cấu trúc cơ sở dữ liệu (DynamoDB Single Table Design) sau khi được cập nhật, và thông tin các tài khoản thử nghiệm dành cho các thành viên trong nhóm phát triển.

---

## 1. Thiết Kế Cơ Sở Dữ Liệu (DynamoDB Single Table Design)

Bảng DynamoDB chính (`MusicStoreMainTable`) được thiết kế theo mô hình Single Table Design với khóa chính là `PK` (Partition Key) và `SK` (Sort Key), đồng thời tích hợp thêm một chỉ mục thứ cấp toàn cục **GSI1** (`GSI1PK` và `GSI1SK`) nhằm tối ưu hóa khả năng truy vấn đa chiều mà không làm ảnh hưởng đến hiệu năng hoặc phát sinh chi phí quét bảng (`Scan`).

### Cấu trúc Khóa Chỉ Mục Thứ Cấp Toàn Cục (GSI1):
*   **Index Name**: `GSI1`
*   **Partition Key (GSI1PK)**: Phục vụ lọc theo thực thể thứ hai (ví dụ: truy vấn tất cả đơn hàng của một `userId`).
*   **Sort Key (GSI1SK)**: Phục vụ sắp xếp hoặc lọc chi tiết (ví dụ: sắp xếp đơn hàng theo thời gian tạo).

Dưới đây là các mô hình thực thể (Entities) được nâng cấp chuẩn thương mại điện tử hiện đại:

### 1.1. Sản phẩm (Product Metadata)
*   **PK**: `PRODUCT#<productId>`
*   **SK**: `METADATA`
*   **Các thuộc tính chính**:
    *   `id`: Mã sản phẩm (string)
    *   `name`: Tên sản phẩm
    *   `price`: Giá bán (number)
    *   `brand`: Thương hiệu
    *   `type`: Phân loại sản phẩm (ví dụ: Alto Saxophone)
    *   `imageUrl`: Link hình ảnh sản phẩm trên S3
    *   `description`: Mô tả chi tiết
    *   `averageRating`: Điểm đánh giá trung bình (number - tính động hoặc lưu cache)
    *   `ratingCount`: Tổng số lượt đánh giá (number)

### 1.2. Lịch sử mua hàng của User (User Bought Tracking)
*   **Mục đích**: Xác thực xem User đã mua sản phẩm hay chưa trước khi cho phép Đánh giá (Rating).
*   **PK**: `USER#<userId>`
*   **SK**: `BOUGHT#<productId>`
*   **Các thuộc tính**:
    *   `productId`: Mã sản phẩm đã mua
    *   `orderId`: Mã đơn hàng liên quan
    *   `purchasedAt`: Thời gian mua hàng (ISO timestamp)

### 1.3. Đánh giá Sản phẩm (Product Ratings)
*   **Mục đích**: Lưu thông tin đánh giá (chỉ dành cho khách hàng đã mua sản phẩm này).
*   **PK**: `PRODUCT#<productId>`
*   **SK**: `RATING#<userId>`
*   **Các thuộc tính**:
    *   `rating`: Số sao đánh giá (từ 1 đến 5)
    *   `comment`: Nội dung nhận xét chi tiết (string, tùy chọn)
    *   `userId`: Mã User đánh giá
    *   `userName`: Tên hiển thị của User
    *   `createdAt`: Thời gian đánh giá (ISO timestamp)

### 1.4. Hỏi đáp & Bình luận (Product Comments)
*   **Mục đích**: Cho phép bất kỳ người dùng nào đã đăng nhập đều có thể đặt câu hỏi hoặc bình luận về sản phẩm.
*   **PK**: `PRODUCT#<productId>`
*   **SK**: `COMMENT#<commentId>` (Định dạng `comment_<timestamp>_<userId_short>`)
*   **Các thuộc tính**:
    *   `commentId`: Mã bình luận duy nhất
    *   `content`: Nội dung bình luận
    *   `userId`: Mã người bình luận
    *   `userName`: Tên hiển thị người bình luận
    *   `createdAt`: Thời gian gửi bình luận (ISO timestamp)

### 1.5. Hồ sơ cá nhân (User Profile)
*   **PK**: `USER#<userId>`
*   **SK**: `PROFILE`
*   **Các thuộc tính**:
    *   `userId`: Mã User duy nhất từ Cognito (`sub`)
    *   `email`: Email đã đăng ký
    *   `name`: Họ và Tên
    *   `phone`: Số điện thoại nhận hàng
    *   `address`: Địa chỉ giao hàng mặc định
    *   `updatedAt`: Thời gian cập nhật hồ sơ gần nhất

### 1.6. Danh sách yêu thích (Wishlist Item)
*   **PK**: `USER#<userId>`
*   **SK**: `WISHLIST#<productId>`
*   **Các thuộc tính**:
    *   `productId`: Mã sản phẩm
    *   `name`: Tên sản phẩm
    *   `price`: Giá bán sản phẩm
    *   `imageUrl`: Hình ảnh sản phẩm
    *   `brand`: Thương hiệu sản phẩm
    *   `type`: Loại sản phẩm
    *   `addedAt`: Thời gian thêm vào danh sách yêu thích

### 1.7. Giỏ hàng lưu trữ (Persistent Shopping Cart)
*   **Mục đích**: Đồng bộ giỏ hàng của người dùng trên mọi thiết bị (thay vì chỉ lưu `localStorage`).
*   **PK**: `USER#<userId>`
*   **SK**: `CART#<productId>`
*   **Các thuộc tính**:
    *   `productId`: Mã sản phẩm
    *   `quantity`: Số lượng đặt mua (number)
    *   `addedAt`: Thời điểm thêm vào giỏ hàng (ISO timestamp)

### 1.8. Mã giảm giá & Khuyến mãi (Discount Coupon)
*   **Mục đích**: Quản lý các chương trình khuyến mãi và mã giảm giá áp dụng khi checkout.
*   **PK**: `COUPON#<couponCode>`
*   **SK**: `METADATA`
*   **Các thuộc tính**:
    *   `code`: Mã giảm giá (ví dụ: `SUMMER20`)
    *   `discountType`: Loại giảm giá (`PERCENTAGE` hoặc `FLAT_AMOUNT`)
    *   `discountValue`: Giá trị giảm (ví dụ: `20` cho 20% hoặc `100000` cho 100k VNĐ)
    *   `minOrderValue`: Giá trị đơn hàng tối thiểu để áp dụng
    *   `usageLimit`: Giới hạn số lần sử dụng tối đa của mã
    *   `usageCount`: Số lần mã đã được sử dụng thực tế
    *   `validFrom`: Thời gian bắt đầu hiệu lực (ISO timestamp)
    *   `validUntil`: Thời gian hết hạn (ISO timestamp)
    *   `isActive`: Trạng thái kích hoạt (boolean)

### 1.9. Quản lý kho sản phẩm (Product Inventory)
*   **Mục đích**: Theo dõi lượng tồn kho thời gian thực của sản phẩm nhằm tránh tình trạng bán vượt quá số lượng hiện có (Overselling).
*   **PK**: `PRODUCT#<productId>`
*   **SK**: `INVENTORY`
*   **Các thuộc tính**:
    *   `productId`: Mã sản phẩm
    *   `stock`: Số lượng hàng còn trong kho (number)
    *   `reserved`: Số lượng hàng đang được giữ tạm thời do khách đang thanh toán (number)
    *   `location`: Vị trí kho hàng (ví dụ: `WAREHOUSE_HN_01`)
    *   `updatedAt`: Thời điểm cập nhật kho gần nhất

### 1.10. Đơn hàng & Lịch sử trạng thái đơn hàng (Order Status History)
*   **Mục đích**: Quản lý đơn hàng nâng cao, hỗ trợ tra cứu lịch sử chuyển đổi trạng thái của đơn hàng.
*   **Bản ghi Đơn hàng chính (Order Metadata)**:
    *   **PK**: `ORDER#<orderId>`
    *   **SK**: `METADATA`
    *   **GSI1PK**: `USER#<userId>`
    *   **GSI1SK**: `ORDER#<orderId>`
    *   **Các thuộc tính**: `id`, `userId`, `items`, `totalPrice`, `paymentMethod`, `status`, `createdAt`
*   **Bản ghi Lịch sử trạng thái (Order Status History)**:
    *   **PK**: `ORDER#<orderId>`
    *   **SK**: `STATUS_HISTORY#<timestamp>`
    *   **Các thuộc tính**:
        *   `status`: Trạng thái đơn hàng tại thời điểm đó (`PENDING`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELLED`)
        *   `changedBy`: Người thực hiện thay đổi (`SYSTEM`, `customer_id`, hoặc `staff_email`)
        *   `reason`: Lý do thay đổi trạng thái (nếu có)
        *   `updatedAt`: Thời gian cập nhật

---

### 1.11. Bảng Tra Cứu Mẫu Truy Vấn (Access Patterns)

| Nghiệp Vụ (Access Pattern) | Khóa chính (`PK` / `SK`) | Chỉ mục GSI (`GSI1PK` / `GSI1SK`) | Mô tả chi tiết |
| :--- | :--- | :--- | :--- |
| **Xem chi tiết sản phẩm** | `PK = PRODUCT#<productId>`, `SK = METADATA` | - | Lấy thông tin cơ bản của sản phẩm |
| **Xem bình luận của sản phẩm** | `PK = PRODUCT#<productId>`, `SK` bắt đầu bằng `COMMENT#` | - | Lấy danh sách hỏi đáp của người dùng |
| **Xem các đánh giá sản phẩm** | `PK = PRODUCT#<productId>`, `SK` bắt đầu bằng `RATING#` | - | Lấy tất cả đánh giá số sao của sản phẩm |
| **Xem thông tin tồn kho** | `PK = PRODUCT#<productId>`, `SK = INVENTORY` | - | Lấy số lượng hàng còn trong kho của sản phẩm |
| **Lấy giỏ hàng của người dùng** | `PK = USER#<userId>`, `SK` bắt đầu bằng `CART#` | - | Lấy tất cả các sản phẩm đang nằm trong giỏ hàng |
| **Lấy danh sách yêu thích** | `PK = USER#<userId>`, `SK` bắt đầu bằng `WISHLIST#` | - | Lấy toàn bộ danh sách wishlist của user |
| **Kiểm tra User đã mua hàng chưa**| `PK = USER#<userId>`, `SK = BOUGHT#<productId>` | - | Xác thực quyền viết đánh giá sản phẩm |
| **Lấy lịch sử đơn hàng của User**| - | `GSI1PK = USER#<userId>`, `GSI1SK` bắt đầu bằng `ORDER#` | Truy vấn danh sách toàn bộ đơn hàng của User, sắp xếp theo thời gian |
| **Xem chi tiết đơn hàng** | `PK = ORDER#<orderId>`, `SK = METADATA` | - | Xem thông tin chi tiết của một đơn hàng cụ thể |
| **Xem lịch sử giao hàng** | `PK = ORDER#<orderId>`, `SK` bắt đầu bằng `STATUS_HISTORY#` | - | Lấy toàn bộ quá trình xử lý đơn hàng |
| **Kiểm tra mã giảm giá** | `PK = COUPON#<couponCode>`, `SK = METADATA` | - | Xác thực và lấy phần trăm giảm giá của Coupon |

---

## 2. Thông Tin Tài Khoản Mẫu (Cognito Pre-made Accounts)

Hệ thống xác thực AWS Cognito User Pool đã được cấu hình sẵn các nhóm quyền (`Admin`, `Staff`, `Customer`). Các tài khoản sau đây đã được tạo sẵn để phục vụ việc phát triển và kiểm thử:

| Nhóm Vai Trò | Email Đăng Nhập | Mật Khẩu | Tên Hiển Thị |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@musicstore.com` | `AdminPassword@123` | Quan tri vien |
| **Nhân viên (Staff)** | `staff@musicstore.com` | `StaffPassword@123` | Nhan vien |
| **Khách hàng (Customer)** | `customer@musicstore.com` | `CustomerPassword@123` | Khach hang |

> [!NOTE]
> *   Các tài khoản trên đều đã được xác thực trạng thái email (`email_verified = true`) và kích hoạt mật khẩu vĩnh viễn, không yêu cầu đổi mật khẩu ở lần đăng nhập đầu tiên.
> *   Khi đăng nhập bằng tài khoản `admin@musicstore.com`, hệ thống Next.js Frontend sẽ cho phép truy cập vào Trang Quản Lý (`/admin`).

---

## 3. Cách Thức Thử Nghiệm Tính Năng Đánh Giá & Yêu Thích

Để kiểm tra luồng nghiệp vụ trên máy local:
1.  **Chạy ứng dụng**: `npm run dev:web` ở thư mục gốc.
2.  **Đăng nhập**: Sử dụng tài khoản `customer@musicstore.com`.
3.  **Trang Cá Nhân & Yêu Thích**: Nhấp vào dòng chữ "Xin chào, Khach hang" ở Header để chuyển tới trang quản lý tài khoản `/profile`. Tại đây bạn có thể cập nhật thông tin cá nhân và quản lý Danh sách yêu thích.
4.  **Bình luận sản phẩm**: Vào trang chi tiết bất kỳ sản phẩm nào, chuyển sang tab *Bình luận & Hỏi đáp* và viết nhận xét thoải mái.
5.  **Đánh giá sản phẩm**:
    *   Vào Giỏ hàng (`/cart`), tiến hành đặt hàng một sản phẩm bất kỳ.
    *   Sau khi đặt hàng thành công (Backend đã tạo bản ghi `BOUGHT` liên kết với tài khoản này), quay lại trang chi tiết sản phẩm đó.
    *   Chọn tab *Đánh giá từ người mua* và gửi đánh giá (Số sao + Nhận xét). Lúc này hệ thống sẽ chấp nhận đánh giá vì bạn đã mua hàng. Nếu chưa mua hàng, hệ thống sẽ trả về lỗi `403`.
