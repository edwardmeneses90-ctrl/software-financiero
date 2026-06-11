import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthHeader from "@/components/AuthHeader";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Control Financiero",
  description: "Bitácora de ingresos y gastos mensual",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.variable} min-h-screen bg-background`}>
        <AuthHeader />
        {children}
      </body>
    </html>
  );
}