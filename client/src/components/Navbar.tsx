import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { PiSignOutBold } from "react-icons/pi";
import { HiOutlineMenu, HiX } from "react-icons/hi"; // Menu icons
import image from "../../assets/gift&sons.png";

export function Navbar() {
  const [user] = useAuthState(auth);
  const isAdmin = user?.email === import.meta.env.VITE_ADMIN_EMAIL;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Title */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <img className="h-8 w-auto mr-2" src={image} alt="Logo" />
              <span className="font-bold text-primary text-lg sm:text-xl">
                Gift & Sons
              </span>
            </Link>
          </div>

          {/* Desktop Menu (Hidden on Small Screens) */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/properties">
              <a className="text-foreground hover:text-primary">Properties</a>
            </Link>
            <Link href="/cars">
              <a className="text-foreground hover:text-primary">Cars</a>
            </Link>
            <Link href="/contact">
              <a className="text-foreground hover:text-primary">Contact</a>
            </Link>
            {user ? (
              <>
                {isAdmin && (
                  <Link href="/admin">
                    <Button
                      className="hover:bg-primary hover:text-background"
                      variant="outline"
                    >
                      Dashboard
                    </Button>
                  </Link>
                )}
                <Button
                  className="bg-primary text-background hover:bg-foreground hover:text-background"
                  variant="outline"
                  onClick={() => auth.signOut()}
                >
                  <PiSignOutBold className="inline-block mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link href="/signin">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-foreground focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <HiX size={28} /> : <HiOutlineMenu size={28} />}
          </button>
        </div>

        {/* Mobile Menu (Only visible when toggled) */}
        {isMenuOpen && (
          <div className="md:hidden flex flex-col items-center space-y-4 py-4 border-t">
            <Link href="/properties">
              <a className="text-foreground hover:text-primary">Properties</a>
            </Link>
            <Link href="/cars">
              <a className="text-foreground hover:text-primary">Cars</a>
            </Link>
            <Link href="/contact">
              <a className="text-foreground hover:text-primary">Contact</a>
            </Link>
            {user ? (
              <>
                {isAdmin && (
                  <Link href="/admin">
                    <Button
                      className="hover:bg-primary hover:text-background"
                      variant="outline"
                    >
                      Dashboard
                    </Button>
                  </Link>
                )}
                <Button
                  className="bg-primary text-background hover:bg-foreground hover:text-background"
                  variant="outline"
                  onClick={() => auth.signOut()}
                >
                  <PiSignOutBold className="inline-block mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link href="/signin">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
