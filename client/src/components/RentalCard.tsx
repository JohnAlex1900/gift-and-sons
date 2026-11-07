import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, Square, MapPin } from "lucide-react";
import type { Rental } from "@/types";

export function RentalCard({ rental }: { rental: Rental }) {
  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      {/* Image Container */}
      <div className="relative aspect-video overflow-hidden bg-muted shrink-0">
        {rental.imageUrls?.[0] ? (
          <img
            src={rental.imageUrls[0]}
            alt={rental.title}
            loading="lazy"
            decoding="async"
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gray-200">
            No image available
          </div>
        )}

        {/* Badges for Status / Featured */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 items-start">
          {rental.featured && (
            <Badge className="bg-primary text-primary-foreground shadow-sm">
              Featured
            </Badge>
          )}
          {rental.status === "Rented" && (
            <Badge variant="destructive" className="shadow-sm">
              Rented
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-5 flex-grow">
        {/* Title */}
        <h3 className="text-xl font-bold line-clamp-1 mb-2 text-foreground">
          {rental.title}
        </h3>

        {/* Location */}
        <p className="text-muted-foreground flex items-center text-sm mb-4">
          <MapPin className="h-4 w-4 mr-1.5 shrink-0 text-primary" />
          <span className="line-clamp-1">{rental.location}</span>
        </p>

        {/* Price */}
        <div className="mb-5">
          <span className="text-2xl font-bold text-primary">
            ksh {rental.price.toLocaleString()}
          </span>
          <span className="text-sm font-medium text-muted-foreground ml-1">
            / month
          </span>
        </div>

        {/* Key Features Grid */}
        <div className="grid grid-cols-3 gap-2 border-t pt-4 text-sm text-muted-foreground">
          {rental.bedrooms && rental.bedrooms.length > 0 && (
            <div className="flex items-center justify-center gap-1.5">
              <Bed className="h-4 w-4" />
              <span>{rental.bedrooms[0]} Beds</span>
            </div>
          )}
          {rental.bathrooms !== undefined && (
            <div className="flex items-center justify-center gap-1.5 border-l">
              <Bath className="h-4 w-4" />
              <span>{rental.bathrooms} Baths</span>
            </div>
          )}
          {rental.area !== undefined && (
            <div className="flex items-center justify-center gap-1.5 border-l">
              <Square className="h-4 w-4" />
              <span className="truncate">{rental.area} sqft</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0 shrink-0">
        <Link href={`/rentals/${rental.id}`} className="w-full">
          <button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium h-10 px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
            View Details
          </button>
        </Link>
      </CardFooter>
    </Card>
  );
}
