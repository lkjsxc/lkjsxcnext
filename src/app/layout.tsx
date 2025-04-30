import { SessionProvider } from "next-auth/react";
import { PollingProvider } from "@/components/PollingContext";
import "./globals.css"; // Import global styles

export const metadata = {
  title: 'lkjsxcnext Memos', // Update title based on README
  description: 'A simple yet powerful web application for creating, viewing, and managing memos.', // Update description
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <PollingProvider interval={5000}> {/* Set polling interval to 5 seconds */}
            {children}
          </PollingProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
