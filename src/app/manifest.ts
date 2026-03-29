import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My Chatbot",
    short_name: "MyChatbot",
    description: "My Personal Chatbot",
    start_url: "/",
    display: "standalone",
    background_color: "#252525",
    theme_color: "#252525",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
