import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sturgeon Flat App",
  description: "Operations dashboard for Sturgeon Spirits Distillery Flat",
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