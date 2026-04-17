import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Property, Review } from "@/types";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { fetchPropertyById, fetchReviewsByProperty } from "@/lib/public-firestore";

async function markReviewsAsViewed({
  propertyId,
  carId,
}: {
  propertyId?: string;
  carId?: string;
}) {
  try {
    const response = await fetch(apiUrl("/api/reviews/mark_viewed"), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ propertyId, carId }),
    });

    if (!response.ok) {
      throw new Error("Failed to mark reviews as viewed");
    }

    const data = await response.json();
    console.log(`Marked ${data.markedCount} reviews as viewed.`);
  } catch (error) {
    console.error("Error marking reviews as viewed:", error);
  }
}

export default function PropertyDetails() {
  const reviewRef = useRef<HTMLDivElement>(null);
  const { id } = useParams();
  const [user] = useAuthState(auth);
  const { toast } = useToast();
  const [reviewMessage, setReviewMessage] = useState("");
  const [rating, setRating] = useState(1);

  const [showAllReviews, setShowAllReviews] = useState(false);

  const [replyMessages, setReplyMessages] = useState<{ [key: string]: string }>(
    {}
  );

  const [replyOpen, setReplyOpen] = useState<string | null>(null);

  const isAdmin = user?.email === import.meta.env.VITE_ADMIN_EMAIL;

  useEffect(() => {
    const hash = window.location.hash;

    if (hash === "#review") {
      // Delay scroll to ensure DOM is painted
      setTimeout(() => {
        reviewRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300); // 300ms is usually enough
    }
  }, []);

  useEffect(() => {
    // Mark reviews for this property as viewed when admin visits this page
    markReviewsAsViewed({ propertyId: id });
  }, [id]);

  const handleReplyChange = (reviewId: string, message: string) => {
    setReplyMessages((prev) => ({ ...prev, [reviewId]: message }));
  };

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}#review`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: property?.title || "Check this out",
          url,
        });
      } catch (err) {
        console.error("Sharing failed", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied to clipboard!" });
      } catch (err) {
        console.error("Clipboard copy failed", err);
        toast({
          title: "Failed to copy link",
          variant: "destructive",
        });
      }
    }
  };

  const replyMutation = useMutation({
    mutationFn: async ({
      reviewId,
      reply,
    }: {
      reviewId: string;
      reply: string;
    }) => {
      if (!reply.trim()) throw new Error("Reply cannot be empty");

      return apiRequest("POST", apiUrl("/api/reviews/reply"), {
        reviewId,
        replyMessage: reply, // Change from `replyMessage: reply`
        adminEmail: import.meta.env.VITE_ADMIN_EMAIL, // Ensure admin verification
      });
    },
    onMutate: async ({ reviewId, reply }) => {
      await queryClient.cancelQueries({
        queryKey: ["/api/reviews/property", id],
      });

      const previousReviews = queryClient.getQueryData<Review[]>([
        "/api/reviews/property",
        id,
      ]);

      // ✅ Ensure reply is stored correctly
      queryClient.setQueryData(
        ["/api/reviews/property", id],
        (oldReviews: Review[] = []) =>
          oldReviews.map((review) =>
            review.id === reviewId
              ? {
                  ...review,
                  reply: { message: reply }, // Ensure reply format matches backend
                }
              : review
          )
      );

      return { previousReviews };
    },

    onSuccess: async () => {
      toast({ title: "Reply added successfully!" });

      await queryClient.invalidateQueries({
        queryKey: ["/api/reviews/property", id],
      });
    },
    onError: (error, _, context) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add reply. Please try again.",
      });

      if (context?.previousReviews) {
        queryClient.setQueryData(
          ["/api/reviews/property", id],
          context.previousReviews
        );
      }
    },
  });

  const handleReply = (reviewId: string) => {
    if (!replyMessages[reviewId]?.trim()) {
      toast({ title: "Reply cannot be empty", variant: "destructive" });
      return;
    }

    replyMutation.mutate({ reviewId, reply: replyMessages[reviewId] });

    // Clear only the replied review's input
    setReplyMessages((prev) => ({ ...prev, [reviewId]: "" }));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown Date";

    const [year, month, day] = dateString.split("-");
    return `${month}-${day}-${year}`; // Converts "2025-03-28" → "03-28-2025"
  };

  const { data: property, isLoading } = useQuery<Property>({
    queryKey: [`/api/properties/${id}`],
    queryFn: async () => {
      if (!id) return null;
      return fetchPropertyById(id);
    },
    staleTime: 60000,
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: [`/api/reviews/property/${id}`],
    queryFn: async () => {
      if (!id) return [];
      return fetchReviewsByProperty(id);
    },
    staleTime: 60000,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      message,
      rating,
    }: {
      message: string;
      rating: number;
    }) => {
      if (!property) throw new Error("Property details not available");

      if (!user) {
        toast({
          variant: "destructive",
          title: "Please sign in",
          description: "You must be signed in to leave a review.",
        });
        return;
      }

      const review: Partial<Review> = {
        propertyId: id,
        message,
        rating,
        userId: user.uid,
        username: user.displayName || "Anonymous",
        createdAt: new Date().toISOString(), // ISO format for consistency
      };

      const response = await apiRequest(
        "POST",
        apiUrl("/api/reviews"),
        review
      );
      return response; // Ensure response contains the new review
    },
    onMutate: async (newReview) => {
      if (id) {
        await queryClient.cancelQueries({
          queryKey: ["/api/reviews/property", id],
        });
      }

      const previousReviews = queryClient.getQueryData<Review[]>([
        "/api/reviews/property",
        id,
      ]);

      // Optimistic UI update
      queryClient.setQueryData(
        ["/api/reviews/property", id],
        (oldReviews: Review[] = []) => [
          { ...newReview, id: Math.random().toString(36).substring(7) }, // Temporary ID for UI
          ...(oldReviews || []),
        ]
      );

      return { previousReviews };
    },
    onSuccess: async (newReview) => {
      toast({ title: "Review added!" });

      // Refetch reviews to sync with the latest data
      if (id) {
        await queryClient.invalidateQueries({
          queryKey: ["/api/reviews/property", id],
        });
      }

      // Clear input fields
      setReviewMessage("");
      setRating(0);
    },
    onError: (error, newReview, context) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add review. Please try again.",
      });

      // Rollback on failure
      if (context?.previousReviews) {
        queryClient.setQueryData(
          ["/api/reviews/property", id],
          context.previousReviews
        );
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-16">
        <div className="animate-pulse w-full h-[400px] bg-gray-300 rounded-lg" />
        <div className="animate-pulse w-1/3 h-8 bg-gray-300 rounded mt-4" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold">Property not found</h1>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{property.title} - Gift & Sons Properties</title>
        <meta name="description" content={property.description} />
        <meta property="og:title" content={property.title} />
        <meta property="og:description" content={property.description} />
        <meta
          property="og:image"
          content={property.imageUrls?.[0] || "/default-image.png"}
        />
        <meta
          property="og:url"
          content={`https://giftandsonsinternational.com/properties/${property.id}`}
        />
      </Helmet>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Image Display Logic */}
        {(property.imageUrls ?? []).length > 1 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {property.imageUrls?.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  loading="lazy"
                  alt={`Image ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg shadow-md"
                />
              </div>
            ))}
          </div>
        ) : property.imageUrls?.length === 1 ? (
          <div className="w-full">
            <img
              src={property.imageUrls[0]}
              alt="Property Image"
              className="w-full h-[400px] object-cover rounded-lg"
            />
          </div>
        ) : (
          <div className="col-span-2 text-center text-muted-foreground">
            No images available
          </div>
        )}

        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            onClick={handleShare}
            className="text-primary w-fit"
          >
            Share
          </Button>
        </div>

        <div className="mt-6 space-y-6">
          <h1 className="text-3xl font-bold text-primary">{property.title}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {property.description}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-muted-foreground">
            <p className="text-foreground">
              <strong className="text-primary">Price:</strong> ksh{" "}
              {property.price}
            </p>
            <p className="text-foreground">
              <strong className="text-primary">Type:</strong> {property.type}
            </p>
            <p className="text-foreground">
              <strong className="text-primary">Category:</strong>{" "}
              {property.category}
            </p>
            <p className="text-foreground">
              <strong className="text-primary">Location:</strong>{" "}
              {property.location}
            </p>
          </div>
        </div>

        <Card
          id="review"
          ref={reviewRef}
          className="mt-8 shadow-lg border border-muted-foreground"
        >
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Leave a Review</h2>

            {/* Star Rating Input */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg font-medium">Your Rating:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`cursor-pointer text-xl lg:text-2xl transition-colors ${
                    rating >= star ? "text-yellow-500" : "text-gray-400"
                  }`}
                  onClick={() => setRating(star)}
                >
                  ★
                </span>
              ))}
            </div>

            {/* Review Input */}
            <Textarea
              className="bg-foreground"
              placeholder="Write your review here..."
              value={reviewMessage}
              onChange={(e) => setReviewMessage(e.target.value)}
            />

            {/* Submit Button */}
            {!user ? (
              <Link href="/signin">
                <Button className="w-full mt-2">
                  Sign in to leave a review
                </Button>
              </Link>
            ) : (
              <Button
                className="w-full mt-2"
                onClick={() =>
                  reviewMutation.mutate({
                    message: reviewMessage,
                    rating: rating,
                  })
                }
                disabled={reviewMutation.isPending}
              >
                Submit Review
              </Button>
            )}
          </CardContent>
        </Card>

        {/* All Reviews */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold">Reviews</h2>

          {reviewsLoading ? (
            <p className="text-gray-500">Loading reviews...</p>
          ) : reviews.length > 0 ? (
            <>
              {showAllReviews ? (
                // Show all reviews when 'See More' is clicked
                [...reviews]
                  .sort((a, b) => b.rating - a.rating)
                  .map((review) => (
                    <div
                      key={review.id}
                      className="border bg-gray-200 p-4 rounded-lg shadow-md mt-4"
                    >
                      <p className="text-sm text-gray-600">
                        ⭐ {review.rating} / 5
                      </p>
                      <p className="text-black mt-4 font-medium">
                        {review.message}
                      </p>
                      <p className="text-xs text-gray-500 text-right">
                        {formatDate(review.createdAt)}
                      </p>
                      <p className="text-sm text-primary font-semibold">
                        {review.username || "Anonymous"}
                      </p>

                      {isAdmin && !review.reply?.message && (
                        <div className="flex justify-end mt-2">
                          <Button
                            className="text-blue-500 text-sm"
                            onClick={() =>
                              setReplyOpen(
                                replyOpen === review.id ? null : review.id
                              )
                            }
                          >
                            {replyOpen === review.id ? "Cancel" : "Reply"}
                          </Button>
                        </div>
                      )}

                      {review.reply ? (
                        <div className="mt-2 pt-3 ml-9 pl-3 bg-gray-500 rounded-lg border-l-4 border-gray-500">
                          <strong className="text-primary font-semibold block">
                            Gift & Sons Properties International
                          </strong>
                          <p className="mt-3 pb-3 pl-5 text-white text-sm">
                            {review.reply.message}
                          </p>
                        </div>
                      ) : null}

                      {/* Reply Button - Only for Admin */}
                      {/* Show Reply Form only if there's no reply */}
                      {replyOpen === review.id && !review.reply && (
                        <div className="mt-2">
                          <Textarea
                            value={replyMessages[review.id] || ""}
                            onChange={(e) =>
                              handleReplyChange(review.id, e.target.value)
                            }
                            placeholder="Write a reply..."
                          />
                          <Button
                            className="mt-2"
                            onClick={() => handleReply(review.id)}
                            disabled={replyMutation.isPending}
                          >
                            {replyMutation.isPending ? "Posting..." : "Reply"}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
              ) : (
                // Show only the first review initially
                <div className="border bg-gray-200 p-4 rounded-lg shadow-md mt-4">
                  <p className="text-gray-600 font-medium">
                    ⭐ {reviews[0].rating} / 5
                  </p>
                  <p className="text-sm text-black mt-4 font-medium">
                    {reviews[0].message}
                  </p>
                  <p className="text-xs text-gray-500 text-right">
                    {formatDate(reviews[0].createdAt)}
                  </p>
                  <p className="text-sm text-primary font-semibold">
                    {reviews[0].username || "Anonymous"}
                  </p>

                  {reviews[0].reply ? (
                    <div className="mt-2 pt-3 ml-9 pl-3 bg-gray-500 rounded-lg border-l-4 border-gray-500">
                      <strong className="text-primary font-semibold block">
                        Gift & Sons Properties International
                      </strong>
                      <p className="mt-3 pb-3 pl-5 text-white text-sm">
                        {reviews[0].reply.message}
                      </p>
                    </div>
                  ) : (
                    <div>
                      {/* Reply Button - Only for Admin */}
                      {/* Show Reply Form only if there's no reply */}
                      {replyOpen === reviews[0].id && !reviews[0].reply && (
                        <div className="mt-2">
                          <Textarea
                            value={replyMessages[reviews[0].id] || ""}
                            onChange={(e) =>
                              handleReplyChange(reviews[0].id, e.target.value)
                            }
                            placeholder="Write a reply..."
                          />
                          <Button
                            className="mt-2"
                            onClick={() => handleReply(reviews[0].id)}
                            disabled={replyMutation.isPending}
                          >
                            {replyMutation.isPending ? "Posting..." : "Reply"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* "See More" Button - Toggles `showAllReviews` */}
              {reviews.length > 1 && !showAllReviews && (
                <Button
                  className="mt-4"
                  onClick={() => setShowAllReviews(true)}
                >
                  See More
                </Button>
              )}
            </>
          ) : (
            <p className="text-gray-500 mt-4">No Reviews Yet</p>
          )}
        </div>
      </div>
    </>
  );
}
