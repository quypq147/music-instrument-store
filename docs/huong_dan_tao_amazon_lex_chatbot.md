# Hướng dẫn chi tiết tạo và tích hợp Chatbot Amazon Lex V2

Tài liệu này hướng dẫn chi tiết từng bước cách tạo, cấu hình một chatbot bằng dịch vụ **Amazon Lex V2** trên AWS Console và cách cấu hình các biến môi trường để tích hợp chatbot này vào ứng dụng **Music Instrument Store**.

---

## 1. Giới thiệu tổng quan
Trong dự án này, tệp tin backend [frontend/app/api/chat/route.ts](file:///E:/Project/repo/music-instrument-store/frontend/app/api/chat/route.ts) sử dụng AWS SDK `@aws-sdk/client-lex-runtime-v2` để kết nối trực tiếp đến **Amazon Lex V2**. 

Để Chatbot hoạt động, bạn cần cấu hình các Intent (Ý định), Slot (Thông tin trích xuất), xây dựng (Build), kiểm thử (Test) và xuất bản một **Bot Alias** trên AWS Console.

---

## 2. Các bước tạo Chatbot trên AWS Console

### Bước 2.1: Truy cập AWS Lex Console
1. Đăng nhập vào [AWS Management Console](https://aws.amazon.com/).
2. Trên thanh tìm kiếm, nhập **Amazon Lex** và chọn dịch vụ này.
3. Đảm bảo bạn đang ở giao diện **Lex V2**. Nếu đang ở V1, hãy nhấp vào liên kết chuyển đổi sang V2 ở menu bên trái.

### Bước 2.2: Tạo một Bot mới
1. Tại màn hình danh sách Bot, chọn **Create bot**.
2. **Configure bot settings**:
   * **Creation method**: Chọn **Create an empty bot** (Tạo bot trống).
   * **Bot name**: Nhập tên gợi nhớ, ví dụ: `MusicStoreAssistant`.
   * **Description**: Mô tả ngắn gọn (tùy chọn).
   * **IAM permissions**: Chọn **Create a role with basic Amazon Lex permissions** (AWS tự động tạo IAM Role cho Bot).
   * **Children's Online Privacy Protection Act (COPPA)**: Chọn **No** (Bot này không hướng đến đối tượng trẻ em dưới 13 tuổi).
   * **Idle session timeout**: Đặt thời gian hết hạn phiên chat (mặc định là `5 minutes`).
3. Nhấp **Next**.

### Bước 2.3: Thêm ngôn ngữ cho Bot
1. **Select language**: Chọn **English (US)**.
   > [!WARNING]
   > Bot này **chỉ build locale `en_US`**, dù toàn bộ sample utterances và closing response đều là tiếng Việt — "locale" ở đây chỉ là tên bucket cấu hình trên Lex, không phải ngôn ngữ thật sự của nội dung. Không có locale `vi_VN` nào tồn tại trên bot. File [route.ts](file:///E:/Project/repo/music-instrument-store/frontend/app/api/chat/route.ts) phải gọi thẳng `localeId: "en_US"` — từng có một lần thử gọi `vi_VN` trước rồi fallback sang `en_US`, khiến MỌI tin nhắn tốn 1 lần gọi lỗi (`ResourceNotFoundException`) trước khi rơi về `en_US`; lỗi này đã được sửa (route.ts giờ gọi thẳng `en_US`, không còn fallback). Nếu thật sự muốn thêm locale `vi_VN` thật, phải build lại toàn bộ intent/utterance trên locale đó trên Lex Console trước, việc đổi `localeId` trong code không tự tạo ra locale mới.
2. **Voice interaction**: Chọn giọng nói cho bot (nếu sử dụng Voice, ví dụ: *Joanna* hoặc *Matthew*). Bạn có thể giữ mặc định.
3. Nhấp **Done**.

---

## 3. Thiết kế Cấu trúc hội thoại (Intents & Slots)

Sau khi tạo Bot, bạn sẽ được đưa vào giao diện **Intent list** để thiết kế các kịch bản trò chuyện.

### Bước 3.1: Tạo Welcome Intent (Ý định Chào hỏi)
1. Trong mục **Intents**, nhấp **Add intent** -> chọn **Add empty intent**.
2. Đặt tên: `WelcomeIntent`.
3. Di chuyển đến phần **Sample utterances** (Các câu thoại mẫu), nhập các câu người dùng có thể nói và bấm **Add utterance** sau mỗi câu:
   * *Hello*
   * *Hi*
   * *Xin chào*
   * *Chào bot*
   * *Cần giúp đỡ*
4. Di chuyển xuống phần **Closing responses** (Phản hồi kết thúc) -> nhập lời nhắn chào mừng của Bot:
   * *Chào mừng bạn đến với Cửa hàng Nhạc cụ! Tôi có thể giúp gì cho bạn hôm nay?*
5. Nhấp **Save intent** ở dưới cùng.

### Bước 3.2: Tạo CheckProductsIntent (Ý định tìm kiếm sản phẩm)
1. Nhấp **Add intent** -> **Add empty intent**, đặt tên: `CheckProductsIntent`.
2. Thêm các câu mẫu **Sample utterances**:
   * *Tôi muốn mua kèn saxophone*
   * *Cửa hàng bán những loại nhạc cụ nào?*
   * *Show me your instruments*
   * *saxophone*
3. Di chuyển đến phần **Closing responses** -> Nhập phản hồi:
   * *Cửa hàng hiện có các loại kèn Saxophone cao cấp từ Yamaha, Selmer,... Bạn có thể truy cập trang Sản phẩm để xem chi tiết nhé!*
4. Nhấp **Save intent**.

### Bước 3.3: Tạo CheckOrderIntent (Ý định kiểm tra đơn hàng)
1. Nhấp **Add intent** -> **Add empty intent**, đặt tên: `CheckOrderIntent`.
2. Nhập các câu mẫu **Sample utterances**:
   * *Kiểm tra đơn hàng của tôi*
   * *Đơn hàng của tôi đâu rồi*
   * *Check my order status*
3. Bạn có thể sử dụng **Slots** (Tham số) để thu thập mã đơn hàng:
   * Tại mục **Slots**, nhấp **Add slot**.
   * **Name**: `orderId`
   * **Slot type**: Chọn `AMAZON.AlphaNumeric` hoặc tạo custom type.
   * **Prompts**: *Vui lòng cung cấp mã đơn hàng của bạn (ví dụ: ord_123456)*.
   * Nhấp **Add**.
4. Sử dụng giá trị slot trong **Closing responses**:
   * *Đang kiểm tra trạng thái đơn hàng {orderId} của bạn. Bạn vui lòng truy cập trang 'Đơn đã mua' để xem cập nhật mới nhất nhé.*
5. Nhấp **Save intent**.

### Bước 3.4: Các FAQ Intent (Chính sách cửa hàng)

Ngoài 3 intent chính ở trên, bot còn có 4 intent FAQ tĩnh — mỗi intent chỉ có sample utterances và một closing response cố định, không cần Lambda fulfillment (cùng kiểu với `WelcomeIntent`):

| Intent | Mục đích |
|---|---|
| `ReturnPolicyIntent` | Trả lời câu hỏi về chính sách đổi trả / hoàn tiền. |
| `WarrantyIntent` | Trả lời câu hỏi về thời hạn và điều kiện bảo hành. |
| `ShippingIntent` | Trả lời câu hỏi về phí và thời gian vận chuyển. |
| `PaymentMethodIntent` | Trả lời câu hỏi về các hình thức thanh toán được hỗ trợ (COD, chuyển khoản, thẻ). |

Tạo mỗi intent theo đúng quy trình ở Bước 3.1 (Add empty intent -> nhập sample utterances -> nhập closing response -> Save intent).

---

## 4. Xây dựng (Build) và Kiểm thử (Test)

1. Ở góc trên bên phải màn hình Lex Console, nhấp nút **Build** để biên dịch chatbot. Quá trình này mất khoảng 10-30 giây.
2. Sau khi build thành công, nhấp nút **Test** ngay bên cạnh.
3. Giao diện trò chuyện trực tuyến sẽ mở ra ở bên phải. Hãy thử nhập *"Hello"* hoặc *"saxophone"* để kiểm tra xem Bot phản hồi có chính xác theo các kịch bản đã định nghĩa hay không.

---

## 5. Xuất bản phiên bản và Tạo Alias

Để tích hợp chatbot vào ứng dụng Next.js, bạn cần xuất bản một bản phát hành chính thức (Version) và liên kết nó với một định danh (Alias).

1. Ở menu bên trái, nhấp vào **Bot versions**.
2. Chọn **Create version** để đóng băng cấu hình hiện tại thành một phiên bản cố định (ví dụ: `Version 1`).
3. Ở menu bên trái, nhấp vào **Aliases**.
4. Nhấp **Create alias**:
   * **Alias name**: Đặt tên, ví dụ: `TestAlias` hoặc `Production`.
   * **Associate version**: Chọn phiên bản vừa tạo (ví dụ: `Version 1`).
   * Nhấp **Create**.
5. Click vào tên Alias vừa tạo, bạn sẽ thấy thông tin chi tiết bao gồm:
   * **Bot ID** (Ví dụ: `ABC123XYZ`)
   * **Bot Alias ID** (Ví dụ: `TSTALIASID`)

---

## 6. Cấu hình biến môi trường trong Dự án

Mở tệp tin cấu hình môi trường [frontend/.env.example](file:///E:/Project/repo/music-instrument-store/frontend/.env.example) hoặc tạo tệp `.env.local` trong thư mục [frontend](file:///E:/Project/repo/music-instrument-store/frontend) và điền các giá trị nhận được từ AWS Lex Console:

```env
# AWS CLI Credentials & Lex Config (Required for Chatbot backend)
AWS_REGION=us-east-1 # Region nơi bạn tạo Lex Bot
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key

LEX_BOT_ID=ABC123XYZ # Lấy từ Lex Console (Bot ID)
LEX_BOT_ALIAS_ID=TSTALIASID # Lấy từ Lex Console (Bot Alias ID)
```

> [!IMPORTANT]
> Tài khoản AWS liên kết với `AWS_ACCESS_KEY_ID` ở trên phải là một **IAM User** hoặc có đính kèm chính sách (Policy) cấp quyền gọi Lex Bot như `AmazonLexRunBotsOnly` hoặc `AmazonLexFullAccess`.

---

## 7. Mã nguồn kết nối trong Dự án
Đoạn code gọi đến Amazon Lex đã được viết sẵn trong dự án tại [frontend/app/api/chat/route.ts](file:///E:/Project/repo/music-instrument-store/frontend/app/api/chat/route.ts):

```typescript
const lexClient = new LexRuntimeV2Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
```

Mỗi khi người dùng gửi tin nhắn, Next.js API Route sẽ gửi yêu cầu này đến Amazon Lex thông qua lệnh `RecognizeTextCommand` và trả về kết quả cho giao diện người dùng frontend.
