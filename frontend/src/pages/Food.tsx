import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Food = ({
  cart,
  addToCart,
  removeFromCart,
  tableTotal,
  selectedSlots,
  selectedTable,
}: any) => {

  const navigate = useNavigate();

  const [category, setCategory] = useState("Snack");
  const [items, setItems] = useState<any[]>([]);

  const safeTableTotal = Number(tableTotal) || 0;

  // 🔥 โหลดเมนูจาก database
  useEffect(() => {

    fetch("http://127.0.0.1:5000/foods")
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
      });

  }, []);

  const getQty = (id: string) =>
    cart.find((i: any) => i.id === id)?.qty || 0;

  const foodTotal = cart.reduce(
    (sum: number, i: any) => sum + i.price * i.qty,
    0
  );

  const grandTotal = safeTableTotal + foodTotal;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white px-6 py-24">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-10">

        {/* LEFT SIDE */}
        <div className="lg:col-span-2">

          {/* CATEGORY NAV */}
          <div className="flex gap-6 mb-10">

            {["Snack", "Drink", "Food"].map((cat) => (

              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`pb-1 border-b-2 transition ${
                  category === cat
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-white/50 hover:text-white"
                }`}
              >
                {cat}
              </button>

            ))}

          </div>

          {/* FOOD ITEMS */}
          <div className="space-y-6">

            {items
              .filter((i) => i.category === category)
              .map((i) => (

                <div
                  key={i.id}
                  className="bg-white/5 border border-white/10 p-6 rounded-2xl flex justify-between items-center"
                >

                  <div className="flex items-center gap-6">

                    <img
                      src={i.image}
                      alt={i.name}
                      className="w-24 h-24 object-cover rounded-xl"
                    />

                    <div>
                      <p className="text-lg">{i.name}</p>
                      <p className="text-blue-400">฿{i.price}</p>
                    </div>

                  </div>

                  <div className="flex items-center gap-3">

                    <button
                      onClick={() => removeFromCart(i.id)}
                      className="w-8 h-8 bg-white/10 rounded-full hover:bg-white/20 transition"
                    >
                      -
                    </button>

                    <span className="w-6 text-center">
                      {getQty(i.id)}
                    </span>

                    <button
                      onClick={() => addToCart(i)}
                      className="w-8 h-8 bg-blue-600 rounded-full hover:scale-110 transition"
                    >
                      +
                    </button>

                  </div>

                </div>

              ))}

          </div>

        </div>

        {/* RIGHT SIDE SUMMARY */}
        <div className="bg-white/5 border border-white/10 p-8 rounded-2xl h-fit sticky top-28">

          <h3 className="text-lg mb-6">Summary</h3>

          {/* TABLE INFO */}
          {selectedTable && (

            <div className="mb-6 text-sm text-white/70">

              <p>
                Table:
                <span className="text-blue-400 ml-2">
                  {selectedTable.id}
                </span>
              </p>

              {selectedSlots && selectedSlots.length > 0 && (

                <div className="mt-2 text-white/50">

                  {selectedSlots.map((slot: string) => (
                    <p key={slot}>• {slot}</p>
                  ))}

                </div>

              )}

            </div>

          )}

          {/* TABLE TOTAL */}
          <div className="flex justify-between mb-3 text-white/70">
            <span>Table Total</span>
            <span>฿{safeTableTotal}</span>
          </div>

          {/* FOOD LIST */}
          <div className="space-y-2 mb-4">

            {cart.length === 0 ? (

              <p className="text-white/40 text-sm">
                No food selected
              </p>

            ) : (

              cart.map((item: any) => (

                <div
                  key={item.id}
                  className="flex justify-between text-sm"
                >

                  <span>
                    {item.name} × {item.qty}
                  </span>

                  <span>
                    ฿{item.price * item.qty}
                  </span>

                </div>

              ))

            )}

          </div>

          {/* GRAND TOTAL */}
          <div className="border-t border-white/10 pt-4 mb-6">

            <div className="flex justify-between text-xl">

              <span>Total</span>

              <span className="text-blue-400">
                ฿{grandTotal}
              </span>

            </div>

          </div>

          <button
            disabled={grandTotal === 0}
            onClick={() => navigate("/cart")}
            className="w-full py-3 bg-blue-600 rounded-xl hover:bg-blue-700 transition disabled:opacity-40"
          >
            Checkout
          </button>

        </div>

      </div>
    </div>
  );
};

export default Food;