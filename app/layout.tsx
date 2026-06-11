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
  // Configuración para que funcione como App en el celular (PWA)
  manifest: "/manifest.json", 
  themeColor: "#000000", // Color de la barra de estado del celular (puedes cambiarlo al color principal de tu app, ej: "#2563eb")
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent", // Hace que la barra de estado se mezcle con el fondo oscuro
    title: "Finanzas", // Nombre corto que aparece bajo el icono en iPhone
  },
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