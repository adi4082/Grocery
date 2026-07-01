export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  category: string;
  rating: number;
  reviews: number;
  image: string;
  unit: string;
  stock: number;
  isFlashSale?: boolean;
  isBestSeller?: boolean;
  isDailyDeal?: boolean;
  description: string;
  discount?: number;
  isWeightBased?: boolean;
  minWeight?: number;
  maxWeight?: number;
  weightInterval?: number;
  pricePerKg?: number;
}

export const CATEGORIES = [
  { id: 'fruits-veg', name: 'Fruits & Vegetables', icon: 'Apple', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { id: 'grocery-staples', name: 'Grocery & Staples', icon: 'Wheat', color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { id: 'dairy-bread', name: 'Dairy & Bread', icon: 'Egg', color: 'bg-sky-50 text-sky-600 border-sky-100' },
  { id: 'snacks-munchies', name: 'Snacks & Munchies', icon: 'Cookie', color: 'bg-orange-50 text-orange-600 border-orange-100' },
  { id: 'beverages', name: 'Beverages', icon: 'CupSoda', color: 'bg-purple-50 text-purple-600 border-purple-100' },
  { id: 'personal-care', name: 'Personal Care', icon: 'Sparkles', color: 'bg-pink-50 text-pink-600 border-pink-100' },
  { id: 'household', name: 'Household', icon: 'Home', color: 'bg-teal-50 text-teal-600 border-teal-100' }
];

export const PRODUCTS: Product[] = [
  // Fruits & Vegetables
  {
    id: 'fv-1',
    name: 'Organic Red Apples',
    price: 149,
    originalPrice: 199,
    category: 'fruits-veg',
    rating: 4.8,
    reviews: 124,
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&auto=format&fit=crop&q=80',
    unit: '4 pcs (approx. 500g)',
    stock: 45,
    isBestSeller: true,
    description: 'Crisp, sweet, and highly nutritious premium organic red apples. Sourced from certified orchards, perfect for healthy snacking.'
  },
  {
    id: 'fv-2',
    name: 'Fresh Organic Bananas',
    price: 49,
    originalPrice: 59,
    category: 'fruits-veg',
    rating: 4.6,
    reviews: 310,
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&auto=format&fit=crop&q=80',
    unit: '1 Dozen (12 pcs)',
    stock: 60,
    isDailyDeal: true,
    description: 'Naturally sweet and energy-packed rich organic bananas. Rich in potassium and highly fresh.'
  },
  {
    id: 'fv-3',
    name: 'Vine-Ripened Cherry Tomatoes',
    price: 89,
    originalPrice: 120,
    category: 'fruits-veg',
    rating: 4.7,
    reviews: 89,
    image: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=400&auto=format&fit=crop&q=80',
    unit: '250 g',
    stock: 25,
    isFlashSale: true,
    description: 'Juicy, sweet vine-ripened organic cherry tomatoes. Ideal for salads, pastas, and roasting.'
  },
  {
    id: 'fv-4',
    name: 'Premium Spinach Bunch',
    price: 29,
    originalPrice: 39,
    category: 'fruits-veg',
    rating: 4.5,
    reviews: 74,
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&auto=format&fit=crop&q=80',
    unit: '1 Bunch (approx. 250g)',
    stock: 15,
    description: 'Farm-fresh green spinach leaves, washed and ready to cook. Extremely rich in iron and vital vitamins.'
  },
  {
    id: 'fv-5',
    name: 'Hass Avocado (Imported)',
    price: 199,
    originalPrice: 249,
    category: 'fruits-veg',
    rating: 4.9,
    reviews: 142,
    image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&auto=format&fit=crop&q=80',
    unit: '1 pc (approx. 200g)',
    stock: 8,
    isBestSeller: true,
    description: 'Creamy, buttery Hass avocado with perfect texture. Imported and ready to eat or mash into fresh guacamole.'
  },
  {
    id: 'fv-6',
    name: 'Fresh Farm Potatoes (Alu)',
    price: 30,
    originalPrice: 40,
    category: 'fruits-veg',
    rating: 4.6,
    reviews: 154,
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&auto=format&fit=crop&q=80',
    unit: '1 kg',
    stock: 200,
    description: 'Farm fresh organically grown potatoes. A versatile kitchen staple sourced directly from reliable regional farms.',
    isWeightBased: true,
    minWeight: 1,
    maxWeight: 10,
    weightInterval: 1,
    pricePerKg: 30
  },
  {
    id: 'fv-7',
    name: 'Organic Red Onions (Piyaj)',
    price: 45,
    originalPrice: 60,
    category: 'fruits-veg',
    rating: 4.7,
    reviews: 218,
    image: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=400&auto=format&fit=crop&q=80',
    unit: '1 kg',
    stock: 180,
    description: 'Crisp, pungent red onions, handpicked for superior shelf life and robust flavor in home-cooked meals.',
    isWeightBased: true,
    minWeight: 1,
    maxWeight: 10,
    weightInterval: 1,
    pricePerKg: 45
  },

  // Grocery & Staples
  {
    id: 'gr-1',
    name: 'Premium Basmati Rice (Rozana)',
    price: 125,
    originalPrice: 160,
    category: 'grocery-staples',
    rating: 4.7,
    reviews: 210,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80',
    unit: '1 kg',
    stock: 120,
    isBestSeller: true,
    description: 'Long-grained, aromatic premium Basmati rice. Aged perfectly to deliver non-sticky, fluffy grains for your daily meals.',
    isWeightBased: true,
    minWeight: 1,
    maxWeight: 10,
    weightInterval: 1,
    pricePerKg: 125
  },
  {
    id: 'gr-2',
    name: 'Cold-Pressed Extra Virgin Olive Oil',
    price: 799,
    originalPrice: 999,
    category: 'grocery-staples',
    rating: 4.9,
    reviews: 185,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80',
    unit: '500 ml',
    stock: 35,
    isFlashSale: true,
    description: 'Superior quality cold-pressed extra virgin olive oil from Spanish olives. Excellent for dressing salads and low-heat cooking.'
  },
  {
    id: 'gr-3',
    name: 'Pure Raw Organic Honey',
    price: 245,
    originalPrice: 299,
    category: 'grocery-staples',
    rating: 4.8,
    reviews: 320,
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&auto=format&fit=crop&q=80',
    unit: '250 g',
    stock: 50,
    isDailyDeal: true,
    description: '100% natural, unfiltered, and unprocessed forest honey. Directly sourced to preserve beneficial enzymes and rich flavor.'
  },
  {
    id: 'gr-4',
    name: 'Organic Red Lentils (Masoor Dal)',
    price: 110,
    originalPrice: 130,
    category: 'grocery-staples',
    rating: 4.6,
    reviews: 98,
    image: 'https://images.unsplash.com/photo-1515942400758-13da6c13b2d1?w=400&auto=format&fit=crop&q=80',
    unit: '1 kg',
    stock: 80,
    description: 'Split organic red lentils, quick to cook and highly digestible. A superb plant-based source of protein and dietary fiber.',
    isWeightBased: true,
    minWeight: 0.5,
    maxWeight: 5,
    weightInterval: 0.5,
    pricePerKg: 110
  },
  {
    id: 'gr-5',
    name: 'Pure Organic Sulfur-Free Sugar',
    price: 60,
    originalPrice: 80,
    category: 'grocery-staples',
    rating: 4.8,
    reviews: 140,
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=80',
    unit: '1 kg',
    stock: 100,
    description: '100% organic, pure sulfur-free crystalline white sugar. Clean, sweet, and ideal for confectionery and daily beverages.',
    isWeightBased: true,
    minWeight: 0.5,
    maxWeight: 5,
    weightInterval: 0.5,
    pricePerKg: 60
  },

  // Dairy & Bread
  {
    id: 'db-1',
    name: 'Organic Whole Milk',
    price: 64,
    originalPrice: 70,
    category: 'dairy-bread',
    rating: 4.8,
    reviews: 540,
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&auto=format&fit=crop&q=80',
    unit: '1 Litre',
    stock: 200,
    isBestSeller: true,
    description: 'Fresh, homogenized, and pasteurized organic whole milk. Sourced from grass-fed cows, delivered pasteurized and chilled.'
  },
  {
    id: 'db-2',
    name: 'Gourmet Salted Butter',
    price: 265,
    originalPrice: 290,
    category: 'dairy-bread',
    rating: 4.7,
    reviews: 195,
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&auto=format&fit=crop&q=80',
    unit: '500 g',
    stock: 90,
    isDailyDeal: true,
    description: 'Rich, creamy gourmet salted butter. Perfect for baking, spreading over warm toast, or adding rich flavor to savory meals.'
  },
  {
    id: 'db-3',
    name: 'Greek Yogurt (Blueberry)',
    price: 55,
    originalPrice: 65,
    category: 'dairy-bread',
    rating: 4.6,
    reviews: 215,
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&auto=format&fit=crop&q=80',
    unit: '90 g',
    stock: 110,
    isFlashSale: true,
    description: 'Thick, creamy probiotic Greek yogurt infused with real blueberries. A deliciously healthy, protein-rich dessert or snack.'
  },
  {
    id: 'db-4',
    name: 'Artisanal Sourdough Bread',
    price: 120,
    originalPrice: 150,
    category: 'dairy-bread',
    rating: 4.9,
    reviews: 83,
    image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&auto=format&fit=crop&q=80',
    unit: '1 Loaf (approx. 400g)',
    stock: 12,
    description: 'Slow-fermented artisanal sourdough bread with a crispy crust and an airy, chewy crumb. Baked fresh every morning.'
  },

  // Snacks & Munchies
  {
    id: 'sn-1',
    name: 'Kettle Cooked Sea Salt Chips',
    price: 85,
    originalPrice: 99,
    category: 'snacks-munchies',
    rating: 4.6,
    reviews: 144,
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d20?w=400&auto=format&fit=crop&q=80',
    unit: '150 g',
    stock: 75,
    isFlashSale: true,
    description: 'Crunchy kettle-cooked potato chips seasoned with natural sea salt. Made in small batches for the ultimate crisp.'
  },
  {
    id: 'sn-2',
    name: 'Organic Roasted Almonds',
    price: 349,
    originalPrice: 399,
    category: 'snacks-munchies',
    rating: 4.8,
    reviews: 175,
    image: 'https://images.unsplash.com/photo-1508061253366-f7da158b6cd9?w=400&auto=format&fit=crop&q=80',
    unit: '250 g',
    stock: 40,
    isBestSeller: true,
    description: 'Lightly salted, oven-roasted organic almonds. Packed with Vitamin E, protein, and healthy fats.'
  },
  {
    id: 'sn-3',
    name: 'Dark Chocolate Chip Cookies',
    price: 145,
    originalPrice: 180,
    category: 'snacks-munchies',
    rating: 4.7,
    reviews: 204,
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&auto=format&fit=crop&q=80',
    unit: '200 g',
    stock: 32,
    isDailyDeal: true,
    description: 'Soft-baked cookies loaded with rich Belgian dark chocolate chunks. Pure indulgence in every single bite.'
  },

  // Beverages
  {
    id: 'bv-1',
    name: 'Cold Pressed Orange Juice',
    price: 119,
    originalPrice: 149,
    category: 'beverages',
    rating: 4.7,
    reviews: 156,
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&auto=format&fit=crop&q=80',
    unit: '250 ml',
    stock: 65,
    isBestSeller: true,
    description: '100% natural cold pressed orange juice. No added sugar, water, or preservatives—just pure immunity-boosting Vitamin C.'
  },
  {
    id: 'bv-2',
    name: 'Japanese Organic Matcha Green Tea',
    price: 499,
    originalPrice: 599,
    category: 'beverages',
    rating: 4.9,
    reviews: 62,
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&auto=format&fit=crop&q=80',
    unit: '50 g (tin)',
    stock: 18,
    isFlashSale: true,
    description: 'Ceremonial grade pure Japanese matcha powder. Finely ground green tea leaves with incredible antioxidant properties.'
  },
  {
    id: 'bv-3',
    name: 'Sparkling Mineral Water',
    price: 75,
    originalPrice: 90,
    category: 'beverages',
    rating: 4.5,
    reviews: 112,
    image: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=400&auto=format&fit=crop&q=80',
    unit: '750 ml',
    stock: 140,
    isDailyDeal: true,
    description: 'Crisp and refreshing naturally carbonated mineral water, imported from premium European springs.'
  },

  // Personal Care
  {
    id: 'pc-1',
    name: 'Tea Tree & Neem Body Wash',
    price: 249,
    originalPrice: 299,
    category: 'personal-care',
    rating: 4.6,
    reviews: 118,
    image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&auto=format&fit=crop&q=80',
    unit: '250 ml',
    stock: 22,
    isBestSeller: true,
    description: 'Antibacterial tea tree and organic neem extract body wash. Cleanses deeply while keeping skin hydrated and refreshed.'
  },
  {
    id: 'pc-2',
    name: 'Hydrating Face Moisturizer',
    price: 395,
    originalPrice: 450,
    category: 'personal-care',
    rating: 4.7,
    reviews: 84,
    image: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=400&auto=format&fit=crop&q=80',
    unit: '100 ml',
    stock: 14,
    isDailyDeal: true,
    description: 'Lightweight hyaluronic acid face gel moisturizer. Absorbs instantly to provide a long-lasting plump, non-greasy glow.'
  },

  // Household
  {
    id: 'hh-1',
    name: 'Eco-Friendly Laundry Liquid',
    price: 315,
    originalPrice: 380,
    category: 'household',
    rating: 4.7,
    reviews: 130,
    image: 'https://images.unsplash.com/photo-1610557892470-76d74cd120a8?w=400&auto=format&fit=crop&q=80',
    unit: '1 Litre',
    stock: 45,
    isBestSeller: true,
    description: 'Plant-powered, ultra-concentrated laundry liquid. High stain removal, gentle on fabrics, and fully biodegradable.'
  },
  {
    id: 'hh-2',
    name: 'Citrus Dishwashing Liquid Gel',
    price: 95,
    originalPrice: 120,
    category: 'household',
    rating: 4.5,
    reviews: 245,
    image: 'https://images.unsplash.com/photo-1585832770485-e289c1e07843?w=400&auto=format&fit=crop&q=80',
    unit: '500 ml',
    stock: 80,
    isFlashSale: true,
    description: 'Tough grease cutting dishwashing liquid with fresh lime extracts. Leaves plates squeaky clean and odor-free.'
  }
];

// Add discount helper property
PRODUCTS.forEach(p => {
  p.discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
});
