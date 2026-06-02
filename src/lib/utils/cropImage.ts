import type { PixelCrop } from "react-image-crop";

export interface CropResult {
  base64: string;
  dataUrl: string;
  mimeType: string;
}

export function cropImage(
  image: HTMLImageElement,
  crop: PixelCrop,
  mimeType = "image/png",
): CropResult | null {
  // 화면 표시 크기(crop 좌표 기준)를 원본 해상도로 보정
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const width = Math.round(crop.width * scaleX);
  const height = Math.round(crop.height * scaleY);
  if (width <= 0 || height <= 0) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    width,
    height,
    0,
    0,
    width,
    height,
  );

  const dataUrl = canvas.toDataURL(mimeType);
  const base64 = dataUrl.split(",")[1] ?? "";
  return { base64, dataUrl, mimeType };
}
