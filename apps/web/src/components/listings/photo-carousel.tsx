"use client";

import { Carousel } from "antd";
import { ImageOff } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = { photos: string[]; alt: string; heightClass?: string };

/** Карусель фото карточки; заглушка, если фото нет. */
export const PhotoCarousel = ({ photos, alt, heightClass = "h-52" }: Props) => {
  const t = useTranslations("property");

  if (photos.length === 0) {
    return (
      <div
        className={`${heightClass} flex w-full flex-col items-center justify-center gap-2 bg-gray-100 text-gray-400`}
      >
        <ImageOff size={28} />
        <span className="text-xs">{t("noPhotos")}</span>
      </div>
    );
  }

  if (photos.length === 1) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photos[0]} alt={alt} className={`${heightClass} w-full object-cover`} />
    );
  }

  return (
    <Carousel dots swipeToSlide draggable>
      {photos.map((src) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} src={src} alt={alt} className={`${heightClass} w-full object-cover`} />
      ))}
    </Carousel>
  );
};
