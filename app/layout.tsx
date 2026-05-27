import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Wavvy — Free Music Streaming",
    template: "%s | Wavvy",
  },
  description: "Stream thousands of songs for free. Create playlists, discover music by mood, and request your favorite tracks.",
  applicationName: "Wavvy",
  keywords: ["music", "streaming", "songs", "playlists", "mood music", "Wavvy"],
  authors: [{ name: "Wavvy" }],
  creator: "Wavvy",
  publisher: "Wavvy",
  category: "music",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Wavvy",
    title: "Wavvy — Free Music Streaming",
    description: "Stream thousands of songs for free. Create playlists, discover music by mood, and request your favorite tracks.",
    images: [{ url: "/images/logo.png", width: 1200, height: 630, alt: "Wavvy" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wavvy — Free Music Streaming",
    description: "Stream thousands of songs for free. Create playlists, discover music by mood, and request your favorite tracks.",
    images: ["/images/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/images/favicon.ico",
    shortcut: "/images/favicon.ico",
    apple: "/images/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
