import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QBank",
  description: "A calm, focused question bank for serious study.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
