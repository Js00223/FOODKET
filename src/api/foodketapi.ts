import { supabase } from "../lib/supabase";
import axios from "axios";

/**
 * 환경에 따라 API 베이스 URL을 동적으로 결정합니다.
 */
const getApiBase = () => {
  // 로컬 환경인지 확인
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  if (isLocal) {
    // 로컬 백엔드 주소
    return "http://localhost:8000/api";
  }

  // 실제 배포된 Render 백엔드 주소 (idb5 버전으로 고정)
  // 뒤에 /api를 붙여서 엔드포인트 구조를 맞춥니다.
  return "https://foodket-idb5.onrender.com/api";
};

const API_BASE = getApiBase();

// --- 1. AI 관련 (레시피 추천 및 저장) ---

/**
 * AI에게 식재료 기반 레시피 추천을 요청합니다.
 */
export const getAiRecipe = async (ingredients: string[], userId: string) => {
  const targetUrl = `${API_BASE}/ai/recommend`;
  
  // 디버깅을 위해 호출하는 최종 주소를 콘솔에 출력
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

/**
 * 생성된 AI 레시피 기록을 백엔드 서버 데이터베이스에 저장합니다.
 */
export const saveRecipeToServer = async (recipeData: any, userId: string) => {
  // 하드코딩된 주소 대신 상단의 동적 API_BASE와 매핑된 엔드포인트를 적용했습니다.
  const targetUrl = `${API_BASE}/recipe/save`;
  
  console.log("💾 Saving Recipe to API:", targetUrl);

  try {
    const { data } = await axios.post(targetUrl, {
      user_id: userId, // 백엔드 네이밍 컨벤션(snake_case)에 맞춤형 가공이 필요하다면 여기서 매핑 가능합니다.
      recipe: recipeData,
    });
    return data;
  } catch (error) {
    console.error("Server Save API Error:", error);
    throw error;
  }
};

// --- 2. 거래 게시판 관련 ---
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

// --- 3. 커뮤니티 댓글 관련 ---
export const getComments = async (postId: number) => {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId);
  if (error) throw error;
  return data;
};

/**
 * 참고: 이후에 추가적인 API 호출 함수가 필요하면 
 * 아래에 동일한 방식으로 API_BASE를 사용하여 추가하면 됩니다.
 */
