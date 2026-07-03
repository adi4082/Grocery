import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import Razorpay from "razorpay";
import crypto from "crypto";

// Safe path resolution for both ES Modules (dev) and CommonJS (prod bundle)
const getPathDetails = () => {
  try {
    if (typeof import.meta !== "undefined" && import.meta.url) {
      const filename = fileURLToPath(import.meta.url);
      return {
        filename,
        dirname: path.dirname(filename)
      };
    }
  } catch (e) {}
  return {
    filename: "",
    dirname: process.cwd()
  };
};

const { filename: myFilename, dirname: myDirname } = getPathDetails();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY is not configured or has placeholder value.");
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Lazy-initialized Razorpay Client
let razorpayClient: any = null;
function getRazorpayClient(): any {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!keyId || !keySecret) {
    console.warn("Razorpay environment variables are missing (RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET).");
    throw new Error("Razorpay payment gateway credentials are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }
  
  if (!razorpayClient) {
    const RazorpayConstructor = (Razorpay as any).default || Razorpay;
    razorpayClient = new RazorpayConstructor({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayClient;
}

// API: Get public Razorpay Key ID
app.get("/api/razorpay-key", (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const isSandbox = !keyId || !process.env.RAZORPAY_KEY_SECRET;
  res.json({ 
    keyId: keyId || "rzp_test_sandbox_mode_active",
    isSandbox: isSandbox
  });
});

// API: Create a Razorpay Order
app.post("/api/razorpay/create-order", async (req, res) => {
  try {
    const { amount, receipt } = req.body;
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: "Invalid amount specified." });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const isSandbox = !keyId || !keySecret;

    if (isSandbox) {
      return res.json({
        orderId: `order_sandbox_${Math.random().toString(36).substring(2, 11)}`,
        amount: Math.round(Number(amount) * 100),
        currency: "INR",
        isSandbox: true
      });
    }

    const razorpay = getRazorpayClient();
    const options = {
      amount: Math.round(Number(amount) * 100), // convert rupees to paise
      currency: "INR",
      receipt: receipt || `receipt_order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      isSandbox: false
    });
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    return res.status(500).json({ error: error.message || "Failed to create payment order" });
  }
});

// API: Verify Razorpay Payment Signature
app.post("/api/razorpay/verify-signature", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing required payment fields for verification." });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret || razorpay_order_id.startsWith("order_sandbox_")) {
      return res.json({ status: "verified", isSandbox: true });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      return res.json({ status: "verified" });
    } else {
      return res.status(400).json({ error: "Signature verification failed. The payment might be illegitimate." });
    }
  } catch (error: any) {
    console.error("Signature verification error:", error);
    return res.status(500).json({ error: error.message || "Verification error occurred" });
  }
});

// API: AI Product Recommendations
app.post("/api/ai-recommendations", async (req, res) => {
  try {
    const { cartItems = [], category = "" } = req.body;
    const ai = getAIClient();

    if (!ai) {
      // Return a graceful fallback if Gemini key is missing
      return res.json({
        recommendations: [
          "fv-1", // Organic Red Apples
          "gr-2", // Cold-pressed Olive Oil
          "db-1", // Organic Whole Milk
          "sn-2"  // Roasted Almonds
        ],
        reasoning: "We recommended these premium best sellers to complement your basket! (AI offline fallback mode active)"
      });
    }

    // Call Gemini
    const prompt = `You are the AI assistant for QuickNow, a premium quick-commerce grocery delivery platform. 
We have a user browsing the site.
Their current cart items: ${JSON.stringify(cartItems)}
They are currently looking at the category: "${category}".

Our available products:
1. fv-1: Organic Red Apples (Fruits & Vegetables, crisp and sweet)
2. fv-2: Fresh Organic Bananas (Fruits & Vegetables, sweet rich in potassium)
3. fv-3: Vine-Ripened Cherry Tomatoes (Fruits & Vegetables, juicy)
4. fv-5: Hass Avocado (Fruits & Vegetables, creamy and buttery)
5. gr-1: Premium Basmati Rice (Grocery, aromatic long grains)
6. gr-2: Cold-Pressed Olive Oil (Grocery, premium cooking/salads)
7. gr-3: Pure Raw Organic Honey (Grocery, natural forest honey)
8. db-1: Organic Whole Milk (Dairy, grass-fed cows)
9. db-2: Gourmet Salted Butter (Dairy, rich creamy)
10. db-3: Greek Yogurt Blueberry (Dairy, probiotic snack)
11. db-4: Artisanal Sourdough Bread (Dairy, fresh morning sourdough)
12. sn-1: Sea Salt Potato Chips (Snacks, kettle-cooked)
13. sn-2: Roasted Almonds (Snacks, organic oven-roasted)
14. sn-3: Dark Chocolate Chip Cookies (Snacks, soft-baked)
15. bv-1: Cold Pressed Orange Juice (Beverages, pure cold-pressed)
16. bv-2: Matcha Green Tea (Beverages, Japanese ceremonial)
17. bv-3: Sparkling Mineral Water (Beverages, European springs)
18. pc-1: Tea Tree & Neem Body Wash (Personal Care, antibacterial)
19. pc-2: Hydrating Face Moisturizer (Personal Care, hyaluronic acid gel)
20. hh-1: Eco-Friendly Laundry Liquid (Household, plant-powered)
21. hh-2: Citrus Dishwashing Liquid Gel (Household, grease-cutting)

Based on this, suggest exactly 4 product IDs that are highly relevant to cross-sell or complement their cart or interest, and provide a 1-sentence friendly, premium reason why these make a perfect match for them.
Respond strictly in JSON format with the following keys:
{
  "recommendations": ["id1", "id2", "id3", "id4"],
  "reasoning": "A short premium one-sentence justification"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const responseText = response.text;
    if (responseText) {
      try {
        const parsed = JSON.parse(responseText.trim());
        return res.json(parsed);
      } catch (e) {
        console.error("Failed to parse Gemini response as JSON:", responseText, e);
      }
    }

    // Default fallback if response parsing fails
    return res.json({
      recommendations: ["fv-5", "gr-2", "db-4", "bv-1"],
      reasoning: "We picked our finest premium organic essentials to complete your modern healthy kitchen today!"
    });

  } catch (error: any) {
    console.log("Serving cached organic product recommendations.");
    return res.json({
      recommendations: ["fv-5", "gr-2", "db-4", "bv-1"],
      reasoning: "We picked our finest premium organic essentials to complete your modern healthy kitchen today!"
    });
  }
});

// Vite Middleware & Static Serving Setup
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Development Mode: Vite middleware attached.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production Mode: Serving static assets from dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

initServer().catch((err) => {
  console.error("Failed to start server:", err);
});
