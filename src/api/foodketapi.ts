import { supabase } from "../lib/supabase";
import axios from "axios";

/**
 * 환경에 따라 API 베이스 URL을 동적으로 결정합니다.
 */
const getApiBase = () => {
  // 환경 변수를 못 읽는 상황이라면 강제로 Render 주소를 반환하게 함
  const isProduction = window.location.hostname !== "localhost";

  if (isProduction) {
    // 여기에 본인의 실제 Render 주소를 직접 넣으세요
    return "https://foodket-idb5.onrender.com/api";
  }

  return "http://localhost:8000/api";
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
