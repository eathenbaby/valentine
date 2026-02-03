import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import SenderInfoPage from "@/pages/SenderInfoPage";
import ConfessionComposePage from "@/pages/ConfessionComposePage";
import ConfessionViewer from "@/pages/ConfessionViewer";
import VaultSubmitPage from "@/pages/VaultSubmitPage";
import V4ultAdminPage from "@/pages/V4ultAdminPage";
import AdminExportStoryPage from "@/pages/AdminExportStoryPage";
import RevealPage from "@/pages/RevealPage";
import MyVaultPage from "@/pages/MyVaultPage";
import TermsPage from "@/pages/TermsPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={SenderInfoPage} />
      <Route path="/compose" component={ConfessionComposePage} />
      <Route path="/v/:id" component={ConfessionViewer} />
      <Route path="/vault-submit" component={VaultSubmitPage} />
      <Route path="/v4ult-admin" component={V4ultAdminPage} />
      <Route path="/admin/export/:shortId" component={AdminExportStoryPage} />
      <Route path="/reveal" component={RevealPage} />
      <Route path="/my-vault" component={MyVaultPage} />
      <Route path="/terms" component={TermsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
