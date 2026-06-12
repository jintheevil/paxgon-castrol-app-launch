import "./globals.css";
import type { Metadata, Viewport } from "next";
import { sourceSans } from "@/lib/fonts";
import { NoContextMenu } from "@/components/NoContextMenu";

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
      <body className="h-[100dvh] bg-black font-sans text-white antialiased no-select">
        <NoContextMenu />
        {children}
      </body>
    </html>
  );
}
