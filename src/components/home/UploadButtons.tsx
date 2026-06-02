"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { AnimatePresence } from "framer-motion";
import { Camera, ImageIcon, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CameraCapture } from "@/components/camera/CameraCapture";

interface UploadButtonsProps {
  onPick: (file: File) => void;
  canStart?: () => boolean;
}

export function UploadButtons({ onPick, canStart }: UploadButtonsProps) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const allow = () => (canStart ? canStart() : true);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onPick(file);
    e.target.value = "";
  };

  const handleCapture = (file: File) => {
    setCameraOpen(false);
    onPick(file);
  };

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-6xl" role="img" aria-label="수학을 좋아하는 친구 스냅이">
          🦊
        </span>
        <h1 className="text-3xl font-bold text-brand">안녕, 나는 스냅이야!</h1>
        <p className="text-lg text-ink-soft">
          어려운 수학 문제를 사진으로 찍어줘. 같이 풀어보자!
        </p>
      </div>

      <div className="grid w-full max-w-md grid-cols-1 gap-4 sm:grid-cols-2">
        <Button
          variant="primary"
          className="h-32 flex-col text-xl"
          onClick={() => {
            if (allow()) setCameraOpen(true);
          }}
        >
          <Camera className="h-10 w-10" aria-hidden="true" />
          사진 찍기
        </Button>
        <Button
          variant="accent"
          className="h-32 flex-col text-xl"
          onClick={() => {
            if (allow()) galleryRef.current?.click();
          }}
        >
          <ImageIcon className="h-10 w-10" aria-hidden="true" />
          사진 올리기
        </Button>
      </div>

      <p className="flex items-center gap-2 text-center text-sm text-ink-soft">
        <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
        사진은 문제를 읽는 데만 쓰고, 저장하지 않아요.
      </p>

      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        aria-label="갤러리에서 수학 문제 사진 올리기"
      />

      <AnimatePresence>
        {cameraOpen && (
          <CameraCapture
            onCapture={handleCapture}
            onClose={() => setCameraOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
