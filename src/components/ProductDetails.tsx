import React, { useState, useEffect } from "react";
import { Product } from "../data/products";
import { useApp } from "../context/AppContext";
import { 
  X, Star, Heart, Plus, Minus, ShieldCheck, Truck, RefreshCcw, 
  ShoppingBag, Play, ChevronDown, ChevronUp, Info 
} from "lucide-react";

interface ProductDetailsProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({
  product,
  onClose
}) => {
  const { cart, wishlist, addToCart, updateCartQuantity, toggleWishlist, products, reviews, addProductReview, user } = useApp();

  const [selectedVariant, setSelectedVariant] = useState<"std" | "family">("std");
  const [showVideo, setShowVideo] = useState(false);
  const [qaOpenIdx, setQaOpenIdx] = useState<number | null>(null);
  const [customWeight, setCustomWeight] = useState<number>(product?.minWeight || 1);

  useEffect(() => {
    if (product) {
      setCustomWeight(product.minWeight || 1);
    }
  }, [product]);

  // Write review states
  const [userRating, setUserRating] = useState(5);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  if (!product) return null;

  // Get product reviews
  const productReviews = reviews ? reviews.filter((r) => r.productId === product.id) : [];

  // Calculate rating counts for the progress bars
  const totalReviewsCount = productReviews.length;
  const ratingDistribution = [0, 0, 0, 0, 0]; // index 0 for 5-star, 1 for 4-star, etc.
  productReviews.forEach((r) => {
    const starIndex = 5 - r.rating;
    if (starIndex >= 0 && starIndex < 5) {
      ratingDistribution[starIndex]++;
    }
  });

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    addProductReview(
      product.id,
      userRating,
      reviewComment,
      reviewerName.trim() || user?.name || "Guest Shopper"
    );

    setReviewComment("");
    setReviewerName("");
    setUserRating(5);
    setSubmissionSuccess(true);
    setTimeout(() => {
      setSubmissionSuccess(false);
      setShowWriteReview(false);
    }, 2000);
  };

  const cartItem = cart.find((item) => item.product.id === product.id);
  const isStarred = wishlist.includes(product.id);
  const qty = cartItem ? cartItem.quantity : 0;
  const inCart = !!cartItem;
  const isOutOfStock = product.stock <= 0;

  // Custom Pricing & Packing specs based on variants and weight-based setup
  const activePrice = product.isWeightBased
    ? Number((customWeight * (product.pricePerKg || product.price)).toFixed(2))
    : (selectedVariant === "family" ? Math.round(product.price * 2.4) : product.price);

  const activeOriginalPrice = product.isWeightBased
    ? Number((customWeight * ((product.pricePerKg || product.price) * (product.originalPrice / product.price))).toFixed(2))
    : (selectedVariant === "family" ? Math.round(product.originalPrice * 2.4) : product.originalPrice);

  const activeUnit = product.isWeightBased
    ? `${customWeight >= 1 ? `${customWeight} kg` : `${customWeight * 1000} g`}`
    : (selectedVariant === "family" ? `Family Pack (Triple pack / Saver bundle)` : product.unit);

  // Simple "Frequently bought together" suggestion
  const relatedProduct = products.find(p => p.category === product.category && p.id !== product.id) || products[0];

  const QA_ITEMS = [
    { q: `Is this ${product.name} certified organic?`, a: "Yes, our partners are fully certified by the National Organic Federation. All vegetables and fruits are sourced from fields with completely chemical-free histories." },
    { q: "How are chilled dairy items transported?", a: "We utilize custom food-grade isothermal insulated bags lined with chilled gel packs, ensuring that dairy is preserved at exactly 3°C until it touches your hands." },
    { q: "Can I get a cashback refund if they arrive bruised?", a: "Absolutely! Open the floating Help Desk bubble at the bottom right, tap 'Raise Ticket', select 'Damaged Item' and we will refund the value instantly to your QuickNow Wallet." }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Shell */}
      <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 md:p-8">
        <div className="relative bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-zinc-100 p-5 sm:p-8 animate-in zoom-in-95 duration-200">
          
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white hover:bg-zinc-150 text-zinc-800 shadow-lg border border-zinc-200 transition cursor-pointer z-50 flex items-center justify-center"
            aria-label="Close details"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            
            {/* Left Column: Image / Video Demonstration */}
            <div className="space-y-4">
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                {showVideo ? (
                  <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center text-center p-4 animate-fade-in">
                    {/* Simulated pulse scanning laser of dark store packaging */}
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-teal-500 animate-[bounce_2s_infinite]" />
                    
                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mb-2 animate-bounce">
                      <Play className="w-5 h-5 text-zinc-950 fill-zinc-950 ml-1" />
                    </div>
                    
                    <p className="text-white text-xs font-black uppercase tracking-wider">Quality Assurance Tour</p>
                    <p className="text-[10px] text-zinc-400 mt-1 max-w-[180px] leading-normal font-semibold">
                      Live sorting validation inside our 3°C dark store warehouse. Double checked by Store Manager.
                    </p>

                    <button
                      onClick={() => setShowVideo(false)}
                      className="mt-4 text-[10px] bg-white/10 hover:bg-white/20 text-white font-bold px-3.5 py-1.5 rounded-full transition cursor-pointer"
                    >
                      &larr; View Image
                    </button>
                  </div>
                ) : (
                  <>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    
                    {product.discount && product.discount > 0 && (
                      <span className="absolute top-4 left-4 bg-orange-500 text-white font-black text-xs px-3 py-1 rounded-full shadow-md">
                        {product.discount}% OFF
                      </span>
                    )}

                    {/* Play tour button overlay */}
                    <button
                      onClick={() => setShowVideo(true)}
                      className="absolute bottom-4 right-4 bg-zinc-900/80 hover:bg-zinc-900 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full transition flex items-center gap-1.5 backdrop-blur-sm cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>QC Video tour</span>
                    </button>
                  </>
                )}
              </div>

              {/* Guarantees list */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="bg-zinc-50 p-2.5 rounded-xl text-center space-y-1">
                  <Truck className="w-4 h-4 text-blue-600 mx-auto" />
                  <p className="text-[9px] font-black text-zinc-700 uppercase tracking-tighter">10-Min Deliv</p>
                </div>
                <div className="bg-zinc-50 p-2.5 rounded-xl text-center space-y-1">
                  <ShieldCheck className="w-4 h-4 text-blue-600 mx-auto" />
                  <p className="text-[9px] font-black text-zinc-700 uppercase tracking-tighter">Safe & Hygienic</p>
                </div>
                <div className="bg-zinc-50 p-2.5 rounded-xl text-center space-y-1">
                  <RefreshCcw className="w-4 h-4 text-blue-600 mx-auto" />
                  <p className="text-[9px] font-black text-zinc-700 uppercase tracking-tighter">Free Return</p>
                </div>
              </div>
            </div>

            {/* Right Information Column */}
            <div className="flex flex-col justify-between space-y-4">
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                    {product.category.replace("-", " & ")}
                  </span>
                  
                  {/* Heart Star */}
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className={`p-1.5 rounded-full hover:bg-zinc-50 transition ${
                      isStarred ? "text-rose-500" : "text-zinc-300"
                    }`}
                  >
                    <Heart className={`w-5.5 h-5.5 ${isStarred ? "fill-rose-500" : ""}`} />
                  </button>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-zinc-900 leading-snug">
                  {product.name}
                </h3>

                <p className="text-xs text-zinc-400 font-bold">
                  Pack size / unit: {activeUnit}
                </p>

                {/* Rating details */}
                <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg w-max">
                  <Star className="w-4 h-4 fill-amber-500" />
                  <span>{product.rating} Rating</span>
                  <span className="text-zinc-400 font-medium">({product.reviews} reviews)</span>
                </div>

                 {/* PRODUCT VARIANTS OR WEIGHT SELECTOR */}
                 {product.isWeightBased ? (
                   <div className="space-y-3 mt-2 p-4 bg-zinc-50 border border-zinc-200 rounded-3xl">
                     <div className="flex justify-between items-center">
                       <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Select Order Weight</p>
                       <span className="bg-orange-500 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full">
                         ₹{product.pricePerKg || product.price} / kg
                       </span>
                     </div>

                     <div className="flex flex-wrap gap-1.5">
                       {(() => {
                         const min = product.minWeight || 0.5;
                         const max = product.maxWeight || 10;
                         const interval = product.weightInterval || 0.5;
                         const list = [];
                         for (let w = min; w <= max && list.length < 12; w = Number((w + interval).toFixed(2))) {
                           list.push(w);
                         }
                         return list.map((wt) => {
                           const active = customWeight === wt;
                           return (
                             <button
                               key={wt}
                               type="button"
                               onClick={() => setCustomWeight(wt)}
                               className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition cursor-pointer border ${
                                 active
                                   ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/15"
                                   : "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                               }`}
                             >
                               {wt >= 1 ? `${wt} kg` : `${wt * 1000} g`}
                             </button>
                           );
                         });
                       })()}
                     </div>

                     {/* Numeric slider for larger quantities */}
                     <div className="space-y-1 pt-2">
                       <div className="flex justify-between text-[10px] font-black text-zinc-400 uppercase">
                         <span>Min: {product.minWeight || 0.5} kg</span>
                         <span className="font-extrabold text-blue-600">Selected: {customWeight} kg</span>
                         <span>Max: {product.maxWeight || 10} kg</span>
                       </div>
                       <input
                         type="range"
                         min={product.minWeight || 0.5}
                         max={product.maxWeight || 10}
                         step={product.weightInterval || 0.5}
                         value={customWeight}
                         onChange={(e) => setCustomWeight(Number(e.target.value))}
                         className="w-full accent-blue-600 cursor-pointer h-1.5 bg-zinc-200 rounded-lg appearance-none"
                       />
                     </div>
                   </div>
                 ) : (
                   <div className="space-y-2 mt-2">
                     <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Select Packaging Variant</p>
                     <div className="grid grid-cols-2 gap-2">
                       <button
                         onClick={() => setSelectedVariant("std")}
                         className={`p-3 rounded-2xl text-left border transition ${
                           selectedVariant === "std"
                             ? "border-emerald-600 bg-emerald-50/20 text-emerald-900"
                             : "border-zinc-150 bg-white hover:bg-zinc-50"
                         }`}
                       >
                         <p className="text-xs font-black">Standard Pack</p>
                         <p className="text-[10px] text-zinc-400 font-bold mt-0.5">{product.unit}</p>
                       </button>

                       <button
                         onClick={() => setSelectedVariant("family")}
                         className={`p-3 rounded-2xl text-left border transition ${
                           selectedVariant === "family"
                             ? "border-emerald-600 bg-emerald-50/20 text-emerald-900"
                             : "border-zinc-150 bg-white hover:bg-zinc-50"
                         }`}
                       >
                         <p className="text-xs font-black">Family Saver Pack</p>
                         <p className="text-[10px] text-zinc-400 font-bold mt-0.5">Triple quantity bundle</p>
                       </button>
                     </div>
                   </div>
                 )}

                <div className="border-t border-b border-zinc-100 py-3 mt-4">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">About Product</p>
                  <p className="text-xs text-zinc-650 leading-relaxed font-medium">
                    {product.description}
                  </p>
                </div>
              </div>

              {/* Pricing & Checkout interaction */}
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-xs text-zinc-400 line-through font-bold">
                      Original: ₹{activeOriginalPrice}
                    </span>
                    <p className="text-2xl font-black text-zinc-900">
                      ₹{activePrice}
                    </p>
                  </div>

                  {/* Stock Level status warning */}
                  <div>
                    {isOutOfStock ? (
                      <span className="text-xs bg-red-100 text-red-700 font-extrabold px-3 py-1 rounded-lg">
                        Sold Out
                      </span>
                    ) : product.stock <= 10 ? (
                      <span className="text-xs bg-amber-100 text-amber-700 font-extrabold px-3 py-1 rounded-lg">
                        Only {product.stock} left in stock
                      </span>
                    ) : (
                      <span className="text-xs bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-lg">
                        In Stock (Washed & chilled)
                      </span>
                    )}
                  </div>
                </div>

                {/* Button Action */}
                <div>
                  {isOutOfStock ? (
                    <button 
                      disabled 
                      className="w-full py-3.5 bg-zinc-100 text-zinc-400 font-bold text-sm rounded-xl cursor-not-allowed border border-zinc-200"
                    >
                      OUT OF STOCK
                    </button>
                  ) : inCart ? (
                    <div className="flex items-center justify-between bg-orange-500 text-white font-extrabold text-sm rounded-2xl overflow-hidden shadow-lg shadow-orange-500/25">
                      <button
                        onClick={() => updateCartQuantity(product.id, qty - 1)}
                        className="px-6 py-4 hover:bg-orange-600 transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-black">{qty} in basket</span>
                      <button
                        onClick={() => updateCartQuantity(product.id, qty + 1)}
                        className="px-6 py-4 hover:bg-orange-600 transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(product, product.isWeightBased ? customWeight : undefined)}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl transition shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      ADD TO BASKET
                    </button>
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* Customer Reviews & Feedback Section */}
          <div className="mt-8 border-t border-zinc-100 pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                Verified Ratings & Reviews ({productReviews.length})
              </h4>
              <button
                onClick={() => setShowWriteReview(!showWriteReview)}
                className="text-xs bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold px-3.5 py-1.5 rounded-full transition cursor-pointer"
              >
                {showWriteReview ? "Close Review Form" : "Write a Review"}
              </button>
            </div>

            {/* Write a Review Form Panel */}
            {showWriteReview && (
              <form onSubmit={handleSubmitReview} className="bg-zinc-50 border border-zinc-150 rounded-2xl p-5 space-y-4 animate-in slide-in-from-top-4 duration-200">
                <p className="text-xs font-black text-zinc-700 uppercase tracking-tight">Share Your Honest Experience</p>
                
                {/* Interactive Star rating */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase block">Your Overall Rating</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((starValue) => (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => setUserRating(starValue)}
                        className="transition hover:scale-110 cursor-pointer"
                      >
                        <Star 
                          className={`w-7 h-7 ${
                            starValue <= userRating 
                              ? "text-amber-500 fill-amber-500" 
                              : "text-zinc-300"
                          }`} 
                        />
                      </button>
                    ))}
                    <span className="text-xs font-extrabold text-zinc-600 ml-2">
                      {userRating === 5 ? "⭐⭐⭐⭐⭐ Excellent" : 
                       userRating === 4 ? "⭐⭐⭐⭐ Great" :
                       userRating === 3 ? "⭐⭐⭐ Good" :
                       userRating === 2 ? "⭐⭐ Fair" : "⭐ Poor"}
                    </span>
                  </div>
                </div>

                {/* Optional reviewer name input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Your Name (Optional)</label>
                    <input
                      type="text"
                      placeholder={user?.name || "e.g., Subhajit Pal"}
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      className="w-full text-xs font-medium border border-zinc-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Comment area */}
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Detailed Feedback</label>
                  <textarea
                    placeholder="Tell other shoppers about the freshness, flavor, delivery speed, or quality of this grocery item..."
                    required
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full text-xs font-medium border border-zinc-200 rounded-xl p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {submissionSuccess ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black rounded-xl p-3 text-center flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Review submitted successfully! Thank you.</span>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow-md shadow-blue-500/10"
                  >
                    Post Review & Rating
                  </button>
                )}
              </form>
            )}

            {/* Ratings Summary Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 bg-zinc-50 border border-zinc-100 p-5 rounded-2xl items-center">
              <div className="text-center space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Average Rating</p>
                <p className="text-3xl font-black text-zinc-900">{product.rating}</p>
                <div className="flex justify-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`w-3.5 h-3.5 ${
                        star <= Math.round(product.rating) 
                          ? "text-amber-500 fill-amber-500" 
                          : "text-zinc-300"
                      }`} 
                    />
                  ))}
                </div>
                <p className="text-[10px] text-zinc-500 font-bold">Based on {totalReviewsCount} reviews</p>
              </div>

              {/* Progress bars for stars */}
              <div className="sm:col-span-2 space-y-1.5">
                {[5, 4, 3, 2, 1].map((stars, idx) => {
                  const count = ratingDistribution[idx];
                  const percentage = totalReviewsCount > 0 ? (count / totalReviewsCount) * 100 : 0;
                  return (
                    <div key={stars} className="flex items-center gap-2 text-[10px] font-bold text-zinc-600">
                      <span className="w-10 whitespace-nowrap">{stars} stars</span>
                      <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-zinc-400">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Specific Reviews List */}
            <div className="space-y-3.5 max-h-80 overflow-y-auto scrollbar-none pr-1">
              {productReviews.length === 0 ? (
                <div className="text-center py-6 text-zinc-400 font-medium text-xs">
                  Be the first to review this product! Share your feedback.
                </div>
              ) : (
                productReviews.map((rev) => (
                  <div key={rev.id} className="border-b border-zinc-100 pb-3.5 last:border-0 last:pb-0 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-zinc-800">{rev.userName}</span>
                        {rev.isVerifiedPurchase && (
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-150 px-1.5 py-0.2 rounded-full font-extrabold flex items-center gap-0.5">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            <span>Verified</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 font-bold">{rev.date}</span>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-3 h-3 ${
                            star <= rev.rating 
                              ? "text-amber-500 fill-amber-500" 
                              : "text-zinc-300"
                          }`} 
                        />
                      ))}
                    </div>

                    <p className="text-xs text-zinc-600 leading-relaxed font-semibold font-sans">
                      "{rev.comment}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Product Specific Q&A Accordion */}
          <div className="mt-8 border-t border-zinc-100 pt-6 space-y-3">
            <p className="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4 text-zinc-450" />
              Customer Q&A Section
            </p>

            <div className="space-y-2">
              {QA_ITEMS.map((item, idx) => (
                <div key={idx} className="border border-zinc-100 rounded-2xl overflow-hidden bg-zinc-50/55">
                  <button
                    onClick={() => setQaOpenIdx(qaOpenIdx === idx ? null : idx)}
                    className="w-full text-left p-4 flex items-center justify-between gap-3 text-xs font-extrabold text-zinc-800 hover:bg-zinc-50 transition cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <span>{qaOpenIdx === idx ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}</span>
                  </button>

                  {qaOpenIdx === idx && (
                    <div className="p-4 pt-0 text-xs text-zinc-500 leading-relaxed font-semibold border-t border-zinc-100 bg-white">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Frequently Bought Together Box */}
          {relatedProduct && (
            <div className="mt-8 border-t border-zinc-100 pt-6 space-y-3">
              <p className="text-xs font-black text-zinc-400 uppercase tracking-wider">🤝 Frequently Bought Together</p>
              
              <div className="bg-zinc-50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <span className="text-zinc-400 font-extrabold text-xs">+</span>
                    <img
                      src={relatedProduct.image}
                      alt={relatedProduct.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-zinc-800">
                      Bundle: {product.name} + {relatedProduct.name}
                    </h5>
                    <p className="text-[10px] text-zinc-400 font-bold mt-0.5">Special healthy double bundle combination</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    addToCart(product);
                    addToCart(relatedProduct);
                  }}
                  className="bg-zinc-900 hover:bg-zinc-850 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Add Bundle (₹{product.price + relatedProduct.price})
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
