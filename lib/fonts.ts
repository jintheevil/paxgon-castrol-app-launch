import { Source_Sans_3 } from "next/font/google";

/**
 * Source Sans Pro is published on Google Fonts as "Source Sans 3" (the same
 * typeface, actively maintained). We load it via next/font/google rather than
 * next/font/local so the font is fetched at build time — no local .ttf binaries
 * to ship, vendor, or accidentally truncate, and it builds cleanly on Vercel.
 *
 * It's a variable font, so the full 200–900 weight axis is included; the same
 * `--font-source-sans` CSS variable is exposed, so nothing else changes.
 */
export const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-sans",
});
