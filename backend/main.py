import os
import json
import re
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import google.generativeai as genai
from dotenv import load_dotenv
# ✅ Supabase 라이브러리 임포트
from supabase import create_client, Client

# 환경변수 로드
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

# Render 및 로컬 환경변수 가져오기
GEMINI_KEY = os.environ.get("GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_ANON_KEY")

app = FastAPI()

# AWS S3 및 CloudFront, 로컬 오리진 허용
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://foodket-web-bucket.s3-website.us-east-2.amazonaws.com",
    "https://foodket-web-bucket.s3-website.us-east-2.amazonaws.com",
    "https://foodket-coral.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"], 
    allow_credentials=True,                      
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Supabase 클라이언트 초기화 (환경변수가 있을 때만 인스턴스 생성)
supabase: Client = None
if SUPABASE_URL and SUPABASE_ANON_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Render 헬스체크용 루트 경로
@app.get("/")
async def root():
    return {"message": "Foodket Backend is Running!"}

# --- Pydantic 스키마 정의 ---
class RecipeRequest(BaseModel):
    ingredients: List[str]
    user_id: str

class RecipeSaveRequest(BaseModel):
    user_id: str
    recipe: Dict[str, Any]


# --- API 엔드포인트 ---

# 🌟 [주소 교정] 프론트엔드가 /api를 붙여서 쏘므로, 여기서는 중복되지 않게 /ai/recommend로 매핑합니다.
@app.post("/api/ai/recommend")
async def recommend_recipe(request: RecipeRequest):
    if not GEMINI_KEY:
        raise HTTPException(status_code=500, detail="API Key Missing")

    genai.configure(api_key=GEMINI_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    try:
        ingredients_str = ", ".join(request.ingredients)
        # Gemini가 뱉는 JSON Key 규격을 프론트엔드가 파싱하기 좋게 title->name 등으로 최적화 프롬프트 수정
        prompt = (
            f"재료: {ingredients_str}. 요리 1개를 추천해줘.\n"
            "반드시 JSON 형식으로만 응답해야 해. Markdown 기호(```json) 쓰지 말고 순수 텍스트로만 줘.\n"
            "형식: {\"name\": \"요리명\", \"difficulty\": \"상/중/하\", \"time\": \"소요시간\", \"servings\": \"인분\", \"ingredients\": [\"재료\"], \"steps\": [\"조리순서\"]}"
        )
        
        response = model.generate_content(prompt)
        if response and response.text:
            raw_text = response.text.strip()
            # 혹시 모를 마크다운 기호 제거 방어 로직
            raw_text = raw_text.replace("```json", "").replace("```", "").strip()
            
            json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)
            recipe_data = json.loads(json_match.group(0)) if json_match else json.loads(raw_text)
            
            # 프론트엔드가 읽어가는 포맷 규격 매핑 보정
            return {
                "status": "success", 
                "recipe": {
                    "id": recipe_data.get("name"),
                    "name": recipe_data.get("name"),
                    "difficulty": recipe_data.get("difficulty", "중"),
                    "time": recipe_data.get("time", "20분"),
                    "servings": recipe_data.get("servings", "1인분"),
                    "ingredients": recipe_data.get("ingredients", []),
                    "steps": recipe_data.get("steps", [])
                }
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 🌟 [주소 교정] 서버 저장 라우터 주소 매핑 보정
@app.post("/api/recipe/save")
async def save_recipe(request: RecipeSaveRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase Credentials Missing")
    
    try:
        print(f"🚀 [레시피 저장 요청] User ID: {request.user_id}, 요리명: {request.recipe.get('name')}")
        
        data, count = supabase.table("ai_recipes").insert({
            "user_id": request.user_id,
            "recipe_id": request.recipe.get("id"),
            "name": request.recipe.get("name"),
            "difficulty": request.recipe.get("difficulty"),
            "time": request.recipe.get("time"),
            "servings": request.recipe.get("servings"),
            "ingredients": request.recipe.get("ingredients"),
            "steps": request.recipe.get("steps"),
            "user_choices": request.recipe.get("userChoices"),
            "saved_at": request.recipe.get("savedAt")
        }).execute()
        
        return {"status": "success", "message": "Recipe successfully saved to server!"}
        
    except Exception as e:
        print("❌ Server Save Error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)