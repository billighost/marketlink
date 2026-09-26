import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
} from 'lucide-react';
import styles from './ImageZoomModal.module.css';

/**
 * ImageZoomModal
 * Luxury image viewer with interactive zoom (+ / - / wheel / double-click / pinch),
 * smooth click-and-drag panning, gallery pagination, and keyboard controls.
 */
export function ImageZoomModal({
  isOpen,
  onClose,
  images = [],
  initialIndex = 0,
}) {
  // Normalize images to array of { src, alt, caption }
  const normalizedImages = React.useMemo(() => {
    if (!images) return [];
    const list = Array.isArray(images) ? images : [images];
    return list
      .map((item) => {
        if (!item) return null;
        if (typeof item === 'string') {
          return { src: item, alt: 'Image preview', caption: '' };
        }
        return {
          src: item.src || item.url || '',
          alt: item.alt || 'Image preview',
          caption: item.caption || item.title || '',
        };
      })
      .filter((img) => img && Boolean(img.src));
  }, [images]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Sync initial index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, normalizedImages.length - 1)));
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex, normalizedImages.length]);

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(3.5, +(prev + 0.5).toFixed(1)));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const next = Math.max(1, +(prev - 0.5).toFixed(1));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handlePrev = useCallback(() => {
    if (normalizedImages.length <= 1) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : normalizedImages.length - 1));
    resetZoom();
  }, [normalizedImages.length, resetZoom]);

  const handleNext = useCallback(() => {
    if (normalizedImages.length <= 1) return;
    setCurrentIndex((prev) => (prev < normalizedImages.length - 1 ? prev + 1 : 0));
    resetZoom();
  }, [normalizedImages.length, resetZoom]);

  // Double click / double tap toggles zoom
  const handleDoubleTap = useCallback(
    (e) => {
      e.stopPropagation();
      if (zoom > 1) {
        resetZoom();
      } else {
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const clickX = e.clientX - rect.left - rect.width / 2;
          const clickY = e.clientY - rect.top - rect.height / 2;
          setPan({ x: -clickX * 0.7, y: -clickY * 0.7 });
        }
        setZoom(2);
      }
    },
    [zoom, resetZoom]
  );

  // Mouse wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    setZoom((prev) => {
      const next = Math.max(1, Math.min(3.5, +(prev + delta).toFixed(2)));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0') {
        resetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext, handleZoomIn, handleZoomOut, resetZoom]);

  // Attach wheel listener as non-passive to allow e.preventDefault()
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isOpen) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [isOpen, handleWheel]);

  // Mouse pan handlers
  const handleMouseDown = (e) => {
    if (zoom <= 1 || e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoom <= 1) return;
    e.preventDefault();
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const maxPanX = (zoom - 1) * 350;
    const maxPanY = (zoom - 1) * 250;
    setPan({
      x: Math.max(-maxPanX, Math.min(maxPanX, panStartRef.current.x + dx)),
      y: Math.max(-maxPanY, Math.min(maxPanY, panStartRef.current.y + dy)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch pan handlers for mobile
  const handleTouchStart = (e) => {
    if (zoom <= 1 || e.touches.length !== 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    panStartRef.current = { ...pan };
  };

  const handleTouchMove = (e) => {
    if (!isDragging || zoom <= 1 || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    const maxPanX = (zoom - 1) * 350;
    const maxPanY = (zoom - 1) * 250;
    setPan({
      x: Math.max(-maxPanX, Math.min(maxPanX, panStartRef.current.x + dx)),
      y: Math.max(-maxPanY, Math.min(maxPanY, panStartRef.current.y + dy)),
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  if (!isOpen || normalizedImages.length === 0) return null;

  const currentImage = normalizedImages[currentIndex] || normalizedImages[0];
  const hasMultiple = normalizedImages.length > 1;

  const modalContent = (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget && zoom === 1) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Image Zoom Lightbox"
    >
      {/* Top Header Toolbar */}
      <div className={styles.topBar}>
        <div className={styles.captionGroup}>
          {hasMultiple && (
            <span className={styles.counterBadge}>
              {currentIndex + 1} / {normalizedImages.length}
            </span>
          )}
          {currentImage.caption && (
            <span className={styles.captionText}>{currentImage.caption}</span>
          )}
        </div>

        <div className={styles.topActions}>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close zoom viewer (Esc)"
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div
        ref={containerRef}
        className={`${styles.viewport} ${zoom > 1 ? styles.viewportZoomed : ''} ${
          isDragging ? styles.viewportDragging : ''
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleTap}
      >
        <div
          className={styles.imageTransformWrapper}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 180ms cubic-bezier(0.2, 0, 0, 1)',
          }}
        >
          <img
            src={currentImage.src}
            alt={currentImage.alt || 'Zoomed preview'}
            className={styles.modalImage}
            draggable={false}
          />
        </div>
      </div>

      {/* Prev / Next Arrows */}
      {hasMultiple && (
        <>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.prevBtn}`}
            onClick={handlePrev}
            aria-label="Previous photo (ArrowLeft)"
            title="Previous (ArrowLeft)"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.nextBtn}`}
            onClick={handleNext}
            aria-label="Next photo (ArrowRight)"
            title="Next (ArrowRight)"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* Floating Bottom Control Bar */}
      <div className={styles.bottomBar}>
        <div className={styles.controlsPill}>
          <button
            type="button"
            className={styles.controlBtn}
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            aria-label="Zoom out"
            title="Zoom out (-)"
          >
            <ZoomOut size={16} />
          </button>

          <span className={styles.zoomPercentage}>
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            className={styles.controlBtn}
            onClick={handleZoomIn}
            disabled={zoom >= 3.5}
            aria-label="Zoom in"
            title="Zoom in (+)"
          >
            <ZoomIn size={16} />
          </button>

          <div className={styles.controlDivider} />

          <button
            type="button"
            className={styles.controlBtn}
            onClick={resetZoom}
            disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
            aria-label="Reset zoom"
            title="Reset zoom (0)"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        <span className={styles.hintText}>
          {zoom > 1
            ? 'Drag to pan · Double-click to reset · Scroll to zoom'
            : 'Scroll or double-click to zoom · Click to inspect'}
        </span>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}

export default ImageZoomModal;
