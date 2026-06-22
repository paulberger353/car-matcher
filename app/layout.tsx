import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CarMatcher - Fahrzeugangebote & Suchen",
  description: "CarMatcher - Fahrzeugangebote und Suchen effizient verwalten",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="scroll-smooth">
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
