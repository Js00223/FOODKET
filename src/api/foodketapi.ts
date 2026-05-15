import { supabase } from "../lib/supabase";
import axios from "axios";

/**
 * 환경에 따라 API 베이스 URL을 동적으로 결정합니다.
 */
const getApiBase = () => {
  // 1. Vercel 환경 변수 확인
  let envUrl = import.meta.env.VITE_API_URL;

  if (envUrl) {
    // 끝에 슬래시가 있다면 제거
    envUrl = envUrl.replace(/\/$/, "");
    
    // [보안강화] 모바일 Mixed Content 차단을 막기 위해 http를 https로 강제 변환
    if (envUrl.startsWith("http://") && !envUrl.includes("localhost")) {
      envUrl = envUrl.replace("http://", "https://");
    }

    // 만약 환경변수에 /api가 안 붙어있다면 붙여줌
    return envUrl.endsWith("/api") ? envUrl : `${envUrl}/api`;
  }

  const hostname = window.location.hostname;

  // 2. GitHub Codespaces 환경 감지
  if (hostname.includes("github.dev")) {
    const baseUrl = hostname.split("-5173")[0];
    return `https://${baseUrl}-8000.app.github.dev/api`;
  }

  // 3. 로컬 환경
  return "https://foodket-2.onrender.com/api";
};

const API_BASE = getApiBase();

// --- AI 관련 ---
export const getAiRecipe = async (ingredients: string[], userId: string) => {
  const targetUrl = `${API_BASE}/ai/recommend`;
  
  // 배포 환경에서 모바일 디버깅을 위해 콘솔에 주소 출력
  console.log("🚀 Calling API:", targetUrl);
  
  try {
    const { data } = await axios.post(targetUrl, {
      ingredients,
      user_id: userId,
    });
    return data;
  } catch (error) {
    console.error("AI Recipe Fetch Error:", error);
    throw error;
  }
};

// --- 거래 게시판 관련 ---
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
