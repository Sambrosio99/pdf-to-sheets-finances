import { AuthPage } from "@/pages/Auth";
import Index from "@/pages/Index";
import GoogleSheetsExport from "@/pages/GoogleSheetsExport";
import NotFound from "@/pages/NotFound";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient } from "react-query";

function App() {
  return (
    <QueryClient>
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <Toaster />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/sheets" element={<GoogleSheetsExport />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClient>
  );
}

export default App;
