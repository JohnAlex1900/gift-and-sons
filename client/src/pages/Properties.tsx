import { PropertyCard } from "@/components/PropertyCard";
import { SearchFilters } from "@/components/SearchFilters";
import { useQuery } from "@tanstack/react-query";
import { type Property } from "@shared/schema";
import { useState } from "react";
import API_URL from "@/api"; // Import API base URL

async function fetchProperties() {
  const response = await fetch(`${API_URL}/api/properties`);
  if (!response.ok) throw new Error("Failed to fetch properties");
  return response.json();
}

export default function Properties() {
  const [filters, setFilters] = useState<{
    minPrice?: number;
    maxPrice?: number;
    [key: string]: any;
  }>({});

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["properties", filters],
    queryFn: fetchProperties, // Use API call function
  });

  const filteredProperties = properties?.filter((property) => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      if (key === "minPrice" && typeof value === "number")
        return property.price >= value;
      if (key === "maxPrice" && typeof value === "number")
        return property.price <= value;
      if (key in property) return (property as any)[key] === value;
      return true;
    });
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold mb-8">Properties</h1>

      <div className="mb-8">
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
          {filteredProperties?.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}

      {filteredProperties?.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No properties found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters to find more properties
          </p>
        </div>
      )}
    </div>
  );
}
