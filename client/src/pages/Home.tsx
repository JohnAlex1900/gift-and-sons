import { Hero } from "@/components/Hero";
import { PropertyCard } from "@/components/PropertyCard";
import { useQuery } from "@tanstack/react-query";
import { Property } from "@/types";
import axios from "axios";
import { Helmet } from "react-helmet-async";
import React from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

console.log(API_BASE_URL);

export default function Home() {
  // Fetch featured properties
  const {
    data: featuredProperties = [],
    isLoading,
    isError,
    error,
  } = useQuery<Property[]>({
    queryKey: ["/api/properties/featured"],
    queryFn: async () => {
      const response = await axios.get<Property[]>(
        `${API_BASE_URL}/api/properties/featured`
      );
      return response.data;
    },
  });

  // Show loading state
  if (isLoading) {
    return (
      <div>
        <Hero />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold mb-8">Featured Properties</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-[400px] bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    console.error("Failed to fetch featured properties:", error);
    return (
      <div>
        <Hero />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Oops!</h2>
          <p className="text-muted-foreground">
            Failed to load featured properties. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Helmet>
        <title>Home - Gift & Sons Properties</title>
        <meta
          name="description"
          content="Find the best properties for your family and friends."
        />
        <meta property="og:title" content="Home - Gift & Sons Properties" />
        <meta
          property="og:description"
          content="Find the best properties for your family and friends."
        />

        <meta
          property="og:url"
          content={`https://giftandsonsinternational.com`}
        />
      </Helmet>
      <Hero />
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">Featured Properties</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProperties.map((property: Property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-primary text-3xl font-bold mb-4">
              Why Choose Gift And Sons Properties?
            </h2>
            <p className="text-muted-foreground mb-8">
              With years of experience in the real estate market, we help you
              find the perfect property that matches your needs and aspirations.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Expert Guidance",
                  description: "Professional advice throughout your journey",
                },
                {
                  title: "Premium Properties",
                  description: "Carefully curated luxury real estate portfolio",
                },
                {
                  title: "Site Tours",
                  description:
                    "We provide personalized site tours to help you explore your new home",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="p-6 bg-background rounded-lg"
                >
                  <h3 className="text-xl font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
