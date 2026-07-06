import { LayoutGrid, Heart, Building2, CircleUserRound, type LucideIcon } from "lucide-react";
import type { AppUser } from "@/lib/types";

export interface NavItem {
  href: string;
  labelKey: "listings" | "saved" | "myProperties" | "profile";
  icon: LucideIcon;
}

export const navItemsFor = (user: AppUser): NavItem[] => [
  { href: "/listings", labelKey: "listings", icon: LayoutGrid },
  { href: "/saved", labelKey: "saved", icon: Heart },
  ...(user.role === "landlord"
    ? [{ href: "/my-properties", labelKey: "myProperties" as const, icon: Building2 }]
    : []),
  { href: "/profile", labelKey: "profile", icon: CircleUserRound },
];
