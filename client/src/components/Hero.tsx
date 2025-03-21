import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import hero_image from "../../assets/hero.jpg";

export function Hero() {
  return (
    <div className="relative h-[70vh] flex items-center">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${hero_image})`, // ✅ Use `url(...)`
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.5)",
        }}
      />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
        <h1 className="text-5xl font-bold mb-6">
          Turning Dreams Into Addresses
        </h1>
        <p className="text-xl mb-8 max-w-2xl">
          Gift And Sons Properties International offers exclusive luxury
          properties for sale, rent and lease across prime locations around
          Kenya as well as internationally.
        </p>
        <div className="flex gap-4">
          <Link href="/properties">
            <Button size="lg" className="bg-primary text-primary-foreground">
              Browse Properties
            </Button>
          </Link>
          <Link href="/contact">
            <Button
              size="lg"
              variant="outline"
              className="text-white border-white"
            >
              Contact Us
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
