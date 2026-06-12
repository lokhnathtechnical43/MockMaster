import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Panel - ExamPrep Bharat",
  description: "Admin panel for managing ExamPrep Bharat content",
  robots: "noindex, nofollow", // Don't index admin pages
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen min-h-dvh bg-slate-50">
      {children}
    </div>
  );
}
