import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ticket System",
  description: "Support ticketing system",
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
