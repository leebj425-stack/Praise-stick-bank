import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "칭찬막대 · 햇살초 3학년 2반",
  description: "작은 칭찬이 모여 우리 반의 멋진 하루가 됩니다.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
