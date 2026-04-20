import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Distillery Flat",
  description: "Operations dashboard for Sturgeon Spirits Distillery Flat",
  applicationName: "Distillery Flat",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      {
        url: "/web-app-manifest-192x192.png",
        type: "image/png",
        sizes: "192x192",
      },
      {
        url: "/web-app-manifest-512x512.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/favicon.ico"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Distillery Flat",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#F1F1E7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-stone-50 text-stone-900 antialiased">{children}</body>
    </html>
  );
}