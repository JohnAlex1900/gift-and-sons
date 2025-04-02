import { useQuery } from "@tanstack/react-query";
import { Car } from "@/types";
import { useState } from "react";
import axios from "axios";
import { CarCard } from "@/components/CarCard";
import { CarSearchFilters } from "@/components/CarSearchFilters";
import { Helmet } from "react-helmet-async";

export default function Cars() {
  const [filters, setFilters] = useState<{
    minPrice?: number;
    maxPrice?: number;
    [key: string]: any;
  }>({});

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  console.log(API_BASE_URL);

  const { data: cars, isLoading } = useQuery<Car[]>({
    queryKey: ["/api/cars", filters],
    queryFn: async () => {
      const response = await axios.get<Car[]>(`${API_BASE_URL}/api/cars`, {
        withCredentials: true, // Ensure cookies/session data are included
      });
      return response.data;
    },
  });

  const filteredCars = cars?.filter((car) => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;

      if (key === "minPrice" && typeof value === "number")
        return car.price >= value;
      if (key === "maxPrice" && typeof value === "number")
        return car.price <= value;

      if (key in car) {
        return (car as any)[key] === value;
      }

      return true;
    });
  });

  return (
    <>
      <Helmet>
        <title>Cars - Gift & Sons Properties</title>
        <meta name="description" content="Browse our range of cars" />
        <meta property="og:title" content="Cars - Gift & Sons Properties" />
        <meta property="og:description" content="Browse our range of cars" />
        <meta
          property="og:url"
          content={`https://giftandsonsinternational.com/cars`}
        />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8">cars</h1>

        <div className="mb-8">
          <CarSearchFilters onFiltersChange={setFilters} />
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
            {filteredCars?.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}

        {filteredCars?.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">No cars found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters to find more cars
            </p>
          </div>
        )}
      </div>
    </>
  );
}
