import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "../components/auth_provider";


export const metadata: Metadata = {
  title: "lkjsxcnext",
  description: "lkjsxcnext",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
