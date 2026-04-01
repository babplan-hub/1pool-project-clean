require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const cors = require("cors");
const supabase = require("./db");
const cron = require("node-cron");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// -----------------------------
// 🔥 HELPER
// -----------------------------
const normalizeSlot = (slot) =>
  String(slot).replace(/\s/g, "").replace(/-/g, "").trim();

// -----------------------------
// 🔥 GET TABLES
// -----------------------------
app.get("/tables", async (req, res) => {
  try {
    const { data: tables, error: tablesError } = await supabase
      .from("tables")
      .select("*")
      .order("id", { ascending: true });

    if (tablesError) throw tablesError;

    const now = new Date().toISOString();

    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("table_no, end_time")
      .gt("end_time", now);

    if (bookingsError) throw bookingsError;

    const occupied = new Set(
      (bookings || []).map((b) => String(b.table_no))
    );

    const result = (tables || []).map((t) => ({
      ...t,
      status: occupied.has(String(t.id)) ? "occupied" : "available",
    }));

    res.json(result);
  } catch (err) {
    console.error("❌ TABLES ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// 🔥 GET TABLE STATUS
// -----------------------------
app.get("/table-status/:id", async (req, res) => {
  try {
    const tableId = String(req.params.id);
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("bookings")
      .select("id, end_time")
      .eq("table_no", tableId)
      .gt("end_time", now)
      .limit(1);

    if (error) throw error;

    res.json({ active: !!(data && data.length > 0) });
  } catch (err) {
    console.error("❌ TABLE STATUS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// 🔥 GET FOODS
// -----------------------------
app.get("/foods", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("foods")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error("❌ FOODS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// 🔥 GET BOOKINGS (ADMIN)
// -----------------------------
app.get("/bookings", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error("❌ GET BOOKINGS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// 🔥 DELETE BOOKING
// -----------------------------
app.delete("/booking/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({ message: "Booking deleted" });
  } catch (err) {
    console.error("❌ DELETE BOOKING ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// 🔥 GET BOOKED SLOTS
// -----------------------------
app.get("/booked-slots/:tableId", async (req, res) => {
  try {
    const tableId = req.params.tableId;
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("bookings")
      .select("slot, start_time, end_time")
      .eq("table_no", tableId)
      .gte("end_time", `${today}T00:00:00Z`);

    if (error) throw error;

    res.json(
      (data || []).map((b) => ({
        slot: normalizeSlot(b.slot),
        start: b.start_time,
        end: b.end_time,
      }))
    );
  } catch (err) {
    console.error("❌ BOOKED SLOTS ERROR:", err);
    res.status(500).json({ error: "Failed to load slots" });
  }
});

// -----------------------------
// 🔥 CREATE BOOKING
// -----------------------------
app.post("/booking", async (req, res) => {
  try {
    let { table_no, slots, total } = req.body;
    table_no = String(table_no);

    if (!table_no || !slots || slots.length === 0) {
      return res.status(400).json({ error: "Data missing" });
    }

    const now = new Date();

    const parseSlot = (slotStr) => {
      const [start, end] = String(slotStr).split(" - ");
      const today = new Date();

      const startTime = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        parseInt(start.split(":")[0]),
        parseInt(start.split(":")[1])
      );

      let endTime = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        parseInt(end.split(":")[0]),
        parseInt(end.split(":")[1])
      );

      if (endTime <= startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }

      return {
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      };
    };

    const { data: existing, error: existingError } = await supabase
      .from("bookings")
      .select("start_time, end_time")
      .eq("table_no", table_no)
      .gte("end_time", now.toISOString());

    if (existingError) throw existingError;

    for (const slot of slots) {
      const { start_time, end_time } = parseSlot(slot);

      const hasConflict = (existing || []).some((b) => {
        return (
          new Date(start_time) < new Date(b.end_time) &&
          new Date(end_time) > new Date(b.start_time)
        );
      });

      if (hasConflict) {
        return res.status(400).json({ error: `Slot ${slot} is already taken.` });
      }
    }

    const pricePerSlot = Math.floor(Number(total) / slots.length);

    const inserts = slots.map((slot, i) => {
      const { start_time, end_time } = parseSlot(slot);

      return {
        table_no,
        slot: normalizeSlot(slot),
        start_time,
        end_time,
        total:
          i === slots.length - 1
            ? Number(total) - pricePerSlot * (slots.length - 1)
            : pricePerSlot,
      };
    });

    const { error: insertError } = await supabase
      .from("bookings")
      .insert(inserts);

    if (insertError) throw insertError;

    res.json({ message: "Booking successful" });
  } catch (err) {
    console.error("❌ BOOKING ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// 🔥 ORDER FOOD
// -----------------------------
app.post("/order", async (req, res) => {
  try {
    let { table_no, items } = req.body;
    table_no = String(table_no);

    const { data: activeBooking, error: bookingError } = await supabase
      .from("bookings")
      .select("id")
      .eq("table_no", table_no)
      .gt("end_time", new Date().toISOString())
      .limit(1);

    if (bookingError) throw bookingError;

    if (!activeBooking || activeBooking.length === 0) {
      return res.status(400).json({
        error: "โต๊ะนี้ไม่มีการจองที่ใช้งานอยู่ ไม่สามารถสั่งอาหารได้",
      });
    }

    const foodIds = (items || []).map((i) => i.food_id);

    const { data: foods, error: foodsError } = await supabase
      .from("foods")
      .select("id, price")
      .in("id", foodIds);

    if (foodsError) throw foodsError;

    let calculatedTotal = 0;

    const orderItemsData = (items || []).map((item) => {
      const food = (foods || []).find((f) => f.id === item.food_id);

      if (!food) {
        throw new Error(`Food ID ${item.food_id} not found`);
      }

      calculatedTotal += Number(food.price) * Number(item.qty);

      return {
        food_id: item.food_id,
        qty: item.qty,
      };
    });

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([{ table_no, total: calculatedTotal }])
      .select()
      .single();

    if (orderError) throw orderError;

    const finalItems = orderItemsData.map((item) => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(finalItems);

    if (itemsError) throw itemsError;

    res.json({
      message: "Order success",
      order_id: order.id,
      total: calculatedTotal,
    });
  } catch (err) {
    console.error("❌ ORDER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// AUTO DELETE
// -----------------------------
cron.schedule("0 3 * * *", async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    console.log("🧹 Cleaning up old data...");

    const { error } = await supabase
      .from("bookings")
      .delete()
      .lt("end_time", yesterday.toISOString());

    if (error) throw error;
  } catch (err) {
    console.error("❌ CRON CLEANUP ERROR:", err);
  }
});

app.listen(5000, () => {
  console.log("🚀 1POOL SERVER RUNNING ON PORT 5000");
});