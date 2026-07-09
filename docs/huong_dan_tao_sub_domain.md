# Hướng Dẫn Cấu Hình Đa Tên Miền Con (Multi-Subdomain Mapping) với Next.js & AWS Amplify

Tài liệu kỹ thuật này hướng dẫn AI Agent thiết lập hệ thống định tuyến đa tên miền con (ví dụ: `auth.soniccart.dev`, `admin.soniccart.dev`) chạy chung trên một ứng dụng duy nhất (Single Codebase) bằng Next.js App Router, quản lý DNS qua AWS Route 53 và hosting trên AWS Amplify.

---

## 1. Cấu Trúc Mã Nguồn (Next.js App Router)

Sử dụng tính năng **Route Groups** để phân chia luồng xử lý giao diện mà không làm ảnh hưởng đến cấu trúc URL ngầm định.

```text
app/
├── (root)/           # Giao diện trang chủ chính (Ví dụ: soniccart.dev)
│   ├── page.tsx
│   └── layout.tsx
├── (admin)/          # Giao diện bảng quản trị (Ví dụ: admin.soniccart.dev)
│   ├── page.tsx
│   └── layout.tsx
└── (auth)/           # Giao diện màn hình xác thực (Ví dụ: auth.soniccart.dev)
    ├── page.tsx
    └── layout.tsx