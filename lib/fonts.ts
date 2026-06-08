import localFont from "next/font/local";

export const sourceSans = localFont({
  src: [
    { path: "../app/assets/Fonts/SourceSansPro-ExtraLight.ttf", weight: "200", style: "normal" },
    { path: "../app/assets/Fonts/SourceSansPro-ExtraLightItalic.ttf", weight: "200", style: "italic" },
    { path: "../app/assets/Fonts/SourceSansPro-Light.ttf", weight: "300", style: "normal" },
    { path: "../app/assets/Fonts/SourceSansPro-LightItalic.ttf", weight: "300", style: "italic" },
    { path: "../app/assets/Fonts/SourceSansPro-Regular.ttf", weight: "400", style: "normal" },
    { path: "../app/assets/Fonts/SourceSansPro-Italic.ttf", weight: "400", style: "italic" },
    { path: "../app/assets/Fonts/SourceSansPro-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../app/assets/Fonts/SourceSansPro-SemiBoldItalic.ttf", weight: "600", style: "italic" },
    { path: "../app/assets/Fonts/SourceSansPro-Bold.ttf", weight: "700", style: "normal" },
    { path: "../app/assets/Fonts/SourceSansPro-BoldItalic.ttf", weight: "700", style: "italic" },
    { path: "../app/assets/Fonts/SourceSansPro-Black.ttf", weight: "900", style: "normal" },
    { path: "../app/assets/Fonts/SourceSansPro-BlackItalic.ttf", weight: "900", style: "italic" },
  ],
  variable: "--font-source-sans",
  display: "swap",
});
