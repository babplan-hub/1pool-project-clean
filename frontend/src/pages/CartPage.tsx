import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CartPage = ({
  cart,
  table,
  tableTotal,
  selectedSlots,
  confirmOrder,
  clearAll,
}: any) => {

  const navigate = useNavigate();

  const [tableNumber, setTableNumber] = useState(
    table ? table.id : ""
  );

  const [showPayment, setShowPayment] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const [lockedTotal, setLockedTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // 🔥 FIX: sync table
  // -----------------------------
  useEffect(() => {
    if (table?.id) {
      setTableNumber(table.id);
      localStorage.setItem("table", String(table.id));
    } else {
      const saved = localStorage.getItem("table");
      if (saved) setTableNumber(saved);
    }
  }, [table]);

  // -----------------------------
  // CALCULATE TOTAL
  // -----------------------------
  useEffect(() => {
    const foodTotal = cart.reduce(
      (sum: number, item: any) =>
        sum + Number(item.price) * Number(item.qty),
      0
    );

    const safeTableTotal = Number(tableTotal ?? 0);
    const total = foodTotal + safeTableTotal;

    setLockedTotal(total);
  }, [cart, tableTotal]);

  // -----------------------------
  // MAIN FUNCTION
  // -----------------------------
  const handleConfirm = async (method: string) => {

    if (loading) return;

    if (!tableNumber) {
      alert("Please enter table number");
      return;
    }

    if (lockedTotal <= 0) {
      alert("Invalid total");
      return;
    }

    const cleanTable = Number(String(tableNumber).replace(/\D/g, ""));

    if (!cleanTable) {
      alert("Invalid table number");
      return;
    }

    try {
      setLoading(true);

      console.log("🧼 CLEAN TABLE:", cleanTable);

      // =========================
      // 🎱 BOOKING MODE
      // =========================
      if (selectedSlots && selectedSlots.length > 0) {

        const res = await fetch("http://localhost:5000/booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            table_no: cleanTable,
            total: lockedTotal,
            slots: selectedSlots
          })
        });

        const data = await res.json();
        console.log("📥 BOOKING RESPONSE:", data);

        if (!res.ok) {
          alert(data.error || "Booking failed");
          setLoading(false);
          return;
        }

      } else {

        // =========================
        // 🍔 ORDER MODE
        // =========================
        const itemsPayload = cart.map((i: any) => ({
          food_id: i.id,
          qty: i.qty
        }));

        const res = await fetch("http://localhost:5000/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            table_no: cleanTable,
            items: itemsPayload
          })
        });

        const data = await res.json();
        console.log("📥 ORDER RESPONSE:", data);

        if (!res.ok) {
          alert(data.error || "Order failed");
          setLoading(false);
          return;
        }
      }

      // =========================
      // ✅ SUCCESS
      // 🔥 FIX: confirmOrder เรียกครั้งเดียวที่นี่ ไม่ซ้ำกับ Booking.tsx
      // =========================
      confirmOrder({
        table_no: cleanTable,
        total: lockedTotal,
        slots: selectedSlots,
        method
      });

      clearAll();

      navigate("/success", {
        state: {
          table: cleanTable,
          slots: selectedSlots,
          cart: cart,
          total: lockedTotal,
          method
        }
      });

    } catch (err) {
      console.error("❌ PAYMENT ERROR:", err);
      alert("Payment failed");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center px-6">

      <div className="bg-white/5 border border-white/10 p-10 rounded-2xl w-105">

        <h2 className="text-xl mb-6">Checkout</h2>

        <div className="mb-4 text-sm text-white/60">
          Table: <span className="text-blue-400">{tableNumber}</span>
        </div>

        <div className="mb-4 text-xs text-yellow-400">
          {selectedSlots?.length > 0
            ? "🎱 Booking Mode"
            : "🍔 Order Mode (QR)"}
        </div>

        {cart.map((item: any) => (
          <div key={item.id} className="flex justify-between text-sm mb-2">
            <span>{item.name} × {item.qty}</span>
            <span>฿{item.price * item.qty}</span>
          </div>
        ))}

        {tableTotal > 0 && selectedSlots?.length > 0 && (
          <div className="flex justify-between text-sm mt-2">
            <span>Table Booking</span>
            <span>฿{tableTotal}</span>
          </div>
        )}

        <div className="border-t border-white/10 my-4" />

        <div className="flex justify-between text-lg mb-6">
          <span>Total</span>
          <span className="text-blue-400">฿{lockedTotal}</span>
        </div>

        <button
          onClick={() => setShowPayment(true)}
          disabled={lockedTotal <= 0}
          className="w-full py-3 bg-blue-600 rounded-xl hover:bg-blue-700"
        >
          Proceed to Payment
        </button>

      </div>

      {/* PAYMENT MODAL */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#111827] p-8 rounded-2xl w-95 text-center">

            <h3 className="text-lg mb-6">Select Payment Method</h3>

            <button
              onClick={() => {
                setShowPayment(false);
                setShowQR(true);
              }}
              className="w-full py-3 bg-blue-600 rounded-xl mb-4"
            >
              Pay with QR
            </button>

            <button
              onClick={() => handleConfirm("Counter")}
              disabled={loading}
              className="w-full py-3 bg-gray-700 rounded-xl"
            >
              {loading ? "Processing..." : "Pay at Counter"}
            </button>

          </div>
        </div>
      )}

      {/* QR MODAL */}
      {showQR && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#111827] p-8 rounded-2xl text-center w-100">

            <h3 className="text-lg mb-6">Scan QR to Pay</h3>

            <div className="bg-white p-6 rounded-2xl mb-6 flex justify-center">
              <img
                src="/qrhong.jpg"
                className="w-72 object-contain"
              />
            </div>

            <p className="text-blue-400 text-2xl mb-6">฿{lockedTotal}</p>

            <button
              onClick={() => handleConfirm("QR")}
              disabled={loading}
              className="w-full py-3 bg-blue-600 rounded-xl"
            >
              {loading ? "Processing..." : "Confirm Payment"}
            </button>

            <button
              onClick={() => setShowQR(false)}
              className="mt-4 text-sm text-gray-400"
            >
              Cancel
            </button>

          </div>
        </div>
      )}

    </div>
  );
};

export default CartPage;