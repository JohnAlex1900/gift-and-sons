import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Rental } from "@/types";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { fetchRentalById } from "@/lib/public-firestore";

export default function RentalDetails() {
  const { id } = useParams();
  const { toast } = useToast();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );
  const [visiblePhotoCount, setVisiblePhotoCount] = useState(1);

  const { data: rental, isLoading } = useQuery<Rental | null>({
    queryKey: [`/api/rentals/${id}`],
    queryFn: () => fetchRentalById(id!),
    enabled: Boolean(id),
    staleTime: 60000,
  });

  const imageUrls = rental?.imageUrls ?? [];
  const visibleImageUrls = imageUrls.slice(1, visiblePhotoCount);
  const selectedImage =
    selectedImageIndex === null
      ? null
      : (imageUrls[selectedImageIndex] ?? null);

  useEffect(() => {
    setVisiblePhotoCount(1);
    setSelectedImageIndex(null);
  }, [id]);

  const showPreviousImage = () => {
    if (imageUrls.length < 2 || selectedImageIndex === null) return;
    setSelectedImageIndex(
      (selectedImageIndex - 1 + imageUrls.length) % imageUrls.length,
    );
  };

  const showNextImage = () => {
    if (imageUrls.length < 2 || selectedImageIndex === null) return;
    setSelectedImageIndex((selectedImageIndex + 1) % imageUrls.length);
  };

  useEffect(() => {
    if (selectedImageIndex === null) return;

    const handleGalleryKeys = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPreviousImage();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showNextImage();
      }
    };

    window.addEventListener("keydown", handleGalleryKeys);
    return () => window.removeEventListener("keydown", handleGalleryKeys);
  }, [selectedImageIndex, imageUrls.length]);

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: rental?.title || "Check out this rental",
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-16 px-4">
        <div className="animate-pulse w-full max-w-5xl h-[400px] bg-gray-300 rounded-lg" />
        <div className="animate-pulse w-1/3 h-8 bg-gray-300 rounded mt-4" />
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold text-foreground">Rental not found</h1>
        <p className="text-muted-foreground mt-4">
          The rental property you are looking for does not exist or has been
          removed.
        </p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{rental.title} - Rentals | Gift & Sons Properties</title>
        <meta name="description" content={rental.description} />
        <meta property="og:title" content={rental.title} />
        <meta property="og:description" content={rental.description} />
        <meta
          property="og:image"
          content={rental.imageUrls?.[0] || "/default-image.png"}
        />
        <meta
          property="og:url"
          content={`https://giftandsonsinternational.com/rentals/${rental.id}`}
        />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Image Display Logic */}
        {imageUrls.length > 0 ? (
          <div className="space-y-4">
            <button
              type="button"
              className="relative block aspect-[16/9] max-h-[560px] w-full overflow-hidden rounded-lg bg-muted text-left shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              onClick={() => setSelectedImageIndex(0)}
              aria-label="Open rental image 1 in full size"
            >
              <img
                src={imageUrls[0]}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                alt={`${rental.title} - photo 1`}
                className="h-full w-full object-cover"
              />
            </button>
            {visibleImageUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {visibleImageUrls.map((url, index) => (
              <button
                type="button"
                key={`${url}-${index}`}
                className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted text-left shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                onClick={() => setSelectedImageIndex(index + 1)}
                aria-label={`Open rental image ${index + 2} in full size`}
              >
                <img
                  src={url}
                  loading="lazy"
                  fetchPriority="low"
                  decoding="async"
                  alt={`${rental.title} - photo ${index + 2}`}
                  className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                />
              </button>
                ))}
              </div>
            )}
            {visiblePhotoCount < imageUrls.length && (
              <Button
                variant="outline"
                onClick={() =>
                  setVisiblePhotoCount((currentCount) =>
                    Math.min(currentCount + 6, imageUrls.length),
                  )
                }
              >
                Load {Math.min(6, imageUrls.length - visiblePhotoCount)} more
                photos
              </Button>
            )}
          </div>
        ) : (
          <div className="flex aspect-[16/9] items-center justify-center rounded-lg bg-muted text-muted-foreground">
            No images available for this rental
          </div>
        )}

        {/* Fullscreen Image Gallery Modal */}
        <Dialog
          open={selectedImageIndex !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedImageIndex(null);
          }}
        >
          <DialogContent className="inset-0 h-[100dvh] w-screen max-h-none max-w-none translate-x-0 translate-y-0 border-0 bg-black p-0 shadow-none sm:rounded-none [&>button:last-child]:right-4 [&>button:last-child]:top-4 [&>button:last-child]:z-20 [&>button:last-child]:h-11 [&>button:last-child]:w-11 [&>button:last-child]:rounded-full [&>button:last-child]:bg-black/70 [&>button:last-child]:text-white [&>button:last-child]:opacity-100 [&>button:last-child]:hover:bg-black">
            <DialogTitle className="sr-only">Expanded rental image</DialogTitle>
            {selectedImage && (
              <div className="relative flex h-full w-full items-center justify-center">
                <img
                  src={selectedImage}
                  alt={`Rental image ${(selectedImageIndex ?? 0) + 1} of ${imageUrls.length}`}
                  className="h-full w-full object-contain"
                />
                {imageUrls.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={showPreviousImage}
                      className="absolute left-3 flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-black focus:outline-none focus:ring-2 focus:ring-white sm:left-6 sm:h-14 sm:w-14"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-7 w-7" />
                    </button>
                    <button
                      type="button"
                      onClick={showNextImage}
                      className="absolute right-3 flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-black focus:outline-none focus:ring-2 focus:ring-white sm:right-6 sm:h-14 sm:w-14"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-7 w-7" />
                    </button>
                    <p className="absolute bottom-4 rounded-full bg-black/70 px-3 py-1 text-sm text-white">
                      {(selectedImageIndex ?? 0) + 1} / {imageUrls.length}
                    </p>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Title & Share Button */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mt-8 gap-4">
          <h1 className="text-3xl md:text-4xl font-bold text-primary flex-1">
            {rental.title}
          </h1>
          <Button
            variant="outline"
            onClick={handleShare}
            className="text-primary w-fit shrink-0 flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" /> Share
          </Button>
        </div>

        {/* Description & Details Grid */}
        <div className="mt-6 space-y-8">
          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p className="leading-relaxed whitespace-pre-wrap">
              {rental.description}
            </p>
          </div>

          <div className="bg-muted/30 p-6 rounded-lg border border-border">
            <h3 className="text-xl font-semibold mb-4 text-foreground">
              Property Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4 text-muted-foreground">
              <p className="text-foreground">
                <strong className="text-primary block text-sm uppercase tracking-wider mb-1">
                  Rent:
                </strong>
                <span className="text-lg font-medium">
                  ksh {rental.price?.toLocaleString()} / month
                </span>
              </p>
              {rental.status && (
                <p className="text-foreground">
                  <strong className="text-primary block text-sm uppercase tracking-wider mb-1">
                    Status:
                  </strong>
                  <span
                    className={`font-medium ${rental.status === "Rented" ? "text-destructive" : "text-green-600"}`}
                  >
                    {rental.status}
                  </span>
                </p>
              )}
              <p className="text-foreground">
                <strong className="text-primary block text-sm uppercase tracking-wider mb-1">
                  Type:
                </strong>
                {rental.type}
              </p>
              <p className="text-foreground">
                <strong className="text-primary block text-sm uppercase tracking-wider mb-1">
                  Category:
                </strong>{" "}
                {rental.category}
              </p>
              <p className="text-foreground">
                <strong className="text-primary block text-sm uppercase tracking-wider mb-1">
                  Location:
                </strong>{" "}
                {rental.location}
              </p>
              {(rental.category === "house" ||
                rental.category === "apartment") &&
                rental.bedrooms &&
                rental.bedrooms.length > 0 && (
                  <p className="text-foreground">
                    <strong className="text-primary block text-sm uppercase tracking-wider mb-1">
                      Bedrooms:
                    </strong>{" "}
                    {rental.bedrooms.join(", ")}
                  </p>
                )}
              {(rental.category === "house" ||
                rental.category === "apartment") &&
                rental.bathrooms !== undefined && (
                  <p className="text-foreground">
                    <strong className="text-primary block text-sm uppercase tracking-wider mb-1">
                      Bathrooms:
                    </strong>{" "}
                    {rental.bathrooms}
                  </p>
                )}
              {rental.area !== undefined && (
                <p className="text-foreground">
                  <strong className="text-primary block text-sm uppercase tracking-wider mb-1">
                    Area:
                  </strong>
                  {rental.area} sqft
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
