import { supabase } from "../lib/supabase";
import axios from "axios";

/**
 * 환경에 따라 API 베이스 URL을 결정합니다.
 */
const getApiBase = () => {
  // 1. Vercel 환경 변수가 있다면 최우선 (배포 환경용)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  const hostname = window.location.hostname;

  // 2. GitHub Codespaces 환경 감지
  if (hostname.includes("github.dev")) {
    const baseUrl = hostname.split("-5173")[0];
    return `https://${baseUrl}-8000.app.github.dev/api`;
  }

  // 3. 기본 로컬 환경
  return "http://localhost:8000/api";
};

const API_BASE = getApiBase();

// --- AI 관련 ---
export const getAiRecipe = async (ingredients: string[], userId: string) => {
  // AI 기능 호출 시 주소가 제대로 잡혔는지 콘솔에서 확인 가능
  console.log("Calling AI API at:", `${API_BASE}/ai/recommend`);
  
  const { data } = await axios.post(`${API_BASE}/ai/recommend`, {
    ingredients,
    user_id: userId,
  });
  return data;
};

// --- 거래 게시판 관련 --- (Supabase는 클라이언트 설정을 따르므로 그대로 유지)
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

// --- 커뮤니티 댓글 관련 ---
export const getComments = async (postId: number) => {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId);
  if (error) throw error;
  return data;
};
