"use client";

import { useRef, useState, type SyntheticEvent } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import { Crop as CropIcon, Maximize, RotateCcw, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cropImage } from "@/lib/utils/cropImage";
import { useAnalyzeStore } from "@/stores/analyzeStore";

interface RegionSelectProps {
  onUseRegion: (base64: string, mimeType: string, previewDataUrl: string) => void;
  onUseFull: () => void;
  onRetake: () => void;
}

export function RegionSelect({
  onUseRegion,
  onUseFull,
  onRetake,
}: RegionSelectProps) {
  const { previewUrl } = useAnalyzeStore();
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  if (!previewUrl) return null;

  const handleImageLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initial: PixelCrop = {
      unit: "px",
      x: width * 0.05,
      y: height * 0.05,
      width: width * 0.9,
      height: height * 0.9,
    };
    setCrop({ unit: "%", x: 5, y: 5, width: 90, height: 90 });
    setCompletedCrop(initial);
  };

  const handleUseRegion = () => {
    if (!imgRef.current || !completedCrop) {
      onUseFull();
      return;
    }
    const result = cropImage(imgRef.current, completedCrop);
    if (!result) {
      onUseFull();
      return;
    }
    onUseRegion(result.base64, result.mimeType, result.dataUrl);
  };

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <span className="text-3xl" role="img" aria-label="스냅이">
          🦊
        </span>
        <p className="text-lg font-medium text-ink">
          풀고 싶은 문제를 네모로 콕 집어줘!
        </p>
      </div>

      <div className="flex justify-center overflow-hidden rounded-card bg-surface-soft p-2">
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
          className="max-h-[60vh]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- 크롭 대상은 data URL이라 next/image 최적화 대상 아님 */}
          <img
            ref={imgRef}
            src={previewUrl}
            alt="올린 수학 문제 — 영역을 드래그해서 지정하세요"
            onLoad={handleImageLoad}
            className="max-h-[60vh] w-auto object-contain"
          />
        </ReactCrop>
      </div>

      <p className="flex items-center justify-center gap-2 text-center text-sm text-ink-soft">
        <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
        지정한 부분만 읽고, 사진은 저장하지 않아요.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="primary" className="flex-1" onClick={handleUseRegion}>
          <CropIcon className="h-5 w-5" aria-hidden="true" /> 이 부분 풀기
        </Button>
        <Button variant="accent" className="flex-1" onClick={onUseFull}>
          <Maximize className="h-5 w-5" aria-hidden="true" /> 전체 사용
        </Button>
        <Button variant="ghost" className="flex-1" onClick={onRetake}>
          <RotateCcw className="h-5 w-5" aria-hidden="true" /> 다시 고르기
        </Button>
      </div>
    </Card>
  );
}
