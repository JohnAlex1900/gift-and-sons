import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { type Property, type Inquiry } from "@shared/schema";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:5000/api" // Use local backend during development
  : "https://giftandsonsinternational.com/api";

export default function PropertyDetails() {
  const { id } = useParams();
  const [user] = useAuthState(auth);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquiryNumber, setInquiryNumber] = useState("");

  const { data: property, isLoading } = useQuery<Property>({
    queryKey: [`/api/properties/${id}`],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`${API_BASE_URL}/properties/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch property details");
      }
      return response.json();
    },
    staleTime: 60000,
  });

  const inquiryMutation = useMutation({
    mutationFn: async ({
      message,
      number,
    }: {
      message: string;
      number: string;
    }) => {
      if (!user) throw new Error("Must be logged in to make inquiries");
      if (!property) throw new Error("Property details not available");

      const inquiry: Partial<Inquiry> = {
        propertyId: id,
        propertyName: property.title,
        userId: user.uid,
        userEmail: user.email ?? "",
        message,
        number,
      };
      await apiRequest("POST", "/api/inquiries", inquiry);
    },
    onSuccess: () => {
      toast({
        title: "Inquiry sent!",
        description: "We'll get back to you soon.",
      });
      setInquiryMessage("");
      setInquiryNumber("");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send inquiry. Please try again.",
      });
    },
  });

  console.log("Property image URLs:", property?.imageUrls);

  if (!user) {
    return (
      <div className="flex flex-col items-center text-center py-16">
        <h2 className="text-2xl font-bold mb-4">
          Sign in to View Property Details
        </h2>
        <p className="text-muted-foreground mb-8">
          Please sign in or create an account.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => setLocation("/signin")}>Sign In</Button>
          <Button variant="outline" onClick={() => setLocation("/signup")}>
            Create Account
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-16">
        <div className="animate-pulse w-full h-[400px] bg-gray-300 rounded-lg" />
        <div className="animate-pulse w-1/3 h-8 bg-gray-300 rounded mt-4" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold">Property not found</h1>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Image Display Logic */}
      {(property.imageUrls ?? []).length > 1 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {property.imageUrls?.map((url, index) => (
            <div key={index} className="relative">
              <img
                src={url}
                alt={`Image ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg shadow-md"
              />
            </div>
          ))}
        </div>
      ) : property.imageUrls?.length === 1 ? (
        <div className="w-full">
          <img
            src={property.imageUrls[0]}
            alt="Property Image"
            className="w-full h-[400px] object-cover rounded-lg"
          />
        </div>
      ) : (
        <div className="col-span-2 text-center text-muted-foreground">
          No images available
        </div>
      )}

      <div className="mt-6 space-y-6">
        <h1 className="text-3xl font-bold text-primary">{property.title}</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          {property.description}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-muted-foreground">
          <p className="text-foreground">
            <strong className="text-primary">Price:</strong> kes{" "}
            {property.price}
          </p>
          <p className="text-foreground">
            <strong className="text-primary">Type:</strong> {property.type}
          </p>
          <p className="text-foreground">
            <strong className="text-primary">Category:</strong>{" "}
            {property.category}
          </p>
          <p className="text-foreground">
            <strong className="text-primary">Location:</strong>{" "}
            {property.location}
          </p>
        </div>
      </div>

      <Card className="mt-8 shadow-lg border border-muted-foreground">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Interested in this property?
          </h2>
          <Textarea
            className="bg-foreground"
            placeholder="Write your inquiry here..."
            value={inquiryMessage}
            onChange={(e) => setInquiryMessage(e.target.value)}
          />
          <Input
            className="bg-foreground"
            placeholder="Enter your phone number"
            type="tel"
            value={inquiryNumber}
            onChange={(e) => setInquiryNumber(e.target.value)}
          />
          <Button
            className="w-full"
            onClick={() =>
              inquiryMutation.mutate({
                message: inquiryMessage,
                number: inquiryNumber,
              })
            }
            disabled={inquiryMutation.isPending}
          >
            Send Inquiry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
