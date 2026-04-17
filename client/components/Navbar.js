import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { Menu, Search, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { useShop } from "../context/ShopContext";

const links = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/cakes", label: "Cakes" },
  { href: "/party", label: "Party" },
  { href: "/orders", label: "Orders" },
  { href: "/account", label: "My Account" },
  { href: "/customize-cake", label: "Customize Cake" },
  { href: "/antigravity", label: "Antigravity" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { cart } = useShop();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-lg bg-white/80 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/70 bg-white shadow-soft">
              <Image src="/logo.svg" alt="Ramji Bakery logo" fill className="object-cover p-1" priority />
            </div>
            <span className="hidden sm:inline font-sans font-extrabold text-xl text-cocoa">Ram Ji Bakery</span>
          </Link>
        </div>

        <nav className="hidden lg:flex gap-8 items-center text-sm text-mocha">
          <Link href="/menu" className="hover:text-caramel transition">Menu</Link>
          <Link href="/cakes" className="hover:text-caramel transition">Cakes</Link>
          <Link href="/party" className="hover:text-caramel transition">Party</Link>
          <Link href="/antigravity" className="hover:text-caramel transition">Antigravity</Link>
          <Link href="/about" className="hover:text-caramel transition">About</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/cart" className="relative inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-latte/50 text-cocoa shadow-sm hover:bg-latte transition">
            <ShoppingCart size={18} />
            <span className="text-sm font-semibold">{cart?.length || 0}</span>
          </Link>
          <button className="px-3 py-2 rounded-lg text-sm text-mocha hover:bg-latte/40 transition" onClick={() => router.push('/login')}>
            Login
          </button>

          <button className="lg:hidden rounded-full border border-caramel/30 p-3 text-cocoa" onClick={() => setOpen((p) => !p)} aria-label="Toggle menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="container mx-auto px-4 space-y-3 pb-4 lg:hidden">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="block rounded-2xl bg-white/75 px-4 py-3 text-sm font-medium text-cocoa" onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link href="/cart" className="block rounded-2xl bg-cocoa px-4 py-3 text-center text-sm font-semibold text-cream" onClick={() => setOpen(false)}>
            Cart ({cart?.length || 0})
          </Link>
        </div>
      )}
    </header>
  );
}
