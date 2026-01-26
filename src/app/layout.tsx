import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Michael D1 Pathway | D1 Swimming Recruiting Assistant",
  description: "AI-powered assistant for Michael Shapira's D1 swimming recruiting journey. Track times, meets, schools, and Shabbat scheduling.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
