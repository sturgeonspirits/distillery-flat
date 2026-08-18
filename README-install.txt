Distillery Flat icon pack rebuilt from the single approved main image.

This version uses only the main icon artwork shown by the user.
No mockup sheet or mini preview icons are included in the source.

Install:
1. Copy app/icon.png and app/apple-icon.png into your repo's app folder.
2. Copy everything in public/ into your repo's public folder.
3. In app/layout.tsx, make sure your metadata includes:

export const metadata = {
  title: "Distillery Flat",
  manifest: "/site.webmanifest",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};
