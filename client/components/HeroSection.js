import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";

export default function HeroSection() {
  // Use static logo for Featured section (do not depend on products[0])
  const [logoSrc, setLogoSrc] = useState("/logo.png");

  return (
     <section className="py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="space-y-6"
      >
        <span className="inline-flex rounded-full border border-caramel/30 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-caramel">
          Dinara&apos;s premium bakery experience
        </span>
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800">Celebrate with Exquisite Cakes</h1>
          <p className="max-w-xl text-base leading-8 text-mocha/75 sm:text-lg">
            Custom designs, fresh ingredients, and prompt delivery for every occasion.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/menu" className="btn-primary">
            Order Now
          </Link>
          <Link href="/customize-cake" className="btn-secondary">
            Customize Cake
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-3">
          {[
            { label: "Orders Delivered", value: "2.5K+" },
            { label: "Custom Cakes", value: "400+" },
            { label: "Google Rating", value: "4.9" }
          ].map((stat) => (
            <div key={stat.label} className="glass-panel p-4 text-center">
              <p className="font-heading text-2xl text-cocoa">{stat.value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.24em] text-mocha/55">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="relative"
      >
        <div className="relative overflow-hidden rounded-[34px] bg-white p-3 shadow-float">
          <div className="absolute inset-x-6 top-6 z-10 flex items-center justify-between rounded-full bg-white/80 px-4 py-3 backdrop-blur">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-caramel">Today&apos;s pick</p>
              <p className="font-semibold text-cocoa">Signature Truffle Cake</p>
            </div>
            <span className="rounded-full bg-cocoa px-3 py-1 text-xs font-semibold text-cream">Hot</span>
          </div>
          <div className="relative h-[420px] overflow-hidden rounded-[28px]">
            <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-tr from-pink-50 via-white to-amber-50" />
              <Image
                src={logoSrc}
                alt="Ram Ji Bakery"
                fill
                className="object-contain relative"
                priority
                onError={() => setLogoSrc("/cake-placeholder.png")}
              />
            </div>
          </div>
          <div className="mt-4 text-center px-4">
            <p className="text-lg font-semibold">Crafting Sweet Moments, One Cake at a Time 🎂</p>
            <p className="mt-2 text-sm text-mocha/75">Freshly baked with love, designed to make every celebration unforgettable.</p>
          </div>
        </div>
        <div className="absolute -bottom-6 -left-5 glass-panel max-w-xs p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-caramel">Fast local delivery</p>
          <p className="mt-2 text-sm leading-6 text-mocha/75">
            Same-day slots available across Dinara for cakes, pastries and party combos.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
