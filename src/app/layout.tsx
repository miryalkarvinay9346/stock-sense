import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StockSense | Modular Inventory Management System",
  description: "Digitize and streamline stock-related operations with centralized, real-time tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
