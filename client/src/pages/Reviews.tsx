import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { apiUrl } from "@/api";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { fetchAllReviews } from "@/lib/public-firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Review } from "@/types";
import { Input } from "@/components/ui/input";

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("en", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
};

export default function ReviewsPage() {
  const [user] = useAuthState(auth);
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewerName, setReviewerName] = useState("");
  const [replyMessages, setReplyMessages] = useState<Record<string, string>>(
    {},
  );
  const [replyOpen, setReplyOpen] = useState<string | null>(null);
  const isAdmin = user?.email === import.meta.env.VITE_ADMIN_EMAIL;
  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ["/api/reviews"],
    queryFn: async (): Promise<Review[]> => {
      const response = await apiRequest("GET", apiUrl("/api/reviews"));
      return response.json();
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!isAdmin) return;

    apiRequest("PATCH", apiUrl("/api/reviews/mark_viewed")).catch((error) =>
      console.error("Unable to mark reviews as viewed:", error),
    );
  }, [isAdmin]);

  const addReview = useMutation({
    mutationFn: async () => {
      if (!reviewerName.trim()) throw new Error("Please provide your name.");
      if (!message.trim()) throw new Error("Please write a review message.");

      return apiRequest("POST", apiUrl("/api/reviews"), {
        message,
        rating,
        username: reviewerName.trim(),
        userId: "guest", // Satisfies backend requirement for non-logged-in users
      });
    },
    onSuccess: async () => {
      setMessage("");
      setReviewerName(""); // Clear the name field
      setRating(5);
      await queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      toast({ title: "Thank you for your review!" });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Could not submit review",
        description:
          error instanceof Error
            ? error.message
            : "Please try again in a moment.",
      });
    },
  });

  const replyToReview = useMutation({
    mutationFn: async ({
      reviewId,
      reply,
    }: {
      reviewId: string;
      reply: string;
    }) => {
      const normalizedReply = reply.trim();
      if (!normalizedReply) throw new Error("Reply cannot be empty.");

      return apiRequest("POST", apiUrl("/api/reviews/reply"), {
        reviewId,
        replyMessage: normalizedReply,
      });
    },
    onSuccess: async (_, { reviewId }) => {
      setReplyMessages((current) => ({ ...current, [reviewId]: "" }));
      setReplyOpen(null);
      await queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      toast({ title: "Reply added successfully." });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Could not add reply",
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    },
  });

  const averageRating = reviews.length
    ? (
        reviews.reduce((total, review) => total + review.rating, 0) /
        reviews.length
      ).toFixed(1)
    : null;

  return (
    <>
      <Helmet>
        <title>Customer Reviews | Gift & Sons International</title>
        <meta
          name="description"
          content="Read customer reviews of Gift & Sons Properties International."
        />
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <section className="text-center mb-8">
          <h1 className="text-3xl font-bold">Customer Reviews</h1>
          <p className="mt-2 text-muted-foreground">
            Experiences shared by customers of Gift & Sons International.
          </p>
          {averageRating && (
            <p className="mt-3 inline-flex items-center gap-1 font-semibold">
              {averageRating}{" "}
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-normal text-muted-foreground">
                ({reviews.length} reviews)
              </span>
            </p>
          )}
        </section>

        <Card className="mb-8">
          <CardContent className="p-5">
            <h2 className="text-xl font-semibold">Share your experience</h2>
            <div className="mt-4">
              <Input
                className="mb-3 bg-muted text-muted-foreground"
                placeholder="Your Name"
                value={reviewerName}
                onChange={(event) => setReviewerName(event.target.value)}
                maxLength={50}
              />
              <div
                className="flex items-center gap-1 mb-3"
                aria-label={`Rating: ${rating} out of 5`}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1"
                    aria-label={`Rate ${star} out of 5`}
                  >
                    <Star
                      className={`h-6 w-6 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                    />
                  </button>
                ))}
              </div>
              <Textarea
                className="bg-muted text-muted-foreground"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={2000}
                placeholder="Tell us about your experience..."
              />
              <Button
                className="mt-3 w-full sm:w-auto"
                onClick={() => addReview.mutate()}
                disabled={
                  !message.trim() || !reviewerName.trim() || addReview.isPending
                }
              >
                {addReview.isPending ? "Submitting…" : "Submit review"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <section aria-live="polite">
          <h2 className="sr-only">All customer reviews</h2>
          {isLoading ? (
            <p className="text-center text-muted-foreground">
              Loading reviews…
            </p>
          ) : reviews.length ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">{review.username}</p>
                        <div
                          className="mt-1 flex"
                          aria-label={`${review.rating} out of 5 stars`}
                        >
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <time className="text-sm text-muted-foreground">
                        {formatDate(review.createdAt)}
                      </time>
                    </div>
                    <p className="mt-4 whitespace-pre-wrap">{review.message}</p>
                    {review.reply?.message && (
                      <div className="mt-4 border-l-4 border-primary/40 bg-muted p-3">
                        <p className="font-medium">Gift & Sons International</p>
                        <p className="mt-1 whitespace-pre-wrap">
                          {review.reply.message}
                        </p>
                      </div>
                    )}
                    {isAdmin && !review.reply?.message && (
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          onClick={() =>
                            setReplyOpen((current) =>
                              current === review.id ? null : review.id,
                            )
                          }
                        >
                          {replyOpen === review.id ? "Cancel" : "Reply"}
                        </Button>
                        {replyOpen === review.id && (
                          <div className="mt-3 space-y-2">
                            <Textarea
                              value={replyMessages[review.id] ?? ""}
                              onChange={(event) =>
                                setReplyMessages((current) => ({
                                  ...current,
                                  [review.id]: event.target.value,
                                }))
                              }
                              maxLength={2000}
                              placeholder="Write a reply..."
                            />
                            <Button
                              onClick={() =>
                                replyToReview.mutate({
                                  reviewId: review.id,
                                  reply: replyMessages[review.id] ?? "",
                                })
                              }
                              disabled={
                                !replyMessages[review.id]?.trim() ||
                                replyToReview.isPending
                              }
                            >
                              {replyToReview.isPending
                                ? "Posting…"
                                : "Post reply"}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              Be the first to leave a review.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
