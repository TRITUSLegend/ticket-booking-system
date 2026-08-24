import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../lib/auth-context";
import { Navbar } from "../components/booking/Navbar";
import { ToastProvider } from "../components/ui/Toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TicketPro — Ticket Booking System",
  description: "Book tickets for movies and concerts with real-time seat selection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans bg-[var(--bg-deep)] text-[var(--text-primary)]">
        <ToastProvider>
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
            </div>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
