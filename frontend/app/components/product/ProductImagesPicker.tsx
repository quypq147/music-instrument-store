"use client";

import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import Image from "next/image";
import {
  uploadImageFile,
  DEFAULT_ALLOWED_IMAGE_TYPES,
  DEFAULT_MAX_IMAGE_SIZE_BYTES,
} from "../../../lib/uploadImageFile";

const MAX_IMAGES = 6;

type ImageItem = {
  key: string;
  url?: string;
  file?: File;
  previewUrl: string;
};

export interface ProductImagesPickerHandle {
  /** Uploads any newly-picked files (S3 presigned POST) and returns the final ordered URL list. Nothing is uploaded before this is called. */
  uploadPending: (authToken: string, uploadUrlEndpoint: string) => Promise<string[]>;
}

interface ProductImagesPickerProps {
  initialImages: string[];
  disabled?: boolean;
  onError: (message: string) => void;
}

const toItems = (urls: string[]): ImageItem[] =>
  urls.map((url, index) => ({ key: `existing-${index}-${url}`, url, previewUrl: url }));

export const ProductImagesPicker = forwardRef<ProductImagesPickerHandle, ProductImagesPickerProps>(
  function ProductImagesPicker({ initialImages, disabled = false, onError }, ref) {
    const inputId = useId();
    const [items, setItems] = useState<ImageItem[]>(() => toItems(initialImages));
    const [syncedInitial, setSyncedInitial] = useState(initialImages);

    // initialImages đổi khi component cha reset form (vd: mở modal cho sản phẩm khác) —
    // đồng bộ lại ngay trong lúc render để tránh hiển thị ảnh của sản phẩm trước đó.
    if (initialImages !== syncedInitial) {
      setSyncedInitial(initialImages);
      setItems(toItems(initialImages));
    }

    const itemsRef = useRef(items);
    useEffect(() => {
      itemsRef.current = items;
    }, [items]);

    // Giải phóng mọi object URL còn lại khi component unmount (đóng modal).
    useEffect(() => {
      return () => {
        itemsRef.current.forEach((item) => {
          if (item.file) URL.revokeObjectURL(item.previewUrl);
        });
      };
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        uploadPending: async (authToken, uploadUrlEndpoint) => {
          const resolved: string[] = [];
          for (const item of items) {
            if (item.file) {
              resolved.push(await uploadImageFile(item.file, uploadUrlEndpoint, authToken));
            } else if (item.url) {
              resolved.push(item.url);
            }
          }
          return resolved;
        },
      }),
      [items]
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      e.target.value = "";
      if (files.length === 0) return;

      if (items.length + files.length > MAX_IMAGES) {
        onError(`Chỉ được thêm tối đa ${MAX_IMAGES} ảnh cho mỗi sản phẩm`);
        return;
      }

      const validFiles: File[] = [];
      for (const file of files) {
        if (!DEFAULT_ALLOWED_IMAGE_TYPES.includes(file.type)) {
          onError(`${file.name}: chỉ hỗ trợ ảnh JPEG, PNG hoặc WEBP`);
          continue;
        }
        if (file.size > DEFAULT_MAX_IMAGE_SIZE_BYTES) {
          onError(`${file.name}: dung lượng vượt quá 5MB`);
          continue;
        }
        validFiles.push(file);
      }

      setItems((prev) => [
        ...prev,
        ...validFiles.map((file) => ({
          key: `pending-${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
          file,
          previewUrl: URL.createObjectURL(file),
        })),
      ]);
    };

    const handleRemove = (key: string) => {
      setItems((prev) => {
        const target = prev.find((item) => item.key === key);
        if (target?.file) URL.revokeObjectURL(target.previewUrl);
        return prev.filter((item) => item.key !== key);
      });
    };

    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          {items.map((item) => (
            <div
              key={item.key}
              className="relative w-24 h-24 rounded-xl overflow-hidden bg-[#F3EFEA] border border-[#DF9E47]/20 shrink-0"
            >
              <Image src={item.previewUrl} alt="Ảnh sản phẩm" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => handleRemove(item.key)}
                disabled={disabled}
                className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-black/60 text-white text-xs hover:bg-black/80 transition-colors disabled:opacity-50"
                aria-label="Xóa ảnh"
              >
                ✕
              </button>
            </div>
          ))}

          {items.length < MAX_IMAGES && (
            <label
              htmlFor={inputId}
              className={`w-24 h-24 rounded-xl border border-dashed border-[#002B1F]/30 flex items-center justify-center text-xs font-bold text-[#002B1F] cursor-pointer hover:bg-[#F3EFEA] transition-colors shrink-0 ${
                disabled ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              + Thêm ảnh
            </label>
          )}
        </div>

        <input
          id={inputId}
          type="file"
          accept={DEFAULT_ALLOWED_IMAGE_TYPES.join(",")}
          multiple
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
        />

        <p className="text-xs text-slate-400">
          Ảnh đầu tiên sẽ là ảnh đại diện sản phẩm. Ảnh chỉ thực sự được tải lên khi bạn lưu sản phẩm.
        </p>
      </div>
    );
  }
);
