import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { PiSignOutBold } from "react-icons/pi";
import { HiOutlineMenu, HiX } from "react-icons/hi"; // Menu icons
import image from "../../assets/gift&sons.png";
import React from "react";

export function Navbar() {
  const [user] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation()[0];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
      const isAdminUser = user?.email === adminEmail;
      setIsAdmin(isAdminUser);

      if (isAdminUser) {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/reviews/unviewed_count`
          );
          const data = await res.json();
          setUnviewedCount(data.count || 0);
        } catch (err) {
          console.error("Failed to fetch review count", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (location === "/reviews" && isAdmin) {
      setUnviewedCount(0); // assume viewed when visiting the page
    }
  }, [location, isAdmin]);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/reviews/unviewed_count`
        );
        const data = await res.json();
        setUnviewedCount(data.count || 0);
      } catch (err) {
        console.error("Failed to re-fetch review count", err);
      }
    };

    if (isAdmin && location !== "/reviews") {
      fetchCount();
    }
  }, [location, isAdmin]);

  return (
    <nav className="bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Title */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <img className="h-8 w-auto mr-2" src={image} alt="Logo" />
              <div className="text-center">
                <span className="font-bold text-primary text-lg sm:text-xl block">
                  Gift & Sons
                </span>
                <span className="text-primary text-sm sm:text-base text-gray-600">
                  Properties International
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Menu (Hidden on Small Screens) */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/reviews" className="relative flex items-center gap-1">
              <span>Reviews</span>
              {isAdmin && unviewedCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs font-bold text-white bg-primary rounded-full">
                  {unviewedCount}
                </span>
              )}
            </Link>
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
            <Link href="/reviews" className="relative flex items-center gap-1">
              <span>Reviews</span>
              {isAdmin && unviewedCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs font-bold text-white bg-primary rounded-full">
                  {unviewedCount}
                </span>
              )}
            </Link>
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
