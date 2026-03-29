import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://rbbwgoodjidmcvsspamo.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiYndnb29kamlkbWN2c3NwYW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzI2NTksImV4cCI6MjA4ODIwODY1OX0.Sg7FSnLxooNTeKaNFuWE7IbjHS5wC91fG1reLrEoLxI"; // ❗ ไปเอาจาก Supabase dashboard

export const supabase = createClient(supabaseUrl, supabaseKey);