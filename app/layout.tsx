import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hi-Lo",
  description: "Pogodi je li sljedeća karta viša ili niža.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr">
      <body>{children}</body>
    </html>
  );
}