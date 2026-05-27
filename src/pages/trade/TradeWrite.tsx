import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Camera, X } from "lucide-react";
import { supabase } from "../../utils/supabaseClient";

export default function TradeWrite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // URL에서 type 가져오기 (trade 또는 community)
  const postType =
    searchParams.get("type") === "community" ? "community" : "trade";

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    content: "",
    location: "구미시 신평동",
    image_url: "",
  });

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("로그인이 필요한 서비스입니다.");
        navigate("/login");
        return;
      }
      setUserId(user.id);
    };
    checkUser();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    // 폼 기본 제출 동작 및 버블링 확실하게 차단
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // 변수에 한 번 더 안전하게 옮겨 담아서 null 방어
    const submitTitle = formData.title ? formData.title.trim() : "";
    const submitContent = formData.content ? formData.content.trim() : "";

    if (!submitTitle || !submitContent) {
      return alert("제목과 내용을 모두 입력해주세요.");
    }

    if (!userId) {
      return alert("유저 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
    }

    setLoading(true);
    try {
      // 💡 insert 내부에 객체를 직접 명시해서 'title' 누락을 원천 봉쇄합니다.
      const insertData = {
        user_id: userId,
        title: submitTitle,              // ❌ 절대 null이 될 수 없음
        item_name: postType === "trade" ? submitTitle : "커뮤니티",
        content: submitContent,
        description: submitContent,
        price: postType === "trade" ? Number(formData.price) || 0 : 0,
        location: formData.location,
        image_url: formData.image_url || null,
        type: postType,
        status: postType === "trade" ? "available" : "active",
      };

      console.log("Supabase로 날아가는 최종 데이터 세트:", insertData);

      const { error } = await supabase.from("trades").insert(insertData);

      if (error) throw error;

      alert(
        `${postType === "trade" ? "거래" : "커뮤니티"} 게시글이 등록되었습니다!`,
      );
      navigate(postType === "trade" ? "/trade" : "/community");
    } catch (err: any) {
      console.error("등록 에러 상세:", err);
      alert("등록 실패: " + (err.message || "알 수 없는 오류"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* 💡 form 태그를 상위로 올려서 헤더와 본문을 모두 감싸게 만들었습니다. */}
      {/* 이렇게 해야 헤더의 [완료] 버튼이 form의 submit 역할을 완벽하게 수행합니다. */}
      <form onSubmit={handleSubmit} className="h-full">
        <header className="fixed top-0 left-0 right-0 bg-white border-b z-50 px-4 py-3 flex items-center justify-between">
          <button type="button" onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg">
            {postType === "trade" ? "내 물건 팔기" : "커뮤니티 글쓰기"}
          </h1>
          {/* type="submit"으로 변경하여 onClick 이벤트 꼬임 방지 */}
          <button
            type="submit"
            disabled={loading}
            className={`font-bold ${loading ? "text-gray-400" : "text-orange-500"}`}
          >
            {loading ? "등록 중..." : "완료"}
          </button>
        </header>

        <div className="mt-16 p-4 space-y-6">
          {/* 이미지 업로드 가이드 */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            <div className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 flex-shrink-0 cursor-pointer hover:bg-gray-50">
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-[10px]">사진 추가</span>
            </div>
            {formData.image_url && (
              <div className="relative w-24 h-24 flex-shrink-0">
                <img
                  src={formData.image_url}
                  className="w-full h-full object-cover rounded-xl"
                  alt="preview"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, image_url: "" })}
                  className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-1 shadow-md"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* 제목 입력 */}
          <div>
            <input
              type="text"
              placeholder={
                postType === "trade" ? "글 제목" : "커뮤니티 제목을 입력하세요"
              }
              className="w-full text-lg font-medium border-b border-gray-100 py-3 focus:outline-none focus:border-orange-500"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          {/* 가격 입력 (거래일 때만) */}
          {postType === "trade" && (
            <div className="flex items-center gap-2 border-b border-gray-100 py-3">
              <span className="text-gray-400">₩</span>
              <input
                type="number"
                placeholder="가격을 입력해주세요 (0원 입력 시 나눔)"
                className="w-full focus:outline-none focus:border-orange-500"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />
            </div>
          )}

          {/* 설명 입력 */}
          <div>
            <textarea
              placeholder={
                postType === "trade"
                  ? "구매 시기, 브랜드 등 상세 정보를 작성해주세요."
                  : "공유하고 싶은 내용을 자유롭게 작성해주세요!"
              }
              className="w-full h-64 resize-none focus:outline-none text-gray-800 leading-relaxed"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
            />
          </div>

          {postType === "trade" && (
            <div className="bg-gray-50 p-4 rounded-xl flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                거래 희망 장소
              </span>
              <span className="text-sm text-gray-500">{formData.location}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
