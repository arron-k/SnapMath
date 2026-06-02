export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export interface ImageReadResult {
  base64: string;
  dataUrl: string;
  mimeType: string;
}

export interface ImageValidationError {
  message: string;
}

export function validateImageFile(file: File): ImageValidationError | null {
  if (!file.type.startsWith("image/")) {
    return { message: "사진 파일만 올릴 수 있어요. 그림 파일로 다시 골라줄래?" };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { message: "사진이 너무 커요(10MB 넘음). 조금 작은 사진으로 올려줄래?" };
  }
  return null;
}

export function imageToBase64(file: File): Promise<ImageReadResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1] ?? "";
      resolve({ base64, dataUrl, mimeType: file.type });
    };
    reader.onerror = () =>
      reject(new Error("사진을 읽지 못했어요. 한 번 더 시도해줄래?"));
    reader.readAsDataURL(file);
  });
}
