import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Property, Car, Rental } from "@/types"; // Added Rental here
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useState, useEffect, useMemo } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { useLocation } from "wouter";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import UploadButton from "@/components/UploadButton";
import axios from "axios";
import { Helmet } from "react-helmet-async";
import { apiUrl } from "@/api";
import { X } from "lucide-react";
import { isAdminEmail } from "@/lib/is-admin";

export default function Admin() {
  const [user] = useAuthState(auth);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Selection states
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null); // New

  // Image states
  const [propertyImageUrls, setPropertyImageUrls] = useState<string[]>([]);
  const [carImageUrls, setCarImageUrls] = useState<string[]>([]);
  const [rentalImageUrls, setRentalImageUrls] = useState<string[]>([]); // New

  // Bedroom selection states
  const [selectedBedrooms, setSelectedBedrooms] = useState<number[]>(
    selectedProperty?.bedrooms || [],
  );
  const [selectedRentalBedrooms, setSelectedRentalBedrooms] = useState<
    number[]
  >(selectedRental?.bedrooms?.map(Number) || []); // New

  // Property Details
  const [propertyTitle, setPropertyTitle] = useState("");
  const [propertyDescription, setPropertyDescription] = useState("");
  const [propertyPrice, setPropertyPrice] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocationInput] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [area, setArea] = useState("");
  const [propertyFeatured, setPropertyFeatured] = useState(false);
  const [propertyStatus, setPropertyStatus] = useState("available");
  const [propertyPriorityOrder, setPropertyPriorityOrder] = useState("");
  const [propertyYoutubeLink, setPropertyYoutubeLink] = useState("");
  const [isPropertyFormOpen, setIsPropertyFormOpen] = useState(false);

  // Car Details
  const [carTitle, setCarTitle] = useState("");
  const [carDescription, setCarDescription] = useState("");
  const [carPrice, setCarPrice] = useState("");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [mileage, setMileage] = useState("");
  const [condition, setCondition] = useState("");
  const [carFeatured, setCarFeatured] = useState(false);
  const [carYoutubeLink, setCarYoutubeLink] = useState("");
  const [isCarFormOpen, setIsCarFormOpen] = useState(false);

  // Rental Details (New)
  const [rentalTitle, setRentalTitle] = useState("");
  const [rentalDescription, setRentalDescription] = useState("");
  const [rentalPrice, setRentalPrice] = useState("");
  const [rentalType, setRentalType] = useState("");
  const [rentalCategory, setRentalCategory] = useState("");
  const [rentalLocation, setRentalLocation] = useState("");
  const [rentalBathrooms, setRentalBathrooms] = useState("");
  const [rentalArea, setRentalArea] = useState("");
  const [rentalFeatured, setRentalFeatured] = useState(false);
  const [rentalStatus, setRentalStatus] = useState("available");
  const [rentalPriorityOrder, setRentalPriorityOrder] = useState("");
  const [rentalYoutubeLink, setRentalYoutubeLink] = useState("");
  const [isRentalFormOpen, setIsRentalFormOpen] = useState(false);

  // Status indicators
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Sync Form States
  useEffect(() => {
    if (selectedProperty) {
      setPropertyTitle(selectedProperty.title || "");
      setPropertyDescription(selectedProperty.description || "");
      setPropertyPrice(selectedProperty.price?.toString() || "");
      setType(selectedProperty.type || "");
      setCategory(selectedProperty.category || "");
      setLocationInput(selectedProperty.location || "");
      setBathrooms(selectedProperty.bathrooms?.toString() || "");
      setArea(selectedProperty.area?.toString() || "");
      setSelectedBedrooms(selectedProperty.bedrooms || []);
      setPropertyImageUrls(selectedProperty.imageUrls || []);
      setPropertyFeatured(selectedProperty.featured || false);
      setPropertyStatus(selectedProperty.status || "available");
      setPropertyPriorityOrder(
        typeof selectedProperty.priorityOrder === "number"
          ? selectedProperty.priorityOrder.toString()
          : "",
      );
      setPropertyYoutubeLink(selectedProperty.youtubeLink || "");
    } else if (selectedCar) {
      setCarTitle(selectedCar.title || "");
      setCarDescription(selectedCar.description || "");
      setCarPrice(selectedCar.price?.toString() || "");
      setYear(selectedCar.year?.toString() || "");
      setMake(selectedCar.make || "");
      setModel(selectedCar.model || "");
      setMileage(
        typeof selectedCar.mileage === "number"
          ? selectedCar.mileage.toString()
          : "",
      );
      setCondition(selectedCar.condition || "");
      setCarImageUrls(selectedCar.imageUrls || []);
      setCarFeatured(selectedCar.featured || false);
      setCarYoutubeLink(selectedCar.youtubeLink || "");
    } else if (selectedRental) {
      // Sync Rental Form
      setRentalTitle(selectedRental.title || "");
      setRentalDescription(selectedRental.description || "");
      setRentalPrice(selectedRental.price?.toString() || "");
      setRentalType(selectedRental.type || "");
      setRentalCategory(selectedRental.category || "");
      setRentalLocation(selectedRental.location || "");
      setRentalBathrooms(selectedRental.bathrooms?.toString() || "");
      setRentalArea(selectedRental.area?.toString() || "");
      setSelectedRentalBedrooms(selectedRental.bedrooms?.map(Number) || []);
      setRentalImageUrls(selectedRental.imageUrls || []);
      setRentalFeatured(selectedRental.featured || false);
      setRentalStatus(selectedRental.status || "available");
      setRentalPriorityOrder(
        typeof selectedRental.priorityOrder === "number"
          ? selectedRental.priorityOrder.toString()
          : "",
      );
      setRentalYoutubeLink(selectedRental.youtubeLink || "");
    } else {
      resetForm();
    }
  }, [selectedProperty, selectedCar, selectedRental]); // Added selectedRental

  const resetForm = () => {
    setPropertyTitle("");
    setCarTitle("");
    setRentalTitle(""); // New
    setPropertyDescription("");
    setCarDescription("");
    setRentalDescription(""); // New
    setPropertyPrice("");
    setCarPrice("");
    setRentalPrice(""); // New
    setType("");
    setRentalType(""); // New
    setCategory("");
    setRentalCategory(""); // New
    setLocationInput("");
    setRentalLocation(""); // New
    setBathrooms("");
    setRentalBathrooms(""); // New
    setArea("");
    setRentalArea(""); // New
    setSelectedBedrooms([]);
    setSelectedRentalBedrooms([]); // New
    setPropertyImageUrls([]);
    setCarImageUrls([]);
    setRentalImageUrls([]); // New
    setPropertyFeatured(false);
    setPropertyStatus("available");
    setPropertyPriorityOrder("");
    setCarFeatured(false);
    setRentalFeatured(false); // New
    setRentalStatus("available"); // New
    setRentalPriorityOrder(""); // New
    setPropertyYoutubeLink("");
    setCarYoutubeLink("");
    setRentalYoutubeLink(""); // New
    setYear("");
    setMake("");
    setModel("");
    setMileage("");
    setCondition("");
  };

  const bedroomOptions = [
    { value: 1, label: "1 Bedroom" },
    { value: 2, label: "2 Bedrooms" },
    { value: 3, label: "3 Bedrooms" },
    { value: 4, label: "4 Bedrooms" },
    { value: 5, label: "5 Bedrooms" },
  ];
  const isResidentialCategory =
    category === "house" || category === "apartment";
  const isRentalResidentialCategory =
    rentalCategory === "house" || rentalCategory === "apartment"; // New

  const handleCategoryChange = (nextCategory: string) => {
    setCategory(nextCategory);
    if (nextCategory === "land") {
      setSelectedBedrooms([]);
      setBathrooms("");
    }
  };

  const handleRentalCategoryChange = (nextCategory: string) => {
    setRentalCategory(nextCategory);
    if (nextCategory === "land") {
      setSelectedRentalBedrooms([]);
      setRentalBathrooms("");
    }
  };

  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL as string | undefined;
  const isAdmin = isAdminEmail(user?.email, ADMIN_EMAIL);

  const deleteRemovedImages = async (imageUrls: string[]) => {
    if (imageUrls.length === 0) return 0;

    let failedCount = 0;
    for (let index = 0; index < imageUrls.length; index += 20) {
      const batch = imageUrls.slice(index, index + 20);
      try {
        const response = await apiRequest(
          "DELETE",
          apiUrl("/api/admin/images"),
          { urls: batch },
        );
        const result = (await response.json()) as { failedCount?: number };
        failedCount += result.failedCount ?? 0;
      } catch (error) {
        console.error("Could not delete removed images:", error);
        failedCount += batch.length;
      }
    }
    return failedCount;
  };

  const getRemovedImageUrls = (
    previousUrls: string[] | undefined,
    currentUrls: string[],
  ) => {
    const retainedUrls = new Set(currentUrls);
    return (previousUrls ?? []).filter((url) => !retainedUrls.has(url));
  };

  useEffect(() => {
    if (!user || !isAdmin) {
      setLocation("/");
      toast({
        variant: "destructive",
        title: "Access Denied",
        description:
          "You do not have permission to access the admin dashboard.",
      });
    }
  }, [user, isAdmin, setLocation, toast]);

  // Queries
  const { data: properties } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    queryFn: async () => {
      const response = await axios.get<Property[]>(apiUrl("/api/properties"));
      return response.data;
    },
  });

  const { data: cars } = useQuery<Car[]>({
    queryKey: ["/api/cars"],
    queryFn: async () => {
      const response = await axios.get<Car[]>(apiUrl("/api/cars"));
      return response.data;
    },
  });

  const { data: rentals } = useQuery<Rental[]>({
    // New Rental Query
    queryKey: ["/api/rentals"],
    queryFn: async () => {
      const response = await axios.get<Rental[]>(apiUrl("/api/rentals"));
      return response.data;
    },
  });

  const orderedProperties = useMemo(() => {
    if (!properties) return [];
    return [...properties];
  }, [properties]);

  const orderedRentals = useMemo(() => {
    // New Rental Memo
    if (!rentals) return [];
    return [...rentals];
  }, [rentals]);

  // Property Mutations
  const createPropertyMutation = useMutation({
    mutationFn: async (property: Partial<Property>) => {
      setIsCreating(true);
      try {
        await apiRequest("POST", apiUrl("/api/properties"), property);
      } catch (error) {
        let errorMessage = "An unknown error occurred";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        toast({ title: "Error creating property", description: errorMessage });
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({ title: "Property created successfully" });
      resetForm();
    },
  });

  const updatePropertyMutation = useMutation({
    mutationFn: async ({
      id,
      data,
      removedImageUrls,
    }: {
      id: string;
      data: Partial<Property>;
      removedImageUrls: string[];
    }) => {
      setIsUpdating(true);
      try {
        await apiRequest("PATCH", apiUrl(`/api/properties/${id}`), data);
        return await deleteRemovedImages(removedImageUrls);
      } finally {
        setIsUpdating(false);
      }
    },
    onSuccess: (failedImageDeletions) => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title:
          failedImageDeletions > 0
            ? "Property updated; some images were not deleted"
            : "Property updated successfully",
        description:
          failedImageDeletions > 0
            ? `The listing was updated, but ${failedImageDeletions} image${failedImageDeletions === 1 ? "" : "s"} could not be removed from storage.`
            : undefined,
        variant: failedImageDeletions > 0 ? "destructive" : "default",
      });
      resetForm();
      setSelectedProperty(null);
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async (property: Property) => {
      setIsDeleting(property.id);
      try {
        await apiRequest("DELETE", apiUrl(`/api/properties/${property.id}`));
        return await deleteRemovedImages(property.imageUrls ?? []);
      } finally {
        setIsDeleting(null);
      }
    },
    onSuccess: (failedImageDeletions) => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title:
          failedImageDeletions > 0
            ? "Property deleted; some images were not deleted"
            : "Property deleted successfully",
        description:
          failedImageDeletions > 0
            ? `${failedImageDeletions} image${failedImageDeletions === 1 ? "" : "s"} could not be removed from storage.`
            : undefined,
        variant: failedImageDeletions > 0 ? "destructive" : "default",
      });
    },
  });

  const reprioritizePropertyMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Property>;
    }) => {
      await apiRequest("PATCH", apiUrl(`/api/properties/${id}`), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
    },
  });

  const updatePropertyStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", apiUrl(`/api/properties/${id}`), { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
    },
  });

  // Car Mutations
  const createCarMutation = useMutation({
    mutationFn: async (car: Partial<Car>) => {
      setIsCreating(true);
      try {
        await apiRequest("POST", apiUrl("/api/cars"), car);
      } catch (error) {
        let errorMessage = "An unknown error occurred";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        toast({ title: "Error creating car", description: errorMessage });
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/cars"] });
      toast({ title: "Car created successfully" });
      resetForm();
    },
  });

  const updateCarMutation = useMutation({
    mutationFn: async ({
      id,
      data,
      removedImageUrls,
    }: {
      id: string;
      data: Partial<Car>;
      removedImageUrls: string[];
    }) => {
      setIsUpdating(true);
      try {
        await apiRequest("PATCH", apiUrl(`/api/cars/${id}`), data);
        return await deleteRemovedImages(removedImageUrls);
      } finally {
        setIsUpdating(false);
      }
    },
    onSuccess: (failedImageDeletions) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cars"] });
      toast({
        title:
          failedImageDeletions > 0
            ? "Car updated; some images were not deleted"
            : "Car updated successfully",
        description:
          failedImageDeletions > 0
            ? `${failedImageDeletions} image${failedImageDeletions === 1 ? "" : "s"} could not be removed from storage.`
            : undefined,
        variant: failedImageDeletions > 0 ? "destructive" : "default",
      });
      resetForm();
      setSelectedCar(null);
    },
  });

  const deleteCarMutation = useMutation({
    mutationFn: async (car: Car) => {
      setIsDeleting(car.id);
      try {
        await apiRequest("DELETE", apiUrl(`/api/cars/${car.id}`));
        return await deleteRemovedImages(car.imageUrls ?? []);
      } finally {
        setIsDeleting(null);
      }
    },
    onSuccess: (failedImageDeletions) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cars"] });
      toast({
        title:
          failedImageDeletions > 0
            ? "Car deleted; some images were not deleted"
            : "Car deleted successfully",
        description:
          failedImageDeletions > 0
            ? `${failedImageDeletions} image${failedImageDeletions === 1 ? "" : "s"} could not be removed from storage.`
            : undefined,
        variant: failedImageDeletions > 0 ? "destructive" : "default",
      });
    },
  });

  // Rental Mutations (New)
  const createRentalMutation = useMutation({
    mutationFn: async (rental: Partial<Rental>) => {
      setIsCreating(true);
      try {
        await apiRequest("POST", apiUrl("/api/rentals"), rental);
      } catch (error) {
        let errorMessage = "An unknown error occurred";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        toast({ title: "Error creating rental", description: errorMessage });
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      toast({ title: "Rental created successfully" });
      resetForm();
    },
  });

  const updateRentalMutation = useMutation({
    mutationFn: async ({
      id,
      data,
      removedImageUrls,
    }: {
      id: string;
      data: Partial<Rental>;
      removedImageUrls: string[];
    }) => {
      setIsUpdating(true);
      try {
        await apiRequest("PATCH", apiUrl(`/api/rentals/${id}`), data);
        return await deleteRemovedImages(removedImageUrls);
      } finally {
        setIsUpdating(false);
      }
    },
    onSuccess: (failedImageDeletions) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      toast({
        title:
          failedImageDeletions > 0
            ? "Rental updated; some images were not deleted"
            : "Rental updated successfully",
        description:
          failedImageDeletions > 0
            ? `${failedImageDeletions} image${failedImageDeletions === 1 ? "" : "s"} could not be removed from storage.`
            : undefined,
        variant: failedImageDeletions > 0 ? "destructive" : "default",
      });
      resetForm();
      setSelectedRental(null);
    },
  });

  const deleteRentalMutation = useMutation({
    mutationFn: async (rental: Rental) => {
      setIsDeleting(rental.id);
      try {
        await apiRequest("DELETE", apiUrl(`/api/rentals/${rental.id}`));
        return await deleteRemovedImages(rental.imageUrls ?? []);
      } finally {
        setIsDeleting(null);
      }
    },
    onSuccess: (failedImageDeletions) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      toast({
        title:
          failedImageDeletions > 0
            ? "Rental deleted; some images were not deleted"
            : "Rental deleted successfully",
        description:
          failedImageDeletions > 0
            ? `${failedImageDeletions} image${failedImageDeletions === 1 ? "" : "s"} could not be removed from storage.`
            : undefined,
        variant: failedImageDeletions > 0 ? "destructive" : "default",
      });
    },
  });

  const reprioritizeRentalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Rental> }) => {
      await apiRequest("PATCH", apiUrl(`/api/rentals/${id}`), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
    },
  });

  const updateRentalStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", apiUrl(`/api/rentals/${id}`), { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
    },
  });

  // Reordering & Toggles
  const handleMoveProperty = async (
    property: Property,
    direction: "up" | "down",
  ) => {
    const currentIndex = orderedProperties.findIndex(
      (p) => p.id === property.id,
    );
    if (currentIndex === -1) return;

    const currentStatus = (property.status || "available").toLowerCase();
    const targetIndex =
      direction === "up"
        ? Array.from({ length: currentIndex }, (_, index) => index)
            .reverse()
            .find(
              (index) =>
                (
                  orderedProperties[index].status || "available"
                ).toLowerCase() === currentStatus,
            )
        : Array.from(
            { length: orderedProperties.length - currentIndex - 1 },
            (_, index) => index,
          )
            .map((i) => i + currentIndex + 1)
            .find(
              (index) =>
                (
                  orderedProperties[index].status || "available"
                ).toLowerCase() === currentStatus,
            );

    if (targetIndex === undefined) return;

    const targetProperty = orderedProperties[targetIndex];
    const sourcePriority =
      typeof property.priorityOrder === "number"
        ? property.priorityOrder
        : currentIndex;
    const targetPriority =
      typeof targetProperty.priorityOrder === "number"
        ? targetProperty.priorityOrder
        : targetIndex;

    try {
      await Promise.all([
        reprioritizePropertyMutation.mutateAsync({
          id: property.id,
          data: { priorityOrder: targetPriority },
        }),
        reprioritizePropertyMutation.mutateAsync({
          id: targetProperty.id,
          data: { priorityOrder: sourcePriority },
        }),
      ]);
      toast({ title: "Property order updated" });
    } catch (error) {
      toast({
        title: "Unable to move property",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTogglePropertyStatus = async (property: Property) => {
    const currentStatus = (property.status || "available").toLowerCase();
    const nextStatus = currentStatus === "sold" ? "available" : "sold";

    try {
      await updatePropertyStatusMutation.mutateAsync({
        id: property.id,
        status: nextStatus,
      });
      toast({
        title:
          nextStatus === "sold"
            ? "Property marked as sold"
            : "Property marked as available",
      });
    } catch (error) {
      toast({
        title: "Unable to update status",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Reordering & Toggles for Rentals (New)
  const handleMoveRental = async (rental: Rental, direction: "up" | "down") => {
    const currentIndex = orderedRentals.findIndex((r) => r.id === rental.id);
    if (currentIndex === -1) return;

    const currentStatus = (rental.status || "available").toLowerCase();
    const targetIndex =
      direction === "up"
        ? Array.from({ length: currentIndex }, (_, index) => index)
            .reverse()
            .find(
              (index) =>
                (orderedRentals[index].status || "available").toLowerCase() ===
                currentStatus,
            )
        : Array.from(
            { length: orderedRentals.length - currentIndex - 1 },
            (_, index) => index,
          )
            .map((i) => i + currentIndex + 1)
            .find(
              (index) =>
                (orderedRentals[index].status || "available").toLowerCase() ===
                currentStatus,
            );

    if (targetIndex === undefined) return;

    const targetRental = orderedRentals[targetIndex];
    const sourcePriority =
      typeof rental.priorityOrder === "number"
        ? rental.priorityOrder
        : currentIndex;
    const targetPriority =
      typeof targetRental.priorityOrder === "number"
        ? targetRental.priorityOrder
        : targetIndex;

    try {
      await Promise.all([
        reprioritizeRentalMutation.mutateAsync({
          id: rental.id,
          data: { priorityOrder: targetPriority },
        }),
        reprioritizeRentalMutation.mutateAsync({
          id: targetRental.id,
          data: { priorityOrder: sourcePriority },
        }),
      ]);
      toast({ title: "Rental order updated" });
    } catch (error) {
      toast({
        title: "Unable to move rental",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleRentalStatus = async (rental: Rental) => {
    const currentStatus = (rental.status || "available").toLowerCase();
    const nextStatus = currentStatus === "rented" ? "available" : "rented";

    try {
      await updateRentalStatusMutation.mutateAsync({
        id: rental.id,
        status: nextStatus,
      });
      toast({
        title:
          nextStatus === "rented"
            ? "Rental marked as rented"
            : "Rental marked as available",
      });
    } catch (error) {
      toast({
        title: "Unable to update status",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin - Gift & Sons Properties</title>
        <meta
          name="description"
          content="The Admin Dashboard for Gift & Sons Properties"
        />
        <meta property="og:title" content="Admin - Gift & Sons Properties" />
        <meta
          property="og:description"
          content="The Admin Dashboard for Gift & Sons Properties"
        />
        <meta
          property="og:url"
          content={`https://giftandsonsinternational.com/admin`}
        />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            {/* Property Form Trigger */}
            <Button
              className="w-full p-3 text-left border rounded-md bg-gray-100 hover:bg-gray-200"
              onClick={() => setIsPropertyFormOpen(!isPropertyFormOpen)}
            >
              {isPropertyFormOpen ? "▼ Close" : "▶ Properties"}
            </Button>
            {isPropertyFormOpen && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedProperty ? "Edit Property" : "Add New Property"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();

                      if (
                        isResidentialCategory &&
                        (selectedBedrooms.length === 0 ||
                          bathrooms.trim() === "")
                      ) {
                        toast({
                          variant: "destructive",
                          title: "Bedrooms and bathrooms are required",
                          description:
                            "Add these details for a house or apartment listing.",
                        });
                        return;
                      }

                      const propertyData = {
                        title: propertyTitle,
                        description: propertyDescription,
                        price: Number(propertyPrice),
                        type,
                        category,
                        location,
                        bedrooms: isResidentialCategory ? selectedBedrooms : [],
                        bathrooms:
                          isResidentialCategory && bathrooms.trim() !== ""
                            ? Number(bathrooms)
                            : undefined,
                        area: area.trim() !== "" ? Number(area) : undefined,
                        imageUrls: propertyImageUrls,
                        featured: propertyFeatured,
                        status: propertyStatus,
                        priorityOrder:
                          propertyPriorityOrder.trim() === ""
                            ? undefined
                            : Number(propertyPriorityOrder),
                        youtubeLink: propertyYoutubeLink,
                      };

                      if (selectedProperty) {
                        updatePropertyMutation.mutate({
                          id: selectedProperty.id,
                          data: propertyData,
                          removedImageUrls: getRemovedImageUrls(
                            selectedProperty.imageUrls,
                            propertyImageUrls,
                          ),
                        });
                      } else {
                        createPropertyMutation.mutate(propertyData);
                      }
                    }}
                    className="space-y-4"
                  >
                    <Input
                      className="bg-foreground"
                      name="title"
                      value={propertyTitle}
                      onChange={(e) => setPropertyTitle(e.target.value)}
                      placeholder="Property Title"
                    />
                    <Textarea
                      className="bg-foreground"
                      name="description"
                      placeholder="Description"
                      value={propertyDescription}
                      onChange={(e) => setPropertyDescription(e.target.value)}
                    />
                    <Input
                      className="bg-foreground"
                      name="price"
                      type="number"
                      placeholder="Price"
                      value={propertyPrice}
                      onChange={(e) => setPropertyPrice(e.target.value)}
                    />
                    <Select name="type" value={type} onValueChange={setType}>
                      <SelectTrigger className="bg-foreground">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sale">For Sale</SelectItem>
                        <SelectItem value="rent">For Rent</SelectItem>
                        <SelectItem value="lease">For Lease</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      name="status"
                      value={propertyStatus}
                      onValueChange={setPropertyStatus}
                    >
                      <SelectTrigger className="bg-foreground">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      name="category"
                      value={category}
                      onValueChange={handleCategoryChange}
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
                    <Input
                      className="bg-foreground"
                      name="location"
                      placeholder="Location"
                      value={location}
                      onChange={(e) => setLocationInput(e.target.value)}
                    />
                    <div className="grid grid-cols-1 gap-2">
                      {isResidentialCategory && (
                        <>
                          <Select
                            value={selectedBedrooms[0]?.toString() ?? ""}
                            onValueChange={(value) =>
                              setSelectedBedrooms([Number(value)])
                            }
                          >
                            <SelectTrigger className="bg-foreground">
                              <SelectValue placeholder="Number of bedrooms" />
                            </SelectTrigger>
                            <SelectContent>
                              {bedroomOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value.toString()}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            className="bg-foreground"
                            name="bathrooms"
                            type="number"
                            min="0"
                            step="1"
                            placeholder="Number of bathrooms"
                            value={bathrooms}
                            onChange={(e) => setBathrooms(e.target.value)}
                          />
                        </>
                      )}
                      <Input
                        className="bg-foreground"
                        name="area"
                        type="number"
                        min="0"
                        placeholder={
                          category === "land"
                            ? "Land area (sq ft, optional)"
                            : "Area (sq ft, optional)"
                        }
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                      />
                      <Input
                        className="bg-foreground"
                        name="priorityOrder"
                        type="number"
                        placeholder="Priority order (lower appears first)"
                        value={propertyPriorityOrder}
                        onChange={(e) =>
                          setPropertyPriorityOrder(e.target.value)
                        }
                      />
                      <Input
                        className="bg-foreground"
                        name="youtubeLink"
                        type="text"
                        placeholder="YouTube Video Link (optional)"
                        value={propertyYoutubeLink}
                        onChange={(e) => setPropertyYoutubeLink(e.target.value)}
                      />
                    </div>
                    <UploadButton setImageUrls={setPropertyImageUrls} />
                    <p className="text-sm text-muted-foreground">
                      Large uploads are optimized automatically. To replace an
                      older photo, remove it here, upload the original again,
                      then save the property.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {propertyImageUrls.map((url, index) => (
                        <div key={`${url}-${index}`} className="relative">
                          <img
                            src={url}
                            alt={`Property image ${index + 1}`}
                            loading="lazy"
                            decoding="async"
                            className="h-20 w-28 rounded object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute right-1 top-1 h-7 w-7"
                            aria-label={`Remove property image ${index + 1}`}
                            onClick={() =>
                              setPropertyImageUrls((currentUrls) =>
                                currentUrls.filter(
                                  (_, imageIndex) => imageIndex !== index,
                                ),
                              )
                            }
                          >
                            <X />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="featured"
                        id="featured"
                        checked={propertyFeatured}
                        onChange={(e) => setPropertyFeatured(e.target.checked)}
                      />
                      <label htmlFor="featured">Featured Property</label>
                    </div>
                    <div className="flex gap-4">
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={isCreating || isUpdating}
                      >
                        {isCreating
                          ? "Creating Property..."
                          : isUpdating
                            ? "Updating Property..."
                            : selectedProperty
                              ? "Update Property"
                              : "Create Property"}
                      </Button>
                      {selectedProperty && (
                        <Button
                          className="bg-foreground hover:bg-background hover:text-foreground"
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setSelectedProperty(null);
                            setIsPropertyFormOpen(false);
                          }}
                          disabled={isUpdating}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Rental Form Trigger (New) */}
            <Button
              className="w-full p-3 text-left border rounded-md bg-gray-100 hover:bg-gray-200"
              onClick={() => setIsRentalFormOpen(!isRentalFormOpen)}
            >
              {isRentalFormOpen ? "▼ Close" : "▶ Rentals"}
            </Button>
            {isRentalFormOpen && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedRental ? "Edit Rental" : "Add New Rental"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();

                      if (
                        isRentalResidentialCategory &&
                        (selectedRentalBedrooms.length === 0 ||
                          rentalBathrooms.trim() === "")
                      ) {
                        toast({
                          variant: "destructive",
                          title: "Bedrooms and bathrooms are required",
                          description:
                            "Add these details for a house or apartment rental listing.",
                        });
                        return;
                      }

                      const rentalData = {
                        title: rentalTitle,
                        description: rentalDescription,
                        price: Number(rentalPrice),
                        type: rentalType,
                        category: rentalCategory,
                        location: rentalLocation,
                        bedrooms: isRentalResidentialCategory
                          ? selectedRentalBedrooms
                          : [],
                        bathrooms:
                          isRentalResidentialCategory &&
                          rentalBathrooms.trim() !== ""
                            ? Number(rentalBathrooms)
                            : undefined,
                        area:
                          rentalArea.trim() !== ""
                            ? Number(rentalArea)
                            : undefined,
                        imageUrls: rentalImageUrls,
                        featured: rentalFeatured,
                        status: rentalStatus,
                        priorityOrder:
                          rentalPriorityOrder.trim() === ""
                            ? undefined
                            : Number(rentalPriorityOrder),
                        youtubeLink: rentalYoutubeLink,
                      };

                      if (selectedRental) {
                        updateRentalMutation.mutate({
                          id: selectedRental.id,
                          data: rentalData,
                          removedImageUrls: getRemovedImageUrls(
                            selectedRental.imageUrls,
                            rentalImageUrls,
                          ),
                        });
                      } else {
                        createRentalMutation.mutate(rentalData);
                      }
                    }}
                    className="space-y-4"
                  >
                    <Input
                      className="bg-foreground"
                      name="title"
                      value={rentalTitle}
                      onChange={(e) => setRentalTitle(e.target.value)}
                      placeholder="Rental Title"
                    />
                    <Textarea
                      className="bg-foreground"
                      name="description"
                      placeholder="Description"
                      value={rentalDescription}
                      onChange={(e) => setRentalDescription(e.target.value)}
                    />
                    <Input
                      className="bg-foreground"
                      name="price"
                      type="number"
                      placeholder="Price (per Month)"
                      value={rentalPrice}
                      onChange={(e) => setRentalPrice(e.target.value)}
                    />
                    <Select
                      name="type"
                      value={rentalType}
                      onValueChange={setRentalType}
                    >
                      <SelectTrigger className="bg-foreground">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rent">For Rent</SelectItem>
                        <SelectItem value="lease">For Lease</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      name="status"
                      value={rentalStatus}
                      onValueChange={setRentalStatus}
                    >
                      <SelectTrigger className="bg-foreground">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="rented">Rented</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      name="category"
                      value={rentalCategory}
                      onValueChange={handleRentalCategoryChange}
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
                    <Input
                      className="bg-foreground"
                      name="location"
                      placeholder="Location"
                      value={rentalLocation}
                      onChange={(e) => setRentalLocation(e.target.value)}
                    />
                    <div className="grid grid-cols-1 gap-2">
                      {isRentalResidentialCategory && (
                        <>
                          <Select
                            value={selectedRentalBedrooms[0]?.toString() ?? ""}
                            onValueChange={(value) =>
                              setSelectedRentalBedrooms([Number(value)])
                            }
                          >
                            <SelectTrigger className="bg-foreground">
                              <SelectValue placeholder="Number of bedrooms" />
                            </SelectTrigger>
                            <SelectContent>
                              {bedroomOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value.toString()}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            className="bg-foreground"
                            name="bathrooms"
                            type="number"
                            min="0"
                            step="1"
                            placeholder="Number of bathrooms"
                            value={rentalBathrooms}
                            onChange={(e) => setRentalBathrooms(e.target.value)}
                          />
                        </>
                      )}
                      <Input
                        className="bg-foreground"
                        name="area"
                        type="number"
                        min="0"
                        placeholder={
                          rentalCategory === "land"
                            ? "Land area (sq ft, optional)"
                            : "Area (sq ft, optional)"
                        }
                        value={rentalArea}
                        onChange={(e) => setRentalArea(e.target.value)}
                      />
                      <Input
                        className="bg-foreground"
                        name="priorityOrder"
                        type="number"
                        placeholder="Priority order (lower appears first)"
                        value={rentalPriorityOrder}
                        onChange={(e) => setRentalPriorityOrder(e.target.value)}
                      />
                      <Input
                        className="bg-foreground"
                        name="youtubeLink"
                        type="text"
                        placeholder="YouTube Video Link (optional)"
                        value={rentalYoutubeLink}
                        onChange={(e) => setRentalYoutubeLink(e.target.value)}
                      />
                    </div>
                    <UploadButton setImageUrls={setRentalImageUrls} />
                    <div className="flex gap-2 flex-wrap">
                      {rentalImageUrls.map((url, index) => (
                        <div key={`${url}-${index}`} className="relative">
                          <img
                            src={url}
                            alt={`Rental image ${index + 1}`}
                            loading="lazy"
                            decoding="async"
                            className="h-20 w-28 rounded object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute right-1 top-1 h-7 w-7"
                            aria-label={`Remove rental image ${index + 1}`}
                            onClick={() =>
                              setRentalImageUrls((currentUrls) =>
                                currentUrls.filter(
                                  (_, imageIndex) => imageIndex !== index,
                                ),
                              )
                            }
                          >
                            <X />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="featured"
                        id="rentalFeatured"
                        checked={rentalFeatured}
                        onChange={(e) => setRentalFeatured(e.target.checked)}
                      />
                      <label htmlFor="rentalFeatured">Featured Rental</label>
                    </div>
                    <div className="flex gap-4">
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={isCreating || isUpdating}
                      >
                        {isCreating
                          ? "Creating Rental..."
                          : isUpdating
                            ? "Updating Rental..."
                            : selectedRental
                              ? "Update Rental"
                              : "Create Rental"}
                      </Button>
                      {selectedRental && (
                        <Button
                          className="bg-foreground hover:bg-background hover:text-foreground"
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setSelectedRental(null);
                            setIsRentalFormOpen(false);
                          }}
                          disabled={isUpdating}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Car Form Trigger */}
            <Button
              className="w-full p-3 text-left border rounded-md bg-gray-100 hover:bg-gray-200"
              onClick={() => setIsCarFormOpen(!isCarFormOpen)}
            >
              {isCarFormOpen ? "▼ Close" : "▶ Cars"}
            </Button>
            {isCarFormOpen && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>
                    {selectedCar ? "Edit Car" : "Add New Car"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();

                      const numericPrice = Number(carPrice);
                      const numericYear = Number(year);
                      const numericMileage = Number(mileage);

                      if (
                        !carTitle.trim() ||
                        !carDescription.trim() ||
                        !make.trim() ||
                        !model.trim() ||
                        !condition ||
                        !Number.isFinite(numericPrice) ||
                        numericPrice <= 0 ||
                        !Number.isInteger(numericYear) ||
                        numericYear < 1886 ||
                        !Number.isFinite(numericMileage) ||
                        numericMileage < 0
                      ) {
                        toast({
                          variant: "destructive",
                          title: "Complete the vehicle details",
                          description:
                            "Add a title, description, price, year, make, model, condition, and mileage.",
                        });
                        return;
                      }

                      const carData = {
                        title: carTitle.trim(),
                        description: carDescription.trim(),
                        price: numericPrice,
                        year: numericYear,
                        make: make.trim(),
                        model: model.trim(),
                        condition,
                        mileage: numericMileage,
                        imageUrls: carImageUrls,
                        featured: carFeatured,
                        youtubeLink: carYoutubeLink,
                      };

                      if (selectedCar) {
                        updateCarMutation.mutate({
                          id: selectedCar.id,
                          data: carData,
                          removedImageUrls: getRemovedImageUrls(
                            selectedCar.imageUrls,
                            carImageUrls,
                          ),
                        });
                      } else {
                        createCarMutation.mutate(carData);
                      }
                    }}
                    className="space-y-4"
                  >
                    <Input
                      className="bg-foreground"
                      name="title"
                      required
                      value={carTitle}
                      onChange={(e) => setCarTitle(e.target.value)}
                      placeholder="Car Title"
                    />
                    <Textarea
                      className="bg-foreground"
                      name="description"
                      placeholder="Description"
                      required
                      value={carDescription}
                      onChange={(e) => setCarDescription(e.target.value)}
                    />
                    <Input
                      className="bg-foreground"
                      name="price"
                      type="number"
                      min="1"
                      required
                      placeholder="Price"
                      value={carPrice}
                      onChange={(e) => setCarPrice(e.target.value)}
                    />
                    <Select
                      name="condition"
                      value={condition}
                      onValueChange={setCondition}
                    >
                      <SelectTrigger className="bg-foreground">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="used">Used</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      className="bg-foreground"
                      name="year"
                      type="number"
                      min="1886"
                      required
                      placeholder="Year"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                    />
                    <Input
                      className="bg-foreground"
                      name="make"
                      placeholder="Make"
                      required
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                    />
                    <Input
                      className="bg-foreground"
                      name="model"
                      placeholder="Car Model"
                      required
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                    />
                    <Input
                      className="bg-foreground"
                      name="mileage"
                      type="number"
                      min="0"
                      required
                      placeholder="Mileage"
                      value={mileage}
                      onChange={(e) => setMileage(e.target.value)}
                    />
                    <Input
                      className="bg-foreground"
                      name="youtubeLink"
                      type="text"
                      placeholder="YouTube Video Link (optional)"
                      value={carYoutubeLink}
                      onChange={(e) => setCarYoutubeLink(e.target.value)}
                    />
                    <UploadButton setImageUrls={setCarImageUrls} />
                    <div className="flex gap-2 flex-wrap">
                      {carImageUrls.map((url, index) => (
                        <div key={`${url}-${index}`} className="relative">
                          <img
                            src={url}
                            alt={`Car image ${index + 1}`}
                            loading="lazy"
                            decoding="async"
                            className="h-20 w-28 rounded object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute right-1 top-1 h-7 w-7"
                            aria-label={`Remove car image ${index + 1}`}
                            onClick={() =>
                              setCarImageUrls((currentUrls) =>
                                currentUrls.filter(
                                  (_, imageIndex) => imageIndex !== index,
                                ),
                              )
                            }
                          >
                            <X />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="featured"
                        id="carFeatured"
                        checked={carFeatured}
                        onChange={(e) => setCarFeatured(e.target.checked)}
                      />
                      <label htmlFor="carFeatured">Featured Car</label>
                    </div>
                    <div className="flex gap-4">
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={isCreating || isUpdating}
                      >
                        {isCreating
                          ? "Creating Car..."
                          : isUpdating
                            ? "Updating Car..."
                            : selectedCar
                              ? "Update Car"
                              : "Create Car"}
                      </Button>
                      {selectedCar && (
                        <Button
                          className="bg-foreground hover:bg-background hover:text-foreground"
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setSelectedCar(null);
                            setIsCarFormOpen(false);
                          }}
                          disabled={isUpdating}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2 space-y-8">
            {/* Properties List Dashboard */}
            <Card>
              <CardHeader>
                <CardTitle>Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderedProperties.map((property) => (
                    <div
                      key={property.id}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
                    >
                      <div>
                        <h3 className="font-semibold">{property.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          ksh{" "}
                          {property.price
                            ? property.price.toLocaleString()
                            : "N/A"}{" "}
                          - {property.location}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Status:{" "}
                          {(property.status || "available").toUpperCase()} |
                          Priority:{" "}
                          {typeof property.priorityOrder === "number"
                            ? property.priorityOrder
                            : "auto"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="bg-foreground hover:bg-background hover:text-foreground"
                          variant="outline"
                          size="sm"
                          onClick={() => handleMoveProperty(property, "up")}
                          disabled={
                            reprioritizePropertyMutation.isPending ||
                            updatePropertyStatusMutation.isPending
                          }
                        >
                          Up
                        </Button>
                        <Button
                          className="bg-foreground hover:bg-background hover:text-foreground"
                          variant="outline"
                          size="sm"
                          onClick={() => handleMoveProperty(property, "down")}
                          disabled={
                            reprioritizePropertyMutation.isPending ||
                            updatePropertyStatusMutation.isPending
                          }
                        >
                          Down
                        </Button>
                        <Button
                          className="bg-foreground hover:bg-background hover:text-foreground"
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePropertyStatus(property)}
                          disabled={
                            reprioritizePropertyMutation.isPending ||
                            updatePropertyStatusMutation.isPending
                          }
                        >
                          {(property.status || "available").toLowerCase() ===
                          "sold"
                            ? "Mark Available"
                            : "Mark Sold"}
                        </Button>
                        <Button
                          className="bg-foreground hover:bg-background hover:text-foreground"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProperty(property);
                            setIsPropertyFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            deletePropertyMutation.mutate(property)
                          }
                          disabled={isDeleting === property.id}
                        >
                          {isDeleting === property.id
                            ? "Deleting..."
                            : "Delete"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Rentals List Dashboard (New) */}
            <Card>
              <CardHeader>
                <CardTitle>Rentals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderedRentals.map((rental) => (
                    <div
                      key={rental.id}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
                    >
                      <div>
                        <h3 className="font-semibold">{rental.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          ksh{" "}
                          {rental.price ? rental.price.toLocaleString() : "N/A"}{" "}
                          / month - {rental.location}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Status: {(rental.status || "available").toUpperCase()}{" "}
                          | Priority:{" "}
                          {typeof rental.priorityOrder === "number"
                            ? rental.priorityOrder
                            : "auto"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="bg-foreground hover:bg-background hover:text-foreground"
                          variant="outline"
                          size="sm"
                          onClick={() => handleMoveRental(rental, "up")}
                          disabled={
                            reprioritizeRentalMutation.isPending ||
                            updateRentalStatusMutation.isPending
                          }
                        >
                          Up
                        </Button>
                        <Button
                          className="bg-foreground hover:bg-background hover:text-foreground"
                          variant="outline"
                          size="sm"
                          onClick={() => handleMoveRental(rental, "down")}
                          disabled={
                            reprioritizeRentalMutation.isPending ||
                            updateRentalStatusMutation.isPending
                          }
                        >
                          Down
                        </Button>
                        <Button
                          className="bg-foreground hover:bg-background hover:text-foreground"
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleRentalStatus(rental)}
                          disabled={
                            reprioritizeRentalMutation.isPending ||
                            updateRentalStatusMutation.isPending
                          }
                        >
                          {(rental.status || "available").toLowerCase() ===
                          "rented"
                            ? "Mark Available"
                            : "Mark Rented"}
                        </Button>
                        <Button
                          className="bg-foreground hover:bg-background hover:text-foreground"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRental(rental);
                            setIsRentalFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteRentalMutation.mutate(rental)}
                          disabled={isDeleting === rental.id}
                        >
                          {isDeleting === rental.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cars List Dashboard */}
            <Card>
              <CardHeader>
                <CardTitle>Cars</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cars?.map((car) => (
                    <div
                      key={car.id}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
                    >
                      <div>
                        <h3 className="font-semibold">{car.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          ksh {car.price ? car.price.toLocaleString() : "N/A"} -{" "}
                          {car.year}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="bg-foreground hover:bg-background hover:text-foreground"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCar(car);
                            setIsCarFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteCarMutation.mutate(car)}
                          disabled={isDeleting === car.id}
                        >
                          {isDeleting === car.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
