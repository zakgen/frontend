import Image from "next/image";

import { cn } from "@/lib/utils";

const sources = {
  full: {
    src: "/brand/rasil-logo-full.webp",
    width: 1514,
    height: 1268,
  },
  icon: {
    src: "/brand/rasil-icon.png",
    width: 665,
    height: 665,
  },
} as const;

export function RasilLogo({
  variant = "full",
  className,
  priority = false,
  alt = "Rasil",
}: {
  variant?: keyof typeof sources;
  className?: string;
  priority?: boolean;
  alt?: string;
}) {
  const asset = sources[variant];

  return (
    <Image
      src={asset.src}
      alt={alt}
      width={asset.width}
      height={asset.height}
      priority={priority}
      className={cn("h-auto w-full object-contain", className)}
    />
  );
}
