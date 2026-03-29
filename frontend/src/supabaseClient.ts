import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://rbbwgoodjidmcvsspamo.supabase.co";
const supabaseKey = "YOUR_ANON_PUBLIC_KEY"; // ❗ ไปเอาจาก Supabase dashboard

export const supabase = createClient(supabaseUrl, supabaseKey);