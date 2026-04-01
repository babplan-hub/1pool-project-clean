import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const slots = [
  "10:00 - 11:00", "11:00 - 12:00", "12:00 - 13:00",
  "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00",
  "16:00 - 17:00", "17:00 - 18:00", "18:00 - 19:00",
  "19:00 - 20:00", "20:00 - 21:00", "21:00 - 22:00",
  "22:00 - 23:00", "23:00 - 00:00", "00:00 - 01:00",
  "01:00 - 02:00"
];

const Booking = ({
  table,
  selectedSlots,
  setSelectedSlots,
  tableTotal,
  confirmOrder,
}: any) => {

  const navigate = useNavigate();
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [now, setNow] = useState(new Date());

  // -----------------------------
  // 🔥 FIX 1: Normalize Function ให้เข้มงวดขึ้น
  // ลบช่องว่างทั้งหมด เพื่อให้ "10:00-11:00" เทียบกับ "10:00 - 11:00" ได้
  // -----------------------------
  const normalize = (s: string) => {
    if (!s) return "";
    return s.replace(/\s/g, "").replace(/-/g, "").trim();
  };

  // -----------------------------
  // ⏱ CLOCK
  // -----------------------------
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // -----------------------------
  // 🔥 FIX 2: LOAD BOOKED SLOTS พร้อม Debug Log
  // -----------------------------
  const loadBookedSlots = async () => {
    if (!table || !table.id) return;

    try {
      const res = await fetch(`http://localhost:5000/booked-slots/${table.id}`);
      const data = await res.json();
      
      if (Array.isArray(data)) {
        // เก็บค่า Raw Slot จาก DB มาเลย แล้วเราค่อยไป normalize ตอนเช็ค isSlotBooked
        const dbSlots = data.map((b: any) => String(b.slot));
        console.log("📥 Booked slots from DB:", dbSlots);
        setBookedSlots(dbSlots);
      }
    } catch (err) {
      console.error("❌ LOAD SLOT ERROR:", err);
    }
  };

  useEffect(() => {
    loadBookedSlots();
  }, [table]);

  // -----------------------------
  // 🔥 FIX 3: REALTIME - แก้ไขให้ดึงข้อมูลใหม่ทุกครั้งที่มีการเปลี่ยนแปลงในตาราง bookings
  // -----------------------------
  useEffect(() => {
    if (!table?.id) return;

    const channel = supabase
      .channel(`table-${table.id}`) // แยก channel ตาม table id จะแม่นยำกว่า
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "bookings"
          // คุณอาจจะเพิ่ม filter: `table_no=eq.${table.id}` ถ้าโครงสร้าง DB รองรับ
        },
        (payload) => {
          console.log("🔔 Realtime update received!", payload);
          loadBookedSlots();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table?.id]);

  // -----------------------------
  // ⏰ CURRENT SLOT
  // -----------------------------
  const isCurrentSlot = (slot: string) => {
    try {
      const today = now.toISOString().split("T")[0];
      const [start, end] = slot.split(" - ");

      const startTime = new Date(`${today}T${start}:00`);
      let endTime = new Date(`${today}T${end}:00`);

      // เคสข้ามคืน (เช่น 23:00 - 00:00)
      if (endTime <= startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }

      return now >= startTime && now < endTime;
    } catch (e) {
      return false;
    }
  };

  // -----------------------------
  // ⏳ COUNTDOWN
  // -----------------------------
  const getRemainingTime = (slot: string) => {
    const today = now.toISOString().split("T")[0];
    const [, end] = slot.split(" - ");

    let endTime = new Date(`${today}T${end}:00`);
    if (endTime <= now) endTime.setDate(endTime.getDate() + 1);

    const diff = Math.floor((endTime.getTime() - now.getTime()) / 1000);
    const min = Math.floor(diff / 60);
    const sec = diff % 60;

    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  // -----------------------------
  // 🔥 FIX 4: CHECK BOOKED เทียบแบบ normalize ทั้งคู่
  // -----------------------------
  const isSlotBooked = (slot: string) => {
    const target = normalize(slot);
    return bookedSlots.some((b) => normalize(b) === target);
  };

  // -----------------------------
  // SELECT SLOT
  // -----------------------------
  const toggleSlot = (slot: string) => {
    if (isSlotBooked(slot)) return;

    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter((s: string) => s !== slot));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  const validate = (): boolean => {
    if (!table || !table.id) { alert("Table error"); return false; }
    if (selectedSlots.length === 0) { alert("Please select time"); return false; }
    if (tableTotal <= 0) { alert("Invalid total"); return false; }
    return true;
  };

  const saveOrder = () => {
    confirmOrder({
      table_no: table.id,
      total: tableTotal,
      slots: selectedSlots
    });
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white px-6 py-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl mb-6">
          Booking Table {table?.id || "?"}
        </h1>

        <p className="text-white/60 mb-8">
          Select your time slot
        </p>

        {/* SLOT GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {slots.map((slot) => {
            const active = selectedSlots.includes(slot);
            const isBooked = isSlotBooked(slot);
            const isNow = isCurrentSlot(slot);

            return (
              <button
                key={slot}
                disabled={isBooked}
                onClick={() => toggleSlot(slot)}
                className={`p-4 rounded-xl border transition text-sm font-medium h-20 flex flex-col items-center justify-center ${
                  isBooked
                    ? "bg-red-700/50 border-red-700 text-white/50 cursor-not-allowed"
                    : active
                    ? "bg-blue-600 border-blue-400 text-white"
                    : isNow
                    ? "bg-yellow-400 border-yellow-300 text-black animate-pulse"
                    : "bg-white/5 border-white/10 hover:bg-white/10 text-white"
                }`}
              >
                {isBooked ? (
                  <>
                    <span className="text-lg">🔒</span>
                    <span>Booked</span>
                  </>
                ) : isNow ? (
                  <div>
                    <div>⏱ Now</div>
                    <div className="text-xs font-bold">{getRemainingTime(slot)}</div>
                  </div>
                ) : (
                  <span>{slot}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* SUMMARY */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <p className="text-white/60">Table: <span className="text-white font-bold">{table?.id}</span></p>
          <p className="text-white/60">Slots: <span className="text-white font-bold">{selectedSlots.length}</span></p>
          <p className="text-blue-400 text-2xl mt-2">Total: ฿{tableTotal}</p>
        </div>

        {/* BUTTONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => {
              if (!validate()) return;
              saveOrder();
              navigate("/cart");
            }}
            className="w-full py-4 bg-green-600 rounded-xl hover:bg-green-700 font-bold"
          >
            Pay Table Now
          </button>

          <button
            onClick={() => {
              if (!validate()) return;
              saveOrder();
              navigate("/food");
            }}
            className="w-full py-4 bg-blue-600 rounded-xl hover:bg-blue-700 font-bold"
          >
            Order Food First
          </button>
        </div>
      </div>
    </div>
  );
};

export default Booking;