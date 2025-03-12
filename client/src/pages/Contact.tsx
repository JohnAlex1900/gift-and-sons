import { ContactSection } from "@/components/ContactSection";

export default function Contact() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-primary text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Whether you're looking to buy, sell, or rent a property, our team of
            experts is here to help you every step of the way.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="bg-card rounded-lg p-8">
              <h2 className="text-2xl font-semibold mb-6">Visit Our Office</h2>
              <div className="space-y-4">
                <img
                  src="https://images.unsplash.com/photo-1497366754035-f200968a6e72"
                  alt="Office"
                  className="w-full h-48 object-cover rounded-lg mb-6"
                />
                <div className="space-y-2">
                  <p className="flex items-center gap-2">
                    <span className="font-semibold">Address:</span>
                    <span className="text-muted-foreground">
                      20117, Biashara Street, Naivasha, Kenya
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-semibold">Phone:</span>
                    <span className="text-muted-foreground">
                      Main: +254 720 464627
                      <p>Substitue Contact 1: +254716080793 / Dave</p>
                      <p>Substitue Contact 2: +254780464626 / Gladwel</p>
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-semibold">Email:</span>
                    <span className="text-muted-foreground">
                      giftnsons@gmail.com
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-semibold">Hours:</span>
                    <span className="text-muted-foreground">Open 24/7</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <ContactSection />
          </div>
        </div>
      </div>
    </div>
  );
}
