"use client";

import { Heart } from "lucide-react";
import type { MouseEvent } from "react";
import { useToggleFavorite } from "@/lib/queries";

type Props = { propertyId: string; isLiked: boolean; className?: string };

export const LikeButton = ({ propertyId, isLiked, className }: Props) => {
  const toggle = useToggleFavorite();

  const onClick = (e: MouseEvent) => {
    // не даём клику провалиться в ссылку-карточку
    e.preventDefault();
    e.stopPropagation();
    toggle.mutate(propertyId);
  };

  return (
    <button
      type="button"
      aria-label="like"
      aria-pressed={isLiked}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-transform active:scale-90 ${className ?? ""}`}
    >
      <Heart
        size={20}
        className={isLiked ? "fill-red-500 text-red-500" : "text-gray-600"}
      />
    </button>
  );
};
