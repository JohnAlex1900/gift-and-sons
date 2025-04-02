import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car } from "@/types";
import { Link } from "wouter";
import { useState } from "react";
import React from "react";

interface CarCardProps {
  car: Car;
}

export function CarCard({ car }: CarCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Card className="overflow-hidden">
      {!imageLoaded && <div className="h-48 bg-muted animate-pulse"></div>}
      <img
        src={
          car.imageUrls?.[0] ||
          "https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        }
        alt={car.title}
        className={`w-full h-48 object-cover transition-opacity ${
          imageLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setImageLoaded(true)}
      />
      <CardHeader>
        <CardTitle className="text-xl">{car.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          <span className="text-2xl font-bold text-primary">
            ksh
            {typeof car.price === "number" ? car.price.toLocaleString() : "N/A"}
          </span>

          <span className="text-muted-foreground capitalize">{car.year}</span>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>
            {car.make ?? "N/A"} | {car.model ?? "N/A"}
          </span>

          <span>{car.mileage ?? "N/A"} miles</span>
          <span>{car.condition ?? "N/A"} condition</span>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/cars/${car.id}`}>
          <Button className="w-full">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
