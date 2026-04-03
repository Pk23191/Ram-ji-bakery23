import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { useShop } from "../context/ShopContext";

const links = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/cakes", label: "Cakes" },
  { href: "/party", label: "Party Accessories" },
  { href: "/orders", label: "Orders" },
  { href: "/account", label: "My Account" },
  { href: "/customize-cake", label: "Customize Cake" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { cart } = useShop();

  return (
    <header className="sticky top-0 z-50 border-b border-white/40 bg-cream/85 backdrop-blur-xl">
      <div className="section-shell flex items-center justify-between gap-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/70 bg-white shadow-soft">
            <Image src="/logo.svg" alt="Ramji Bakery logo" fill className="object-cover p-1.5" priority />
          </div>
          <div>
            <p className="font-heading text-xl text-cocoa">Ramji Bakery</p>
            <p className="text-xs uppercase tracking-[0.24em] text-caramel">Dinara, MP</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium ${
                router.pathname === link.href ? "text-cocoa" : "text-mocha/70"
              } hover:text-cocoa`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile: show compact search and cart */}
        <div className="flex items-center gap-3 lg:hidden">
          <button className="rounded-full border border-white/70 p-2 bg-white/80" onClick={() => router.push('/menu')} aria-label="Search">
            <Search size={16} className="text-caramel" />
          </button>
          <Link href="/cart" className="relative rounded-full bg-cocoa p-2 text-cream">
            <ShoppingBag size={18} />
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose px-1 text-[10px] font-bold text-cocoa">
              {cart.length}
            </span>
          </Link>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 shadow-soft">
            <Search size={16} className="text-caramel" />
            <input
              type="text"
              placeholder="Search cakes, pastries, party items..."
              className="w-56 bg-transparent text-sm outline-none"
              onFocus={() => router.push("/menu")}
              readOnly
            />
          </div>
          <Link href="/cart" className="relative rounded-full bg-cocoa p-3 text-cream">
            <ShoppingBag size={18} />
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose px-1 text-[10px] font-bold text-cocoa">
              {cart.length}
            </span>
          </Link>
        </div>

        <button
          className="rounded-full border border-caramel/30 p-3 text-cocoa lg:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="section-shell space-y-3 pb-4 lg:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-2xl bg-white/75 px-4 py-3 text-sm font-medium text-cocoa"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/cart"
            className="block rounded-2xl bg-cocoa px-4 py-3 text-center text-sm font-semibold text-cream"
            onClick={() => setOpen(false)}
          >
            Cart ({cart.length})
          </Link>
        </div>
      )}
    </header>
  );
}
