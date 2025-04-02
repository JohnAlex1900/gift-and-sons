import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import React from "react";

interface SearchFiltersProps {
  onFiltersChange: (filters: any) => void;
}

export function SearchFilters({ onFiltersChange }: SearchFiltersProps) {
  const [filters, setFilters] = useState({
    type: "",
    category: "",
    minPrice: 0,
    maxPrice: 150000000,
    bedrooms: "",
    location: "",
  });

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  return (
    <div className="text-background bg-card p-6 rounded-lg space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Property Type</label>
          <Select
            value={filters.type}
            onValueChange={(value) => handleFilterChange("type", value)}
          >
            <SelectTrigger className="bg-foreground">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sale">For Sale</SelectItem>
              <SelectItem value="rent">For Rent</SelectItem>
              <SelectItem value="lease">For Lease</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select
            value={filters.category}
            onValueChange={(value) => handleFilterChange("category", value)}
          >
            <SelectTrigger className="bg-foreground">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="house">House</SelectItem>
              <SelectItem value="apartment">Apartment</SelectItem>
              <SelectItem value="land">Land</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Bedrooms</label>
          <Select
            value={filters.bedrooms}
            onValueChange={(value) => handleFilterChange("bedrooms", value)}
          >
            <SelectTrigger className="bg-foreground">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
              <SelectItem value="5">5+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Location</label>
          <Input
            className="bg-foreground"
            type="text"
            placeholder="Enter location"
            value={filters.location}
            onChange={(e) => handleFilterChange("location", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-sm font-medium">Price Range</label>
        <div className="px-2">
          <Slider
            defaultValue={[filters.minPrice, filters.maxPrice]}
            max={1000000}
            step={10000}
            onValueChange={([min, max]) => {
              handleFilterChange("minPrice", min);
              handleFilterChange("maxPrice", max);
            }}
          />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>ksh{filters.minPrice.toLocaleString()}</span>
          <span>ksh{filters.maxPrice.toLocaleString()}</span>
        </div>
      </div>

      <Button
        className="w-full"
        onClick={() => {
          setFilters({
            type: "",
            category: "",
            minPrice: 0,
            maxPrice: 150000000,
            bedrooms: "",
            location: "",
          });
          onFiltersChange({});
        }}
      >
        Reset Filters
      </Button>
    </div>
  );
}
