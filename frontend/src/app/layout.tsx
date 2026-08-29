import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Attendify - Smart Attendance with AI",
  description: "Seamless classroom attendance powered by facial recognition.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-light dark:bg-dark text-dark dark:text-light transition-colors duration-300`}>
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
