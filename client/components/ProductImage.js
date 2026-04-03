import Image from "next/image";

export default function ProductImage({ src, alt, fill, width, height, className, priority, style, ...rest }) {
  const imageSrc = src || "/placeholder.svg";

  // If using `fill`, parent must be position:relative and have an intrinsic size.
  if (fill) {
    return (
      <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", ...style }}>
        <Image src={imageSrc} alt={alt || "product"} fill className={className || "object-contain"} priority={priority} {...rest} />
      </div>
    );
  }

  // Fallback: fixed width/height image
  const w = width || 400;
  const h = height || 200;

  return (
    <div style={{ position: "relative", width: "100%", height: h }}>
      <Image src={imageSrc} alt={alt || "product"} width={w} height={h} className={className || "object-contain"} priority={priority} {...rest} />
    </div>
  );
}
