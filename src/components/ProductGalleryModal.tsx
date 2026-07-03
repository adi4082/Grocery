import React, { useState, useEffect, useRef } from "react";
import { Product } from "../data/products";
import { 
  X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, 
  Sparkles, CheckCircle2, ShieldCheck, HelpCircle, GripHorizontal
} from "lucide-react";

interface ProductGalleryModalProps {
  product: Product;
  onClose: () => void;
}

interface ImageDetail {
  url: string;
  title: string;
  description: string;
}

export const ProductGalleryModal: React.FC<ProductGalleryModalProps> = ({
  product,
  onClose
}) => {
  // Generate high-resolution galleries dynamically based on product context
  const getGalleryImages = (): ImageDetail[] => {
    // Standardize URL to get high-res image
    const highResPrimary = product.image.includes("?") 
      ? product.image.split("?")[0] + "?w=1200&auto=format&fit=crop&q=95"
      : product.image;

    const baseDetails: ImageDetail[] = [
      {
        url: highResPrimary,
        title: "Standard Overview",
        description: `Full view of ${product.name} ready for kitchen preparation.`
      }
    ];

    // Category-specific mock high-resolution fresh/detail inspect views
    if (product.category === "fruits-veg") {
      if (product.id === "fv-1") {
        // Organic Red Apples
        baseDetails.push(
          {
            url: "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=1200&auto=format&fit=crop&q=95",
            title: "Macro Quality Close-up",
            description: "Inspecting skin firmness, color density, and absence of external bruises."
          },
          {
            url: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=1200&auto=format&fit=crop&q=95",
            title: "Chilled Storage Sorting",
            description: "Direct look at our premium moisture-controlled farm baskets."
          }
        );
      } else if (product.id === "fv-2") {
        // Bananas
        baseDetails.push(
          {
            url: "https://images.unsplash.com/photo-1543218024-57a70143c369?w=1200&auto=format&fit=crop&q=95",
            title: "Texture Inspection",
            description: "No black bruises or over-softness. Sourced at optimal stage-4 ripeness."
          },
          {
            url: "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=1200&auto=format&fit=crop&q=95",
            title: "Bunch Sorting View",
            description: "Sorted bunch-by-bunch to guarantee natural protective stems are intact."
          }
        );
      } else if (product.id === "fv-3") {
        // Cherry Tomatoes
        baseDetails.push(
          {
            url: "https://images.unsplash.com/photo-1546470427-f5b97530e64f?w=1200&auto=format&fit=crop&q=95",
            title: "Vine Dew Freshness",
            description: "Macro inspect of cherry-tomato clusters showcasing plump turgidity and green vines."
          },
          {
            url: "https://images.unsplash.com/photo-1518977822222-222222222222?w=1200&auto=format&fit=crop&q=95",
            title: "Packing Quality Check",
            description: "Double washed and ventilated to eliminate any inner container humidity."
          }
        );
      } else if (product.id === "fv-4") {
        // Spinach
        baseDetails.push(
          {
            url: "https://images.unsplash.com/photo-1551304882-30074947907a?w=1200&auto=format&fit=crop&q=95",
            title: "Chlorophyll & Veins",
            description: "Leaf inspect. Crisp green margins without yellow spotting or stem decay."
          },
          {
            url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&auto=format&fit=crop&q=95",
            title: "Cold Water Hydrocooling",
            description: "Pre-cooled in fresh streams at 2°C to lock in crunchy structure."
          }
        );
      } else if (product.id === "fv-5") {
        // Avocado
        baseDetails.push(
          {
            url: "https://images.unsplash.com/photo-1604085572504-a392ddf0b8b8?w=1200&auto=format&fit=crop&q=95",
            title: "Creamy Pulped Texture",
            description: "Perfect oil-to-moisture ratio. Inspected skin grain for certified Hass pedigree."
          },
          {
            url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=95",
            title: "Imported Batch Grading",
            description: "Tested using acoustic non-destructive fruit ripening sensors."
          }
        );
      } else {
        // Generic Vegetables
        baseDetails.push(
          {
            url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&auto=format&fit=crop&q=95",
            title: "Farming Quality Control",
            description: "Grown in certified rich organic loam with regular soil testing."
          },
          {
            url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=95",
            title: "100% Organic Certificate",
            description: "Meets or exceeds all clean pesticide-free agriculture rules."
          }
        );
      }
    } else if (product.category === "dairy-bread") {
      baseDetails.push(
        {
          url: "https://images.unsplash.com/photo-1528498033053-166849f64042?w=1200&auto=format&fit=crop&q=95",
          title: "Freshness Verification",
          description: "Strictly cold-stored below 4°C with continuous temperature telemetry logs."
        },
        {
          url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=95",
          title: "Premium Sourcing Check",
          description: "Made in local, certified bio-secure, state-of-the-art regional plants."
        }
      );
    } else {
      // General categories (groceries, snacks, beverages etc)
      baseDetails.push(
        {
          url: "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=1200&auto=format&fit=crop&q=95",
          title: "Sealed Quality Package",
          description: "Inspected high-barrier protective packaging to prevent ambient humidity."
        },
        {
          url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=95",
          title: "Darkstore Shelf Inspection",
          description: "Maintained in clean, temperature-regulated micro-fulfillment centers."
        }
      );
    }

    return baseDetails;
  };

  const galleryList = getGalleryImages();
  const [activeIdx, setActiveIdx] = useState(0);

  // Pan & Zoom state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  // Touch gestures helpers
  const [initialTouchDistance, setInitialTouchDistance] = useState<number | null>(null);
  const [initialTouchScale, setInitialTouchScale] = useState<number>(1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Reset zoom settings on changing active image
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [activeIdx]);

  // Handle zooming limits and constraints
  const updateZoomScale = (newScale: number) => {
    const boundedScale = Math.min(Math.max(newScale, 1), 4);
    setScale(boundedScale);
    if (boundedScale === 1) {
      setPosition({ x: 0, y: 0 });
    } else {
      // Re-constrain position when zooming out
      setPosition(prev => constrainPosition(prev.x, prev.y, boundedScale));
    }
  };

  // Restrict panning boundary so the image doesn't go off-screen
  const constrainPosition = (x: number, y: number, currentScale: number) => {
    if (!containerRef.current || currentScale <= 1) {
      return { x: 0, y: 0 };
    }
    const rect = containerRef.current.getBoundingClientRect();
    const maxOffsetX = ((rect.width * currentScale) - rect.width) / 2;
    const maxOffsetY = ((rect.height * currentScale) - rect.height) / 2;

    return {
      x: Math.min(Math.max(x, -maxOffsetX), maxOffsetX),
      y: Math.min(Math.max(y, -maxOffsetY), maxOffsetY)
    };
  };

  // Mouse drag panning logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return; // Only pan when zoomed in
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    setPosition(constrainPosition(newX, newY, scale));
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Double tap/click to toggle zoom
  const handleDoubleTap = (e: React.MouseEvent) => {
    e.preventDefault();
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2.5);
      // Zoom centered near pointer coordinates if possible
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const pointerX = e.clientX - rect.left - rect.width / 2;
        const pointerY = e.clientY - rect.top - rect.height / 2;
        // Move opposite to click point to center it
        setPosition(constrainPosition(-pointerX * 1.5, -pointerY * 1.5, 2.5));
      }
    }
  };

  // Touch gesture panning and pinch-to-zoom logic
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch Gesture Initiation
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setInitialTouchDistance(dist);
      setInitialTouchScale(scale);
    } else if (e.touches.length === 1 && scale > 1) {
      // Touch Drag Initiation
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialTouchDistance !== null) {
      // Pinching
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = currentDist / initialTouchDistance;
      updateZoomScale(initialTouchScale * ratio);
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      // Dragging/Panning
      const newX = e.touches[0].clientX - dragStartRef.current.x;
      const newY = e.touches[0].clientY - dragStartRef.current.y;
      setPosition(constrainPosition(newX, newY, scale));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setInitialTouchDistance(null);
  };

  const handleNext = () => {
    if (activeIdx < galleryList.length - 1) {
      setActiveIdx(prev => prev + 1);
    } else {
      setActiveIdx(0); // Wrap around
    }
  };

  const handlePrev = () => {
    if (activeIdx > 0) {
      setActiveIdx(prev => prev - 1);
    } else {
      setActiveIdx(galleryList.length - 1); // Wrap around
    }
  };

  const activeImage = galleryList[activeIdx];

  return (
    <div className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-300">
      
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-b from-black/80 to-transparent p-4 sm:p-6 text-white flex justify-between items-center z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-emerald-500/25 border border-emerald-400 text-emerald-300 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
              Produce Quality Gallery
            </span>
            <span className="text-zinc-400 text-[11px] font-bold">
              Image {activeIdx + 1} of {galleryList.length}
            </span>
          </div>
          <h2 className="text-sm sm:text-base font-black tracking-tight mt-1 truncate max-w-xs sm:max-w-md">
            {product.name}
          </h2>
        </div>
        
        <button
          onClick={onClose}
          id="close-gallery-btn"
          className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center border border-white/15"
          aria-label="Close interactive gallery"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* VIEWER AREA WITH GESTURE LISTENERS */}
      <div className="relative flex-1 w-full flex items-center justify-center p-2 sm:p-6 md:p-8">
        
        {/* Navigation arrow left */}
        <button
          onClick={handlePrev}
          id="prev-gallery-btn"
          className="absolute left-4 p-3 rounded-full bg-black/50 hover:bg-black/75 text-white/80 hover:text-white transition z-10 border border-white/5 cursor-pointer backdrop-blur-sm hidden sm:flex items-center justify-center"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Dynamic Interactive Stage */}
        <div 
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onDoubleClick={handleDoubleTap}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative max-w-full max-h-[70vh] aspect-square w-full rounded-2xl overflow-hidden bg-zinc-900/50 flex items-center justify-center cursor-grab active:cursor-grabbing"
        >
          {/* Main Display Image */}
          <img
            src={activeImage.url}
            alt={activeImage.title}
            referrerPolicy="no-referrer"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? "none" : "transform 0.2s cubic-bezier(0.1, 0.76, 0.55, 0.94)"
            }}
            className="max-w-full max-h-full object-contain pointer-events-none select-none rounded-lg"
          />

          {/* Quick Guidance Tag */}
          {scale === 1 && (
            <div className="absolute top-4 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 flex items-center gap-2 pointer-events-none text-white/90 text-[10px] font-black uppercase tracking-widest animate-pulse">
              <GripHorizontal className="w-3.5 h-3.5" />
              <span>Double-tap or Pinch to inspect quality</span>
            </div>
          )}
        </div>

        {/* Navigation arrow right */}
        <button
          onClick={handleNext}
          id="next-gallery-btn"
          className="absolute right-4 p-3 rounded-full bg-black/50 hover:bg-black/75 text-white/80 hover:text-white transition z-10 border border-white/5 cursor-pointer backdrop-blur-sm hidden sm:flex items-center justify-center"
        >
          <ChevronRight className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* FOOTER INTERACTIVE CONTROL PANEL */}
      <div className="bg-gradient-to-t from-black/90 via-black/80 to-transparent p-4 sm:p-6 text-white space-y-4 sm:space-y-6 z-10">
        
        {/* Caption & Metadata description panel */}
        <div className="max-w-xl mx-auto text-center space-y-1 sm:space-y-1.5">
          <p className="text-amber-400 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>{activeImage.title}</span>
          </p>
          <p className="text-zinc-300 text-xs sm:text-xs font-medium leading-relaxed max-w-lg mx-auto">
            {activeImage.description}
          </p>
        </div>

        {/* Zoom adjustment tool bar */}
        <div className="max-w-md mx-auto flex items-center justify-between gap-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2.5">
          
          <button
            onClick={() => updateZoomScale(scale - 0.5)}
            className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Precise zoom control slider */}
          <div className="flex-1 flex items-center gap-2.5">
            <span className="text-[10px] font-extrabold text-zinc-400">1x</span>
            <input
              type="range"
              min="1"
              max="4"
              step="0.1"
              value={scale}
              onChange={(e) => updateZoomScale(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <span className="text-[10px] font-extrabold text-zinc-400">4x</span>
          </div>

          <button
            onClick={() => updateZoomScale(scale + 0.5)}
            className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {scale > 1 && (
            <button
              onClick={() => {
                setScale(1);
                setPosition({ x: 0, y: 0 });
              }}
              className="p-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-black uppercase tracking-wider"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Thumbnails Navigation Ribbon */}
        <div className="max-w-lg mx-auto flex justify-center items-center gap-2.5 overflow-x-auto py-1 scrollbar-none">
          {galleryList.map((item, idx) => {
            const isActive = activeIdx === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 transition transform hover:scale-105 active:scale-95 cursor-pointer ${
                  isActive 
                    ? "border-amber-400 shadow-lg shadow-amber-400/25 scale-105" 
                    : "border-white/10 opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={item.url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {isActive && (
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Dynamic QC badging */}
        <div className="flex justify-center items-center gap-4 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-zinc-500 pt-1 border-t border-white/5">
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Organic Verified</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-blue-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Zero Damage Checked</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-amber-400">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Chilled Cold-chain Logistics</span>
          </span>
        </div>

      </div>
      
    </div>
  );
};
