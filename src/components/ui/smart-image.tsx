import Image, { type ImageProps } from "next/image";

const OPTIMISABLE = [/^https:\/\/images\.unsplash\.com\//, /^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\//, /^https:\/\/i\.ytimg\.com\//];

/** next/image for known hosts; unoptimised passthrough for SVGs and other URLs admins may paste. */
export function SmartImage({ src, alt, ...rest }: Omit<ImageProps, "src"> & { src: string }) {
  const isSvg = /\.svg(\?|$)/i.test(src);
  const isLocal = src.startsWith("/") && !src.startsWith("//");
  const optimisable = !isSvg && (isLocal || OPTIMISABLE.some((r) => r.test(src)));
  return <Image src={src} alt={alt} unoptimized={!optimisable} {...rest} />;
}
