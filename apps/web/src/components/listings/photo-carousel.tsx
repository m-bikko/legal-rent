"use client";

import { useState } from "react";
import { Carousel, Image } from "antd";
import { ImageOff } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  photos: string[];
  alt: string;
  heightClass?: string;
  /** Стрелки навигации по слайдам. */
  arrows?: boolean;
  /** Автопрокрутка каждые 3 сек; останавливается навсегда после касания пользователем. */
  autoplay?: boolean;
  /** Полноэкранный просмотр фото по клику. */
  preview?: boolean;
};

/** Карусель фото; заглушка, если фото нет. */
export const PhotoCarousel = ({
  photos,
  alt,
  heightClass = "h-52",
  arrows = false,
  autoplay = false,
  preview = false,
}: Props) => {
  const t = useTranslations("property");
  // Любое взаимодействие (тап, свайп, стрелка) выключает автопрокрутку
  const [touched, setTouched] = useState(false);

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

  const renderPhoto = (src: string) =>
    preview ? (
      <Image
        key={src}
        src={src}
        alt={alt}
        width="100%"
        className={`${heightClass} w-full object-cover`}
        rootClassName="!block"
      />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img key={src} src={src} alt={alt} className={`${heightClass} w-full object-cover`} />
    );

  const single = photos.length === 1;

  const body = single ? (
    renderPhoto(photos[0]!)
  ) : (
    <div onPointerDown={() => setTouched(true)}>
      <Carousel
        dots
        swipeToSlide
        draggable
        arrows={arrows}
        autoplay={autoplay && !touched}
        autoplaySpeed={3000}
      >
        {photos.map(renderPhoto)}
      </Carousel>
    </div>
  );

  return preview ? <Image.PreviewGroup>{body}</Image.PreviewGroup> : body;
};
