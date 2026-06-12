import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MockMaster - Mock Tests for Competitive Exams",
  description: "Free mock tests for SSC, Banking, Railways, WBCS, CTET, Defence and more Indian competitive exams. Practice with real exam pattern questions.",
  keywords: ["mock test", "SSC CGL", "IBPS PO", "RRB NTPC", "WBCS", "CTET", "exam preparation", "India", "competitive exams"],
  authors: [{ name: "MockMaster" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "MockMaster - Mock Tests for Competitive Exams",
    description: "Free mock tests for all major Indian competitive exams",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#ea580c" />
      </head>
      <body
        className={`${geistSans.variable} antialiased bg-gray-50 text-foreground overflow-x-hidden`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
