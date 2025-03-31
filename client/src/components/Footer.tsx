import { Link } from "wouter";
import image from "../../assets/gift&sons.png";
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

export function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <img className="h-8 w-auto mr-2" src={image} alt="Logo" />
                <span className="font-bold text-primary text-lg sm:text-xl">
                  Gift & Sons
                </span>
              </Link>
            </div>
            <p className="text-muted-foreground mt-4">
              {" "}
              {/* Add margin-top for spacing */}
              Your trusted partner in real estate, providing exceptional service
              and prime properties.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/properties">
                  <a className="text-muted-foreground hover:text-primary">
                    Properties
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <a className="text-muted-foreground hover:text-primary">
                    Contact Us
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/admin">
                  <a className="text-muted-foreground hover:text-primary">
                    Admin Dashboard
                  </a>
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>20117, Biashara Street, Naivasha, Kenya</li>
              <li>Main Contact: +254720464627</li>
              <li>Substitue Contact 1: +254 716 080 793 / David</li>
              <li>Substitue Contact 2: +1 (717) 333-7547 / Zacharia</li>
              <li>Substitue Contact 3: +254 780 464 626 / Gladwell</li>
              <li>Email: giftnsons@gmail.com</li>
              <li>Hours: 24/7</li>
            </ul>
          </div>
        </div>
        <div className="flex justify-center gap-6 mt-8">
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
        <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Gift And Sons Properties
            International. All rights reserved.
          </p>
          <br />
          <p>
            Built by :{" "}
            <a
              href="https://startech-softwares.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-orange-300"
            >
              STARTECH SOFTWARES
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
