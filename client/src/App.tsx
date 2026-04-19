import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AppShell } from "@/components/AppShell";
import Welcome from "@/pages/Welcome";
import Dashboard from "@/pages/Dashboard";
import Games from "@/pages/Games";
import Roster from "@/pages/Roster";
import Messages from "@/pages/Messages";
import NotFound from "@/pages/not-found";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router hook={useHashLocation}>
        <Switch>
          <Route path="/" component={Welcome} />
          <Route path="/dashboard" component={() => <AppShell><Dashboard /></AppShell>} />
          <Route path="/games" component={() => <AppShell><Games /></AppShell>} />
          <Route path="/roster" component={() => <AppShell><Roster /></AppShell>} />
          <Route path="/messages" component={() => <AppShell><Messages /></AppShell>} />
          <Route component={() => <AppShell><NotFound /></AppShell>} />
        </Switch>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}
