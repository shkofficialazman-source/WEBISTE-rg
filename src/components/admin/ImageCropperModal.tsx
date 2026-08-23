import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Crop,
  RotateCw,
  FlipHorizontal,
  ZoomIn,
  ZoomOut,
  Check,
  X,
  RefreshCw,
  Sparkles,
  Maximize2,
  Minimize2,
  Layers,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  Sliders,
  Move,
} from 'lucide-react';

export type AspectRatioOption = '1:1' | '4:3' | '16:9' | '4:5' | '3:4' | '21:9' | 'free';

export interface AspectPreset {
  id: AspectRatioOption;
  label: string;
  ratio: number | null; // width / height or null for free
  description: string;
}

export const ASPECT_PRESETS: AspectPreset[] = [
  { id: '1:1', label: '1:1 Square', ratio: 1, description: 'Products, Avatars & Cards' },
  { id: '4:3', label: '4:3 Standard', ratio: 4 / 3, description: 'Diecast Blister Card & Showcase' },
  { id: '16:9', label: '16:9 Widescreen', ratio: 16 / 9, description: 'Banners, Covers & Hero' },
  { id: '4:5', label: '4:5 Portrait', ratio: 4 / 5, description: 'Tall Display & Mobile' },
  { id: '21:9', label: '21:9 Ultra-wide', ratio: 21 / 9, description: 'Promo & Header Banners' },
  { id: 'free', label: 'Freeform', ratio: null, description: 'Custom unconstrained ratio' },
];

export interface CropQueueItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
}

export interface ImageCropperModalProps {
  isOpen: boolean;
  files: File[];
  defaultAspectRatio?: AspectRatioOption;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  onCropComplete: (croppedFiles: File[]) => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  files,
  defaultAspectRatio = '1:1',
  title = 'Crop & Perfect Your Photo',
  subtitle = 'Adjust positioning, zoom, aspect ratio, and framing before saving.',
  onClose,
  onCropComplete,
}) => {
  // Queue state for multi-image uploads
  const [queue, setQueue] = useState<CropQueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [croppedResults, setCroppedResults] = useState<File[]>([]);
  const [isProcessingCrop, setIsProcessingCrop] = useState(false);

  // Transform states for current image
  const [selectedRatio, setSelectedRatio] = useState<AspectRatioOption>(defaultAspectRatio);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [isFlippedH, setIsFlippedH] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [freeCropRect, setFreeCropRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Drag & Touch interaction refs
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const touchStartDistRef = useRef<number | null>(null);
  const initialTouchZoomRef = useRef<number>(1);

  // Live preview canvas ref
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load and prepare incoming files into crop queue
  useEffect(() => {
    if (isOpen && files && files.length > 0) {
      const items: CropQueueItem[] = files.map((file, idx) => ({
        id: `crop-${Date.now()}-${idx}`,
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name || `Image_${idx + 1}.jpg`,
      }));
      setQueue(items);
      setCurrentIndex(0);
      setCroppedResults([]);
      resetTransforms(defaultAspectRatio);
    } else {
      setQueue([]);
      setCurrentIndex(0);
      setCroppedResults([]);
    }

    return () => {
      // Clean up blob URLs when modal unmounts
      queue.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [isOpen, files, defaultAspectRatio]);

  // Reset transforms when moving to next image
  const resetTransforms = useCallback((ratio: AspectRatioOption = defaultAspectRatio) => {
    setZoom(1);
    setRotation(0);
    setIsFlippedH(false);
    setPan({ x: 0, y: 0 });
    setSelectedRatio(ratio);
    setFreeCropRect(null);
  }, [defaultAspectRatio]);

  const currentItem: CropQueueItem | undefined = queue[currentIndex];

  // Calculate live crop box dimensions based on container and aspect ratio
  const getCropBoxDimensions = useCallback(() => {
    if (!containerRef.current) return { width: 280, height: 280 };
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    const padding = 32;
    const maxW = Math.max(160, containerWidth - padding);
    const maxH = Math.max(160, containerHeight - padding);

    const preset = ASPECT_PRESETS.find((p) => p.id === selectedRatio);
    const ratio = preset?.ratio;

    if (!ratio || selectedRatio === 'free') {
      // Freeform default bounds
      const side = Math.min(maxW, maxH * 0.9);
      return { width: side, height: side };
    }

    let w = maxW;
    let h = w / ratio;

    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }

    return { width: Math.round(w), height: Math.round(h) };
  }, [selectedRatio]);

  // Handle pan & drag start (Mouse)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  // Handle pan & drag move (Mouse)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Handle Touch Gestures (Pan & Pinch-to-zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragStartRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      };
      touchStartDistRef.current = null;
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchStartDistRef.current = dist;
      initialTouchZoomRef.current = zoom;
    }
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      setPan({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      });
    } else if (e.touches.length === 2 && touchStartDistRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const scale = currentDist / touchStartDistRef.current;
      const newZoom = Math.min(4, Math.max(0.8, initialTouchZoomRef.current * scale));
      setZoom(Number(newZoom.toFixed(2)));
    }
  }, [zoom]);

  const handleTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
    touchStartDistRef.current = null;
  }, []);

  // Mouse wheel zoom inside container
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.min(4, Math.max(0.8, Number((prev + zoomDelta).toFixed(2)))));
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Generate cropped image file using HTML5 Canvas
  const generateCroppedBlob = async (): Promise<File | null> => {
    if (!currentItem || !imageRef.current || !containerRef.current) return null;

    const img = imageRef.current;
    const cropBox = getCropBoxDimensions();

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // High resolution export dimensions (Target up to 1600px width/height for clarity)
    const exportWidth = Math.min(2048, Math.max(800, Math.round(cropBox.width * 2)));
    const exportHeight = Math.round(exportWidth / (cropBox.width / cropBox.height));

    canvas.width = exportWidth;
    canvas.height = exportHeight;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportWidth, exportHeight);

    // Save context state for rotation, flip, pan, and zoom
    ctx.save();

    // Move to center of canvas
    ctx.translate(exportWidth / 2, exportHeight / 2);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply horizontal flip
    if (isFlippedH) {
      ctx.scale(-1, 1);
    }

    // Compute display scaling between the on-screen crop box and export canvas
    const scaleToExport = exportWidth / cropBox.width;

    // Natural image dimensions
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    // Base fitting scale inside the crop box
    const fitScale = Math.max(cropBox.width / naturalWidth, cropBox.height / naturalHeight);
    const totalScale = fitScale * zoom * scaleToExport;

    // Apply pan offset scaled to export resolution
    // Note: If rotated 90 or 270, adjust pan direction
    let panX = pan.x * scaleToExport;
    let panY = pan.y * scaleToExport;

    if (rotation === 90) {
      const temp = panX;
      panX = panY;
      panY = -temp;
    } else if (rotation === 180) {
      panX = -panX;
      panY = -panY;
    } else if (rotation === 270) {
      const temp = panX;
      panX = -panY;
      panY = temp;
    }

    if (isFlippedH) {
      panX = -panX;
    }

    const drawWidth = naturalWidth * totalScale;
    const drawHeight = naturalHeight * totalScale;

    ctx.drawImage(
      img,
      -drawWidth / 2 + panX,
      -drawHeight / 2 + panY,
      drawWidth,
      drawHeight
    );

    ctx.restore();

    // Export high-quality JPEG File
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const baseName = currentItem.name.replace(/\.[^/.]+$/, '');
          const cleanFileName = `${baseName}_cropped.jpg`;
          const croppedFile = new File([blob], cleanFileName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(croppedFile);
        },
        'image/jpeg',
        0.92
      );
    });
  };

  // Handle Apply Current Crop
  const handleApplyCurrent = async () => {
    if (!currentItem) return;
    setIsProcessingCrop(true);

    try {
      const croppedFile = await generateCroppedBlob();
      const nextCropped = [...croppedResults, croppedFile || currentItem.file];

      if (currentIndex + 1 < queue.length) {
        // Move to next image in queue
        setCroppedResults(nextCropped);
        setCurrentIndex((prev) => prev + 1);
        resetTransforms(selectedRatio);
      } else {
        // All images cropped! Complete operation
        onCropComplete(nextCropped);
        onClose();
      }
    } catch (err) {
      console.error('Crop export failed:', err);
      // Fallback to original
      const nextCropped = [...croppedResults, currentItem.file];
      if (currentIndex + 1 < queue.length) {
        setCroppedResults(nextCropped);
        setCurrentIndex((prev) => prev + 1);
      } else {
        onCropComplete(nextCropped);
        onClose();
      }
    } finally {
      setIsProcessingCrop(false);
    }
  };

  // Skip current crop (keep original file for this item)
  const handleSkipCurrent = () => {
    if (!currentItem) return;
    const nextCropped = [...croppedResults, currentItem.file];

    if (currentIndex + 1 < queue.length) {
      setCroppedResults(nextCropped);
      setCurrentIndex((prev) => prev + 1);
      resetTransforms(selectedRatio);
    } else {
      onCropComplete(nextCropped);
      onClose();
    }
  };

  // Skip all remaining and use original files
  const handleUseAllOriginal = () => {
    const remaining = queue.slice(currentIndex).map((item) => item.file);
    onCropComplete([...croppedResults, ...remaining]);
    onClose();
  };

  if (!isOpen || queue.length === 0 || !currentItem) {
    return null;
  }

  const cropBox = getCropBoxDimensions();

  return (
    <div
      id="image-cropper-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="image-cropper-modal-card"
        className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden text-white"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black uppercase font-mono tracking-tight text-white">
                  {title}
                </h3>
                {queue.length > 1 && (
                  <span className="bg-red-600 text-white text-[10px] font-black font-mono px-2 py-0.5 rounded-full">
                    {currentIndex + 1} OF {queue.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 font-mono line-clamp-1">
                {queue.length > 1
                  ? `Editing: ${currentItem.name} (${currentIndex + 1}/${queue.length})`
                  : subtitle}
              </p>
            </div>
          </div>

          <button
            id="close-cropper-button"
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Cancel & Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aspect Ratio Presets Bar */}
        <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 overflow-x-auto no-scrollbar flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-zinc-400 uppercase font-bold shrink-0 flex items-center gap-1 mr-1">
            <Layers className="w-3.5 h-3.5 text-red-500" />
            <span>Aspect Ratio:</span>
          </span>

          {ASPECT_PRESETS.map((preset) => {
            const isSelected = selectedRatio === preset.id;
            return (
              <button
                key={preset.id}
                id={`ratio-preset-${preset.id}`}
                type="button"
                onClick={() => {
                  setSelectedRatio(preset.id);
                  setPan({ x: 0, y: 0 });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                }`}
                title={preset.description}
              >
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Cropper Stage */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onWheel={handleWheel}
          className="relative flex-1 min-h-[300px] sm:min-h-[380px] bg-zinc-950 overflow-hidden flex items-center justify-center select-none cursor-grab active:cursor-grabbing touch-none p-4"
        >
          {/* Background Grid Pattern */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #444 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Draggable & Scalable Image */}
          <div
            className="relative transition-transform duration-75 pointer-events-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg) ${
                isFlippedH ? 'scaleX(-1)' : ''
              }`,
              transformOrigin: 'center center',
            }}
          >
            <img
              ref={imageRef}
              src={currentItem.previewUrl}
              alt="Crop target"
              referrerPolicy="no-referrer"
              className="max-w-none max-h-none pointer-events-none"
              style={{
                width: `${cropBox.width * 1.5}px`,
                height: 'auto',
                objectFit: 'contain',
              }}
            />
          </div>

          {/* Dark Scrim Mask outside Crop Box */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.72)`,
              width: `${cropBox.width}px`,
              height: `${cropBox.height}px`,
              top: `calc(50% - ${cropBox.height / 2}px)`,
              left: `calc(50% - ${cropBox.width / 2}px)`,
              borderRadius: '8px',
            }}
          />

          {/* Active Crop Box Boundary & Rule of Thirds Grid */}
          <div
            className="absolute pointer-events-none border-2 border-red-500/90 rounded-lg shadow-2xl transition-all"
            style={{
              width: `${cropBox.width}px`,
              height: `${cropBox.height}px`,
              top: `calc(50% - ${cropBox.height / 2}px)`,
              left: `calc(50% - ${cropBox.width / 2}px)`,
            }}
          >
            {/* Rule of Thirds Guidelines */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
              <div className="border-r border-b border-white/60" />
              <div className="border-r border-b border-white/60" />
              <div className="border-b border-white/60" />
              <div className="border-r border-b border-white/60" />
              <div className="border-r border-b border-white/60" />
              <div className="border-b border-white/60" />
              <div className="border-r border-white/60" />
              <div className="border-r border-white/60" />
              <div />
            </div>

            {/* Corner Decorative Grips */}
            <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-3 border-l-3 border-red-500" />
            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-3 border-r-3 border-red-500" />
            <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-3 border-l-3 border-red-500" />
            <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-3 border-r-3 border-red-500" />

            {/* Centered Drag Hint Badge */}
            <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-xs text-[10px] font-mono text-zinc-300 px-2 py-0.5 rounded flex items-center gap-1 shadow-xs">
              <Move className="w-3 h-3 text-red-400" />
              <span>Drag to Pan • Pinch/Scroll to Zoom</span>
            </div>

            {/* Ratio badge */}
            <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-xs text-[10px] font-mono text-amber-300 font-bold px-2 py-0.5 rounded shadow-xs">
              {selectedRatio.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Controls & Tools Toolbar */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 space-y-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Zoom Slider Control */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(0.8, Number((prev - 0.15).toFixed(2))))}
                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <input
                id="cropper-zoom-slider"
                type="range"
                min="0.8"
                max="3.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-red-600 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />

              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(3.5, Number((prev + 0.15).toFixed(2))))}
                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono text-zinc-400 w-10 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Quick Adjustment Tools (Rotate, Flip, Reset) */}
            <div className="flex items-center gap-2">
              <button
                id="cropper-rotate-button"
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Rotate 90° Clockwise"
              >
                <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                <span>Rotate 90°</span>
              </button>

              <button
                id="cropper-flip-button"
                type="button"
                onClick={() => setIsFlippedH((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  isFlippedH
                    ? 'bg-amber-600 text-black'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                }`}
                title="Flip Horizontal"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                <span>Flip</span>
              </button>

              <button
                id="cropper-reset-button"
                type="button"
                onClick={() => resetTransforms(selectedRatio)}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                title="Reset Crop Adjustments"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="pt-2 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                id="cropper-cancel-button"
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs font-mono font-bold transition cursor-pointer"
              >
                Cancel
              </button>

              {queue.length > 1 && (
                <>
                  <button
                    id="cropper-skip-button"
                    type="button"
                    onClick={handleSkipCurrent}
                    className="flex-1 sm:flex-initial px-3 py-2.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-mono transition cursor-pointer"
                  >
                    Skip This One
                  </button>
                  <button
                    id="cropper-apply-all-button"
                    type="button"
                    onClick={handleUseAllOriginal}
                    className="hidden md:inline-flex px-3 py-2.5 rounded-xl bg-zinc-800/40 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-mono transition cursor-pointer"
                  >
                    Keep All Originals
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                id="cropper-apply-button"
                type="button"
                disabled={isProcessingCrop}
                onClick={handleApplyCurrent}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-500 active:scale-95 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-red-600/30"
              >
                {isProcessingCrop ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Crop...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>
                      {queue.length > 1 && currentIndex + 1 < queue.length
                        ? 'Apply Crop & Next →'
                        : 'Apply Crop & Save'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
