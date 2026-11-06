import { useEffect, useRef } from "react";
import { Router, Route, Switch, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getAuth, getRedirectResult, onAuthStateChanged } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { TooltipProvider } from "./components/ui/tooltip";
import React from "react";
import { apiUrl } from "@/api";

const Home = React.lazy(() => import("@/pages/Home"));
const Properties = React.lazy(() => import("@/pages/Properties"));
const PropertyDetails = React.lazy(() => import("@/pages/PropertyDetails"));
const Contact = React.lazy(() => import("@/pages/Contact"));
const Admin = React.lazy(() => import("@/pages/Admin"));
const SignIn = React.lazy(() => import("@/pages/SignIn"));
const SignUp = React.lazy(() => import("@/pages/SignUp"));
const CarDetails = React.lazy(() => import("./pages/CarDetails"));
const Cars = React.lazy(() => import("./pages/Cars"));
const ReviewsPage = React.lazy(() => import("./pages/Reviews"));
const Rentals = React.lazy(() => import("./pages/Rentals"));
const RentalDetails = React.lazy(() => import("./pages/RentalDetails"));

function RedirectToHome() {
  const [, navigate] = useLocation();

  useEffect(() => {
    navigate("/");
  }, []);

  return null;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/properties" component={Properties} />
      <Route path="/properties/:id" component={PropertyDetails} />
      <Route path="/cars" component={Cars} />
      <Route path="/cars/:id" component={CarDetails} />
      <Route path="/contact" component={Contact} />
      <Route path="/admin" component={Admin} />
      <Route path="/signin" component={SignIn} />
      <Route path="/signup" component={SignUp} />
      <Route path="/reviews" component={ReviewsPage} />
      <Route path="/rentals" component={Rentals} />
      <Route path="/rentals/:id" component={RentalDetails} />
      <Route component={RedirectToHome} />
    </Switch>
  );
}

export default function App() {
  const { toast } = useToast();
  const auth = getAuth();
  const toastShown = useRef(false); // Prevent multiple toasts

  // Sign-in redirect toast
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          toast({
            title: "Success",
            description: "Successfully signed in!",
          });
        }
      })
      .catch((error) => {
        console.error("Authentication redirect error:", error);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Failed to complete authentication. Please try again.",
        });
      });
  }, []);

  // Show "new reviews" toast once per session
  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;

      if (user?.email === adminEmail && !toastShown.current) {
        try {
          const response = await fetch(apiUrl("/api/reviews/unviewed_count"));
          const data = await response.json();

          if (data.count > 0) {
            toast({
              title: "🔔 New Reviews",
              description: `You have ${data.count} unviewed review${
                data.count > 1 ? "s" : ""
              }.`,
            });
          }

          toastShown.current = true;
        } catch (err) {
          console.error("Failed to fetch new reviews:", err);
        }
      }
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router base="/">
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <React.Suspense
                fallback={
                  <div
                    className="min-h-[50vh] animate-pulse bg-muted"
                    role="status"
                    aria-label="Loading page"
                  />
                }
              >
                <AppRouter />
              </React.Suspense>
            </main>
            <Footer />
          </div>
          <Toaster />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
