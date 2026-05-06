import { supabase } from "../lib/supabase";
import axios from "axios";

/**
 * 환경에 따라 API 베이스 URL을 동적으로 결정합니다.
 * 1. .env 파일의 VITE_API_URL 설정이 있으면 최우선 적용
 * 2. 코드스페이스 환경(.github.dev)인 경우 해당 도메인에 맞춰 8000번 포트로 주소 생성
 * 3. 그 외(로컬) 환경은 localhost:8000 사용
 */
const getApiBase = () => {
  // 환경변수가 설정되어 있다면 사용
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  const hostname = window.location.hostname;

  // GitHub Codespaces 환경 감지
  if (hostname.includes('github.dev')) {
    // 현재 프론트엔드 호스트네임에서 포트 부분(-5173 등)을 떼어내고 백엔드 포트(-8000)를 붙입니다.
    // 보통 '유저명-레포명-랜덤값-5173.app.github.dev' 형태입니다.
    const baseUrl = hostname.split('-5173')[0];
    return `https://${baseUrl}-8000.app.github.dev/api`;
  }

  // 기본 로컬 환경
  return "http://localhost:8000/api";
};

const API_BASE = getApiBase();

// --- AI 관련 ---
export const getAiRecipe = async (ingredients: string[], userId: string) => {
  const { data } = await axios.post(`${API_BASE}/ai/recommend`, {
    ingredients,
    user_id: userId,
  });
  return data;
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