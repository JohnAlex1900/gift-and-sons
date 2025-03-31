import { ContactSection } from "@/components/ContactSection";
import {
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaYoutube,
  FaWhatsapp,
} from "react-icons/fa";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const socialLinks = [
  {
    icon: FaFacebook,
    url: "https://www.facebook.com/share/1BfvB2HWSo/?mibextid=wwXIfr",
    label: "Facebook",
  },
  {
    icon: FaInstagram,
    url: "https://www.instagram.com/giftnsonsproperties?igsh=NW1ncWVvaGRzbG02&utm_source=qr",
    label: "Instagram",
  },
  {
    icon: FaTiktok,
    url: "https://www.tiktok.com/@gift.sons.propert?_t=ZM-8usBA4ryhgz&_r=1",
    label: "TikTok",
  },
  {
    icon: FaYoutube,
    url: "https://youtube.com/@giftandsonstv2023?si=rC3jo__aqj9brXrC",
    label: "YouTube",
  },
  { icon: FaWhatsapp, url: "https://wa.me/254720464627", label: "WhatsApp" },
];

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
                      <p>Substitue Contact 1: +254716080793 / David</p>
                      <li>Substitue Contact 2: +1 (717) 333-7547 / Zacharia</li>
                      <p>Substitue Contact 3: +254780464626 / Gladwell</p>
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
        <div className="flex items-center justify-start gap-8 mt-8 text-2xl">
          {socialLinks.map(({ icon: Icon, url, label }) => (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-transform transform hover:scale-110"
                >
                  <Icon size={28} />
                </a>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
}
