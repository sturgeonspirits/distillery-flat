Clean Distillery Flat icon pack

This version uses only the main redrawn master icon.
The smaller preview icons from the mockup sheet are excluded.

Install:
1. Copy /app/icon.png and /app/apple-icon.png into your repo's app folder.
2. Copy everything in /public into your repo's public folder.
3. Ensure app/layout.tsx metadata includes:

export const metadata = {
  title: "Distillery Flat",
  manifest: "/site.webmanifest",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};
