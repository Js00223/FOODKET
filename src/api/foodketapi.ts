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

// --- 1. AI 관련 (레시피 추천 및 Supabase 저장) ---
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
 * AI가 추천한 레시피 기록을 로컬이 아닌 Supabase 'saved_recipes' 테이블에 직접 저장합니다.
 */
export const saveRecipeToServer = async (recipeData: any, userId: string) => {
  console.log("💾 Saving Recipe directly to Supabase for User:", userId);
  
  try {
    const { data, error } = await supabase
      .from("saved_recipes")
      .insert([
        {
          user_id: userId,
          recipe_id: recipeData.id || recipeData.recipe_id,
          name: recipeData.name,
          difficulty: recipeData.difficulty,
          time: recipeData.time,
          servings: recipeData.servings,
          ingredients: recipeData.ingredients, // Supabase Column Type: jsonb
          steps: recipeData.steps,             // Supabase Column Type: jsonb
          user_choices: recipeData.userChoices || recipeData.user_choices, // Supabase Column Type: jsonb
          saved_at: recipeData.savedAt || new Date().toISOString()
        }
      ])
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Supabase Recipe Save Error:", error);
    throw error;
  }
};

/**
 * 내가 저장한 AI 요리 추천 내역 전체를 불러옵니다. (마이페이지용)
 */
export const getMySavedRecipesFromServer = async (userId: string) => {
  console.log("🔍 Fetching Saved Recipes from Supabase for User:", userId);
  
  try {
    const { data, error } = await supabase
      .from("saved_recipes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Supabase Fetch Saved Recipes Error:", error);
    throw error;
  }
};

/**
 * 저장했던 AI 추천 레시피를 삭제합니다. (찜 취소 기능)
 */
export const deleteSavedRecipeFromServer = async (recipeId: string, userId: string) => {
  console.log("🗑️ Deleting Saved Recipe from Supabase:", recipeId);
  
  try {
    const { data, error } = await supabase
      .from("saved_recipes")
      .delete()
      .eq("user_id", userId)
      .eq("recipe_id", recipeId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Supabase Delete Saved Recipe Error:", error);
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
