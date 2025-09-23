import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartPrint Print Management System",
  description: "Professional print management system with modern UI/UX design for 2025-2026",
  icons: {
    icon: [
      { url: '/logo-smart-printing.svg?v=1', type: 'image/svg+xml' },
      { url: '/logo-smart-printing.svg?v=1', type: 'image/svg+xml', sizes: '32x32' },
      { url: '/logo-smart-printing.svg?v=1', type: 'image/svg+xml', sizes: '16x16' },
    ],
    shortcut: '/logo-smart-printing.svg?v=1',
    apple: '/logo-smart-printing.svg?v=1',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Primary favicon - SVG */}
        <link rel="icon" type="image/svg+xml" href="/logo-smart-printing.svg?v=1" />
        <link rel="icon" type="image/svg+xml" sizes="32x32" href="/logo-smart-printing.svg?v=1" />
        <link rel="icon" type="image/svg+xml" sizes="16x16" href="/logo-smart-printing.svg?v=1" />
        
        {/* Fallback favicon - shortcut */}
        <link rel="shortcut icon" href="/logo-smart-printing.svg?v=1" />
        
        {/* Apple touch icons */}
        <link rel="apple-touch-icon" href="/logo-smart-printing.svg?v=1" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo-smart-printing.svg?v=1" />
        
        {/* Theme color */}
        <meta name="theme-color" content="#5B5BD6" />
        
        {/* Inline SVG favicon as fallback */}
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%235B5BD6'/><text x='16' y='22' font-family='Arial' font-size='16' font-weight='bold' text-anchor='middle' fill='white'>SP</text></svg>" />
      </head>
      <body className="antialiased bg-background text-foreground">
        <div className="w-full flex min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  );
}