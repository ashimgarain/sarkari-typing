import "./globals.css";
import PwaRegister from "../components/PwaRegister";

export const metadata = {
  metadataBase: new URL("https://typing.aglimitless.in"),
  title: {
    default: "aglimitless",
    template: "%s | aglimitless",
  },
  description:
    "SarkariType Pro is a government-exam typing practice platform with exam simulation, saved progress, XP, streaks, challenges and detailed accuracy analysis.",
  applicationName: "SarkariType Pro",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/sarkaritype-icon.svg", type: "image/svg+xml" },
      { url: "/sarkaritype-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/sarkaritype-192.png",
  },
  openGraph: {
    title: "SarkariType Pro",
    description: "Train smarter for government typing exams and share your progress.",
    url: "https://typing.aglimitless.in/",
    siteName: "SarkariType Pro",
    type: "website",
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8ff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('sarkari_theme')||'dark';var p=localStorage.getItem('sarkari_palette')||'pastel';var l=localStorage.getItem('sarkari_layout')||'standard';var r=document.documentElement;r.classList.toggle('dark',t==='dark');r.style.colorScheme=t;r.dataset.palette=p;r.dataset.layout=l;}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
