import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase"; // Supabase 클라이언트 경로 확인 필요
import { getMySavedRecipesFromServer, deleteSavedRecipeFromServer } from "../../api/Foodketapi";

export const AiRecipes: React.FC = () => {
  const [myRecipes, setMyRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // 1. 현재 로그인한 유저 세션 가져오기
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      } else {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  // 2. 오직 '본인'이 저장했던 AI 추천 기록만 서버에서 조회
  useEffect(() => {
    const loadMyRecipes = async () => {
      if (!currentUserId) return;
      setLoading(true);
      try {
        const data = await getMySavedRecipesFromServer(currentUserId);
        if (data) {
          setMyRecipes(data);
        }
      } catch (error) {
        console.error("내 AI 레시피 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUserId) {
      loadMyRecipes();
    }
  }, [currentUserId]);

  // 3. 선택한 레시피 삭제 처리 (본인 기록 편집)
  const handleDeleteRecipe = async (recipeId: string, recipeName: string) => {
    if (!currentUserId) return;
    
    const confirmDelete = window.confirm(`'${recipeName}' 레시피를 보관함에서 삭제하시겠습니까?`);
    if (!confirmDelete) return;

    try {
      // Supabase 서버에서 삭제 요청
      await deleteSavedRecipeFromServer(recipeId, currentUserId);
      
      // 프론트엔드 State 상태에서도 즉시 제외하여 실시간으로 화면 갱신
      setMyRecipes((prev) => prev.filter((recipe) => recipe.recipe_id !== recipeId));
      alert("삭제되었습니다.");
    } catch (error) {
      console.error("레시pi 삭제 오류:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  if (loading) return <div className="text-center py-10 font-medium text-gray-500">AI 레시피 기록 로드 중...</div>;
  if (!currentUserId) return <div className="text-center py-10 font-medium text-red-500">로그인이 필요한 서비스입니다.</div>;

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">📋 나의 AI 요리 추천 기록</h2>
        <span className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
          총 {myRecipes.length}개
        </span>
      </div>

      {myRecipes.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500 text-lg">아직 저장된 AI 추천 레시피 기록이 없습니다.</p>
          <p className="text-gray-400 text-sm mt-1">냉장고 메뉴에서 AI 추천을 받고 기록을 보관해 보세요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myRecipes.map((recipe) => (
            <div 
              key={recipe.id} 
              className="relative p-5 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <h3 className="text-lg font-bold text-gray-900 pr-8">{recipe.name}</h3>
                <div className="flex gap-2 mt-2 mb-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">⏱️ {recipe.time}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">🔥 {recipe.difficulty}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">🍽️ {recipe.servings}</span>
                </div>

                <div className="mb-3">
                  <span className="text-xs font-semibold text-gray-400 block mb-1">포함된 재료</span>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {Array.isArray(recipe.ingredients) ? recipe.ingredients.join(", ") : "재료 정보 없음"}
                  </p>
                </div>
              </div>

              {/* ❌ 우측 상단 편집/삭제 버튼 */}
              <button
                onClick={() => handleDeleteRecipe(recipe.recipe_id, recipe.name)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-gray-50 transition-colors"
                title="레시피 기록 삭제"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default AiRecipes;
