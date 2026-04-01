import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  useSearchParams,
  useNavigate
} from "react-router-dom";

import Navbar from "./components/Navbar";
import TableSelect from "./pages/TableSelect";
import Booking from "./pages/Booking";
import Food from "./pages/Food";
import CartPage from "./pages/CartPage";
import HistoryPage from "./pages/HistoryPage";
import Success from "./pages/Success";
import Contact from "./pages/Contact";
import TutorList from "./pages/TutorList";
import Admin from "./pages/Admin";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

function AppWrapper() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  // -----------------------------
  // LOAD TABLES
  // -----------------------------
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await fetch("http://localhost:5000/tables");
        const data = await res.json();
        setTables(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchTables();

    const channel = supabase
      .channel("tables-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tables",
        },
        () => fetchTables()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // -----------------------------
  // 🔥 FIX 1: QR TABLE (สำคัญมาก)
  // -----------------------------
  useEffect(() => {
    const tableId = searchParams.get("table");

    if (tableId && tables.length > 0) {
      console.log("📱 URL TABLE:", tableId);

      const found = tables.find(
        (t) => String(t.id) === String(tableId) // ✅ FIX
      );

      if (found) {
        console.log("✅ FOUND TABLE:", found);

        setSelectedTable(found);

        // 🔥 save กันหาย
        localStorage.setItem("table", String(found.id));

        navigate("/booking");
      } else {
        console.log("❌ TABLE NOT FOUND");
      }
    }
  }, [tables]);

  // -----------------------------
  // 🔥 FIX 2: RESTORE TABLE
  // -----------------------------
  useEffect(() => {
    const saved = localStorage.getItem("table");

    if (!saved || tables.length === 0) return;

    const found = tables.find(
      (t) => String(t.id) === String(saved)
    );

    if (found) {
      console.log("💾 RESTORE TABLE:", found);
      setSelectedTable(found);
    }
  }, [tables]);

  // -----------------------------
  // CART
  // -----------------------------
  const addToCart = (product: any) => {
    setCart((prev) => {
      const exist = prev.find((i) => i.id === product.id);

      if (exist) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }

      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.id === id ? { ...i, qty: i.qty - 1 } : i
        )
        .filter((i) => i.qty > 0)
    );
  };

  // -----------------------------
  // TOTAL
  // -----------------------------
  const tableTotal =
    selectedTable && selectedSlots.length > 0
      ? selectedSlots.length * selectedTable.price
      : 0;

  const foodTotal = cart.reduce(
    (sum, i) => sum + i.price * i.qty,
    0
  );

  const grandTotal = tableTotal + foodTotal;

  // -----------------------------
  // CLEAR
  // -----------------------------
  const clearAll = () => {
    setCart([]);
    setSelectedSlots([]);
    setSelectedTable(null);
    localStorage.removeItem("table"); // 🔥 เพิ่ม
  };

  // -----------------------------
  // CONFIRM
  // -----------------------------
  const confirmOrder = (orderData: any) => {
    const fullOrder = {
      ...orderData,
      id: Date.now(),
      table: selectedTable?.id || orderData.table_no || null,
      slots: orderData.slots || selectedSlots,
      tableTotal,
      foodTotal,
      total: grandTotal,
    };

    setHistory((prev) => [fullOrder, ...prev]);
  };

  // -----------------------------
  // LOADING
  // -----------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white">
      <Navbar historyCount={history.length} />

      <Routes>

        <Route
          path="/"
          element={
            <TableSelect
              onSelectTable={setSelectedTable}
              tables={tables}
            />
          }
        />

        <Route
          path="/booking"
          element={
            <Booking
              table={selectedTable}
              selectedSlots={selectedSlots}
              setSelectedSlots={setSelectedSlots}
              tableTotal={tableTotal}
              confirmOrder={confirmOrder}
            />
          }
        />

        <Route
          path="/food"
          element={
            <Food
              cart={cart}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
              tableTotal={tableTotal}
              selectedSlots={selectedSlots}
              selectedTable={selectedTable}
            />
          }
        />

        <Route
          path="/cart"
          element={
            <CartPage
              cart={cart}
              table={selectedTable}
              tableTotal={tableTotal}
              selectedSlots={selectedSlots}
              confirmOrder={confirmOrder}
              clearAll={clearAll}
            />
          }
        />

        <Route path="/tutorlist" element={<TutorList />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/history" element={<HistoryPage history={history} />} />
        <Route path="/success" element={<Success />} />
        <Route path="/admin" element={<Admin />} />

      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;