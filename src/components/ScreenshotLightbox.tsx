import { useEffect, useId, useRef } from "react";
import type { ProjectScreenshot } from "@/data/portfolio";

type ScreenshotLightboxProps = {
  images: ProjectScreenshot[];
  index: number;
  open: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function ScreenshotLightbox({
  images,
  index,
  open,
  onClose,
  onPrev,
  onNext,
}: ScreenshotLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const image = images[index];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, onPrev, onNext]);

  if (!image) return null;

  return (
    <dialog
      ref={dialogRef}
      className="lightbox"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="lightbox__panel" role="document">
        <div className="lightbox__toolbar">
          <p id={titleId} className="lightbox__caption">
            {image.isPlaceholder && (
              <span className="placeholder-badge placeholder-badge--inline">
                [PLACEHOLDER]
              </span>
            )}{" "}
            {index + 1} / {images.length}
          </p>
          <button
            type="button"
            className="lightbox__close"
            onClick={onClose}
            aria-label="Close gallery"
          >
            ×
          </button>
        </div>

        <div className="lightbox__stage">
          <button
            type="button"
            className="lightbox__nav lightbox__nav--prev"
            onClick={onPrev}
            aria-label="Previous screenshot"
            disabled={images.length < 2}
          >
            {"<-"}
          </button>
          <img
            src={image.src}
            alt={image.alt}
            width={1280}
            height={568}
            decoding="async"
            sizes="100vw"
          />
          <button
            type="button"
            className="lightbox__nav lightbox__nav--next"
            onClick={onNext}
            aria-label="Next screenshot"
            disabled={images.length < 2}
          >
            {"->"}
          </button>
        </div>

        <p className="lightbox__alt">{image.alt}</p>
      </div>
    </dialog>
  );
}
