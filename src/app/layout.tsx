import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veterinaria Portella",
  description: "Sistema local de gestión veterinaria",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
