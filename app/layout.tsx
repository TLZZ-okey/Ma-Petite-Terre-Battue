import type { Metadata, Viewport } from "next";
import { AppProvider } from "@/components/AppProvider";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Ma Petite Terre Battue",
    template: "%s · Ma Petite Terre Battue",
  },
  description: "Pronostique les matchs de tennis entre amis : vainqueur, nombre de sets et classement.",
  applicationName: "Ma Petite Terre Battue",
  appleWebApp: {
    capable: true,
    title: "Terre Battue",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b5b43",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh font-sans antialiased">
        <AppProvider>{children}</AppProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
