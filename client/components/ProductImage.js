import Image from "next/image";
import { useState } from "react";

// Lightweight product image wrapper that prefers `fill` mode. IMPORTANT:
// When `fill` is used, the caller MUST provide a parent with `position: relative`
// and an intrinsic size (e.g. a Tailwind `aspect-[]` class). Do NOT wrap the
// image again with another intrinsic aspect box as that causes layout jumps.
export default function ProductImage({ src, alt, fill, width, height, className, priority, style, ...rest }) {
  const [fallback, setFallback] = useState(null);

  const normalize = (s) => {
    if (!s) return null;
    const str = String(s).trim();
    if (!str) return null;
    if (str.startsWith("//")) return "https:" + str;
    if (str.startsWith("http:")) return str.replace(/^http:/, "https:");
    return str;
  };

  const isPlaceholderUrl = (s) => {
    if (!s) return true;
    const L = s.toLowerCase();
    return L.includes("placeholder") || L.includes("via.placeholder") || L.includes("placehold.it");
  };

  const resolved = normalize(src);
  const imageSrc = fallback || (resolved && !isPlaceholderUrl(resolved) ? resolved : "/images/cake1.jpg");

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("ProductImage -> using:", imageSrc, "original:", src);
  }

  const handleError = () => setFallback("/images/cake1.jpg");

  if (fill) {
    // Expect parent to be position:relative and sized via CSS (aspect-ratio)
    return (
      <Image
        src={imageSrc}
        alt={alt || "product"}
        fill
        className={className || "object-contain"}
        priority={priority}
        style={style}
        onError={handleError}
        {...rest}
      />
    );
  }

  // Non-fill fallback: render with an intrinsic aspect ratio (1:1) unless
  // explicit width/height were provided.
  const w = width || 400;
  const h = height || 400;

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: `${w}/${h}`, ...style }}>
      <Image
        src={imageSrc}
        alt={alt || "product"}
        width={w}
        height={h}
        className={className || "object-contain"}
        priority={priority}
        onError={handleError}
        {...rest}
      />
    </div>
  );
}
