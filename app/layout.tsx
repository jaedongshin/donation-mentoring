import type { Metadata, Viewport } from "next";
import { Source_Sans_3, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { siteConfig, defaultOpenGraph } from "@/utils/seo";

const sourceSans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoSansKR = Noto_Sans_KR({
  variable: "--font-korean",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    template: '%s | Donation Mentoring',
    default: 'Donation Mentoring - Connect with Mentors for a Cause',
  },
  description: siteConfig.description.en,
  keywords: ['mentoring', 'donation', 'mentor', 'career guidance', 'mentorship', '멘토링', '기부'],
  openGraph: {
    ...defaultOpenGraph,
    title: 'Donation Mentoring',
    description: siteConfig.description.en,
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Donation Mentoring',
    description: siteConfig.description.en,
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sourceSans.variable} ${notoSansKR.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
