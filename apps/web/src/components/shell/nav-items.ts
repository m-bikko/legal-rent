import {
  LayoutGrid,
  Heart,
  Building2,
  CircleUserRound,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { AppUser } from "@/lib/types";

export interface NavItem {
  href: string;
  labelKey: "listings" | "saved" | "myProperties" | "profile" | "admin";
  icon: LucideIcon;
}

export const navItemsFor = (user: AppUser): NavItem[] => [
  { href: "/listings", labelKey: "listings", icon: LayoutGrid },
  { href: "/saved", labelKey: "saved", icon: Heart },
  ...(user.role === "landlord"
    ? [{ href: "/my-properties", labelKey: "myProperties" as const, icon: Building2 }]
    : []),
  ...(user.role === "admin"
    ? [{ href: "/admin", labelKey: "admin" as const, icon: ShieldCheck }]
    : []),
  { href: "/profile", labelKey: "profile", icon: CircleUserRound },
];
