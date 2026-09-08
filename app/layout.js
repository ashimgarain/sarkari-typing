import "./globals.css";
import PwaRegister from "../components/PwaRegister";
import SiteMigrationNotice from "../components/SiteMigrationNotice";

const SITE_URL = "https://typing.aglimitless.in";
const SOCIAL_PREVIEW_IMAGE =
  `${SITE_URL}/sarkaritype-social-preview.png`;

const SOCIAL_TITLE =
  "SarkariType Pro | Government Exam Typing Practice";

const SOCIAL_DESCRIPTION =
  "Practice SSC, Railway, Banking and government-exam typing with exam simulation, 140+ passages, saved progress, XP and detailed accuracy analysis.";

export const metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: SOCIAL_TITLE,
    template: "%s | SarkariType Pro",
  },

  description: SOCIAL_DESCRIPTION,
  applicationName: "SarkariType Pro",

  alternates: {
    canonical: "/",
  },

  manifest: "/manifest.webmanifest",

  icons: {
    icon: [
      {
        url: "/sarkaritype-icon.svg",
        type: "image/svg+xml",
      },
      {
        url: "/sarkaritype-192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    apple: "/sarkaritype-192.png",
  },

  openGraph: {
    title: SOCIAL_TITLE,
    description: SOCIAL_DESCRIPTION,
    url: SITE_URL,
    siteName: "SarkariType Pro",
    locale: "en_IN",
    type: "website",

    images: [
      {
        url: SOCIAL_PREVIEW_IMAGE,
        width: 1200,
        height: 630,
        alt: "SarkariType Pro government exam typing practice platform",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: SOCIAL_TITLE,
    description: SOCIAL_DESCRIPTION,
    images: [SOCIAL_PREVIEW_IMAGE],
  },
};

export const viewport = {
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: "#faf8ff",
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: "#0b1120",
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('sarkari_theme');var t=s==='dark'?'dark':'light';var p=localStorage.getItem('sarkari_palette')||'pastel';var l=localStorage.getItem('sarkari_layout')||'standard';var r=document.documentElement;r.classList.toggle('dark',t==='dark');r.style.colorScheme=t;r.dataset.palette=p;r.dataset.layout=l;}catch(e){}})();`,
          }}
        />
      </head>

      <body>
        <SiteMigrationNotice />
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
