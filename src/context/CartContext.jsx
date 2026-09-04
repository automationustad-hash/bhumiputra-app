import { createContext, useContext, useEffect, useState, useMemo } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "bhumiputra_cart_v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (listing, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.listing_id === listing.id);
      if (existing) {
        return prev.map((i) =>
          i.listing_id === listing.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          listing_id: listing.id,
          farmer_id: listing.farmer_id,
          crop_name: listing.crop_name,
          unit: listing.unit,
          price_per_unit: listing.price_per_unit,
          quantity,
        },
      ];
    });
  };

  const updateQuantity = (listingId, quantity) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.listing_id !== listingId)
        : prev.map((i) => (i.listing_id === listingId ? { ...i, quantity } : i))
    );
  };

  const removeItem = (listingId) => {
    setItems((prev) => prev.filter((i) => i.listing_id !== listingId));
  };

  const clearCart = () => setItems([]);

  // Orders are placed per-farmer (each order maps to one farmer's fulfillment).
  // Adding produce from a different farmer than what's already in the cart
  // replaces the cart rather than silently mixing two orders together.
  const canAddFromFarmer = (farmerId) =>
    items.length === 0 || items[0].farmer_id === farmerId;

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.price_per_unit * i.quantity, 0),
    [items]
  );

  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        total,
        count,
        canAddFromFarmer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
