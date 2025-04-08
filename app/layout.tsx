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
  metadataBase: new URL(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  icons: {
    icon: "/favicon.png"
  },
  openGraph: {
    title: "Doodle Jump - Game Boy Edition",
    description: "A web-based implementation of the classic Doodle Jump game, styled as a Game Boy game. Jump as high as you can while avoiding falling!",
    images: [{ url: "/favicon.png" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Doodle Jump - Game Boy Edition",
    description: "A web-based implementation of the classic Doodle Jump game, styled as a Game Boy game.",
    images: [{ url: "/favicon.png" }],
  },
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
