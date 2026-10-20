import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { PortfolioLoader } from "@/components/portfolio-loader";
import { loaderBootstrap } from "@/lib/loader-bootstrap";
import "@/components/portfolio-loader.css";

export const metadata: Metadata = {
  title: "Edward Ranz Cardoza — Ranz.dev",
  description:
    "Transforming ideas into interactive digital experiences through code and design.",
  icons: {
    icon: [
      { url: "/favicons/dark/favicon.svg", type: "image/svg+xml" },
      { url: "/favicons/dark/favicon.ico", type: "image/x-icon", sizes: "any" },
      { url: "/favicons/dark/favicon-16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicons/dark/favicon-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: loaderBootstrap }} /></head>
      <body className="theme-dark">
        <PortfolioLoader />
        {children}
        <noscript>
          <style>{".theme-toggle, .menu-toggle, #photoInput, .photo-label { display: none; }"}</style>
          <nav className="noscript-navigation" aria-label="Page sections">
            <a href="#home">Home</a> / <a href="#introduction">Introduction</a>
          </nav>
        </noscript>
      </body>
    </html>
  );
}
