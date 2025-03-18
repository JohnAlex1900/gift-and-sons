import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { signInWithGoogle, auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Login } from "@/types";
import { Link, useLocation } from "wouter";
import { FirebaseError } from "firebase/app";
import { useAuthState } from "react-firebase-hooks/auth";

export default function SignIn() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [user, loading] = useAuthState(auth);

  const form = useForm<Login>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect after successful sign-in
  useEffect(() => {
    if (user) {
      console.log("User signed in:", user);
      toast({
        title: "Success",
        description: "Signed in successfully!",
      });
      setLocation("/");
    }
  }, [user, toast, setLocation]);

  const handleEmailSignIn = async (data: Login) => {
    try {
      console.log("Attempting email sign in...");
      await signInWithEmailAndPassword(auth, data.email, data.password);
      console.log("Email sign in successful");
      toast({
        title: "Success",
        description: "Signed in successfully!",
      });
      setLocation("/");
    } catch (error: unknown) {
      console.error("Email sign in error:", error);
      let errorMessage = "Failed to sign in. Please try again.";

      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/user-not-found":
          case "auth/wrong-password":
            errorMessage = "Invalid email or password.";
            break;
          case "auth/too-many-requests":
            errorMessage = "Too many attempts. Please try again later.";
            break;
          case "auth/invalid-email":
            errorMessage = "Please enter a valid email address.";
            break;
          default:
            errorMessage = "An unexpected error occurred. Please try again.";
        }
      }

      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: errorMessage,
      });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      console.log("Attempting Google sign in...");
      await signInWithGoogle();
    } catch (error: unknown) {
      console.error("Google sign in error:", error);
      let errorMessage = "Failed to sign in with Google. Please try again.";

      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/popup-closed-by-user":
            errorMessage = "Sign in was cancelled. Please try again.";
            break;
          default:
            errorMessage = "An unexpected error occurred. Please try again.";
        }
      }

      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: errorMessage,
      });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-muted">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Sign in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleEmailSignIn)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-foreground"
                        type="email"
                        placeholder="Enter your email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-foreground"
                        type="password"
                        placeholder="Enter your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>
          </Form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-foreground px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            onClick={handleGoogleSignIn}
            className="bg-foreground hover:bg-background hover:text-foreground w-full"
            variant="outline"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google Logo"
              className="w-5 h-5 mr-2"
            />
            Continue with Google
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup">
              <a className="text-primary hover:underline">Sign up</a>
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
