import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduSim Teacher Portal",
  description: "Educator dashboard for class management, analytics, and student mastery",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
