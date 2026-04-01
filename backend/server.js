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
// ปรับให้ Normalize ได้สะอาดขึ้น ทั้งช่องว่างและขีดกลาง
const normalizeSlot = (slot) => slot.replace(/\s/g, "").replace(/-/g, "").trim();

// -----------------------------
// 🔥 GET BOOKED SLOTS (FIXED)
// -----------------------------
app.get("/booked-slots/:tableId", async (req, res) => {
  try {
    const tableId = req.params.tableId;
    // ใช้ช่วงเวลาของ "วันนี้" ทั้งหมดเพื่อให้ Frontend กรองได้แม่นยำ
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("bookings")
      .select("slot, start_time, end_time")
      .eq("table_no", tableId)
      .gte("end_time", `${today}T00:00:00Z`); // ดึงตั้งแต่ต้นวันมาเช็ค

    if (error) throw error;

    // ส่งออกไปทั้ง slot ที่ normalize แล้ว และเวลาจริง
    res.json(data.map((b) => ({ 
      slot: normalizeSlot(b.slot),
      start: b.start_time,
      end: b.end_time
    })));

  } catch (err) {
    console.error("❌ BOOKED SLOTS ERROR:", err);
    res.status(500).json({ error: "Failed to load slots" });
  }
});

// -----------------------------
// 🔥 CREATE BOOKING (IMPROVED)
// -----------------------------
app.post("/booking", async (req, res) => {
  try {
    let { table_no, slots, total } = req.body;
    table_no = String(table_no);

    if (!table_no || !slots || slots.length === 0) {
      return res.status(400).json({ error: "Data missing" });
    }

    const now = new Date();
    
    // ฟังก์ชันคำนวณเวลาแบบรองรับข้ามคืน
    const parseSlot = (slotStr) => {
      const [start, end] = slotStr.split(" - ");
      const today = new Date();
      
      // สร้าง Date object โดยอิงจากวันที่ปัจจุบัน (Local Time)
      const startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 
                        parseInt(start.split(":")[0]), parseInt(start.split(":")[1]));
      let endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 
                      parseInt(end.split(":")[0]), parseInt(end.split(":")[1]));

      // ถ้าเวลาจบ น้อยกว่าหรือเท่ากับเวลาเริ่ม แปลว่าข้ามไปอีกวัน (เช่น 23:00 - 01:00)
      if (endTime <= startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }
      return { start_time: startTime.toISOString(), end_time: endTime.toISOString() };
    };

    // 1. ตรวจสอบการจองซ้ำ (Server-side Validation)
    const { data: existing } = await supabase
      .from("bookings")
      .select("start_time, end_time")
      .eq("table_no", table_no)
      .gte("end_time", now.toISOString());

    for (let slot of slots) {
      const { start_time, end_time } = parseSlot(slot);
      const hasConflict = existing?.some(b => {
        return (new Date(start_time) < new Date(b.end_time) && new Date(end_time) > new Date(b.start_time));
      });

      if (hasConflict) {
        return res.status(400).json({ error: `Slot ${slot} is already taken.` });
      }
    }

    // 2. เตรียมข้อมูล Insert (หารยอดเงินเฉลี่ยต่อ Slot)
    const pricePerSlot = Math.floor(total / slots.length);
    const inserts = slots.map((slot, i) => {
      const { start_time, end_time } = parseSlot(slot);
      return {
        table_no,
        slot: normalizeSlot(slot),
        start_time,
        end_time,
        total: i === slots.length - 1 ? total - (pricePerSlot * (slots.length - 1)) : pricePerSlot
      };
    });

    const { error: insertError } = await supabase.from("bookings").insert(inserts);
    if (insertError) throw insertError;

    res.json({ message: "Booking successful" });

  } catch (err) {
    console.error("❌ BOOKING ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// 🔥 ORDER FOOD (FIXED SECURITY)
// -----------------------------
app.post("/order", async (req, res) => {
  try {
    let { table_no, items } = req.body;
    table_no = String(table_no);

    // 1. ตรวจสอบว่าโต๊ะนี้มีการจองที่ยังไม่หมดเวลาจริงๆ หรือไม่
    const { data: activeBooking } = await supabase
      .from("bookings")
      .select("id")
      .eq("table_no", table_no)
      .gt("end_time", new Date().toISOString())
      .limit(1);

    if (!activeBooking || activeBooking.length === 0) {
      return res.status(400).json({ error: "โต๊ะนี้ไม่มีการจองที่ใช้งานอยู่ ไม่สามารถสั่งอาหารได้" });
    }

    // 2. ดึงราคาจาก Database (ห้ามเชื่อราคาจาก Frontend)
    const foodIds = items.map(i => i.food_id);
    const { data: foods } = await supabase.from("foods").select("id, price").in("id", foodIds);

    let calculatedTotal = 0;
    const orderItemsData = items.map(item => {
      const food = foods.find(f => f.id === item.food_id);
      if (!food) throw new Error(`Food ID ${item.food_id} not found`);
      calculatedTotal += food.price * item.qty;
      return { food_id: item.food_id, qty: item.qty };
    });

    // 3. สร้าง Order หลัก
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([{ table_no, total: calculatedTotal }])
      .select().single();

    if (orderError) throw orderError;

    // 4. สร้าง Order Items โดยโยงกับ ID ของ Order หลัก
    const finalItems = orderItemsData.map(item => ({
      ...item,
      order_id: order.id
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(finalItems);
    if (itemsError) throw itemsError;

    res.json({ message: "Order success", order_id: order.id, total: calculatedTotal });

  } catch (err) {
    console.error("❌ ORDER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// AUTO DELETE (ปรับเวลาให้เหมาะสม)
// -----------------------------
cron.schedule("0 3 * * *", async () => {
  // ลบรายการที่จบไปแล้วมากกว่า 24 ชม. เพื่อเก็บ History ไว้ดูบ้างช่วงสั้นๆ
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  console.log("🧹 Cleaning up old data...");
  await supabase.from("bookings").delete().lt("end_time", yesterday.toISOString());
});

app.listen(5000, () => console.log("🚀 1POOL SERVER RUNNING ON PORT 5000"));