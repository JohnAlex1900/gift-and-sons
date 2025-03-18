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
import { Property, Inquiry } from "@/types";
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

export default function Admin() {
  const [user] = useAuthState(auth);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );

  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [selectedBedrooms, setSelectedBedrooms] = useState<number[]>(
    selectedProperty?.bedrooms || []
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocationInput] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [area, setArea] = useState("");
  const [featured, setFeatured] = useState(false);

  useEffect(() => {
    if (selectedProperty) {
      setTitle(selectedProperty.title || "");
      setDescription(selectedProperty.description || "");
      setPrice(selectedProperty.price?.toString() || "");
      setType(selectedProperty.type || "");
      setCategory(selectedProperty.category || "");
      setLocationInput(selectedProperty.location || "");
      setBathrooms(selectedProperty.bathrooms?.toString() || "");
      setArea(selectedProperty.area?.toString() || "");
      setSelectedBedrooms(selectedProperty.bedrooms || []);
      setImageUrls(selectedProperty.imageUrls || []);
      setFeatured(selectedProperty.featured || false);
    } else {
      resetForm();
    }
  }, [selectedProperty]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPrice("");
    setType("");
    setCategory("");
    setLocationInput("");
    setBathrooms("");
    setArea("");
    setSelectedBedrooms([]);
    setImageUrls([]);
    setFeatured(false);
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
  });

  // Fetch inquiries from Firestore
  const { data: inquiries = [], error } = useQuery<Inquiry[]>({
    queryKey: ["inquiries"],
    queryFn: async (): Promise<Inquiry[]> => {
      const inquiriesSnapshot = await getDocs(collection(db, "inquiries"));
      return inquiriesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          propertyId: data.propertyId,
          status: data.status || "pending",
          userEmail: data.userEmail || "Unknown",
          propertyName: data.propertyName || "Unknown",
          message: data.message || "",
          number: data.number || "",
          createdAt: data.createdAt
            ? (data.createdAt as Timestamp).toDate()
            : new Date(),
        };
      });
    },
  });

  useEffect(() => {
    console.log("Inquiries State:", inquiries);
    if (error) console.error("Firestore Error:", error);
  }, [inquiries, error]);

  useEffect(() => {
    console.log("Fetched Inquiries:", inquiries);
  }, [inquiries]);

  // Mutations (auth handled in apiRequest)
  const createPropertyMutation = useMutation({
    mutationFn: async (property: Partial<Property>) => {
      await apiRequest("POST", "/api/properties", property);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
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
      await apiRequest("PATCH", `/api/properties/${id}`, data);
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
      await apiRequest("DELETE", `/api/properties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({ title: "Property deleted successfully" });
    },
  });

  const deleteInquiryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/inquiries/${id}`);
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["inquiries"] });

      const previousInquiries = queryClient.getQueryData<Inquiry[]>([
        "inquiries",
      ]);

      queryClient.setQueryData<Inquiry[]>(["inquiries"], (old) =>
        old ? old.filter((inquiry) => inquiry.id !== id) : []
      );

      return { previousInquiries };
    },
    onError: (_error, _id, context) => {
      if (context?.previousInquiries) {
        queryClient.setQueryData(["inquiries"], context.previousInquiries);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
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
                    title,
                    description,
                    price: Number(price),
                    type,
                    category,
                    location,
                    bedrooms: selectedBedrooms,
                    bathrooms: Number(bathrooms),
                    area: Number(area),
                    imageUrls,
                    featured,
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
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Property Title"
                />
                <Textarea
                  className="bg-foreground"
                  name="description"
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <Input
                  className="bg-foreground"
                  name="price"
                  type="number"
                  placeholder="Price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
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
                      {Array.from({ length: 5 }, (_, i) => i + 1).map((num) => (
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
                          {num} Bedrooms
                        </label>
                      ))}
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
                </div>
                <UploadButton setImageUrls={setImageUrls} />
                <div className="flex gap-2 flex-wrap">
                  {imageUrls.map((url, index) => (
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
                  <Button type="submit" className="flex-1">
                    {selectedProperty ? "Update" : "Create"} Property
                  </Button>
                  {selectedProperty && (
                    <Button
                      className="bg-foreground hover:bg-background hover:text-foreground"
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedProperty(null)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
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
                        kes
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
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Inquiries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inquiries?.map((inquiry) => (
                  <div key={inquiry.id} className="p-4 bg-muted rounded-lg">
                    {/* Show property name instead of ID */}
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Property:</strong> {inquiry.propertyName}
                    </p>

                    {/* Show user email */}
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>From:</strong> {inquiry.number}
                    </p>

                    {/* Show message only if it exists */}
                    {inquiry.message && (
                      <p className="mb-2">{inquiry.message}</p>
                    )}

                    {/* Show created date */}
                    <p className="text-sm text-muted-foreground">
                      {new Date(inquiry.createdAt).toLocaleDateString()}
                    </p>

                    <Button
                      className="bg-foreground hover:bg-background hover:text-foreground"
                      variant="outline"
                      onClick={async () =>
                        deleteInquiryMutation.mutate(inquiry.id)
                      }
                      disabled={deleteInquiryMutation.isPending}
                    >
                      {deleteInquiryMutation.isPending
                        ? "Resolving..."
                        : "Mark as Resolved"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
