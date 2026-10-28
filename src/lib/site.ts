// Site-wide settings. Change these in one place.
export const SITE = {
  name: "DealFinder LK",
  tagline: "Every offer in Sri Lanka, in one place",
  description:
    "Find today's offers, bank card promotions and discounts from shops, restaurants, hotels and online stores across Sri Lanka.",
  url: import.meta.env.VITE_SITE_URL || "https://sri-lanka-deals.vercel.app",
  // Shown on the Contact page and footer. Set VITE_CONTACT_EMAIL in Vercel.
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || "",
  facebook: import.meta.env.VITE_FACEBOOK_URL || "",
  whatsappChannel: import.meta.env.VITE_WHATSAPP_CHANNEL_URL || "",
};
