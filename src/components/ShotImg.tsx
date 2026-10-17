import { useState, type SyntheticEvent } from "react";

type Props = {
  src: string;
  alt: string;
  /** Aspect of the surrounding box (w/h) - used to decide between cover and contain. */
  box: number;
  eager?: boolean;
  sizes?: string;
  /** Capture already carries its own device frame: contain-fit only, never add a bezel. */
  framed?: boolean;
};

/**
 * Shows a project capture in full: phone-shaped images inside a phone bezel,
 * near-matching desktop captures covering the box, anything else contain-fit
 * (letterboxed on a dark glass backdrop). Never stretched, never cropped hard.
 */
export default function ShotImg({ src, alt, box, eager, sizes, framed }: Props) {
  const [ar, setAr] = useState<number | null>(null);
  const onLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const im = e.currentTarget;
    if (im.naturalWidth && im.naturalHeight) setAr(im.naturalWidth / im.naturalHeight);
  };
  const phone = ar !== null && ar < 0.8 && !framed;
  const fit = ar !== null && !phone && Math.abs(ar / box - 1) <= 0.04 && !framed ? "cover" : "contain";
  return (
    <span
      className="shot"
      data-shape={phone ? "phone" : "wide"}
      data-fit={fit}
      style={{ ["--shot-ar" as string]: ar ?? 1.6 }}
    >
      {(phone || fit === "contain") && <span className="shot__bg" style={{ backgroundImage: `url(${src})` }} aria-hidden />}
      <img
        src={src}
        alt={alt}
        decoding="async"
        loading={eager ? "eager" : "lazy"}
        {...(eager ? { fetchPriority: "high" as const } : {})}
        sizes={sizes}
        onLoad={onLoad}
        ref={(el) => {
          if (el?.complete && el.naturalWidth && ar === null) setAr(el.naturalWidth / el.naturalHeight);
        }}
      />
    </span>
  );
}