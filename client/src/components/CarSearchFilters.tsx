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

interface CarSearchFiltersProps {
  onFiltersChange: (filters: any) => void;
}

export function CarSearchFilters({ onFiltersChange }: CarSearchFiltersProps) {
  const [filters, setFilters] = useState({
    make: "",
    model: "",
    year: "",
    condition: "",
    minPrice: 0,
    maxPrice: 50000000,
    minMileage: 0,
    maxMileage: 200000,
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
          <label className="text-sm font-medium">Make</label>
          <Input
            className="bg-foreground"
            type="text"
            placeholder="Enter car make"
            value={filters.make}
            onChange={(e) => handleFilterChange("make", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Model</label>
          <Input
            className="bg-foreground"
            type="text"
            placeholder="Enter car model"
            value={filters.model}
            onChange={(e) => handleFilterChange("model", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Year</label>
          <Input
            className="bg-foreground"
            type="number"
            placeholder="Enter year"
            value={filters.year}
            onChange={(e) => handleFilterChange("year", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Condition</label>
          <Select
            value={filters.condition}
            onValueChange={(value) => handleFilterChange("condition", value)}
          >
            <SelectTrigger className="bg-foreground">
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="used">Used</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-sm font-medium">Price Range</label>
        <div className="px-2">
          <Slider
            defaultValue={[filters.minPrice, filters.maxPrice]}
            max={10000000}
            step={50000}
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

      <div className="space-y-4">
        <label className="text-sm font-medium">Mileage Range</label>
        <div className="px-2">
          <Slider
            defaultValue={[filters.minMileage, filters.maxMileage]}
            max={200000}
            step={5000}
            onValueChange={([min, max]) => {
              handleFilterChange("minMileage", min);
              handleFilterChange("maxMileage", max);
            }}
          />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{filters.minMileage.toLocaleString()} km</span>
          <span>{filters.maxMileage.toLocaleString()} km</span>
        </div>
      </div>

      <Button
        className="w-full"
        onClick={() => {
          setFilters({
            make: "",
            model: "",
            year: "",
            condition: "",
            minPrice: 0,
            maxPrice: 10000000,
            minMileage: 0,
            maxMileage: 200000,
          });
          onFiltersChange({});
        }}
      >
        Reset Filters
      </Button>
    </div>
  );
}
