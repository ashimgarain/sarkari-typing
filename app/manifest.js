export default function manifest() {
  return {
    name: "SarkariType Pro",
    short_name: "SarkariType",
    description: "Government exam typing practice with saved progress, XP and exam simulation.",
    start_url: "/",
    display: "standalone",
    background_color: "#fffafc",
    theme_color: "#8b5cf6",
    orientation: "any",
    icons: [
      { src: "/sarkaritype-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/sarkaritype-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/sarkaritype-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
