import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

/* Serif untuk heading — memberi kesan vintage & literary */
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

/* Sans-serif untuk body text — bersih dan terbaca */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default:  "LyricVenture",
    template: "%s | LyricVenture",
  },
  description: "Explore the meaning behind your favorite songs. Expert lyric analyses covering metaphor, symbolism, and cultural context.",

 
  metadataBase: new URL("https://lyricventure.com"),
  openGraph: {
    siteName: "LyricVenture",
    type:     "website",
    locale:   "en_US",
  },
  twitter: {
    card:    "summary_large_image",
    creator: "@lyricventure",
  },
  robots: {
    index:  true,
    follow: true,
  },

};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${playfair.variable} ${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}