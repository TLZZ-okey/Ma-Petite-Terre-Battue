import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Ma Petite Terre Battue",
    short_name: "Terre Battue",
    description: "Pronostique les matchs de tennis entre amis : vainqueur, nombre de sets et classement.",
    lang: "fr",
    start_url: "/matchs",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b5b43",
    theme_color: "#0b5b43",
    categories: ["sports", "games"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
