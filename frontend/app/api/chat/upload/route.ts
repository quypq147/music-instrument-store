import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Cấu hình kích thước file tối đa: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Các định dạng file được phép tải lên
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Không tìm thấy file tải lên." }, { status: 400 });
    }

    // 1. Kiểm tra dung lượng file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Dung lượng file vượt quá giới hạn cho phép (Tối đa 5MB)." },
        { status: 400 }
      );
    }

    // 2. Kiểm tra loại file
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Định dạng file không được hỗ trợ (Chỉ nhận Ảnh, PDF, Word, TXT)." },
        { status: 400 }
      );
    }

    // 3. Đọc dữ liệu file thành Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 4. Tạo thư mục public/uploads/ nếu chưa tồn tại
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    // 5. Chuẩn hóa tên file (Loại bỏ các ký tự đặc biệt để an toàn)
    const originalName = file.name;
    const extension = path.extname(originalName);
    const sanitizedBase = path
      .basename(originalName, extension)
      .replace(/[^a-zA-Z0-9]/g, "_");
    const newFileName = `${sanitizedBase}_${Date.now()}${extension}`;
    const filePath = path.join(uploadDir, newFileName);

    // 6. Ghi file xuống ổ đĩa
    await fs.writeFile(filePath, buffer);

    // Trả về thông tin file và URL truy cập công khai
    const fileUrl = `/uploads/${newFileName}`;
    
    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName: originalName,
      fileType: file.type,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("API /api/chat/upload error:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra trong quá trình tải file lên." },
      { status: 500 }
    );
  }
}
