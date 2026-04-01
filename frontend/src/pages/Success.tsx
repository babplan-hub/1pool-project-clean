import { useLocation, useNavigate } from "react-router-dom";

const Success = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    return (
      <div className="text-white text-center mt-20">
        No receipt data
      </div>
    );
  }

  const { table, slots, cart, total, method } = state;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex justify-center items-center px-6">

      <div className="bg-white/5 border border-white/10 p-10 rounded-2xl w-105 text-center">

        {/* ✅ COMPLETE */}
        <h2 className="text-2xl mb-2 font-semibold text-green-400">
          Payment Complete
        </h2>

        <p className="text-white/60 mb-6 text-sm">
          กรุณาแคปหน้าจอนี้ไว้เป็นหลักฐานการชำระเงิน
        </p>

        {/* RECEIPT */}
        <div className="text-left bg-black/30 p-4 rounded-xl mb-6">

          <p className="text-sm mb-2">Table: {table}</p>
          <p className="text-sm mb-2">Payment: {method}</p>

          {/* 🔥 FIX: optional chaining กัน crash ถ้า slots undefined */}
          {slots && slots.length > 0 && (
            <div className="mb-3">
              <p className="text-white/50 text-xs">Slots</p>
              {slots.map((s: string, i: number) => (
                <p key={i} className="text-sm">{s}</p>
              ))}
            </div>
          )}

          {/* 🔥 FIX: optional chaining กัน crash ถ้า cart undefined */}
          {cart && cart.length > 0 && (
            <div className="mb-3">
              <p className="text-white/50 text-xs">Items</p>
              {cart.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.name} × {item.qty}</span>
                  <span>฿{item.price * item.qty}</span>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-white/10 my-3" />

          <div className="flex justify-between text-lg">
            <span>Total</span>
            <span className="text-blue-400">฿{total}</span>
          </div>

        </div>

        {/* BUTTONS */}
        <button
          onClick={() => window.print()}
          className="w-full py-3 bg-green-600 rounded-xl mb-3 hover:bg-green-700"
        >
          Print Receipt
        </button>

        <button
          onClick={() => navigate("/")}
          className="w-full py-3 bg-blue-600 rounded-xl hover:bg-blue-700"
        >
          Back to Home
        </button>

      </div>
    </div>
  );
};

export default Success;