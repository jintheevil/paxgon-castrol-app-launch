import localFont from "next/font/local";

/**
 * Source Sans Pro, loaded from the local .ttf files in public/assets/Fonts.
 * Exposes the same `--font-source-sans` CSS variable the rest of the app uses.
 *
 * Note: next/font/local reads these files at build time via the relative path
 * below — they must be present and non-empty or the build will warn and fall
 * back to system sans.
 */
export const sourceSans = localFont({
  src: [
    { path: "../public/assets/Fonts/SourceSansPro-ExtraLight.ttf", weight: "200", style: "normal" },
    { path: "../public/assets/Fonts/SourceSansPro-ExtraLightItalic.ttf", weight: "200", style: "italic" },
    { path: "../public/assets/Fonts/SourceSansPro-Light.ttf", weight: "300", style: "normal" },
    { path: "../public/assets/Fonts/SourceSansPro-LightItalic.ttf", weight: "300", style: "italic" },
    { path: "../public/assets/Fonts/SourceSansPro-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/assets/Fonts/SourceSansPro-Italic.ttf", weight: "400", style: "italic" },
    { path: "../public/assets/Fonts/SourceSansPro-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../public/assets/Fonts/SourceSansPro-SemiBoldItalic.ttf", weight: "600", style: "italic" },
    { path: "../public/assets/Fonts/SourceSansPro-Bold.ttf", weight: "700", style: "normal" },
    { path: "../public/assets/Fonts/SourceSansPro-BoldItalic.ttf", weight: "700", style: "italic" },
    { path: "../public/assets/Fonts/SourceSansPro-Black.ttf", weight: "900", style: "normal" },
    { path: "../public/assets/Fonts/SourceSansPro-BlackItalic.ttf", weight: "900", style: "italic" },
  ],
  variable: "--font-source-sans",
  display: "swap",
});
