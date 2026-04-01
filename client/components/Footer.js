import Link from "next/link";
import Image from "next/image";
import useOwnerContact from "../hooks/useOwnerContact";

export default function Footer() {
  const { phone, email } = useOwnerContact();

  return (
    <footer className="mt-20 border-t border-white/50 bg-cocoa text-cream">
      <div className="section-shell grid gap-10 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-white/95 p-1">
              <Image src="/logo.svg" alt="Ramji Bakery logo" fill className="object-contain p-1" />
            </div>
            <p className="font-heading text-2xl">Ramji Bakery</p>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-7 text-cream/70">
            Fresh cakes, breads and celebration essentials handcrafted in Dinara, Madhya Pradesh.
          </p>
        </div>
        <div>
          <p className="font-semibold">Quick Links</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-cream/70">
            <Link href="/menu">Menu</Link>
            <Link href="/cakes">Cakes</Link>
            <Link href="/orders">Orders</Link>
            <Link href="/customize-cake">Customize Cake</Link>
            <Link href="/track-order">Track Order</Link>
            <Link href="/admin">Admin Dashboard</Link>
          </div>
        </div>
        <div>
          <p className="font-semibold">Visit Us</p>
          <div className="mt-4 space-y-2 text-sm text-cream/70">
            <p>Main Market Road, Dinara, Madhya Pradesh</p>
            <p>{phone}</p>
            <p>{email}</p>
            <a
              href="https://www.instagram.com/ramji_bakery_1100?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-latte underline underline-offset-4"
            >
              Follow us on Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
