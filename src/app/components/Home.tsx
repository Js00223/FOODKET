import { useState, useEffect } from "react";
import { Link } from "react-router";
import { supabase } from "../../utils/supabaseClient";
import { Bot, Users, ShoppingCart, Clock, TrendingUp } from "lucide-react";

// 데이터 타입 정의
interface TradeItem {
  id: string;
  title: string;
  item_name?: string;
  price?: number;
  image_url?: string;
  content?: string;
  type: "trade" | "community";
  created_at: string;
  user?: {
    full_name: string;
    avatar_url: string;
  };
}

export default function Home() {
  const [recipes, setRecipes] = useState<TradeItem[]>([]);
  const [trades, setTrades] = useState<TradeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);

      // 1. 인기 레시피 (community 타입) 가져오기
      const { data: recipeData, error: recipeError } = await supabase
        .from("trades")
        .select("*")
        .eq("type", "community")
        .order("created_at", { ascending: false })
        .limit(3);

      // 2. 최근 거래 (trade 타입) 가져오기
      const { data: tradeData, error: tradeError } = await supabase
        .from("trades")
        .select("*")
        .eq("type", "trade")
        .order("created_at", { ascending: false })
        .limit(3);

      if (recipeError) throw recipeError;
      if (tradeError) throw tradeError;

      setRecipes(recipeData || []);
      setTrades(tradeData || []);
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - 모바일 좌우 패딩 확실하게 확보 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-orange-500">자취요리 AI</h1>
          <p className="text-sm text-gray-600 mt-1">
            혼자서도 맛있게, 간편하게
          </p>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        {/* AI 추천 배너 */}
        <Link to="/ai-chat" className="block mb-6">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 lg:p-8 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl lg:text-2xl font-bold mb-2">
                  AI 요리 추천
                </h2>
                <p className="text-sm lg:text-base opacity-90">
                  지금 먹고 싶은 음식을 찾아보세요
                </p>
              </div>
              <Bot className="w-12 h-12 lg:w-16 lg:h-16 opacity-80" />
            </div>
          </div>
        </Link>

        {/* 빠른 메뉴 - 고정 높이와 일관된 내부 레이아웃 구조로 윗단/아랫단 완전 대칭 정렬 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
          <Link to="/community" className="block">
            <div className="bg-white rounded-xl p-5 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-[130px] lg:h-[150px] flex flex-col justify-between">
              <div>
                <Users className="w-8 h-8 lg:w-10 lg:h-10 text-orange-500 mb-2" />
                <h3 className="font-semibold text-gray-800 text-sm lg:text-base">커뮤니티</h3>
              </div>
              <p className="text-xs text-gray-500">레시피 공유</p>
            </div>
          </Link>

          <Link to="/trade" className="block">
            <div className="bg-white rounded-xl p-5 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-[130px] lg:h-[150px] flex flex-col justify-between">
              <div>
                <ShoppingCart className="w-8 h-8 lg:w-10 lg:h-10 text-orange-500 mb-2" />
                <h3 className="font-semibold text-gray-800 text-sm lg:text-base">식재료 거래</h3>
              </div>
              <p className="text-xs text-gray-500">남은 재료 나눔</p>
            </div>
          </Link>

          <Link to="/chats" className="lg:block hidden">
            <div className="bg-white rounded-xl p-5 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-[150px] flex flex-col justify-between">
              <div>
                <Users className="w-8 h-8 lg:w-10 lg:h-10 text-orange-500 mb-2" />
                <h3 className="font-semibold text-gray-800 text-sm lg:text-base">채팅</h3>
              </div>
              <p className="text-xs text-gray-500">거래 문의</p>
            </div>
          </Link>

          <Link to="/saved-recipes" className="lg:block hidden">
            <div className="bg-white rounded-xl p-5 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-[150px] flex flex-col justify-between">
              <div>
                <Bot className="w-8 h-8 lg:w-10 lg:h-10 text-orange-500 mb-2" />
                <h3 className="font-semibold text-gray-800 text-sm lg:text-base">저장 레시피</h3>
              </div>
              <p className="text-xs text-gray-500">내 레시피 모음</p>
            </div>
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* 인기 레시피 섹션 (DB 연동) */}
          <section className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                인기 레시피
              </h3>
              <Link
                to="/community"
                className="text-sm text-orange-500 font-medium"
              >
                전체보기
              </Link>
            </div>
            <div className="space-y-3">
              {loading
                ? [1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-24 bg-gray-100 animate-pulse rounded-lg"
                    />
                  ))
                : recipes.map((recipe) => (
                    <Link
                      key={recipe.id}
                      to={`/community/${recipe.id}`}
                      className="block"
                    >
                      <div className="flex gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0">
                          <img
                            src={
                              recipe.image_url ||
                              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop"
                            }
                            alt={recipe.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 truncate">
                            {recipe.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            익명 요리사
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(recipe.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
            </div>
          </section>

          {/* 최근 거래 (DB 연동) */}
          <section className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                <ShoppingCart className="w-5 h-5 text-orange-500" />
                최근 거래
              </h3>
              <Link to="/trade" className="text-sm text-orange-500 font-medium">
                전체보기
              </Link>
            </div>
            <div className="grid grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {loading
                ? [1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="aspect-square bg-gray-100 animate-pulse rounded-lg"
                    />
                  ))
                : trades.map((item) => (
                    /* 중요: 라우터 설정에 맞춰 trades/:id 로 연결 */
                    <Link
                      key={item.id}
                      to={`/trades/${item.id}`}
                      className="block h-full"
                    >
                      <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer h-full">
                        <div className="w-full aspect-square bg-gray-200 rounded-lg mb-2">
                          <img
                            src={
                              item.image_url ||
                              "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop"
                            }
                            alt={item.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-orange-500 font-bold mt-1">
                          {item.price === 0
                            ? "무료나눔"
                            : `${item.price?.toLocaleString()}원`}
                        </p>
                      </div>
                    </Link>
                  ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
