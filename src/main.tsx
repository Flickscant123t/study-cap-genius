import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

// Umami analytics
const umamiScript = document.createElement("script");
umamiScript.src = "https://cloud.umami.is/script.js";
umamiScript.defer = true;
umamiScript.dataset.websiteId = "a95b5b67-9b05-4fb2-940b-54b3d1934500";
document.head.appendChild(umamiScript);
export const metadata: Metadata = {
  metadataBase: new URL('https://corocat.me'),
  title: {
    default: 'Corocat: Your AI Guide to Learning Any Subject',
    template: `%s | Corocat`,
  },
  description: 'Corocat uses AI to create personalized learning courses on any topic. Go from beginner to expert with a structured, easy-to-follow plan.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/cat.png',
    apple: '/cat.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Corocat: Your AI Guide to Learning Any Subject',
    description: 'Corocat uses AI to create personalized learning courses on any topic. Go from beginner to expert with a structured, easy-to-follow plan.',
    url: 'https://corocat.me',
    siteName: 'Corocat',
    images: [
      {
        url: 'https://corocat.me/cat.png', // It's a good practice to create a social sharing image
        width: 1200,
        height: 1200,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Corocat: Your AI Guide to Learning Any Subject',
    description: 'Corocat uses AI to create personalized learning courses on any topic. Go from beginner to expert with a structured, easy-to-follow plan.',
    images: ['https://corocat.me/cat.png'],
  },
};


createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);