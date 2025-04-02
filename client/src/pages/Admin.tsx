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
import { Property, Car } from "@/types";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useState, useEffect } from "react";
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Admin() {
  const [user] = useAuthState(auth);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );

  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  //Property Images
  const [propertyImageUrls, setPropertyImageUrls] = useState<string[]>([]);

  //Car Images
  const [carImageUrls, setCarImageUrls] = useState<string[]>([]);

  const [selectedBedrooms, setSelectedBedrooms] = useState<number[]>(
    selectedProperty?.bedrooms || []
  );

  //Property Details
  const [propertyTitle, setPropertyTitle] = useState("");
  const [propertyDescription, setPropertyDescription] = useState("");
  const [propertyPrice, setPropertyPrice] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocationInput] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [area, setArea] = useState("");
  const [propertyFeatured, setPropertyFeatured] = useState(false);
  const [propertyYoutubeLink, setPropertyYoutubeLink] = useState("");
  const [isPropertyFormOpen, setIsPropertyFormOpen] = useState(false);

  //Car Details
  const [carTitle, setCarTitle] = useState("");
  const [carDescription, setCarDescription] = useState("");
  const [carPrice, setCarPrice] = useState("");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [mileage, setMileage] = useState(0);
  const [condition, setCondition] = useState("");
  const [carFeatured, setCarFeatured] = useState(false);
  const [carYoutubeLink, setCarYoutubeLink] = useState("");

  const [isCarFormOpen, setIsCarFormOpen] = useState(false);

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

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
      setPropertyYoutubeLink(selectedProperty.youtubeLink || "");
    } else if (selectedCar) {
      setCarTitle(selectedCar.title || "");
      setCarDescription(selectedCar.description || "");
      setCarPrice(selectedCar.price?.toString() || "");
      setYear(selectedCar.year?.toString() || "");
      setMake(selectedCar.make || "");
      setModel(selectedCar.model || "");
      setMileage(selectedCar.mileage || 0);
      setCondition(selectedCar.condition || "");
      setCarImageUrls(selectedCar.imageUrls || []);
      setCarFeatured(selectedCar.featured || false);
      setCarYoutubeLink(selectedCar.youtubeLink || "");
    } else {
      resetForm();
    }
  }, [selectedProperty, selectedCar]);

  const resetForm = () => {
    setPropertyTitle("");
    setCarTitle("");
    setPropertyDescription("");
    setCarDescription("");
    setPropertyPrice("");
    setCarPrice("");
    setType("");
    setCategory("");
    setLocationInput("");
    setBathrooms("");
    setArea("");
    setSelectedBedrooms([]);
    setPropertyImageUrls([]);
    setCarImageUrls([]);
    setPropertyFeatured(false);
    setCarFeatured(false);
    setPropertyYoutubeLink("");
    setCarYoutubeLink("");
    setYear("");
    setMake("");
    setModel("");
    setMileage(0);
    setCondition("");
  };

  const bedroomOptions = [
    { value: 1, label: "1 Bedroom" },
    { value: 2, label: "2 Bedrooms" },
    { value: 3, label: "3 Bedrooms" },
    { value: 4, label: "4 Bedrooms" },
    { value: 5, label: "5 Bedrooms" },
  ];

  // Fix TypeScript error by ensuring type correctness
  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL as string | undefined;
  const isAdmin = user?.email === ADMIN_EMAIL;

  // Redirect non-admin users
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

  // Fetch properties using query function with built-in auth
  const { data: properties } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    queryFn: async () => {
      const response = await axios.get<Property[]>(
        `${API_BASE_URL}/api/properties`,
        {
          withCredentials: true, // Ensure cookies/session data are included
        }
      );
      return response.data;
    },
  });

  const { data: cars } = useQuery<Car[]>({
    queryKey: ["/api/cars"],
    queryFn: async () => {
      const response = await axios.get<Car[]>(`${API_BASE_URL}/api/cars`, {
        withCredentials: true, // Ensure cookies/session data are included
      });
      return response.data;
    },
  });

  // Mutations (auth handled in apiRequest)
  const createPropertyMutation = useMutation({
    mutationFn: async (property: Partial<Property>) => {
      setIsCreating(true);
      try {
        await apiRequest("POST", `${API_BASE_URL}/api/properties`, property);
      } catch (error) {
        let errorMessage = "An unknown error occurred";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        toast({ title: "Error creating property", description: errorMessage });
        throw error; // Ensure react-query handles it properly
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
    }: {
      id: string;
      data: Partial<Property>;
    }) => {
      setIsUpdating(true);
      try {
        await apiRequest("PATCH", `${API_BASE_URL}/api/properties/${id}`, data);
      } finally {
        setIsUpdating(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({ title: "Property updated successfully" });
      resetForm();
      setSelectedProperty(null);
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async (id: string) => {
      setIsDeleting(id);
      try {
        await apiRequest("DELETE", `${API_BASE_URL}/api/properties/${id}`);
      } finally {
        setIsDeleting(null);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({ title: "Property deleted successfully" });
    },
  });

  //Car Functionality
  const createCarMutation = useMutation({
    mutationFn: async (car: Partial<Car>) => {
      setIsCreating(true);
      try {
        await apiRequest("POST", `${API_BASE_URL}/api/cars`, car);
      } catch (error) {
        let errorMessage = "An unknown error occurred";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        toast({ title: "Error creating car", description: errorMessage });
        throw error; // Ensure react-query handles it properly
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
    mutationFn: async ({ id, data }: { id: string; data: Partial<Car> }) => {
      setIsUpdating(true);
      try {
        await apiRequest("PATCH", `${API_BASE_URL}/api/cars/${id}`, data);
      } finally {
        setIsUpdating(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cars"] });
      toast({ title: "Property updated successfully" });
      resetForm();
      setSelectedProperty(null);
    },
  });

  const deleteCarMutation = useMutation({
    mutationFn: async (id: string) => {
      setIsDeleting(id);
      try {
        await apiRequest("DELETE", `${API_BASE_URL}/api/cars/${id}`);
      } finally {
        setIsDeleting(null);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cars"] });
      toast({ title: "Property deleted successfully" });
    },
  });

  const handleBedroomChange = (value: number) => {
    setSelectedBedrooms((prev) =>
      prev.includes(value)
        ? prev.filter((bed) => bed !== value)
        : [...prev, value]
    );
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

                      const propertyData = {
                        title: propertyTitle,
                        description: propertyDescription,
                        price: Number(propertyPrice),
                        type,
                        category,
                        location,
                        bedrooms: selectedBedrooms,
                        bathrooms: Number(bathrooms),
                        area: Number(area),
                        imageUrls: propertyImageUrls,
                        featured: propertyFeatured,
                        youtubeLink: propertyYoutubeLink,
                      };

                      if (selectedProperty) {
                        updatePropertyMutation.mutate({
                          id: selectedProperty.id,
                          data: propertyData,
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
                      name="category"
                      value={category}
                      onValueChange={setCategory}
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
                      <div>
                        <label className="block font-medium">Bedrooms</label>
                        <div className="flex gap-4">
                          {Array.from({ length: 5 }, (_, i) => i + 1).map(
                            (num) => (
                              <label key={num}>
                                <input
                                  type="checkbox"
                                  checked={selectedBedrooms.includes(num)}
                                  onChange={() => {
                                    setSelectedBedrooms((prev) =>
                                      prev.includes(num)
                                        ? prev.filter((b) => b !== num)
                                        : [...prev, num]
                                    );
                                  }}
                                />
                                {num} Bdrm
                              </label>
                            )
                          )}
                        </div>
                      </div>

                      <Input
                        className="bg-foreground"
                        name="bathrooms"
                        type="number"
                        placeholder="Bathrooms"
                        value={bathrooms}
                        onChange={(e) => setBathrooms(e.target.value)}
                      />
                      <Input
                        className="bg-foreground"
                        name="area"
                        type="number"
                        placeholder="Area (sq ft)"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
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
                    <div className="flex gap-2 flex-wrap">
                      {propertyImageUrls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Uploaded ${index}`}
                          className="h-20 rounded"
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="featured"
                        id="featured"
                        defaultChecked={!!selectedProperty?.featured}
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
                          onClick={() => setSelectedProperty(null)}
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

            {/* Dropdown Button */}
            <Button
              className="w-full p-3 text-left border rounded-md bg-gray-100 hover:bg-gray-200"
              onClick={() => setIsCarFormOpen(!isCarFormOpen)}
            >
              {isCarFormOpen ? "▼ Close" : "▶ Cars"}
            </Button>

            {/* Car Form - Conditionally Rendered */}
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

                      const carData = {
                        title: carTitle,
                        description: carDescription,
                        price: Number(carPrice),
                        year: Number(year),
                        make,
                        model,
                        condition,
                        mileage,
                        imageUrls: carImageUrls,
                        featured: carFeatured,
                        youtubeLink: carYoutubeLink,
                      };

                      if (selectedCar) {
                        updateCarMutation.mutate({
                          id: selectedCar.id,
                          data: carData,
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
                      value={carTitle}
                      onChange={(e) => setCarTitle(e.target.value)}
                      placeholder="Car Title"
                    />
                    <Textarea
                      className="bg-foreground"
                      name="description"
                      placeholder="Description"
                      value={carDescription}
                      onChange={(e) => setCarDescription(e.target.value)}
                    />
                    <Input
                      className="bg-foreground"
                      name="price"
                      type="number"
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
                      placeholder="Year"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                    />
                    <Input
                      className="bg-foreground"
                      name="make"
                      placeholder="Make"
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                    />
                    <Input
                      className="bg-foreground"
                      name="model"
                      placeholder="Car Model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
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
                        <img
                          key={index}
                          src={url}
                          alt={`Uploaded ${index}`}
                          className="h-20 rounded"
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="featured"
                        id="featured"
                        defaultChecked={!!selectedCar?.featured}
                      />
                      <label htmlFor="featured">Featured Car</label>
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
                          onClick={() => setSelectedCar(null)}
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
            <Card>
              <CardHeader>
                <CardTitle>Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {properties?.map((property) => (
                    <div
                      key={property.id}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
                    >
                      <div>
                        <h3 className="font-semibold">{property.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          ksh
                          {property.price
                            ? property.price.toLocaleString()
                            : "N/A"}{" "}
                          - {property.location}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="bg-foreground hover:bg-background hover:text-foreground"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedProperty(property)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            deletePropertyMutation.mutate(property.id)
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
                          ksh
                          {car.price
                            ? car.price.toLocaleString()
                            : "N/A"} - {car.year}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="bg-foreground hover:bg-background hover:text-foreground"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCar(car)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteCarMutation.mutate(car.id)}
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
