import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo/site";

/**
 * Generates /manifest.webmanifest for PWA installability and richer
 * app metadata. Brand purple (#9b2e83) drives the theme color.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Connecting Women in Technology`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#9b2e83",
    lang: "en-NZ",
    icons: [
      {
        src: "/logos/she-sharp-logo-purple-dark-130x130.png",
        sizes: "130x130",
        type: "image/png",
      },
      {
        src: "/logos/she-sharp-logo-purple-dark-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logos/she-sharp-logo-purple-dark-500x500.png",
        sizes: "500x500",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logos/she-sharp-logo-purple-dark-130x130.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
