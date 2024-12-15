import React from "react";
import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "Genome puzzles for Microbial genomes",
  description: "Created by Nabil-Fareed Alikhan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${newsreader.className} antialiased`}
      >
        <nav>
          <ul className="flex space-x-4">
            <li className="font-bold mr-6">
              <Link href="/">Home</Link>
            </li>
            <li className="font-bold mr-6">
              <Link href="/about">About</Link>
            </li>
            <li className="font-bold mr-6">
              <Link href="/assembly">Genome assembly puzzle</Link>
            </li>              
          </ul>        
        </nav>
        {children}
      </body>
    </html>
  );
}
