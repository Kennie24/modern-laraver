export type NavTopLink = {
  label: string;
  href: string;
  icon: "home" | "info" | "mail";
};

export type NavQuickLink = {
  label: string;
  href: string;
};

export type NavbarData = {
  logoUrl: string;
  logoAlt: string;
  siteTitle: string;
  faviconUrl: string;
  searchPlaceholder: string;
  showMarquee: boolean;
  marqueeText: string;
  topLinks: NavTopLink[];
  quickLinks: NavQuickLink[];
};

export type HeroSlide = {
  id: string;
  image: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

export type HeroSideCard = {
  id: string;
  eyebrow: string;
  title: string;
  image: string;
  href: string;
};

export type HeroData = {
  slides: HeroSlide[];
  sideCards: HeroSideCard[];
};

export type TrustItem = {
  icon: "wallet" | "package" | "truck";
  title: string;
  subtitle: string;
};

export type TrustBarData = {
  items: TrustItem[];
};

export type CategoryTile = {
  label: string;
  image: string;
  href: string;
};

export type CategoryCard = {
  title: string;
  tiles: CategoryTile[];
  cta: { label: string; href: string };
};

export type CategoryTilesData = {
  cards: CategoryCard[];
};

export type LatestProduct = {
  id: string;
  name: string;
  shortDesc: string;
  image: string;
  price: number;
  oldPrice?: number;
  discountPercent?: number;
  rating?: number;
  href: string;
};

export type LatestProductsData = {
  title: string;
  ctaLabel: string;
  ctaHref: string;
  products: LatestProduct[];
};

export type RelatedProduct = {
  id: string;
  title: string;
  image: string;
  href: string;
  rating: number;
  reviews?: string;
  price: string;
  oldPrice?: string;
  tag?: string;
};

export type RelatedProductsData = {
  title: string;
  sponsoredLabel: string;
  pageLabel: string;
  products: RelatedProduct[];
};

export type ProductGalleryItem = {
  id: number;
  image: string;
  alt: string;
  isVideo?: boolean;
};

export type ProductSize = {
  label: string;
  price: string;
  oldPrice?: string;
};

export type ProductSpec = {
  label: string;
  value: string;
};

export type ProductDetailsData = {
  title: string;
  storeLabel: string;
  rating: number;
  ratingsLabel: string;
  bestsellerLabel: string;
  bestsellerCategory: string;
  boughtLabel: string;
  priceMajor: string;
  priceMinor: string;
  shippingLabel: string;
  inStockLabel: string;
  deliveryLabel: string;
  aboutTitle: string;
  aboutItems: string[];
  gallery: ProductGalleryItem[];
  sizes: ProductSize[];
  specs: ProductSpec[];
};

export type Category = {
  id: string;
  title: string;
  rootCategory?: string;
  order: number;
  commission: string;
  isFeatured: boolean;
  isActive: boolean;
  thumbnail: string;
  banner: string;
  icon: string;
  slug: string;
};

export type Brand = {
  id: string;
  title: string;
  slug: string;
  logo: string;
  banner?: string;
  metaTitle?: string;
  metaDescription?: string;
  isActive: boolean;
  isFeatured?: boolean;
};

export type PaymentGateway = {
  id: string;
  name: string;
  description: string;
  logo: string;
  enabled: boolean;
};

export type PickupLocation = {
  id: string;
  title: string;
  contactName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  country: string;
  state: string;
  city: string;
  postalCode?: string;
  isActive: boolean;
};

export type Offer = {
  id: string;
  title: string;
  code: string;
  headline: string;
  description: string;
  discountType: "percentage" | "fixed" | "free_shipping";
  discountValue: number;
  startDate: string;
  endDate: string;
  targetType: "storewide" | "category" | "product" | "pickup" | "banner";
  targetValue: string;
  targetImage: string;
  targetTitle: string;
  badgeText: string;
  bannerImage: string;
  isActive: boolean;
  isFeatured: boolean;
  stackable: boolean;
};

export type FrontendData = {
  navbar: NavbarData;
  hero: HeroData;
  trustBar: TrustBarData;
  categoryTiles: CategoryTilesData;
  latestProducts: LatestProductsData;
  relatedProducts: RelatedProductsData;
  productDetails: ProductDetailsData;
  brands: Brand[];
  categories: Category[];
  gateways: PaymentGateway[];
  pickupLocations: PickupLocation[];
  offers: Offer[];
};

export const defaultFrontendData: FrontendData = {
  navbar: {
    logoUrl: "",
    logoAlt: "",
    siteTitle: "Modern Electronics",
    faviconUrl: "/favicon.ico",
    searchPlaceholder: "Search here...",
    showMarquee: true,
    marqueeText:
      "HOT SALE 🔥 | MODERN ELECTRONICS LTD Trusted Electronics Experts Since 1998! Get quality electronics, appliances, accessories, and reliable tech solutions from Modern Electronics Ltd. Affordable Prices • Genuine Products • Trusted Service • Visit us today and upgrade your lifestyle with modern technology.",
    topLinks: [
      { label: "Home", href: "/", icon: "home" },
      { label: "About Us", href: "/about", icon: "info" },
      { label: "Contact", href: "/contact", icon: "mail" },
    ],
    quickLinks: [
      { label: "TV Parts", href: "/category/spare-parts" },
      { label: "Home Appliances", href: "/category/home-appliances" },
      { label: "Accessories", href: "/category/accessories" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  hero: {
    slides: [],
    sideCards: [],
  },
  trustBar: {
    items: [
      { icon: "wallet", title: "Secure Shopping", subtitle: "100% Safe & Secure" },
      { icon: "package", title: "Easy Support", subtitle: "Whatsapp & Call" },
      { icon: "truck", title: "Fast Delivery", subtitle: "Fast delivery around Kampala" },
    ],
  },
  categoryTiles: {
    cards: [
      {
        // Mockup tiles removed — this card is populated at runtime from the
        // live Spare Parts category (see CategoryTilesSection + getSparePartsCategoryFeature).
        title: "Spare parts and Components",
        tiles: [],
        cta: { label: "Shop TV parts", href: "/category/spare-parts" },
      },
      {
        // Mockup tiles removed — populated from live data at runtime.
        title: "Repair tools & workshop essentials",
        tiles: [],
        cta: { label: "Explore repair tools", href: "/category/spare-parts" },
      },
      {
        // Mockup tiles removed — populated from live data at runtime.
        title: "Home Appliance",
        tiles: [],
        cta: { label: "Shop appliances", href: "/appliances" },
      },
      {
        // Mockup tiles removed — populated from live data at runtime.
        title: "Popular accessories for installers",
        tiles: [],
        cta: { label: "Explore accessories", href: "/category/accessories" },
      },
    ],
  },
  latestProducts: {
    title: "Latest",
    ctaLabel: "View all",
    ctaHref: "/category/all",
    products: [],
  },
  relatedProducts: {
    title: "Products related to this item",
    sponsoredLabel: "Sponsored",
    pageLabel: "",
    products: [],
  },
  productDetails: {
    // Empty defaults — product data is sourced live from the backend via
    // getPublicProductBySlug (see app/product/[slug]/page.tsx). This shape is
    // kept only to satisfy the FrontendData type.
    title: "",
    storeLabel: "",
    rating: 0,
    ratingsLabel: "",
    bestsellerLabel: "",
    bestsellerCategory: "",
    boughtLabel: "",
    priceMajor: "",
    priceMinor: "",
    shippingLabel: "",
    inStockLabel: "",
    deliveryLabel: "",
    aboutTitle: "About this item",
    aboutItems: [],
    gallery: [],
    sizes: [],
    specs: [],
  },
  brands: [],
  categories: [],
  // Empty by default — populated from the dashboard via /api/frontend-data.
  gateways: [],
  pickupLocations: [
    {
      id: "pickup-bombo-road",
      title: "Bombo Road",
      contactName: "Bombo Road Desk",
      phone: "+256700000001",
      email: "bombo@modern-electronics.com",
      addressLine1: "Bombo Road",
      addressLine2: "",
      country: "Uganda",
      state: "Central Region",
      city: "Kampala",
      postalCode: "256",
      isActive: true,
    },
    {
      id: "pickup-kampala-road",
      title: "Kampala Road",
      contactName: "Kampala Road Desk",
      phone: "+256700000002",
      email: "kampalaroad@modern-electronics.com",
      addressLine1: "Kampala Road",
      addressLine2: "",
      country: "Uganda",
      state: "Central Region",
      city: "Kampala",
      postalCode: "256",
      isActive: true,
    },
    {
      id: "pickup-lugogo-bypass",
      title: "Lugogo By pass",
      contactName: "Lugogo By pass Desk",
      phone: "+256700000003",
      email: "lugogo@modern-electronics.com",
      addressLine1: "Lugogo By pass",
      addressLine2: "",
      country: "Uganda",
      state: "Central Region",
      city: "Kampala",
      postalCode: "256",
      isActive: true,
    },
  ],
  offers: [],
};
