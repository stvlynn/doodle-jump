import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import localFont from "next/font/local";

const inter = Inter({ subsets: ["latin"] });

// 加载DOTMATRIX字体
const dotMatrix = localFont({
  src: '../public/fonts/DOTMATRIX.ttf',
  variable: '--font-dotmatrix',
});

export const metadata: Metadata = {
  title: "Doodle Jump GameBoy",
  description: "A GameBoy-styled Doodle Jump clone",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${inter.className} ${dotMatrix.variable}`}>{children}</body>
    </html>
  );
}
