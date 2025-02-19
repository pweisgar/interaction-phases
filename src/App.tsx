
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SurveyProvider } from "./contexts/SurveyContext";
import Landing from "./pages/Landing";
import Survey from "./pages/Survey";
import Results from "./pages/Results";
import StartMulti from "./pages/StartMulti";  // Import new Start Multi Page
import MultiQuestionSurvey from "./pages/MultiQuestionSurvey";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SurveyProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/survey" element={<Survey />} />
            <Route path="/results" element={<Results />} />
            <Route path="/startMulti" element={<StartMulti />} /> {/* New Route */}
            <Route path="/MultiQuestionSurvey" element={<MultiQuestionSurvey />} /> {/* Define your multi-question page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SurveyProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
