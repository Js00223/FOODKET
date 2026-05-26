import { createClient } from "@supabase/supabase-js";

// 🌟 하드코딩된 스트링 주소 대신, Vite 환경 변수 시스템에서 동적으로 가져옵니다!
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("환경 변수(Supabase URL/Key)가 누락되었습니다. .env 파일을 확인하세요.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);