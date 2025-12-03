import { createClient } from '@supabase/supabase-js'

// .env.localに書いた鍵を読み込みます
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// これを使ってデータベースと通信します
export const supabase = createClient(supabaseUrl, supabaseAnonKey)