import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const slots = [
  "10:00 - 11:00","11:00 - 12:00","12:00 - 13:00",
  "13:00 - 14:00","14:00 - 15:00","15:00 - 16:00",
  "16:00 - 17:00","17:00 - 18:00","18:00 - 19:00",
  "19:00 - 20:00","20:00 - 21:00","21:00 - 22:00",
  "22:00 - 23:00","23:00 - 00:00","00:00 - 01:00",
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
  const [now, setNow] = useState(new Date()); // 🔥 ใช้ realtime clock

  // -----------------------------
  // ⏱ CLOCK UPDATE ทุกวินาที
  // -----------------------------
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // -----------------------------
  // โหลด slot
  // -----------------------------
  const loadBookedSlots = () => {
    if (!table) return;

    fetch(`http://localhost:5000/booked-slots/${table.id}`)
      .then(res => res.json())
      .then(data => {
        setBookedSlots(data.map((b: any) => b.slot));
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadBookedSlots();
  }, [table]);

  // -----------------------------
  // REALTIME
  // -----------------------------
  useEffect(() => {
    if (!table) return;

    const channel = supabase
      .channel("booking-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        () => {
          loadBookedSlots();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table]);

  // -----------------------------
  // 🔥 ตรวจ slot ปัจจุบัน
  // -----------------------------
  const isCurrentSlot = (slot: string) => {
    const today = now.toISOString().split("T")[0];
    const [start, end] = slot.split(" - ");

    const startTime = new Date(`${today} ${start}`);
    const endTime = new Date(`${today} ${end}`);

    if (endTime <= startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }

    return now >= startTime && now < endTime;
  };

  // -----------------------------
  // ⏳ countdown นาที
  // -----------------------------
  const getRemainingTime = (slot: string) => {
    const today = now.toISOString().split("T")[0];
    const [, end] = slot.split(" - ");

    const endTime = new Date(`${today} ${end}`);
    if (endTime <= now) {
      endTime.setDate(endTime.getDate() + 1);
    }

    const diff = Math.floor((endTime.getTime() - now.getTime()) / 1000);

    const min = Math.floor(diff / 60);
    const sec = diff % 60;

    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  // -----------------------------
  // SELECT SLOT
  // -----------------------------
  const toggleSlot = (slot: string) => {
    if (bookedSlots.includes(slot)) return;

    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter((s: string) => s !== slot));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  // -----------------------------
  // VALIDATE
  // -----------------------------
  const validate = () => {
    if (!table || !table.id) return alert("Table error");
    if (selectedSlots.length === 0) return alert("Please select time");
    if (tableTotal <= 0) return alert("Invalid total");
    return true;
  };

  // -----------------------------
  // SAVE ORDER
  // -----------------------------
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

        {/* SLOT */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {slots.map((slot) => {

            const active = selectedSlots.includes(slot);
            const isBooked = bookedSlots.includes(slot);
            const isNow = isCurrentSlot(slot);

            return (
              <button
                key={slot}
                disabled={isBooked}
                onClick={() => toggleSlot(slot)}
                className={`p-4 rounded-xl border transition text-sm font-medium ${
                  isBooked
                    ? "bg-red-700 border-red-700 text-white opacity-70 cursor-not-allowed"
                    : active
                    ? "bg-blue-600 border-blue-400 text-white"
                    : isNow
                    ? "bg-yellow-400 border-yellow-300 text-black animate-pulse"
                    : "bg-white/5 border-white/10 hover:bg-white/10 text-white"
                }`}
              >
                {isBooked ? (
                  "🔒 Booked"
                ) : isNow ? (
                  <div>
                    <div>⏱ Now</div>
                    <div className="text-xs">{getRemainingTime(slot)}</div>
                  </div>
                ) : (
                  slot
                )}
              </button>
            );
          })}
        </div>

        {/* SUMMARY */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <p>Table: {table?.id}</p>
          <p>Slots: {selectedSlots.length}</p>
          <p className="text-blue-400 text-xl">
            Total: ฿{tableTotal}
          </p>
        </div>

        {/* BUTTON */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <button
            onClick={() => {
              if (!validate()) return;
              saveOrder();
              navigate("/cart");
            }}
            className="w-full py-4 bg-green-600 rounded-xl hover:bg-green-700"
          >
            Pay Table Now
          </button>

          <button
            onClick={() => {
              if (!validate()) return;
              saveOrder();
              navigate("/food");
            }}
            className="w-full py-4 bg-blue-600 rounded-xl hover:bg-blue-700"
          >
            Order Food First
          </button>

        </div>

      </div>
    </div>
  );
};

export default Booking;