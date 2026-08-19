import type { Metadata } from "next";
import { Cormorant_Garamond, Noto_Sans_KR } from "next/font/google";
import { BridalBackdrop } from "@/components/editorial/backdrop";
import "./globals.css";

const notoSans = Noto_Sans_KR({
  variable: "--font-sans",
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  weight: ["500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "웨딩 드레스 취향 테스트 — Wedding Taste Discovery",
  description:
    "드레스 사진을 넘기면 내 취향을 언어로 설명해주고, 그 취향에 맞는 드레스샵을 근거와 함께 보여드려요.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ko"
      className={`${notoSans.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <BridalBackdrop />
        {children}
      </body>
    </html>
  );
}
