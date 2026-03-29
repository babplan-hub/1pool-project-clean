import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "../supabaseClient"; // 🔥 เพิ่ม

const TableSelect = ({ onSelectTable, tables }: any) => {
  const navigate = useNavigate();

  // -----------------------------
  // 🔥 REALTIME TABLE STATUS
  // -----------------------------
  useEffect(() => {

    const channel = supabase
      .channel("tables-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        () => {
          console.log("🔥 TABLE UPDATE");
          window.location.reload(); // 🔥 รีโหลดง่ายสุดก่อน
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, []);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white">

      {/* HERO */}
      <div className="relative h-screen flex items-center justify-center text-center">

        <img
          src="/hero.jpg"
          className="absolute inset-0 w-full h-full object-cover"
          alt="Pool"
        />

        <div className="absolute inset-0 bg-black/70" />

        <div className="relative z-10 px-6">
          <p className="text-white/60 uppercase tracking-[0.5em] text-sm mb-6">
            Welcome to
          </p>

          <h1 className="text-5xl md:text-7xl font-bold mb-8">
            1POOL PLACE
          </h1>

          <button
            onClick={() =>
              document
                .getElementById("tables")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="px-10 py-4 bg-blue-600 rounded-full hover:bg-blue-700 transition"
          >
            Book Now
          </button>
        </div>
      </div>

      {/* TABLE LIST */}
      <div
        id="tables"
        className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-3 gap-8"
      >

        {tables.length === 0 && (
          <p className="text-center col-span-3">Loading tables...</p>
        )}

        {tables.map((t: any) => {

          const isAvailable = t.status === "available";

          return (
            <div
              key={t.id}
              className={`border rounded-2xl p-8 transition ${
                isAvailable
                  ? "bg-white/5 border-white/10 hover:bg-white/10"
                  : "bg-red-500/10 border-red-500/30"
              }`}
            >

              <h3 className="text-xl font-semibold mb-3">
                Table {t.id}
              </h3>

              <p className="text-white/60 mb-3">
                {t.type}
              </p>

              <p className="text-blue-400 text-lg mb-4">
                ฿{t.price} / hr
              </p>

              {/* 🔥 STATUS BADGE */}
              <div className="mb-6">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    isAvailable
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {isAvailable ? "Available" : "Booked"}
                </span>
              </div>

              {/* 🔥 BUTTON */}
              <button
                disabled={!isAvailable}
                onClick={() => {
                  onSelectTable(t);
                  navigate("/booking");
                }}
                className={`w-full py-3 rounded-xl transition ${
                  isAvailable
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-600 cursor-not-allowed"
                }`}
              >
                {isAvailable ? "Reserve" : "Unavailable"}
              </button>

            </div>
          );
        })}

      </div>
    </div>
  );
};

export default TableSelect;