import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Check your .env.local file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Item = {
  id: string;
  name: string;
  barcode?: string;
  current_stock: number;
  unit: string;
  category?: string;
  low_stock_threshold?: number;
  created_at: string;
};

export type Transaction = {
  id: string;
  item_id: string;
  item_name: string;
  type: 'receive' | 'withdraw';
  quantity: number;
  notes?: string;
  line_user_id?: string;
  line_display_name?: string;
  line_picture_url?: string;
  created_at: string;
};
