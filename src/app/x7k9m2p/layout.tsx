import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System",
  description: "System management",
  robots: "noindex, nofollow",
};

export default function SystemLayout({
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
