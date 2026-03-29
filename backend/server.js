require("dotenv").config({ path: __dirname + "/.env" }); // 🔥 FIX สำคัญสุด

const express = require("express");
const cors = require("cors");
const supabase = require("./db");
const cron = require("node-cron");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// -----------------------------
// DEBUG ENV
// -----------------------------
console.log("URL:", process.env.SUPABASE_URL);
console.log("KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 25));

// -----------------------------
// TEST
// -----------------------------
app.get("/", (req, res) => {
  res.send("Pool Backend Running");
});

// -----------------------------
// TEST DB
// -----------------------------
app.get("/test-db", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tables")
      .select("*")
      .limit(1);

    if (error) throw error;

    res.json({ message: "DB Connected", data });
  } catch (err) {
    console.error("❌ TEST DB ERROR:", err);
    res.status(500).json({ error: "DB failed" });
  }
});

// -----------------------------
// GET TABLES
// -----------------------------
app.get("/tables", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tables")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("❌ TABLE ERROR:", err);
    res.status(500).json({ error: "Failed to fetch tables" });
  }
});

// -----------------------------
// GET FOODS
// -----------------------------
app.get("/foods", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("foods")
      .select("*");

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("❌ FOOD ERROR:", err);
    res.status(500).json({ error: "Failed to fetch foods" });
  }
});

// -----------------------------
// GET BOOKINGS
// -----------------------------
app.get("/bookings", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("start_time", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("❌ BOOKINGS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// -----------------------------
// DELETE BOOKING
// -----------------------------
app.delete("/booking/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("❌ DELETE ERROR:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// -----------------------------
// CREATE BOOKING (FULL LOGIC)
// -----------------------------
app.post("/booking", async (req, res) => {
  try {
    const { table_no, total, slots } = req.body;

    if (!table_no) {
      return res.status(400).json({ error: "Missing table" });
    }

    const now = new Date().toISOString();

    // -----------------------------
    // FOOD ONLY
    // -----------------------------
    if (!slots || slots.length === 0) {
      const { error } = await supabase
        .from("bookings")
        .insert([
          {
            table_no,
            slot: "FOOD",
            start_time: now,
            end_time: now,
            total
          }
        ]);

      if (error) throw error;

      return res.json({ message: "Food order success" });
    }

    // -----------------------------
    // PARSE SLOT
    // -----------------------------
    const parseSlot = (slot) => {
      const [start, end] = slot.split(" - ");
      const today = new Date().toISOString().split("T")[0];

      const start_time = new Date(`${today} ${start}`);
      const end_time = new Date(`${today} ${end}`);

      if (end_time <= start_time) {
        end_time.setDate(end_time.getDate() + 1);
      }

      return { start_time, end_time };
    };

    // -----------------------------
    // CHECK CONFLICT
    // -----------------------------
    const { data: existing = [] } = await supabase
      .from("bookings")
      .select("start_time, end_time")
      .eq("table_no", table_no)
      .gt("end_time", now);

    for (let slot of slots) {
      const { start_time, end_time } = parseSlot(slot);

      const isConflict = existing.some((b) => {
        const bStart = new Date(b.start_time);
        const bEnd = new Date(b.end_time);

        return start_time < bEnd && end_time > bStart;
      });

      if (isConflict) {
        return res.status(400).json({
          error: `Slot ${slot} already booked`
        });
      }
    }

    // -----------------------------
    // INSERT MULTIPLE
    // -----------------------------
    const inserts = slots.map((slot) => {
      const { start_time, end_time } = parseSlot(slot);

      return {
        table_no,
        slot,
        start_time,
        end_time,
        total
      };
    });

    const { error } = await supabase
      .from("bookings")
      .insert(inserts);

    if (error) throw error;

    res.json({ message: "Booking success" });

  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    res.status(500).json({ error: "Booking failed" });
  }
});

// -----------------------------
// GET BOOKED SLOTS
// -----------------------------
app.get("/booked-slots/:tableId", async (req, res) => {
  try {
    const { tableId } = req.params;

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("table_no", tableId)
      .gt("end_time", now);

    if (error) throw error;

    res.json(data);

  } catch (err) {
    console.error("❌ SLOT ERROR:", err);
    res.status(500).json({ error: "Failed" });
  }
});

// -----------------------------
// AUTO DELETE (ทุกวันตี 2)
// -----------------------------
cron.schedule("0 2 * * *", async () => {
  console.log("🕑 Auto deleting old bookings...");

  const { error } = await supabase
    .from("bookings")
    .delete()
    .lt("end_time", new Date().toISOString());

  if (error) {
    console.error("❌ AUTO DELETE ERROR:", error);
  } else {
    console.log("✅ Old bookings deleted");
  }
});

// -----------------------------
app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});