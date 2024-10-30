"use client";

import { ComponentProps, useEffect, useState } from "react";
import NextImage from "next/image";
import { cn } from "@/lib/utils";
import { OmitStrict } from "@/utils/types";

type ImageProps = OmitStrict<ComponentProps<typeof NextImage>, "placeholder">;

export const Image = ({
  alt,
  blurDataURL,
  className,
  ...props
}: ImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldAnimate(true);
    }, 1000);

    return () => clearTimeout(timer);
  });

  return (
    <div
      className={cn(
        "bg-cover bg-center bg-no-repeat text-transparent",
        className,
      )}
      style={{
        backgroundImage: blurDataURL ? `url('${blurDataURL}')` : undefined,
      }}
    >
      <NextImage
        {...props}
        className={cn(
          {
            ["opacity-0"]: shouldAnimate && !isLoaded && blurDataURL,
            ["opacity-100"]: shouldAnimate && (isLoaded || !blurDataURL),
            ["transition-opacity"]: shouldAnimate,
          },
          className,
        )}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        placeholder={blurDataURL ? "blur" : undefined}
        blurDataURL={blurDataURL}
      />
    </div>
  );
};
