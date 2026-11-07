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
import React from "react";

const fallbackImage =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa";

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(
    property.imageUrls?.[0] || fallbackImage,
  );
  const isResidential =
    property.category === "house" || property.category === "apartment";

  return (
    <Card className="overflow-hidden">
      {!imageLoaded && (
        <div className="aspect-[4/3] bg-muted animate-pulse"></div>
      )}
      <img
        src={imageSrc}
        loading="lazy"
        decoding="async"
        alt={property.title}
        className={`w-full aspect-[4/3] object-cover transition-opacity ${
          imageLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          if (imageSrc !== fallbackImage) {
            setImageSrc(fallbackImage);
          } else {
            setImageLoaded(true);
          }
        }}
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
          {isResidential && Array.isArray(property.bedrooms) && property.bedrooms.length > 0 && (
            <span>{property.bedrooms.join(", ")} beds</span>
          )}
          {isResidential && property.bathrooms !== undefined && (
            <span>{property.bathrooms} baths</span>
          )}
          {property.area !== undefined && <span>{property.area} sqft</span>}
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
