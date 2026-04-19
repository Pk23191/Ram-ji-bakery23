import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { defaultCustomization, normalizeProduct } from "../data/site";
import api, { setAdminAuthToken } from "../utils/api";
import { calculateCartTotal, getUnitPrice } from "../utils/helpers";

const ShopContext = createContext();

export function ShopProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [userPreferences, setUserPreferences] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customCake, setCustomCake] = useState(defaultCustomization);
  const [adminToken, setAdminToken] = useState("");
  const [adminUser, setAdminUser] = useState(null);
  const [customerSession, setCustomerSession] = useState(null);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [coupon, setCoupon] = useState(null);

  useEffect(() => {
    const savedCart = window.localStorage.getItem("ramji-cart");
    const savedPrefs = window.localStorage.getItem("ramji-prefs");
    const savedOrders = window.localStorage.getItem("ramji-orders");
    const savedToken = window.localStorage.getItem("ramji-admin-token");
    const savedAdminUser = window.localStorage.getItem("ramji-admin-user");
    const savedCustomerSession = window.localStorage.getItem("ramji-customer-session");
    const savedCoupon = window.localStorage.getItem("ramji-coupon");

    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    if (savedPrefs) {
      setUserPreferences(JSON.parse(savedPrefs));
    }
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
    if (savedToken) {
      setAdminToken(savedToken);
      setAdminAuthToken(savedToken);
    }
    if (savedAdminUser) {
      setAdminUser(JSON.parse(savedAdminUser));
    }
    if (savedCustomerSession) {
      setCustomerSession(JSON.parse(savedCustomerSession));
    }
    if (savedCoupon) {
      setCoupon(JSON.parse(savedCoupon));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("ramji-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    window.localStorage.setItem("ramji-prefs", JSON.stringify(userPreferences));
  }, [userPreferences]);

  useEffect(() => {
    window.localStorage.setItem("ramji-orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    window.localStorage.setItem("ramji-admin-token", adminToken);
    setAdminAuthToken(adminToken);
  }, [adminToken]);

  useEffect(() => {
    if (adminUser) {
      window.localStorage.setItem("ramji-admin-user", JSON.stringify(adminUser));
    } else {
      window.localStorage.removeItem("ramji-admin-user");
    }
  }, [adminUser]);

  useEffect(() => {
    if (customerSession) {
      window.localStorage.setItem("ramji-customer-session", JSON.stringify(customerSession));
    } else {
      window.localStorage.removeItem("ramji-customer-session");
    }
  }, [customerSession]);

  useEffect(() => {
    if (coupon) {
      window.localStorage.setItem("ramji-coupon", JSON.stringify(coupon));
    } else {
      window.localStorage.removeItem("ramji-coupon");
    }
  }, [coupon]);

  useEffect(() => {
    let active = true;

    async function loadCatalogProducts() {
      try {
        const { data } = await api.get("/products");
        if (active) {
          setCatalogProducts(Array.isArray(data) ? data.map((product) => normalizeProduct(product)) : []);
        }
      } catch (error) {
        if (active) {
          setCatalogProducts([]);
        }
      }
    }

    loadCatalogProducts();

    return () => {
      active = false;
    };
  }, []);

  const addPreference = (label) => {
    setUserPreferences((prev) => {
      const next = [...prev, label];
      return next.slice(-12);
    });
  };

  const addToCart = (product, quantity = 1, customizations = null) => {
    const unitPrice = getUnitPrice(product);
    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item._id === product._id &&
          JSON.stringify(item.customizations || {}) === JSON.stringify(customizations || {})
      );

      if (existing) {
        return prev.map((item) =>
          item === existing ? { ...item, quantity: item.quantity + quantity } : item
        );
      }

      return [
        ...prev,
        {
          ...product,
          cartItemId: `${product._id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          price: unitPrice,
          finalPrice: unitPrice,
          originalPrice: product.originalPrice ?? product.price ?? unitPrice,
          discountPercent: product.discountPercent || 0,
          quantity,
          customizations
        }
      ];
    });

    addPreference(product.category);
    if (product.flavors?.[0]) {
      addPreference(product.flavors[0].toLowerCase());
    }
    toast.success(`${product.name} added to cart`);
  };

  const removeFromCart = (cartItemId) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId, quantity) => {
    setCart((prev) =>
      prev
        .map((item) => (item.cartItemId === cartItemId ? { ...item, quantity: Math.max(1, quantity) } : item))
        .filter(Boolean)
    );
  };

  const placeOrder = (orderData) => {
    const newOrder = {
      id: orderData.orderId || `RB${Math.floor(Math.random() * 9000 + 1000)}`,
      customer: orderData.customer || orderData.name,
      customerEmail: orderData.customerEmail || customerSession?.email || "",
      phone: orderData.phone || customerSession?.phone || "",
      status: orderData.status || "Pending",
      total: orderData.total ?? calculateCartTotal(cart),
      createdAt: (orderData.orderTime || new Date().toISOString()).split("T")[0],
      items: orderData.items || cart,
      address: orderData.address,
      cancelReason: orderData.cancelReason || "",
      cancelledBy: orderData.cancelledBy || ""
    };

    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);
    return newOrder;
  };

  const updateOrderInState = (updatedOrder) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === updatedOrder.orderId || order.id === updatedOrder.id
          ? {
              ...order,
              id: updatedOrder.orderId || updatedOrder.id,
              status: updatedOrder.status,
              cancelReason: updatedOrder.cancelReason || "",
              cancelledBy: updatedOrder.cancelledBy || "",
              total: updatedOrder.total ?? order.total,
              createdAt: (updatedOrder.orderTime || updatedOrder.createdAt || order.createdAt).split("T")[0]
            }
          : order
      )
    );
  };

  const recommendedProducts = useMemo(
    () =>
      catalogProducts.filter((product) =>
        userPreferences.some(
          (entry) =>
            entry.toLowerCase().includes(product.category.toLowerCase().split(" ")[0]) ||
            product.flavors?.some((flavor) => entry.includes(flavor.toLowerCase()))
        )
      ),
    [catalogProducts, userPreferences]
  );
  const cartTotal = useMemo(() => calculateCartTotal(cart), [cart]);
  const recommendedList = useMemo(
    () => (recommendedProducts.length ? recommendedProducts : catalogProducts.slice(0, 3)),
    [recommendedProducts, catalogProducts]
  );

  const value = useMemo(
    () => ({
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      cartTotal,
      orders,
      placeOrder,
      updateOrderInState,
      customCake,
      setCustomCake,
      recommendedProducts: recommendedList,
      adminToken,
      setAdminToken,
      adminUser,
      setAdminUser,
      customerSession,
      setCustomerSession,
      coupon,
      setCoupon
    }),
    [
      cart,
      cartTotal,
      orders,
      customCake,
      recommendedList,
      adminToken,
      adminUser,
      customerSession,
      coupon
    ]
  );

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
}

export const useShop = () => useContext(ShopContext);
