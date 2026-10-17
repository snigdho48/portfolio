import { lazy, Suspense, useCallback, useState } from "react";
import type { ProjectScreenshot } from "@/data/portfolio";
import ShotImg from "./ShotImg";

const ScreenshotLightbox = lazy(() => import("./ScreenshotLightbox"));

type ScreenshotGalleryProps = {
  images: ProjectScreenshot[];
  projectTitle: string;
};

export default function ScreenshotGallery({
  images,
  projectTitle,
}: ScreenshotGalleryProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const openAt = (i: number) => {
    setIndex(i);
    setOpen(true);
  };

  const onClose = useCallback(() => setOpen(false), []);
  const onPrev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);
  const onNext = useCallback(() => {
    setIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  if (!images.length) return null;

  const hasPlaceholders = images.some((img) => img.isPlaceholder);

  return (
    <section className="case-gallery" aria-label={`${projectTitle} screenshots`}>
      <div className="case-gallery__head">
        <h2 className="h3">Screenshots</h2>
        {hasPlaceholders && (
          <span className="placeholder-badge placeholder-badge--inline">
            [PLACEHOLDER gallery — replace assets]
          </span>
        )}
      </div>

      <ul className="case-gallery__grid">
        {images.map((image, i) => (
          <li key={image.src}>
            <button
              type="button"
              className="case-gallery__thumb"
              onClick={() => openAt(i)}
              aria-label={`Open screenshot ${i + 1}: ${image.alt}`}
            >
              <ShotImg src={image.src} alt="" box={16 / 10} framed={image.framed} sizes="(max-width: 900px) 50vw, 320px" />
              {image.isPlaceholder && (
                <span className="placeholder-badge">[PLACEHOLDER]</span>
              )}
              <span className="case-gallery__zoom" aria-hidden>
                View
              </span>
            </button>
          </li>
        ))}
      </ul>

      {open && (
        <Suspense fallback={null}>
          <ScreenshotLightbox
            images={images}
            index={index}
            open={open}
            onClose={onClose}
            onPrev={onPrev}
            onNext={onNext}
          />
        </Suspense>
      )}
    </section>
  );
}
