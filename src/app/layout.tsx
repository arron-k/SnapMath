import type { Metadata } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";
import "react-image-crop/dist/ReactCrop.css";
import { ThemeScript } from "@/components/providers/ThemeScript";
import { Providers } from "@/components/providers/Providers";
import { AppHeader } from "@/components/layout/AppHeader";

export const metadata: Metadata = {
  title: "SnapMath — 사진 찍으면 풀어주는 수학 친구",
  description: "초등 4~6학년을 위한 또래 친구 같은 수학 학습 도우미",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          <AppHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
