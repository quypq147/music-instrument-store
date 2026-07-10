export const DEFAULT_ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const DEFAULT_MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

/** Requests a presigned S3 POST from `uploadUrlEndpoint`, then uploads `file` directly to S3. Returns the resulting public URL. */
export async function uploadImageFile(
  file: File,
  uploadUrlEndpoint: string,
  authToken: string
): Promise<string> {
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

  return publicUrl;
}
