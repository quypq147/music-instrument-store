"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

interface ImagePickerProps {
  currentImageUrl: string;
  uploadUrlEndpoint: string;
  authToken: string;
  onUploaded: (publicUrl: string) => void;
  onError: (message: string) => void;
  shape?: "circle" | "square";
  disabled?: boolean;
}

export function ImagePicker({
  currentImageUrl,
  uploadUrlEndpoint,
  authToken,
  onUploaded,
  onError,
  shape = "square",
  disabled = false,
}: ImagePickerProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl);
  const [syncedImageUrl, setSyncedImageUrl] = useState(currentImageUrl);

  // currentImageUrl thường rỗng ở lần render đầu (parent chưa fetch xong profile/product) rồi
  // mới có giá trị thật sau đó — đồng bộ lại preview khi giá trị đó tới, tránh kẹt ở placeholder.
  // Cập nhật state ngay trong lúc render (theo khuyến nghị của React) thay vì dùng useEffect,
  // để tránh render thừa và cascading renders.
  if (currentImageUrl !== syncedImageUrl) {
    setSyncedImageUrl(currentImageUrl);
    setPreviewUrl(currentImageUrl);
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      onError("Định dạng ảnh không hợp lệ. Chỉ chấp nhận JPEG, PNG hoặc WEBP.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      onError("Ảnh vượt quá dung lượng cho phép (tối đa 5MB).");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setIsUploading(true);

    try {
      const presignRes = await fetch(uploadUrlEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ fileType: file.type }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) {
        throw new Error(presignData.error || presignData.message || "Không thể tạo link tải ảnh lên");
      }

      const { uploadUrl, fields, publicUrl } = presignData;
      const formData = new FormData();
      Object.entries(fields as Record<string, string>).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append("file", file);

      const uploadRes = await fetch(uploadUrl, { method: "POST", body: formData });
      if (!uploadRes.ok) {
        throw new Error("Tải ảnh lên thất bại");
      }

      setPreviewUrl(publicUrl);
      onUploaded(publicUrl);
    } catch (err) {
      setPreviewUrl(currentImageUrl);
      onError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải ảnh lên");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-xl";

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`w-24 h-24 ${shapeClass} overflow-hidden bg-[#F3EFEA] dark:bg-[#031d16] border border-[#DF9E47]/20 flex items-center justify-center shrink-0`}
      >
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Ảnh xem trước"
            width={96}
            height={96}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <span className="text-xs text-slate-400 dark:text-emerald-100/30">Chưa có ảnh</span>
        )}
      </div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
      />
      <label
        htmlFor={inputId}
        className={`cursor-pointer text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl border border-[#002B1F] dark:border-[#DF9E47]/40 text-[#002B1F] dark:text-[#DF9E47] hover:bg-[#002B1F] dark:hover:bg-[#DF9E47] hover:text-white dark:hover:text-[#002B1F] transition-colors ${
          disabled || isUploading ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        {isUploading ? "Đang tải lên..." : "Chọn ảnh"}
      </label>
    </div>
  );
}
