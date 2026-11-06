import { SearchFilters } from "@/components/SearchFilters";
import { useQuery } from "@tanstack/react-query";
import { Rental } from "@/types"; // Make sure to export this in your types
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import React from "react";
import { fetchRentals } from "@/lib/public-firestore";
import { RentalCard } from "@/components/RentalCard";

export default function Rentals() {
  const [filters, setFilters] = useState<{
    minPrice?: number;
    maxPrice?: number;
    [key: string]: any;
  }>({});

  const { data: rentals, isLoading } = useQuery<Rental[]>({
    queryKey: ["/api/rentals", filters],
    queryFn: fetchRentals,
  });

  const filteredRentals = rentals?.filter((rental) => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;

      // Assuming rentals also use 'price' (could be 'rentAmount' depending on your schema)
      if (key === "minPrice" && typeof value === "number")
        return rental.price >= value;
      if (key === "maxPrice" && typeof value === "number")
        return rental.price <= value;

      if (key in rental) {
        return (rental as any)[key] === value;
      }

      return true;
    });
  });

  return (
    <>
      <Helmet>
        <title>Rentals - Gift & Sons Properties</title>
        <meta
          name="description"
          content="Browse premium rental properties with Gift & Sons International"
        />
        <meta property="og:title" content="Rentals - Gift & Sons Properties" />
        <meta
          property="og:description"
          content="Browse premium rental properties with Gift & Sons International"
        />
        <meta
          property="og:url"
          content={`https://giftandsonsinternational.com/rentals`}
        />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8">Rentals</h1>

        <div className="mb-8">
          {/* Note: You may eventually want a RentalSearchFilters component if rental filters differ from property filters */}
          <SearchFilters onFiltersChange={setFilters} />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-[400px] bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRentals?.map((rental) => (
              <RentalCard key={rental.id} rental={rental} />
            ))}
          </div>
        )}

        {filteredRentals?.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">No rentals found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters to find more available rentals
            </p>
          </div>
        )}
      </div>
    </>
  );
}
