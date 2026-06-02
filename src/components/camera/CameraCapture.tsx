"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Camera, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let active = true;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("이 기기에서는 카메라를 바로 열 수 없어요. 사진을 골라줄래?");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setReady(true);
      } catch {
        setError("카메라를 켤 수 없어요. 사진을 직접 골라줄래?");
      }
    }

    start();
    return () => {
      active = false;
      stopStream();
    };
  }, [stopStream]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    stopStream();
    onClose();
  }

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `snapmath-${blob.size}.jpg`, {
          type: "image/jpeg",
        });
        stopStream();
        onCapture(file);
      },
      "image/jpeg",
      0.92,
    );
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      stopStream();
      onCapture(file);
    }
  };

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="카메라로 수학 문제 찍기"
    >
      <div className="flex w-full max-w-lg flex-col gap-4 rounded-card bg-surface p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-lg font-semibold text-ink">
            <span className="text-2xl" role="img" aria-label="스냅이">
              🦊
            </span>
            문제를 화면 안에 담아줘!
          </p>
          <button
            type="button"
            onClick={handleClose}
            aria-label="카메라 닫기"
            className="flex h-12 w-12 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-brand-soft"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {error ? (
          <div className="flex flex-col items-center gap-4 rounded-card bg-surface-soft px-5 py-8 text-center">
            <span className="text-4xl" role="img" aria-label="안내">
              📷
            </span>
            <p className="text-lg text-ink" role="alert">
              {error}
            </p>
          </div>
        ) : (
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-card bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="h-full w-full object-cover"
            />
            {!ready && (
              <p className="absolute inset-0 flex items-center justify-center text-base text-white/80">
                카메라를 켜는 중…
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          {!error && (
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleCapture}
              disabled={!ready}
            >
              <Camera className="h-5 w-5" aria-hidden="true" /> 찰칵! 찍기
            </Button>
          )}
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => fileRef.current?.click()}
          >
            <ImageIcon className="h-5 w-5" aria-hidden="true" /> 사진 고르기
          </Button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
          aria-label="갤러리에서 사진 고르기"
        />
      </div>
    </motion.div>
  );
}
