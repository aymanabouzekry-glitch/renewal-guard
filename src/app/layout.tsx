import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NextAuthSessionProvider from "@/components/SessionProvider";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RenewalGuard",
  description: "Document renewal tracking system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-full flex flex-col antialiased",
          inter.className
        )}
      >
        <NextAuthSessionProvider>
          {children}
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}