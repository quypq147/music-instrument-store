# Tài Liệu Cấu Trúc Cơ Sở Dữ Liệu & Danh Sách Tài Khoản Thử Nghiệm

Tài liệu này cung cấp chi tiết về cấu trúc cơ sở dữ liệu (DynamoDB Single Table Design) sau khi được cập nhật, và thông tin các tài khoản thử nghiệm dành cho các thành viên trong nhóm phát triển.

---

## 1. Thiết Kế Cơ Sở Dữ Liệu (DynamoDB Single Table Design)

Bảng DynamoDB chính (`MusicStoreMainTable`) được thiết kế theo mô hình Single Table Design với khóa chính là `PK` (Partition Key) và `SK` (Sort Key). Dưới đây là các mô hình thực thể (Entities) được cập nhật:

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
*   **SK**: `COMMENT#<commentId>` (Trong đó `commentId` có định dạng `comment_<timestamp>_<userId_short>`)
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
