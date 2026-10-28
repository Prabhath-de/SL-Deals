import {
  Bike,
  CreditCard,
  Globe,
  GraduationCap,
  Plane,
  Shirt,
  ShoppingCart,
  Smartphone,
  Sofa,
  Sparkles,
  Tag,
  UtensilsCrossed,
  Wifi,
  type LucideProps,
} from "lucide-react";
import { categoryBySlug } from "@/lib/constants";

const ICONS = {
  Bike,
  CreditCard,
  Globe,
  GraduationCap,
  Plane,
  Shirt,
  ShoppingCart,
  Smartphone,
  Sofa,
  Sparkles,
  UtensilsCrossed,
  Wifi,
};

export default function CategoryIcon({ slug, ...props }: { slug: string } & LucideProps) {
  const name = categoryBySlug(slug)?.icon as keyof typeof ICONS | undefined;
  const Icon = (name && ICONS[name]) || Tag;
  return <Icon {...props} />;
}

export function categoryName(slug: string) {
  return categoryBySlug(slug)?.name ?? slug;
}
