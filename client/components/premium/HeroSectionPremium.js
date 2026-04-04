import Link from "next/link";
import Image from "next/image";

export default function HeroSectionPremium() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-pink-50 via-pink-100 to-rose-50 py-20">
      <div className="section-shell grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
        <div>
          <p className="text-sm uppercase tracking-widest text-rose-600">Handcrafted delights</p>
          <h1 className="mt-4 font-heading text-4xl md:text-6xl text-cocoa leading-tight">Ramji Bakery — Sweet moments, freshly baked</h1>
          <p className="mt-4 text-lg text-mocha/70 max-w-xl">Premium cakes, pastries and party essentials baked daily. Order now for same-day pickup or delivery.</p>

          <div className="mt-8 flex items-center gap-4">
            <Link href="/menu" className="rounded-full bg-gradient-to-r from-pink-500 to-rose-400 px-6 py-3 text-white font-semibold shadow-lg hover:scale-[1.02] transition">
              Order Now
            </Link>
            <Link href="/menu" className="rounded-full border border-white/60 px-5 py-3 text-sm font-medium text-cocoa bg-white/80 hover:bg-white">
              Explore Menu
            </Link>
          </div>
        </div>

        <div className="hidden md:flex justify-end">
          <div className="relative w-[420px] h-[420px] rounded-3xl overflow-hidden shadow-xl bg-white/90" style={{ transform: 'translateY(-10px)' }}>
            <Image src="/images/hero-cake.jpg" alt="Hero cake" fill className="object-cover" priority />
          </div>
        </div>
      </div>
    </section>
  );
}
