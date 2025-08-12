import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { productsAPI, salesAPI } from "../api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Cart from "@/components/sales/Cart";

export default function SalesPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [customerName, setCustomerName] = useState("");
  const [sales, setSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => setProducts(await productsAPI.getAll());

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          stock: product.stock,
        },
      ];
    });
  };

  const updateQuantity = (product_id, qty) => {
    setCart((prev) =>
      prev.map((i) =>
        i.product_id === product_id ? { ...i, quantity: Math.max(1, qty) } : i
      )
    );
  };

  const removeFromCart = (product_id) =>
    setCart((prev) => prev.filter((i) => i.product_id !== product_id));

  const completeSale = async () => {
    if (cart.length === 0) return alert("Cart empty");
    try {
      const payload = {
        items: cart.map((c) => ({
          product_id: c.product_id,
          quantity: c.quantity,
          price: c.price,
        })),
        payment_method: paymentMethod,
        customer_name: customerName,
      };

      const res = await salesAPI.create(payload);
      if (res && res.id) {
        alert(`Sale completed. Sale ID: ${res.id}`);
        setCart([]);
        await loadProducts();
      } else {
        throw new Error(res.error || "Unknown error");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      <div className="col-span-2">
        <h1 className="text-2xl font-semibold">Point of Sale</h1>
        <p className="text-sm text-muted-foreground">
          Process transactions and manage sales.
        </p>

        <div className="relative mt-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((p) => (
            <Card
              key={p.id}
              className="cursor-pointer"
              onClick={() => addToCart(p)}
            >
              <CardContent className="space-y-2 p-4 text-center">
                <Avatar className="mx-auto h-16 w-16 rounded-lg">
                  <AvatarFallback className="text-3xl">
                    {p.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="font-medium leading-none">{p.name}</div>
                <div className="text-sm text-muted-foreground">
                  {p.category}
                </div>
                <div className="text-xl font-bold text-primary">
                  ₹{p.price}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Cart
        cart={cart}
        cartTotal={cartTotal}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        customerName={customerName}
        setCustomerName={setCustomerName}
        completeSale={completeSale}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
      />
    </div>
  );
}
