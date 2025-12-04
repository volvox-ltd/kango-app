import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// ★追加: 下部メニューを読み込み
import BottomNavigation from "@/components/BottomNavigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // アプリ名に変えておきました
  title: "KanGO! - 看護師スポットバイト",
  description: "看護師のためのスポットバイトアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 言語を日本語(ja)に変更
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* ★重要: メニューが画面下に固定される分、
          コンテンツの最後に余白(padding-bottom)を作って隠れないようにします 
        */}
        <div className="pb-24">
          {children}
        </div>

        {/* ★追加: 全ページ共通の下部メニュー */}
        <BottomNavigation />
      </body>
    </html>
  );
}