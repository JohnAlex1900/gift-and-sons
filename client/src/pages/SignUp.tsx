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
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Register } from "@/types";
import { Link, useLocation } from "wouter";
import { FirebaseError } from "firebase/app";
import { useAuthState } from "react-firebase-hooks/auth";
import React from "react";

export default function SignUp() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [user, loading] = useAuthState(auth);

  const form = useForm<Register>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  // Redirect after successful sign-up
  useEffect(() => {
    if (user) {
      console.log("User signed in:", user);
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
      setLocation("/");
    }
  }, [user, toast, setLocation]);

  const handleEmailSignUp = async (data: Register) => {
    try {
      console.log("Attempting to create account...");
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      await updateProfile(userCredential.user, {
        displayName: data.name,
      });
      console.log("Account created successfully:", userCredential.user.email);
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
      setLocation("/");
    } catch (error: unknown) {
      console.error("Email sign up error:", error);
      let errorMessage = "Failed to create account. Please try again.";

      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/email-already-in-use":
            errorMessage =
              "This email is already registered. Please sign in instead.";
            setLocation("/signin");
            break;
          case "auth/invalid-email":
            errorMessage = "Please enter a valid email address.";
            break;
          case "auth/weak-password":
            errorMessage = "Password should be at least 6 characters.";
            break;
          default:
            errorMessage = "An unexpected error occurred. Please try again.";
        }
      }

      toast({
        variant: "destructive",
        title: "Registration Error",
        description: errorMessage,
      });
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      console.log("Attempting Google sign up...");
      await signInWithGoogle();
    } catch (error: unknown) {
      console.error("Google sign up error:", error);
      let errorMessage = "Failed to sign up with Google. Please try again.";

      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/popup-closed-by-user":
            errorMessage = "Sign up was cancelled. Please try again.";
            break;
          default:
            errorMessage = "An unexpected error occurred. Please try again.";
        }
      }

      toast({
        variant: "destructive",
        title: "Registration Error",
        description: errorMessage,
      });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-muted">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Create an Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleEmailSignUp)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-foreground"
                        placeholder="Enter your name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                        placeholder="Create a password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Sign Up
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
            onClick={handleGoogleSignUp}
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
            Already have an account?{" "}
            <Link href="/signin">
              <a className="text-primary hover:underline">Sign in</a>
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
