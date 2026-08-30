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
      <body className={`${inter.className} bg-white text-black min-h-screen antialiased selection:bg-black selection:text-white`}>
        <main className="min-h-screen relative overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}


