import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import api from "../utils/api";

export default function HeroSection() {
  const [logoSrc, setLogoSrc] = useState("/logo.svg");
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    api
      .get("/banner")
      .then(({ data }) => {
        if (data && data.image) setBanner(data);
      })
      .catch(() => {
        // Silently fall back to default image
      });
  }, []);

  return (
     <section className="section-shell py-8 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="space-y-5"
      >
        <span className="inline-flex rounded-full border border-caramel/30 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-caramel">
          Dinara&apos;s premium bakery experience
        </span>
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-800 leading-tight">Celebrate with Exquisite Cakes</h1>
          <p className="max-w-xl text-sm sm:text-base leading-7 sm:leading-8 text-mocha/75">
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
        <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-3">
          {[
            { label: "Orders Delivered", value: "2.5K+" },
            { label: "Custom Cakes", value: "400+" },
            { label: "Google Rating", value: "4.9" }
          ].map((stat) => (
            <div key={stat.label} className="glass-panel p-3 sm:p-4 text-center">
              <p className="font-heading text-xl sm:text-2xl text-cocoa">{stat.value}</p>
              <p className="mt-1 text-[10px] sm:text-xs uppercase tracking-[0.18em] sm:tracking-[0.24em] text-mocha/55">{stat.label}</p>
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
          <div className="relative h-[280px] sm:h-[360px] lg:h-[420px] overflow-hidden rounded-[28px]">
            <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-lg">
              {banner ? (
                <Image
                  src={banner.image}
                  alt={banner.title || "Homepage Banner"}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-tr from-pink-50 via-white to-amber-50" />
                  <Image
                    src={logoSrc}
                    alt="Ram Ji Bakery"
                    fill
                    className="object-contain relative"
                    priority
                    onError={() => setLogoSrc("/images/cake1.jpg")}
                  />
                </>
              )}
            </div>
          </div>
          <div className="mt-4 text-center px-4">
            <p className="text-lg font-semibold">Crafting Sweet Moments, One Cake at a Time 🎂</p>
            <p className="mt-2 text-sm text-mocha/75">Freshly baked with love, designed to make every celebration unforgettable.</p>
          </div>
        </div>
        <div className="absolute -bottom-6 -left-5 glass-panel max-w-xs p-4 hidden sm:block">
          <p className="text-xs uppercase tracking-[0.24em] text-caramel">Fast local delivery</p>
          <p className="mt-2 text-sm leading-6 text-mocha/75">
            Same-day slots available across Dinara for cakes, pastries and party combos.
          </p>
        </div>
      </motion.div>
      </div>
    </section>
  );
}
