import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Doodle Jump",
  description: "Doodle Jump game built with Next.js and Shadcn UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
