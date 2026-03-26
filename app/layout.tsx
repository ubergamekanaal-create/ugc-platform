import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CIRCL",
  description:
    "Modern creator-brand SaaS platform with role-based dashboards, campaign workflows, Supabase auth, and Stripe integration scaffolding.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
