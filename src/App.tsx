import { Suspense, lazy } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";

const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Whiteboard = lazy(() => import("./pages/Whiteboard"));
const Notes = lazy(() => import("./pages/Notes"));
const Flashcards = lazy(() => import("./pages/Flashcards"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Settings = lazy(() => import("./pages/Settings"));
const Success = lazy(() => import("./pages/Success"));
const StudyPlanner = lazy(() => import("./pages/StudyPlanner"));
const NotFound = lazy(() => import("./pages/NotFound"));


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
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-sm text-muted-foreground">Loading...</div>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/whiteboard" element={<Whiteboard />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/success" element={<Success />} />
              <Route path="/study-planner" element={<StudyPlanner />} />
              <Route path="/~oauth/*" element={null} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
