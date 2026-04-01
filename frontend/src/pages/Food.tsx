import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Food = ({
  cart,
  addToCart,
  removeFromCart,
  tableTotal,
  selectedSlots,
  selectedTable,
  clearAll,
}: any) => {

  const navigate = useNavigate();

  const [category, setCategory] = useState("Snack");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const safeTableTotal = Number(tableTotal) || 0;

  // -----------------------------
  // LOAD MENU
  // -----------------------------
  useEffect(() => {
    fetch("http://localhost:5000/foods")
      .then(res => res.json())
      .then(setItems)
      .catch(err => {
        console.error("❌ LOAD FOODS ERROR:", err);
        alert("Failed to load menu");
      });
  }, []);

  const getQty = (id: string) =>
    cart.find((i: any) => i.id === id)?.qty || 0;

  const foodTotal = cart.reduce(
    (sum: number, i: any) => sum + i.price * i.qty,
    0
  );

  const grandTotal = safeTableTotal + foodTotal;

  // -----------------------------
  // 🔥 FIX: ORDER FOOD
  // navigate ไป success หลัง order + clearAll cart
  // -----------------------------
  const handleOrder = async () => {

    if (!selectedTable) {
      alert("No table selected");
      return;
    }

    if (!selectedSlots || selectedSlots.length === 0) {
      alert("Please book table first");
      return;
    }

    if (cart.length === 0) {
      alert("No food selected");
      return;
    }

    try {
      setLoading(true);

      const itemsPayload = cart.map((i: any) => ({
        food_id: i.id,
        qty: i.qty
      }));

      const res = await fetch("http://localhost:5000/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table_no: selectedTable.id,
          items: itemsPayload
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Order failed");
        setLoading(false);
        return;
      }

      // 🔥 FIX: navigate ไป success พร้อม state + clearAll
      clearAll();

      navigate("/success", {
        state: {
          table: selectedTable.id,
          slots: selectedSlots,
          cart: cart,
          total: grandTotal,
          method: "QR"
        }
      });

    } catch (err) {
      console.error("❌ ORDER ERROR:", err);
      alert("Order error");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white px-6 py-24">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-10">

        {/* LEFT */}
        <div className="lg:col-span-2">

          {/* CATEGORY */}
          <div className="flex gap-6 mb-10">
            {["Snack", "Drink", "Food"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`pb-1 border-b-2 ${
                  category === cat
                    ? "border-blue-500 text-blue-400"
                    : "text-white/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* ITEMS */}
          <div className="space-y-6">
            {items
              .filter((i) => i.category === category)
              .map((i) => (
                <div
                  key={i.id}
                  className="bg-white/5 border p-6 rounded-2xl flex justify-between items-center"
                >
                  <div className="flex items-center gap-6">
                    <img
                      src={i.image}
                      className="w-24 h-24 rounded-xl"
                    />
                    <div>
                      <p>{i.name}</p>
                      <p className="text-blue-400">฿{i.price}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-center">
                    <button onClick={() => removeFromCart(i.id)}>-</button>
                    <span>{getQty(i.id)}</span>
                    <button onClick={() => addToCart(i)}>+</button>
                  </div>
                </div>
              ))}
          </div>

        </div>

        {/* RIGHT - SUMMARY */}
        <div className="bg-white/5 p-8 rounded-2xl sticky top-28">

          <h3 className="mb-6">Summary</h3>

          {selectedTable && (
            <div className="mb-4 text-sm text-white/60">
              🍽 Table: {selectedTable.id}
            </div>
          )}

          {cart.map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.name} × {item.qty}</span>
              <span>฿{item.price * item.qty}</span>
            </div>
          ))}

          <div className="border-t my-4 pt-4 flex justify-between">
            <span>Total</span>
            <span>฿{grandTotal}</span>
          </div>

          {/* ORDER FOOD BUTTON */}
          <button
            onClick={handleOrder}
            disabled={loading || cart.length === 0}
            className="w-full py-3 bg-green-600 rounded-xl mb-3"
          >
            {loading ? "Processing..." : "Order Food (QR)"}
          </button>

          {/* CHECKOUT */}
          <button
            onClick={() => navigate("/cart")}
            disabled={grandTotal === 0}
            className="w-full py-3 bg-blue-600 rounded-xl"
          >
            Checkout
          </button>

        </div>

      </div>
    </div>
  );
};

export default Food;