import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/src/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Nexora",
  description: "Digital Sanctuary",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body suppressHydrationWarning={true}>
        <ThemeProvider />
        {children}
      </body>
    </html>
  );
}