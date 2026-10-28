export interface Category {
  slug: string;
  name: string;
  /** lucide-react icon name, mapped in components/CategoryIcon.tsx */
  icon: string;
  blurb: string;
}

export const CATEGORIES: Category[] = [
  { slug: "bank-cards", name: "Bank & Card Offers", icon: "CreditCard", blurb: "Credit and debit card discounts" },
  { slug: "supermarkets", name: "Supermarkets", icon: "ShoppingCart", blurb: "Groceries and weekly promos" },
  { slug: "restaurants", name: "Restaurants & Dining", icon: "UtensilsCrossed", blurb: "Buffets, set menus and dine-in" },
  { slug: "food-delivery", name: "Food Delivery", icon: "Bike", blurb: "PickMe Food, Uber Eats and more" },
  { slug: "fashion", name: "Fashion & Clothing", icon: "Shirt", blurb: "Clothing, shoes and accessories" },
  { slug: "electronics", name: "Electronics & Mobile", icon: "Smartphone", blurb: "Phones, laptops and appliances" },
  { slug: "online-shopping", name: "Online Shopping", icon: "Globe", blurb: "Daraz, Kapruka and online stores" },
  { slug: "hotels-travel", name: "Hotels & Travel", icon: "Plane", blurb: "Stays, flights and holiday packages" },
  { slug: "telco-data", name: "Mobile & Data", icon: "Wifi", blurb: "Dialog, Mobitel, Hutch and Airtel packs" },
  { slug: "health-beauty", name: "Health & Beauty", icon: "Sparkles", blurb: "Pharmacy, salon and spa" },
  { slug: "home-living", name: "Home & Living", icon: "Sofa", blurb: "Furniture, hardware and decor" },
  { slug: "education", name: "Education & Courses", icon: "GraduationCap", blurb: "Courses, books and classes" },
];

export const categoryBySlug = (slug?: string | null) => CATEGORIES.find((c) => c.slug === slug);


export const CITIES = [
  "Islandwide",
  "Online",
  "Colombo",
  "Gampaha",
  "Negombo",
  "Kandy",
  "Galle",
  "Matara",
  "Kurunegala",
  "Jaffna",
  "Anuradhapura",
  "Batticaloa",
  "Trincomalee",
  "Ratnapura",
  "Badulla",
  "Nuwara Eliya",
];

export const BANKS = [
  "Amana Bank",
  "Bank of Ceylon",
  "Cargills Bank",
  "Commercial Bank",
  "DFCC Bank",
  "HNB",
  "HSBC",
  "NDB",
  "Nations Trust Bank",
  "Pan Asia Bank",
  "People's Bank",
  "Sampath Bank",
  "Seylan Bank",
  "Standard Chartered",
  "Union Bank",
];

export type SortKey = "newest" | "ending" | "discount" | "popular";

export const SORTS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "ending", label: "Ending soon" },
  { value: "discount", label: "Biggest discount" },
  { value: "popular", label: "Most viewed" },
];

export const REPORT_REASONS = [
  { value: "expired", label: "The offer has ended" },
  { value: "wrong_info", label: "Details are wrong" },
  { value: "spam", label: "Spam or fake offer" },
  { value: "other", label: "Something else" },
] as const;

export const PAGE_SIZE = 24;
