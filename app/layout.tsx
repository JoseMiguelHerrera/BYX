import type { Metadata } from "next";
import Providers from "./providers";
import "@/styles/globals.css";

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

export const metadata: Metadata = {
  title: "Home",
  description: "Welcome to Next.js",
};

import { JetBrains_Mono } from 'next/font/google';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});


export default function RootLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${jetbrainsMono.variable} font-main`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
