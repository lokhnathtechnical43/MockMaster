import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ExamPrep Bharat - Mock Tests for Indian Exams",
  description: "Free mock tests for SSC, Banking, Railways, WBCS, CTET, Defence and more Indian competitive exams. Practice with real exam pattern questions.",
  keywords: ["mock test", "SSC CGL", "IBPS PO", "RRB NTPC", "WBCS", "CTET", "exam preparation", "India", "competitive exams"],
  authors: [{ name: "ExamPrep Bharat" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "ExamPrep Bharat - Mock Tests for Indian Exams",
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
      <body
        className={`${geistSans.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
