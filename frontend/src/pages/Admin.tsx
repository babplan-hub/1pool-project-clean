import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const ADMIN_PASSWORD = "1234";

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString();
};

const Admin = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [password, setPassword] = useState("");

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = () => {
    fetch("http://localhost:5000/bookings")
      .then(res => res.json())
      .then(data => {
        setBookings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAuth) return;

    loadBookings();

    const channel = supabase
      .channel("admin-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        () => loadBookings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuth]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this bill?")) return;

    await fetch(`http://localhost:5000/booking/${id}`, {
      method: "DELETE"
    });

    loadBookings();
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuth(true);
    } else {
      alert("Wrong password");
    }
  };

  // 🔐 LOGIN
  if (!isAuth) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-white">
        <div className="bg-white/5 p-10 rounded-2xl w-87.5 text-center">
          <h2 className="text-2xl mb-6">🔐 Admin Login</h2>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-xl bg-white/10 mb-4"
          />
          <button
            onClick={handleLogin}
            className="w-full py-3 bg-blue-600 rounded-xl"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="text-white text-center mt-20">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white p-10">

      <h1 className="text-3xl mb-8">🧾 Booking Bills</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

        {bookings.map((b) => (
          <div
            key={b.id}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl"
          >
            {/* HEADER */}
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Table {b.table_no}
              </h2>
              <span className="text-sm text-white/50">
                #{b.id}
              </span>
            </div>

            {/* TIME */}
            <div className="mb-4 text-sm text-white/70">
              <p>📅 {formatDate(b.start_time)}</p>
              <p>
                🕒 {formatTime(b.start_time)} - {formatTime(b.end_time)}
              </p>
            </div>

            {/* SLOT */}
            <div className="mb-4 text-blue-400 text-sm">
              {b.slot}
            </div>

            {/* TOTAL */}
            <div className="border-t border-white/10 pt-4 mb-4">
              <p className="text-lg">
                Total: <span className="text-green-400">฿{b.total}</span>
              </p>
            </div>

            {/* ACTION */}
            <button
              onClick={() => handleDelete(b.id)}
              className="w-full py-2 bg-red-600 rounded-xl hover:bg-red-700"
            >
              Delete
            </button>

          </div>
        ))}

      </div>

    </div>
  );
};

export default Admin;