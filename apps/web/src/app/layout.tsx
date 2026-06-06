import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import { Telemetry } from "@/components/Telemetry";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Revenue Pilot - Ads Management Platform",
  description: "Enterprise SaaS for managing Google and Meta Ads.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <Providers>
          <Telemetry />
          {children}
        </Providers>
      </body>
    </html>
  );
}
