import Link from "next/link";
import { Home, Grid, ShoppingCart, User } from "lucide-react";

export default function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 w-full md:hidden bg-white/90 border-t border-white/60 z-50">
      <div className="section-shell flex items-center justify-between py-2">
        <Link href="/" className="flex flex-col items-center text-xs text-mocha">
          <Home size={20} />
          <span>Home</span>
        </Link>
        <Link href="/menu" className="flex flex-col items-center text-xs text-mocha">
          <Grid size={20} />
          <span>Categories</span>
        </Link>
        <Link href="/cart" className="flex flex-col items-center text-xs text-mocha">
          <ShoppingCart size={20} />
          <span>Cart</span>
        </Link>
        <Link href="/account" className="flex flex-col items-center text-xs text-mocha">
          <User size={20} />
          <span>Profile</span>
        </Link>
      </div>
    </nav>
  );
}
