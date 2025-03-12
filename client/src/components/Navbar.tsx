import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { PiSignOutBold } from "react-icons/pi";
import image from "../../public/gift-and-sons.png";

export function Navbar() {
  const [user] = useAuthState(auth);
  const isAdmin = user?.email === import.meta.env.VITE_ADMIN_EMAIL;

  return (
    <nav className="bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <img
                className="h-8 w-auto mr-2" // Add margin-right for spacing
                src={image}
                alt="Logo"
              />
              <a className="text-2xl font-bold text-primary">Gift & Sons</a>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/properties">
              <a className="text-foreground hover:text-primary">Properties</a>
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
        </div>
      </div>
    </nav>
  );
}
