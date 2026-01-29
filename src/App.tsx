import { Helmet, HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
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


const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Helmet>
            <title>Study Cap Genius</title>
            <meta name="description" content="Learn with StudyCap Genius and improve your scores." />

            {/* Open Graph / Facebook */}
            <meta property="og:title" content="Study Cap Genius" />
            <meta property="og:description" content="Learn with StudyCap Genius and improve your scores." />
            <meta property="og:image" content="https://studycapgenius.vercel.app/image.png" />
            <meta property="og:url" content="https://studycapgenius.vercel.app/" />
            <meta property="og:type" content="website" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Study Cap Genius" />
            <meta name="twitter:description" content="Learn with StudyCap Genius and improve your scores." />
            <meta name="twitter:image" content="https://studycapgenius.vercel.app/image.png" />
          </Helmet>

          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;