import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Property } from "@/types";
import { Link } from "wouter";
import { useState } from "react";

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Card className="overflow-hidden">
      {!imageLoaded && <div className="h-48 bg-muted animate-pulse"></div>}
      <img
        src={
          property.imageUrls?.[0] ||
          "https://images.unsplash.com/photo-1560518883-ce09059eeffa"
        }
        loading="lazy"
        alt={property.title}
        className={`w-full h-48 object-cover transition-opacity ${
          imageLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setImageLoaded(true)}
      />
      <CardHeader>
        <CardTitle className="text-xl">{property.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          <span className="text-2xl font-bold text-primary">
            ksh
            {typeof property.price === "number"
              ? property.price.toLocaleString()
              : "N/A"}
          </span>

          <span className="text-muted-foreground capitalize">
            {property.type}
          </span>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>
            {Array.isArray(property.bedrooms) && property.bedrooms.length > 0
              ? property.bedrooms.join(", ") + " beds"
              : "N/A"}
          </span>

          <span>{property.bathrooms ?? "N/A"} baths</span>
          <span>{property.area ?? "N/A"} sqft</span>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/properties/${property.id}`}>
          <Button className="w-full">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
