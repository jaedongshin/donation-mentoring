import type { Metadata, Viewport } from "next";
import { Source_Sans_3, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import {
  siteConfig,
  defaultOpenGraph,
  allKeywords,
  homePageJsonLd,
} from "@/utils/seo";

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
    template: "%s | Donation Mentoring",
    default: "Donation Mentoring - Connect with Mentors for a Cause",
  },
  description: siteConfig.shortDescription.en,
  keywords: allKeywords,
  openGraph: {
    ...defaultOpenGraph,
    title: "Donation Mentoring",
    description: siteConfig.shortDescription.en,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Donation Mentoring",
    description: siteConfig.shortDescription.en,
  },
  verification: {
    other: {
      "naver-site-verification": "a32447aac3b2176e739b1665c5312ee664965333",
    },
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={siteConfig.language}>
      <head>
        {/* JSON-LD Structured Data for AI and Search Engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(homePageJsonLd),
          }}
        />
      </head>
      <body
        className={`${sourceSans.variable} ${notoSansKR.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
