import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AppShell } from "@/components/AppShell";
import Dashboard from "@/pages/Dashboard";
import Games from "@/pages/Games";
import Roster from "@/pages/Roster";
import Messages from "@/pages/Messages";
import NotFound from "@/pages/not-found";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router hook={useHashLocation}>
        <AppShell>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/games" component={Games} />
            <Route path="/roster" component={Roster} />
            <Route path="/messages" component={Messages} />
            <Route component={NotFound} />
          </Switch>
        </AppShell>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}
