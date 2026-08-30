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
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#060913] text-white min-h-screen antialiased selection:bg-sky-500/30 selection:text-sky-200`}>
        <main className="min-h-screen relative overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}

