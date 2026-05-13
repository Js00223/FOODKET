import { supabase } from "../lib/supabase";
import axios from "axios";

const getApiBase = () => {
  // 1. Vercel 환경 변수 확인
  let envUrl = import.meta.env.VITE_API_URL;

  if (envUrl) {
    // 끝에 슬래시가 있다면 제거
    envUrl = envUrl.replace(/\/$/, "");
    // 만약 환경변수에 /api가 안 붙어있다면 붙여줌 (유연한 대응)
    return envUrl.endsWith("/api") ? envUrl : `${envUrl}/api`;
  }

  const hostname = window.location.hostname;

  // 2. GitHub Codespaces 환경
  if (hostname.includes("github.dev")) {
    const baseUrl = hostname.split("-5173")[0];
    return `https://${baseUrl}-8000.app.github.dev/api`;
  }

  // 3. 로컬 환경
  return "http://localhost:8000/api";
};

const API_BASE = getApiBase();

// --- AI 관련 ---
export const getAiRecipe = async (ingredients: string[], userId: string) => {
  // 최종 호출 주소를 콘솔에 찍어 모바일 크롬 inspect로 확인할 수 있게 함
  const targetUrl = `${API_BASE}/ai/recommend`;
  console.log("🚀 API Request to:", targetUrl);
  
  const { data } = await axios.post(targetUrl, {
    ingredients,
    user_id: userId,
  });
  return data;
};

// --- 이하 동일 (거래 게시판, 댓글 관련 코드) ---
export const getTradePosts = async () => {
  const { data, error } = await supabase
    .from("trades")
    .select(`*, users(nickname, avatar_url)`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};

export const createTradePost = async (postData: any) => {
  const { data, error } = await supabase.from("trades").insert(postData);
  if (error) throw error;
  return data;
};

export const getComments = async (postId: number) => {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId);
  if (error) throw error;
  return data;
};
