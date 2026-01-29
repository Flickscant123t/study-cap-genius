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


const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Helmet>
            <title>StudyCap - AI-Powered Study Assistant</title>
            <meta name="description" content="Master any subject with StudyCap, your AI-powered study companion. Get instant explanations, create flashcards, and ace your exams with personalized learning." />

            {/* Open Graph / Facebook */}
            <meta property="og:title" content="StudyCap - AI-Powered Study Assistant" />
            <meta property="og:description" content="Master any subject with StudyCap, your AI-powered study companion. Get instant explanations, create flashcards, and ace your exams with personalized learning." />
            <meta property="og:image" content="https://studycapgenius.vercel.app/image.png/" />
            <meta property="og:url" content="https://studycapgenius.vercel.app/" />
            <meta property="og:type" content="website" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="StudyCap - AI-Powered Study Assistant" />
            <meta name="twitter:description" content="Master any subject with StudyCap, your AI-powered study companion. Get instant explanations, create flashcards, and ace your exams with personalized learning." />
            <meta name="twitter:image" content="https://studycapgenius.vercel.app/image.png/" />
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