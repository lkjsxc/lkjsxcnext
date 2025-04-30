import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PollingProvider } from "@/components/PollingContext"; // Will create this component next
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "lkjsxcnext",
  description: "A simple memo application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <PollingProvider>
            {children}
          </PollingProvider>
        </Providers>
      </body>
    </html>
  );
}