export const productCategories = [
  "cake",
  "pastry",
  "party",
  "balloons",
  "ribbons",
  "candles",
  "hats",
  "banners"
];

export const categories = ["All", ...productCategories];

export const categoryLabels = {
  cake: "Cake",
  cakes: "Cake",
  pastry: "Pastry",
  pastries: "Pastry",
  bread: "Pastry",
  breads: "Pastry",
  party: "Party",
  birthday: "Party",
  "birthday item": "Party",
  "birthday items": "Party",
  balloons: "Balloons",
  balloon: "Balloons",
  ribbons: "Ribbons",
  ribbon: "Ribbons",
  candles: "Candles",
  candle: "Candles",
  hats: "Party Hats",
  hat: "Party Hats",
  banners: "Banners",
  banner: "Banners"
};

export const normalizeCategory = (category = "") => {
  const value = String(category).trim().toLowerCase();

  if (["cake", "cakes"].includes(value)) return "cake";
  if (["pastry", "pastries", "bread", "breads"].includes(value)) return "pastry";
  if (["party", "birthday", "birthday item", "birthday items"].includes(value)) return "party";
  if (["balloon", "balloons"].includes(value)) return "balloons";
  if (["ribbon", "ribbons"].includes(value)) return "ribbons";
  if (["candle", "candles"].includes(value)) return "candles";
  if (["hat", "hats"].includes(value)) return "hats";
  if (["banner", "banners"].includes(value)) return "banners";

  return value;
};

export const getImageUrl = (image = "") => {
  const value = String(image || "").trim();

  if (!value) {
    return "";
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/uploads/")) {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.VITE_API_URL ||
      "https://ram-ji-bakery23.onrender.com/api";
    const backendBase = apiBase.replace(/\/api\/?$/, "");
    return `${backendBase}${value}`;
  }

  return value;
};

export const isInlineImage = (image = "") => String(image || "").trim().startsWith("data:image/");

export const normalizeProduct = (product = {}) => {
  const image = getImageUrl(product.image || "");
  const images = Array.isArray(product.images)
    ? product.images.map((entry) => getImageUrl(entry)).filter(Boolean).slice(0, 4)
    : [];
  const colors = Array.isArray(product.colors)
    ? product.colors
        .map((entry) => ({
          name: String(entry?.name || "").trim(),
          image: getImageUrl(entry?.image || "")
        }))
        .filter((entry) => entry.name && entry.image)
    : [];

  const discountPercent = Number(product.discountPercent || 0);
  const normalizedDiscount = Number.isFinite(discountPercent) ? Math.min(Math.max(discountPercent, 0), 90) : 0;
  const basePrice = Number(product.price || 0);
  const finalPrice =
    normalizedDiscount > 0 ? Number((basePrice - (basePrice * normalizedDiscount) / 100).toFixed(2)) : basePrice;

  return {
    ...product,
    category: normalizeCategory(product.category),
    image: images[0] || image,
    images: (images.length ? images : [image]).filter(Boolean).slice(0, 4),
    colors,
    discountPercent: normalizedDiscount,
    finalPrice,
    originalPrice: basePrice
  };
};

export const products = [
  {
    _id: "cake-1",
    name: "Signature Truffle Cake",
    category: "cake",
    price: 699,
    image:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80",
    badge: "Best Seller",
    rating: 4.9,
    description: "Deep chocolate sponge layered with glossy ganache and roasted almond crunch.",
    flavors: ["Chocolate", "Hazelnut", "Belgian Cocoa"]
  },
  {
    _id: "cake-2",
    name: "Royal Butterscotch Bliss",
    category: "cake",
    price: 749,
    image:
      "https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?auto=format&fit=crop&w=1200&q=80",
    badge: "Party Favorite",
    rating: 4.8,
    description: "Caramel sponge, praline crunch, whipped cream swirls and butterscotch drizzle.",
    flavors: ["Butterscotch", "Vanilla", "Caramel"]
  },
  {
    _id: "pastry-1",
    name: "Berry Velvet Pastry",
    category: "pastry",
    price: 149,
    image:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80",
    badge: "New",
    rating: 4.7,
    description: "Cloud-soft sponge with strawberry compote and vanilla chantilly."
  },
  {
    _id: "bread-1",
    name: "Golden Milk Bread",
    category: "pastry",
    price: 119,
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
    badge: "Fresh Daily",
    rating: 4.6,
    description: "Pillowy rich loaf, perfect for breakfast toast and evening chai."
  },
  {
    _id: "birthday-1",
    name: "Birthday Decor Hamper",
    category: "party",
    price: 499,
    image:
      "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511795409834-432f7d0f6c1b?auto=format&fit=crop&w=1200&q=80"
    ],
    colors: [
      {
        name: "Rose Gold",
        image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80"
      },
      {
        name: "Pastel",
        image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80"
      },
      {
        name: "Classic Gold",
        image: "https://images.unsplash.com/photo-1511795409834-432f7d0f6c1b?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    badge: "Combo",
    rating: 4.5,
    description: "Balloons, candles, topper, banner and table accents in one celebration kit."
  },
  {
    _id: "cake-3",
    name: "Mango Celebration Cake",
    category: "cake",
    price: 799,
    image:
      "https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&w=1200&q=80",
    badge: "Seasonal",
    rating: 4.9,
    description: "Tropical mango mousse, sponge layers and glazed fruit finish."
  },
  {
    _id: "party-2",
    name: "Celebration Candle Box",
    category: "party",
    price: 199,
    image:
      "https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1464349572102-5d6d6b6d12aa?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80"
    ],
    colors: [
      {
        name: "Rainbow",
        image: "https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&w=1200&q=80"
      },
      {
        name: "Metallic",
        image: "https://images.unsplash.com/photo-1464349572102-5d6d6b6d12aa?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    badge: "Party Pick",
    rating: 4.6,
    description: "Colorful candles and sparkle toppers for birthdays, anniversaries and quick party setups."
  }
].map(normalizeProduct);

export const testimonials = [
  {
    name: "Priya Sharma",
    quote: "Ramji Bakery made my daughter's birthday feel luxurious. The cake looked gorgeous and tasted even better.",
    role: "Birthday Order"
  },
  {
    name: "Amit Verma",
    quote: "Fresh bread in the morning and quick delivery in Dinara. This is our family's favorite bakery now.",
    role: "Daily Customer"
  },
  {
    name: "Sana Khan",
    quote: "The customization flow is so easy. I uploaded a reference and got exactly the pastel cake I wanted.",
    role: "Custom Cake Client"
  }
];

export const gallery = [
  "https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1603532648955-039310d9ed75?auto=format&fit=crop&w=900&q=80"
];

export const recommendationProfiles = {
  chocolate: ["cake-1", "pastry-1"],
  fruit: ["cake-3", "pastry-1"],
  party: ["cake-2", "birthday-1"]
};

export const defaultCustomization = {
  flavor: "Chocolate",
  size: "1 Kg",
  cream: "Whipped Cream",
  message: "Happy Celebration",
  imagePreview: ""
};
