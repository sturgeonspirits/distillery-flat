Updated Distillery Flat icon set using the redrawn app-icon artwork.

Install
1. Copy files from /app into your repo's app folder.
2. Copy files from /public into your repo's public folder.
3. Ensure app/layout.tsx metadata includes:

export const metadata = {
  title: "Distillery Flat",
  manifest: "/site.webmanifest",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

Included
- app/icon.png
- app/apple-icon.png
- public/favicon.ico
- public/apple-touch-icon.png
- public/web-app-manifest-192x192.png
- public/web-app-manifest-512x512.png
- public/maskable-icon-192x192.png
- public/maskable-icon-512x512.png
- public/mstile-150x150.png
- public/site.webmanifest
