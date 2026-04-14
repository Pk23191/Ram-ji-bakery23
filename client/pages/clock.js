import { useEffect, useState } from "react";
import Seo from "../components/Seo";

// Time zones to display
const TIME_ZONES = [
  { city: "India", region: "New Delhi", tz: "Asia/Kolkata", abbr: "IST" },
  { city: "USA Eastern", region: "New York", tz: "America/New_York", abbr: "ET" },
  { city: "USA Pacific", region: "Los Angeles", tz: "America/Los_Angeles", abbr: "PT" },
  { city: "United Kingdom", region: "London", tz: "Europe/London", abbr: "GMT/BST" },
  { city: "Japan", region: "Tokyo", tz: "Asia/Tokyo", abbr: "JST" },
  { city: "Dubai", region: "Dubai", tz: "Asia/Dubai", abbr: "GST" },
  { city: "Australia", region: "Sydney", tz: "Australia/Sydney", abbr: "AEST/AEDT" },
  { city: "Germany", region: "Berlin", tz: "Europe/Berlin", abbr: "CET/CEST" },
  { city: "Brazil", region: "São Paulo", tz: "America/Sao_Paulo", abbr: "BRT" },
  { city: "Singapore", region: "Singapore", tz: "Asia/Singapore", abbr: "SGT" },
];

// Format time for a given time zone
function formatTime(date, tz, use24h) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: !use24h,
  }).format(date);
}

// Format date for a given time zone
function formatDate(date, tz) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

// Get the local hour in a time zone to determine day/night
function getLocalHour(date, tz) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    hour12: false,
  }).formatToParts(date);
  const hourPart = parts.find((p) => p.type === "hour");
  return hourPart ? parseInt(hourPart.value, 10) : 12;
}

// Detect the user's local time zone
function getLocalTz() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

export default function ClockPage() {
  const [now, setNow] = useState(null);
  const [use24h, setUse24h] = useState(false);
  const localTz = typeof window !== "undefined" ? getLocalTz() : "UTC";

  // Tick every second
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Render a placeholder until the clock is initialised (avoids SSR mismatch)
  if (!now) {
    return (
      <>
        <Seo title="World Clock" description="Live digital clock showing current time in multiple time zones." path="/clock" />
        <div className="min-h-screen bg-cocoa flex items-center justify-center">
          <p className="text-latte text-lg animate-pulse">Initialising clock…</p>
        </div>
      </>
    );
  }

  const heroTime = formatTime(now, localTz, use24h);
  const heroDate = formatDate(now, localTz);
  const heroHour = getLocalHour(now, localTz);
  const heroIsDay = heroHour >= 6 && heroHour < 20;

  return (
    <>
      <Seo
        title="World Clock"
        description="Live digital clock showing current time in multiple time zones — Ramji Bakery."
        path="/clock"
      />

      <div className="min-h-screen bg-cocoa text-cream">
        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="text-center py-8 px-4 border-b border-mocha/60">
          <p className="text-caramel text-sm tracking-widest uppercase font-body mb-1">Ramji Bakery</p>
          <h1 className="font-heading text-3xl sm:text-4xl text-cream">World Clock</h1>
          <p className="text-latte/70 text-sm mt-1 font-body">Live time across the globe — updated every second</p>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-10 space-y-12">
          {/* ── Hero local clock ───────────────────────────────────── */}
          <section className="rounded-2xl bg-mocha border border-caramel/30 shadow-float p-8 sm:p-12 text-center relative overflow-hidden">
            {/* decorative gradient blob */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(circle at 50% 0%, rgba(191,123,68,0.18) 0%, transparent 70%)" }}
            />

            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl" role="img" aria-label={heroIsDay ? "Sun" : "Moon"}>
                {heroIsDay ? "☀️" : "🌙"}
              </span>
              <span className="text-caramel text-sm font-body tracking-wider uppercase">Your local time</span>
            </div>

            <p className="font-mono text-6xl sm:text-8xl font-bold text-cream tracking-tight leading-none tabular-nums">
              {heroTime}
            </p>

            <p className="text-latte/80 text-base sm:text-lg mt-4 font-body">{heroDate}</p>
            <p className="text-caramel/80 text-xs mt-1 font-body">{localTz}</p>

            {/* 12h / 24h toggle */}
            <div className="mt-6 inline-flex items-center gap-3 bg-cocoa/60 rounded-full px-1 py-1 border border-caramel/20">
              <button
                onClick={() => setUse24h(false)}
                className={`px-4 py-1.5 rounded-full text-sm font-body transition-colors duration-200 ${
                  !use24h ? "bg-caramel text-cocoa font-semibold" : "text-latte/70 hover:text-cream"
                }`}
              >
                12h
              </button>
              <button
                onClick={() => setUse24h(true)}
                className={`px-4 py-1.5 rounded-full text-sm font-body transition-colors duration-200 ${
                  use24h ? "bg-caramel text-cocoa font-semibold" : "text-latte/70 hover:text-cream"
                }`}
              >
                24h
              </button>
            </div>
          </section>

          {/* ── Time zone grid ─────────────────────────────────────── */}
          <section>
            <h2 className="font-heading text-xl text-caramel mb-6 text-center tracking-wide">
              Time Zones Around the World
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {TIME_ZONES.map(({ city, region, tz, abbr }) => {
                const time = formatTime(now, tz, use24h);
                const date = formatDate(now, tz);
                const hour = getLocalHour(now, tz);
                const isDay = hour >= 6 && hour < 20;
                const isLocal = tz === localTz;

                return (
                  <div
                    key={tz}
                    className={`rounded-xl border p-5 flex flex-col gap-3 transition-shadow duration-300 hover:shadow-float ${
                      isLocal
                        ? "border-caramel bg-mocha shadow-float"
                        : "border-mocha/70 bg-mocha/40 hover:border-caramel/40"
                    }`}
                  >
                    {/* Card header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-heading text-base text-cream leading-tight">{city}</p>
                        <p className="text-latte/60 text-xs font-body mt-0.5">{region}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xl" role="img" aria-label={isDay ? "Day" : "Night"}>
                          {isDay ? "☀️" : "🌙"}
                        </span>
                        {isLocal && (
                          <span className="text-caramel text-[10px] font-body tracking-wider uppercase border border-caramel/40 rounded-full px-1.5 py-0.5">
                            Local
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Time */}
                    <p className="font-mono text-3xl font-bold text-cream tabular-nums leading-none">{time}</p>

                    {/* Date & abbreviation */}
                    <div className="mt-auto flex items-end justify-between">
                      <p className="text-latte/70 text-xs font-body leading-snug">{date}</p>
                      <span className="text-caramel/80 text-[11px] font-body tracking-wide">{abbr}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </main>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <footer className="text-center py-6 text-latte/40 text-xs font-body border-t border-mocha/60 mt-8">
          © {now.getFullYear()} Ramji Bakery · Time powered by{" "}
          <code className="font-mono text-caramel/70">Intl.DateTimeFormat</code>
        </footer>
      </div>
    </>
  );
}
