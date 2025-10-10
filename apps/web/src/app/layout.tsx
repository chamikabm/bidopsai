import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { PerformanceMonitoring } from "@/components/common/PerformanceMonitoring";
import { MonitoringDashboard } from "@/components/common/MonitoringDashboard";
import { MonitoringInitializer } from "@/components/common/MonitoringInitializer/MonitoringInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "bidops.ai - AI-Powered Bid Automation",
  description: "Automate your bid preparation process with AI agents",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: "bidops.ai - AI-Powered Bid Automation",
    description: "Automate your bid preparation process with AI agents",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS prefetch for AWS services */}
        <link rel="dns-prefetch" href="https://cognito-idp.us-east-1.amazonaws.com" />
        <link rel="dns-prefetch" href="https://s3.amazonaws.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MonitoringInitializer />
        <Providers>{children}</Providers>
        <PerformanceMonitoring />
        <MonitoringDashboard />
      </body>
    </html>
  );
}
