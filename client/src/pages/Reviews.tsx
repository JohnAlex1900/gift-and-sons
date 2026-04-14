import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Star } from "lucide-react";
import { Review, Item } from "@/types";
import { Helmet } from "react-helmet-async";
import { apiUrl } from "@/api";

function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [items, setItems] = useState<Record<string, Item>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviewsAndItems = async () => {
      try {
        const res = await fetch(apiUrl("/api/reviews"));
        if (!res.ok) throw new Error("Failed to fetch reviews");
        const data = await res.json();

        if (!Array.isArray(data)) {
          console.error("Expected array but got:", data);
          return;
        }

        setReviews(data);

        // Extract unique property/car IDs
        const itemIds = Array.from(
          new Set(
            data.map((review: Review) => review.propertyId || review.carId)
          )
        ).filter(Boolean);

        // Fetch all items in parallel
        const itemData: Record<string, Item> = {};

        await Promise.all(
          data.map(async (review: Review) => {
            const id = review.propertyId || review.carId;
            if (!id || itemData[id]) return;

            try {
              if (review.propertyId) {
                const propertyRes = await axios.get(
                  apiUrl(`/api/properties/${review.propertyId}`)
                );
                itemData[review.propertyId] = propertyRes.data;
              } else if (review.carId) {
                const carRes = await axios.get(
                  apiUrl(`/api/cars/${review.carId}`)
                );
                itemData[review.carId] = carRes.data;
              }
            } catch (err) {
              console.warn(`Item not found for ID ${id}`);
            }
          })
        );

        setItems(itemData);
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviewsAndItems();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading reviews...</p>;

  const hasReviews = reviews.length > 0;

  if (!reviews || reviews.length === 0) {
    return (
      <div className="flex flex-col items-center mt-10">
        <p className="text-gray-600 text-lg">No reviews available yet.</p>
        <Link
          to="/properties"
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Browse Properties
        </Link>
      </div>
    );
  }

  const reviewsByItem: Record<string, Review[]> = {};
  if (Array.isArray(reviews)) {
    reviews.forEach((review) => {
      const key = review.propertyId || review.carId;
      if (!key) return;
      if (!reviewsByItem[key]) reviewsByItem[key] = [];
      reviewsByItem[key].push(review);
    });
  }

  return (
    <>
      <Helmet>
        <title>Reviews - Gift & Sons Properties</title>
        <meta
          name="description"
          content="Browse reviews for properties and cars for sale and rent in Gift & Sons"
        />
        <meta property="og:title" content="Reviews - Gift & Sons Properties" />
        <meta
          property="og:description"
          content="Browse reviews for properties and cars for sale and rent in Gift & Sons"
        />

        <meta
          property="og:url"
          content={`https://giftandsonsinternational.com/reviews`}
        />
      </Helmet>
      <div className="max-w-6xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">All Reviews</h1>

        {hasReviews ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Object.entries(reviewsByItem).map(([itemId, itemReviews]) => {
              const item = items[itemId];
              if (!item) return null;

              const totalRating = itemReviews.reduce(
                (acc, r) => acc + r.rating,
                0
              );
              const avgRating = (totalRating / itemReviews.length).toFixed(1);
              const imageUrl =
                item.imageUrls?.[0] ||
                "https://images.unsplash.com/photo-1724120932030-d8210a77deed?q=80&w=1615&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

              // Determine if it's a property or a car
              const isProperty = !!itemReviews[0].propertyId; // or any property-unique key
              const routePath = isProperty
                ? `/properties/${itemId}`
                : `/cars/${itemId}`;

              return (
                <Link
                  to={routePath}
                  key={itemId}
                  className="block hover:shadow-2xl transition-shadow rounded-2xl"
                >
                  <Card className="shadow-xl rounded-2xl cursor-pointer">
                    <img
                      src={imageUrl}
                      alt={item.title}
                      className="w-full h-40 object-cover rounded-t-2xl"
                    />
                    <CardContent className="p-4">
                      <h2 className="text-xl font-semibold mb-1">
                        {item.title}
                      </h2>
                      <p className="text-sm text-gray-500 mb-2">
                        ksh{item.price.toLocaleString()}
                      </p>
                      <div className="flex justify-between text-sm">
                        <span>{itemReviews.length} reviews</span>
                        <span className="flex items-center gap-1">
                          {avgRating}{" "}
                          <Star className="w-4 h-4 text-yellow-500" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center mt-10">
            <p className="text-lg font-medium mb-4">
              No reviews have been submitted yet.
            </p>
            <Link to="/properties">
              <Button>View Properties</Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

export default ReviewsPage;
