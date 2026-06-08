import "./globals.css";
import type { Metadata, Viewport } from "next";
import { sourceSans } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Castrol Auto Service — WSMS Launch",
  description: "Interactive launch experience for the WSMS app by F6.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={sourceSans.variable}>
      <body className="min-h-screen bg-black font-sans text-white antialiased no-select">
        {children}
      </body>
    </html>
  );
}
