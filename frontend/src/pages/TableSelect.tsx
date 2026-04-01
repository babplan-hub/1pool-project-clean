import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "../supabaseClient";

const TableSelect = ({ onSelectTable, tables }: any) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // -----------------------------
  // 🔥 1. REALTIME SUBSCRIPTION
  // -----------------------------
  useEffect(() => {
    // ติดตามการเปลี่ยนแปลงของตาราง bookings เพื่ออัปเดตสถานะโต๊ะแบบ Realtime
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
          console.log("🔥 DATA CHANGED: Refreshing logic...");
          // ในกรณีที่มีการจองใหม่ หรือการจองหมดเวลา 
          // เราอาจจะเรียก function ดึงข้อมูล tables ใหม่จาก parent (ถ้ามี)
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // -----------------------------
  // 🔥 2. QR AUTO FLOW & RESTORE LOGIC
  // -----------------------------
  useEffect(() => {
    if (!tables || tables.length === 0) return;

    const tableIdFromQR = searchParams.get("table");
    const savedTableId = localStorage.getItem("table");
    
    // ลำดับความสำคัญ: 1. QR Code 2. LocalStorage
    const targetId = tableIdFromQR || savedTableId;

    if (targetId) {
      const found = tables.find(
        (t: any) => String(t.id) === String(targetId)
      );

      if (found) {
        onSelectTable(found);
        
        // ถ้ามาจาก QR ให้เช็คสถานะเพื่อ Navigate อัตโนมัติ
        if (tableIdFromQR) {
          localStorage.setItem("table", String(found.id));
          checkTableStatusAndNavigate(found.id);
        }
      }
    }
  }, [tables, searchParams]); // รันเมื่อข้อมูลตารางมาถึง หรือ URL เปลี่ยน

  // Helper สำหรับเช็คสถานะโต๊ะ
  const checkTableStatusAndNavigate = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:5000/table-status/${id}`);
      const data = await res.json();
      
      if (data.active) {
        // มีการจองค้างอยู่ ให้ไปหน้าสั่งอาหาร
        navigate("/food");
      } else {
        // โต๊ะว่าง ให้ไปหน้าจองเวลา
        navigate("/booking");
      }
    } catch (err) {
      console.error("❌ STATUS CHECK ERROR:", err);
    }
  };

  const handleSelectTable = (t: any) => {
    onSelectTable(t);
    localStorage.setItem("table", String(t.id));
    navigate("/booking");
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white">
      {/* HERO SECTION */}
      <div className="relative h-screen flex items-center justify-center text-center">
        <img
          src="/hero.jpg"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          alt="Billiards Club"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/60 to-[#0b0f19]" />

        <div className="relative z-10 px-6">
          <p className="text-blue-400 uppercase tracking-[0.4em] text-xs font-semibold mb-4">
            Premium Snooker & Pool Experience
          </p>
          <h1 className="text-6xl md:text-8xl font-black mb-8 italic tracking-tighter">
            1POOL<span className="text-blue-600">PLACE</span>
          </h1>
          <button
            onClick={() => document.getElementById("tables")?.scrollIntoView({ behavior: "smooth" })}
            className="px-12 py-4 bg-blue-600 rounded-full font-bold text-lg hover:bg-blue-700 hover:scale-105 transition-all shadow-lg shadow-blue-600/20"
          >
            SELECT A TABLE
          </button>
        </div>
      </div>

      {/* TABLE GRID */}
      <div id="tables" className="max-w-7xl mx-auto px-6 py-32">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <h2 className="text-4xl font-bold mb-2">Our Tables</h2>
            <p className="text-white/40">เลือกโต๊ะที่ต้องการเพื่อเริ่มการจองหรือสั่งอาหาร</p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div> Available
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div> Occupied
            </div>
          </div>
        </div>

        {tables.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tables.map((t: any) => {
              const isAvailable = t.status === "available";

              return (
                <div
                  key={t.id}
                  className={`group relative border rounded-3xl p-8 transition-all duration-300 ${
                    isAvailable
                      ? "bg-white/5 border-white/10 hover:border-blue-500/50 hover:bg-white/10"
                      : "bg-red-500/5 border-red-500/20 opacity-80"
                  }`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-bold group-hover:text-blue-400 transition-colors">
                        Table {t.id}
                      </h3>
                      <p className="text-white/50 text-sm">{t.type}</p>
                    </div>
                    <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      isAvailable ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }`}>
                      {isAvailable ? "Available" : "Occupied"}
                    </span>
                  </div>

                  <div className="mb-8">
                    <span className="text-3xl font-bold text-blue-400">฿{t.price}</span>
                    <span className="text-white/40 text-sm ml-2">/ hour</span>
                  </div>

                  <button
                    disabled={!isAvailable}
                    onClick={() => handleSelectTable(t)}
                    className={`w-full py-4 rounded-2xl font-bold transition-all ${
                      isAvailable
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
                        : "bg-white/5 text-white/20 cursor-not-allowed"
                    }`}
                  >
                    {isAvailable ? "Book This Table" : "Fully Booked"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TableSelect;